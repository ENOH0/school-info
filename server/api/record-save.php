<?php
// บันทึกข้อมูลของหัวข้อ ในภาคเรียนที่เลือก
// ตาราง:     {"topicId": 3, "academicYear": 2569, "term": 1, "rows": [{"c1": "ม.1", "c2": 150}]}
// ความเรียง: {"topicId": 4, "academicYear": 2569, "term": 1, "text": "..."}
// ทั้งสองแบบแนบรูปได้: "images": [{"file": "abc.jpg", "caption": "คำบรรยาย"}]
// ส่งตารางว่างหรือข้อความว่าง และไม่มีรูป = ลบข้อมูลของภาคเรียนนั้น
require __DIR__ . '/lib.php';
require_method('POST');
$me = require_login();

$in = read_json();
$topic = find_topic(isset($in['topicId']) ? (int) $in['topicId'] : 0);
if (!can_edit_department($me, $topic['department_id'])) {
    fail('กรอกข้อมูลได้เฉพาะหัวข้อของฝ่ายตัวเอง', 403);
}

$year = isset($in['academicYear']) ? (int) $in['academicYear'] : 0;
$term = record_term($topic, isset($in['term']) ? (int) $in['term'] : 0);

if ($topic['frequency'] === 'term' && $term === 0) {
    fail('หัวข้อรายภาคเรียนต้องเลือกภาคเรียนที่ 1 หรือ 2');
}

require_period_unlocked($year, $term);

$chk = db()->prepare('SELECT COUNT(*) FROM terms WHERE academic_year = ? AND term = ?');
$chk->execute([$year, $term]);
if (!(int) $chk->fetchColumn()) {
    fail('ไม่พบปีการศึกษา/ภาคเรียนนี้ในระบบ');
}

// ===== ตรวจและจัดรูปข้อมูล =====
$empty = false;
if ($topic['kind'] === 'text') {
    $text = isset($in['text']) ? trim(str_replace("\r\n", "\n", (string) $in['text'])) : '';
    if (text_len($text) > 50000) {
        fail('ข้อความยาวเกิน 50,000 ตัวอักษร');
    }
    $data = ['text' => $text];
    $empty = $text === '';
} else {
    $columns = topic_columns($topic);
    $rawRows = isset($in['rows']) && is_array($in['rows']) ? $in['rows'] : [];
    if (count($rawRows) > 500) {
        fail('ตารางมีได้ไม่เกิน 500 แถว');
    }
    $rows = [];
    foreach ($rawRows as $n => $raw) {
        if (!is_array($raw)) {
            continue;
        }
        $row = [];
        $hasValue = false;
        foreach ($columns as $c) {
            if ($c['type'] === 'sum') {
                continue; // คอลัมน์ผลรวม คำนวณเองตอนแสดงผล ไม่ต้องเก็บ
            }
            $v = isset($raw[$c['key']]) ? $raw[$c['key']] : null;
            if ($v === '' || $v === null) {
                $row[$c['key']] = null;
                continue;
            }
            if ($c['type'] === 'number') {
                $s = str_replace([',', ' '], '', (string) $v);
                if (!is_numeric($s)) {
                    fail('แถวที่ ' . ($n + 1) . ' คอลัมน์ "' . $c['label'] . '" ต้องเป็นตัวเลข');
                }
                $row[$c['key']] = $s + 0; // แปลงเป็นตัวเลข (จำนวนเต็มหรือทศนิยม)
            } else {
                $s = trim((string) $v);
                if (text_len($s) > 1000) {
                    fail('แถวที่ ' . ($n + 1) . ' คอลัมน์ "' . $c['label'] . '" ยาวเกิน 1,000 ตัวอักษร');
                }
                $row[$c['key']] = $s;
            }
            $hasValue = true;
        }
        if ($hasValue) {
            $rows[] = $row; // ข้ามแถวที่ว่างทั้งแถว
        }
    }
    $data = ['rows' => $rows];
    $empty = count($rows) === 0;
}

// ===== รูปแนบ =====
$images = clean_images(isset($in['images']) ? $in['images'] : []);
if (count($images) > 0) {
    $data['images'] = $images;
    $empty = false;
}

// ===== บันทึก: มีแล้วแก้ ไม่มีเพิ่ม ว่างลบ =====
$find = db()->prepare('SELECT id FROM records WHERE topic_id = ? AND academic_year = ? AND term = ?');
$find->execute([(int) $topic['id'], $year, $term]);
$recordId = $find->fetchColumn();

if ($empty) {
    if ($recordId) {
        db()->prepare('DELETE FROM records WHERE id = ?')->execute([(int) $recordId]);
    }
    json_out(['ok' => true, 'deleted' => true]);
}

$json = json_encode($data, JSON_UNESCAPED_UNICODE);
if ($recordId) {
    db()->prepare('UPDATE records SET data_json = ?, updated_by = ?, updated_at = ? WHERE id = ?')
        ->execute([$json, (int) $me['id'], now_str(), (int) $recordId]);
} else {
    db()->prepare(
        'INSERT INTO records (topic_id, academic_year, term, data_json, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    )->execute([(int) $topic['id'], $year, $term, $json, (int) $me['id'], now_str()]);
}

json_out(['ok' => true, 'deleted' => false, 'updatedAt' => now_str()]);
