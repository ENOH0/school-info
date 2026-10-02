<?php
// ข้อมูลพื้นฐานสำหรับหน้าจัดการ: รายชื่อฝ่าย และปีการศึกษา/ภาคเรียน
require __DIR__ . '/lib.php';
require_login();

$departments = array_map(function ($d) {
    return ['id' => (int) $d['id'], 'name' => $d['name']];
}, db()->query('SELECT id, name FROM departments ORDER BY sort_order, id')->fetchAll());

$terms = array_map(function ($t) {
    return [
        'id'           => (int) $t['id'],
        'academicYear' => (int) $t['academic_year'],
        'term'         => (int) $t['term'],
        'isCurrent'    => (int) $t['is_current'] === 1,
        'isPublished'  => (int) $t['is_published'] === 1,
        'publishedAt'  => $t['published_at'],
    ];
}, db()->query('SELECT id, academic_year, term, is_current, is_published, published_at FROM terms ORDER BY academic_year DESC, term DESC')->fetchAll());

json_out(['departments' => $departments, 'terms' => $terms]);
