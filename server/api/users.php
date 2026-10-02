<?php
// รายชื่อผู้ใช้ทั้งหมด (เฉพาะผู้ดูแลระบบ)
require __DIR__ . '/lib.php';
require_admin();

$rows = db()->query(
    'SELECT id, username, display_name, role, department_id, is_active, last_login_at FROM users ORDER BY role, department_id, username'
)->fetchAll();

json_out(array_map(function ($u) {
    return public_user($u) + [
        'isActive'    => (int) $u['is_active'] === 1,
        'lastLoginAt' => $u['last_login_at'],
    ];
}, $rows));
