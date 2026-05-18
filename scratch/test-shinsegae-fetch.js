const { load } = require('cheerio');
const fs = require('fs');

async function testFetch() {
  const url = 'https://www.shinsegae.com/store/restaurant.do?storeCd=SC00006';
  console.log('Fetching:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      }
    });
    const html = await res.text();
    const $ = load(html);
    
    // Mimic UrlScraper logic
    $('script:not([type="application/json"])').remove();
    $('style, svg, img, video, iframe, nav, footer').remove();
    
    const pageContent = $('body').text().replace(/\s+/g, ' ').trim();
    console.log('Cleaned text length:', pageContent.length);
    fs.writeFileSync('scratch/shinsegae-text.txt', pageContent);
    console.log('Wrote body text to scratch/shinsegae-text.txt');
  } catch (err) {
    console.error(err);
  }
}

testFetch();
