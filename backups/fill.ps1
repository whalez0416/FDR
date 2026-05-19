$data = Get-Content -Raw -Path "live_data.json" | ConvertFrom-Json
$restaurants = $data.restaurants

$floorMap = @{
    "H541 현대백화점판교점" = @{ floor="9F"; stroller=$true; highchair=$true }
    "js가든 현대백화점판교점" = @{ floor="9F"; stroller=$true; highchair=$true }
    "고디바 베이커리 현대백화점판교점" = @{ floor="B1"; stroller=$true; highchair=$false }
    "까누누레 현대백화점판교점" = @{ floor="B1"; stroller=$true; highchair=$false }
    "더커피 현대백화점판교점" = @{ floor="9F"; stroller=$true; highchair=$true }
    "더키친 일뽀르노 현대백화점판교점" = @{ floor="9F"; stroller=$true; highchair=$true }
    "도조커피 현대백화점판교점" = @{ floor="5F"; stroller=$true; highchair=$false }
    "디어스윗랩 현대백화점판교점" = @{ floor="B1"; stroller=$true; highchair=$false }
    "마이알레" = @{ floor="5F"; stroller=$true; highchair=$true }
    "마츠노하나 현대백화점판교점" = @{ floor="9F"; stroller=$true; highchair=$true }
    "매트블랙" = @{ floor="4F"; stroller=$true; highchair=$false }
    "몽촌닭갈비 현대백화점판교점" = @{ floor="B1"; stroller=$true; highchair=$true }
    "베즐리" = @{ floor="B1"; stroller=$true; highchair=$false }
    "블루보틀 판교현대카페" = @{ floor="1F"; stroller=$true; highchair=$false }
    "소하고택 현대백화점판교점" = @{ floor="9F"; stroller=$true; highchair=$false }
    "신승반점 현대백화점판교점" = @{ floor="B1"; stroller=$true; highchair=$true }
    "오크베리 현대백화점판교점" = @{ floor="B1"; stroller=$true; highchair=$false }
    "올댓커피" = @{ floor="B1"; stroller=$true; highchair=$false }
    "이즈미 현대백화점판교점" = @{ floor="9F"; stroller=$true; highchair=$true }
    "이타마에 스시 현대백화점판교점" = @{ floor="B1"; stroller=$true; highchair=$true }
    "이탈리 판교점" = @{ floor="B1"; stroller=$true; highchair=$true }
    "이터스 현대백화점판교점" = @{ floor="B1"; stroller=$true; highchair=$true }
    "정돈 현대백화점판교점" = @{ floor="9F"; stroller=$true; highchair=$true }
    "정인면옥 현대백화점판교점" = @{ floor="9F"; stroller=$true; highchair=$true }
    "조앤더주스 현대백화점판교점" = @{ floor="B1"; stroller=$true; highchair=$false }
    "카페하이웨스트 판교점" = @{ floor="B1"; stroller=$true; highchair=$false }
    "한솔냉면&국시 현대백화점판교점" = @{ floor="B1"; stroller=$true; highchair=$true }
    "텍사스로드하우스 현대백화점판교점" = @{ floor="B1"; stroller=$true; highchair=$true }
    "하트티라미수 현대백화점판교점" = @{ floor="B1"; stroller=$true; highchair=$false }
    "카페키츠네" = @{ floor="3F"; stroller=$true; highchair=$false }

    "더 이탈리안클럽 현대백화점무역센터점" = @{ floor="10F"; stroller=$true; highchair=$true }
    "더라멘워 현대백화점무역센터점" = @{ floor="B1"; stroller=$true; highchair=$true }
    "더크다이브 현대백화점무역센터점" = @{ floor="B1"; stroller=$true; highchair=$true }
    "삼성혈해물탕 현대백화점 더현대서울점" = @{ floor="B1"; stroller=$true; highchair=$true }
    "우나하우스 더현대서울" = @{ floor="B1"; stroller=$true; highchair=$true }
    "현대그린푸드 현대백화점 더현대서울점" = @{ floor="B1"; stroller=$true; highchair=$true }

    "도원스타일 현대백화점압구정본점" = @{ floor="5F"; stroller=$true; highchair=$true }
    "루엘드파리 현대백화점압구정본점" = @{ floor="B1"; stroller=$true; highchair=$false }
    "멜로드도산 현대백화점압구정본점" = @{ floor="B1"; stroller=$true; highchair=$false }
    "밀도 현대백화점압구정본점" = @{ floor="B1"; stroller=$true; highchair=$false }
    "베이글리스트" = @{ floor="B1"; stroller=$true; highchair=$false }
    "베이크 현대백화점압구정본점" = @{ floor="B1"; stroller=$true; highchair=$false }
    "본가스시" = @{ floor="B1"; stroller=$true; highchair=$true }
    "샤브카덴" = @{ floor="5F"; stroller=$true; highchair=$true }
    "아뜰리에 드 쟈스민 현대백화점압구정본점" = @{ floor="B1"; stroller=$true; highchair=$false }
    "이즈미 현대백화점압구정본점" = @{ floor="5F"; stroller=$true; highchair=$true }
    "정담반" = @{ floor="B1"; stroller=$true; highchair=$true }
    "카페 슬론스 현대백화점압구정본점" = @{ floor="B1"; stroller=$true; highchair=$false }
    "크리스탈제이드 압구정본점" = @{ floor="5F"; stroller=$true; highchair=$true }
    "퍼부어 압구정점" = @{ floor="B1"; stroller=$true; highchair=$true }
    "한솔냉면 현대백화점압구정본점" = @{ floor="B1"; stroller=$true; highchair=$true }
    "현대그린푸드 현대백화점본점" = @{ floor="B1"; stroller=$true; highchair=$true }
    "효미역 현대백화점압구정본점" = @{ floor="5F"; stroller=$true; highchair=$true }
}

foreach ($rest in $restaurants) {
    if ($floorMap.ContainsKey($rest.name)) {
        $info = $floorMap[$rest.name]
        
        $bodyObj = @{
            id = $rest.id
            updates = @{
                floor = $info.floor
                stroller_accessible = $info.stroller
                highchair_available = $info.highchair
            }
        }
        $body = $bodyObj | ConvertTo-Json -Depth 5 -Compress
        
        Invoke-RestMethod -Uri "https://fdr-zeta.vercel.app/api/admin/data" -Method Patch -Body $body -ContentType "application/json" | Out-Null
        Write-Host "Updated $($rest.name) -> Floor: $($info.floor)"
    }
}
Write-Host "Done!"
