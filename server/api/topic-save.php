<?php
// สร้าง/แก้ไขหัวข้อ
// {"id"?, "departmentId", "chapter": 0-10, "title", "kind": "table"|"text", "frequency": "term"|"year",
//  "columns": [{"key": "c1", "label": "ระดับชั้น", "type": "text"|"number"|"sum", "of"?: ["c2","c3"], "total"?: true}]}
//  sum   = คอลัมน์ผลรวมอัตโนมัติ (บวกคอลัมน์ใน of ของแถวเดียวกัน) ไม่ต้องกรอก
//  total = รวมคอลัมน์นี้ไว้ในแถว "รวม" ท้ายตาราง
require __DIR__ . '/lib.php';
require_method('POST');
$me = require_login();

$in = read_json();
$id     = isset($in['id']) ? (int) $in['id'] : 0;
$deptId = isset($in['departmentId']) ? (int) $in['departmentId'] : 0;
$title  = trim(isset($in['title']) ? (string) $in['title'] : '');
$kind   = (isset($in['kind']) && $in['kind'] === 'text') ? 'text' : 'table';
$freq   = (isset($in['frequency']) && $in['frequency'] === 'year') ? 'year' : 'term';
$chapter = isset($in['chapter']) ? (int) $in['chapter'] : 0;
if (!array_key_exists($chapter, chapters())) {
    $chapter = 0;
}

if ($title === '' || text_len($title) > 200) {
    fail('กรุณากรอกชื่อหัวข้อ (ไม่เกิน 200 ตัวอักษร)');
}

$chk = db()->prepare('SELECT COUNT(*) FROM departments WHERE id = ?');
$chk->execute([$deptId]);
if (!(int) $chk->fetchColumn()) {
    fail('ไม่พบฝ่ายนี้');
}
if (!can_edit_department($me, $deptId)) {
    fail('แก้ไขได้เฉพาะหัวข้อของฝ่ายตัวเอง', 403);
}

// ตรวจคอลัมน์ (เฉพาะแบบตาราง)
$columns = [];
if ($kind === 'table') {
    $raw = isset($in['columns']) && is_array($in['columns']) ? $in['columns'] : [];
    $keys = [];
    foreach ($raw as $c) {
        $key   = isset($c['key']) ? (string) $c['key'] : '';
        $label = trim(isset($c['label']) ? (string) $c['label'] : '');
        $type  = isset($c['type']) && in_array($c['type'], ['text', 'number', 'sum'], true) ? $c['type'] : 'text';
        if (!preg_match('/^c[0-9]{1,4}$/', $key) || isset($keys[$key])) {
            fail('รหัสคอลัมน์ไม่ถูกต้อง');
        }
        if ($label === '' || text_len($label) > 100) {
            fail('กรุณาตั้งชื่อทุกคอลัมน์ (ไม่เกิน 100 ตัวอักษร)');
        }
        $keys[$key] = $type;
        $col = ['key' => $key, 'label' => $label, 'type' => $type];
        if ($type === 'sum') {
            $col['of'] = isset($c['of']) && is_array($c['of']) ? array_values(array_unique(array_map('strval', $c['of']))) : [];
        }
        if ($type !== 'text' && !empty($c['total'])) {
            $col['total'] = true;
        }
        $columns[] = $col;
    }
    // คอลัมน์ผลรวม ต้องบวกจากคอลัมน์ตัวเลขในตารางเดียวกัน
    foreach ($columns as $col) {
        if ($col['type'] !== 'sum') {
            continue;
        }
        if (count($col['of']) < 2) {
            fail('คอลัมน์ "' . $col['label'] . '" (ผลรวม) ต้องเลือกคอลัมน์ตัวเลขที่จะบวกอย่างน้อย 2 คอลัมน์');
        }
        foreach ($col['of'] as $k) {
            if (!isset($keys[$k]) || $keys[$k] !== 'number') {
                fail('คอลัมน์ "' . $col['label'] . '" (ผลรวม) บวกได้เฉพาะคอลัมน์ชนิดตัวเลข');
            }
        }
    }
    if (count($columns) === 0 || count($columns) > 20) {
        fail('ตารางต้องมี 1–20 คอลัมน์');
    }
}
$columnsJson = $kind === 'table' ? json_encode($columns, JSON_UNESCAPED_UNICODE) : null;
// กราฟ (เฉพาะแบบตาราง): {"type": "bar"|"line"|"pie"|"none", "series": ["c2"], "trend": true}
$chartJson = $kind === 'table' ? clean_chart(isset($in['chart']) ? $in['chart'] : null, $columns) : null;

if ($id === 0) {
    $max = db()->prepare('SELECT COALESCE(MAX(sort_order), 0) FROM topics WHERE department_id = ?');
    $max->execute([$deptId]);
    $sort = (int) $max->fetchColumn() + 1;

    db()->prepare(
        'INSERT INTO topics (department_id, chapter, title, kind, frequency, columns_json, chart_json, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([$deptId, $chapter, $title, $kind, $freq, $columnsJson, $chartJson, $sort]);

    json_out(['ok' => true, 'id' => (int) db()->lastInsertId()], 201);
}

// แก้ไข: ต้องมีสิทธิ์ทั้งฝ่ายเดิมของหัวข้อ
$old = find_topic($id);
require_topic_unlocked($id);
if (!can_edit_department($me, $old['department_id'])) {
    fail('แก้ไขได้เฉพาะหัวข้อของฝ่ายตัวเอง', 403);
}

// ถ้ามีข้อมูลแล้ว ห้ามเปลี่ยนชนิดและความถี่ เพราะข้อมูลเดิมจะใช้ไม่ได้
$cnt = db()->prepare('SELECT COUNT(*) FROM records WHERE topic_id = ?');
$cnt->execute([$id]);
$hasRecords = (int) $cnt->fetchColumn() > 0;
if ($hasRecords && ($kind !== $old['kind'] || $freq !== $old['frequency'] || (int) $old['department_id'] !== $deptId)) {
    fail('หัวข้อนี้มีข้อมูลแล้ว เปลี่ยนชนิด ความถี่ หรือฝ่ายไม่ได้ (แก้ชื่อและคอลัมน์ได้)');
}

db()->prepare(
    'UPDATE topics SET department_id = ?, chapter = ?, title = ?, kind = ?, frequency = ?, columns_json = ?, chart_json = ? WHERE id = ?'
)->execute([$deptId, $chapter, $title, $kind, $freq, $columnsJson, $chartJson, $id]);

json_out(['ok' => true, 'id' => $id]);
