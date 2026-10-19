<?php
// รายการหัวข้อของฝ่าย พร้อมบอกว่าปีที่เลือกกรอกข้อมูลแล้วหรือยัง
require __DIR__ . '/lib.php';
$me = require_login();

$deptId = isset($_GET['department_id']) ? (int) $_GET['department_id'] : 0;
$year   = isset($_GET['year']) ? (int) $_GET['year'] : 0;

$stmt = db()->prepare(
    'SELECT t.*, r.updated_at, r.data_json, u.display_name AS updated_by_name
       FROM topics t
       LEFT JOIN records r
              ON r.topic_id = t.id
             AND r.academic_year = ?
             AND r.term = 0
       LEFT JOIN users u ON u.id = r.updated_by
      WHERE t.department_id = ?
      ORDER BY t.sort_order, t.id'
);
$stmt->execute([$year, $deptId]);

require_department_access($me, $deptId);
$canEdit = true;
$lockYear = period_locked($year, 0);

json_out(array_map(function ($t) use ($canEdit, $lockYear) {
    return [
        'id'            => (int) $t['id'],
        'departmentId'  => (int) $t['department_id'],
        'chapter'       => (int) $t['chapter'],
        'title'         => $t['title'],
        'kind'          => $t['kind'],
        'frequency'     => 'year',
        'columns'       => topic_columns($t),
        'hasData'       => $t['updated_at'] !== null,
        'updatedAt'     => $t['updated_at'],
        'updatedByName' => $t['updated_by_name'],
        'copiedFrom'    => copied_from($t['data_json']),
        'canEdit'       => $canEdit,
        'locked'          => $lockYear,
        'structureLocked' => topic_locked($t['id']),
    ];
}, $stmt->fetchAll()));
