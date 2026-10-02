<?php
// เลื่อนลำดับหัวข้อขึ้น/ลง {"id": 3, "direction": "up"|"down"}
require __DIR__ . '/lib.php';
require_method('POST');
$me = require_login();

$in = read_json();
$topic = find_topic(isset($in['id']) ? (int) $in['id'] : 0);
if (!can_edit_department($me, $topic['department_id'])) {
    fail('แก้ไขได้เฉพาะหัวข้อของฝ่ายตัวเอง', 403);
}
require_topic_unlocked($topic['id']);
$up = isset($in['direction']) && $in['direction'] === 'up';

// เรียงลำดับใหม่ทั้งฝ่ายเป็น 1, 2, 3, ... แล้วสลับกับตัวข้าง ๆ
$stmt = db()->prepare('SELECT id FROM topics WHERE department_id = ? ORDER BY sort_order, id');
$stmt->execute([(int) $topic['department_id']]);
$ids = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));

$i = array_search((int) $topic['id'], $ids, true);
$j = $up ? $i - 1 : $i + 1;
if ($j >= 0 && $j < count($ids)) {
    $tmp = $ids[$i];
    $ids[$i] = $ids[$j];
    $ids[$j] = $tmp;
}

$upd = db()->prepare('UPDATE topics SET sort_order = ? WHERE id = ?');
foreach ($ids as $n => $tid) {
    $upd->execute([$n + 1, $tid]);
}
json_out(['ok' => true]);
