<?php
// คัดลอกข้อมูลครั้งก่อนมาใส่หัวข้อที่ยังว่าง ของฝ่ายนี้ ในภาคเรียนที่เลือก
// POST {"departmentId": 1, "academicYear": 2569, "term": 2}
// - หัวข้อรายภาคเรียน: คัดลอกจากภาคเรียนก่อนหน้าที่มีข้อมูล
// - หัวข้อรายปี: คัดลอกจากปีการศึกษาก่อนหน้าที่มีข้อมูล
// - หัวข้อที่กรอกแล้ว หรือเล่มที่เผยแพร่แล้ว จะไม่ถูกแตะ
require __DIR__ . '/lib.php';
require_method('POST');
$me = require_login();

$in     = read_json();
$deptId = isset($in['departmentId']) ? (int) $in['departmentId'] : 0;
$year   = isset($in['academicYear']) ? (int) $in['academicYear'] : 0;
$term   = isset($in['term']) ? (int) $in['term'] : 0;

if (!can_edit_department($me, $deptId)) {
    fail('คัดลอกข้อมูลได้เฉพาะฝ่ายของตัวเอง', 403);
}
$chk = db()->prepare('SELECT COUNT(*) FROM terms WHERE academic_year = ? AND term = ?');
$chk->execute([$year, $term]);
if ($term < 1 || !(int) $chk->fetchColumn()) {
    fail('ไม่พบภาคเรียนนี้ในระบบ');
}

$stmt = db()->prepare('SELECT * FROM topics WHERE department_id = ? ORDER BY sort_order, id');
$stmt->execute([$deptId]);
$topics = $stmt->fetchAll();

$has = db()->prepare('SELECT COUNT(*) FROM records WHERE topic_id = ? AND academic_year = ? AND term = ?');
$ins = db()->prepare(
    'INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
);

$copied = [];
$noPrevious = 0;
$locked = 0;
$filled = 0;

db()->beginTransaction();
foreach ($topics as $t) {
    $target = record_term($t, $term);
    $has->execute([(int) $t['id'], $year, $target]);
    if ((int) $has->fetchColumn()) {
        $filled++;
        continue;
    }
    if (period_locked($year, $target)) {
        $locked++;
        continue;
    }
    $prev = previous_record($t['id'], $year, $target);
    if (!$prev) {
        $noPrevious++;
        continue;
    }
    $data = json_decode($prev['data_json'], true);
    if (!is_array($data)) {
        $noPrevious++;
        continue;
    }
    // ตารางเก็บเฉพาะคอลัมน์ที่หัวข้อยังมีอยู่ตอนนี้
    if (isset($data['rows']) && is_array($data['rows'])) {
        $keys = [];
        foreach (topic_columns($t) as $c) {
            $keys[] = $c['key'];
        }
        $rows = [];
        foreach ($data['rows'] as $row) {
            $out = [];
            foreach ($keys as $k) {
                $out[$k] = is_array($row) && isset($row[$k]) ? $row[$k] : null;
            }
            $rows[] = $out;
        }
        $data['rows'] = $rows;
    }
    $data['copiedFrom'] = period_text($prev['academic_year'], $prev['term']);
    $ins->execute([(int) $t['id'], $year, $target, json_encode($data, JSON_UNESCAPED_UNICODE), (int) $me['id'], now_str()]);
    $copied[] = $t['title'];
}
db()->commit();

json_out([
    'ok'         => true,
    'copied'     => count($copied),
    'titles'     => $copied,
    'noPrevious' => $noPrevious,
    'locked'     => $locked,
    'filled'     => $filled,
]);
