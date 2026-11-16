-- เติมช่องว่างของหัวข้อเดิมจากข้อมูลเดียวกันที่ถอดจากเล่มด้าน 1-5 แล้ว
-- ขอบเขต: ปี 2566-2568 เท่านั้น และไม่เขียนทับข้อมูลที่มีอยู่
SET NAMES utf8mb4;

-- จำนวนนักเรียนแยกตามระดับชั้น: เอกสารมีจำนวนรวม แต่ไม่มีจำนวนห้อง/ชาย/หญิง
SET @topic_id = (SELECT id FROM topics WHERE title = 'จำนวนนักเรียนแยกตามระดับชั้น (รายภาคเรียน)' ORDER BY id LIMIT 1);
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at)
SELECT @topic_id, 2566, 0, JSON_OBJECT('rows', JSON_ARRAY(
  JSON_OBJECT('c1','ม.1','c2',NULL,'c3',NULL,'c4',NULL,'c5',307), JSON_OBJECT('c1','ม.2','c2',NULL,'c3',NULL,'c4',NULL,'c5',317),
  JSON_OBJECT('c1','ม.3','c2',NULL,'c3',NULL,'c4',NULL,'c5',318), JSON_OBJECT('c1','ม.4','c2',NULL,'c3',NULL,'c4',NULL,'c5',271),
  JSON_OBJECT('c1','ม.5','c2',NULL,'c3',NULL,'c4',NULL,'c5',263), JSON_OBJECT('c1','ม.6','c2',NULL,'c3',NULL,'c4',NULL,'c5',182),
  JSON_OBJECT('c1','รวม','c2',NULL,'c3',NULL,'c4',NULL,'c5',1658)
)), NULL, NOW()
WHERE @topic_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM records WHERE topic_id=@topic_id AND academic_year=2566 AND term=0);
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at)
SELECT @topic_id, 2567, 0, JSON_OBJECT('rows', JSON_ARRAY(
  JSON_OBJECT('c1','ม.1','c2',NULL,'c3',NULL,'c4',NULL,'c5',372), JSON_OBJECT('c1','ม.2','c2',NULL,'c3',NULL,'c4',NULL,'c5',326),
  JSON_OBJECT('c1','ม.3','c2',NULL,'c3',NULL,'c4',NULL,'c5',299), JSON_OBJECT('c1','ม.4','c2',NULL,'c3',NULL,'c4',NULL,'c5',284),
  JSON_OBJECT('c1','ม.5','c2',NULL,'c3',NULL,'c4',NULL,'c5',265), JSON_OBJECT('c1','ม.6','c2',NULL,'c3',NULL,'c4',NULL,'c5',261),
  JSON_OBJECT('c1','รวม','c2',NULL,'c3',NULL,'c4',NULL,'c5',1807)
)), NULL, NOW()
WHERE @topic_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM records WHERE topic_id=@topic_id AND academic_year=2567 AND term=0);
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at)
SELECT @topic_id, 2568, 0, JSON_OBJECT('rows', JSON_ARRAY(
  JSON_OBJECT('c1','ม.1','c2',NULL,'c3',NULL,'c4',NULL,'c5',485), JSON_OBJECT('c1','ม.2','c2',NULL,'c3',NULL,'c4',NULL,'c5',374),
  JSON_OBJECT('c1','ม.3','c2',NULL,'c3',NULL,'c4',NULL,'c5',330), JSON_OBJECT('c1','ม.4','c2',NULL,'c3',NULL,'c4',NULL,'c5',313),
  JSON_OBJECT('c1','ม.5','c2',NULL,'c3',NULL,'c4',NULL,'c5',272), JSON_OBJECT('c1','ม.6','c2',NULL,'c3',NULL,'c4',NULL,'c5',269),
  JSON_OBJECT('c1','รวม','c2',NULL,'c3',NULL,'c4',NULL,'c5',2043)
)), NULL, NOW()
WHERE @topic_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM records WHERE topic_id=@topic_id AND academic_year=2568 AND term=0);

-- แผนการเรียนที่เปิดสอน: เล่มระบุจำนวนหลักสูตร/แผนการเรียนแยก ม.ต้น และ ม.ปลาย
SET @topic_id = (SELECT id FROM topics WHERE title = 'แผนการเรียนที่เปิดสอน' ORDER BY id LIMIT 1);
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at)
SELECT @topic_id, y.yr, 0, JSON_OBJECT('rows', JSON_ARRAY(
  JSON_OBJECT('c1','รวมหลักสูตร/ห้องเรียน','c2','มัธยมศึกษาตอนต้น','c3',8),
  JSON_OBJECT('c1','รวมแผนการเรียน/ห้องเรียน','c2','มัธยมศึกษาตอนปลาย','c3',y.upper_count),
  JSON_OBJECT('c1','รวม','c2',NULL,'c3',8+y.upper_count)
)), NULL, NOW()
FROM (SELECT 2566 yr,18 upper_count UNION ALL SELECT 2567,18 UNION ALL SELECT 2568,19) y
WHERE @topic_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM records r WHERE r.topic_id=@topic_id AND r.academic_year=y.yr AND r.term=0);

-- O-NET ม.3 และ ม.6: ใช้คะแนนโรงเรียนและระดับประเทศจากตารางสรุปเดียวกันในเล่ม
SET @topic_id = (SELECT id FROM topics WHERE id = 45 OR title LIKE '%O-NET%3%' ORDER BY (id=45) DESC, id LIMIT 1);
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at)
SELECT @topic_id, y.yr, 0, y.payload, NULL, NOW() FROM (
  SELECT 2566 yr, JSON_OBJECT('rows',JSON_ARRAY(JSON_OBJECT('c1','ภาษาไทย','c2',54.87,'c3',50.73),JSON_OBJECT('c1','ภาษาอังกฤษ','c2',30.70,'c3',31.76),JSON_OBJECT('c1','คณิตศาสตร์','c2',22.39,'c3',25.38),JSON_OBJECT('c1','วิทยาศาสตร์','c2',29.09,'c3',30.00))) payload
  UNION ALL SELECT 2567, JSON_OBJECT('rows',JSON_ARRAY(JSON_OBJECT('c1','ภาษาไทย','c2',56.52,'c3',48.93),JSON_OBJECT('c1','ภาษาอังกฤษ','c2',30.85,'c3',30.93),JSON_OBJECT('c1','คณิตศาสตร์','c2',24.56,'c3',26.53),JSON_OBJECT('c1','วิทยาศาสตร์','c2',35.55,'c3',34.22)))
  UNION ALL SELECT 2568, JSON_OBJECT('rows',JSON_ARRAY(JSON_OBJECT('c1','ภาษาไทย','c2',49.22,'c3',47.60),JSON_OBJECT('c1','ภาษาอังกฤษ','c2',30.70,'c3',32.46),JSON_OBJECT('c1','คณิตศาสตร์','c2',26.68,'c3',26.81),JSON_OBJECT('c1','วิทยาศาสตร์','c2',33.66,'c3',33.95)))
) y WHERE @topic_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM records r WHERE r.topic_id=@topic_id AND r.academic_year=y.yr AND r.term=0);

-- รางวัลนักเรียน: คัดเฉพาะรายการที่เอกสารระบุปี ระดับรางวัล และจำนวนผู้ได้รับชัดเจน
SET @topic_id = (SELECT id FROM topics WHERE id = 50 OR title LIKE 'รางวัลของนักเรียน%' ORDER BY (id=50) DESC, id LIMIT 1);
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at)
SELECT @topic_id, y.yr, 0, y.payload, NULL, NOW() FROM (
  SELECT 2566 yr, JSON_OBJECT('rows',JSON_ARRAY(
    JSON_OBJECT('c1','ระดับชาติ','c2','คัดลายมือสื่อภาษาไทย ม.1-3 งานศิลปหัตถกรรมนักเรียนระดับชาติ ครั้งที่ 70','c3','เหรียญทอง ชนะเลิศ','c4',1),
    JSON_OBJECT('c1','ระดับชาติ','c2','มวยปล้ำชายหาดชาย รุ่นอายุไม่เกิน 17 ปี น้ำหนักมากกว่า 70 กิโลกรัม','c3','เหรียญทองแดง','c4',1))) payload
  UNION ALL SELECT 2567, JSON_OBJECT('rows',JSON_ARRAY(
    JSON_OBJECT('c1','ระดับชาติ','c2','มหิดลกรองแก้วแวววรรณ ครั้งที่ 13 ประเภทกลอนสุภาพ','c3','รองชนะเลิศอันดับ 2','c4',2),
    JSON_OBJECT('c1','ระดับชาติ','c2','แต่งบทประพันธ์จากสารานุกรมไทยสำหรับเยาวชนฯ ประเภทกาพย์ยานี 11 ครั้งที่ 14','c3','รองชนะเลิศอันดับ 1','c4',1),
    JSON_OBJECT('c1','ระดับชาติ','c2','พูดเล่าเรื่องด้วยภาษาไทยมาตรฐานและภาษาไทยถิ่น วันภาษาไทยแห่งชาติ','c3','รองชนะเลิศอันดับ 1','c4',1)))
  UNION ALL SELECT 2568, JSON_OBJECT('rows',JSON_ARRAY(
    JSON_OBJECT('c1','ระดับชาติ','c2','Chinese Podcast โครงการแข่งขันทักษะภาษาและวัฒนธรรมจีน','c3','เหรียญทอง','c4',2),
    JSON_OBJECT('c1','ระดับชาติ','c2','ประกวดมารยาทไทย ครั้งที่ 5 ระดับมัธยมศึกษา','c3','เหรียญทอง','c4',1),
    JSON_OBJECT('c1','ระดับชาติ','c2','สวดมนต์หมู่สรรเสริญพระรัตนตรัย ทำนองสรภัญญะ ทีมหญิงล้วน','c3','รางวัลชมเชย','c4',5)))
) y WHERE @topic_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM records r WHERE r.topic_id=@topic_id AND r.academic_year=y.yr AND r.term=0);

SET @topic_id = (SELECT id FROM topics WHERE id = 46 OR title LIKE '%O-NET%6%' ORDER BY (id=46) DESC, id LIMIT 1);
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at)
SELECT @topic_id, y.yr, 0, y.payload, NULL, NOW() FROM (
  SELECT 2566 yr, JSON_OBJECT('rows',JSON_ARRAY(JSON_OBJECT('c1','ภาษาไทย','c2',45.23,'c3',40.78),JSON_OBJECT('c1','ภาษาอังกฤษ','c2',23.71,'c3',26.19),JSON_OBJECT('c1','คณิตศาสตร์','c2',20.55,'c3',19.96),JSON_OBJECT('c1','วิทยาศาสตร์','c2',29.75,'c3',29.09),JSON_OBJECT('c1','สังคมศึกษา','c2',34.65,'c3',33.09))) payload
  UNION ALL SELECT 2567, JSON_OBJECT('rows',JSON_ARRAY(JSON_OBJECT('c1','ภาษาไทย','c2',47.41,'c3',42.21),JSON_OBJECT('c1','ภาษาอังกฤษ','c2',30.84,'c3',30.61),JSON_OBJECT('c1','คณิตศาสตร์','c2',21.02,'c3',21.76),JSON_OBJECT('c1','วิทยาศาสตร์','c2',29.43,'c3',28.95),JSON_OBJECT('c1','สังคมศึกษา','c2',39.11,'c3',35.77)))
  UNION ALL SELECT 2568, JSON_OBJECT('rows',JSON_ARRAY(JSON_OBJECT('c1','ภาษาไทย','c2',43.73,'c3',40.32),JSON_OBJECT('c1','ภาษาอังกฤษ','c2',29.97,'c3',30.15),JSON_OBJECT('c1','คณิตศาสตร์','c2',20.84,'c3',21.00),JSON_OBJECT('c1','วิทยาศาสตร์','c2',30.82,'c3',31.99),JSON_OBJECT('c1','สังคมศึกษา','c2',39.12,'c3',36.96)))
) y WHERE @topic_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM records r WHERE r.topic_id=@topic_id AND r.academic_year=y.yr AND r.term=0);

-- บุคลากรปี 2568: เล่มมีจำนวนรวมรายประเภท แต่ไม่ได้แยกเพศ
SET @topic_id = (SELECT id FROM topics WHERE title = 'จำนวนบุคลากรแยกตามประเภท' ORDER BY id LIMIT 1);
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at)
SELECT @topic_id, 2568, 0, JSON_OBJECT('rows',JSON_ARRAY(
  JSON_OBJECT('c1','ผู้อำนวยการ','c2',NULL,'c3',NULL,'c4',1), JSON_OBJECT('c1','รองผู้อำนวยการ','c2',NULL,'c3',NULL,'c4',4),
  JSON_OBJECT('c1','ครูประจำการ','c2',NULL,'c3',NULL,'c4',82), JSON_OBJECT('c1','พนักงานราชการ','c2',NULL,'c3',NULL,'c4',1),
  JSON_OBJECT('c1','ครูอัตราจ้าง','c2',NULL,'c3',NULL,'c4',6), JSON_OBJECT('c1','ครูชาวต่างชาติ','c2',NULL,'c3',NULL,'c4',2),
  JSON_OBJECT('c1','ลูกจ้างชั่วคราว','c2',NULL,'c3',NULL,'c4',16), JSON_OBJECT('c1','รวม','c2',NULL,'c3',NULL,'c4',112)
)), NULL, NOW()
WHERE @topic_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM records WHERE topic_id=@topic_id AND academic_year=2568 AND term=0);

-- รางวัลสถานศึกษา: จัดรูปจากสรุปรางวัลเชิงประจักษ์ในเล่มด้านที่ 5
SET @topic_id = (SELECT id FROM topics WHERE id = 48 OR title LIKE 'รางวัลของโรงเรียน%' ORDER BY (id=48) DESC, id LIMIT 1);
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at)
SELECT @topic_id, y.yr, 0, y.payload, NULL, NOW() FROM (
  SELECT 2566 yr, JSON_OBJECT('rows',JSON_ARRAY(
    JSON_OBJECT('c1','ระดับโครงการ','c2','โรงเรียนต้นแบบเยาวชนพลเมือง ภายใต้โครงการเยาวชนพลเมือง','c3','ประจำปีการศึกษา 2566'),
    JSON_OBJECT('c1','ระดับดีเด่น','c2','ผลงานนวัตกรรมสร้างสรรค์คนดี ด้านผู้บริหาร โครงการโรงเรียนคุณธรรม สพฐ.','c3','ตามเอกสารด้านที่ 5'),
    JSON_OBJECT('c1','Best Practices ระดับเขตพื้นที่การศึกษา','c2','การพัฒนาระบบประกันคุณภาพภายในที่ส่งผลต่อผู้เรียนอย่างยั่งยืน','c3','ตามเอกสารด้านที่ 5'))) payload
  UNION ALL SELECT 2567, JSON_OBJECT('rows',JSON_ARRAY(
    JSON_OBJECT('c1','ประจำปี 2567','c2','โรงเรียนต้นแบบองค์กรดีศรีเชียงใหม่','c3','ตามเอกสารด้านที่ 5'),
    JSON_OBJECT('c1','ประกาศเกียรติคุณชั้นสามัญ','c2','ความร่วมมือจัดหาผู้บริจาคโลหิตรวมมากกว่า 1,530 หน่วย','c3','ตามเอกสารด้านที่ 5'),
    JSON_OBJECT('c1','Best Practices ระดับยอดเยี่ยม','c2','การพัฒนาระบบประกันคุณภาพภายในที่ส่งผลต่อผู้เรียนอย่างยั่งยืน','c3','ระดับโรงเรียนขนาดใหญ่'),
    JSON_OBJECT('c1','SCQA / OBECQA','c2','ความพร้อม 5 ด้านของโรงเรียนมาตรฐานสากล','c3','ผ่านเกณฑ์ OBECQA'),
    JSON_OBJECT('c1','รางวัลยอดเยี่ยม','c2','ระบบประกันคุณภาพภายใน','c3','IQA AWARD จาก สพฐ.'),
    JSON_OBJECT('c1','พระราชทานป้ายสนองพระราชดำริ','c2','งานสวนพฤกษศาสตร์โรงเรียน','c3','อพ.สธ.'))) 
  UNION ALL SELECT 2568, JSON_OBJECT('rows',JSON_ARRAY(
    JSON_OBJECT('c1','ระดับมัธยมศึกษา','c2','โรงเรียนดีเด่น','c3','รางวัลสมเด็จพระกนิษฐาธิราชเจ้า กรมสมเด็จพระเทพรัตนราชสุดาฯ ประจำปี 2568'),
    JSON_OBJECT('c1','Best Practices ระดับเขตพื้นที่การศึกษา','c2','การพัฒนาระบบประกันคุณภาพภายในที่ส่งผลต่อผู้เรียนอย่างยั่งยืน','c3','ตามเอกสารด้านที่ 5')))
) y WHERE @topic_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM records r WHERE r.topic_id=@topic_id AND r.academic_year=y.yr AND r.term=0);

