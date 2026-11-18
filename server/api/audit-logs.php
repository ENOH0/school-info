<?php
require __DIR__ . '/lib.php';
require_admin();
$year = isset($_GET['year']) ? (int)$_GET['year'] : 0;
$dept = isset($_GET['department_id']) ? (int)$_GET['department_id'] : 0;
$sql = 'SELECT a.*,u.display_name AS user_name,d.name AS department_name,t.title AS topic_title
          FROM audit_logs a
          LEFT JOIN users u ON u.id=a.user_id
          LEFT JOIN departments d ON d.id=a.department_id
          LEFT JOIN topics t ON t.id=a.topic_id WHERE 1=1';
$params=[];
if($year>0){$sql.=' AND a.academic_year=?';$params[]=$year;}
if($dept>0){$sql.=' AND a.department_id=?';$params[]=$dept;}
$sql.=' ORDER BY a.id DESC LIMIT 500';
$stmt=db()->prepare($sql);$stmt->execute($params);$out=[];
foreach($stmt->fetchAll() as $r){
  $out[]=[
    'id'=>(int)$r['id'],'userName'=>$r['user_name']?:'บัญชีที่ถูกลบ','departmentName'=>$r['department_name'],
    'topicTitle'=>$r['topic_title'],'academicYear'=>$r['academic_year']===null?null:(int)$r['academic_year'],
    'action'=>$r['action'],'entityType'=>$r['entity_type'],'itemLabel'=>$r['item_label'],
    'before'=>$r['before_json']===null?null:json_decode($r['before_json'],true),
    'after'=>$r['after_json']===null?null:json_decode($r['after_json'],true),'createdAt'=>$r['created_at'],
  ];
}
json_out($out);
