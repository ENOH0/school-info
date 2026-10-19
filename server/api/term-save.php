<?php
// เพิ่มปีการศึกษา หรือตั้งเป็นปีปัจจุบัน (เฉพาะผู้ดูแลระบบ)
// เพิ่ม:          {"academicYear": 2570}
// ตั้งปัจจุบัน:   {"id": 5, "setCurrent": true}
// เผยแพร่:        {"id": 5, "publish": true}   ยกเลิกเผยแพร่: {"id": 5, "publish": false}
require __DIR__ . '/lib.php';
require_method('POST');
require_admin();

$in = read_json();
$pdo = db();

if (!empty($in['id']) && array_key_exists('publish', $in)) {
    $id = (int) $in['id'];
    $period = $pdo->prepare('SELECT academic_year, term FROM terms WHERE id = ?');
    $period->execute([$id]);
    $period = $period->fetch();
    if (!$period) {
        fail('ไม่พบปีการศึกษานี้', 404);
    }
    $pub = $in['publish'] ? 1 : 0;
    $stmt = $pdo->prepare('UPDATE terms SET is_published = ?, published_at = ? WHERE id = ?');
    $stmt->execute([$pub, $pub ? now_str() : null, $id]);
    json_out(['ok' => true]);
}

if (!empty($in['id']) && !empty($in['setCurrent'])) {
    $pdo->beginTransaction();
    $pdo->exec('UPDATE terms SET is_current = 0');
    $pdo->prepare('UPDATE terms SET is_current = 1 WHERE id = ?')->execute([(int) $in['id']]);
    $pdo->commit();
    json_out(['ok' => true]);
}

$year = isset($in['academicYear']) ? (int) $in['academicYear'] : 0;
$term = 0;
if ($year < 2500 || $year > 2700) {
    fail('ปีการศึกษาไม่ถูกต้อง');
}

// term = 0 เป็นค่าภายในเพื่อรองรับฐานข้อมูลเดิม ระบบใช้งานเป็นรายปีเท่านั้น
$exists = $pdo->prepare('SELECT id FROM terms WHERE academic_year = ? AND term = ?');
$insert = $pdo->prepare('INSERT INTO terms (academic_year, term) VALUES (?, ?)');

$exists->execute([$year, $term]);
if ($exists->fetchColumn()) {
    fail("มีปีการศึกษา $year อยู่แล้ว", 409);
}
$insert->execute([$year, $term]);
$id = (int) $pdo->lastInsertId();

json_out(['ok' => true, 'id' => $id], 201);
