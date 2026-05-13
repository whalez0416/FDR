$dataFile = "live_data.json"
$outputDir = "data\restaurants"

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir
}

$rawData = Get-Content -Raw -Path $dataFile | ConvertFrom-Json
$malls = $rawData.malls
$restaurants = $rawData.restaurants

$mallNameMap = @{
    "더현대 대구" = "daegu"
    "더현대 서울" = "the-hyundai-seoul"
    "디큐브시티" = "dcubecity"
    "목동점" = "mokdong"
    "무역센터점" = "trade-center"
    "미아점" = "mia"
    "신촌점" = "sinchon"
    "압구정본점" = "apgujeong"
    "울산점" = "ulsan"
    "중동점" = "jungdong"
    "천호점" = "cheonho"
    "충청점" = "chungcheong"
    "커넥트현대 부산" = "busan-connect"
    "킨텍스점" = "kintex"
    "판교점" = "pangyo"
    "현대백화점 판교점" = "pangyo-hyundai"
    "현대프리미엄아울렛 SPACE 1" = "outlet-space1"
    "현대프리미엄아울렛 김포점" = "outlet-gimpo"
    "현대프리미엄아울렛 대전점" = "outlet-daejeon"
    "현대프리미엄아울렛 송도점" = "outlet-songdo"
}

foreach ($mall in $malls) {
    $filename = $mallNameMap[$mall.name]
    if ($null -eq $filename) {
        $filename = $mall.name -replace '\s+', '-' -replace '[^a-zA-Z0-9-]', ''
        $filename = $filename.ToLower()
    }
    
    $mallRestaurants = $restaurants | Where-Object { $_.mall_id -eq $mall.id }
    
    $output = @{
        mall = @{
            id = $mall.id
            name = $mall.name
            city = $mall.city
            district = $mall.district
        }
        restaurants = @()
    }
    
    foreach ($r in $mallRestaurants) {
        $output.restaurants += @{
            id = $r.id
            name = $r.name
            category = $r.category
            floor = $r.floor
            stroller_accessible = $r.stroller_accessible
            highchair_available = $r.highchair_available
            nursing_room_distance = $r.nursing_room_distance
            status = $r.status
            description = $r.description
        }
    }
    
    $json = $output | ConvertTo-Json -Depth 10
    $outputPath = Join-Path $outputDir "$filename.json"
    $json | Out-File -FilePath $outputPath -Encoding utf8
    Write-Host "Created $filename.json for $($mall.name)"
}
