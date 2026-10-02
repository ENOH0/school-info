<?php
// ข้อมูลหัวข้อ 1 รายการ สำหรับหน้าแก้ไขหัวข้อ
// GET topic-get.php?id=3
require __DIR__ . '/lib.php';
$me = require_login();

$t = find_topic(isset($_GET['id']) ? (int) $_GET['id'] : 0);
require_department_access($me, $t['department_id']);
$cnt = db()->prepare('SELECT COUNT(*) FROM records WHERE topic_id = ?');
$cnt->execute([(int) $t['id']]);

json_out([
    'id'           => (int) $t['id'],
    'departmentId' => (int) $t['department_id'],
    'chapter'      => (int) $t['chapter'],
    'title'        => $t['title'],
    'kind'         => $t['kind'],
    'frequency'    => $t['frequency'],
    'columns'      => topic_columns($t),
    'chart'        => topic_chart($t),
    'recordCount'  => (int) $cnt->fetchColumn(),
    'canEdit'      => can_edit_department($me, $t['department_id']),
    'structureLocked' => topic_locked($t['id']),
]);
