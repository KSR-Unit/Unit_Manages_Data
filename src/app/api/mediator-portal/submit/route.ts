import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateThaiNationalID } from '@/utils/thaiIdValidator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, id_card_number, phone, birth_date_be, consent } = body;

    // 1. ตรวจสอบความยินยอม PDPA
    if (!consent) {
      return NextResponse.json({ success: false, error: 'กรุณายินยอมตามนโยบายการคุ้มครองข้อมูลส่วนบุคคลก่อนบันทึก' }, { status: 400 });
    }

    // 2. ตรวจสอบรหัสอ้างอิง
    if (!id) {
      return NextResponse.json({ success: false, error: 'ไม่พบรหัสอ้างอิงของบุคคล' }, { status: 400 });
    }

    // 3. ตรวจสอบเลขบัตรประชาชน 13 หลัก ตามสูตร Check Digit Modulo 11
    const cleanedIdCard = (id_card_number || '').replace(/\D/g, '');
    if (!validateThaiNationalID(cleanedIdCard)) {
      return NextResponse.json({ success: false, error: 'เลขประจำตัวประชาชนไม่ถูกต้องตามรูปแบบ (กรุณาตรวจสอบความถูกต้อง 13 หลัก)' }, { status: 400 });
    }

    // 4. ตรวจสอบเบอร์โทรศัพท์
    const cleanedPhone = (phone || '').replace(/\D/g, '');
    if (cleanedPhone.length !== 10 || !['06', '08', '09'].some((prefix) => cleanedPhone.startsWith(prefix))) {
      return NextResponse.json({ success: false, error: 'หมายเลขโทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 06, 08, 09 และมี 10 หลัก)' }, { status: 400 });
    }

    // 5. ตรวจสอบวันเดือนปีเกิด (พ.ศ.)
    if (!birth_date_be || typeof birth_date_be !== 'string') {
      return NextResponse.json({ success: false, error: 'กรุณาระบุวันเดือนปีเกิด (พ.ศ.) ให้ครบถ้วน' }, { status: 400 });
    }

    // ดึงข้อมูล IP และ User-Agent สำหรับ Audit Log
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // 6. อัปเดตข้อมูลลงฐานข้อมูล Supabase
    const { data, error } = await supabase
      .from('mediator_officers')
      .update({
        id_card_number: cleanedIdCard,
        phone_updated: cleanedPhone,
        birth_date_be: birth_date_be.trim(),
        status: 'completed',
        consent_accepted: true,
        consent_at: new Date().toISOString(),
        client_ip: clientIp,
        user_agent: userAgent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'บันทึกข้อมูลและปรับปรุงประวัติเรียบร้อยแล้ว',
      data: data?.[0] || null,
    });
  } catch (error: any) {
    console.error('Submit mediator error:', error);
    return NextResponse.json({ success: false, error: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' }, { status: 500 });
  }
}
