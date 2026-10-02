<?php
// เพิ่ม/แก้ไขผู้ใช้ (เฉพาะผู้ดูแลระบบ)
// {"id"?, "username", "displayName", "role": "admin"|"editor", "departmentId", "isActive", "password"?}
// แก้ไขโดยไม่ส่ง password = ใช้รหัสเดิม
require __DIR__ . '/lib.php';
require_method('POST');
$me = require_admin();

$in = read_json();
$id       = isset($in['id']) ? (int) $in['id'] : 0;
$username = trim(isset($in['username']) ? (string) $in['username'] : '');
$name     = trim(isset($in['displayName']) ? (string) $in['displayName'] : '');
$role     = (isset($in['role']) && $in['role'] === 'admin') ? 'admin' : 'editor';
$deptId   = isset($in['departmentId']) && $in['departmentId'] !== null ? (int) $in['departmentId'] : null;
$active   = !isset($in['isActive']) || $in['isActive'] ? 1 : 0;
$password = isset($in['password']) ? (string) $in['password'] : '';

if (!preg_match('/^[a-zA-Z0-9_.-]{3,50}$/', $username)) {
    fail('ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษหรือตัวเลข 3–50 ตัว');
}
if ($name === '' || text_len($name) > 100) {
    fail('กรุณากรอกชื่อที่แสดง (ไม่เกิน 100 ตัวอักษร)');
}
if ($role === 'editor') {
    $chk = db()->prepare('SELECT COUNT(*) FROM departments WHERE id = ?');
    $chk->execute([(int) $deptId]);
    if (!$deptId || !(int) $chk->fetchColumn()) {
        fail('กรุณาเลือกฝ่ายของผู้ใช้');
    }
} else {
    $deptId = null;
}
if (($id === 0 || $password !== '') && strlen($password) < 8) {
    fail('รหัสผ่านต้องยาวอย่างน้อย 8 ตัว');
}
if ($id === (int) $me['id'] && ($role !== 'admin' || !$active)) {
    fail('ลดสิทธิ์หรือปิดบัญชีของตัวเองไม่ได้');
}

$dup = db()->prepare('SELECT id FROM users WHERE username = ? AND id <> ?');
$dup->execute([$username, $id]);
if ($dup->fetchColumn()) {
    fail('มีชื่อผู้ใช้นี้แล้ว', 409);
}

if ($id === 0) {
    $stmt = db()->prepare(
        'INSERT INTO users (username, password_hash, display_name, role, department_id, is_active) VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$username, password_hash($password, PASSWORD_DEFAULT), $name, $role, $deptId, $active]);
    json_out(['ok' => true, 'id' => (int) db()->lastInsertId()], 201);
}

$exists = db()->prepare('SELECT COUNT(*) FROM users WHERE id = ?');
$exists->execute([$id]);
if (!(int) $exists->fetchColumn()) {
    fail('ไม่พบผู้ใช้นี้', 404);
}

db()->prepare(
    'UPDATE users SET username = ?, display_name = ?, role = ?, department_id = ?, is_active = ? WHERE id = ?'
)->execute([$username, $name, $role, $deptId, $active, $id]);

if ($password !== '') {
    db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $id]);
    // ตั้งรหัสใหม่ให้ = ปลดล็อกที่ใส่รหัสผิดหลายครั้ง (ทุกเครื่อง)
    login_clear($username, null);
    login_clear('pwchange:' . $id, null);
}

json_out(['ok' => true, 'id' => $id]);
