const fs = require('fs');

async function testAjax() {
  const storeCd = 'SC00006';
  // Parse sequence number from SC00006 -> 6
  const storeSeq = parseInt(storeCd.replace('SC', ''), 10).toString();
  
  // Try fetching with empty schCategCd first to see if it returns all categories
  const url = `https://www.shinsegae.com/store/ajaxRestaurantData.do?storeSeq=${storeSeq}&storeCd=${storeCd}&schCategCd=`;
  console.log('Fetching AJAX URL:', url);
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html, */*',
        'Referer': `https://www.shinsegae.com/store/restaurant.do?storeCd=${storeCd}`
      }
    });
    
    const html = await res.text();
    console.log('AJAX Response length:', html.length);
    fs.writeFileSync('scratch/shinsegae-ajax-response.html', html);
    console.log('Saved response to scratch/shinsegae-ajax-response.html');
  } catch (err) {
    console.error(err);
  }
}

testAjax();
