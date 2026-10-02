<?php
// เข้าสู่ระบบ
require __DIR__ . '/lib.php';
require_method('POST');

$in = read_json();
$username = trim(isset($in['username']) ? (string) $in['username'] : '');
$password = isset($in['password']) ? (string) $in['password'] : '';

// เคยใส่ผิดหลายครั้ง: ยังไม่ตรวจรหัส ให้รอก่อน
require_not_throttled($username);

$stmt = db()->prepare('SELECT id, password_hash, is_active FROM users WHERE username = ?');
$stmt->execute([$username]);
$row = $stmt->fetch();

// ตอบข้อความเดียวกันทั้งกรณีไม่มีชื่อผู้ใช้และรหัสผิด จะได้ไม่บอกว่ามีชื่อนี้ในระบบ
if (!$row || !password_verify($password, $row['password_hash'])) {
    login_failed($username);
    usleep(300000); // หน่วงนิดหน่อย กันการสุ่มรหัสรัว ๆ
    $left = LOGIN_MAX_PER_USER - count_recent_failures($username);
    fail('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' . ($left > 0 && $left <= 2 ? " (ลองได้อีก $left ครั้ง ก่อนถูกล็อก " . LOGIN_WINDOW_MIN . ' นาที)' : ''), 401);
}
if ((int) $row['is_active'] !== 1) {
    fail('บัญชีนี้ถูกปิดใช้งาน', 403);
}

login_clear($username);
session_regenerate_id(true); // เปลี่ยนรหัส session ทุกครั้งที่ล็อกอิน
$_SESSION['uid'] = (int) $row['id'];

db()->prepare('UPDATE users SET last_login_at = ? WHERE id = ?')->execute([now_str(), (int) $row['id']]);

json_out(['ok' => true, 'user' => public_user(current_user())]);
