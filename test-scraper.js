require('dotenv').config({ path: '.env.local' });
const { load } = require('cheerio');
const { OpenAI } = require('openai');

async function testScrape() {
  const url = 'https://www.ehyundai.com/newPortal/DP/DN/DN000000_V.do?branchCd=B00146000';
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  console.log('Fetching...');
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const html = await res.text();
  
  const $ = load(html);
  $('script:not([type="application/json"])').remove();
  $('style, svg, img, video, iframe, nav, footer').remove();
  let text = $('body').text().replace(/\s+/g, ' ').trim();
  
  console.log('Text length:', text.length);
  if (text.length > 100000) text = text.substring(0, 100000);

  console.log('Asking OpenAI...');
  const prompt = `
You are a highly capable data extraction AI.
I am providing you with the text content of a webpage for a shopping mall named "더현대 대구".
Your task is to find the list of all restaurants, cafes, and food stalls mentioned in this text and extract their names, categories, and floor numbers.

Webpage Text Content:
---
${text}
---

If you find restaurant data, return a JSON object with a "data" array.
Each object in the array should have:
- "name": string
- "category": string (e.g., 카페, 한식, 일식)
- "floor": string (e.g., B1, 1F, 9F)

If no restaurants are found, return {"data": []}.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  console.log(completion.choices[0].message.content);
}

testScrape().catch(console.error);
