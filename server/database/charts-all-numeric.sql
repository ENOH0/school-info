-- เพิ่มกราฟให้หัวข้อตารางเดิมที่มีข้อมูลตัวเลข คะแนน หรือข้อมูลเปรียบเทียบ
-- รันซ้ำได้อย่างปลอดภัย และไม่ทับการตั้งค่ากราฟที่มีอยู่แล้ว
USE school_info;

UPDATE topics SET chart_json = CASE title
  WHEN 'โครงการหลักประจำปี' THEN '{"type":"bar","series":["c3"],"trend":false}'
  WHEN 'จำนวนบุคลากรแยกตามประเภท' THEN '{"type":"bar","series":["c2","c3","c4"],"trend":false}'
  WHEN 'จำนวนครูแยกตามวิทยฐานะ' THEN '{"type":"bar","series":["c2","c3","c4"],"trend":false}'
  WHEN 'จำนวนครูแยกตามวุฒิการศึกษา' THEN '{"type":"bar","series":["c2"],"trend":false}'
  WHEN 'จำนวนครูแยกตามกลุ่มสาระการเรียนรู้' THEN '{"type":"bar","series":["c2","c3"],"trend":false}'
  WHEN 'การพัฒนาครูและบุคลากร' THEN '{"type":"bar","series":["c2","c3"],"trend":false}'
  WHEN 'จำนวนนักเรียนแยกตามระดับชั้น' THEN '{"type":"bar","series":["c2","c3","c4","c5"],"trend":false}'
  WHEN 'นักเรียนที่จบการศึกษาและการศึกษาต่อ' THEN '{"type":"bar","series":["c2","c3","c4","c5"],"trend":false}'
  WHEN 'สถิติการมาเรียนของนักเรียน' THEN '{"type":"bar","series":["c2","c3","c4"],"trend":false}'
  WHEN 'การเยี่ยมบ้านนักเรียน' THEN '{"type":"bar","series":["c2","c3","c4"],"trend":false}'
  WHEN 'แผนการเรียนที่เปิดสอน' THEN '{"type":"bar","series":["c3"],"trend":false}'
  WHEN 'แหล่งเรียนรู้ภายในโรงเรียน' THEN '{"type":"bar","series":["c2"],"trend":false}'
  WHEN 'แหล่งเรียนรู้และภูมิปัญญาท้องถิ่น' THEN '{"type":"bar","series":["c3"],"trend":false}'
  WHEN 'อาคารเรียนและอาคารประกอบ' THEN '{"type":"bar","series":["c2","c3"],"trend":false}'
  WHEN 'ห้องพิเศษและห้องปฏิบัติการ' THEN '{"type":"bar","series":["c2"],"trend":false}'
  WHEN 'ระบบสาธารณูปโภคและเทคโนโลยี' THEN '{"type":"bar","series":["c2"],"trend":false}'
  WHEN 'งบประมาณที่ได้รับแยกตามหมวด' THEN '{"type":"bar","series":["c2"],"trend":false}'
  WHEN 'การใช้งบประมาณแยกตามกลุ่มบริหาร' THEN '{"type":"bar","series":["c2","c3","c4"],"trend":false}'
  WHEN 'ผลสัมฤทธิ์ทางการเรียนแยกตามกลุ่มสาระ' THEN '{"type":"bar","series":["c2","c3"],"trend":false}'
  WHEN 'ผลการประเมินคุณลักษณะอันพึงประสงค์' THEN '{"type":"bar","series":["c2","c3"],"trend":false}'
  WHEN 'ผลการประเมินการอ่าน คิดวิเคราะห์ และเขียน' THEN '{"type":"bar","series":["c2","c3"],"trend":false}'
  WHEN 'ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 3' THEN '{"type":"bar","series":["c2","c3"],"trend":false}'
  WHEN 'ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 6' THEN '{"type":"bar","series":["c2","c3"],"trend":false}'
  WHEN 'รางวัลของนักเรียน' THEN '{"type":"bar","series":["c4"],"trend":false}'
  WHEN 'สรุปจำนวนรางวัลแยกตามระดับ' THEN '{"type":"bar","series":["c2","c3","c4"],"trend":false}'
  ELSE chart_json
END
WHERE chart_json IS NULL;
