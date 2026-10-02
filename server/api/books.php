<?php
// รายการเล่มสารสนเทศ (สาธารณะ ไม่ต้องล็อกอิน)
// แสดงทุกภาคเรียนที่สร้างไว้ (ยังไม่มีข้อมูลก็แสดง แต่ hasData = false ปกจะขึ้นว่า "กำลังรวบรวมข้อมูล")
// เล่มรายภาคเรียนรวมข้อมูลรายปีของปีนั้นด้วย
// แถวรายปี (term = 0) แสดงเป็นเล่มเฉพาะปีที่ไม่มีภาคเรียนเลยแต่มีข้อมูลรายปี
require __DIR__ . '/lib.php';

$rows = db()->query(
    'SELECT t.id, t.academic_year, t.term,
            EXISTS (SELECT 1 FROM records r
                     WHERE r.academic_year = t.academic_year AND (r.term = t.term OR r.term = 0)) AS has_data
       FROM terms t
      WHERE t.term > 0
         OR (NOT EXISTS (SELECT 1 FROM terms t2 WHERE t2.academic_year = t.academic_year AND t2.term > 0)
             AND EXISTS (SELECT 1 FROM records r WHERE r.academic_year = t.academic_year AND r.term = 0))
      ORDER BY t.academic_year DESC, t.term DESC'
)->fetchAll();

json_out(array_map(function ($t) {
    $year = (int) $t['academic_year'];
    $term = (int) $t['term'];
    return [
        'id'           => (int) $t['id'],
        'academicYear' => $year,
        'term'         => $term,
        'hasData'      => (int) $t['has_data'] === 1,
        'title'        => $term === 0 ? "สารสนเทศ ปีการศึกษา $year" : "สารสนเทศ ภาคเรียนที่ $term/$year",
    ];
}, $rows));
