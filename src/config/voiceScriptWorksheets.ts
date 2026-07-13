/**
 * voiceScriptWorksheets.ts
 * ข้อมูล static สำหรับ printWorksheet — ใบงานร่างสคริปต์คำพูด
 * แยกออกจาก dashboard/page.tsx เพื่อลดขนาดไฟล์
 */

export interface WorksheetInfo {
  title: string;
  tag: string;
  content: string; // raw HTML สำหรับ print window
}

export const WORKSHEET_CATEGORIES: Record<string, WorksheetInfo> = {
  justice_fund: {
    title: '1. แบบคำขอรับความช่วยเหลือเงินกองทุนยุติธรรม (กทย.4)',
    tag: 'งบกองทุนยุติธรรม',
    content: '"เสนอโครงการ <span class="fill-line w-long"></span> เสนอโดยประธานศูนย์ไกล่เกลี่ย <span class="fill-line"></span> สำนักงานตั้งอยู่ที่เลขที่ <span class="fill-line w-long"></span> มีผู้ประสานงานหลักคือ <span class="fill-line"></span> โทรศัพท์ติดต่อ <span class="fill-line"></span> อีเมล <span class="fill-line"></span> วัตถุประสงค์เพื่อส่งเสริมความรู้กฎหมายแก่ประชาชนในพื้นที่ จัดอบรมในวันที่ <span class="fill-line"></span> ถึงวันที่ <span class="fill-line"></span> ดำเนินการจัดประชุมเห็นชอบของคณะทำงานเสร็จสิ้นเมื่อวันที่ <span class="fill-line"></span>"'
  },
  budgets: {
    title: '2. คำเสนอขอและรายงานการใช้จ่ายงบประมาณทั่วไป',
    tag: 'งบประมาณทั่วไป',
    content: '"ขอเบิกจ่ายงบประมาณโครงการ <span class="fill-line w-long"></span> ได้รับงบประมาณอนุมัติจำนวน <span class="fill-line"></span> บาท วันที่ได้รับการอนุมัติเบิกจ่ายคือวันที่ <span class="fill-line"></span> จัดโครงการเสร็จสิ้นในวันที่ <span class="fill-line"></span> มีเงินงบประมาณคงเหลือส่งคืนคลังจำนวน <span class="fill-line"></span> บาท บันทึกรายงานโดย <span class="fill-line"></span> โทรศัพท์ติดต่อ <span class="fill-line"></span>"'
  },
  meetings: {
    title: '3. รายงานการประชุมคณะทำงานของศูนย์ประจำตำบล',
    tag: 'การประชุม',
    content: '"จัดประชุมคณะทำงานศูนย์ไกล่เกลี่ยข้อพิพาทประจำตำบลดินแดง ครั้งที่ <span class="fill-line w-short"></span> ในวันที่ <span class="fill-line"></span> ณ <span class="fill-line"></span> มีมติที่ประชุมเห็นชอบในเรื่องการ <span class="fill-line w-long"></span> บันทึกรายงานโดย <span class="fill-line"></span> โทรศัพท์ติดต่อ <span class="fill-line"></span>"'
  },
  plans: {
    title: '4. แผนการดำเนินงานและแผนงานโครงการประจำปี',
    tag: 'แผนงานประจำปี',
    content: '"บันทึกแผนงานโครงการหลักชื่อโครงการ <span class="fill-line w-long"></span> ปีงบประมาณ <span class="fill-line w-short"></span> บันทึกโดย <span class="fill-line"></span> โทร <span class="fill-line"></span> มีกิจกรรมย่อยคือ กิจกรรม <span class="fill-line"></span> เริ่มวันที่ <span class="fill-line"></span> ถึงวันที่ <span class="fill-line"></span> งบประมาณย่อยจำนวน <span class="fill-line"></span> บาท"'
  },
  activities: {
    title: '5. รายงานผลสำเร็จการดำเนินกิจกรรมลงพื้นที่ในชุมชน',
    tag: 'ผลดำเนินกิจกรรม',
    content: '"รายงานผลการจัดกิจกรรมชื่อ <span class="fill-line w-long"></span> จัดขึ้นในวันที่ <span class="fill-line"></span> ณ <span class="fill-line"></span> มีผู้เข้าร่วมกิจกรรมรวม <span class="fill-line w-short"></span> คน ผลงานสำเร็จคือ <span class="fill-line w-long"></span> บันทึกรายงานข้อมูลโดย <span class="fill-line"></span>"'
  },
  trainings: {
    title: '6. รายงานการเข้าร่วมฝึกอบรมสัมมนาความรู้ด้านกฎหมาย',
    tag: 'การอบรมศึกษา',
    content: '"รายงานการเข้าร่วมอบรมในรูปแบบ <span class="fill-line w-short"></span> หลักสูตร <span class="fill-line w-long"></span> จัดขึ้นในวันที่ <span class="fill-line"></span> ผู้เข้ารับการอบรมคือ <span class="fill-line"></span> จัดโดยหน่วยงาน <span class="fill-line"></span> ได้รับความรู้หัวข้อหลักคือ <span class="fill-line w-long"></span> บันทึกโดย <span class="fill-line"></span>"'
  },
  ems_reports: {
    title: '7. รายงานผลการไกล่เกลี่ยข้อพิพาทตาม พ.ร.บ. ไกล่เกลี่ย 2562',
    tag: 'ไกล่เกลี่ย พ.ร.บ.',
    content: '"รายงานการไกล่เกลี่ยคดีข้อพิพาทเลขคำร้องที่ <span class="fill-line"></span> วันที่รับคำร้องคือวันที่ <span class="fill-line"></span> เป็นข้อพิพาทประเภทคดี <span class="fill-line"></span> ทุนทรัพย์ไกล่เกลี่ยจำนวน <span class="fill-line"></span> บาท ผลการเจรจาคือ <span class="fill-line"></span> ไกล่เกลี่ยสำเร็จวันที่ <span class="fill-line"></span> บันทึกข้อมูลโดยผู้ไกล่เกลี่ย <span class="fill-line"></span>"'
  },
  other_laws_reports: {
    title: '8. บันทึกให้คำปรึกษากฎหมายทั่วไปและการส่งต่อเรื่องร้องเรียน',
    tag: 'คำปรึกษากฎหมาย',
    content: '"บันทึกประวัติการให้คำแนะนำทางกฎหมายแก่ประชาชนในวันที่ <span class="fill-line"></span> ประเด็นข้อหารือเรื่อง <span class="fill-line w-long"></span> ได้ทำการช่วยเหลือเบื้องต้นโดย <span class="fill-line w-long"></span> และได้ประสานส่งต่อไปยัง <span class="fill-line"></span> บันทึกข้อมูลโดย <span class="fill-line"></span>"'
  },
  zero_reports: {
    title: '9. รายงานส่งความว่างเปล่าประจำรอบเดือน (Zero Report)',
    tag: 'รายงาน Zero Report',
    content: '"ขอยื่นรายงานไม่มีผลการดำเนินงานหรือกิจกรรมใดๆ ประจำรอบเดือน <span class="fill-line w-short"></span> ปี พ.ศ. <span class="fill-line w-short"></span> เนื่องจากไม่มีคดีไกล่เกลี่ยและกิจกรรมจัดขึ้นภายในศูนย์ รายงานข้อเท็จจริงโดย <span class="fill-line"></span> เบอร์ติดต่อโทรศัพท์ <span class="fill-line"></span>"'
  }
};

/** Shared print CSS — ใช้ร่วมกันใน printWorksheet ทุกที่ */
export const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap');
  body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #1e293b; line-height: 2.2; font-size: 13px; background-color: #fff; }
  @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
  .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #334155; padding-bottom: 15px; }
  .header h1 { font-size: 18px; font-weight: 700; margin: 0 0 5px 0; color: #0f172a; }
  .header p { font-size: 11px; margin: 0; color: #475569; }
  .instructions { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 15px; border-radius: 8px; margin-bottom: 25px; font-size: 11.5px; color: #334155; line-height: 1.6; }
  .module-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }
  .module-title { font-size: 14px; font-weight: 700; color: #0f172a; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; }
  .module-title span.tag { font-size: 10px; font-weight: 500; background-color: #f1f5f9; padding: 2px 8px; border-radius: 4px; color: #475569; }
  .script-content { font-size: 13px; color: #334155; text-align: justify; line-height: 2.5; }
  .fill-line { display: inline-block; border-bottom: 1.5px dotted #334155; min-width: 140px; height: 18px; margin: 0 4px; vertical-align: bottom; }
  .w-long { min-width: 280px; }
  .w-short { min-width: 70px; }
`;

/** label map ที่ใช้ใน AI parsing result dialog — ใช้ใน dashboard/page.tsx */
export const AI_FIELD_LABELS: Record<string, string> = {
  title: 'ชื่อแผนงาน/โครงการ',
  year: 'ปีงบประมาณ (พ.ศ.)',
  project_description: 'รายละเอียดวัตถุประสงค์',
  meeting_name: 'ชื่อการประชุม',
  meeting_date: 'วันที่ประชุม',
  location: 'สถานที่จัด',
  summary: 'สรุปผล/รายงานผลงาน',
  course_name: 'ชื่อหลักสูตรอบรม',
  training_date: 'วันที่จัดอบรม',
  unit_training: 'หน่วยงานผู้จัด',
  project_name: 'ชื่อโครงการเบิกจ่าย',
  approval_date: 'วันที่อนุมัติเบิกจ่าย',
  budget_amount: 'จำนวนงบประมาณ (บาท)',
  case_no: 'เลขคำร้อง',
  start_date_mediation: 'วันที่รับคำร้อง',
  case_type: 'ประเภทข้อพิพาท',
  civil_dispute_type: 'ข้อพิพาททางแพ่ง',
  criminal_dispute_type: 'ข้อพิพาททางอาญา',
  value_in_dispute: 'ทุนทรัพย์ (บาท)',
  case_final: 'ผลการไกล่เกลี่ย',
  dispute_type: 'ประเภทข้อพิพาทกฎหมายอื่น',
  details: 'รายละเอียดปัญหา',
  action_type: 'การดำเนินการเบื้องต้น',
  action_detail: 'รายละเอียดการปฏิบัติ',
  month: 'รายงานรอบเดือน',
  reporter_name: 'ชื่อผู้รายงาน/ผู้บันทึก',
  reporter_phone: 'เบอร์ติดต่อผู้บันทึก',
  source_info: 'ผู้ประสานงานหลัก',
  source_contact: 'เบอร์โทรผู้ประสานงาน',
};
