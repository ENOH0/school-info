<?php
// สร้างผู้ดูแลระบบคนแรก ใช้ได้ครั้งเดียวตอนยังไม่มีผู้ใช้ในระบบ
require __DIR__ . '/lib.php';
require_method('POST');

$count = (int) db()->query('SELECT COUNT(*) FROM users')->fetchColumn();
if ($count > 0) {
    fail('ตั้งค่าไปแล้ว กรุณาเข้าสู่ระบบ', 403);
}

$in = read_json();
$username = trim(isset($in['username']) ? (string) $in['username'] : '');
$password = isset($in['password']) ? (string) $in['password'] : '';
$name     = trim(isset($in['displayName']) ? (string) $in['displayName'] : '');

if (!preg_match('/^[a-zA-Z0-9_.-]{3,50}$/', $username)) {
    fail('ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษหรือตัวเลข 3–50 ตัว');
}
if (strlen($password) < 8) {
    fail('รหัสผ่านต้องยาวอย่างน้อย 8 ตัว');
}
if ($name === '') {
    $name = $username;
}

$stmt = db()->prepare(
    "INSERT INTO users (username, password_hash, display_name, role, department_id) VALUES (?, ?, ?, 'admin', NULL)"
);
$stmt->execute([$username, password_hash($password, PASSWORD_DEFAULT), $name]);

session_regenerate_id(true);
$_SESSION['uid'] = (int) db()->lastInsertId();

json_out(['ok' => true, 'user' => public_user(current_user())], 201);
