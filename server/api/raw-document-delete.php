<?php
require __DIR__.'/lib.php';require __DIR__.'/raw-document-lib.php';require_method('POST');$me=require_login();$in=read_json();$r=find_raw_document($in['id']??0);require_raw_document_edit($me,$r);
db()->prepare('UPDATE raw_documents SET deleted_at=NOW(),deleted_by=? WHERE id=? AND deleted_at IS NULL')->execute([(int)$me['id'],(int)$r['id']]);json_out(['ok'=>true]);
