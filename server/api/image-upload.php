<?php
// อัปโหลดรูป 1 รูป แล้วตอบชื่อไฟล์กลับไป (รูปจะผูกกับหัวข้อจริงตอนกด "บันทึก" ในหน้ากรอกข้อมูล)
// POST แบบ multipart: file = ไฟล์รูป, topic_id = รหัสหัวข้อ
// หน้าเว็บย่อรูปให้ก่อนส่งแล้ว (ด้านยาวไม่เกิน 1600px) จึงไม่ติดขนาดไฟล์สูงสุดของเซิร์ฟเวอร์
require __DIR__ . '/lib.php';
require_method('POST');
$me = require_login();

$topic = find_topic(isset($_POST['topic_id']) ? (int) $_POST['topic_id'] : 0);
if (!can_edit_department($me, $topic['department_id'])) {
    fail('อัปโหลดได้เฉพาะหัวข้อของฝ่ายตัวเอง', 403);
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $code = isset($_FILES['file']) ? $_FILES['file']['error'] : -1;
    fail($code === UPLOAD_ERR_INI_SIZE || $code === UPLOAD_ERR_FORM_SIZE
        ? 'ไฟล์ใหญ่เกินที่เซิร์ฟเวอร์รับได้'
        : 'อัปโหลดไม่สำเร็จ');
}

$tmp = $_FILES['file']['tmp_name'];
if (filesize($tmp) > 8 * 1024 * 1024) {
    fail('ไฟล์ใหญ่เกิน 8 MB');
}

// ตรวจว่าเป็นรูปจริง (ไม่เชื่อนามสกุลไฟล์)
$info = @getimagesize($tmp);
$types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png'];
if (!$info || !isset($types[$info[2]])) {
    fail('รองรับเฉพาะรูป JPG และ PNG');
}
$ext = $types[$info[2]];

$dir = uploads_dir();
if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
    fail('สร้างโฟลเดอร์ uploads ไม่ได้ (ตรวจสิทธิ์การเขียนไฟล์บนเซิร์ฟเวอร์)', 500);
}

$name = bin2hex(random_bytes(16)) . '.' . $ext;
$dest = $dir . '/' . $name;

// ถ้ามี GD: บันทึกรูปใหม่ เพื่อตัดข้อมูลแฝงในไฟล์ เช่น พิกัด GPS ของกล้องมือถือ
$saved = false;
if (function_exists('imagecreatefromjpeg')) {
    $img = $ext === 'jpg' ? @imagecreatefromjpeg($tmp) : @imagecreatefrompng($tmp);
    if ($img) {
        if ($ext === 'png') {
            imagesavealpha($img, true);
            $saved = imagepng($img, $dest, 6);
        } else {
            $saved = imagejpeg($img, $dest, 85);
        }
        imagedestroy($img);
    }
}
if (!$saved && !move_uploaded_file($tmp, $dest)) {
    fail('บันทึกไฟล์ไม่สำเร็จ', 500);
}

json_out(['ok' => true, 'file' => $name, 'url' => 'uploads/' . $name], 201);
