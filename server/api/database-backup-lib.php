<?php

/** ตารางและคอลัมน์ข้อมูลแอปที่อนุญาตให้สำรองและกู้คืน */
function backup_tables()
{
    return [
        'departments' => ['id', 'code', 'name', 'sort_order'],
        'terms' => ['id', 'academic_year', 'term', 'is_current', 'is_published', 'published_at'],
        'users' => ['id', 'username', 'password_hash', 'display_name', 'role', 'department_id', 'is_active', 'created_at', 'last_login_at'],
        'topics' => ['id', 'department_id', 'chapter', 'title', 'kind', 'frequency', 'columns_json', 'chart_json', 'sort_order', 'created_at'],
        'records' => ['id', 'topic_id', 'academic_year', 'term', 'data_json', 'updated_by', 'updated_at'],
    ];
}

function backup_uploads_dir()
{
    return function_exists('uploads_dir') ? uploads_dir() : dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads';
}

function referenced_upload_files($records)
{
    $files = [];
    foreach ($records as $record) {
        $data = json_decode((string) $record['data_json'], true);
        foreach (isset($data['images']) && is_array($data['images']) ? $data['images'] : [] as $image) {
            $file = isset($image['file']) ? basename((string) $image['file']) : '';
            if ($file !== '') {
                $files[$file] = true;
            }
        }
    }
    return array_keys($files);
}

function make_uploads_payload($records)
{
    $dir = backup_uploads_dir();
    $uploads = [];
    foreach (referenced_upload_files($records) as $file) {
        $path = $dir . DIRECTORY_SEPARATOR . $file;
        if (!is_file($path)) {
            continue;
        }
        $raw = file_get_contents($path);
        if ($raw === false) {
            throw new RuntimeException('อ่านรูปประกอบ ' . $file . ' ไม่สำเร็จ');
        }
        $uploads[] = ['file' => $file, 'data' => base64_encode($raw)];
    }
    return $uploads;
}

function make_backup_payload($academicYear = null)
{
    $academicYear = $academicYear === null ? null : (int) $academicYear;
    $payload = [
        'format' => 'school-info-backup',
        'version' => 2,
        'generatedAt' => date(DATE_ATOM),
        'database' => DB_NAME,
        'scope' => $academicYear === null
            ? ['type' => 'all']
            : ['type' => 'year', 'academicYear' => $academicYear],
        'tables' => [],
    ];
    foreach (backup_tables() as $table => $columns) {
        $sql = 'SELECT ' . implode(', ', $columns) . ' FROM ' . $table;
        $params = [];
        if ($academicYear !== null && ($table === 'terms' || $table === 'records')) {
            $sql .= ' WHERE academic_year = ?';
            $params[] = $academicYear;
        }
        $sql .= ' ORDER BY id';
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        $payload['tables'][$table] = $stmt->fetchAll();
    }
    $payload['uploads'] = make_uploads_payload($payload['tables']['records']);
    return $payload;
}

function encode_backup($payload)
{
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($json === false) {
        throw new RuntimeException('สร้างไฟล์สำรองไม่สำเร็จ');
    }
    return $json;
}

function validate_backup_payload($payload)
{
    $version = (int) ($payload['version'] ?? 0);
    if (!is_array($payload) || ($payload['format'] ?? '') !== 'school-info-backup' || !in_array($version, [1, 2], true)) {
        throw new RuntimeException('ไฟล์นี้ไม่ใช่ไฟล์สำรองของระบบสารสนเทศโรงเรียน');
    }
    if (!isset($payload['tables']) || !is_array($payload['tables'])) {
        throw new RuntimeException('ไฟล์สำรองไม่สมบูรณ์');
    }
    $scope = isset($payload['scope']) && is_array($payload['scope']) ? $payload['scope'] : ['type' => 'all'];
    if (!in_array($scope['type'] ?? '', ['all', 'year'], true)) {
        throw new RuntimeException('ขอบเขตของไฟล์สำรองไม่ถูกต้อง');
    }
    if ($scope['type'] === 'year' && ((int) ($scope['academicYear'] ?? 0) < 2400 || (int) $scope['academicYear'] > 3000)) {
        throw new RuntimeException('ปีการศึกษาในไฟล์สำรองไม่ถูกต้อง');
    }
    foreach (backup_tables() as $table => $columns) {
        if (!isset($payload['tables'][$table]) || !is_array($payload['tables'][$table])) {
            throw new RuntimeException('ไฟล์สำรองไม่มีตาราง ' . $table);
        }
        foreach ($payload['tables'][$table] as $row) {
            if (!is_array($row)) {
                throw new RuntimeException('ข้อมูลในตาราง ' . $table . ' ไม่ถูกต้อง');
            }
            foreach ($columns as $column) {
                if (!array_key_exists($column, $row)) {
                    throw new RuntimeException('ข้อมูลในตาราง ' . $table . ' ขาดคอลัมน์ ' . $column);
                }
            }
        }
    }
    // ตรวจความสัมพันธ์ก่อนแตะฐานข้อมูล เพื่อให้ไฟล์เสีย/ถูกแก้ไขไม่ลบข้อมูลเดิมแล้วค่อยล้มเหลว
    $ids = [];
    foreach (['departments', 'users', 'topics'] as $table) {
        $ids[$table] = [];
        foreach ($payload['tables'][$table] as $row) {
            $id = (int) $row['id'];
            if ($id <= 0 || isset($ids[$table][$id])) {
                throw new RuntimeException('รหัสข้อมูลในตาราง ' . $table . ' ไม่ถูกต้องหรือซ้ำกัน');
            }
            $ids[$table][$id] = true;
        }
    }
    foreach ($payload['tables']['users'] as $row) {
        if ($row['department_id'] !== null && !isset($ids['departments'][(int) $row['department_id']])) {
            throw new RuntimeException('ผู้ใช้ในไฟล์สำรองอ้างอิงฝ่ายที่ไม่มีอยู่');
        }
    }
    foreach ($payload['tables']['topics'] as $row) {
        if (!isset($ids['departments'][(int) $row['department_id']])) {
            throw new RuntimeException('หัวข้อในไฟล์สำรองอ้างอิงฝ่ายที่ไม่มีอยู่');
        }
    }
    foreach ($payload['tables']['records'] as $row) {
        if (!isset($ids['topics'][(int) $row['topic_id']])) {
            throw new RuntimeException('รายการข้อมูลในไฟล์สำรองอ้างอิงหัวข้อที่ไม่มีอยู่');
        }
        if ($row['updated_by'] !== null && !isset($ids['users'][(int) $row['updated_by']])) {
            throw new RuntimeException('รายการข้อมูลในไฟล์สำรองอ้างอิงผู้ใช้ที่ไม่มีอยู่');
        }
    }
    $hasAdmin = false;
    foreach ($payload['tables']['users'] as $user) {
        if ($user['role'] === 'admin' && (int) $user['is_active'] === 1) {
            $hasAdmin = true;
            break;
        }
    }
    if (!$hasAdmin) {
        throw new RuntimeException('ไฟล์สำรองต้องมีผู้ดูแลระบบที่เปิดใช้งานอย่างน้อย 1 คน');
    }
    if ($scope['type'] === 'year') {
        $year = (int) $scope['academicYear'];
        foreach ($payload['tables']['terms'] as $row) {
            if ((int) $row['academic_year'] !== $year) {
                throw new RuntimeException('ไฟล์สำรองมีภาคเรียนของปีอื่นปะปนอยู่');
            }
        }
        foreach ($payload['tables']['records'] as $row) {
            if ((int) $row['academic_year'] !== $year) {
                throw new RuntimeException('ไฟล์สำรองมีข้อมูลของปีอื่นปะปนอยู่');
            }
        }
    }
    if ($version >= 2) {
        if (!isset($payload['uploads']) || !is_array($payload['uploads'])) {
            throw new RuntimeException('ไฟล์สำรองไม่มีข้อมูลรูปประกอบ');
        }
        if (count($payload['uploads']) > 5000) {
            throw new RuntimeException('ไฟล์สำรองมีรูปประกอบมากเกินกำหนด');
        }
        $totalBytes = 0;
        foreach ($payload['uploads'] as $upload) {
            $file = isset($upload['file']) ? (string) $upload['file'] : '';
            if ($file === '' || basename($file) !== $file || !preg_match('/^[A-Za-z0-9._-]+$/', $file)) {
                throw new RuntimeException('ชื่อไฟล์รูปประกอบไม่ถูกต้อง');
            }
            $raw = isset($upload['data']) ? base64_decode((string) $upload['data'], true) : false;
            if ($raw === false) {
                throw new RuntimeException('ข้อมูลรูปประกอบ ' . $file . ' ไม่ถูกต้อง');
            }
            $totalBytes += strlen($raw);
            if ($totalBytes > 200 * 1024 * 1024) {
                throw new RuntimeException('รูปประกอบในไฟล์สำรองมีขนาดรวมเกิน 200 MB');
            }
        }
    }
}

function insert_backup_rows(PDO $pdo, $table, $columns, $rows)
{
    if (count($rows) === 0) {
        return;
    }
    $marks = implode(', ', array_fill(0, count($columns), '?'));
    $stmt = $pdo->prepare('INSERT INTO ' . $table . ' (' . implode(', ', $columns) . ') VALUES (' . $marks . ')');
    foreach ($rows as $row) {
        $values = [];
        foreach ($columns as $column) {
            $values[] = $row[$column];
        }
        $stmt->execute($values);
    }
}

function restore_backup_uploads($payload)
{
    if ((int) ($payload['version'] ?? 1) < 2) {
        return; // รองรับไฟล์รุ่นเก่าที่สำรองเฉพาะฐานข้อมูล
    }
    $dir = backup_uploads_dir();
    if (!is_dir($dir) && !mkdir($dir, 0750, true)) {
        throw new RuntimeException('สร้างโฟลเดอร์รูปประกอบไม่สำเร็จ');
    }
    foreach ($payload['uploads'] as $upload) {
        $file = (string) $upload['file'];
        $raw = base64_decode((string) $upload['data'], true);
        if ($raw === false || file_put_contents($dir . DIRECTORY_SEPARATOR . $file, $raw, LOCK_EX) === false) {
            throw new RuntimeException('กู้คืนรูปประกอบ ' . $file . ' ไม่สำเร็จ');
        }
    }
}

function restore_backup_payload($payload)
{
    validate_backup_payload($payload);
    $pdo = db();
    $tables = backup_tables();
    $scope = isset($payload['scope']) ? $payload['scope'] : ['type' => 'all'];
    $pdo->beginTransaction();
    try {
        if ($scope['type'] === 'year') {
            $year = (int) $scope['academicYear'];
            // ไฟล์รายปีอ้างอิงหัวข้อและผู้ใช้เดิม จึงตรวจให้ครบก่อนลบข้อมูลปัจจุบัน
            $topicIds = array_values(array_unique(array_map(function ($row) { return (int) $row['topic_id']; }, $payload['tables']['records'])));
            if (count($topicIds) > 0) {
                $marks = implode(',', array_fill(0, count($topicIds), '?'));
                $stmt = $pdo->prepare('SELECT COUNT(*) FROM topics WHERE id IN (' . $marks . ')');
                $stmt->execute($topicIds);
                if ((int) $stmt->fetchColumn() !== count($topicIds)) {
                    throw new RuntimeException('หัวข้อในระบบปัจจุบันไม่ตรงกับไฟล์สำรองรายปี กรุณาใช้ไฟล์สำรองทั้งระบบ');
                }
            }
            $pdo->prepare('DELETE FROM records WHERE academic_year = ?')->execute([$year]);
            $pdo->prepare('DELETE FROM terms WHERE academic_year = ?')->execute([$year]);
            $hasCurrent = false;
            foreach ($payload['tables']['terms'] as $term) {
                $hasCurrent = $hasCurrent || (int) $term['is_current'] === 1;
            }
            if ($hasCurrent) {
                $pdo->exec('UPDATE terms SET is_current = 0');
            }
            $termColumns = array_values(array_filter($tables['terms'], function ($column) { return $column !== 'id'; }));
            $recordColumns = array_values(array_filter($tables['records'], function ($column) { return $column !== 'id'; }));
            insert_backup_rows($pdo, 'terms', $termColumns, $payload['tables']['terms']);
            insert_backup_rows($pdo, 'records', $recordColumns, $payload['tables']['records']);
        } else {
            foreach (['records', 'topics', 'users', 'terms', 'departments'] as $table) {
                $pdo->exec('DELETE FROM ' . $table);
            }
            foreach (['departments', 'terms', 'users', 'topics', 'records'] as $table) {
                insert_backup_rows($pdo, $table, $tables[$table], $payload['tables'][$table]);
            }
        }
        restore_backup_uploads($payload);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function save_automatic_backup()
{
    if (defined('BACKUP_DIR') && BACKUP_DIR !== '') {
        $dir = BACKUP_DIR;
    } else {
        $appRoot = dirname(__DIR__);
        $documentRoot = !empty($_SERVER['DOCUMENT_ROOT']) ? rtrim((string) $_SERVER['DOCUMENT_ROOT'], '/\\') : dirname($appRoot);
        $dir = dirname($documentRoot) . DIRECTORY_SEPARATOR . 'school-info-backups';
    }
    if (!is_dir($dir) && !mkdir($dir, 0700, true)) {
        throw new RuntimeException('สร้างโฟลเดอร์สำรองอัตโนมัตินอกพื้นที่เว็บไซต์ไม่สำเร็จ กรุณาตั้งค่า BACKUP_DIR');
    }
    $file = $dir . DIRECTORY_SEPARATOR . 'before-restore-' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.json';
    if (file_put_contents($file, encode_backup(make_backup_payload()), LOCK_EX) === false) {
        throw new RuntimeException('บันทึกไฟล์สำรองอัตโนมัติก่อนกู้คืนไม่สำเร็จ');
    }
    return basename($file);
}
