const fs = require('fs');

async function findAjax() {
  const url = 'https://www.shinsegae.com/store/restaurant.do?storeCd=SC00006';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      }
    });
    const html = await res.text();
    
    // Find all occurrences of URL patterns ending in .do
    const regex = /url\s*:\s*['"](.*?)['"]/g;
    let match;
    const urls = [];
    while ((match = regex.exec(html)) !== null) {
      urls.push(match[1]);
    }
    
    // Also find any fetch or axios URLs
    const axiosRegex = /axios\s*\.\s*\w+\s*\(\s*['"](.*?)['"]/g;
    while ((match = axiosRegex.exec(html)) !== null) {
      urls.push(match[1]);
    }

    const fetchRegex = /fetch\s*\(\s*['"](.*?)['"]/g;
    while ((match = fetchRegex.exec(html)) !== null) {
      urls.push(match[1]);
    }

    console.log('Found URLs in script:', [...new Set(urls)]);
  } catch (err) {
    console.error(err);
  }
}

findAjax();
