<?php
// เล่มสารสนเทศ 1 เล่ม พร้อมเนื้อหาทุกหัวข้อ (สาธารณะ ไม่ต้องล็อกอิน)
// GET book.php?id=2   (id = รหัสภาคเรียนในตาราง terms)
// เล่มรายภาคเรียนรวมหัวข้อรายปีของปีนั้นด้วย
// เรียงตามหมวด 1–10 (หมวด 0 "อื่น ๆ" อยู่ท้าย) แล้วตามฝ่ายและลำดับหัวข้อ
require __DIR__ . '/lib.php';

$stmt = db()->prepare('SELECT id, academic_year, term, is_published FROM terms WHERE id = ?');
$stmt->execute([isset($_GET['id']) ? (int) $_GET['id'] : 0]);
$t = $stmt->fetch();
if (!$t) {
    fail('ไม่พบเล่มนี้', 404);
}
$year = (int) $t['academic_year'];
$term = (int) $t['term'];
$published = (int) $t['is_published'] === 1;
$title = $term === 0 ? "สารสนเทศ ปีการศึกษา $year" : "สารสนเทศ ภาคเรียนที่ $term/$year";

// ยังไม่เผยแพร่: คนนอกไม่เห็นเนื้อหา / ผู้ที่ล็อกอินเห็นได้ (ไว้ตรวจก่อนเผยแพร่)
if (!$published && !current_user()) {
    json_out([
        'id' => (int) $t['id'], 'academicYear' => $year, 'term' => $term, 'title' => $title,
        'published' => false, 'sections' => [],
    ]);
}

$stmt = db()->prepare(
    'SELECT tp.id, tp.chapter, tp.title, tp.kind, tp.frequency, tp.columns_json, tp.chart_json, d.name AS department,
            r.data_json, r.academic_year, r.term AS record_term
       FROM records r
       JOIN topics tp ON tp.id = r.topic_id
       JOIN departments d ON d.id = tp.department_id
      WHERE r.academic_year = ? AND (r.term = ? OR r.term = 0)
      ORDER BY (tp.chapter = 0), tp.chapter, d.sort_order, d.id, tp.sort_order, tp.id'
);
$stmt->execute([$year, $term]);

$loggedIn = current_user() !== null;
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
        list($filled, $foot) = compute_table($cols, isset($data['rows']) ? $data['rows'] : []);
        $toCells = function ($r) use ($cols) {
            return array_map(function ($c) use ($r) {
                $v = isset($r[$c['key']]) ? $r[$c['key']] : null;
                return $v === null ? '' : $v;
            }, $cols);
        };
        $table = [
            'type'    => 'table',
            'columns' => array_map(function ($c) { return $c['label']; }, $cols),
            'rows'    => array_map($toCells, $filled),
        ];
        if ($foot !== null && count($filled) > 1) {
            $table['foot'] = $toCells($foot); // แถว "รวม" (แสดงเมื่อมีมากกว่า 1 แถว)
        }
        $blocks[] = $table;

        // กราฟ (ตั้งค่าที่หน้าแก้ไขหัวข้อ)
        $chart = topic_chart($row);
        if ($chart && count($filled) > 0) {
            $blocks[] = chart_block($chart, $cols, $filled);
            if (!empty($chart['trend'])) {
                $trend = trend_block($row, $chart, $cols, $loggedIn);
                if ($trend) {
                    $blocks[] = $trend;
                }
            }
        }
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
    'title'        => $title,
    'published'    => $published,
    'sections'     => $sections,
]);


// ===== กราฟ =====

function col_label($cols, $key)
{
    foreach ($cols as $c) {
        if ($c['key'] === $key) {
            return $c['label'];
        }
    }
    return $key;
}

/** กราฟของตารางในภาคเรียนนี้: แกนนอน = คอลัมน์ข้อความแรก (เช่น ระดับชั้น) */
function chart_block($chart, $cols, $rows)
{
    $labelKey = null;
    foreach ($cols as $c) {
        if ($c['type'] === 'text') {
            $labelKey = $c['key'];
            break;
        }
    }
    $labels = [];
    foreach ($rows as $i => $r) {
        $v = $labelKey !== null && isset($r[$labelKey]) ? trim((string) $r[$labelKey]) : '';
        $labels[] = $v !== '' ? $v : 'แถวที่ ' . ($i + 1);
    }
    $series = [];
    foreach ($chart['series'] as $k) {
        $values = [];
        foreach ($rows as $r) {
            $v = isset($r[$k]) ? $r[$k] : null;
            $values[] = is_int($v) || is_float($v) ? $v : null;
        }
        $series[] = ['name' => col_label($cols, $k), 'values' => $values];
    }
    return ['type' => 'chart', 'kind' => $chart['type'], 'title' => '', 'labels' => $labels, 'series' => $series];
}

/**
 * กราฟเส้นเทียบย้อนหลัง: ยอดรวมของแต่ละคอลัมน์ ในแต่ละภาคเรียน (หรือแต่ละปี) ไม่เกิน 8 ช่วงล่าสุด
 * คนทั่วไปเห็นเฉพาะช่วงที่เผยแพร่แล้ว (และช่วงของเล่มนี้)
 */
function trend_block($row, $chart, $cols, $loggedIn)
{
    $year = (int) $row['academic_year'];
    $term = (int) $row['record_term'];
    if ($term === 0) {
        $stmt = db()->prepare(
            'SELECT academic_year, term, data_json FROM records
              WHERE topic_id = ? AND term = 0 AND academic_year <= ?
              ORDER BY academic_year DESC LIMIT 20'
        );
        $stmt->execute([(int) $row['id'], $year]);
    } else {
        $stmt = db()->prepare(
            'SELECT academic_year, term, data_json FROM records
              WHERE topic_id = ? AND term > 0 AND (academic_year < ? OR (academic_year = ? AND term <= ?))
              ORDER BY academic_year DESC, term DESC LIMIT 20'
        );
        $stmt->execute([(int) $row['id'], $year, $year, $term]);
    }

    $points = [];
    foreach ($stmt->fetchAll() as $r) {
        $isCurrent = (int) $r['academic_year'] === $year && (int) $r['term'] === $term;
        if (!$isCurrent && !$loggedIn && !period_locked($r['academic_year'], $r['term'])) {
            continue; // ยังไม่เผยแพร่ คนนอกไม่เห็น
        }
        $data = json_decode($r['data_json'], true);
        list($filled) = compute_table($cols, isset($data['rows']) ? $data['rows'] : []);
        $totals = [];
        foreach ($chart['series'] as $k) {
            $vals = [];
            foreach ($filled as $fr) {
                $vals[] = isset($fr[$k]) ? $fr[$k] : null;
            }
            $totals[$k] = add_numbers($vals);
        }
        $points[] = ['label' => period_short($r['academic_year'], $r['term']), 'totals' => $totals];
        if (count($points) >= 8) {
            break;
        }
    }
    if (count($points) < 2) {
        return null; // มีช่วงเดียว ยังเทียบไม่ได้
    }
    $points = array_reverse($points); // เก่า → ใหม่

    $series = [];
    foreach ($chart['series'] as $k) {
        $series[] = [
            'name'   => col_label($cols, $k),
            'values' => array_map(function ($p) use ($k) { return $p['totals'][$k]; }, $points),
        ];
    }
    $what = $term === 0 ? 'ปีการศึกษา' : 'ภาคเรียน';
    return [
        'type'   => 'chart',
        'kind'   => 'line',
        'title'  => 'ยอดรวมทั้งตาราง เทียบแต่ละ' . $what,
        'labels' => array_map(function ($p) { return $p['label']; }, $points),
        'series' => $series,
    ];
}
