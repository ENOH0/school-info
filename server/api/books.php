<?php
// รายการเล่มสารสนเทศ (สาธารณะ ไม่ต้องล็อกอิน)
// แสดงหนึ่งเล่มต่อหนึ่งปีการศึกษา
// published = false: ยังไม่เผยแพร่ ปกจะขึ้นว่า "กำลังรวบรวมข้อมูล" (คนนอกกดเข้าไปไม่เห็นเนื้อหา)
require __DIR__ . '/lib.php';

$rows = db()->query(
    'SELECT t.id, t.academic_year, t.term, t.is_published,
            EXISTS (SELECT 1 FROM records r
                     WHERE r.academic_year = t.academic_year AND r.term = 0) AS has_data
       FROM terms t
      WHERE t.term = 0
      ORDER BY t.academic_year DESC'
)->fetchAll();

json_out(array_map(function ($t) {
    $year = (int) $t['academic_year'];
    $term = (int) $t['term'];
    return [
        'id'           => (int) $t['id'],
        'academicYear' => $year,
        'term'         => $term,
        'hasData'      => (int) $t['has_data'] === 1,
        'published'    => (int) $t['is_published'] === 1,
        'title'        => "สารสนเทศ ปีการศึกษา $year",
    ];
}, $rows));
