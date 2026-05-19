const fetch = require('node-fetch');

async function run() {
  console.log("Triggering cron job API...");
  try {
    const res = await fetch('http://localhost:3000/api/sync/cron');
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${text}`);
  } catch(e) {
    console.error(e);
  }
}
run();
