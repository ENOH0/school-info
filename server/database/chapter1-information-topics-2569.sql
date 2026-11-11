SET NAMES utf8mb4;
START TRANSACTION;

-- ฐานเซิร์ฟเวอร์รุ่นเก่าอาจยังไม่มีคอลัมน์นี้ แต่ API ปัจจุบันจำเป็นต้องใช้
ALTER TABLE records
ADD COLUMN IF NOT EXISTS updated_by INT(10) UNSIGNED DEFAULT NULL AFTER data_json;

-- ปรับหัวข้อเดิมให้ตรงกับรายการสารสนเทศบทที่ 1 โดยรักษา id และข้อมูลย้อนหลังไว้
UPDATE topics SET title='ข้อมูลพื้นฐานโรงเรียน', kind='text', frequency='year', columns_json=NULL, chart_json=NULL, sort_order=1
WHERE department_id=4 AND chapter=1 AND title='ข้อมูลพื้นฐานของโรงเรียน';

UPDATE topics SET sort_order=2
WHERE department_id=4 AND chapter=1 AND title='ประวัติโรงเรียน';

UPDATE topics SET title='ข้อมูลสภาพชุมชนโดยรวม', kind='text', frequency='year', columns_json=NULL, chart_json=NULL, sort_order=3
WHERE department_id=4 AND chapter=1 AND title='สภาพชุมชนรอบโรงเรียน';

UPDATE topics SET title='ตราสัญลักษณ์ สี ธง ดอกไม้ประจำโรงเรียน และเอกลักษณ์ประจำตัวนักเรียน', kind='table', frequency='year',
columns_json='[{"key":"c1","label":"รายการ","type":"text"},{"key":"c2","label":"รายละเอียด","type":"text"}]', chart_json=NULL, sort_order=4
WHERE department_id=4 AND chapter=1 AND title='สัญลักษณ์ประจำโรงเรียน';

-- สองหัวข้อนี้เดิมเป็นข้อมูลตัวอย่างของปี 2569 จึงนำ id เดิมมาใช้กับหัวข้อที่ต้องการ
UPDATE topics SET title='ข้อมูลระบบการจัดการศึกษา', kind='text', frequency='year', columns_json=NULL, chart_json=NULL, sort_order=7
WHERE department_id=4 AND chapter=1 AND title='คำชี้แจง';

UPDATE topics SET title='ประเภทและลักษณะโรงเรียน', kind='text', frequency='year', columns_json=NULL, chart_json=NULL, sort_order=16
WHERE department_id=4 AND chapter=1 AND title='เพลงประจำโรงเรียน';

-- เพิ่มหัวข้อที่ยังไม่มี โดยนำเข้าไฟล์นี้ซ้ำได้โดยไม่สร้างหัวข้อซ้ำ
INSERT INTO topics (department_id,chapter,title,kind,frequency,columns_json,chart_json,sort_order)
SELECT 4,1,'คำขวัญ คติธรรม วิสัยทัศน์ พันธกิจ เป้าประสงค์ กลยุทธ์ระดับองค์กร อัตลักษณ์ เอกลักษณ์ ปณิธาน จุดเน้น และจุดเด่นของโรงเรียน','text','year',NULL,NULL,5
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE department_id=4 AND chapter=1 AND title='คำขวัญ คติธรรม วิสัยทัศน์ พันธกิจ เป้าประสงค์ กลยุทธ์ระดับองค์กร อัตลักษณ์ เอกลักษณ์ ปณิธาน จุดเน้น และจุดเด่นของโรงเรียน');

INSERT INTO topics (department_id,chapter,title,kind,frequency,columns_json,chart_json,sort_order)
SELECT 4,1,'ขนาดและเนื้อที่ของสถานศึกษา','table','year','[{"key":"c1","label":"รายการ","type":"text"},{"key":"c2","label":"จำนวน","type":"number"},{"key":"c3","label":"หน่วย","type":"text"}]',NULL,6
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE department_id=4 AND chapter=1 AND title='ขนาดและเนื้อที่ของสถานศึกษา');

INSERT INTO topics (department_id,chapter,title,kind,frequency,columns_json,chart_json,sort_order)
SELECT 4,1,'ข้อมูลเกี่ยวกับการเปิดสอน','table','year','[{"key":"c1","label":"ระดับการศึกษา","type":"text"},{"key":"c2","label":"ระดับชั้น","type":"text"},{"key":"c3","label":"จำนวนห้องเรียน","type":"number"},{"key":"c4","label":"รายละเอียด","type":"text"}]','{"type":"bar","series":["c3"],"trend":false}',8
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE department_id=4 AND chapter=1 AND title='ข้อมูลเกี่ยวกับการเปิดสอน');

INSERT INTO topics (department_id,chapter,title,kind,frequency,columns_json,chart_json,sort_order)
SELECT 4,1,'ข้อมูลอาคารและสถานที่','table','year','[{"key":"c1","label":"ประเภทอาคารหรือสถานที่","type":"text"},{"key":"c2","label":"จำนวน","type":"number"},{"key":"c3","label":"หน่วยหรือรายละเอียด","type":"text"}]','{"type":"bar","series":["c2"],"trend":false}',9
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE department_id=4 AND chapter=1 AND title='ข้อมูลอาคารและสถานที่');

INSERT INTO topics (department_id,chapter,title,kind,frequency,columns_json,chart_json,sort_order)
SELECT 4,1,'ข้อมูลห้องเรียน','table','year','[{"key":"c1","label":"ประเภทห้องเรียน","type":"text"},{"key":"c2","label":"จำนวนห้องเรียน","type":"number"},{"key":"c3","label":"รายละเอียด","type":"text"}]','{"type":"bar","series":["c2"],"trend":false}',10
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE department_id=4 AND chapter=1 AND title='ข้อมูลห้องเรียน');

INSERT INTO topics (department_id,chapter,title,kind,frequency,columns_json,chart_json,sort_order)
SELECT 4,1,'สาธารณูปโภค','table','year','[{"key":"c1","label":"ระบบหรืออุปกรณ์","type":"text"},{"key":"c2","label":"จำนวน","type":"number"},{"key":"c3","label":"รายละเอียด","type":"text"}]','{"type":"bar","series":["c2"],"trend":false}',11
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE department_id=4 AND chapter=1 AND title='สาธารณูปโภค');

INSERT INTO topics (department_id,chapter,title,kind,frequency,columns_json,chart_json,sort_order)
SELECT 4,1,'ประเภทแหล่งน้ำในโรงเรียน','table','year','[{"key":"c1","label":"ประเภทแหล่งน้ำหรืออุปกรณ์","type":"text"},{"key":"c2","label":"จำนวน","type":"number"},{"key":"c3","label":"รายละเอียด","type":"text"}]',NULL,12
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE department_id=4 AND chapter=1 AND title='ประเภทแหล่งน้ำในโรงเรียน');

INSERT INTO topics (department_id,chapter,title,kind,frequency,columns_json,chart_json,sort_order)
SELECT 4,1,'ผู้ให้บริการโทรศัพท์ โทรสารและอินเทอร์เน็ต','text','year',NULL,NULL,13
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE department_id=4 AND chapter=1 AND title='ผู้ให้บริการโทรศัพท์ โทรสารและอินเทอร์เน็ต');

INSERT INTO topics (department_id,chapter,title,kind,frequency,columns_json,chart_json,sort_order)
SELECT 4,1,'เขตบริการของโรงเรียน','table','year','[{"key":"c1","label":"ลำดับ","type":"number"},{"key":"c2","label":"ตำบลในเขตบริการ","type":"text"}]',NULL,14
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE department_id=4 AND chapter=1 AND title='เขตบริการของโรงเรียน');

INSERT INTO topics (department_id,chapter,title,kind,frequency,columns_json,chart_json,sort_order)
SELECT 4,1,'ลักษณะที่ดิน ขนาดและประเภทกรรมสิทธิ์การถือครองที่ดิน','text','year',NULL,NULL,15
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE department_id=4 AND chapter=1 AND title='ลักษณะที่ดิน ขนาดและประเภทกรรมสิทธิ์การถือครองที่ดิน');

INSERT INTO topics (department_id,chapter,title,kind,frequency,columns_json,chart_json,sort_order)
SELECT 4,1,'วิสัยทัศน์โรงเรียน','text','year',NULL,NULL,17
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE department_id=4 AND chapter=1 AND title='วิสัยทัศน์โรงเรียน');

INSERT INTO topics (department_id,chapter,title,kind,frequency,columns_json,chart_json,sort_order)
SELECT 4,1,'พันธกิจโรงเรียน','text','year',NULL,NULL,18
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE department_id=4 AND chapter=1 AND title='พันธกิจโรงเรียน');

INSERT INTO topics (department_id,chapter,title,kind,frequency,columns_json,chart_json,sort_order)
SELECT 4,1,'เป้าประสงค์โรงเรียน','text','year',NULL,NULL,19
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE department_id=4 AND chapter=1 AND title='เป้าประสงค์โรงเรียน');

INSERT INTO topics (department_id,chapter,title,kind,frequency,columns_json,chart_json,sort_order)
SELECT 4,1,'กลยุทธ์โรงเรียน','text','year',NULL,NULL,20
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE department_id=4 AND chapter=1 AND title='กลยุทธ์โรงเรียน');

-- ข้อมูลจริงที่พบในเล่ม 5 ด้าน สำหรับปีปัจจุบัน 2569
INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('text','โรงเรียนสันทรายวิทยาคม ตั้งอยู่เลขที่ 207 หมู่ที่ 10 ถนนเชียงใหม่-พร้าว ตำบลหนองหาร อำเภอสันทราย จังหวัดเชียงใหม่ รหัสไปรษณีย์ 50291 โทรศัพท์ 053-353872 และ 086-4294794 อีเมล sansaiwit@gmail.com เว็บไซต์ http://www.sansai.ac.th สังกัดสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาเชียงใหม่ สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน กระทรวงศึกษาธิการ เปิดสอนระดับชั้นมัธยมศึกษาปีที่ 1 ถึงมัธยมศึกษาปีที่ 6'),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='ข้อมูลพื้นฐานโรงเรียน'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('text','โรงเรียนสันทรายวิทยาคมก่อตั้งเมื่อวันที่ 14 มิถุนายน พ.ศ. 2516 ตามประกาศกรมสามัญศึกษา โดยได้รับอนุญาตให้ใช้พื้นที่ของสหกรณ์เป็นสถานที่ตั้งโรงเรียน เปิดสอนครั้งแรกในระดับชั้นมัธยมศึกษาปีที่ 1 จำนวน 2 ห้องเรียน มีนักเรียน 99 คน ในระยะแรกยังไม่มีอาคารเรียนถาวร ชุมชนได้ร่วมบริจาควัสดุและแรงงานสร้างอาคารเรียนชั่วคราวขนาด 2 ห้องเรียน และเปิดใช้เมื่อวันที่ 17 มิถุนายน พ.ศ. 2516 ต่อมาโรงเรียนพัฒนาการจัดการศึกษาและระบบประกันคุณภาพอย่างต่อเนื่อง ได้รับรางวัลและการยอมรับหลายรายการ รวมทั้งเป็นโรงเรียนมาตรฐานสากลระดับ SCQA ผ่านเกณฑ์ OBECQA และได้รับรางวัล IQA AWARD'),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='ประวัติโรงเรียน'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('text','ชุมชนรอบโรงเรียนมีลักษณะกึ่งเมืองกึ่งชนบท เป็นชุมชนของชนพื้นราบ ประชากรอำเภอสันทรายตามข้อมูลปี 2567 ประมาณ 145,595 คน มีเด็กในวัยเรียนประมาณ 26,028 คน อาชีพสำคัญคือเกษตรกรรมและรับจ้าง ประชาชนส่วนใหญ่นับถือศาสนาพุทธ โรงเรียนได้รับความร่วมมือจากมหาวิทยาลัยแม่โจ้ ชุมชน ผู้ปกครอง และหน่วยงานราชการในท้องถิ่นในการพัฒนาการศึกษา การคมนาคมสะดวกและมีสาธารณูปโภคสนับสนุนการดำเนินชีวิต'),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='ข้อมูลสภาพชุมชนโดยรวม'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('rows',JSON_ARRAY(
 JSON_OBJECT('c1','ตราสัญลักษณ์ประจำโรงเรียน','c2','ประกอบด้วยพญานาคคู่ หมายถึงน้ำ ความอุดมสมบูรณ์และครูผู้ให้ชีวิต ความรู้และความรักแก่ศิษย์ และดอกบานชื่น หมายถึงนักเรียนผู้เบิกบานสดชื่น พร้อมนำความรู้ไปใช้ให้เกิดประโยชน์'),
 JSON_OBJECT('c1','อักษรย่อ','c2','ส.ค.'),
 JSON_OBJECT('c1','สีประจำโรงเรียน','c2','น้ำเงิน-ขาว สีน้ำเงินหมายถึงความเข้มแข็ง ความอดทนและความหนักแน่น สีขาวหมายถึงความบริสุทธิ์ แสงสว่างและแสงแห่งปัญญา'),
 JSON_OBJECT('c1','ธงประจำโรงเรียน','c2',''),
 JSON_OBJECT('c1','ดอกไม้ประจำโรงเรียน','c2','เอกสารระบุดอกบานชื่นเป็นส่วนหนึ่งของตราสัญลักษณ์ แต่ยังไม่พบการยืนยันว่าเป็นดอกไม้ประจำโรงเรียนอย่างเป็นทางการ'),
 JSON_OBJECT('c1','อัตลักษณ์ของลูกสันทราย','c2','ยิ้ม ไหว้ ทักทาย สุภาพอ่อนน้อม แต่งกายดี มีจิตสาธารณะ')
)),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='ตราสัญลักษณ์ สี ธง ดอกไม้ประจำโรงเรียน และเอกลักษณ์ประจำตัวนักเรียน'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('text','ปรัชญา: วิชาเป็นเลิศ เทิดคุณธรรม นำสามัคคี\n\nวัฒนธรรมองค์กร: ผู้บริหาร ครู บุคลากร และนักเรียน รักสามัคคี ศรัทธาและภูมิใจในสถาบัน ตามวิถีสันทราย\n\nวิถีสันทรายและอัตลักษณ์ของลูกสันทราย: ยิ้ม ไหว้ ทักทาย สุภาพอ่อนน้อม แต่งกายดี มีจิตสาธารณะ\n\nค่านิยม: องค์กรแห่งอนาคต\n\nเอกลักษณ์: สภาพแวดล้อมเอื้อต่อการจัดการเรียนรู้ มีมหาวิทยาลัยแม่โจ้เป็นแหล่งเรียนรู้ และได้รับความร่วมมือจากชุมชน ผู้ปกครองและหน่วยงานในท้องถิ่น\n\nจุดเด่น: ใช้ข้อมูลจริงและการมีส่วนร่วมเป็นฐานในการกำหนดมาตรฐานและพัฒนาคุณภาพสถานศึกษา'),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='คำขวัญ คติธรรม วิสัยทัศน์ พันธกิจ เป้าประสงค์ กลยุทธ์ระดับองค์กร อัตลักษณ์ เอกลักษณ์ ปณิธาน จุดเน้น และจุดเด่นของโรงเรียน'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('rows',JSON_ARRAY(
 JSON_OBJECT('c1','ไร่','c2',35,'c3','ไร่'),
 JSON_OBJECT('c1','งาน','c2',2,'c3','งาน'),
 JSON_OBJECT('c1','ตารางวา','c2',5,'c3','ตารางวา')
)),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='ขนาดและเนื้อที่ของสถานศึกษา'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('text','โรงเรียนจัดการศึกษาแบบสหศึกษาในระดับมัธยมศึกษาปีที่ 1 ถึงมัธยมศึกษาปีที่ 6 มีทั้งหลักสูตรมัธยมศึกษาตอนต้น แผนการเรียนมัธยมศึกษาตอนปลาย และห้องเรียนพิเศษที่ตอบสนองศักยภาพและความสนใจของผู้เรียน การบริหารจัดการใช้การมีส่วนร่วมของผู้บริหาร ครู บุคลากร ผู้ปกครอง ชุมชนและภาคีเครือข่าย และขับเคลื่อนงานด้วย BANCHUEN Model ร่วมกับวงจรคุณภาพ PDCA'),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='ข้อมูลระบบการจัดการศึกษา'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('rows',JSON_ARRAY(
 JSON_OBJECT('c1','มัธยมศึกษาตอนต้น','c2','ม.1-ม.3','c3',10,'c4','มีห้องเรียนสมรรถนะและห้องเรียนพิเศษหลายรูปแบบ'),
 JSON_OBJECT('c1','มัธยมศึกษาตอนปลาย','c2','ม.4-ม.6','c3',19,'c4','มีแผนการเรียนวิทยาศาสตร์ คณิตศาสตร์ ภาษา ศิลปะ กีฬา อาชีพและห้องเรียนพิเศษ')
)),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='ข้อมูลเกี่ยวกับการเปิดสอน'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('rows',JSON_ARRAY(
 JSON_OBJECT('c1','อาคารเรียนถาวร','c2',3,'c3','หลัง'),
 JSON_OBJECT('c1','อาคารฝึกงาน','c2',3,'c3','หลัง'),
 JSON_OBJECT('c1','อาคารศูนย์พลศึกษา','c2',1,'c3','หลัง'),
 JSON_OBJECT('c1','บ้านพักครู นักเรียนและภารโรง','c2',12,'c3','หลัง'),
 JSON_OBJECT('c1','สนามกีฬา','c2',1,'c3','สนาม'),
 JSON_OBJECT('c1','ห้องสุขานักเรียน','c2',6,'c3','หลัง'),
 JSON_OBJECT('c1','อาคารอเนกประสงค์ หอประชุม โรงอาหารและส้วม','c2',NULL,'c3','เอกสารระบุจำนวนรวมเป็น 4 หลัง / 1 หลัง / 4 หลัง')
)),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='ข้อมูลอาคารและสถานที่'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('rows',JSON_ARRAY(
 JSON_OBJECT('c1','ห้องเรียนระดับมัธยมศึกษาตอนต้น','c2',10,'c3','หลักสูตรและห้องเรียนพิเศษ 10 รูปแบบ'),
 JSON_OBJECT('c1','ห้องเรียนระดับมัธยมศึกษาตอนปลาย','c2',19,'c3','แผนการเรียนและห้องเรียนพิเศษ 19 รูปแบบ'),
 JSON_OBJECT('c1','ห้องปฏิบัติการวิทยาศาสตร์','c2',7,'c3','ห้องปฏิบัติการ')
)),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='ข้อมูลห้องเรียน'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('rows',JSON_ARRAY(
 JSON_OBJECT('c1','ระบบสารสนเทศการเรียนการสอน','c2',120,'c3','ชุด'),
 JSON_OBJECT('c1','ระบบฐานข้อมูลการศึกษา','c2',7,'c3','ระบบ'),
 JSON_OBJECT('c1','ระบบสารสนเทศเอกสาร','c2',5,'c3','กลุ่ม'),
 JSON_OBJECT('c1','เครื่องคอมพิวเตอร์','c2',310,'c3','ชุด'),
 JSON_OBJECT('c1','หม้อแปลงไฟฟ้า','c2',1,'c3','ขนาด 160 KVA'),
 JSON_OBJECT('c1','ระบบอินเทอร์เน็ตใยแก้วนำแสง','c2',1,'c3','ความเร็วที่เอกสารระบุ 1000-500 Mbps'),
 JSON_OBJECT('c1','เครื่องกรองน้ำบาดาล','c2',2,'c3','ชุด')
)),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='สาธารณูปโภค'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('rows',JSON_ARRAY(
 JSON_OBJECT('c1','น้ำบาดาลและเครื่องกรองน้ำ','c2',2,'c3','พบข้อมูลเครื่องกรองน้ำบาดาล 2 ชุด')
)),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='ประเภทแหล่งน้ำในโรงเรียน'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

-- ไม่สร้าง record ของหัวข้อผู้ให้บริการโทรศัพท์ โทรสารและอินเทอร์เน็ต เพราะยังไม่พบชื่อผู้ให้บริการ

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('rows',JSON_ARRAY(
 JSON_OBJECT('c1',1,'c2','ตำบลแม่แฝก'),JSON_OBJECT('c1',2,'c2','ตำบลแม่แฝกใหม่'),
 JSON_OBJECT('c1',3,'c2','ตำบลหนองหาร'),JSON_OBJECT('c1',4,'c2','ตำบลป่าไผ่'),
 JSON_OBJECT('c1',5,'c2','ตำบลเมืองเล็น'),JSON_OBJECT('c1',6,'c2','ตำบลหนองแหย่ง'),
 JSON_OBJECT('c1',7,'c2','ตำบลหนองจ๊อม'),JSON_OBJECT('c1',8,'c2','ตำบลสันทรายหลวง'),
 JSON_OBJECT('c1',9,'c2','ตำบลสันป่าเปา'),JSON_OBJECT('c1',10,'c2','ตำบลสันนาเม็ง'),
 JSON_OBJECT('c1',11,'c2','ตำบลสันทรายน้อย'),JSON_OBJECT('c1',12,'c2','ตำบลสันพระเนตร')
)),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='เขตบริการของโรงเรียน'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('text','โรงเรียนมีพื้นที่รวม 35 ไร่ 2 งาน 5 ตารางวา ส่วนลักษณะที่ดินและประเภทกรรมสิทธิ์การถือครองที่ดินยังไม่พบข้อมูลยืนยันในเล่ม 5 ด้าน'),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='ลักษณะที่ดิน ขนาดและประเภทกรรมสิทธิ์การถือครองที่ดิน'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('text','โรงเรียนสันทรายวิทยาคมเป็นโรงเรียนสหศึกษา เปิดสอนระดับมัธยมศึกษาปีที่ 1 ถึงมัธยมศึกษาปีที่ 6 สังกัดสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาเชียงใหม่ สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน กระทรวงศึกษาธิการ เป็นสถานศึกษาระดับมัธยมศึกษาขนาดใหญ่ โรงเรียนมาตรฐานสากล และโรงเรียนนำร่องในพื้นที่นวัตกรรมการศึกษาจังหวัดเชียงใหม่'),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='ประเภทและลักษณะโรงเรียน'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('text','โรงเรียนสันทรายวิทยาคมเป็นสถานศึกษาที่สร้างสรรค์คนดี มีทักษะแห่งอนาคต มุ่งสู่ความเป็นเลิศตามศักยภาพ ภายในปี 2570'),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='วิสัยทัศน์โรงเรียน'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('text','1. ส่งเสริมการจัดการศึกษาเพื่อสร้างทักษะแห่งอนาคต ให้ผู้เรียนมีความเป็นเลิศตามศักยภาพ\n2. ส่งเสริมคุณลักษณะที่พึงประสงค์และค่านิยมที่ดีบนพื้นฐานความเป็นไทย พร้อมสร้างภูมิคุ้มกันจากภัยทุกรูปแบบ\n3. เพิ่มโอกาสให้ผู้เรียนทุกคนได้รับบริการทางการศึกษาอย่างเท่าเทียมบนพื้นฐานการมีส่วนร่วม\n4. พัฒนาครูและบุคลากรให้เชี่ยวชาญตามมาตรฐานวิชาชีพและตอบสนองทิศทางการพัฒนาผู้เรียน\n5. พัฒนาสถานศึกษาและระบบบริหารจัดการให้เอื้อต่อการพัฒนาคุณภาพและสอดคล้องกับบริบท'),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='พันธกิจโรงเรียน'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('text','1. ผู้เรียนมีทักษะแห่งอนาคตและได้รับการส่งเสริมสู่ความเป็นเลิศตามศักยภาพ\n2. ผู้เรียนมีคุณลักษณะอันพึงประสงค์และค่านิยมที่ดีบนพื้นฐานความเป็นไทย พร้อมมีภูมิคุ้มกันจากภัยทุกรูปแบบ\n3. ผู้เรียนทุกคนได้รับบริการทางการศึกษาอย่างเท่าเทียมบนพื้นฐานการมีส่วนร่วม\n4. ครูและบุคลากรได้รับการพัฒนาและมีความเชี่ยวชาญตามมาตรฐานวิชาชีพ\n5. สถานศึกษามีระบบบริหารจัดการที่เอื้อต่อการพัฒนาคุณภาพและสอดคล้องกับบริบท'),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='เป้าประสงค์โรงเรียน'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

INSERT INTO records (topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT id,2569,0,JSON_OBJECT('text','กลยุทธ์ที่ 1 พัฒนาผู้เรียนให้มีทักษะแห่งอนาคตและเป็นเลิศตามศักยภาพ โดยพัฒนาหลักสูตร ทักษะ ผลสัมฤทธิ์ คุณลักษณะและโอกาสทางการศึกษา\n\nกลยุทธ์ที่ 2 พัฒนาครูและบุคลากรทางการศึกษาให้สามารถจัดการศึกษาที่สนับสนุนการสร้างทักษะแห่งอนาคต และจัดการเรียนรู้เชิงรุก\n\nกลยุทธ์ที่ 3 พัฒนาระบบบริหารจัดการให้มีประสิทธิภาพและประสิทธิผลบนพื้นฐานการมีส่วนร่วม ครอบคลุมงานวิชาการ งานบุคคล สภาพแวดล้อม การเงิน สินทรัพย์และการประกันคุณภาพ'),NULL,NOW()
FROM topics WHERE department_id=4 AND chapter=1 AND title='กลยุทธ์โรงเรียน'
ON DUPLICATE KEY UPDATE data_json=VALUES(data_json),updated_by=NULL,updated_at=NOW();

COMMIT;
