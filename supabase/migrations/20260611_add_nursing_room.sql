-- 수유실(유아휴게실) 전용 컬럼 추가
-- 기존에는 malls.district 한 칸에 "위치(성남시 분당구)"와 "수유실(5층 유아휴게실)"이
-- 뒤섞여 있었음. 수유실 정보를 위한 전용 칸을 분리한다.
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → 아래 한 줄 붙여넣고 Run.
-- (IF NOT EXISTS 라서 여러 번 실행해도 안전함)

ALTER TABLE malls ADD COLUMN IF NOT EXISTS nursing_room text;
