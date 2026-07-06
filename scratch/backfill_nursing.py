# One-off: fill malls.nursing_room from the government nursing-room registry
# (sooyusil.com, 인구보건복지협회). Dry-run by default; pass --apply to PATCH prod.
import json, re, ssl, sys, urllib.request

API = 'https://sooyusil.com/home/searchRoomList.do'
ADMIN = 'https://fdr-zeta.vercel.app/api/admin/data'
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE  # ponytail: Windows curl/schannel trust issues, public data only

def post(url, body, method='POST'):
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json'}, method=method)
    return json.load(urllib.request.urlopen(req, context=CTX))

def search_all(keyword):
    out, page = [], 1
    while True:
        rows = post(API, {"searchKeyword": keyword, "roomTypeCode": "",
                          "pageNo": str(page), "mylat": "", "mylng": ""})['nursingRoomSearchList']
        out += rows
        total = rows[0]['totalCount'] if rows else 0
        if page * 10 >= total or not rows:
            return out
        page += 1

def norm(s):
    return re.sub(r'[\s()㈜·\-&]', '', s or '').lower()

# --- build facility pool -----------------------------------------------------
BRAND_QUERIES = ['롯데', '신세계', '현대백화점', '현대시티', 'AK플라자', '갤러리아',
                 '타임스퀘어', '프리미엄아울렛', '아울렛', '타임빌라스', '스타필드']
import os
CACHE = os.path.join(os.path.dirname(__file__), 'pool.json')
if os.path.exists(CACHE):
    pool = json.load(open(CACHE, encoding='utf-8'))
else:
    pool = {}
    for q in BRAND_QUERIES:
        for r in search_all(q):
            pool[r['roomNo']] = r
    pool = list(pool.values())
    json.dump(pool, open(CACHE, 'w', encoding='utf-8'), ensure_ascii=False)
print(f'facility pool: {len(pool)}', file=sys.stderr)

# --- matching ----------------------------------------------------------------
BRANDS = ['롯데', '신세계', '현대', 'ak플라자', '갤러리아', '한화']
BRAND_FAMILY = {'갤러리아': ['갤러리아', '한화'], '신세계': ['신세계'], '롯데': ['롯데'],
                '현대': ['현대'], 'ak플라자': ['ak플라자', 'ak'], '타임스퀘어': ['타임스퀘어', '경방']}

# Manual overrides for registry names that token rules can't reach.
# mall name -> facility roomName prefix(es) after norm().
OVERRIDES = {
    '타임스퀘어 영등포': ['타임스퀘어'],
    '갤러리아 센터시티': ['갤러리아백화점천안점'],   # 센터시티 = 천안 소재
    '충청점': ['현대백화점충청점'],
    '신세계백화점 스타필드 하남점': ['스타필드하남'],
    '롯데몰 광교점': ['롯데아울렛광교점'],           # 등록명이 아울렛
    '롯데아울렛 광주월드컵점': ['롯데아울렛월드컵점'],
}

def mall_rule(name):
    """Return (branch token, own brand, type token) for a mall name."""
    n = norm(name)
    # own brand = the one appearing FIRST in the name ("신세계백화점 타임스퀘어점"
    # is a 신세계 store whose branch happens to be 타임스퀘어)
    found = [(n.find(b), b) for b in ['ak플라자', '갤러리아', '타임스퀘어', '롯데', '신세계', '현대'] if b in n]
    brand = min(found)[1] if found else None
    branch = n
    if brand:  # strip own brand first so sub-brands like 타임스퀘어 survive as branch
        for w in BRAND_FAMILY.get(brand, [brand]):
            branch = branch.replace(w, '')
    for w in ['사이먼', '백화점', '프리미엄아울렛', '아울렛', '팩토리스토어', '스타일마켓',
              '푸드마켓', '시티몰', '시티', '타임빌라스', '피트인', '하우스오브',
              'artscience', '스타필드마켓']:
        branch = branch.replace(w, '')
    branch = re.sub(r'점$', '', branch)
    branch = re.sub(r'^몰|몰$', '', branch)
    # type tokens — at least one must appear in the facility name
    if '팩토리스토어' in n: typ = ['팩토리스토어']
    elif '사이먼' in n: typ = ['사이먼', '아울렛']
    elif '프리미엄아울렛' in n or '아울렛' in n: typ = ['아울렛']
    elif '타임빌라스' in n: typ = ['타임빌라스']
    elif '피트인' in n: typ = ['피트인']
    elif '롯데몰' in n or '시티몰' in n: typ = ['몰']
    elif '백화점' in n: typ = ['백화점']
    else: typ = []
    return branch, brand, typ

def match(mall):
    if mall['name'] in OVERRIDES:
        prefixes = OVERRIDES[mall['name']]
        hits = [f for f in pool if any(norm(f['roomName']).startswith(p) for p in prefixes)]
        return '(override)', '', '', hits
    branch, brand, typ = mall_rule(mall['name'])
    hits = []
    for f in pool:
        fn = norm(f['roomName'])
        if not branch or branch not in fn:
            continue
        if typ and not any(t in fn for t in typ):
            continue
        own = BRAND_FAMILY.get(brand, [brand] if brand else [])
        others = [b for b in BRANDS if b not in own]
        if any(b in fn for b in others):        # conflicting brand → reject
            continue
        if own and not any(b in fn for b in own):
            # facility without our brand name: allow only when branch+type both matched
            if not (branch and typ):
                continue
        hits.append(f)
    return branch, brand, typ, hits

def compose(hits):
    locs = []
    for f in hits:
        loc = (f['location'] or '').strip()
        if '역무실' in loc:  # station facility that shares the mall's name
            continue
        if loc and loc not in locs:
            locs.append(loc)
    return ' / '.join(locs[:3])

raw = json.load(urllib.request.urlopen(ADMIN, context=CTX))
malls = [m for m in raw['malls'] if not (m.get('nursing_room') or '').strip()]
print(f'malls missing nursing_room: {len(malls)}', file=sys.stderr)

# first pass: raw matches per mall
raw_matches = {m['id']: (m, match(m)) for m in malls}

# a facility claimed by several malls belongs to the one with the longest branch
# token (e.g. 부산본점 wins over 본점 for '롯데백화점부산본점')
claims = {}
for m, (branch, brand, typ, hits) in raw_matches.values():
    for f in hits:
        claims.setdefault(f['roomNo'], []).append((len(branch), m['id']))
owner = {rn: max(c)[1] for rn, c in claims.items()}

matched, unmatched = [], []
for m, (branch, brand, typ, hits) in raw_matches.values():
    hits = [f for f in hits if owner[f['roomNo']] == m['id']]
    if hits:
        matched.append((m, hits, compose(hits)))
    else:
        unmatched.append((m['name'], branch, brand, typ))

print('\n=== MATCHED ===')
for m, hits, text in matched:
    names = ', '.join(f['roomName'] for f in hits)
    print(f"{m['name']}  <=  [{names}]\n    -> {text}")
print('\n=== UNMATCHED ===')
for name, branch, brand, typ in unmatched:
    print(f'{name}   (branch={branch!r} brand={brand!r} typ={typ!r})')

if '--apply' in sys.argv:
    ok = fail = 0
    for m, hits, text in matched:
        if not text:
            continue
        r = post(ADMIN, {'id': m['id'], 'type': 'mall', 'updates': {'nursing_room': text}}, method='PATCH')
        ok += 1 if r.get('success') else 0
        fail += 0 if r.get('success') else 1
    print(f'\napplied: {ok} ok, {fail} failed')
