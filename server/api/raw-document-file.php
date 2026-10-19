<?php
require __DIR__.'/lib.php';require __DIR__.'/raw-document-lib.php';$me=require_login();purge_expired_raw_documents();$r=find_raw_document($_GET['id']??0);
if($r['deleted_at']!==null)require_raw_document_edit($me,$r);$path=raw_documents_dir().'/'.$r['stored_name'];if(!is_file($path))fail('ไม่พบไฟล์เอกสาร',404);
$inline=raw_document_extension($r['original_name'])==='pdf';$name=safe_download_name($r['original_name']);
header('Content-Type: '.$r['mime_type']);header('Content-Length: '.filesize($path));header('Content-Disposition: '.($inline?'inline':'attachment').'; filename="'.rawurlencode($name).'"; filename*=UTF-8\'\''.rawurlencode($name));header('X-Content-Type-Options: nosniff');header('Cache-Control: private, no-store');readfile($path);exit;
