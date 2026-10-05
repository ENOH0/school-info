<?php
// ภาพรวมความคืบหน้าการกรอกข้อมูลของทุกฝ่าย ในภาคเรียนที่เลือก (เฉพาะผู้ดูแลระบบ)
// GET progress.php?year=2569&term=1
require __DIR__ . '/lib.php';
require_admin();

$year = isset($_GET['year']) ? (int) $_GET['year'] : 0;
$term = isset($_GET['term']) ? (int) $_GET['term'] : 0;

$stmt = db()->prepare(
    'SELECT d.id AS dept_id, d.name AS dept_name,
            t.id AS topic_id, t.title, t.frequency, t.chapter,
            r.updated_at, r.data_json, u.display_name AS updated_by_name
       FROM departments d
       LEFT JOIN topics t ON t.department_id = d.id
                         AND (? > 0 OR t.frequency = \'year\')
       LEFT JOIN records r
              ON r.topic_id = t.id
             AND r.academic_year = ?
             AND r.term = (CASE WHEN t.frequency = \'year\' THEN 0 ELSE ? END)
       LEFT JOIN users u ON u.id = r.updated_by
      ORDER BY d.sort_order, d.id, t.chapter = 0, t.chapter, t.sort_order, t.id'
);
$stmt->execute([$term, $year, $term]);

$depts = [];
foreach ($stmt->fetchAll() as $row) {
    $id = (int) $row['dept_id'];
    if (!isset($depts[$id])) {
        $depts[$id] = [
            'id' => $id, 'name' => $row['dept_name'],
            'total' => 0, 'filled' => 0, 'lastUpdatedAt' => null, 'lastUpdatedBy' => null,
            'missing' => [], 'unchecked' => [],
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
            'frequency' => $row['frequency'],
        ];
    }
}

json_out([
    'academicYear' => $year,
    'term'         => $term,
    'published'    => period_locked($year, $term) && $term > 0,
    'departments'  => array_values($depts),
]);
