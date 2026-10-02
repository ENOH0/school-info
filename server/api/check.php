<?php
// ตรวจความพร้อมของเซิร์ฟเวอร์ (เปิดในเบราว์เซอร์หลังติดตั้ง: .../api/check.php)
// แสดงแค่ ผ่าน/ไม่ผ่าน ไม่แสดงรหัสผ่านหรือข้อมูลภายใน
// ไม่ require lib.php เพื่อให้ยังเปิดได้แม้ config.php หรือฐานข้อมูลมีปัญหา
ini_set('display_errors', '0');
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');

$checks = [];
$add = function ($name, $ok, $hint) use (&$checks) {
    $checks[] = ['name' => $name, 'ok' => (bool) $ok, 'hint' => $ok ? '' : $hint];
};

$add('PHP 7.4 ขึ้นไป (ตอนนี้ ' . PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION . ')', version_compare(PHP_VERSION, '7.4.0', '>='), 'ให้ผู้ดูแลเซิร์ฟเวอร์อัปเดต PHP');
$add('ส่วนเสริม pdo_mysql', extension_loaded('pdo_mysql'), 'เปิด extension=pdo_mysql ใน php.ini');
$add('ส่วนเสริม gd (ย่อ/ล้างข้อมูลรูป)', function_exists('imagecreatefromjpeg'), 'เปิด extension=gd ใน php.ini (ไม่มีก็อัปโหลดรูปได้ แต่ไม่ล้างข้อมูล GPS ในรูป)');
$add('ส่วนเสริม mbstring', function_exists('mb_strlen'), 'เปิด extension=mbstring ใน php.ini (ไม่บังคับ)');

$hasConfig = is_file(__DIR__ . '/config.php');
$add('มีไฟล์ api/config.php', $hasConfig, 'คัดลอก config.example.php เป็น config.php แล้วใส่ชื่อฐานข้อมูล ผู้ใช้ รหัสผ่าน');

$dbOk = false;
$tablesOk = false;
$hasAdmin = false;
$throttleOk = false;
if ($hasConfig && extension_loaded('pdo_mysql')) {
    try {
        require __DIR__ . '/config.php';
        $pdo = db();
        $dbOk = true;
        $need = ['departments', 'terms', 'users', 'topics', 'records'];
        $have = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
        $tablesOk = count(array_diff($need, $have)) === 0;
        $throttleOk = in_array('login_attempts', $have, true);
        if ($tablesOk) {
            $cols = $pdo->query('SHOW COLUMNS FROM terms')->fetchAll(PDO::FETCH_COLUMN);
            $cols2 = $pdo->query('SHOW COLUMNS FROM topics')->fetchAll(PDO::FETCH_COLUMN);
            $tablesOk = in_array('is_published', $cols, true) && in_array('chapter', $cols2, true)
                && in_array('chart_json', $cols2, true);
            $hasAdmin = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn() > 0;
        }
    } catch (Exception $e) {
        error_log('[school-info] check.php: ' . $e->getMessage());
    }
}
$add('เชื่อมต่อฐานข้อมูลได้', $dbOk, 'ตรวจ DB_HOST, DB_NAME, DB_USER, DB_PASS ใน config.php');
$add('ตารางในฐานข้อมูลครบ', $tablesOk, 'ติดตั้งใหม่: import database/install.sql / ฐานข้อมูลเดิม: import ไฟล์อัปเกรดที่ยังไม่ได้ import เช่น charts.sql');
$add('ตารางกันการเดารหัสผ่าน (login_attempts)', $throttleOk, 'import database/security.sql ใน phpMyAdmin');
$add('สร้างผู้ดูแลระบบแล้ว', $hasAdmin, 'เปิดหน้าเว็บ แล้วสร้างบัญชีผู้ดูแลระบบทันที (หน้า "ตั้งค่าครั้งแรก")');

$up = dirname(__DIR__) . '/uploads';
$add('โฟลเดอร์ uploads เขียนได้', is_dir($up) && is_writable($up), 'ให้ผู้ดูแลเซิร์ฟเวอร์เปิดสิทธิ์เขียนโฟลเดอร์ uploads ให้เว็บเซิร์ฟเวอร์');
$add('uploads มีไฟล์ .htaccess กันสคริปต์', is_file($up . '/.htaccess'), 'คัดลอก uploads/.htaccess จากชุดติดตั้ง');
$add('หน้าเว็บ (index.html) อยู่ที่โฟลเดอร์หลัก', is_file(dirname(__DIR__) . '/index.html'), 'คัดลอกไฟล์ทั้งหมดในชุดติดตั้งไปวาง');
$add('มีไฟล์ .htaccess ที่โฟลเดอร์หลัก', is_file(dirname(__DIR__) . '/.htaccess'), 'คัดลอก .htaccess (ไฟล์ซ่อน) ไปด้วย ไม่งั้นกด F5 แล้วจะขึ้น 404');

$allOk = true;
foreach ($checks as $c) {
    $allOk = $allOk && $c['ok'];
}
function h($s)
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}
?><!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>ตรวจความพร้อมเซิร์ฟเวอร์</title>
<style>
  body { font-family: system-ui, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px 16px; }
  main { max-width: 680px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 6px; }
  .sum { padding: 12px 16px; border-radius: 10px; margin: 12px 0 18px; font-weight: 600; }
  .sum.ok { background: #ecfdf5; color: #065f46; } .sum.no { background: #fef2f2; color: #991b1b; }
  ul { list-style: none; padding: 0; margin: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; }
  li { padding: 10px 14px; border-top: 1px solid #e2e8f0; } li:first-child { border-top: 0; }
  .hint { display: block; color: #b45309; font-size: 14px; margin: 4px 0 0 28px; }
</style>
</head>
<body>
<main>
  <h1>ตรวจความพร้อมเซิร์ฟเวอร์</h1>
  <div class="sum <?= $allOk ? 'ok' : 'no' ?>"><?= $allOk ? '✅ พร้อมใช้งาน' : '❌ ยังมีบางข้อต้องแก้ (ดูคำแนะนำสีส้ม)' ?></div>
  <ul>
  <?php foreach ($checks as $c): ?>
    <li><?= $c['ok'] ? '✅' : '❌' ?> <?= h($c['name']) ?>
      <?php if (!$c['ok']): ?><span class="hint"><?= h($c['hint']) ?></span><?php endif; ?>
    </li>
  <?php endforeach; ?>
  </ul>
</main>
</body>
</html>
