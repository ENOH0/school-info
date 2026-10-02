<?php
// ตัวช่วยที่ทุก API ใช้ร่วมกัน: ฐานข้อมูล, session (ล็อกอิน), ตรวจสิทธิ์
// ใช้ได้ทั้ง PHP 7.4 และ 8.x
require_once __DIR__ . '/config.php';

date_default_timezone_set('Asia/Bangkok');

// ===== session: จำว่าใครล็อกอินอยู่ =====
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name('SISESSID');
    session_set_cookie_params([
        'lifetime' => 0,          // ปิดเบราว์เซอร์แล้วต้องล็อกอินใหม่
        'path'     => '/',
        'httponly' => true,       // JavaScript อ่าน cookie นี้ไม่ได้
        'samesite' => 'Lax',
        'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
    session_start();
}

/** อ่าน JSON ที่หน้าเว็บส่งมา */
function read_json()
{
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

/** บังคับวิธีส่ง เช่น require_method('POST') */
function require_method($method)
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        json_out(['ok' => false, 'error' => 'วิธีส่งข้อมูลไม่ถูกต้อง'], 405);
    }
}

function fail($message, $status = 400)
{
    json_out(['ok' => false, 'error' => $message], $status);
}

/** ผู้ใช้ที่ล็อกอินอยู่ หรือ null */
function current_user()
{
    if (empty($_SESSION['uid'])) {
        return null;
    }
    $stmt = db()->prepare(
        'SELECT id, username, display_name, role, department_id, is_active FROM users WHERE id = ?'
    );
    $stmt->execute([(int) $_SESSION['uid']]);
    $u = $stmt->fetch();
    if (!$u || (int) $u['is_active'] !== 1) {
        return null;
    }
    return $u;
}

function require_login()
{
    $u = current_user();
    if (!$u) {
        fail('กรุณาเข้าสู่ระบบ', 401);
    }
    return $u;
}

function require_admin()
{
    $u = require_login();
    if ($u['role'] !== 'admin') {
        fail('เฉพาะผู้ดูแลระบบเท่านั้น', 403);
    }
    return $u;
}

/** แอดมินแก้ได้ทุกฝ่าย ผู้ใช้ทั่วไปแก้ได้เฉพาะฝ่ายตัวเอง */
function can_edit_department($user, $departmentId)
{
    return $user['role'] === 'admin'
        || ($user['department_id'] !== null && (int) $user['department_id'] === (int) $departmentId);
}

/** ผู้ใช้ประจำฝ่ายเห็นและกรอกได้เฉพาะฝ่ายตัวเอง (หน้าเล่มสาธารณะยังเห็นทุกฝ่าย) */
function require_department_access($user, $departmentId)
{
    if (!can_edit_department($user, $departmentId)) {
        fail('เข้าถึงได้เฉพาะข้อมูลของฝ่ายตัวเอง', 403);
    }
}

/** โฟลเดอร์เก็บรูป: school-info/uploads (อยู่ข้าง ๆ โฟลเดอร์ api) */
function uploads_dir()
{
    return dirname(__DIR__) . '/uploads';
}

/** ตรวจรายการรูปที่ส่งมากับข้อมูล: [{"file": "abc.jpg", "caption": "..."}] */
function clean_images($raw)
{
    if (!is_array($raw)) {
        return [];
    }
    if (count($raw) > 30) {
        fail('แนบรูปได้ไม่เกิน 30 รูปต่อหัวข้อ');
    }
    $out = [];
    foreach ($raw as $img) {
        $file = isset($img['file']) ? (string) $img['file'] : '';
        if (!preg_match('/^[a-f0-9]{32}\.(jpg|png)$/', $file) || !is_file(uploads_dir() . '/' . $file)) {
            fail('ไม่พบไฟล์รูปบางรูป กรุณาอัปโหลดใหม่');
        }
        $caption = trim(isset($img['caption']) ? (string) $img['caption'] : '');
        if (text_len($caption) > 300) {
            fail('คำบรรยายรูปยาวเกิน 300 ตัวอักษร');
        }
        $out[] = ['file' => $file, 'caption' => $caption];
    }
    return $out;
}

/** หมวดของเล่มสารสนเทศ (ต้องตรงกับ CHAPTERS ใน admin.model.ts) */
function chapters()
{
    return [
        1  => 'ข้อมูลทั่วไป',
        2  => 'ทิศทางการจัดการศึกษา',
        3  => 'การบริหารจัดการ',
        4  => 'ข้อมูลบุคลากร',
        5  => 'ข้อมูลนักเรียน',
        6  => 'หลักสูตรและแหล่งเรียนรู้',
        7  => 'อาคารสถานที่',
        8  => 'งบประมาณ',
        9  => 'ผลการดำเนินงาน',
        10 => 'ผลงานและรางวัล',
        0  => 'อื่น ๆ',
    ];
}

function chapter_label($n)
{
    $c = chapters();
    $n = (int) $n;
    return isset($c[$n]) ? ($n > 0 ? "$n. " : '') . $c[$n] : $c[0];
}

/** ข้อมูลผู้ใช้ที่ส่งให้หน้าเว็บ (ไม่มีรหัสผ่าน) */
function public_user($u)
{
    return [
        'id'           => (int) $u['id'],
        'username'     => $u['username'],
        'displayName'  => $u['display_name'],
        'role'         => $u['role'],
        'departmentId' => $u['department_id'] === null ? null : (int) $u['department_id'],
    ];
}

/** ดึงหัวข้อ 1 รายการ ไม่เจอให้ตอบ 404 */
function find_topic($id)
{
    $stmt = db()->prepare('SELECT * FROM topics WHERE id = ?');
    $stmt->execute([(int) $id]);
    $t = $stmt->fetch();
    if (!$t) {
        fail('ไม่พบหัวข้อนี้', 404);
    }
    return $t;
}

function topic_columns($topic)
{
    $cols = json_decode((string) $topic['columns_json'], true);
    return is_array($cols) ? $cols : [];
}

/** หัวข้อรายปีเก็บที่ term = 0 เสมอ */
function record_term($topic, $term)
{
    return $topic['frequency'] === 'year' ? 0 : (int) $term;
}

function now_str()
{
    return date('Y-m-d H:i:s');
}

/** ความยาวข้อความภาษาไทยแบบนับตัวอักษร */
function text_len($s)
{
    return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : strlen($s);
}
