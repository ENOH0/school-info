<?php
require __DIR__.'/lib.php';require __DIR__.'/raw-document-lib.php';require_method('POST');$me=require_login();purge_expired_raw_documents();$in=read_json();$r=find_raw_document($in['id']??0);require_raw_document_edit($me,$r);
if(!is_file(raw_documents_dir().'/'.$r['stored_name']))fail('ไฟล์นี้ถูกลบถาวรแล้ว',410);db()->prepare('UPDATE raw_documents SET deleted_at=NULL,deleted_by=NULL WHERE id=?')->execute([(int)$r['id']]);json_out(['ok'=>true]);
