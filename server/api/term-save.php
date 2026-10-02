<?php
// เพิ่มปีการศึกษา/ภาคเรียน หรือตั้งเป็นภาคเรียนปัจจุบัน (เฉพาะผู้ดูแลระบบ)
// เพิ่ม:          {"academicYear": 2570, "term": 1}
// ตั้งปัจจุบัน:   {"id": 5, "setCurrent": true}
require __DIR__ . '/lib.php';
require_method('POST');
require_admin();

$in = read_json();
$pdo = db();

if (!empty($in['id']) && !empty($in['setCurrent'])) {
    $pdo->beginTransaction();
    $pdo->exec('UPDATE terms SET is_current = 0');
    $pdo->prepare('UPDATE terms SET is_current = 1 WHERE id = ?')->execute([(int) $in['id']]);
    $pdo->commit();
    json_out(['ok' => true]);
}

$year = isset($in['academicYear']) ? (int) $in['academicYear'] : 0;
$term = isset($in['term']) ? (int) $in['term'] : -1;
if ($year < 2500 || $year > 2700 || $term < 0 || $term > 3) {
    fail('ปีการศึกษาหรือภาคเรียนไม่ถูกต้อง');
}

// เพิ่มภาคเรียนที่ขอ และแถวรายปี (term = 0) ของปีนั้นถ้ายังไม่มี
$exists = $pdo->prepare('SELECT id FROM terms WHERE academic_year = ? AND term = ?');
$insert = $pdo->prepare('INSERT INTO terms (academic_year, term) VALUES (?, ?)');

$exists->execute([$year, $term]);
if ($exists->fetchColumn()) {
    fail($term === 0 ? "มีปีการศึกษา $year อยู่แล้ว" : "มีภาคเรียน $term/$year อยู่แล้ว", 409);
}
$insert->execute([$year, $term]);
$id = (int) $pdo->lastInsertId();

if ($term !== 0) {
    $exists->execute([$year, 0]);
    if (!$exists->fetchColumn()) {
        $insert->execute([$year, 0]);
    }
}

json_out(['ok' => true, 'id' => $id], 201);
