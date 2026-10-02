<?php
// ใครล็อกอินอยู่ + ต้องตั้งค่าผู้ดูแลคนแรกหรือยัง
require __DIR__ . '/lib.php';

$u = current_user();
$count = (int) db()->query('SELECT COUNT(*) FROM users')->fetchColumn();

json_out([
    'user'       => $u ? public_user($u) : null,
    'needsSetup' => $count === 0,
]);
