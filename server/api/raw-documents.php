<?php
require __DIR__ . '/lib.php';
require __DIR__ . '/raw-document-lib.php';
$me = require_login();
purge_expired_raw_documents();
$year = isset($_GET['year']) ? (int) $_GET['year'] : 0;
$dept = isset($_GET['department_id']) ? (int) $_GET['department_id'] : 0;
$trash = !empty($_GET['trash']);
if ($trash && !can_edit_department($me, $dept)) fail('ดูถังขยะได้เฉพาะฝ่ายของตัวเอง', 403);
$sql = 'SELECT rd.*, d.name AS department_name, u.display_name AS uploaded_by_name FROM raw_documents rd JOIN departments d ON d.id=rd.department_id JOIN users u ON u.id=rd.uploaded_by WHERE rd.academic_year=? AND rd.department_id=? AND rd.deleted_at IS ' . ($trash ? 'NOT NULL' : 'NULL') . ' ORDER BY rd.uploaded_at DESC, rd.id DESC';
$stmt = db()->prepare($sql); $stmt->execute([$year,$dept]);
json_out(array_map(function($r) use($me){
    return [
        'id'=>(int)$r['id'],'departmentId'=>(int)$r['department_id'],'departmentName'=>$r['department_name'],
        'academicYear'=>(int)$r['academic_year'],'originalName'=>$r['original_name'],'description'=>$r['description'],
        'senderName'=>$r['sender_name'],'mimeType'=>$r['mime_type'],'fileSize'=>(int)$r['file_size'],
        'uploadedAt'=>$r['uploaded_at'],'uploadedByName'=>$r['uploaded_by_name'],'deletedAt'=>$r['deleted_at'],
        'canEdit'=>can_edit_department($me,$r['department_id']),'openMode'=>raw_document_extension($r['original_name'])==='pdf'?'inline':'download',
    ];
},$stmt->fetchAll()));
