try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // Environment variables are already loaded by Vercel CLI or hosting provider
}
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: malls, error: mallError } = await supabase.from('malls').select('id, name, source_url');
  if (mallError) {
    console.error(mallError);
    return;
  }

  console.log("=== 지점별 식당 등록 현황 ===");
  for (const mall of malls) {
    const { count, error } = await supabase
      .from('restaurants')
      .select('id', { count: 'exact', head: true })
      .eq('mall_id', mall.id);
    
    console.log(`- ${mall.name}: ${count}개 (URL: ${mall.source_url || '없음'})`);
  }
}

check();
