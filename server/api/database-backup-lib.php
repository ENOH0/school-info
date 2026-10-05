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

function make_backup_payload($academicYear = null)
{
    $academicYear = $academicYear === null ? null : (int) $academicYear;
    $payload = [
        'format' => 'school-info-backup',
        'version' => 1,
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
    if (!is_array($payload) || ($payload['format'] ?? '') !== 'school-info-backup' || (int) ($payload['version'] ?? 0) !== 1) {
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
            insert_backup_rows($pdo, 'terms', $tables['terms'], $payload['tables']['terms']);
            insert_backup_rows($pdo, 'records', $tables['records'], $payload['tables']['records']);
        } else {
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
            foreach (['records', 'topics', 'users', 'terms', 'departments'] as $table) {
                $pdo->exec('DELETE FROM ' . $table);
            }
            foreach (['departments', 'terms', 'users', 'topics', 'records'] as $table) {
                insert_backup_rows($pdo, $table, $tables[$table], $payload['tables'][$table]);
            }
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        try { $pdo->exec('SET FOREIGN_KEY_CHECKS = 1'); } catch (Throwable $ignored) {}
        throw $e;
    }
}

function save_automatic_backup()
{
    $dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'backups';
    if (!is_dir($dir) && !mkdir($dir, 0700, true)) {
        throw new RuntimeException('สร้างโฟลเดอร์สำรองอัตโนมัติไม่สำเร็จ');
    }
    $file = $dir . DIRECTORY_SEPARATOR . 'before-restore-' . date('Ymd-His') . '.json';
    if (file_put_contents($file, encode_backup(make_backup_payload()), LOCK_EX) === false) {
        throw new RuntimeException('บันทึกไฟล์สำรองอัตโนมัติก่อนกู้คืนไม่สำเร็จ');
    }
    return basename($file);
}
