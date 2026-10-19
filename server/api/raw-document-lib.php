<?php

if (!defined('RAW_DOCUMENT_MAX_BYTES')) define('RAW_DOCUMENT_MAX_BYTES', 20 * 1024 * 1024);
if (!defined('RAW_DOCUMENT_RETENTION_DAYS')) define('RAW_DOCUMENT_RETENTION_DAYS', 30);

function raw_documents_dir()
{
    return dirname(__DIR__) . '/raw-uploads';
}

function ensure_raw_documents_dir()
{
    $dir = raw_documents_dir();
    if (!is_dir($dir) && !mkdir($dir, 0750, true)) {
        throw new RuntimeException('สร้างโฟลเดอร์เก็บข้อมูลดิบไม่สำเร็จ');
    }
    return $dir;
}

function purge_expired_raw_documents()
{
    $stmt = db()->prepare('SELECT id, stored_name FROM raw_documents WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL ? DAY)');
    $stmt->execute([RAW_DOCUMENT_RETENTION_DAYS]);
    $rows = $stmt->fetchAll();
    if (!$rows) return;
    $del = db()->prepare('DELETE FROM raw_documents WHERE id = ? AND deleted_at IS NOT NULL');
    foreach ($rows as $row) {
        $path = raw_documents_dir() . '/' . $row['stored_name'];
        if (is_file($path)) @unlink($path);
        $del->execute([(int) $row['id']]);
    }
}

function find_raw_document($id)
{
    $stmt = db()->prepare('SELECT rd.*, d.name AS department_name, u.display_name AS uploaded_by_name FROM raw_documents rd JOIN departments d ON d.id=rd.department_id JOIN users u ON u.id=rd.uploaded_by WHERE rd.id=?');
    $stmt->execute([(int) $id]);
    $row = $stmt->fetch();
    if (!$row) fail('ไม่พบเอกสารนี้', 404);
    return $row;
}

function require_raw_document_edit($user, $row)
{
    if (!can_edit_department($user, $row['department_id'])) fail('แก้ไขได้เฉพาะเอกสารของฝ่ายตัวเอง', 403);
}

function raw_document_extension($name)
{
    return strtolower(pathinfo((string) $name, PATHINFO_EXTENSION));
}

function raw_document_type($ext)
{
    $types = [
        'pdf'=>'application/pdf', 'doc'=>'application/msword',
        'docx'=>'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls'=>'application/vnd.ms-excel',
        'xlsx'=>'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    return isset($types[$ext]) ? $types[$ext] : null;
}

function safe_download_name($name)
{
    return str_replace(["\r", "\n", '"'], '', (string) $name);
}
