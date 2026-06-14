/**
 * @file import_users.js
 * @description สคริปต์สำหรับนำเข้าข้อมูลผู้ใช้งานจากไฟล์ CSV เข้าสู่ Supabase Auth และตาราง profiles
 * วิธีใช้งาน:
 * 1. ดึงคีย์ SUPABASE_SERVICE_ROLE_KEY จากหน้า Supabase Dashboard (Settings -> API)
 * 2. รันคำสั่ง:
 *    SUPABASE_SERVICE_ROLE_KEY=คีย์ของคุณ node scratch/import_users.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// โหลด Environment Variables หรือใช้ค่าที่ส่งผ่าน CLI
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uvogfersksxhqznqsqhu.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ ข้อผิดพลาด: ไม่พบ SUPABASE_SERVICE_ROLE_KEY กรุณากำหนดค่าก่อนรันสคริปต์');
  console.error('ตัวอย่างการรัน: SUPABASE_SERVICE_ROLE_KEY=คีย์ของคุณ node scratch/import_users.js');
  process.exit(1);
}

// สร้าง Supabase Client ด้วยสิทธิ์พิเศษ Service Role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const csvPath = path.join(__dirname, 'users.csv');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runImport() {
  console.log('🚀 เริ่มต้นกระบวนการนำเข้าข้อมูลบัญชีผู้ใช้งาน...');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ ข้อผิดพลาด: ไม่พบไฟล์ข้อมูลที่ ${csvPath}`);
    return;
  }

  const fileContent = fs.readFileSync(csvPath, 'utf8');
  const lines = fileContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length <= 1) {
    console.error('❌ ข้อผิดพลาด: ไฟล์ CSV ไม่มีข้อมูลผู้ใช้งาน');
    return;
  }

  // แยก Header
  const headers = lines[0].split(',').map(h => h.trim());
  console.log(`📋 คอลัมน์ที่ตรวจพบ: ${headers.join(', ')}`);
  console.log(`📊 จำนวนข้อมูลทั้งหมดในไฟล์: ${lines.length - 1} บัญชี`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // วนลูปนำเข้าข้อมูลทีละบรรทัด (ข้ามหัวข้อบรรทัดแรก)
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim());
    if (row.length < headers.length) continue;

    const [userId, email, pass, status, unitCode, province, district, subdistrict] = row;

    if (!email || !userId) {
      console.warn(`⚠️ บรรทัดที่ ${i + 1}: ข้อมูลไม่ครบถ้วน (ข้ามการทำงาน)`);
      continue;
    }

    try {
      // 1. ตรวจสอบก่อนว่าเคยมีบัญชีนี้ในตาราง profiles หรือยัง (เพื่อรองรับการรันซ้ำแบบ Resumable)
      const { data: existingProfile, error: checkErr } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('unit_code', userId)
        .maybeSingle();

      if (checkErr) {
        throw new Error(`เกิดข้อผิดพลาดในการตรวจสอบข้อมูล: ${checkErr.message}`);
      }

      if (existingProfile) {
        console.log(`⏭️ [ข้าม] ${userId} (${email}) มีบัญชีในระบบอยู่แล้ว`);
        skipCount++;
        continue;
      }

      // 2. กำหนดสิทธิ์การใช้งาน (Role)
      let role = 'user';
      if (userId.toLowerCase() === 'admin') {
        role = 'admin';
      } else if (userId.startsWith('S-')) {
        role = 'subadmin';
      }

      // 3. สร้างบัญชีใน Supabase Auth
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: email,
        password: pass,
        email_confirm: true, // กดยืนยันอีเมลอัตโนมัติ
        user_metadata: { name: unitCode }
      });

      if (authErr) {
        // กรณีอีเมลเคยสมัครไว้ใน Auth แต่ยังไม่มีใน profiles (อาจเกิดจากระบบผิดพลาดครั้งก่อน)
        if (authErr.message.includes('already exists') || authErr.code === 'email_exists') {
          console.warn(`⚠️ [เตือน] อีเมล ${email} เคยสร้างไว้ในระบบ Auth แล้ว จะกู้คืนมาเขียนลงตาราง profiles`);
          
          // ค้นหา ID ของ Auth User เดิมจากอีเมล
          const { data: userList, error: listErr } = await supabase.auth.admin.listUsers();
          if (listErr) throw listErr;
          
          const foundUser = userList.users.find(u => u.email === email);
          if (foundUser) {
            // เขียนทับข้อมูลลงตาราง profiles
            const { error: profInsertErr } = await supabase.from('profiles').upsert([{
              id: foundUser.id,
              email: email,
              role: role,
              status: status === 'เปิด' ? 'เปิด' : 'ปิด',
              name: unitCode || null,
              province: province || null,
              district: district || null,
              subdistrict: subdistrict || null,
              unit_code: userId
            }]);
            
            if (profInsertErr) throw profInsertErr;
            console.log(`✅ [เชื่อมต่อสำเร็จ] กู้คืนโปรไฟล์เดิมให้ ${userId} (${email}) เรียบร้อย`);
            successCount++;
            continue;
          }
        }
        
        throw new Error(`ไม่สามารถสร้าง Auth User ได้: ${authErr.message}`);
      }

      // 4. เขียนโปรไฟล์ผู้ใช้ลงตาราง public.profiles
      const { error: profileErr } = await supabase.from('profiles').insert([{
        id: authUser.user.id,
        email: email,
        role: role,
        status: status === 'เปิด' ? 'เปิด' : 'ปิด',
        name: unitCode || null,
        province: province || null,
        district: district || null,
        subdistrict: subdistrict || null,
        unit_code: userId
      }]);

      if (profileErr) {
        // หากเขียนตารางโปรไฟล์ไม่สำเร็จ ให้ลบผู้ใช้ใน Auth ออกด้วยเพื่อป้องกันขยะ
        await supabase.auth.admin.deleteUser(authUser.user.id);
        throw new Error(`ไม่สามารถสร้างโปรไฟล์ได้: ${profileErr.message}`);
      }

      console.log(`✅ [นำเข้าสำเร็จ] (${i}/${lines.length - 1}) ${userId} (${email}) - บทบาท: ${role}`);
      successCount++;

      // เว้นระยะเวลาเล็กน้อย (50ms) ป้องกันปัญหา Rate Limiting จากฝั่งเซิร์ฟเวอร์
      await delay(50);

    } catch (err) {
      console.error(`❌ [ล้มเหลว] บัญชี ${userId} (${email}):`, err.message);
      errorCount++;
    }
  }

  console.log('\n======================================');
  console.log('🏁 สรุปผลการนำเข้าบัญชีผู้ใช้งาน:');
  console.log(`🎉 สำเร็จทั้งหมด: ${successCount} บัญชี`);
  console.log(`⏭️ ข้ามบัญชีเดิม: ${skipCount} บัญชี`);
  console.log(`❌ ล้มเหลว/มีข้อผิดพลาด: ${errorCount} บัญชี`);
  console.log('======================================');
}

runImport();
