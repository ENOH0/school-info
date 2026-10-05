-- จัดชื่อหัวข้อที่ดูซ้ำกันให้แยกตามรอบการกรอกอย่างชัดเจน
-- ไม่ลบข้อมูล: หัวข้อรายปีและรายภาคเรียนยังคงเก็บแยกกัน
SET NAMES utf8mb4;
START TRANSACTION;

UPDATE topics
SET title = 'จำนวนนักเรียนแยกตามระดับชั้น (รายภาคเรียน)'
WHERE title = 'จำนวนนักเรียนแยกตามระดับชั้น' AND frequency = 'term';

UPDATE topics
SET title = 'จำนวนนักเรียนแยกตามระดับชั้น (สรุปรายปี)',
    department_id = (SELECT id FROM departments WHERE code = 'academic' LIMIT 1)
WHERE title = 'จำนวนนักเรียนแยกตามระดับชั้น' AND frequency = 'year';

UPDATE topics SET title = 'ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 3 (คะแนนเฉลี่ยโรงเรียน)'
WHERE title = 'ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 3';
UPDATE topics SET title = 'ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 6 (คะแนนเฉลี่ยโรงเรียน)'
WHERE title = 'ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 6';

UPDATE topics SET title = 'ผลการประเมินการอ่าน คิดวิเคราะห์ และเขียน (รายภาคเรียน)'
WHERE title = 'ผลการประเมินการอ่าน คิดวิเคราะห์ และเขียน' AND frequency = 'term';
UPDATE topics SET title = 'ผลการประเมินการอ่าน คิดวิเคราะห์ และเขียนสื่อความ (สรุปรายปี)'
WHERE title = 'ผลการประเมินการอ่าน คิดวิเคราะห์ และเขียนสื่อความ' AND frequency = 'year';

UPDATE topics SET title = 'ผลการประเมินคุณลักษณะอันพึงประสงค์ (รายภาคเรียน)'
WHERE title = 'ผลการประเมินคุณลักษณะอันพึงประสงค์' AND frequency = 'term';
UPDATE topics SET title = 'ผลการประเมินคุณลักษณะอันพึงประสงค์ของผู้เรียน (สรุปรายปี)'
WHERE title = 'ผลการประเมินคุณลักษณะอันพึงประสงค์ของผู้เรียน' AND frequency = 'year';

UPDATE topics SET title = 'การพัฒนาครูและบุคลากร (บันทึกรายภาคเรียน)'
WHERE title = 'การพัฒนาครูและบุคลากร' AND frequency = 'term';
UPDATE topics SET title = 'การพัฒนาครูและบุคลากรตามมาตรฐานวิชาชีพ (สรุปรายปี)'
WHERE title = 'การพัฒนาครูและบุคลากรตามมาตรฐานวิชาชีพ' AND frequency = 'year';

UPDATE topics SET title = 'รางวัลของโรงเรียน (รายภาคเรียน)'
WHERE title = 'รางวัลของโรงเรียน' AND frequency = 'term';
UPDATE topics SET title = 'รางวัลของครูและบุคลากร (รายภาคเรียน)'
WHERE title = 'รางวัลของครูและบุคลากร' AND frequency = 'term';
UPDATE topics SET title = 'รางวัลของนักเรียน (รายภาคเรียน)'
WHERE title = 'รางวัลของนักเรียน' AND frequency = 'term';

COMMIT;
