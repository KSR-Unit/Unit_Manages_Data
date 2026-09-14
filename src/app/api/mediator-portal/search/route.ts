import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // กรองตามรหัสศูนย์ หรือชื่อศูนย์
    if (centerCode) {
      query = query.eq('center_code', centerCode);
    } else if (centerName) {
      query = query.eq('center_name', centerName);
    }

    // ค้นหาแบบบางคำ (Partial Match) ทั้งชื่อและนามสกุล
    query = query.or(`first_name.ilike.%${keyword}%,last_name.ilike.%${keyword}%`);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data || [],
    });
  } catch (error: any) {
    console.error('Error searching mediator:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
