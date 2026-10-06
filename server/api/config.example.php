<?php
// ไฟล์ตัวอย่าง: คัดลอกเป็น config.php แล้วแก้ค่าให้ตรงกับเครื่อง (config.php ไม่ขึ้น git เพราะมีรหัสผ่าน)
// ตั้งค่าการเชื่อมต่อฐานข้อมูล
// ในเครื่อง (XAMPP) ค่าเริ่มต้นคือ user = root, รหัสผ่านว่าง
// ตอนขึ้นเซิร์ฟเวอร์จริง แก้ 4 ค่านี้ตามที่ครูผู้ดูแลให้มา

define('DB_HOST', 'localhost');
define('DB_NAME', 'school_info');
define('DB_USER', 'root');
define('DB_PASS', ''); // ← ใส่รหัสผ่านจริงตอนติดตั้ง

// ไม่บังคับ: ที่เก็บไฟล์สำรองอัตโนมัติก่อนกู้คืน
// ควรอยู่นอก htdocs/public_html และ PHP ต้องเขียนได้
// ถ้าไม่กำหนด ระบบจะใช้โฟลเดอร์ school-info-backups ที่อยู่เหนือ document root
// define('BACKUP_DIR', 'C:\\xampp7.4\\school-info-backups');

function db()
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

function json_out($data, $status = 200)
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
