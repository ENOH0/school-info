<?php
// ลบหัวข้อ (ลบได้เฉพาะหัวข้อที่ยังไม่มีข้อมูล)
require __DIR__ . '/lib.php';
require_method('POST');
$me = require_login();

$in = read_json();
$topic = find_topic(isset($in['id']) ? (int) $in['id'] : 0);
if (!can_edit_department($me, $topic['department_id'])) {
    fail('ลบได้เฉพาะหัวข้อของฝ่ายตัวเอง', 403);
}

$cnt = db()->prepare('SELECT COUNT(*) FROM records WHERE topic_id = ?');
$cnt->execute([(int) $topic['id']]);
if ((int) $cnt->fetchColumn() > 0) {
    fail('หัวข้อนี้มีข้อมูลแล้ว ลบไม่ได้ ต้องลบข้อมูลทุกภาคเรียนออกก่อน', 409);
}

db()->prepare('DELETE FROM topics WHERE id = ?')->execute([(int) $topic['id']]);
json_out(['ok' => true]);
