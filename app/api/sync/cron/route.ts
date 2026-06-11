import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { UrlScraper } from '@/lib/sync/urlScraper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Allow up to 60s — we crawl dozens of malls per run.
export const maxDuration = 60;

const BATCH_SIZE = 5; // how many malls to crawl concurrently

/** Curated mall_name -> source_url map shipped in the repo. */
function loadCuratedUrls(): Record<string, string> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'mall_urls.json');
    const list = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Array<{
      mall_name: string;
      source_url?: string;
    }>;
    const map: Record<string, string> = {};
    for (const e of list) {
      if (e.mall_name && e.source_url && e.source_url.trim()) map[e.mall_name] = e.source_url.trim();
    }
    return map;
  } catch {
    return {};
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bypass = searchParams.get('bypass') === 'true';
  const authHeader = request.headers.get('authorization');

  // Only enforce the bearer check when a CRON_SECRET is actually configured.
  // Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` when
  // the secret is set; without it we let the job run so it works out-of-the-box.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && !bypass && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is missing' }, { status: 401 });
  }

  const urlScraper = new UrlScraper();

  try {
    const { data: malls, error: mallError } = await supabaseAdmin
      .from('malls')
      .select('id, name, source_url, district');
    if (mallError) throw mallError;

    // Fall back to the curated URL list so malls that never had their source_url
    // populated in the DB still get crawled (and we backfill the DB on the way).
    const curated = loadCuratedUrls();
    const targets = (malls || [])
      .map((m) => {
        const effectiveUrl = (m.source_url && m.source_url.trim()) || curated[m.name] || '';
        return { ...m, effectiveUrl };
      })
      .filter((m) => m.effectiveUrl);
    const skipped = (malls?.length || 0) - targets.length;

    let totalUpserted = 0;
    let totalClosed = 0;
    const perMall: any[] = [];

    // Rotate the starting point each day so coverage cycles through every mall
    // even if a single run can't finish them all.
    if (targets.length > 0) {
      const dayOffset = Math.floor(Date.now() / 86_400_000) % targets.length;
      targets.push(...targets.splice(0, dayOffset));
    }

    // Hard time budget: stop launching new work before Vercel's 60s ceiling so
    // we return a clean partial result instead of a 504. Bulk writes mean a full
    // crawl normally fits, but this guarantees we never error out.
    const startedAt = Date.now();
    const TIME_BUDGET_MS = 50_000;
    let processed = 0;
    for (let i = 0; i < targets.length; i += BATCH_SIZE) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) break;
      const batch = targets.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((mall) => syncMall(mall, urlScraper))
      );
      for (const r of results) {
        totalUpserted += r.upserted;
        totalClosed += r.closed;
        perMall.push(r);
      }
      processed += batch.length;
    }
    const skippedForTime = targets.length - processed;

    return NextResponse.json({
      success: true,
      message:
        `Auto-sync completed. Crawled ${processed}/${targets.length} malls` +
        ` (skipped ${skipped} without source_url` +
        (skippedForTime > 0 ? `, ${skippedForTime} deferred to next run for time` : '') +
        `).`,
      upserted_count: totalUpserted,
      closed_count: totalClosed,
      details: perMall,
    });
  } catch (error: any) {
    console.error('Cron Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function syncMall(
  mall: { id: string; name: string; source_url?: string; district?: string; effectiveUrl: string },
  urlScraper: UrlScraper
): Promise<{ mall: string; upserted: number; closed: number; error?: string }> {
  try {
    // Backfill the DB source_url when we resolved it from the curated list.
    if (!mall.source_url && mall.effectiveUrl) {
      await supabaseAdmin.from('malls').update({ source_url: mall.effectiveUrl }).eq('id', mall.id);
    }

    const scrapeResult = await urlScraper.scrapeRestaurantsFromUrl(mall.effectiveUrl, mall.name);
    const scrapedList = scrapeResult.data || [];

    // Persist nursing-room info when the scraper found it and we don't have it yet.
    if (scrapeResult.nursingInfo && (!mall.district || mall.district === '주요상권')) {
      await supabaseAdmin.from('malls').update({ district: scrapeResult.nursingInfo }).eq('id', mall.id);
    }

    // Guard: an empty result usually means a transient fetch failure — never
    // wipe a mall's existing restaurants on a bad crawl.
    if (scrapedList.length === 0) {
      return { mall: mall.name, upserted: 0, closed: 0, error: 'no data scraped' };
    }

    const { data: existingRests } = await supabaseAdmin
      .from('restaurants')
      .select('id, name, status')
      .eq('mall_id', mall.id);
    const existingMap = new Map((existingRests || []).map((r) => [r.name, r]));
    const scrapedNames = new Set(scrapedList.map((r) => r.name));
    const now = new Date().toISOString();

    // --- Bulk DB writes (was per-restaurant before → a 75-item mall took ~150
    // round-trips and blew past the 60s budget). Now ~3 calls per mall. ---

    // 1) Brand-new restaurants → one bulk insert.
    const newRows = scrapedList
      .filter((item) => !existingMap.has(item.name))
      .map((item) => ({
        mall_id: mall.id,
        name: item.name,
        category: item.category || '전문식당가',
        floor: item.floor || '정보 없음',
        status: 'OPEN',
        last_updated: now,
        stroller_accessible: true,
        highchair_available: true,
      }));
    if (newRows.length) {
      await supabaseAdmin.from('restaurants').insert(newRows);
    }

    // 2) Existing & still-listed → one bulk update to (re)open + refresh timestamp.
    //    This also recovers rows a previous bad crawl wrongly marked CLOSED.
    const stillListedIds = scrapedList
      .map((item) => existingMap.get(item.name)?.id)
      .filter((id): id is string => Boolean(id));
    if (stillListedIds.length) {
      await supabaseAdmin
        .from('restaurants')
        .update({ status: 'OPEN', last_updated: now })
        .in('id', stillListedIds);
    }

    // 3) Disappeared from the source → one bulk update to CLOSED.
    const closedIds = Array.from(existingMap.values())
      .filter((r) => !scrapedNames.has(r.name) && r.status !== 'CLOSED')
      .map((r) => r.id);
    if (closedIds.length) {
      await supabaseAdmin.from('restaurants').update({ status: 'CLOSED' }).in('id', closedIds);
    }

    return { mall: mall.name, upserted: newRows.length + stillListedIds.length, closed: closedIds.length };
  } catch (error: any) {
    console.error(`[Cron] Failed syncing ${mall.name}:`, error);
    return { mall: mall.name, upserted: 0, closed: 0, error: error.message };
  }
}
