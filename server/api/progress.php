<?php
// ภาพรวมความคืบหน้าการกรอกข้อมูลของทุกฝ่าย ในปีการศึกษาที่เลือก
require __DIR__ . '/lib.php';
require_admin();

$year = isset($_GET['year']) ? (int) $_GET['year'] : 0;

$stmt = db()->prepare(
    'SELECT d.id AS dept_id, d.name AS dept_name,
            t.id AS topic_id, t.title, t.chapter, t.kind, t.columns_json,
            r.updated_at, r.data_json, u.display_name AS updated_by_name
       FROM departments d
       LEFT JOIN topics t ON t.department_id = d.id
       LEFT JOIN records r
              ON r.topic_id = t.id
             AND r.academic_year = ?
             AND r.term = 0
       LEFT JOIN users u ON u.id = r.updated_by
      ORDER BY d.sort_order, d.id, t.chapter = 0, t.chapter, t.sort_order, t.id'
);
$stmt->execute([$year]);

$depts = [];
foreach ($stmt->fetchAll() as $row) {
    $id = (int) $row['dept_id'];
    if (!isset($depts[$id])) {
        $depts[$id] = [
            'id' => $id, 'name' => $row['dept_name'],
            'total' => 0, 'filled' => 0, 'lastUpdatedAt' => null, 'lastUpdatedBy' => null,
            'missing' => [], 'unchecked' => [], 'incomplete' => [], 'stale' => [],
        ];
    }
    if ($row['topic_id'] === null) {
        continue; // ฝ่ายนี้ยังไม่มีหัวข้อ
    }
    $depts[$id]['total']++;
    if ($row['updated_at'] !== null) {
        $depts[$id]['filled']++;
        if ($depts[$id]['lastUpdatedAt'] === null || $row['updated_at'] > $depts[$id]['lastUpdatedAt']) {
            $depts[$id]['lastUpdatedAt'] = $row['updated_at'];
            $depts[$id]['lastUpdatedBy'] = $row['updated_by_name'];
        }
        $data = json_decode((string)$row['data_json'], true);
        if ($row['kind'] === 'table' && is_array($data)) {
            $columns = json_decode((string)$row['columns_json'], true);
            $rows = isset($data['rows']) && is_array($data['rows']) ? $data['rows'] : [];
            $required = [];
            foreach (is_array($columns) ? $columns : [] as $column) {
                if (($column['type'] ?? '') !== 'sum') $required[] = (string)$column['key'];
            }
            $blankCells = 0;
            foreach ($rows as $item) {
                foreach ($required as $key) {
                    if (!is_array($item) || !array_key_exists($key, $item) || $item[$key] === null || $item[$key] === '') $blankCells++;
                }
            }
            if (count($rows) === 0 || $blankCells > 0) {
                $depts[$id]['incomplete'][] = [
                    'id'=>(int)$row['topic_id'],'title'=>$row['title'],'chapter'=>chapter_label($row['chapter']),
                    'reason'=>count($rows)===0?'ยังไม่มีแถวข้อมูล':'มีช่องว่าง '.$blankCells.' ช่อง',
                ];
            }
        }
        if (strtotime($row['updated_at']) < strtotime('-180 days')) {
            $depts[$id]['stale'][] = [
                'id'=>(int)$row['topic_id'],'title'=>$row['title'],'chapter'=>chapter_label($row['chapter']),
                'updatedAt'=>$row['updated_at'],'updatedBy'=>$row['updated_by_name'],
            ];
        }
        // คัดลอกจากครั้งก่อนแล้วยังไม่มีใครเปิดตรวจและกดบันทึก
        $from = copied_from($row['data_json']);
        if ($from !== null) {
            $depts[$id]['unchecked'][] = [
                'id' => (int) $row['topic_id'],
                'title' => $row['title'],
                'chapter' => chapter_label($row['chapter']),
                'copiedFrom' => $from,
            ];
        }
    } else {
        $depts[$id]['missing'][] = [
            'id' => (int) $row['topic_id'],
            'title' => $row['title'],
            'chapter' => chapter_label($row['chapter']),
            'frequency' => 'year',
        ];
    }
}

json_out([
    'academicYear' => $year,
    'term'         => 0,
    'published'    => period_locked($year, 0),
    'departments'  => array_values($depts),
]);
