<?php
// เล่มสารสนเทศ 1 เล่ม พร้อมเนื้อหาทุกหัวข้อ (สาธารณะ ไม่ต้องล็อกอิน)
// GET book.php?id=2   (id = รหัสปีการศึกษาในตาราง terms)
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
$title = "สารสนเทศ ปีการศึกษา $year";

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
       FROM topics tp
       JOIN departments d ON d.id = tp.department_id
       LEFT JOIN records r
         ON r.topic_id = tp.id
        AND r.academic_year = ?
        AND r.term = 0
      ORDER BY (tp.chapter = 0), tp.chapter, d.sort_order, d.id, tp.sort_order, tp.id'
);
$stmt->execute([$year]);

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
        // ถ้ายังไม่ได้ตั้งค่ากราฟ ให้สร้างกราฟแท่งอัตโนมัติจากคอลัมน์ตัวเลข
        // (ไม่นำคอลัมน์ลำดับ เช่น "ที่"/"ลำดับ" มาวาด)
        if (!$chart && $row['chart_json'] === null) {
            $chart = automatic_chart($cols);
        }
        if ($chart && count($filled) > 0) {
            $blocks[] = chart_block($chart, $cols, $filled, $row['title']);
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
        'subgroup' => topic_subgroup($row['title']),
        'title'  => $row['title'],
        'blocks' => $blocks,
    ];
}

// ให้เล่มและสารบัญแสดงหมวด 1–10 ครบเสมอ
// หมวดที่ยังไม่มีหัวข้อจะแสดงข้อความรอข้อมูล และจะหายไปเองเมื่อมีข้อมูลจริงในหมวดนั้น
$completeSections = [];
$usedSections = [];
for ($chapter = 1; $chapter <= 10; $chapter++) {
    $group = chapter_label($chapter);
    $found = false;
    foreach ($sections as $index => $section) {
        if ($section['group'] === $group) {
            $completeSections[] = $section;
            $usedSections[$index] = true;
            $found = true;
        }
    }
    if (!$found) {
        $completeSections[] = [
            'id' => 'empty-chapter-' . $chapter,
            'group' => $group,
            'subgroup' => null,
            'title' => 'ยังไม่มีข้อมูล',
            'blocks' => [[
                'type' => 'p',
                'text' => 'ยังไม่มีข้อมูลในหมวดนี้สำหรับปีการศึกษา ' . $year,
            ]],
        ];
    }
}
// หมวด "อื่น ๆ" (chapter 0) หรือหมวดพิเศษยังคงอยู่ท้ายเล่ม
foreach ($sections as $index => $section) {
    if (!isset($usedSections[$index])) {
        $completeSections[] = $section;
    }
}
$sections = $completeSections;

json_out([
    'id'           => (int) $t['id'],
    'academicYear' => $year,
    'term'         => $term,
    'title'        => $title,
    'published'    => $published,
    'sections'     => $sections,
]);

/** ป้ายแบ่งหมวดย่อย 8 กลุ่ม ใช้เฉพาะสารบัญ ไม่กระทบเนื้อหาหน้าเล่ม */
function topic_subgroup($title)
{
    static $groups = [
        'ด้านจำนวนและสถิติทางการศึกษา' => [
            'นักเรียนที่จบการศึกษาและการศึกษาต่อ', 'จำนวนนักเรียนแยกตามระดับชั้น (รายภาคเรียน)',
            'จำนวนนักเรียนแยกตามระดับชั้น (สรุปรายปี)', 'สถิติการมาเรียนของนักเรียน',
            'การเยี่ยมบ้านนักเรียน', 'ทุนการศึกษา',
        ],
        'ด้านสุขภาวะและพฤติกรรม' => [
            'ผลการประเมินสัดส่วนร่างกายของนักเรียน', 'ผลการประเมินสมรรถภาพทางกายของนักเรียน',
            'ผลสุขภาพจิตของนักเรียนแยกตามระดับชั้น', 'นักเรียนที่มีพฤติกรรมไม่พึงประสงค์แยกตามระดับชั้น',
        ],
        'ด้านหลักสูตรและการจัดการเรียนการสอน' => [
            'แผนการเรียนที่เปิดสอน', 'จำนวนหลักสูตรและแผนการเรียนที่เปิดสอน',
            'โครงสร้างหลักสูตรสถานศึกษาระดับมัธยมศึกษาตอนต้นและตอนปลาย', 'กระบวนการพัฒนาหลักสูตรสถานศึกษา',
            'การจัดกิจกรรมเสริมหลักสูตร', 'การออกแบบการจัดการเรียนรู้ที่เน้นผู้เรียน',
            'การจัดการชั้นเรียนและการสะท้อนผล', 'งานวิจัยในชั้นเรียน',
        ],
        'ด้านสื่อและแหล่งเรียนรู้' => [
            'แหล่งเรียนรู้ภายในโรงเรียน', 'แหล่งเรียนรู้และภูมิปัญญาท้องถิ่น',
            'การจัดหาและใช้สื่อ เทคโนโลยี และแหล่งเรียนรู้', 'จำนวนสื่อและนวัตกรรมแยกตามกลุ่มสาระการเรียนรู้',
        ],
        'ด้านผลสัมฤทธิ์ทางการเรียนและการวัดผล' => [
            'ผลสัมฤทธิ์ทางการเรียนแยกตามกลุ่มสาระ', 'ผลสัมฤทธิ์รายวิชาภาษาอังกฤษแยกตามระดับคะแนน',
            'ผลสัมฤทธิ์รายวิชาเทคโนโลยีแยกตามระดับคะแนน', 'ผลสัมฤทธิ์รายวิชาการศึกษาค้นคว้าด้วยตนเอง (IS)',
            'ผลสัมฤทธิ์รายวิชาการป้องกันการทุจริตแยกตามระดับคะแนน', 'แนวทางพัฒนาผลสัมฤทธิ์ทางวิชาการ',
            'การพัฒนาความสามารถด้านภาษา การคิด และนวัตกรรม', 'ระบบการวัดและประเมินผล', 'การนำผลประเมินไปพัฒนาผู้เรียน',
        ],
        'ด้านผลการทดสอบระดับชาติ (O-NET) และการประเมินสถานศึกษา' => [
            'ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 3 (คะแนนเฉลี่ยโรงเรียน)',
            'ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 6 (คะแนนเฉลี่ยโรงเรียน)',
            'ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 3 เปรียบเทียบระดับประเทศ',
            'ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 6 เปรียบเทียบระดับประเทศ',
            'ผลการประเมินตนเองของสถานศึกษา (SAR)',
        ],
        'ด้านการอ่าน คิดวิเคราะห์ เขียน และคุณลักษณะอันพึงประสงค์' => [
            'ความสามารถด้านการอ่าน-เขียนภาษาไทยและการสื่อสารระดับดี',
            'ผลการประเมินการอ่าน คิดวิเคราะห์ และเขียน (รายภาคเรียน)',
            'ผลการประเมินการอ่าน คิดวิเคราะห์ และเขียนสื่อความ (สรุปรายปี)',
            'ผลการประเมินคุณลักษณะอันพึงประสงค์ (รายภาคเรียน)',
            'ผลการประเมินคุณลักษณะอันพึงประสงค์ของผู้เรียน (สรุปรายปี)',
        ],
        'ด้านการศึกษาต่อและกิจกรรมพัฒนาผู้เรียน' => [
            'เส้นทางศึกษาต่อหรือประกอบอาชีพของนักเรียนชั้นมัธยมศึกษาปีที่ 3',
            'เส้นทางศึกษาต่อหรือประกอบอาชีพของนักเรียนชั้นมัธยมศึกษาปีที่ 6',
            'ผลการเข้าศึกษาต่อของนักเรียนชั้นมัธยมศึกษาปีที่ 6 แยกตามระบบ TCAS',
            'การเข้าร่วมกิจกรรมเลือกตั้งสภาผู้แทนนักเรียน',
            'การส่งเสริมคุณลักษณะอันพึงประสงค์และจิตสาธารณะ',
            'การอนุรักษ์สิ่งแวดล้อมและภูมิปัญญาท้องถิ่น', 'การทำงานเป็นทีมและความปลอดภัยของผู้เรียน',
        ],
    ];
    foreach ($groups as $label => $titles) {
        if (in_array($title, $titles, true)) return $label;
    }
    return null;
}


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

/** กราฟของตารางในปีนี้: แกนนอน = คอลัมน์ข้อความแรก (เช่น ระดับชั้น) */
function automatic_chart($cols)
{
    $series = [];
    foreach ($cols as $c) {
        if ($c['type'] !== 'number') {
            continue;
        }
        $label = isset($c['label']) ? trim((string) $c['label']) : '';
        if (preg_match('/^(ที่|ลำดับ|เลขที่)$/u', $label)) {
            continue;
        }
        $series[] = $c['key'];
    }
    return count($series) ? ['type' => 'bar', 'series' => $series, 'trend' => false] : null;
}

function chart_block($chart, $cols, $rows, $topicTitle)
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
    return [
        'type' => 'chart',
        'kind' => $chart['type'],
        'title' => 'กราฟแสดงข้อมูล: ' . $topicTitle,
        'labels' => $labels,
        'series' => $series,
    ];
}

/**
 * กราฟแท่งเทียบย้อนหลัง: ยอดรวมของแต่ละคอลัมน์ในแต่ละปี ไม่เกิน 8 ปีล่าสุด
 * คนทั่วไปเห็นเฉพาะช่วงที่เผยแพร่แล้ว (และช่วงของเล่มนี้)
 */
function trend_block($row, $chart, $cols, $loggedIn)
{
    $year = (int) $row['academic_year'];
    $term = (int) $row['record_term'];
    $stmt = db()->prepare(
        'SELECT academic_year, term, data_json FROM records
          WHERE topic_id = ? AND term = 0 AND academic_year <= ?
          ORDER BY academic_year DESC LIMIT 20'
    );
    $stmt->execute([(int) $row['id'], $year]);

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
    return [
        'type'   => 'chart',
        'kind'   => 'bar',
        'title'  => 'ยอดรวมทั้งตาราง เทียบแต่ละปีการศึกษา',
        'labels' => array_map(function ($p) { return $p['label']; }, $points),
        'series' => $series,
    ];
}
