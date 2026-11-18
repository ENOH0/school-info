-- ปรับหัวข้อให้ตรงกับสารบัญฉบับใหม่ (16 พฤศจิกายน 2569)
-- รันซ้ำได้: เพิ่มเฉพาะหัวข้อที่ยังไม่มี อัปเดตชื่อ/ลำดับ และตัดหัวข้อซ้ำออก
SET NAMES utf8mb4;

SET @general_id = (SELECT id FROM departments WHERE code = 'general' LIMIT 1);
SET @personnel_id = (SELECT id FROM departments WHERE code = 'personnel' LIMIT 1);
SET @academic_id = (SELECT id FROM departments WHERE code = 'academic' LIMIT 1);

-- เปลี่ยนชื่อให้ตรงเอกสารใหม่
UPDATE topics
SET title = 'ข้อมูลสภาพชุมชนโดยรวม / สภาพชุมชนรอบโรงเรียน'
WHERE title = 'ข้อมูลสภาพชุมชนโดยรวม';

-- หัวข้อใหม่บทที่ 1
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, chart_json, sort_order)
SELECT @general_id, 1, 'สัญลักษณ์ประจำโรงเรียน', 'text', 'year', NULL, NULL, 5
WHERE @general_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM topics WHERE title = 'สัญลักษณ์ประจำโรงเรียน');

INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, chart_json, sort_order)
SELECT @general_id, 1, 'เพลงประจำโรงเรียน', 'text', 'year', NULL, NULL, 6
WHERE @general_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM topics WHERE title = 'เพลงประจำโรงเรียน');

-- หัวข้อใหม่บทที่ 3
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, chart_json, sort_order)
SELECT @general_id, 3, 'ผลการประเมินตนเองของสถานศึกษา (PQA)', 'table', 'year',
       '[{"key":"c1","label":"ด้านหรือเกณฑ์การประเมิน","type":"text"},{"key":"c2","label":"คะแนน","type":"number"},{"key":"c3","label":"ระดับคุณภาพ","type":"text"},{"key":"c4","label":"หมายเหตุ","type":"text"}]',
       '{"type":"bar","series":["c2"],"trend":true}', 24
WHERE @general_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM topics WHERE title = 'ผลการประเมินตนเองของสถานศึกษา (PQA)');

-- หัวข้อใหม่บทที่ 4
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, chart_json, sort_order)
SELECT @personnel_id, 4, 'คำสั่งไปราชการ', 'table', 'year',
       '[{"key":"c1","label":"เลขที่คำสั่ง","type":"text"},{"key":"c2","label":"วันที่","type":"text"},{"key":"c3","label":"ชื่อผู้ไปราชการ","type":"text"},{"key":"c4","label":"เรื่องหรือวัตถุประสงค์","type":"text"},{"key":"c5","label":"สถานที่หรือหน่วยงาน","type":"text"}]',
       NULL, 51
WHERE @personnel_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM topics WHERE title = 'คำสั่งไปราชการ');

-- เอกสารใหม่แยกวิสัยทัศน์ พันธกิจ และเป้าประสงค์ไว้ในบทที่ 1 แล้ว จึงตัดหัวข้อรวมที่ซ้ำในบทที่ 2
DELETE FROM topics
WHERE chapter = 2 AND title = 'วิสัยทัศน์ พันธกิจ และเป้าประสงค์';

-- เรียงบทที่ 1 ตามสารบัญใหม่
UPDATE topics SET sort_order = CASE title
  WHEN 'ข้อมูลพื้นฐานโรงเรียน' THEN 1
  WHEN 'ประวัติโรงเรียน' THEN 2
  WHEN 'ข้อมูลสภาพชุมชนโดยรวม / สภาพชุมชนรอบโรงเรียน' THEN 3
  WHEN 'ตราสัญลักษณ์ สี ธง ดอกไม้ประจำโรงเรียน และเอกลักษณ์ประจำตัวนักเรียน' THEN 4
  WHEN 'สัญลักษณ์ประจำโรงเรียน' THEN 5
  WHEN 'เพลงประจำโรงเรียน' THEN 6
  WHEN 'คำขวัญ คติธรรม วิสัยทัศน์ พันธกิจ เป้าประสงค์ กลยุทธ์ระดับองค์กร อัตลักษณ์ เอกลักษณ์ ปณิธาน จุดเน้น และจุดเด่นของโรงเรียน' THEN 7
  WHEN 'ขนาดและเนื้อที่ของสถานศึกษา' THEN 8
  WHEN 'ข้อมูลระบบการจัดการศึกษา' THEN 9
  WHEN 'ข้อมูลเกี่ยวกับการเปิดสอน' THEN 10
  WHEN 'ข้อมูลอาคารและสถานที่' THEN 11
  WHEN 'ข้อมูลห้องเรียน' THEN 12
  WHEN 'สาธารณูปโภค' THEN 13
  WHEN 'ประเภทแหล่งน้ำในโรงเรียน' THEN 14
  WHEN 'ผู้ให้บริการโทรศัพท์ โทรสารและอินเทอร์เน็ต' THEN 15
  WHEN 'เขตบริการของโรงเรียน' THEN 16
  WHEN 'ลักษณะที่ดิน ขนาดและประเภทกรรมสิทธิ์การถือครองที่ดิน' THEN 17
  WHEN 'ประเภทและลักษณะโรงเรียน' THEN 18
  WHEN 'วิสัยทัศน์โรงเรียน' THEN 19
  WHEN 'พันธกิจโรงเรียน' THEN 20
  WHEN 'เป้าประสงค์โรงเรียน' THEN 21
  WHEN 'กลยุทธ์โรงเรียน' THEN 22
  ELSE sort_order END
WHERE department_id = @general_id AND chapter = 1;

-- เรียงบทที่ 2-4 ตามสารบัญใหม่
UPDATE topics SET sort_order = CASE title
  WHEN 'โครงการหลักประจำปี' THEN 1
  WHEN 'เอกลักษณ์และอัตลักษณ์' THEN 2
  WHEN 'กลยุทธ์ของโรงเรียน' THEN 3
  ELSE sort_order END
WHERE chapter = 2;

UPDATE topics SET sort_order = CASE title
  WHEN 'ทำเนียบผู้บริหาร' THEN 1 WHEN 'คณะผู้บริหารปัจจุบัน' THEN 2
  WHEN 'โครงสร้างการบริหารงาน' THEN 3 WHEN 'คณะกรรมการสถานศึกษาขั้นพื้นฐาน' THEN 4
  WHEN 'การบริหารแบบมีส่วนร่วมด้วย BANCHUEN Model และ PDCA' THEN 5
  WHEN 'ระบบประกันคุณภาพภายใน' THEN 6 WHEN 'ภาวะผู้นำและการบริหารเครือข่าย' THEN 7
  WHEN 'ระบบบริหารจัดการดิจิทัลของโรงเรียน' THEN 8
  WHEN 'ผลการประเมินตนเองของสถานศึกษา (PQA)' THEN 9
  ELSE sort_order END
WHERE chapter = 3;

UPDATE topics SET sort_order = CASE title
  WHEN 'จำนวนบุคลากรแยกตามประเภท' THEN 1 WHEN 'จำนวนครูแยกตามวิทยฐานะ' THEN 2
  WHEN 'จำนวนครูแยกตามวุฒิการศึกษา' THEN 3 WHEN 'จำนวนครูแยกตามกลุ่มสาระการเรียนรู้' THEN 4
  WHEN 'การพัฒนาครูและบุคลากร (บันทึกรายภาคเรียน)' THEN 5
  WHEN 'การพัฒนาครูและบุคลากรตามมาตรฐานวิชาชีพ (สรุปรายปี)' THEN 6
  WHEN 'จำนวนครูและบุคลากรแยกตามประเภท (ข้อมูล ณ 10 มิถุนายน 2568)' THEN 7
  WHEN 'คำสั่งไปราชการ' THEN 8
  ELSE sort_order END
WHERE chapter = 4;

-- เรียงหัวข้อภายในป้ายแบ่งหมวดของบทที่ 5, 6 และ 9
UPDATE topics SET sort_order = CASE title
  WHEN 'นักเรียนที่จบการศึกษาและการศึกษาต่อ' THEN 1
  WHEN 'จำนวนนักเรียนแยกตามระดับชั้น (รายภาคเรียน)' THEN 2
  WHEN 'จำนวนนักเรียนแยกตามระดับชั้น (สรุปรายปี)' THEN 3
  WHEN 'สถิติการมาเรียนของนักเรียน' THEN 4 WHEN 'การเยี่ยมบ้านนักเรียน' THEN 5
  WHEN 'ทุนการศึกษา' THEN 6 WHEN 'ผลการประเมินสัดส่วนร่างกายของนักเรียน' THEN 7
  WHEN 'ผลการประเมินสมรรถภาพทางกายของนักเรียน' THEN 8
  WHEN 'ผลสุขภาพจิตของนักเรียนแยกตามระดับชั้น' THEN 9
  WHEN 'นักเรียนที่มีพฤติกรรมไม่พึงประสงค์แยกตามระดับชั้น' THEN 10
  ELSE sort_order END
WHERE chapter = 5;

UPDATE topics SET sort_order = CASE title
  WHEN 'แผนการเรียนที่เปิดสอน' THEN 1 WHEN 'จำนวนหลักสูตรและแผนการเรียนที่เปิดสอน' THEN 2
  WHEN 'โครงสร้างหลักสูตรสถานศึกษาระดับมัธยมศึกษาตอนต้นและตอนปลาย' THEN 3
  WHEN 'กระบวนการพัฒนาหลักสูตรสถานศึกษา' THEN 4 WHEN 'การจัดกิจกรรมเสริมหลักสูตร' THEN 5
  WHEN 'การออกแบบการจัดการเรียนรู้ที่เน้นผู้เรียน' THEN 6
  WHEN 'การจัดการชั้นเรียนและการสะท้อนผล' THEN 7 WHEN 'งานวิจัยในชั้นเรียน' THEN 8
  WHEN 'แหล่งเรียนรู้ภายในโรงเรียน' THEN 9 WHEN 'แหล่งเรียนรู้และภูมิปัญญาท้องถิ่น' THEN 10
  WHEN 'การจัดหาและใช้สื่อ เทคโนโลยี และแหล่งเรียนรู้' THEN 11
  WHEN 'จำนวนสื่อและนวัตกรรมแยกตามกลุ่มสาระการเรียนรู้' THEN 12
  ELSE sort_order END
WHERE chapter = 6;

UPDATE topics SET sort_order = CASE title
  WHEN 'ผลสัมฤทธิ์ทางการเรียนแยกตามกลุ่มสาระ' THEN 1
  WHEN 'ผลสัมฤทธิ์รายวิชาภาษาอังกฤษแยกตามระดับคะแนน' THEN 2
  WHEN 'ผลสัมฤทธิ์รายวิชาเทคโนโลยีแยกตามระดับคะแนน' THEN 3
  WHEN 'ผลสัมฤทธิ์รายวิชาการศึกษาค้นคว้าด้วยตนเอง (IS)' THEN 4
  WHEN 'ผลสัมฤทธิ์รายวิชาการป้องกันการทุจริตแยกตามระดับคะแนน' THEN 5
  WHEN 'แนวทางพัฒนาผลสัมฤทธิ์ทางวิชาการ' THEN 6
  WHEN 'การพัฒนาความสามารถด้านภาษา การคิด และนวัตกรรม' THEN 7
  WHEN 'ระบบการวัดและประเมินผล' THEN 8 WHEN 'การนำผลประเมินไปพัฒนาผู้เรียน' THEN 9
  WHEN 'ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 3 (คะแนนเฉลี่ยโรงเรียน)' THEN 10
  WHEN 'ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 6 (คะแนนเฉลี่ยโรงเรียน)' THEN 11
  WHEN 'ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 3 เปรียบเทียบระดับประเทศ' THEN 12
  WHEN 'ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 6 เปรียบเทียบระดับประเทศ' THEN 13
  WHEN 'ผลการประเมินตนเองของสถานศึกษา (SAR)' THEN 14
  WHEN 'ความสามารถด้านการอ่าน-เขียนภาษาไทยและการสื่อสารระดับดี' THEN 15
  WHEN 'ผลการประเมินการอ่าน คิดวิเคราะห์ และเขียน (รายภาคเรียน)' THEN 16
  WHEN 'ผลการประเมินการอ่าน คิดวิเคราะห์ และเขียนสื่อความ (สรุปรายปี)' THEN 17
  WHEN 'ผลการประเมินคุณลักษณะอันพึงประสงค์ (รายภาคเรียน)' THEN 18
  WHEN 'ผลการประเมินคุณลักษณะอันพึงประสงค์ของผู้เรียน (สรุปรายปี)' THEN 19
  WHEN 'เส้นทางศึกษาต่อหรือประกอบอาชีพของนักเรียนชั้นมัธยมศึกษาปีที่ 3' THEN 20
  WHEN 'เส้นทางศึกษาต่อหรือประกอบอาชีพของนักเรียนชั้นมัธยมศึกษาปีที่ 6' THEN 21
  WHEN 'ผลการเข้าศึกษาต่อของนักเรียนชั้นมัธยมศึกษาปีที่ 6 แยกตามระบบ TCAS' THEN 22
  WHEN 'การเข้าร่วมกิจกรรมเลือกตั้งสภาผู้แทนนักเรียน' THEN 23
  WHEN 'การส่งเสริมคุณลักษณะอันพึงประสงค์และจิตสาธารณะ' THEN 24
  WHEN 'การอนุรักษ์สิ่งแวดล้อมและภูมิปัญญาท้องถิ่น' THEN 25
  WHEN 'การทำงานเป็นทีมและความปลอดภัยของผู้เรียน' THEN 26
  ELSE sort_order END
WHERE chapter = 9;

