import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { convertThaiToArabicNumerals, isValidCenterCode } from '@/utils/thaiIdValidator';

// Cache จังหวัดในหน่วยความจำเพื่อความรวดเร็วสูงสุด
let provincesCache: string[] | null = null;
let lastCacheTime = 0;

async function getAllProvinces(): Promise<string[]> {
  const now = Date.now();
  if (provincesCache && provincesCache.length > 0 && now - lastCacheTime < 1000 * 60 * 15) {
    return provincesCache;
  }

  const provSet = new Set<string>();
  let from = 0;
  const step = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('mediator_officers')
      .select('province, center_code')
      .not('province', 'is', null)
      .like('center_code', 'ศกช.%')
      .range(from, from + step - 1);

    if (error || !data || data.length === 0) break;

    for (const row of data) {
      // กรองเฉพาะศูนย์ที่มีรูปแบบ ศกช.xx xxxxxx เท่านั้น
      if (isValidCenterCode(row.center_code || '')) {
        const p = row.province?.trim();
        if (p && p !== 'ไม่ระบุจังหวัด' && p !== '') {
          provSet.add(p);
        }
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

    // 1. ดึงรายชื่อจังหวัดที่มีศูนย์ถูกต้องตามรูปแบบ ศกช.xx xxxxxx
    if (!province) {
      const provinces = await getAllProvinces();
      return NextResponse.json({ success: true, data: provinces });
    }

    // 2. ดึงรายชื่ออำเภอ/เขต ภายใต้จังหวัด (เฉพาะศูนย์ที่ถูกต้อง)
    if (province && !district) {
      const distSet = new Set<string>();
      let from = 0;
      const step = 1000;

      while (true) {
        const { data, error } = await supabase
          .from('mediator_officers')
          .select('district, center_code')
          .eq('province', province)
          .not('district', 'is', null)
          .like('center_code', 'ศกช.%')
          .range(from, from + step - 1);

        if (error || !data || data.length === 0) break;

        for (const row of data) {
          if (isValidCenterCode(row.center_code || '')) {
            const d = row.district?.trim();
            if (d && d !== 'ไม่ระบุอำเภอ' && d !== '') {
              distSet.add(d);
            }
          }
        }

        if (data.length < step) break;
        from += step;
      }

      const districts = Array.from(distSet).sort((a, b) => a.localeCompare(b, 'th'));
      return NextResponse.json({ success: true, data: districts });
    }

    // 3. ดึงรายชื่อตำบล/แขวง ภายใต้อำเภอ (เฉพาะศูนย์ที่ถูกต้อง)
    if (province && district && !subdistrict) {
      const { data, error } = await supabase
        .from('mediator_officers')
        .select('subdistrict, center_code')
        .eq('province', province)
        .eq('district', district)
        .not('subdistrict', 'is', null)
        .like('center_code', 'ศกช.%')
        .range(0, 1000);

      if (error) throw error;

      const subdistSet = new Set<string>();
      data.forEach((row) => {
        if (isValidCenterCode(row.center_code || '')) {
          const s = row.subdistrict?.trim();
          if (s && s !== 'ไม่ระบุตำบล' && s !== '') {
            subdistSet.add(s);
          }
        }
      });

      const subdistricts = Array.from(subdistSet).sort((a, b) => a.localeCompare(b, 'th'));
      return NextResponse.json({ success: true, data: subdistricts });
    }

    // 4. ดึงรายชื่อศูนย์ไกล่เกลี่ยฯ (กรองเฉพาะรูปแบบ ศกช.xx xxxxxx เท่านั้น)
    if (province && district && subdistrict) {
      const { data, error } = await supabase
        .from('mediator_officers')
        .select('center_code, center_name')
        .eq('province', province)
        .eq('district', district)
        .eq('subdistrict', subdistrict)
        .not('center_name', 'is', null)
        .like('center_code', 'ศกช.%')
        .range(0, 1000);

      if (error) throw error;

      const centerMap = new Map();
      data.forEach((c) => {
        const arabicCode = convertThaiToArabicNumerals(c.center_code || '').trim().replace(/\s+/g, ' ');
        const arabicName = convertThaiToArabicNumerals(c.center_name || '').trim();

        // แสดงเฉพาะศูนย์ที่รหัสตรงตามรูปแบบ ศกช.xx xxxxxx
        if (isValidCenterCode(arabicCode)) {
          if (!centerMap.has(arabicCode)) {
            centerMap.set(arabicCode, {
              center_code: arabicCode,
              center_name: arabicName,
            });
          }
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
