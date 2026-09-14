import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const province = searchParams.get('province');
    const district = searchParams.get('district');
    const subdistrict = searchParams.get('subdistrict');

    // 1. ดึงรายชื่อจังหวัดทั้งหมดที่มีในระบบ
    if (!province) {
      const { data, error } = await supabase
        .from('mediator_officers')
        .select('province')
        .not('province', 'is', null)
        .order('province', { ascending: true });

      if (error) throw error;

      const provinces = Array.from(new Set(data.map((item) => item.province))).filter(Boolean);
      return NextResponse.json({ success: true, data: provinces });
    }

    // 2. ดึงรายชื่ออำเภอ/เขต ภายใต้จังหวัด
    if (province && !district) {
      const { data, error } = await supabase
        .from('mediator_officers')
        .select('district')
        .eq('province', province)
        .not('district', 'is', null)
        .order('district', { ascending: true });

      if (error) throw error;

      const districts = Array.from(new Set(data.map((item) => item.district))).filter(Boolean);
      return NextResponse.json({ success: true, data: districts });
    }

    // 3. ดึงรายชื่อตำบล/แขวง ภายใต้อำเภอ
    if (province && district && !subdistrict) {
      const { data, error } = await supabase
        .from('mediator_officers')
        .select('subdistrict')
        .eq('province', province)
        .eq('district', district)
        .not('subdistrict', 'is', null)
        .order('subdistrict', { ascending: true });

      if (error) throw error;

      const subdistricts = Array.from(new Set(data.map((item) => item.subdistrict))).filter(Boolean);
      return NextResponse.json({ success: true, data: subdistricts });
    }

    // 4. ดึงรายชื่อศูนย์ไกล่เกลี่ยฯ ภายใต้ตำบล/อำเภอ/จังหวัด
    if (province && district && subdistrict) {
      const { data, error } = await supabase
        .from('mediator_officers')
        .select('center_code, center_name')
        .eq('province', province)
        .eq('district', district)
        .eq('subdistrict', subdistrict)
        .not('center_name', 'is', null);

      if (error) throw error;

      // Unique centers by center_code or center_name
      const centerMap = new Map();
      data.forEach((c) => {
        const key = c.center_code || c.center_name;
        if (!centerMap.has(key)) {
          centerMap.set(key, {
            center_code: c.center_code,
            center_name: c.center_name,
          });
        }
      });

      return NextResponse.json({ success: true, data: Array.from(centerMap.values()) });
    }

    return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
