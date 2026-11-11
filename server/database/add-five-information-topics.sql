-- เพิ่ม 5 หัวข้อสารสนเทศที่ผ่านการพิจารณาแล้ว
-- ไฟล์นี้นำเข้าซ้ำได้โดยไม่สร้างหัวข้อซ้ำ

SET NAMES utf8mb4;
START TRANSACTION;

-- บทที่ 6 ฝ่ายบริหารวิชาการ
INSERT INTO topics
  (department_id, chapter, title, kind, frequency, columns_json, chart_json, sort_order)
SELECT
  1,
  6,
  'โครงสร้างหลักสูตรสถานศึกษาระดับมัธยมศึกษาตอนต้นและตอนปลาย',
  'table',
  'year',
  '[{"key":"c1","label":"ระดับการศึกษา","type":"text"},{"key":"c2","label":"หมวดวิชาหรือกลุ่มสาระการเรียนรู้","type":"text"},{"key":"c3","label":"หน่วยกิต","type":"number"},{"key":"c4","label":"ชั่วโมงเรียน","type":"number"},{"key":"c5","label":"รายละเอียดหรือหมายเหตุ","type":"text"}]',
  NULL,
  53
WHERE NOT EXISTS (
  SELECT 1 FROM topics
  WHERE title = 'โครงสร้างหลักสูตรสถานศึกษาระดับมัธยมศึกษาตอนต้นและตอนปลาย'
);

INSERT INTO topics
  (department_id, chapter, title, kind, frequency, columns_json, chart_json, sort_order)
SELECT
  1,
  6,
  'งานวิจัยในชั้นเรียน',
  'table',
  'year',
  '[{"key":"c1","label":"กลุ่มสาระการเรียนรู้","type":"text"},{"key":"c2","label":"จำนวนงานวิจัย","type":"number","total":true},{"key":"c3","label":"จำนวนครูผู้จัดทำ","type":"number","total":true},{"key":"c4","label":"ตัวอย่างหัวข้อหรือรายละเอียด","type":"text"}]',
  '{"type":"bar","series":["c2","c3"],"trend":false}',
  54
WHERE NOT EXISTS (
  SELECT 1 FROM topics WHERE title = 'งานวิจัยในชั้นเรียน'
);

-- บทที่ 9 ฝ่ายบริหารวิชาการ
INSERT INTO topics
  (department_id, chapter, title, kind, frequency, columns_json, chart_json, sort_order)
SELECT
  1,
  9,
  'ผลการเข้าศึกษาต่อของนักเรียนชั้นมัธยมศึกษาปีที่ 6 แยกตามระบบ TCAS',
  'table',
  'year',
  '[{"key":"c1","label":"รอบหรือระบบการรับ","type":"text"},{"key":"c2","label":"จำนวนผู้ผ่านการคัดเลือก","type":"number","total":true},{"key":"c3","label":"ร้อยละ","type":"number"},{"key":"c4","label":"รายละเอียดหรือหมายเหตุ","type":"text"}]',
  '{"type":"bar","series":["c2"],"trend":false}',
  77
WHERE NOT EXISTS (
  SELECT 1 FROM topics
  WHERE title = 'ผลการเข้าศึกษาต่อของนักเรียนชั้นมัธยมศึกษาปีที่ 6 แยกตามระบบ TCAS'
);

-- บทที่ 5 ฝ่ายบริหารทั่วไป
INSERT INTO topics
  (department_id, chapter, title, kind, frequency, columns_json, chart_json, sort_order)
SELECT
  4,
  5,
  'ทุนการศึกษา',
  'table',
  'year',
  '[{"key":"c1","label":"ประเภทหรือแหล่งทุน","type":"text"},{"key":"c2","label":"จำนวนทุน","type":"number","total":true},{"key":"c3","label":"จำนวนนักเรียนที่ได้รับทุน","type":"number","total":true},{"key":"c4","label":"มูลค่ารวม (บาท)","type":"number","total":true},{"key":"c5","label":"รายละเอียดหรือหมายเหตุ","type":"text"}]',
  '{"type":"bar","series":["c3"],"trend":false}',
  45
WHERE NOT EXISTS (
  SELECT 1 FROM topics WHERE title = 'ทุนการศึกษา'
);

-- บทที่ 3 ฝ่ายบริหารทั่วไป
INSERT INTO topics
  (department_id, chapter, title, kind, frequency, columns_json, chart_json, sort_order)
SELECT
  4,
  3,
  'ระบบบริหารจัดการดิจิทัลของโรงเรียน',
  'table',
  'year',
  '[{"key":"c1","label":"ชื่อระบบหรือบริการ","type":"text"},{"key":"c2","label":"วัตถุประสงค์หรือการใช้งาน","type":"text"},{"key":"c3","label":"ฝ่ายที่รับผิดชอบ","type":"text"},{"key":"c4","label":"กลุ่มผู้ใช้งาน","type":"text"},{"key":"c5","label":"สถานะการใช้งาน","type":"text"}]',
  NULL,
  23
WHERE NOT EXISTS (
  SELECT 1 FROM topics WHERE title = 'ระบบบริหารจัดการดิจิทัลของโรงเรียน'
);

COMMIT;

