const fs = require('fs');

async function viewDetails() {
  const url = 'https://www.shinsegae.com/store/restaurant.do?storeCd=SC00006';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      }
    });
    const html = await res.text();
    
    const index = html.indexOf('/store/ajaxRestaurantData.do');
    if (index === -1) {
      console.log('Not found');
      return;
    }
    
    // Print 1000 characters before and after the endpoint to see the ajax call
    const start = Math.max(0, index - 800);
    const end = Math.min(html.length, index + 1200);
    console.log('Surrounding code:\n', html.substring(start, end));
  } catch (err) {
    console.error(err);
  }
}

viewDetails();
