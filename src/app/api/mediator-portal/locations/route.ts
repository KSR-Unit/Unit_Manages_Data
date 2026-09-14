import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { convertThaiToArabicNumerals } from '@/utils/thaiIdValidator';

// Cache จังหวัดในหน่วยความจำเพื่อความรวดเร็วสูงสุด
let provincesCache: string[] | null = null;
let lastCacheTime = 0;

async function getAllProvinces(): Promise<string[]> {
  const now = Date.now();
  // แคชไว้ 15 นาที
  if (provincesCache && provincesCache.length > 0 && now - lastCacheTime < 1000 * 60 * 15) {
    return provincesCache;
  }

  const provSet = new Set<string>();
  let from = 0;
  const step = 1000;

  // วนลูปดึงด้วย Range เพื่อหลุดข้อจำกัด 1000 แถวของ PostgREST
  while (true) {
    const { data, error } = await supabase
      .from('mediator_officers')
      .select('province')
      .not('province', 'is', null)
      .range(from, from + step - 1);

    if (error || !data || data.length === 0) break;

    for (const row of data) {
      const p = row.province?.trim();
      if (p && p !== 'ไม่ระบุจังหวัด' && p !== '') {
        provSet.add(p);
      }
    }

    if (data.length < step) break;
    from += step;
  }

  provincesCache = Array.from(provSet).sort((a, b) => a.localeCompare(b, 'th'));
  lastCacheTime = now;
  return provincesCache;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const province = searchParams.get('province');
    const district = searchParams.get('district');
    const subdistrict = searchParams.get('subdistrict');

    // 1. ดึงรายชื่อจังหวัดทั้งหมดในระบบ (ครบทุกจังหวัดทั่วประเทศ)
    if (!province) {
      const provinces = await getAllProvinces();
      return NextResponse.json({ success: true, data: provinces });
    }

    // 2. ดึงรายชื่ออำเภอ/เขต ภายใต้จังหวัด (รองรับกทม. ที่มีข้อมูลเกิน 1000 แถว)
    if (province && !district) {
      const distSet = new Set<string>();
      let from = 0;
      const step = 1000;

      while (true) {
        const { data, error } = await supabase
          .from('mediator_officers')
          .select('district')
          .eq('province', province)
          .not('district', 'is', null)
          .range(from, from + step - 1);

        if (error || !data || data.length === 0) break;

        for (const row of data) {
          const d = row.district?.trim();
          if (d && d !== 'ไม่ระบุอำเภอ' && d !== '') {
            distSet.add(d);
          }
        }

        if (data.length < step) break;
        from += step;
      }

      const districts = Array.from(distSet).sort((a, b) => a.localeCompare(b, 'th'));
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
        .range(0, 1000);

      if (error) throw error;

      const subdistricts = Array.from(
        new Set(
          data
            .map((item) => item.subdistrict?.trim())
            .filter((s) => s && s !== 'ไม่ระบุตำบล' && s !== '')
        )
      ).sort((a, b) => a.localeCompare(b, 'th'));

      return NextResponse.json({ success: true, data: subdistricts });
    }

    // 4. ดึงรายชื่อศูนย์ไกล่เกลี่ยฯ ภายใต้ตำบล/อำเภอ/จังหวัด (แปลงเลขไทยเป็นเลขอารบิก)
    if (province && district && subdistrict) {
      const { data, error } = await supabase
        .from('mediator_officers')
        .select('center_code, center_name')
        .eq('province', province)
        .eq('district', district)
        .eq('subdistrict', subdistrict)
        .not('center_name', 'is', null)
        .range(0, 1000);

      if (error) throw error;

      const centerMap = new Map();
      data.forEach((c) => {
        const arabicCode = convertThaiToArabicNumerals(c.center_code || '').trim();
        const arabicName = convertThaiToArabicNumerals(c.center_name || '').trim();
        const key = arabicCode || arabicName;

        if (key && !centerMap.has(key)) {
          centerMap.set(key, {
            center_code: arabicCode,
            center_name: arabicName,
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
