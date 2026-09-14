-- ============================================================
-- Table: mediator_officers
-- Description: ข้อมูลคณะทำงานประจำศูนย์ไกล่เกลี่ยข้อพิพาทภาคประชาชน
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mediator_officers (
    id VARCHAR(50) PRIMARY KEY,               -- รหัสอ้างอิงเดิม
    title VARCHAR(50),                        -- คำนำหน้า (นาย, นาง, นางสาว, ฯลฯ)
    first_name VARCHAR(100),                  -- ชื่อ
    last_name VARCHAR(100),                   -- นามสกุล
    position VARCHAR(150),                    -- ตำแหน่งในศูนย์ (ประธาน, เลขานุการ, คณะทำงาน, ฯลฯ)
    center_code VARCHAR(50),                  -- รหัสศูนย์ (เช่น ศกช.กท 010101)
    center_name TEXT,                         -- ชื่อศูนย์เต็ม
    province VARCHAR(100),                    -- จังหวัดศูนย์
    district VARCHAR(100),                    -- อำเภอ/เขต
    subdistrict VARCHAR(100),                 -- ตำบล/แขวง
    phone_original VARCHAR(100),              -- โทรศัพท์เดิมที่มีในระบบ
    phone_updated VARCHAR(20),                -- โทรศัพท์ที่อัปเดตใหม่
    id_card_number VARCHAR(13),               -- เลขประจำตัวประชาชน 13 หลัก
    birth_date_be VARCHAR(20),                -- วันเดือนปีเกิด (พ.ศ.) เช่น 12/08/2505
    status VARCHAR(20) DEFAULT 'pending',     -- 'pending' (รออัปเดต) | 'completed' (อัปเดตแล้ว)
    consent_accepted BOOLEAN DEFAULT FALSE,   -- ยืนยันความยินยอม PDPA
    consent_at TIMESTAMPTZ,                   -- เวลาที่กดยอมรับ
    client_ip TEXT,                           -- IP address ผู้ใช้งาน
    user_agent TEXT,                          -- ข้อมูลเบราว์เซอร์
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- สร้าง Index เพื่อความรวดเร็วในการค้นหาแบบ Cascading Dropdown และค้นหาชื่อ
CREATE INDEX IF NOT EXISTS idx_mediator_officers_center_code ON public.mediator_officers(center_code);
CREATE INDEX IF NOT EXISTS idx_mediator_officers_province ON public.mediator_officers(province);
CREATE INDEX IF NOT EXISTS idx_mediator_officers_district ON public.mediator_officers(district);
CREATE INDEX IF NOT EXISTS idx_mediator_officers_subdistrict ON public.mediator_officers(subdistrict);
CREATE INDEX IF NOT EXISTS idx_mediator_officers_status ON public.mediator_officers(status);
CREATE INDEX IF NOT EXISTS idx_mediator_officers_names ON public.mediator_officers(first_name, last_name);

-- เปิดใช้งาน Row Level Security (RLS)
ALTER TABLE public.mediator_officers ENABLE ROW LEVEL SECURITY;

-- นโยบาย RLS: อนุญาตให้อ่านข้อมูล
CREATE POLICY "Allow public select of mediator officers" ON public.mediator_officers
FOR SELECT USING (true);

-- นโยบาย RLS: อนุญาตให้อัปเดตข้อมูล
CREATE POLICY "Allow public update of mediator officers" ON public.mediator_officers
FOR UPDATE USING (true) WITH CHECK (true);

-- นโยบาย RLS: อนุญาตให้ Insert ข้อมูล (สำหรับ Seed สคริปต์)
CREATE POLICY "Allow public insert of mediator officers" ON public.mediator_officers
FOR INSERT WITH CHECK (true);
