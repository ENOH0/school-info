<?php
// ตัวช่วยที่ทุก API ใช้ร่วมกัน: ฐานข้อมูล, session (ล็อกอิน), ตรวจสิทธิ์
// ใช้ได้ทั้ง PHP 7.4 และ 8.x
// ===== ข้อผิดพลาดของระบบ =====
// บนเซิร์ฟเวอร์: ไม่โชว์รายละเอียด (อาจมีชื่อไฟล์/รหัสฐานข้อมูล) แต่เขียนลง error log ของ Apache
// ในเครื่องตัวเอง (localhost): โชว์รายละเอียดให้แก้ง่าย
function is_local_request()
{
    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
    return $ip === '127.0.0.1' || $ip === '::1';
}
ini_set('display_errors', '0');
ini_set('log_errors', '1');
set_exception_handler(function ($e) {
    error_log('[school-info] ' . get_class($e) . ': ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    $msg = 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่ หรือแจ้งผู้ดูแลระบบ';
    if (is_local_request()) {
        $msg .= ' [' . $e->getMessage() . ' @ ' . basename($e->getFile()) . ':' . $e->getLine() . ']';
    }
    echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
});

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

// ===== ล็อกหลังเผยแพร่ =====

/**
 * ข้อมูลของช่วงเวลานี้ถูกล็อกหรือยัง
 * - รายภาคเรียน (term 1, 2): ล็อกเมื่อเล่มของภาคเรียนนั้นเผยแพร่แล้ว
 * - รายปี (term 0): ล็อกเมื่อมีเล่มใดเล่มหนึ่งของปีนั้นเผยแพร่แล้ว เพราะข้อมูลรายปีแสดงในทุกเล่มของปี
 */
function period_locked($year, $term)
{
    if ((int) $term === 0) {
        $stmt = db()->prepare('SELECT COUNT(*) FROM terms WHERE is_published = 1 AND academic_year = ?');
        $stmt->execute([(int) $year]);
    } else {
        $stmt = db()->prepare('SELECT COUNT(*) FROM terms WHERE is_published = 1 AND academic_year = ? AND term = ?');
        $stmt->execute([(int) $year, (int) $term]);
    }
    return (int) $stmt->fetchColumn() > 0;
}

/** หัวข้อนี้มีข้อมูลอยู่ในเล่มที่เผยแพร่แล้วหรือไม่ (ถ้ามี ห้ามแก้ชื่อ คอลัมน์ หรือลำดับ) */
function topic_locked($topicId)
{
    $stmt = db()->prepare(
        'SELECT COUNT(*) FROM records r
          WHERE r.topic_id = ?
            AND EXISTS (SELECT 1 FROM terms t
                         WHERE t.is_published = 1 AND t.academic_year = r.academic_year
                           AND (r.term = 0 OR t.term = r.term))'
    );
    $stmt->execute([(int) $topicId]);
    return (int) $stmt->fetchColumn() > 0;
}

function require_period_unlocked($year, $term)
{
    if (period_locked($year, $term)) {
        fail('เล่มนี้เผยแพร่แล้ว แก้ไขไม่ได้ (ให้ผู้ดูแลระบบยกเลิกเผยแพร่ก่อน)', 423);
    }
}

function require_topic_unlocked($topicId)
{
    if (topic_locked($topicId)) {
        fail('หัวข้อนี้อยู่ในเล่มที่เผยแพร่แล้ว แก้ไขหัวข้อไม่ได้ (ให้ผู้ดูแลระบบยกเลิกเผยแพร่ก่อน)', 423);
    }
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

// ===== คัดลอกจากครั้งก่อน =====

/**
 * ข้อมูลครั้งล่าสุดก่อนช่วงเวลานี้ของหัวข้อ (ไว้คัดลอกมาใช้ต่อ)
 * - หัวข้อรายปี (term 0): ปีการศึกษาก่อนหน้าที่มีข้อมูล
 * - หัวข้อรายภาคเรียน: ภาคเรียนก่อนหน้าที่มีข้อมูล เช่น 2/2569 → 1/2569 → 2/2568
 * คืนค่าแถวของ records หรือ null
 */
function previous_record($topicId, $year, $term)
{
    if ((int) $term === 0) {
        $stmt = db()->prepare(
            'SELECT * FROM records WHERE topic_id = ? AND term = 0 AND academic_year < ?
              ORDER BY academic_year DESC LIMIT 1'
        );
        $stmt->execute([(int) $topicId, (int) $year]);
    } else {
        $stmt = db()->prepare(
            'SELECT * FROM records WHERE topic_id = ? AND term > 0
                AND (academic_year < ? OR (academic_year = ? AND term < ?))
              ORDER BY academic_year DESC, term DESC LIMIT 1'
        );
        $stmt->execute([(int) $topicId, (int) $year, (int) $year, (int) $term]);
    }
    $r = $stmt->fetch();
    return $r ? $r : null;
}

function period_text($year, $term)
{
    return (int) $term === 0 ? 'ปีการศึกษา ' . (int) $year : 'ภาคเรียนที่ ' . (int) $term . '/' . (int) $year;
}

/** ข้อมูลที่คัดลอกมาแล้วยังไม่ได้กดบันทึก จะมีป้าย copiedFrom เช่น "ภาคเรียนที่ 1/2569" (บันทึกครั้งแรกป้ายจะหายเอง) */
function copied_from($dataJson)
{
    if ($dataJson === null) {
        return null;
    }
    $d = json_decode((string) $dataJson, true);
    return is_array($d) && isset($d['copiedFrom']) ? (string) $d['copiedFrom'] : null;
}

// ===== ผลรวมอัตโนมัติ =====

/** จำนวนตำแหน่งทศนิยมของตัวเลข (ไว้ปัดผลรวม เช่น 0.1 + 0.2 = 0.3 ไม่ใช่ 0.30000000000000004) */
function decimals_of($n)
{
    $s = (string) $n;
    $p = strpos($s, '.');
    return $p === false ? 0 : min(4, strlen($s) - $p - 1);
}

function add_numbers($values)
{
    $sum = 0;
    $dec = 0;
    $any = false;
    foreach ($values as $v) {
        if (is_int($v) || is_float($v)) {
            $sum += $v;
            $dec = max($dec, decimals_of($v));
            $any = true;
        }
    }
    if (!$any) {
        return null;
    }
    return $dec === 0 ? (int) round($sum) : round($sum, $dec);
}

/**
 * เติมคอลัมน์ผลรวมในแต่ละแถว และคำนวณแถว "รวม" ท้ายตาราง
 * คืนค่า [rows ที่เติมแล้ว, แถวรวม หรือ null ถ้าไม่มีคอลัมน์ไหนเลือกให้รวม]
 */
function compute_table($cols, $rows)
{
    $out = [];
    foreach ($rows as $r) {
        $r = is_array($r) ? $r : [];
        foreach ($cols as $c) {
            if ($c['type'] === 'sum') {
                $vals = [];
                foreach (isset($c['of']) ? $c['of'] : [] as $k) {
                    $vals[] = isset($r[$k]) ? $r[$k] : null;
                }
                $r[$c['key']] = add_numbers($vals);
            }
        }
        $out[] = $r;
    }

    $foot = null;
    foreach ($cols as $c) {
        if (!empty($c['total'])) {
            $foot = [];
            break;
        }
    }
    if ($foot !== null) {
        $labelDone = false;
        foreach ($cols as $c) {
            if (!empty($c['total'])) {
                $vals = [];
                foreach ($out as $r) {
                    $vals[] = isset($r[$c['key']]) ? $r[$c['key']] : null;
                }
                $v = add_numbers($vals);
                $foot[$c['key']] = $v === null ? 0 : $v;
            } elseif (!$labelDone && $c['type'] === 'text') {
                $foot[$c['key']] = 'รวม';
                $labelDone = true;
            } else {
                $foot[$c['key']] = null;
            }
        }
    }
    return [$out, $foot];
}

// ===== กราฟ =====

/** การตั้งค่ากราฟของหัวข้อ หรือ null ถ้าไม่มีกราฟ: ['type' => bar|line|pie, 'series' => [keys], 'trend' => bool] */
function topic_chart($topic)
{
    if (!isset($topic['chart_json']) || $topic['chart_json'] === null) {
        return null;
    }
    $c = json_decode((string) $topic['chart_json'], true);
    if (is_array($c) && isset($c['type']) && $c['type'] === 'none') {
        return null; // ผู้ดูแลเลือกปิดกราฟของหัวข้อนี้โดยเฉพาะ
    }
    return is_array($c) && isset($c['type'], $c['series']) ? $c : null;
}

/** ตรวจค่ากราฟที่ส่งมาจากหน้าแก้ไขหัวข้อ คืน JSON ที่จะเก็บ หรือ null = ไม่มีกราฟ */
function clean_chart($raw, $columns)
{
    if (is_array($raw) && isset($raw['type']) && $raw['type'] === 'none') {
        // เก็บค่า none ไว้เพื่อแยกจาก NULL ซึ่งหมายถึงหัวข้อเก่าที่ยังไม่เคยตั้งค่ากราฟ
        return json_encode(['type' => 'none', 'series' => [], 'trend' => false]);
    }
    if (!is_array($raw) || !isset($raw['type']) || !in_array($raw['type'], ['bar', 'line', 'pie'], true)) {
        return null;
    }
    $numeric = [];
    foreach ($columns as $c) {
        if ($c['type'] !== 'text') {
            $numeric[$c['key']] = true;
        }
    }
    $series = [];
    foreach (isset($raw['series']) && is_array($raw['series']) ? $raw['series'] : [] as $k) {
        $k = (string) $k;
        if (isset($numeric[$k]) && !in_array($k, $series, true)) {
            $series[] = $k;
        }
    }
    if (count($series) === 0) {
        fail('กราฟ: เลือกคอลัมน์ตัวเลขที่จะแสดงในกราฟอย่างน้อย 1 คอลัมน์');
    }
    if ($raw['type'] === 'pie') {
        $series = [$series[0]]; // กราฟวงกลมใช้ได้คอลัมน์เดียว
    }
    return json_encode([
        'type'   => $raw['type'],
        'series' => $series,
        'trend'  => !empty($raw['trend']),
    ]);
}

/** ป้ายชื่อช่วงเวลาบนกราฟแนวโน้ม เช่น "1/2569" หรือ "2569" */
function period_short($year, $term)
{
    return (int) $term === 0 ? (string) (int) $year : (int) $term . '/' . (int) $year;
}

// ===== กันการเดารหัสผ่าน =====
// ใส่รหัสผิด 5 ครั้งใน 15 นาที (ชื่อผู้ใช้เดียวกัน จากเครื่องเดียวกัน) → ล็อก 15 นาที
// เครื่องเดียวกันผิดรวมทุกชื่อ 20 ครั้งใน 15 นาที → ล็อกทั้งเครื่อง 15 นาที
// ล็อกอินสำเร็จ หรือผู้ดูแลตั้งรหัสใหม่ให้ = ล้างประวัติของชื่อนั้น
define('LOGIN_MAX_PER_USER', 5);
define('LOGIN_MAX_PER_IP', 20);
define('LOGIN_WINDOW_MIN', 15);

function client_ip()
{
    // ใช้ REMOTE_ADDR เท่านั้น (X-Forwarded-For ปลอมได้)
    return isset($_SERVER['REMOTE_ADDR']) ? substr((string) $_SERVER['REMOTE_ADDR'], 0, 45) : '';
}

function throttle_key($name)
{
    $name = trim((string) $name);
    $name = function_exists('mb_strtolower') ? mb_strtolower($name, 'UTF-8') : strtolower($name);
    return substr($name, 0, 100);
}

/** ต้องรออีกกี่วินาที (0 = ลองได้เลย) */
function login_wait_seconds($name)
{
    $window = LOGIN_WINDOW_MIN * 60;
    $since = date('Y-m-d H:i:s', time() - $window);
    $checks = [
        ['SELECT attempted_at FROM login_attempts WHERE username = ? AND ip = ? AND attempted_at > ?
           ORDER BY attempted_at DESC LIMIT 1 OFFSET ' . (LOGIN_MAX_PER_USER - 1), [throttle_key($name), client_ip(), $since]],
        ['SELECT attempted_at FROM login_attempts WHERE ip = ? AND attempted_at > ?
           ORDER BY attempted_at DESC LIMIT 1 OFFSET ' . (LOGIN_MAX_PER_IP - 1), [client_ip(), $since]],
    ];
    $wait = 0;
    try {
        foreach ($checks as $c) {
            $stmt = db()->prepare($c[0]);
            $stmt->execute($c[1]);
            $t = $stmt->fetchColumn();
            if ($t) {
                $wait = max($wait, strtotime($t) + $window - time());
            }
        }
    } catch (PDOException $e) {
        // ยังไม่ได้ import security.sql: ให้ล็อกอินได้ตามปกติ แต่บันทึกเตือนไว้
        error_log('[school-info] login_attempts: ' . $e->getMessage());
        return 0;
    }
    return max(0, $wait);
}

/** หยุดทันทีถ้ายังอยู่ในช่วงล็อก */
function require_not_throttled($name)
{
    $wait = login_wait_seconds($name);
    if ($wait > 0) {
        header('Retry-After: ' . $wait);
        fail('ใส่รหัสผ่านผิดหลายครั้ง กรุณารออีกประมาณ ' . max(1, (int) ceil($wait / 60)) . ' นาที แล้วลองใหม่ (หรือให้ผู้ดูแลระบบตั้งรหัสผ่านใหม่ให้)', 429);
    }
}

function login_failed($name)
{
    try {
        db()->prepare('INSERT INTO login_attempts (username, ip, attempted_at) VALUES (?, ?, ?)')
            ->execute([throttle_key($name), client_ip(), now_str()]);
        // ล้างของเก่าเกิน 1 วัน
        db()->prepare('DELETE FROM login_attempts WHERE attempted_at < ?')
            ->execute([date('Y-m-d H:i:s', time() - 86400)]);
    } catch (PDOException $e) {
        error_log('[school-info] login_attempts: ' . $e->getMessage());
    }
}

/** ล้างประวัติผิดของชื่อนี้ (ip = null คือทุกเครื่อง ใช้ตอนผู้ดูแลตั้งรหัสใหม่) */
function login_clear($name, $ip = '')
{
    try {
        if ($ip === null) {
            db()->prepare('DELETE FROM login_attempts WHERE username = ?')->execute([throttle_key($name)]);
        } else {
            db()->prepare('DELETE FROM login_attempts WHERE username = ? AND ip = ?')->execute([throttle_key($name), client_ip()]);
        }
    } catch (PDOException $e) {
        error_log('[school-info] login_attempts: ' . $e->getMessage());
    }
}

/** จำนวนครั้งที่ผิดล่าสุดของชื่อนี้จากเครื่องนี้ (ไว้เตือนว่าเหลืออีกกี่ครั้ง) */
function count_recent_failures($name)
{
    try {
        $stmt = db()->prepare('SELECT COUNT(*) FROM login_attempts WHERE username = ? AND ip = ? AND attempted_at > ?');
        $stmt->execute([throttle_key($name), client_ip(), date('Y-m-d H:i:s', time() - LOGIN_WINDOW_MIN * 60)]);
        return (int) $stmt->fetchColumn();
    } catch (PDOException $e) {
        return 0;
    }
}
