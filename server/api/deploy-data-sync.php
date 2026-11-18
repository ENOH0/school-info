<?php

// เครื่องมือสำหรับ Deploy เท่านั้น: เรียกได้จาก PHP CLI ไม่เปิดให้เรียกผ่านเว็บ
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$configPath = getenv('SCHOOL_INFO_CONFIG');
require $configPath !== false && $configPath !== '' ? $configPath : __DIR__ . '/config.php';

function sync_fail($message, $code = 2)
{
    fwrite(STDERR, $message . PHP_EOL);
    exit($code);
}

function sync_write_json($path, $payload)
{
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if ($json === false || file_put_contents($path, $json, LOCK_EX) === false) {
        throw new RuntimeException('สร้างไฟล์ข้อมูล Local สำหรับ Deploy ไม่สำเร็จ');
    }
}

function export_local_records($path)
{
    $sql = 'SELECT t.id AS topic_id, d.code AS department_code, t.title AS topic_title,
                   r.academic_year, r.term, r.data_json, r.updated_at,
                   u.username AS updated_by_username
            FROM records r
            INNER JOIN topics t ON t.id = r.topic_id
            INNER JOIN departments d ON d.id = t.department_id
            LEFT JOIN users u ON u.id = r.updated_by
            ORDER BY d.code, t.title, r.academic_year, r.term';
    $rows = db()->query($sql)->fetchAll();
    if (count($rows) > 20000) {
        throw new RuntimeException('ข้อมูล Local มีมากเกินขอบเขตการ Deploy (20,000 รายการ)');
    }

    $rawSql = 'SELECT d.code AS department_code, rd.academic_year, rd.original_name,
                      rd.stored_name, rd.mime_type, rd.file_size, rd.description,
                      rd.sender_name, uploader.username AS uploaded_by_username,
                      rd.uploaded_at, rd.updated_at, rd.deleted_at,
                      deleter.username AS deleted_by_username
               FROM raw_documents rd
               INNER JOIN departments d ON d.id=rd.department_id
               INNER JOIN users uploader ON uploader.id=rd.uploaded_by
               LEFT JOIN users deleter ON deleter.id=rd.deleted_by
               ORDER BY rd.academic_year, d.code, rd.id';
    $rawDocuments = db()->query($rawSql)->fetchAll();
    if (count($rawDocuments) > 20000) {
        throw new RuntimeException('ข้อมูลดิบมีมากเกินขอบเขตการซิงก์ (20,000 รายการ)');
    }

    sync_write_json($path, [
        'format' => 'school-info-local-record-sync',
        'version' => 2,
        'generated_at' => date(DATE_ATOM),
        'records' => $rows,
        'raw_documents' => $rawDocuments,
    ]);
    echo 'LOCAL_SYNC_EXPORT records=' . count($rows)
        . ' raw_documents=' . count($rawDocuments) . ' file=' . $path . PHP_EOL;
}

function read_sync_payload($path)
{
    if (!is_file($path) || filesize($path) > 100 * 1024 * 1024) {
        throw new RuntimeException('ไม่พบไฟล์ข้อมูล Local หรือไฟล์มีขนาดเกิน 100 MB');
    }
    $payload = json_decode((string) file_get_contents($path), true);
    if (!is_array($payload)
        || ($payload['format'] ?? '') !== 'school-info-local-record-sync'
        || !in_array((int) ($payload['version'] ?? 0), [1, 2], true)
        || !isset($payload['records'])
        || !is_array($payload['records'])
        || count($payload['records']) > 20000) {
        throw new RuntimeException('รูปแบบไฟล์ข้อมูล Local ไม่ถูกต้อง');
    }
    if ((int) $payload['version'] === 1) $payload['raw_documents'] = [];
    if (!isset($payload['raw_documents']) || !is_array($payload['raw_documents']) || count($payload['raw_documents']) > 20000) {
        throw new RuntimeException('รายการข้อมูลดิบในไฟล์ซิงก์ไม่ถูกต้อง');
    }
    return $payload;
}

function validate_record_row($row)
{
    if (!is_array($row)) {
        throw new RuntimeException('รายการข้อมูล Local ไม่ถูกต้อง');
    }
    $localTopicId = (int) ($row['topic_id'] ?? 0);
    $departmentCode = (string) ($row['department_code'] ?? '');
    $topicTitle = trim((string) ($row['topic_title'] ?? ''));
    $year = (int) ($row['academic_year'] ?? 0);
    $term = (int) ($row['term'] ?? -1);
    $dataJson = (string) ($row['data_json'] ?? '');
    $updatedAt = (string) ($row['updated_at'] ?? '');
    if ($localTopicId <= 0
        || !preg_match('/^[a-z0-9_-]{1,20}$/', $departmentCode)
        || $topicTitle === '' || strlen($topicTitle) > 600
        || $year < 2400 || $year > 3000 || $term !== 0
        || strlen($dataJson) > 16 * 1024 * 1024
        || json_decode($dataJson, true) === null && json_last_error() !== JSON_ERROR_NONE
        || !preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $updatedAt)) {
        throw new RuntimeException('พบรายการข้อมูล Local ที่ไม่ผ่านการตรวจสอบ');
    }
    return [$localTopicId, $departmentCode, $topicTitle, $year, $term, $dataJson, $updatedAt];
}

function verify_record_images($dataJson)
{
    $configuredDir = getenv('SCHOOL_INFO_UPLOADS_DIR');
    $uploadsDir = $configuredDir !== false && $configuredDir !== ''
        ? rtrim($configuredDir, '/\\')
        : dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads';
    $data = json_decode($dataJson, true);
    $images = isset($data['images']) && is_array($data['images']) ? $data['images'] : [];
    foreach ($images as $image) {
        $file = basename((string) ($image['file'] ?? ''));
        if (!preg_match('/^[a-f0-9]{32}\.(jpg|png)$/', $file)
            || !is_file($uploadsDir . DIRECTORY_SEPARATOR . $file)) {
            throw new RuntimeException('ไม่พบรูปประกอบบนเซิร์ฟเวอร์: ' . $file);
        }
    }
}

function sync_raw_uploads_dir()
{
    $configuredDir = getenv('SCHOOL_INFO_RAW_UPLOADS_DIR');
    return $configuredDir !== false && $configuredDir !== ''
        ? rtrim($configuredDir, '/\\')
        : dirname(__DIR__) . DIRECTORY_SEPARATOR . 'raw-uploads';
}

function validate_raw_document_row($row, $requireFile = true)
{
    if (!is_array($row)) throw new RuntimeException('รายการข้อมูลดิบไม่ถูกต้อง');
    $departmentCode = (string) ($row['department_code'] ?? '');
    $year = (int) ($row['academic_year'] ?? 0);
    $originalName = trim((string) ($row['original_name'] ?? ''));
    $storedName = (string) ($row['stored_name'] ?? '');
    $mimeType = (string) ($row['mime_type'] ?? '');
    $fileSize = (int) ($row['file_size'] ?? 0);
    $uploadedBy = (string) ($row['uploaded_by_username'] ?? '');
    $uploadedAt = (string) ($row['uploaded_at'] ?? '');
    $updatedAt = (string) ($row['updated_at'] ?? '');
    if (!preg_match('/^[a-z0-9_-]{1,20}$/', $departmentCode)
        || $year < 2400 || $year > 3000
        || $originalName === '' || strlen($originalName) > 1000
        || !preg_match('/^[a-f0-9]{40}\.(pdf|doc|docx|xls|xlsx)$/', $storedName)
        || $mimeType === '' || strlen($mimeType) > 150
        || $fileSize <= 0 || $fileSize > 1024 * 1024 * 1024
        || $uploadedBy === '' || strlen($uploadedBy) > 50
        || !preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $uploadedAt)
        || !preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $updatedAt)
        || (($row['deleted_at'] ?? null) !== null
            && !preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', (string) $row['deleted_at']))) {
        throw new RuntimeException('พบข้อมูลดิบที่ไม่ผ่านการตรวจสอบ: ' . $originalName);
    }
    if ($requireFile && !is_file(sync_raw_uploads_dir() . DIRECTORY_SEPARATOR . $storedName)) {
        throw new RuntimeException('ไม่พบไฟล์ข้อมูลดิบ: ' . $storedName);
    }
    return [$departmentCode, $year, $originalName, $storedName, $mimeType, $fileSize, $uploadedBy, $updatedAt];
}

function raw_document_signature($row)
{
    $keys = ['department_code', 'academic_year', 'original_name', 'stored_name', 'mime_type',
        'file_size', 'description', 'sender_name', 'uploaded_by_username', 'uploaded_at',
        'updated_at', 'deleted_at', 'deleted_by_username'];
    $out = [];
    foreach ($keys as $key) $out[$key] = $row[$key] ?? null;
    return json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function compare_incoming_records($path)
{
    $payload = read_sync_payload($path);
    $pdo = db();
    $topicStmt = $pdo->prepare(
        'SELECT t.id FROM topics t INNER JOIN departments d ON d.id=t.department_id
         WHERE d.code=? AND t.title=? ORDER BY t.id'
    );
    $topicIdStmt = $pdo->prepare(
        'SELECT t.id FROM topics t INNER JOIN departments d ON d.id=t.department_id
         WHERE t.id=? AND d.code=? LIMIT 1'
    );
    $findStmt = $pdo->prepare(
        'SELECT data_json, updated_by, updated_at FROM records WHERE topic_id=? AND academic_year=? AND term=? LIMIT 1'
    );
    $stats = ['insert' => 0, 'update' => 0, 'unchanged' => 0, 'target_newer' => 0];
    $details = [];

    foreach ($payload['records'] as $row) {
        [$incomingTopicId, $departmentCode, $topicTitle, $year, $term, $dataJson, $updatedAt] = validate_record_row($row);
        $topicIdStmt->execute([$incomingTopicId, $departmentCode]);
        $topicId = $topicIdStmt->fetchColumn();
        if ($topicId === false) {
            $topicStmt->execute([$departmentCode, $topicTitle]);
            $topicIds = $topicStmt->fetchAll(PDO::FETCH_COLUMN);
            if (count($topicIds) !== 1) {
                throw new RuntimeException('จับคู่หัวข้อในฐานปลายทางไม่ได้หรือหัวข้อซ้ำ: ' . $topicTitle);
            }
            $topicId = $topicIds[0];
        }
        $findStmt->execute([(int) $topicId, $year, $term]);
        $current = $findStmt->fetch();
        if (!$current) {
            $stats['insert']++;
            if (count($details) < 30) $details[] = '[เพิ่ม] ' . $year . ' · ' . $topicTitle;
        } elseif ((string) $current['data_json'] === $dataJson) {
            $stats['unchanged']++;
        } elseif ($current['updated_by'] !== null && (string) $current['updated_at'] >= $updatedAt) {
            $stats['target_newer']++;
            if (count($details) < 30) $details[] = '[เก็บข้อมูล Local ที่ใหม่กว่า] ' . $year . ' · ' . $topicTitle;
        } else {
            $stats['update']++;
            if (count($details) < 30) $details[] = '[อัปเดตจาก Server] ' . $year . ' · ' . $topicTitle;
        }
    }

    $rawFindStmt = $pdo->prepare(
        'SELECT d.code AS department_code, rd.academic_year, rd.original_name, rd.stored_name,
                rd.mime_type, rd.file_size, rd.description, rd.sender_name,
                uploader.username AS uploaded_by_username, rd.uploaded_at, rd.updated_at,
                rd.deleted_at, deleter.username AS deleted_by_username
         FROM raw_documents rd
         INNER JOIN departments d ON d.id=rd.department_id
         INNER JOIN users uploader ON uploader.id=rd.uploaded_by
         LEFT JOIN users deleter ON deleter.id=rd.deleted_by
         WHERE rd.stored_name=? LIMIT 1'
    );
    $rawStats = ['insert' => 0, 'update' => 0, 'unchanged' => 0, 'target_newer' => 0];
    foreach ($payload['raw_documents'] as $row) {
        [, $year, $originalName, $storedName, , , , $updatedAt] = validate_raw_document_row($row, false);
        $rawFindStmt->execute([$storedName]);
        $current = $rawFindStmt->fetch();
        if (!$current) {
            $rawStats['insert']++;
            if (count($details) < 30) $details[] = '[เพิ่มข้อมูลดิบ] ' . $year . ' · ' . $originalName;
        } elseif (raw_document_signature($current) === raw_document_signature($row)) {
            $rawStats['unchanged']++;
        } elseif ((string) $current['updated_at'] >= $updatedAt) {
            $rawStats['target_newer']++;
            if (count($details) < 30) $details[] = '[เก็บข้อมูลดิบ Local ที่ใหม่กว่า] ' . $year . ' · ' . $originalName;
        } else {
            $rawStats['update']++;
            if (count($details) < 30) $details[] = '[อัปเดตข้อมูลดิบจาก Server] ' . $year . ' · ' . $originalName;
        }
    }

    echo 'SYNC_COMPARE insert=' . $stats['insert']
        . ' update=' . $stats['update']
        . ' unchanged=' . $stats['unchanged']
        . ' target_newer=' . $stats['target_newer'] . PHP_EOL;
    echo 'RAW_COMPARE insert=' . $rawStats['insert']
        . ' update=' . $rawStats['update']
        . ' unchanged=' . $rawStats['unchanged']
        . ' target_newer=' . $rawStats['target_newer'] . PHP_EOL;
    foreach ($details as $detail) echo $detail . PHP_EOL;
    if (count($details) >= 30) echo '...แสดงรายละเอียดสูงสุด 30 รายการ' . PHP_EOL;
}

function import_local_records($path)
{
    $payload = read_sync_payload($path);
    $pdo = db();
    $topicStmt = $pdo->prepare(
        'SELECT t.id FROM topics t INNER JOIN departments d ON d.id=t.department_id
         WHERE d.code=? AND t.title=? ORDER BY t.id'
    );
    $topicIdStmt = $pdo->prepare(
        'SELECT t.id FROM topics t INNER JOIN departments d ON d.id=t.department_id
         WHERE t.id=? AND d.code=? LIMIT 1'
    );
    $userStmt = $pdo->prepare('SELECT id FROM users WHERE username=? LIMIT 1');
    $findStmt = $pdo->prepare(
        'SELECT id, data_json, updated_by, updated_at FROM records WHERE topic_id=? AND academic_year=? AND term=? LIMIT 1'
    );
    $insertStmt = $pdo->prepare(
        'INSERT INTO records(topic_id,academic_year,term,data_json,updated_by,updated_at) VALUES(?,?,?,?,?,?)'
    );
    $updateStmt = $pdo->prepare(
        'UPDATE records SET data_json=?,updated_by=?,updated_at=? WHERE id=?'
    );
    $termStmt = $pdo->prepare(
        'INSERT INTO terms(academic_year,term,is_current,is_published,published_at)
         VALUES(?,0,0,0,NULL) ON DUPLICATE KEY UPDATE academic_year=VALUES(academic_year)'
    );
    $departmentStmt = $pdo->prepare('SELECT id FROM departments WHERE code=? LIMIT 1');
    $rawFindStmt = $pdo->prepare(
        'SELECT rd.id, d.code AS department_code, rd.academic_year, rd.original_name, rd.stored_name,
                rd.mime_type, rd.file_size, rd.description, rd.sender_name,
                uploader.username AS uploaded_by_username, rd.uploaded_at, rd.updated_at,
                rd.deleted_at, deleter.username AS deleted_by_username
         FROM raw_documents rd
         INNER JOIN departments d ON d.id=rd.department_id
         INNER JOIN users uploader ON uploader.id=rd.uploaded_by
         LEFT JOIN users deleter ON deleter.id=rd.deleted_by
         WHERE rd.stored_name=? LIMIT 1'
    );
    $rawInsertStmt = $pdo->prepare(
        'INSERT INTO raw_documents(department_id,academic_year,original_name,stored_name,mime_type,file_size,
         description,sender_name,uploaded_by,uploaded_at,updated_at,deleted_at,deleted_by)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    $rawUpdateStmt = $pdo->prepare(
        'UPDATE raw_documents SET department_id=?,academic_year=?,original_name=?,mime_type=?,file_size=?,
         description=?,sender_name=?,uploaded_by=?,uploaded_at=?,updated_at=?,deleted_at=?,deleted_by=? WHERE id=?'
    );

    $stats = ['inserted' => 0, 'updated' => 0, 'unchanged' => 0, 'server_newer' => 0];
    $rawStats = ['inserted' => 0, 'updated' => 0, 'unchanged' => 0, 'target_newer' => 0];
    $pdo->beginTransaction();
    try {
        foreach ($payload['records'] as $row) {
            [$localTopicId, $departmentCode, $topicTitle, $year, $term, $dataJson, $updatedAt] = validate_record_row($row);
            // ID ของหัวข้อคงเดิมระหว่าง Local/Server เป็นตัวเลือกแรก เพื่อผ่านกรณีชื่อซ้ำจาก migration เก่า
            $topicIdStmt->execute([$localTopicId, $departmentCode]);
            $topicId = $topicIdStmt->fetchColumn();
            if ($topicId === false) {
                $topicStmt->execute([$departmentCode, $topicTitle]);
                $topicIds = $topicStmt->fetchAll(PDO::FETCH_COLUMN);
                if (count($topicIds) !== 1) {
                    throw new RuntimeException('จับคู่หัวข้อบนเซิร์ฟเวอร์ไม่ได้หรือหัวข้อซ้ำ: ' . $topicTitle);
                }
                $topicId = $topicIds[0];
            }
            verify_record_images($dataJson);

            $updatedBy = null;
            $username = trim((string) ($row['updated_by_username'] ?? ''));
            if ($username !== '') {
                $userStmt->execute([$username]);
                $userId = $userStmt->fetchColumn();
                $updatedBy = $userId === false ? null : (int) $userId;
            }

            $topicId = (int) $topicId;
            $termStmt->execute([$year]);
            $findStmt->execute([$topicId, $year, $term]);
            $current = $findStmt->fetch();
            if (!$current) {
                $insertStmt->execute([$topicId, $year, $term, $dataJson, $updatedBy, $updatedAt]);
                $stats['inserted']++;
                continue;
            }
            if ((string) $current['data_json'] === $dataJson) {
                $stats['unchanged']++;
                continue;
            }
            // ข้อมูลจาก migration เดิมมี updated_by=NULL และอาจถูก NOW() ทุกครั้งที่ Deploy
            // จึงยอมให้ Local แทนที่ได้ แต่ข้อมูลที่ผู้ใช้แก้บนเซิร์ฟเวอร์จริงจะไม่ถูกทับถ้าใหม่กว่า
            if ($current['updated_by'] !== null && (string) $current['updated_at'] >= $updatedAt) {
                $stats['server_newer']++;
                continue;
            }
            $updateStmt->execute([$dataJson, $updatedBy, $updatedAt, (int) $current['id']]);
            $stats['updated']++;
        }

        foreach ($payload['raw_documents'] as $row) {
            [$departmentCode, $year, $originalName, $storedName, $mimeType, $fileSize, $uploadedByName, $updatedAt]
                = validate_raw_document_row($row, true);
            $departmentStmt->execute([$departmentCode]);
            $departmentId = $departmentStmt->fetchColumn();
            $userStmt->execute([$uploadedByName]);
            $uploadedBy = $userStmt->fetchColumn();
            if ($departmentId === false || $uploadedBy === false) {
                throw new RuntimeException('จับคู่ฝ่ายหรือผู้อัปโหลดข้อมูลดิบไม่ได้: ' . $originalName);
            }
            $deletedBy = null;
            $deletedByName = trim((string) ($row['deleted_by_username'] ?? ''));
            if ($deletedByName !== '') {
                $userStmt->execute([$deletedByName]);
                $deletedUserId = $userStmt->fetchColumn();
                $deletedBy = $deletedUserId === false ? null : (int) $deletedUserId;
            }
            $values = [(int) $departmentId, $year, $originalName, $mimeType, $fileSize,
                (string) ($row['description'] ?? ''), $row['sender_name'] ?? null, (int) $uploadedBy,
                (string) $row['uploaded_at'], $updatedAt, $row['deleted_at'] ?? null, $deletedBy];
            $termStmt->execute([$year]);
            $rawFindStmt->execute([$storedName]);
            $current = $rawFindStmt->fetch();
            if (!$current) {
                $rawInsertStmt->execute(array_merge(array_slice($values, 0, 3), [$storedName], array_slice($values, 3)));
                $rawStats['inserted']++;
            } elseif (raw_document_signature($current) === raw_document_signature($row)) {
                $rawStats['unchanged']++;
            } elseif ((string) $current['updated_at'] >= $updatedAt) {
                $rawStats['target_newer']++;
            } else {
                $rawUpdateStmt->execute(array_merge($values, [(int) $current['id']]));
                $rawStats['updated']++;
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    echo 'LOCAL_SYNC_IMPORT inserted=' . $stats['inserted']
        . ' updated=' . $stats['updated']
        . ' unchanged=' . $stats['unchanged']
        . ' server_newer=' . $stats['server_newer'] . PHP_EOL;
    echo 'RAW_SYNC_IMPORT inserted=' . $rawStats['inserted']
        . ' updated=' . $rawStats['updated']
        . ' unchanged=' . $rawStats['unchanged']
        . ' target_newer=' . $rawStats['target_newer'] . PHP_EOL;
}

try {
    $action = $argv[1] ?? '';
    $path = $argv[2] ?? '';
    if (!in_array($action, ['export', 'compare', 'import'], true) || $path === '') {
        sync_fail('Usage: php deploy-data-sync.php export|compare|import <json-file>');
    }
    if ($action === 'export') {
        export_local_records($path);
    } elseif ($action === 'compare') {
        compare_incoming_records($path);
    } else {
        import_local_records($path);
    }
} catch (Throwable $e) {
    sync_fail('LOCAL_SYNC_ERROR: ' . $e->getMessage());
}

