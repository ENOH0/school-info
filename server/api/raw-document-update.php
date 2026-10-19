<?php
require __DIR__.'/lib.php';require __DIR__.'/raw-document-lib.php';require_method('POST');$me=require_login();$in=read_json();$r=find_raw_document($in['id']??0);require_raw_document_edit($me,$r);
$description=trim(isset($in['description'])?(string)$in['description']:'');$sender=trim(isset($in['senderName'])?(string)$in['senderName']:'');if(text_len($description)>1000||text_len($sender)>150)fail('ข้อมูลยาวเกินกำหนด');
db()->prepare('UPDATE raw_documents SET description=?,sender_name=?,updated_at=NOW() WHERE id=?')->execute([$description,$sender===''?null:$sender,(int)$r['id']]);json_out(['ok'=>true]);
