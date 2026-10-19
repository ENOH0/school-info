<?php
// กู้คืนข้อมูลจากไฟล์ที่สร้างโดย database-backup.php (เฉพาะผู้ดูแลระบบ)
require __DIR__ . '/lib.php';
require __DIR__ . '/database-backup-lib.php';
require_method('POST');
require_admin();

if (($_POST['confirm'] ?? '') !== 'RESTORE') {
    fail('กรุณายืนยันการกู้คืนให้ถูกต้อง');
}
if (!isset($_FILES['backup']) || $_FILES['backup']['error'] !== UPLOAD_ERR_OK) {
    fail('กรุณาเลือกไฟล์สำรอง');
}
if ((int) $_FILES['backup']['size'] > 1024 * 1024 * 1024) {
    fail('ไฟล์สำรองต้องมีขนาดไม่เกิน 1 GB');
}

$raw = file_get_contents($_FILES['backup']['tmp_name']);
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    fail('อ่านไฟล์สำรองไม่ได้ หรือไฟล์ไม่ใช่ JSON ที่ถูกต้อง');
}

try {
    validate_backup_payload($payload);
    $automatic = save_automatic_backup();
    restore_backup_payload($payload);
    $counts = [];
    foreach (backup_tables() as $table => $columns) {
        $counts[$table] = isset($payload['tables'][$table]) && is_array($payload['tables'][$table]) ? count($payload['tables'][$table]) : 0;
    }
    $scope = isset($payload['scope']) ? $payload['scope'] : ['type' => 'all'];
    json_out(['ok' => true, 'automaticBackup' => $automatic, 'counts' => $counts, 'scope' => $scope]);
} catch (Throwable $e) {
    fail('กู้คืนไม่สำเร็จ: ' . $e->getMessage(), 500);
}
