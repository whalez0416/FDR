const fetch = require('node-fetch');

async function list() {
  try {
    const res = await fetch('http://localhost:3000/api/admin/data');
    const data = await res.json();
    
    console.log("=== 현재 URL이 등록된 지점 목록 ===");
    (data.malls || []).forEach(m => {
      if (m.source_url) {
        console.log(`- ${m.name}: ${m.source_url}`);
      }
    });
  } catch(e) {
    console.error("Error fetching data:", e.message);
  }
}

list();
