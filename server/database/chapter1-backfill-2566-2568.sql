SET NAMES utf8mb4;
START TRANSACTION;

-- เติมข้อมูลบทที่ 1 จากชุดปัจจุบันให้ปีเก่าเฉพาะหัวข้อที่ยังไม่มี record
-- INSERT IGNORE ทำให้ข้อมูลย้อนหลังเดิมไม่ถูกเขียนทับ
INSERT IGNORE INTO records
    (topic_id, academic_year, term, data_json, updated_by, updated_at)
SELECT
    source_record.topic_id,
    target_year.academic_year,
    0,
    source_record.data_json,
    NULL,
    NOW()
FROM records AS source_record
JOIN topics AS topic
  ON topic.id = source_record.topic_id
CROSS JOIN (
    SELECT 2566 AS academic_year
    UNION ALL SELECT 2567
    UNION ALL SELECT 2568
) AS target_year
WHERE source_record.academic_year = 2569
  AND source_record.term = 0
  AND topic.chapter = 1;

COMMIT;
