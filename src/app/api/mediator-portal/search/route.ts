import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { convertThaiToArabicNumerals } from '@/utils/thaiIdValidator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const centerCode = searchParams.get('center_code');
    const centerName = searchParams.get('center_name');
    const keyword = searchParams.get('keyword')?.trim() || '';

    if (!keyword) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุชื่อหรือนามสกุลที่ต้องการค้นหา' }, { status: 400 });
    }

    let query = supabase
      .from('mediator_officers')
      .select('id, title, first_name, last_name, position, center_code, center_name, province, district, subdistrict, phone_original, phone_updated, status, birth_date_be');

    // กรองตามรหัสศูนย์ (รองรับทั้งเลขไทยและเลขอารบิกที่อาจบันทึกไว้ในฐาน)
    if (centerCode) {
      const arabicCode = convertThaiToArabicNumerals(centerCode);
      const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
      const thaiCode = centerCode.replace(/[0-9]/g, (d) => thaiDigits[parseInt(d, 10)]);

      const matchCodes = Array.from(new Set([centerCode, arabicCode, thaiCode])).filter(Boolean);
      query = query.in('center_code', matchCodes);
    } else if (centerName) {
      const arabicName = convertThaiToArabicNumerals(centerName);
      query = query.or(`center_name.eq.${centerName},center_name.eq.${arabicName}`);
    }

    // ค้นหาแบบบางคำ (Partial Match) ทั้งชื่อและนามสกุล
    query = query.or(`first_name.ilike.%${keyword}%,last_name.ilike.%${keyword}%`);

    const { data, error } = await query;

    if (error) throw error;

    // แปลงรหัสศูนย์และชื่อศูนย์ในผลลัพธ์เป็นเลขอารบิกทั้งหมด
    const sanitizedData = (data || []).map((item) => ({
      ...item,
      center_code: convertThaiToArabicNumerals(item.center_code || ''),
      center_name: convertThaiToArabicNumerals(item.center_name || ''),
    }));

    return NextResponse.json({
      success: true,
      count: sanitizedData.length,
      data: sanitizedData,
    });
  } catch (error: any) {
    console.error('Error searching mediator:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
