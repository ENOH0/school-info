<?php
// เล่มสารสนเทศ 1 เล่ม พร้อมเนื้อหาทุกหัวข้อ (สาธารณะ ไม่ต้องล็อกอิน)
// GET book.php?id=2   (id = รหัสภาคเรียนในตาราง terms)
// เล่มรายภาคเรียนรวมหัวข้อรายปีของปีนั้นด้วย
// เรียงตามหมวด 1–10 (หมวด 0 "อื่น ๆ" อยู่ท้าย) แล้วตามฝ่ายและลำดับหัวข้อ
require __DIR__ . '/lib.php';

$stmt = db()->prepare('SELECT id, academic_year, term FROM terms WHERE id = ?');
$stmt->execute([isset($_GET['id']) ? (int) $_GET['id'] : 0]);
$t = $stmt->fetch();
if (!$t) {
    fail('ไม่พบเล่มนี้', 404);
}
$year = (int) $t['academic_year'];
$term = (int) $t['term'];

$stmt = db()->prepare(
    'SELECT tp.id, tp.chapter, tp.title, tp.kind, tp.columns_json, d.name AS department, r.data_json
       FROM records r
       JOIN topics tp ON tp.id = r.topic_id
       JOIN departments d ON d.id = tp.department_id
      WHERE r.academic_year = ? AND (r.term = ? OR r.term = 0)
      ORDER BY (tp.chapter = 0), tp.chapter, d.sort_order, d.id, tp.sort_order, tp.id'
);
$stmt->execute([$year, $term]);

$sections = [];
foreach ($stmt->fetchAll() as $row) {
    $data = json_decode($row['data_json'], true);
    $blocks = [];

    if ($row['kind'] === 'text') {
        // ขึ้นบรรทัดใหม่ = ย่อหน้าใหม่
        foreach (preg_split('/\n+/', isset($data['text']) ? $data['text'] : '') as $p) {
            if (trim($p) !== '') {
                $blocks[] = ['type' => 'p', 'text' => trim($p)];
            }
        }
    } else {
        $cols = topic_columns($row);
        $rows = [];
        foreach (isset($data['rows']) ? $data['rows'] : [] as $r) {
            $rows[] = array_map(function ($c) use ($r) {
                $v = isset($r[$c['key']]) ? $r[$c['key']] : null;
                return $v === null ? '' : $v;
            }, $cols);
        }
        $blocks[] = [
            'type'    => 'table',
            'columns' => array_map(function ($c) { return $c['label']; }, $cols),
            'rows'    => $rows,
        ];
    }

    // รูปแนบ ต่อท้ายเนื้อหาของหัวข้อ
    foreach (isset($data['images']) ? $data['images'] : [] as $img) {
        $blocks[] = ['type' => 'img', 'src' => 'uploads/' . $img['file'], 'caption' => $img['caption']];
    }
    // หัวข้อที่มีแต่รูป ไม่ต้องแสดงตารางว่าง
    if ($row['kind'] === 'table' && empty($data['rows'])) {
        $blocks = array_values(array_filter($blocks, function ($b) { return $b['type'] !== 'table'; }));
    }

    $sections[] = [
        'id'     => 't' . $row['id'],
        'group'  => chapter_label($row['chapter']),
        'title'  => $row['title'],
        'blocks' => $blocks,
    ];
}

json_out([
    'id'           => (int) $t['id'],
    'academicYear' => $year,
    'term'         => $term,
    'title'        => $term === 0 ? "สารสนเทศ ปีการศึกษา $year" : "สารสนเทศ ภาคเรียนที่ $term/$year",
    'sections'     => $sections,
]);
