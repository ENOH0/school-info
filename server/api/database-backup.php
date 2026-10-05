<?php
// ดาวน์โหลดข้อมูลแอปทั้งหมดเป็นไฟล์ JSON (เฉพาะผู้ดูแลระบบ)
require __DIR__ . '/lib.php';
require __DIR__ . '/database-backup-lib.php';
require_method('GET');
require_admin();

try {
    $year = isset($_GET['year']) && $_GET['year'] !== '' ? (int) $_GET['year'] : null;
    if ($year !== null) {
        $stmt = db()->prepare('SELECT COUNT(*) FROM terms WHERE academic_year = ?');
        $stmt->execute([$year]);
        if (!(int) $stmt->fetchColumn()) {
            fail('ไม่พบปีการศึกษานี้ในระบบ', 404);
        }
    }
    $json = encode_backup(make_backup_payload($year));
} catch (Throwable $e) {
    fail('สร้างไฟล์สำรองไม่สำเร็จ: ' . $e->getMessage(), 500);
}

$scopeName = $year === null ? 'all' : 'year-' . $year;
$filename = 'school-info-backup-' . $scopeName . '-' . date('Ymd-His') . '.json';
header('Content-Type: application/json; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . strlen($json));
header('Cache-Control: no-store');
echo $json;
