-- ข้อมูลตัวอย่างครบทุกหมวด 1 เล่ม: ภาคเรียนที่ 1/2569
-- ข้อความ ชื่อ และตัวเลขทั้งหมดเป็นข้อมูลสมมติ ใช้ทดสอบระบบเท่านั้น
-- ต้อง import chapters.sql ก่อน (เพิ่มคอลัมน์ chapter)
--
-- !! ไฟล์นี้ลบหัวข้อและข้อมูลที่กรอกไว้ทั้งหมดก่อน แล้วใส่ข้อมูลตัวอย่างใหม่ (ผู้ใช้และภาคเรียนไม่ถูกลบ)
-- ลบข้อมูลตัวอย่างทิ้งตอนจะเริ่มใช้จริง: รันในแท็บ SQL ->  DELETE FROM records; DELETE FROM topics;

SET NAMES utf8mb4;

DELETE FROM records;
DELETE FROM topics;

INSERT IGNORE INTO terms (academic_year, term) VALUES (2569, 0), (2569, 1);

-- [1] คำชี้แจง
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 1, 'คำชี้แจง', 'text', 'term', NULL, 1 FROM departments WHERE code = 'general';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"text": "เล่มนี้เป็นข้อมูลตัวอย่างสำหรับทดสอบระบบเท่านั้น ข้อความ ชื่อ และตัวเลขทั้งหมดเป็นข้อมูลสมมติ ไม่ใช่ข้อมูลจริงของโรงเรียน\\nเมื่อแต่ละฝ่ายเริ่มกรอกข้อมูลจริงแล้ว ให้ลบข้อมูลตัวอย่างนี้ออกก่อน"}', NULL, NOW());

-- [1] ประวัติโรงเรียน
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 1, 'ประวัติโรงเรียน', 'text', 'year', NULL, 2 FROM departments WHERE code = 'general';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"text": "[ตัวอย่าง] ส่วนนี้ใส่ประวัติการก่อตั้งโรงเรียน เช่น ปีที่ก่อตั้ง ผู้ริเริ่ม สถานที่เรียนแห่งแรก และพัฒนาการสำคัญในแต่ละช่วง\\n[ตัวอย่าง] พ.ศ. ____ ได้รับอนุมัติจัดตั้งโรงเรียน เปิดสอนชั้นมัธยมศึกษาปีที่ 1 จำนวน ___ ห้องเรียน\\n[ตัวอย่าง] พ.ศ. ____ เปิดสอนระดับมัธยมศึกษาตอนปลาย และได้รับงบประมาณก่อสร้างอาคารเรียนหลังแรก\\n[ตัวอย่าง] ปัจจุบันเปิดสอนตั้งแต่ชั้นมัธยมศึกษาปีที่ 1 ถึงชั้นมัธยมศึกษาปีที่ 6"}', NULL, NOW());

-- [1] ข้อมูลพื้นฐานของโรงเรียน
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 1, 'ข้อมูลพื้นฐานของโรงเรียน', 'table', 'year', '[{"key": "c1", "label": "รายการ", "type": "text"}, {"key": "c2", "label": "ข้อมูล", "type": "text"}]', 3 FROM departments WHERE code = 'general';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"rows": [{"c1": "ชื่อโรงเรียน", "c2": "โรงเรียนสันทรายวิทยาคม"}, {"c1": "สังกัด", "c2": "(ตัวอย่าง) สำนักงานเขตพื้นที่การศึกษามัธยมศึกษา ____"}, {"c1": "ที่ตั้ง", "c2": "(ตัวอย่าง) เลขที่ ___ ตำบล ___ อำเภอสันทราย จังหวัดเชียงใหม่"}, {"c1": "เนื้อที่", "c2": "(ตัวอย่าง) ___ ไร่"}, {"c1": "ระดับที่เปิดสอน", "c2": "มัธยมศึกษาปีที่ 1–6"}, {"c1": "ขนาดโรงเรียน", "c2": "(ตัวอย่าง) ขนาดใหญ่"}, {"c1": "โทรศัพท์", "c2": "(ตัวอย่าง) 0-5300-0000"}, {"c1": "เว็บไซต์", "c2": "(ตัวอย่าง) www.example.ac.th"}]}', NULL, NOW());

-- [1] สัญลักษณ์ประจำโรงเรียน
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 1, 'สัญลักษณ์ประจำโรงเรียน', 'table', 'year', '[{"key": "c1", "label": "สัญลักษณ์", "type": "text"}, {"key": "c2", "label": "รายละเอียด", "type": "text"}]', 4 FROM departments WHERE code = 'general';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"rows": [{"c1": "ตราประจำโรงเรียน", "c2": "(ตัวอย่าง) คำอธิบายตราสัญลักษณ์"}, {"c1": "อักษรย่อ", "c2": "(ตัวอย่าง) ส.ท.ว."}, {"c1": "สีประจำโรงเรียน", "c2": "(ตัวอย่าง) น้ำเงิน–ขาว"}, {"c1": "ต้นไม้ประจำโรงเรียน", "c2": "(ตัวอย่าง) ชื่อต้นไม้"}, {"c1": "ปรัชญา", "c2": "(ตัวอย่าง) ข้อความปรัชญาของโรงเรียน"}, {"c1": "คติพจน์", "c2": "(ตัวอย่าง) ข้อความคติพจน์"}]}', NULL, NOW());

-- [1] เพลงประจำโรงเรียน
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 1, 'เพลงประจำโรงเรียน', 'text', 'year', NULL, 5 FROM departments WHERE code = 'general';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"text": "[ตัวอย่าง] ชื่อเพลง: ________ ผู้ประพันธ์คำร้อง: ________ ผู้ประพันธ์ทำนอง: ________\\n[ตัวอย่าง] ใส่เนื้อเพลงประจำโรงเรียนในส่วนนี้"}', NULL, NOW());

-- [1] สภาพชุมชนรอบโรงเรียน
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 1, 'สภาพชุมชนรอบโรงเรียน', 'text', 'year', NULL, 6 FROM departments WHERE code = 'general';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"text": "[ตัวอย่าง] ลักษณะชุมชนรอบโรงเรียน อาชีพหลักของผู้ปกครอง สถานที่สำคัญใกล้เคียง และความร่วมมือระหว่างโรงเรียนกับชุมชน"}', NULL, NOW());

-- [2] วิสัยทัศน์ พันธกิจ และเป้าประสงค์
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 2, 'วิสัยทัศน์ พันธกิจ และเป้าประสงค์', 'text', 'year', NULL, 1 FROM departments WHERE code = 'budget';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"text": "วิสัยทัศน์: [ตัวอย่าง] ข้อความวิสัยทัศน์ของโรงเรียน\\nพันธกิจ: [ตัวอย่าง] 1) พัฒนาคุณภาพผู้เรียน 2) พัฒนาครูและบุคลากร 3) พัฒนาระบบบริหารจัดการ 4) ส่งเสริมความร่วมมือกับชุมชน\\nเป้าประสงค์: [ตัวอย่าง] ผู้เรียนมีคุณภาพตามมาตรฐาน ครูมีสมรรถนะในการจัดการเรียนรู้ โรงเรียนมีระบบบริหารที่มีประสิทธิภาพ"}', NULL, NOW());

-- [2] เอกลักษณ์และอัตลักษณ์
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 2, 'เอกลักษณ์และอัตลักษณ์', 'text', 'year', NULL, 2 FROM departments WHERE code = 'budget';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"text": "เอกลักษณ์: [ตัวอย่าง] ข้อความเอกลักษณ์ของโรงเรียน\\nอัตลักษณ์: [ตัวอย่าง] ข้อความอัตลักษณ์ของนักเรียน"}', NULL, NOW());

-- [2] กลยุทธ์ของโรงเรียน
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 2, 'กลยุทธ์ของโรงเรียน', 'table', 'year', '[{"key": "c1", "label": "ที่", "type": "number"}, {"key": "c2", "label": "กลยุทธ์", "type": "text"}]', 3 FROM departments WHERE code = 'budget';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"rows": [{"c1": 1, "c2": "(ตัวอย่าง) ยกระดับผลสัมฤทธิ์ทางการเรียนของผู้เรียน"}, {"c1": 2, "c2": "(ตัวอย่าง) ส่งเสริมคุณธรรม จริยธรรม และคุณลักษณะอันพึงประสงค์"}, {"c1": 3, "c2": "(ตัวอย่าง) พัฒนาครูและบุคลากรสู่มืออาชีพ"}, {"c1": 4, "c2": "(ตัวอย่าง) พัฒนาแหล่งเรียนรู้และเทคโนโลยี"}, {"c1": 5, "c2": "(ตัวอย่าง) บริหารจัดการแบบมีส่วนร่วม"}]}', NULL, NOW());

-- [2] โครงการหลักประจำปี
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 2, 'โครงการหลักประจำปี', 'table', 'year', '[{"key": "c1", "label": "โครงการ", "type": "text"}, {"key": "c2", "label": "ฝ่ายที่รับผิดชอบ", "type": "text"}, {"key": "c3", "label": "งบประมาณ (บาท)", "type": "number"}]', 4 FROM departments WHERE code = 'budget';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"rows": [{"c1": "(ตัวอย่าง) ยกระดับผลสัมฤทธิ์ทางการเรียน", "c2": "วิชาการ", "c3": 350000}, {"c1": "(ตัวอย่าง) ส่งเสริมคุณธรรมนักเรียน", "c2": "บุคคล", "c3": 120000}, {"c1": "(ตัวอย่าง) พัฒนาครูและบุคลากร", "c2": "บุคคล", "c3": 180000}, {"c1": "(ตัวอย่าง) พัฒนาแหล่งเรียนรู้", "c2": "ทั่วไป", "c3": 250000}, {"c1": "(ตัวอย่าง) พัฒนาระบบสารสนเทศ", "c2": "งบประมาณ", "c3": 90000}, {"c1": "รวม", "c2": "", "c3": 990000}]}', NULL, NOW());

-- [3] ทำเนียบผู้บริหาร
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 3, 'ทำเนียบผู้บริหาร', 'table', 'year', '[{"key": "c1", "label": "ลำดับ", "type": "number"}, {"key": "c2", "label": "ชื่อ–สกุล", "type": "text"}, {"key": "c3", "label": "ตำแหน่ง", "type": "text"}, {"key": "c4", "label": "ปีที่ดำรงตำแหน่ง", "type": "text"}]', 7 FROM departments WHERE code = 'general';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"rows": [{"c1": 1, "c2": "ผู้บริหารคนที่ 1 (ตัวอย่าง)", "c3": "ผู้อำนวยการโรงเรียน", "c4": "พ.ศ. ____–____"}, {"c1": 2, "c2": "ผู้บริหารคนที่ 2 (ตัวอย่าง)", "c3": "ผู้อำนวยการโรงเรียน", "c4": "พ.ศ. ____–____"}, {"c1": 3, "c2": "ผู้บริหารคนที่ 3 (ตัวอย่าง)", "c3": "ผู้อำนวยการโรงเรียน", "c4": "พ.ศ. ____–____"}, {"c1": 4, "c2": "ผู้บริหารคนที่ 4 (ตัวอย่าง)", "c3": "ผู้อำนวยการโรงเรียน", "c4": "พ.ศ. ____–____"}, {"c1": 5, "c2": "ผู้บริหารคนที่ 5 (ตัวอย่าง)", "c3": "ผู้อำนวยการโรงเรียน", "c4": "พ.ศ. ____–____"}]}', NULL, NOW());

-- [3] คณะผู้บริหารปัจจุบัน
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 3, 'คณะผู้บริหารปัจจุบัน', 'table', 'year', '[{"key": "c1", "label": "ตำแหน่ง", "type": "text"}, {"key": "c2", "label": "ชื่อ–สกุล", "type": "text"}, {"key": "c3", "label": "กลุ่มงานที่รับผิดชอบ", "type": "text"}]', 8 FROM departments WHERE code = 'general';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"rows": [{"c1": "ผู้อำนวยการโรงเรียน", "c2": "(ตัวอย่าง)", "c3": "บริหารงานทั้งหมด"}, {"c1": "รองผู้อำนวยการ", "c2": "(ตัวอย่าง)", "c3": "กลุ่มบริหารวิชาการ"}, {"c1": "รองผู้อำนวยการ", "c2": "(ตัวอย่าง)", "c3": "กลุ่มบริหารงบประมาณ"}, {"c1": "รองผู้อำนวยการ", "c2": "(ตัวอย่าง)", "c3": "กลุ่มบริหารงานบุคคล"}, {"c1": "รองผู้อำนวยการ", "c2": "(ตัวอย่าง)", "c3": "กลุ่มบริหารทั่วไป"}]}', NULL, NOW());

-- [3] โครงสร้างการบริหารงาน
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 3, 'โครงสร้างการบริหารงาน', 'text', 'year', NULL, 9 FROM departments WHERE code = 'general';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"text": "[ตัวอย่าง] โรงเรียนแบ่งโครงสร้างการบริหารเป็น 4 กลุ่ม ได้แก่ กลุ่มบริหารวิชาการ กลุ่มบริหารงบประมาณ กลุ่มบริหารงานบุคคล และกลุ่มบริหารทั่วไป โดยมีผู้อำนวยการเป็นผู้บังคับบัญชาสูงสุด และมีคณะกรรมการสถานศึกษาขั้นพื้นฐานให้ความเห็นชอบ"}', NULL, NOW());

-- [3] คณะกรรมการสถานศึกษาขั้นพื้นฐาน
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 3, 'คณะกรรมการสถานศึกษาขั้นพื้นฐาน', 'table', 'year', '[{"key": "c1", "label": "ที่", "type": "number"}, {"key": "c2", "label": "ตำแหน่งในคณะกรรมการ", "type": "text"}, {"key": "c3", "label": "ผู้แทนจาก", "type": "text"}]', 10 FROM departments WHERE code = 'general';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"rows": [{"c1": 1, "c2": "ประธานกรรมการ", "c3": "ผู้ทรงคุณวุฒิ"}, {"c1": 2, "c2": "กรรมการ", "c3": "ผู้แทนผู้ปกครอง"}, {"c1": 3, "c2": "กรรมการ", "c3": "ผู้แทนครู"}, {"c1": 4, "c2": "กรรมการ", "c3": "ผู้แทนองค์กรชุมชน"}, {"c1": 5, "c2": "กรรมการ", "c3": "ผู้แทนองค์กรปกครองส่วนท้องถิ่น"}, {"c1": 6, "c2": "กรรมการ", "c3": "ผู้แทนศิษย์เก่า"}, {"c1": 7, "c2": "กรรมการ", "c3": "ผู้แทนพระภิกษุสงฆ์/องค์กรศาสนา"}, {"c1": 8, "c2": "กรรมการและเลขานุการ", "c3": "ผู้อำนวยการโรงเรียน"}]}', NULL, NOW());

-- [4] จำนวนบุคลากรแยกตามประเภท
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 4, 'จำนวนบุคลากรแยกตามประเภท', 'table', 'term', '[{"key": "c1", "label": "ประเภทบุคลากร", "type": "text"}, {"key": "c2", "label": "ชาย", "type": "number"}, {"key": "c3", "label": "หญิง", "type": "number"}, {"key": "c4", "label": "รวม", "type": "number"}]', 1 FROM departments WHERE code = 'personnel';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "ผู้บริหาร", "c2": 3, "c3": 2, "c4": 5}, {"c1": "ข้าราชการครู", "c2": 28, "c3": 59, "c4": 87}, {"c1": "พนักงานราชการ", "c2": 2, "c3": 3, "c4": 5}, {"c1": "ครูอัตราจ้าง", "c2": 2, "c3": 5, "c4": 7}, {"c1": "เจ้าหน้าที่/ลูกจ้าง", "c2": 9, "c3": 7, "c4": 16}, {"c1": "รวม", "c2": 44, "c3": 76, "c4": 120}]}', NULL, NOW());

-- [4] จำนวนครูแยกตามวิทยฐานะ
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 4, 'จำนวนครูแยกตามวิทยฐานะ', 'table', 'term', '[{"key": "c1", "label": "วิทยฐานะ", "type": "text"}, {"key": "c2", "label": "ชาย", "type": "number"}, {"key": "c3", "label": "หญิง", "type": "number"}, {"key": "c4", "label": "รวม", "type": "number"}]', 2 FROM departments WHERE code = 'personnel';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "ครูผู้ช่วย", "c2": 4, "c3": 7, "c4": 11}, {"c1": "ครู (ไม่มีวิทยฐานะ)", "c2": 6, "c3": 11, "c4": 17}, {"c1": "ชำนาญการ", "c2": 8, "c3": 19, "c4": 27}, {"c1": "ชำนาญการพิเศษ", "c2": 9, "c3": 20, "c4": 29}, {"c1": "เชี่ยวชาญ", "c2": 1, "c3": 2, "c4": 3}, {"c1": "รวม", "c2": 28, "c3": 59, "c4": 87}]}', NULL, NOW());

-- [4] จำนวนครูแยกตามวุฒิการศึกษา
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 4, 'จำนวนครูแยกตามวุฒิการศึกษา', 'table', 'term', '[{"key": "c1", "label": "วุฒิการศึกษา", "type": "text"}, {"key": "c2", "label": "จำนวน (คน)", "type": "number"}]', 3 FROM departments WHERE code = 'personnel';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "ปริญญาตรี", "c2": 41}, {"c1": "ปริญญาโท", "c2": 44}, {"c1": "ปริญญาเอก", "c2": 2}, {"c1": "รวม", "c2": 87}]}', NULL, NOW());

-- [4] จำนวนครูแยกตามกลุ่มสาระการเรียนรู้
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 4, 'จำนวนครูแยกตามกลุ่มสาระการเรียนรู้', 'table', 'term', '[{"key": "c1", "label": "กลุ่มสาระการเรียนรู้", "type": "text"}, {"key": "c2", "label": "จำนวนครู", "type": "number"}, {"key": "c3", "label": "คาบสอนเฉลี่ย/สัปดาห์", "type": "number"}]', 4 FROM departments WHERE code = 'personnel';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "ภาษาไทย", "c2": 10, "c3": 18}, {"c1": "คณิตศาสตร์", "c2": 13, "c3": 19}, {"c1": "วิทยาศาสตร์และเทคโนโลยี", "c2": 19, "c3": 18}, {"c1": "สังคมศึกษา ศาสนา และวัฒนธรรม", "c2": 11, "c3": 18}, {"c1": "สุขศึกษาและพลศึกษา", "c2": 7, "c3": 20}, {"c1": "ศิลปะ", "c2": 6, "c3": 19}, {"c1": "การงานอาชีพ", "c2": 7, "c3": 18}, {"c1": "ภาษาต่างประเทศ", "c2": 11, "c3": 19}, {"c1": "แนะแนว", "c2": 3, "c3": 16}, {"c1": "รวม", "c2": 87, "c3": ""}]}', NULL, NOW());

-- [4] การพัฒนาครูและบุคลากร
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 4, 'การพัฒนาครูและบุคลากร', 'table', 'term', '[{"key": "c1", "label": "รูปแบบการพัฒนา", "type": "text"}, {"key": "c2", "label": "จำนวนครูที่เข้าร่วม", "type": "number"}, {"key": "c3", "label": "ชั่วโมงเฉลี่ย/คน", "type": "number"}]', 5 FROM departments WHERE code = 'personnel';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "อบรม/สัมมนาภายนอก", "c2": 64, "c3": 18}, {"c1": "อบรมภายในโรงเรียน", "c2": 87, "c3": 12}, {"c1": "ชุมชนการเรียนรู้ทางวิชาชีพ (PLC)", "c2": 87, "c3": 50}, {"c1": "ศึกษาดูงาน", "c2": 35, "c3": 8}]}', NULL, NOW());

-- [5] จำนวนนักเรียนแยกตามระดับชั้น
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 5, 'จำนวนนักเรียนแยกตามระดับชั้น', 'table', 'term', '[{"key": "c1", "label": "ระดับชั้น", "type": "text"}, {"key": "c2", "label": "ห้องเรียน", "type": "number"}, {"key": "c3", "label": "ชาย", "type": "number"}, {"key": "c4", "label": "หญิง", "type": "number"}, {"key": "c5", "label": "รวม", "type": "number"}]', 1 FROM departments WHERE code = 'academic';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "ม.1", "c2": 12, "c3": 236, "c4": 251, "c5": 487}, {"c1": "ม.2", "c2": 12, "c3": 228, "c4": 262, "c5": 490}, {"c1": "ม.3", "c2": 12, "c3": 240, "c4": 247, "c5": 487}, {"c1": "ม.4", "c2": 10, "c3": 170, "c4": 231, "c5": 401}, {"c1": "ม.5", "c2": 10, "c3": 162, "c4": 226, "c5": 388}, {"c1": "ม.6", "c2": 10, "c3": 158, "c4": 219, "c5": 377}, {"c1": "รวม", "c2": 66, "c3": 1194, "c4": 1436, "c5": 2630}]}', NULL, NOW());

-- [5] นักเรียนที่จบการศึกษาและการศึกษาต่อ
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 5, 'นักเรียนที่จบการศึกษาและการศึกษาต่อ', 'table', 'year', '[{"key": "c1", "label": "ระดับชั้น", "type": "text"}, {"key": "c2", "label": "จำนวนผู้จบ", "type": "number"}, {"key": "c3", "label": "ศึกษาต่อ", "type": "number"}, {"key": "c4", "label": "ประกอบอาชีพ", "type": "number"}, {"key": "c5", "label": "อื่น ๆ", "type": "number"}]', 2 FROM departments WHERE code = 'academic';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"rows": [{"c1": "ม.3", "c2": 481, "c3": 468, "c4": 7, "c5": 6}, {"c1": "ม.6", "c2": 372, "c3": 329, "c4": 31, "c5": 12}, {"c1": "รวม", "c2": 853, "c3": 797, "c4": 38, "c5": 18}]}', NULL, NOW());

-- [5] สถิติการมาเรียนของนักเรียน
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 5, 'สถิติการมาเรียนของนักเรียน', 'table', 'term', '[{"key": "c1", "label": "ระดับชั้น", "type": "text"}, {"key": "c2", "label": "มาสาย (ครั้ง)", "type": "number"}, {"key": "c3", "label": "ลา (ครั้ง)", "type": "number"}, {"key": "c4", "label": "ขาดเรียน (ครั้ง)", "type": "number"}]', 6 FROM departments WHERE code = 'personnel';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "ม.1", "c2": 312, "c3": 540, "c4": 88}, {"c1": "ม.2", "c2": 355, "c3": 512, "c4": 97}, {"c1": "ม.3", "c2": 401, "c3": 498, "c4": 120}, {"c1": "ม.4", "c2": 240, "c3": 430, "c4": 61}, {"c1": "ม.5", "c2": 268, "c3": 415, "c4": 72}, {"c1": "ม.6", "c2": 290, "c3": 402, "c4": 85}, {"c1": "รวม", "c2": 1866, "c3": 2797, "c4": 523}]}', NULL, NOW());

-- [5] การเยี่ยมบ้านนักเรียน
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 5, 'การเยี่ยมบ้านนักเรียน', 'table', 'term', '[{"key": "c1", "label": "ระดับชั้น", "type": "text"}, {"key": "c2", "label": "จำนวนนักเรียน", "type": "number"}, {"key": "c3", "label": "เยี่ยมบ้านแล้ว", "type": "number"}, {"key": "c4", "label": "ร้อยละ", "type": "number"}]', 7 FROM departments WHERE code = 'personnel';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "ม.1", "c2": 487, "c3": 487, "c4": 100.0}, {"c1": "ม.2", "c2": 490, "c3": 488, "c4": 99.59}, {"c1": "ม.3", "c2": 487, "c3": 480, "c4": 98.56}, {"c1": "ม.4", "c2": 401, "c3": 401, "c4": 100.0}, {"c1": "ม.5", "c2": 388, "c3": 385, "c4": 99.23}, {"c1": "ม.6", "c2": 377, "c3": 370, "c4": 98.14}, {"c1": "รวม", "c2": 2630, "c3": 2611, "c4": 99.28}]}', NULL, NOW());

-- [6] แผนการเรียนที่เปิดสอน
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 6, 'แผนการเรียนที่เปิดสอน', 'table', 'year', '[{"key": "c1", "label": "แผนการเรียน/ห้องเรียน", "type": "text"}, {"key": "c2", "label": "ระดับ", "type": "text"}, {"key": "c3", "label": "จำนวนห้อง", "type": "number"}]', 3 FROM departments WHERE code = 'academic';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"rows": [{"c1": "(ตัวอย่าง) ห้องเรียนทั่วไป", "c2": "ม.ต้น", "c3": 30}, {"c1": "(ตัวอย่าง) ห้องเรียนพิเศษวิทยาศาสตร์–คณิตศาสตร์", "c2": "ม.ต้น", "c3": 6}, {"c1": "(ตัวอย่าง) วิทยาศาสตร์–คณิตศาสตร์", "c2": "ม.ปลาย", "c3": 12}, {"c1": "(ตัวอย่าง) ภาษา", "c2": "ม.ปลาย", "c3": 9}, {"c1": "(ตัวอย่าง) ศิลป์–สังคม/อาชีพ", "c2": "ม.ปลาย", "c3": 9}, {"c1": "รวม", "c2": null, "c3": 66}]}', NULL, NOW());

-- [6] แหล่งเรียนรู้ภายในโรงเรียน
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 6, 'แหล่งเรียนรู้ภายในโรงเรียน', 'table', 'term', '[{"key": "c1", "label": "แหล่งเรียนรู้ภายในโรงเรียน", "type": "text"}, {"key": "c2", "label": "จำนวนครั้งที่ใช้/ภาคเรียน", "type": "number"}]', 4 FROM departments WHERE code = 'academic';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "ห้องสมุด", "c2": 1840}, {"c1": "ห้องปฏิบัติการวิทยาศาสตร์", "c2": 620}, {"c1": "ห้องคอมพิวเตอร์", "c2": 910}, {"c1": "สวนพฤกษศาสตร์โรงเรียน", "c2": 85}, {"c1": "ห้องดนตรี", "c2": 240}]}', NULL, NOW());

-- [6] แหล่งเรียนรู้และภูมิปัญญาท้องถิ่น
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 6, 'แหล่งเรียนรู้และภูมิปัญญาท้องถิ่น', 'table', 'term', '[{"key": "c1", "label": "แหล่งเรียนรู้ภายนอก", "type": "text"}, {"key": "c2", "label": "ประเภท", "type": "text"}, {"key": "c3", "label": "จำนวนครั้ง", "type": "number"}]', 5 FROM departments WHERE code = 'academic';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "(ตัวอย่าง) วัดในชุมชน", "c2": "ศาสนา/วัฒนธรรม", "c3": 6}, {"c1": "(ตัวอย่าง) ศูนย์เรียนรู้เกษตร", "c2": "อาชีพ", "c3": 4}, {"c1": "(ตัวอย่าง) พิพิธภัณฑ์ท้องถิ่น", "c2": "ประวัติศาสตร์", "c3": 3}, {"c1": "(ตัวอย่าง) ปราชญ์ชาวบ้านด้านหัตถกรรม", "c2": "ภูมิปัญญา", "c3": 5}]}', NULL, NOW());

-- [7] อาคารเรียนและอาคารประกอบ
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 7, 'อาคารเรียนและอาคารประกอบ', 'table', 'year', '[{"key": "c1", "label": "อาคาร", "type": "text"}, {"key": "c2", "label": "จำนวนชั้น", "type": "number"}, {"key": "c3", "label": "จำนวนห้อง", "type": "number"}, {"key": "c4", "label": "การใช้งาน", "type": "text"}]', 11 FROM departments WHERE code = 'general';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"rows": [{"c1": "อาคาร 1", "c2": 4, "c3": 24, "c4": "ห้องเรียน ม.ต้น"}, {"c1": "อาคาร 2", "c2": 4, "c3": 20, "c4": "ห้องเรียน ม.ปลาย"}, {"c1": "อาคาร 3", "c2": 3, "c3": 12, "c4": "ห้องปฏิบัติการ"}, {"c1": "หอประชุม", "c2": 1, "c3": 1, "c4": "ประชุมและกิจกรรม"}, {"c1": "โรงอาหาร", "c2": 1, "c3": 1, "c4": "บริการอาหาร"}, {"c1": "โรงฝึกงาน", "c2": 1, "c3": 4, "c4": "การงานอาชีพ"}]}', NULL, NOW());

-- [7] ห้องพิเศษและห้องปฏิบัติการ
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 7, 'ห้องพิเศษและห้องปฏิบัติการ', 'table', 'year', '[{"key": "c1", "label": "ห้องพิเศษ/ห้องปฏิบัติการ", "type": "text"}, {"key": "c2", "label": "จำนวนห้อง", "type": "number"}]', 12 FROM departments WHERE code = 'general';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"rows": [{"c1": "ห้องปฏิบัติการวิทยาศาสตร์", "c2": 6}, {"c1": "ห้องคอมพิวเตอร์", "c2": 4}, {"c1": "ห้องสมุด", "c2": 1}, {"c1": "ห้องดนตรี/นาฏศิลป์", "c2": 3}, {"c1": "ห้องแนะแนว", "c2": 1}, {"c1": "ห้องพยาบาล", "c2": 1}, {"c1": "รวม", "c2": 16}]}', NULL, NOW());

-- [7] ระบบสาธารณูปโภคและเทคโนโลยี
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 7, 'ระบบสาธารณูปโภคและเทคโนโลยี', 'table', 'year', '[{"key": "c1", "label": "รายการ", "type": "text"}, {"key": "c2", "label": "จำนวน", "type": "number"}, {"key": "c3", "label": "หมายเหตุ", "type": "text"}]', 13 FROM departments WHERE code = 'general';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"rows": [{"c1": "เครื่องคอมพิวเตอร์สำหรับนักเรียน", "c2": 160, "c3": "(ตัวอย่าง)"}, {"c1": "จุดกระจายสัญญาณ Wi-Fi", "c2": 45, "c3": "(ตัวอย่าง)"}, {"c1": "ห้องเรียนที่มีจอโปรเจกเตอร์/ทีวี", "c2": 58, "c3": "(ตัวอย่าง)"}, {"c1": "ระบบผลิตไฟฟ้าโซลาร์เซลล์", "c2": 1, "c3": "(ตัวอย่าง)"}]}', NULL, NOW());

-- [8] งบประมาณที่ได้รับแยกตามหมวด
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 8, 'งบประมาณที่ได้รับแยกตามหมวด', 'table', 'year', '[{"key": "c1", "label": "หมวดงบประมาณ", "type": "text"}, {"key": "c2", "label": "จำนวนเงิน (บาท)", "type": "number"}]', 5 FROM departments WHERE code = 'budget';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"rows": [{"c1": "เงินอุดหนุนรายหัว", "c2": 4850000}, {"c1": "โครงการเรียนฟรี 15 ปี", "c2": 2310000}, {"c1": "กิจกรรมพัฒนาคุณภาพผู้เรียน", "c2": 1120000}, {"c1": "เงินรายได้สถานศึกษา", "c2": 640000}, {"c1": "รวม", "c2": 8920000}]}', NULL, NOW());

-- [8] การใช้งบประมาณแยกตามกลุ่มบริหาร
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 8, 'การใช้งบประมาณแยกตามกลุ่มบริหาร', 'table', 'term', '[{"key": "c1", "label": "กลุ่มบริหาร", "type": "text"}, {"key": "c2", "label": "ได้รับจัดสรร (บาท)", "type": "number"}, {"key": "c3", "label": "ใช้ไป (บาท)", "type": "number"}, {"key": "c4", "label": "คงเหลือ (บาท)", "type": "number"}]', 6 FROM departments WHERE code = 'budget';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "วิชาการ", "c2": 2400000, "c3": 1180000, "c4": 1220000}, {"c1": "งบประมาณ", "c2": 900000, "c3": 410000, "c4": 490000}, {"c1": "บุคคล", "c2": 1100000, "c3": 560000, "c4": 540000}, {"c1": "ทั่วไป", "c2": 2100000, "c3": 1050000, "c4": 1050000}, {"c1": "งบกลาง", "c2": 1500000, "c3": 640000, "c4": 860000}, {"c1": "รวม", "c2": 8000000, "c3": 3840000, "c4": 4160000}]}', NULL, NOW());

-- [8] สรุปการใช้งบประมาณ
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 8, 'สรุปการใช้งบประมาณ', 'text', 'term', NULL, 7 FROM departments WHERE code = 'budget';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"text": "[ตัวอย่าง] ภาคเรียนนี้ใช้งบประมาณไปแล้วร้อยละ 45 ของงบที่จัดสรร ส่วนใหญ่เป็นค่าวัสดุการเรียนการสอนและค่าสาธารณูปโภค\\n[ตัวอย่าง] งบที่เหลือจัดสรรไว้สำหรับกิจกรรมพัฒนาผู้เรียนในภาคเรียนที่ 2 ตามแผนปฏิบัติการประจำปี"}', NULL, NOW());

-- [9] ผลสัมฤทธิ์ทางการเรียนแยกตามกลุ่มสาระ
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 9, 'ผลสัมฤทธิ์ทางการเรียนแยกตามกลุ่มสาระ', 'table', 'term', '[{"key": "c1", "label": "กลุ่มสาระการเรียนรู้", "type": "text"}, {"key": "c2", "label": "ผลการเรียนเฉลี่ย", "type": "number"}, {"key": "c3", "label": "ร้อยละระดับ 3 ขึ้นไป", "type": "number"}]', 6 FROM departments WHERE code = 'academic';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "ภาษาไทย", "c2": 2.91, "c3": 62.4}, {"c1": "คณิตศาสตร์", "c2": 2.48, "c3": 45.1}, {"c1": "วิทยาศาสตร์และเทคโนโลยี", "c2": 2.67, "c3": 51.8}, {"c1": "สังคมศึกษา ศาสนา และวัฒนธรรม", "c2": 3.02, "c3": 66.3}, {"c1": "สุขศึกษาและพลศึกษา", "c2": 3.41, "c3": 80.2}, {"c1": "ศิลปะ", "c2": 3.25, "c3": 74.6}, {"c1": "การงานอาชีพ", "c2": 3.18, "c3": 71.9}, {"c1": "ภาษาต่างประเทศ", "c2": 2.73, "c3": 54.7}]}', NULL, NOW());

-- [9] ผลการประเมินคุณลักษณะอันพึงประสงค์
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 9, 'ผลการประเมินคุณลักษณะอันพึงประสงค์', 'table', 'term', '[{"key": "c1", "label": "ระดับคุณภาพ", "type": "text"}, {"key": "c2", "label": "จำนวนนักเรียน", "type": "number"}, {"key": "c3", "label": "ร้อยละ", "type": "number"}]', 7 FROM departments WHERE code = 'academic';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "ดีเยี่ยม", "c2": 1602, "c3": 60.91}, {"c1": "ดี", "c2": 742, "c3": 28.21}, {"c1": "ผ่าน", "c2": 252, "c3": 9.58}, {"c1": "ไม่ผ่าน", "c2": 34, "c3": 1.29}, {"c1": "รวม", "c2": 2630, "c3": 100}]}', NULL, NOW());

-- [9] ผลการประเมินการอ่าน คิดวิเคราะห์ และเขียน
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 9, 'ผลการประเมินการอ่าน คิดวิเคราะห์ และเขียน', 'table', 'term', '[{"key": "c1", "label": "ระดับคุณภาพ", "type": "text"}, {"key": "c2", "label": "จำนวนนักเรียน", "type": "number"}, {"key": "c3", "label": "ร้อยละ", "type": "number"}]', 8 FROM departments WHERE code = 'academic';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "ดีเยี่ยม", "c2": 1180, "c3": 44.87}, {"c1": "ดี", "c2": 958, "c3": 36.43}, {"c1": "ผ่าน", "c2": 431, "c3": 16.39}, {"c1": "ไม่ผ่าน", "c2": 61, "c3": 2.32}, {"c1": "รวม", "c2": 2630, "c3": 100}]}', NULL, NOW());

-- [9] ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 3
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 9, 'ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 3', 'table', 'year', '[{"key": "c1", "label": "วิชา", "type": "text"}, {"key": "c2", "label": "คะแนนเฉลี่ยโรงเรียน", "type": "number"}, {"key": "c3", "label": "คะแนนเฉลี่ยระดับประเทศ", "type": "number"}]', 9 FROM departments WHERE code = 'academic';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"rows": [{"c1": "ภาษาไทย", "c2": 56.12, "c3": 54.3}, {"c1": "คณิตศาสตร์", "c2": 27.85, "c3": 26.9}, {"c1": "วิทยาศาสตร์", "c2": 33.4, "c3": 32.1}, {"c1": "ภาษาอังกฤษ", "c2": 33.06, "c3": 31.8}]}', NULL, NOW());

-- [9] ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 6
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 9, 'ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 6', 'table', 'year', '[{"key": "c1", "label": "วิชา", "type": "text"}, {"key": "c2", "label": "คะแนนเฉลี่ยโรงเรียน", "type": "number"}, {"key": "c3", "label": "คะแนนเฉลี่ยระดับประเทศ", "type": "number"}]', 10 FROM departments WHERE code = 'academic';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"rows": [{"c1": "ภาษาไทย", "c2": 48.25, "c3": 47.1}, {"c1": "คณิตศาสตร์", "c2": 23.4, "c3": 22.8}, {"c1": "วิทยาศาสตร์", "c2": 29.15, "c3": 28.6}, {"c1": "สังคมศึกษา", "c2": 36.7, "c3": 35.9}, {"c1": "ภาษาอังกฤษ", "c2": 30.95, "c3": 29.5}]}', NULL, NOW());

-- [9] ผลการประเมินตนเองของสถานศึกษา (SAR)
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 9, 'ผลการประเมินตนเองของสถานศึกษา (SAR)', 'table', 'year', '[{"key": "c1", "label": "มาตรฐานการศึกษา", "type": "text"}, {"key": "c2", "label": "ระดับคุณภาพ", "type": "text"}]', 11 FROM departments WHERE code = 'academic';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 0, '{"rows": [{"c1": "มาตรฐานที่ 1 คุณภาพของผู้เรียน", "c2": "(ตัวอย่าง) ดีเลิศ"}, {"c1": "มาตรฐานที่ 2 กระบวนการบริหารและการจัดการ", "c2": "(ตัวอย่าง) ยอดเยี่ยม"}, {"c1": "มาตรฐานที่ 3 กระบวนการจัดการเรียนการสอนที่เน้นผู้เรียนเป็นสำคัญ", "c2": "(ตัวอย่าง) ดีเลิศ"}]}', NULL, NOW());

-- [10] รางวัลของโรงเรียน
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 10, 'รางวัลของโรงเรียน', 'table', 'term', '[{"key": "c1", "label": "ระดับ", "type": "text"}, {"key": "c2", "label": "ชื่อรางวัล/ผลงาน", "type": "text"}, {"key": "c3", "label": "หน่วยงานที่มอบ", "type": "text"}]', 14 FROM departments WHERE code = 'general';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "ระดับชาติ", "c2": "(ตัวอย่าง) รางวัลสถานศึกษาปลอดภัย", "c3": "(ตัวอย่าง) หน่วยงานส่วนกลาง"}, {"c1": "ระดับเขตพื้นที่", "c2": "(ตัวอย่าง) โรงเรียนต้นแบบการจัดการเรียนรู้", "c3": "(ตัวอย่าง) สำนักงานเขตพื้นที่ฯ"}]}', NULL, NOW());

-- [10] รางวัลของครูและบุคลากร
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 10, 'รางวัลของครูและบุคลากร', 'table', 'term', '[{"key": "c1", "label": "ระดับ", "type": "text"}, {"key": "c2", "label": "ชื่อ–สกุล", "type": "text"}, {"key": "c3", "label": "ชื่อรางวัล/ผลงาน", "type": "text"}, {"key": "c4", "label": "หน่วยงานที่มอบ", "type": "text"}]', 8 FROM departments WHERE code = 'personnel';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "ระดับชาติ", "c2": "ครู (ตัวอย่าง) 1", "c3": "(ตัวอย่าง) ครูดีเด่น", "c4": "(ตัวอย่าง) หน่วยงานส่วนกลาง"}, {"c1": "ระดับภาค", "c2": "ครู (ตัวอย่าง) 2", "c3": "(ตัวอย่าง) นวัตกรรมการสอนดีเด่น", "c4": "(ตัวอย่าง) หน่วยงานระดับภาค"}, {"c1": "ระดับเขตพื้นที่", "c2": "ครู (ตัวอย่าง) 3", "c3": "(ตัวอย่าง) ผู้ฝึกสอนนักเรียนได้รับรางวัล", "c4": "(ตัวอย่าง) สำนักงานเขตพื้นที่ฯ"}]}', NULL, NOW());

-- [10] รางวัลของนักเรียน
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 10, 'รางวัลของนักเรียน', 'table', 'term', '[{"key": "c1", "label": "ระดับ", "type": "text"}, {"key": "c2", "label": "รายการแข่งขัน", "type": "text"}, {"key": "c3", "label": "ผลที่ได้", "type": "text"}, {"key": "c4", "label": "จำนวนนักเรียน", "type": "number"}]', 12 FROM departments WHERE code = 'academic';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "ระดับชาติ", "c2": "(ตัวอย่าง) แข่งขันทักษะวิชาการ", "c3": "เหรียญทอง", "c4": 3}, {"c1": "ระดับภาค", "c2": "(ตัวอย่าง) แข่งขันหุ่นยนต์", "c3": "ชนะเลิศ", "c4": 4}, {"c1": "ระดับเขตพื้นที่", "c2": "(ตัวอย่าง) ประกวดเรียงความ", "c3": "รองชนะเลิศอันดับ 1", "c4": 1}, {"c1": "ระดับเขตพื้นที่", "c2": "(ตัวอย่าง) แข่งขันกีฬา", "c3": "เหรียญเงิน", "c4": 12}]}', NULL, NOW());

-- [10] สรุปจำนวนรางวัลแยกตามระดับ
INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, sort_order) SELECT id, 10, 'สรุปจำนวนรางวัลแยกตามระดับ', 'table', 'term', '[{"key": "c1", "label": "ระดับ", "type": "text"}, {"key": "c2", "label": "จำนวนรางวัลของโรงเรียน", "type": "number"}, {"key": "c3", "label": "จำนวนรางวัลของครู", "type": "number"}, {"key": "c4", "label": "จำนวนรางวัลของนักเรียน", "type": "number"}]', 15 FROM departments WHERE code = 'general';
INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (LAST_INSERT_ID(), 2569, 1, '{"rows": [{"c1": "ระดับนานาชาติ", "c2": 0, "c3": 0, "c4": 1}, {"c1": "ระดับชาติ", "c2": 1, "c3": 2, "c4": 6}, {"c1": "ระดับภาค", "c2": 0, "c3": 4, "c4": 11}, {"c1": "ระดับเขตพื้นที่", "c2": 2, "c3": 9, "c4": 28}, {"c1": "รวม", "c2": 3, "c3": 15, "c4": 46}]}', NULL, NOW());
