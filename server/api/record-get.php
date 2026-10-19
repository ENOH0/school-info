<?php
// ดึงข้อมูลของหัวข้อ ในปีการศึกษาที่เลือก
require __DIR__ . '/lib.php';
$me = require_login();

$topic = find_topic(isset($_GET['topic_id']) ? (int) $_GET['topic_id'] : 0);
require_department_access($me, $topic['department_id']);
$year  = isset($_GET['year']) ? (int) $_GET['year'] : 0;
$term  = 0;

$stmt = db()->prepare(
    'SELECT r.data_json, r.updated_at, u.display_name AS updated_by_name
       FROM records r LEFT JOIN users u ON u.id = r.updated_by
      WHERE r.topic_id = ? AND r.academic_year = ? AND r.term = ?'
);
$stmt->execute([(int) $topic['id'], $year, $term]);
$r = $stmt->fetch();

// ข้อมูลครั้งก่อน (ให้กด "ดึงข้อมูลครั้งก่อน" มาใช้ต่อได้)
$prev = previous_record($topic['id'], $year, $term);

json_out([
    'topic' => [
        'id'           => (int) $topic['id'],
        'departmentId' => (int) $topic['department_id'],
        'title'        => $topic['title'],
        'kind'         => $topic['kind'],
        'frequency'    => 'year',
        'columns'      => topic_columns($topic),
        'canEdit'      => can_edit_department($me, $topic['department_id']),
    ],
    'academicYear'  => $year,
    'locked'        => period_locked($year, $term),
    'term'          => 0,
    'data'          => $r ? json_decode($r['data_json'], true) : null,
    'updatedAt'     => $r ? $r['updated_at'] : null,
    'updatedByName' => $r ? $r['updated_by_name'] : null,
    'previous'      => $prev ? ['academicYear' => (int) $prev['academic_year'], 'term' => 0] : null,
]);
