import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'ระบบกู้คืนรหัสผ่านยังไม่ได้ตั้งค่าสิทธิ์แอดมินหลังบ้าน (Missing Service Role Key)' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body = await request.json();
    const { username, chairmanNationalId, newPassword } = body;

    if (!username || !chairmanNationalId || !newPassword) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    const cleanNationalId = chairmanNationalId.trim().replace(/-/g, ''); // ลบขีดออกเพื่อความยืดหยุ่นในการกรอก

    // 1. ค้นหาโปรไฟล์ผู้ใช้ตามชื่อผู้ใช้ หรืออีเมล
    let query = supabaseAdmin
      .from('profiles')
      .select('id, email, chairman_national_id')
      .eq('status', 'เปิด');

    if (cleanUsername.includes('@')) {
      query = query.eq('email', cleanUsername);
    } else {
      query = query.or(`unit_code.eq.${cleanUsername},email.ilike.${cleanUsername}@%`);
    }

    const { data: profile, error: profileErr } = await query.maybeSingle();

    if (profileErr) {
      console.error('Database query error during password reset:', profileErr);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดภายในระบบในการดึงโปรไฟล์' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'ไม่พบชื่อผู้ใช้งานนี้ในระบบ หรือบัญชีถูกปิดการใช้งาน' },
        { status: 400 }
      );
    }

    // 2. ตรวจสอบเลขบัตรประชาชนประธานคณะทำงาน
    const dbNationalId = profile.chairman_national_id ? profile.chairman_national_id.trim().replace(/-/g, '') : null;

    if (!dbNationalId) {
      return NextResponse.json(
        { error: 'บัญชีศูนย์นี้ยังไม่ได้ผูกเลขบัตรประชาชนประธานคณะทำงานในระบบ กรุณาติดต่อแอดมินเพื่อตั้งค่าเริ่มต้น' },
        { status: 400 }
      );
    }

    if (dbNationalId !== cleanNationalId) {
      return NextResponse.json(
        { error: 'เลขบัตรประชาชนประธานคณะทำงานไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // 3. ทำการอัปเดตรหัสผ่านใหม่ให้กับผู้ใช้งานโดยตรงผ่าน Admin SDK
    const { error: resetErr } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    );

    if (resetErr) {
      console.error('Auth update error during password reset:', resetErr);
      return NextResponse.json(
        { error: 'ไม่สามารถเปลี่ยนรหัสผ่านในระบบ Auth ได้: ' + resetErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'รีเซ็ตรหัสผ่านเสร็จสิ้น สามารถใช้รหัสผ่านใหม่ในการล็อกอินเข้าสู่ระบบได้ทันที',
    });

  } catch (err: any) {
    console.error('Password reset handler crash:', err);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ' + err.message },
      { status: 500 }
    );
  }
}
