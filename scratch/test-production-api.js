// Supabase API test helper
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Low-key standard client initialization
const { createClient: buildClient } = require('@supabase/supabase-js');
const supabase = buildClient(supabaseUrl, supabaseKey);

async function testProductionAPI() {
  console.log('Testing Gwangju Shinsegae scraper end-to-end...');
  
  try {
    // 1. Find the Gwangju Shinsegae Mall
    let { data: mall, error: findError } = await supabase
      .from('malls')
      .select('*')
      .eq('name', '광주신세계')
      .single();
      
    if (findError || !mall) {
      // Try search with partial match
      const { data: list } = await supabase.from('malls').select('*').like('name', '%광주%');
      mall = list?.[0];
    }
    
    if (!mall) {
      console.error('Could not find Gwangju Shinsegae in malls table');
      return;
    }
    
    console.log(`Found mall: ${mall.name} (ID: ${mall.id})`);
    
    // 2. Set the custom URL in the database
    const targetUrl = 'https://www.shinsegae.com/store/restaurant.do?storeCd=SC00006';
    const { error: updateError } = await supabase
      .from('malls')
      .update({ source_url: targetUrl })
      .eq('id', mall.id);
      
    if (updateError) {
      console.error('Failed to update source_url:', updateError);
      return;
    }
    console.log(`Updated source_url to: ${targetUrl}`);

    // 3. Call the live production endpoint
    console.log('Calling live production /api/admin/discover-restaurants endpoint...');
    const apiRes = await fetch('https://fdr-zeta.vercel.app/api/admin/discover-restaurants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mallId: mall.id,
        mallName: mall.name
      })
    });

    const result = await apiRes.json();
    if (result.error) {
      console.error('API Error:', result.error);
      return;
    }

    console.log(`Scrape Successful! Found ${result.restaurants.length} restaurants!`);
    console.log('--- Extracted Restaurants Sample ---');
    result.restaurants.slice(0, 5).forEach((r, idx) => {
      console.log(`${idx + 1}. ${r.name} | Floor: ${r.floor} | Category: ${r.category} | IsNew: ${r.is_new}`);
    });
    console.log('------------------------------------');

  } catch (err) {
    console.error(err);
  }
}

testProductionAPI();
