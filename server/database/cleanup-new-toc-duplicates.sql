-- รวมและลบหัวข้อซ้ำที่เกิดจากการเพิ่มบทที่ 1 ก่อนเปลี่ยนชื่อหัวข้อตามสารบัญใหม่
-- ปลอดภัยเมื่อรันซ้ำ: เก็บหัวข้อ ID ต่ำสุด และคัดลอกเฉพาะปีที่หัวข้อหลักยังไม่มี
SET NAMES utf8mb4;

SET @general_id = (SELECT id FROM departments WHERE code='general' ORDER BY id LIMIT 1);

SET @keep_symbol = (
  SELECT MIN(id) FROM topics
  WHERE department_id=@general_id
    AND title='ตราสัญลักษณ์ สี ธง ดอกไม้ประจำโรงเรียน และเอกลักษณ์ประจำตัวนักเรียน'
);
INSERT IGNORE INTO records(topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT @keep_symbol,r.academic_year,r.term,r.data_json,r.updated_by,r.updated_at
FROM records r
JOIN topics t ON t.id=r.topic_id
WHERE @keep_symbol IS NOT NULL
  AND t.department_id=@general_id
  AND t.title='ตราสัญลักษณ์ สี ธง ดอกไม้ประจำโรงเรียน และเอกลักษณ์ประจำตัวนักเรียน'
  AND t.id<>@keep_symbol;
DELETE r FROM records r
JOIN topics t ON t.id=r.topic_id
WHERE @keep_symbol IS NOT NULL
  AND t.department_id=@general_id
  AND t.title='ตราสัญลักษณ์ สี ธง ดอกไม้ประจำโรงเรียน และเอกลักษณ์ประจำตัวนักเรียน'
  AND t.id<>@keep_symbol;
DELETE FROM topics
WHERE @keep_symbol IS NOT NULL
  AND department_id=@general_id
  AND title='ตราสัญลักษณ์ สี ธง ดอกไม้ประจำโรงเรียน และเอกลักษณ์ประจำตัวนักเรียน'
  AND id<>@keep_symbol;

SET @keep_type = (
  SELECT MIN(id) FROM topics
  WHERE department_id=@general_id AND title='ประเภทและลักษณะโรงเรียน'
);
INSERT IGNORE INTO records(topic_id,academic_year,term,data_json,updated_by,updated_at)
SELECT @keep_type,r.academic_year,r.term,r.data_json,r.updated_by,r.updated_at
FROM records r
JOIN topics t ON t.id=r.topic_id
WHERE @keep_type IS NOT NULL
  AND t.department_id=@general_id
  AND t.title='ประเภทและลักษณะโรงเรียน'
  AND t.id<>@keep_type;
DELETE r FROM records r
JOIN topics t ON t.id=r.topic_id
WHERE @keep_type IS NOT NULL
  AND t.department_id=@general_id
  AND t.title='ประเภทและลักษณะโรงเรียน'
  AND t.id<>@keep_type;
DELETE FROM topics
WHERE @keep_type IS NOT NULL
  AND department_id=@general_id
  AND title='ประเภทและลักษณะโรงเรียน'
  AND id<>@keep_type;

