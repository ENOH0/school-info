<?php
require __DIR__ . '/lib.php';
require __DIR__ . '/raw-document-lib.php';
require_method('POST'); $me=require_login(); purge_expired_raw_documents();
$dept=isset($_POST['department_id'])?(int)$_POST['department_id']:0;
$year=isset($_POST['academic_year'])?(int)$_POST['academic_year']:0;
if(!can_edit_department($me,$dept)) fail('อัปโหลดได้เฉพาะฝ่ายของตัวเอง',403);
$chk=db()->prepare('SELECT COUNT(*) FROM terms WHERE academic_year=? AND term=0');$chk->execute([$year]);if(!(int)$chk->fetchColumn())fail('ไม่พบปีการศึกษานี้');
if(!isset($_FILES['file'])||$_FILES['file']['error']!==UPLOAD_ERR_OK) fail('อัปโหลดไม่สำเร็จ กรุณาตรวจขนาดไฟล์และการตั้งค่าเซิร์ฟเวอร์');
$f=$_FILES['file']; if((int)$f['size']>RAW_DOCUMENT_MAX_BYTES)fail('ไฟล์ต้องมีขนาดไม่เกิน 20 MB');
$original=trim((string)$f['name']);$ext=raw_document_extension($original);$mime=raw_document_type($ext);if(!$mime)fail('รองรับเฉพาะ PDF, Word และ Excel');
$description=trim(isset($_POST['description'])?(string)$_POST['description']:'');$sender=trim(isset($_POST['sender_name'])?(string)$_POST['sender_name']:'');
if(text_len($original)>255||text_len($description)>1000||text_len($sender)>150)fail('ชื่อไฟล์ คำอธิบาย หรือชื่อผู้ส่งยาวเกินกำหนด');
$stored=bin2hex(random_bytes(20)).'.'.$ext;$dest=ensure_raw_documents_dir().'/'.$stored;
if(!move_uploaded_file($f['tmp_name'],$dest))fail('บันทึกไฟล์ไม่สำเร็จ',500);
try{db()->prepare('INSERT INTO raw_documents(department_id,academic_year,original_name,stored_name,mime_type,file_size,description,sender_name,uploaded_by) VALUES(?,?,?,?,?,?,?,?,?)')->execute([$dept,$year,$original,$stored,$mime,(int)$f['size'],$description,$sender===''?null:$sender,(int)$me['id']]);}
catch(Throwable $e){@unlink($dest);throw $e;}
json_out(['ok'=>true,'id'=>(int)db()->lastInsertId()],201);
