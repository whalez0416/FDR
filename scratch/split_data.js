const fs = require('fs');
const path = require('path');

const dataFile = 'live_data.json';
const outputDir = path.join('data', 'restaurants');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const rawData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
const malls = rawData.malls;
const restaurants = rawData.restaurants;

// Map to store filename mapping
const mallNameMap = {
    "더현대 대구": "daegu",
    "더현대 서울": "the-hyundai-seoul",
    "디큐브시티": "dcubecity",
    "목동점": "mokdong",
    "무역센터점": "trade-center",
    "미아점": "mia",
    "신촌점": "sinchon",
    "압구정본점": "apgujeong",
    "울산점": "ulsan",
    "중동점": "jungdong",
    "천호점": "cheonho",
    "충청점": "chungcheong",
    "커넥트현대 부산": "busan-connect",
    "킨텍스점": "kintex",
    "판교점": "pangyo",
    "현대백화점 판교점": "pangyo-hyundai",
    "현대프리미엄아울렛 SPACE 1": "outlet-space1",
    "현대프리미엄아울렛 김포점": "outlet-gimpo",
    "현대프리미엄아울렛 대전점": "outlet-daejeon",
    "현대프리미엄아울렛 송도점": "outlet-songdo"
};

malls.forEach(mall => {
    const filename = mallNameMap[mall.name] || mall.name.replace(/\s+/g, '-').toLowerCase();
    const mallRestaurants = restaurants.filter(r => r.mall_id === mall.id);
    
    const output = {
        mall: {
            id: mall.id,
            name: mall.name,
            city: mall.city,
            district: mall.district
        },
        restaurants: mallRestaurants.map(r => ({
            id: r.id,
            name: r.name,
            category: r.category,
            floor: r.floor,
            stroller_accessible: r.stroller_accessible,
            highchair_available: r.highchair_available,
            nursing_room_distance: r.nursing_room_distance,
            status: r.status,
            description: r.description
        }))
    };
    
    fs.writeFileSync(path.join(outputDir, `${filename}.json`), JSON.stringify(output, null, 2));
    console.log(`Created ${filename}.json for ${mall.name}`);
});
