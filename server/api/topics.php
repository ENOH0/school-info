<?php
// รายการหัวข้อของฝ่าย พร้อมบอกว่าภาคเรียนที่เลือกกรอกข้อมูลแล้วหรือยัง
// GET topics.php?department_id=1&year=2569&term=1
require __DIR__ . '/lib.php';
$me = require_login();

$deptId = isset($_GET['department_id']) ? (int) $_GET['department_id'] : 0;
$year   = isset($_GET['year']) ? (int) $_GET['year'] : 0;
$term   = isset($_GET['term']) ? (int) $_GET['term'] : 0;

$stmt = db()->prepare(
    'SELECT t.*, r.updated_at, r.data_json, u.display_name AS updated_by_name
       FROM topics t
       LEFT JOIN records r
              ON r.topic_id = t.id
             AND r.academic_year = ?
             AND r.term = (CASE WHEN t.frequency = \'year\' THEN 0 ELSE ? END)
       LEFT JOIN users u ON u.id = r.updated_by
      WHERE t.department_id = ?
        AND (? > 0 OR t.frequency = \'year\')
      ORDER BY t.sort_order, t.id'
);
$stmt->execute([$year, $term, $deptId, $term]);

require_department_access($me, $deptId);
$canEdit = true;
$lockTerm = period_locked($year, $term);  // ล็อกหัวข้อรายภาคเรียน
$lockYear = period_locked($year, 0);      // ล็อกหัวข้อรายปี

json_out(array_map(function ($t) use ($canEdit, $lockTerm, $lockYear) {
    return [
        'id'            => (int) $t['id'],
        'departmentId'  => (int) $t['department_id'],
        'chapter'       => (int) $t['chapter'],
        'title'         => $t['title'],
        'kind'          => $t['kind'],
        'frequency'     => $t['frequency'],
        'columns'       => topic_columns($t),
        'hasData'       => $t['updated_at'] !== null,
        'updatedAt'     => $t['updated_at'],
        'updatedByName' => $t['updated_by_name'],
        'copiedFrom'    => copied_from($t['data_json']),
        'canEdit'       => $canEdit,
        'locked'          => $t['frequency'] === 'year' ? $lockYear : $lockTerm,
        'structureLocked' => topic_locked($t['id']),
    ];
}, $stmt->fetchAll()));
