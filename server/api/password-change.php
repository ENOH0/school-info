<?php
// เปลี่ยนรหัสผ่านของตัวเอง (ทุกบัญชีที่ล็อกอินอยู่)
// {"currentPassword": "...", "newPassword": "..."}
require __DIR__ . '/lib.php';
require_method('POST');
$me = require_login();

$in = read_json();
$current = isset($in['currentPassword']) ? (string) $in['currentPassword'] : '';
$new     = isset($in['newPassword']) ? (string) $in['newPassword'] : '';

// กันการเดารหัสเดิม (เช่น มีคนแอบใช้เครื่องที่ล็อกอินค้างไว้)
$key = 'pwchange:' . (int) $me['id'];
require_not_throttled($key);

$stmt = db()->prepare('SELECT password_hash FROM users WHERE id = ?');
$stmt->execute([(int) $me['id']]);
$hash = (string) $stmt->fetchColumn();

if (!password_verify($current, $hash)) {
    login_failed($key);
    usleep(300000);
    fail('รหัสผ่านปัจจุบันไม่ถูกต้อง');
}
if (strlen($new) < 8) {
    fail('รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัว');
}
if ($new === $current) {
    fail('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม');
}

db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    ->execute([password_hash($new, PASSWORD_DEFAULT), (int) $me['id']]);
login_clear($key);

session_regenerate_id(true); // เปลี่ยน session ใหม่หลังเปลี่ยนรหัส

json_out(['ok' => true]);
