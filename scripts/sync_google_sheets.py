import csv
import io
import json
import re
import urllib.request
import os

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://uvogfersksxhqznqsqhu.supabase.co")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2b2dmZXJza3N4aHF6bnFzcWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MjcyMDUsImV4cCI6MjA5NzAwMzIwNX0.LjweKqD__j9KuDTDUC_7ewq4jOQ-QnLFu0-PwaMV-IU")

SHEET_ID = "1bALI5idsWsHS9h6fQf0ShuogbuSqGJ5oeWoToIPQoTM"
SHEET_CSV_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv"

# ตารางแปลงเลขไทยเป็นเลขอารบิก
THAI_TO_ARABIC = str.maketrans('๐๑๒๓๔๕๖๗๘๙', '0123456789')

def to_arabic_numerals(text):
    if not text:
        return ""
    return str(text).translate(THAI_TO_ARABIC).strip()

PROVINCES_LIST = [
    'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 
    'ชลบุรี', 'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม', 
    'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 
    'ปทุมธานี', 'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา', 'พังงา', 'พัทลุง', 
    'พิจิตร', 'พิษณุโลก', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'ยะลา', 'ยโสธร', 'ระนอง', 'ระยอง', 'ราชบุรี', 
    'ร้อยเอ็ด', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ', 
    'สมุทรสงคราม', 'สมุทรสาคร', 'สระบุรี', 'สระแก้ว', 'สิงห์บุรี', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 
    'สุโขทัย', 'หนองคาย', 'หนองบัวลำภู', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี', 
    'อ่างทอง', 'เชียงราย', 'เชียงใหม่', 'เพชรบุรี', 'เพชรบูรณ์', 'เลย', 'แพร่', 'แม่ฮ่องสอน'
]

def extract_subdistrict_district(center_name, address):
    sub = ""
    dist = ""
    
    # 1. จากชื่อศูนย์
    if center_name:
        sub_m = re.search(r'(?:ตำบล|ต\.|แขวง)\s*([^\s\(\)]+)', center_name)
        if sub_m:
            sub = sub_m.group(1).strip()
        dist_m = re.search(r'(?:อำเภอ|อ\.|เขต)\s*([^\s\(\)]+)', center_name)
        if dist_m:
            dist = dist_m.group(1).strip()
            
    # 2. ถ้ายังไม่ได้ ให้ลองหาจากที่อยู่
    if not dist and address:
        dist_m = re.search(r'(?:อำเภอ|อ\.|เขต)\s*([^\s\(\)]+)', address)
        if dist_m:
            dist = dist_m.group(1).strip()
            
    if not sub and address:
        sub_m = re.search(r'(?:ตำบล|ต\.|แขวง)\s*([^\s\(\)]+)', address)
        if sub_m:
            sub = sub_m.group(1).strip()
            
    return to_arabic_numerals(sub) or "ไม่ระบุตำบล", to_arabic_numerals(dist) or "ไม่ระบุอำเภอ"

def fetch_and_sync():
    print(f"1. กำลังดึงข้อมูลจาก Google Sheets ID: {SHEET_ID} ...")
    req = urllib.request.Request(SHEET_CSV_URL, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการดาวน์โหลด Google Sheet: {e}")
        return

    # Parse CSV
    reader = csv.DictReader(io.StringIO(content))
    rows_to_insert = []
    
    for row in reader:
        ref_id = row.get("รหัสอ้างอิง", "").strip()
        if not ref_id:
            continue
            
        title = row.get("คำนำหน้า", "").strip()
        first_name = row.get("ชื่อ", "").strip()
        last_name = row.get("นามสกุล", "").strip()
        position = row.get("ตำแหน่งในศูนย์", "").strip() or "คณะทำงาน"
        
        # แปลงรหัสศูนย์และชื่อศูนย์เป็นเลขอารบิก
        center_code = to_arabic_numerals(row.get("รหัสศูนย์", "").strip())
        center_name = to_arabic_numerals(row.get("ชื่อศูนย์", "").strip())
        
        address = row.get("ที่อยู่", "").strip()
        province = row.get("จังหวัดศูนย์", "").strip()
        
        # หากจังหวัดศูนย์ว่าง ให้กู้คืนจากที่อยู่
        if not province and address:
            for p in PROVINCES_LIST:
                if p in address:
                    province = p
                    break
        if not province:
            province = "ไม่ระบุจังหวัด"
            
        phone_orig = row.get("โทรศัพท์", "").strip()
        if not phone_orig:
            phone_orig = row.get("โทรศัพท์ศูนย์ (ช่องทางสำรอง)", "").strip()
            
        subdistrict, district = extract_subdistrict_district(center_name, address)
        
        # 393 คนที่มีเลขบัตรผิด และคนที่ไม่มีเลข ให้เป็น None
        id_card_number = None
        
        rows_to_insert.append({
            "id": str(ref_id),
            "title": title,
            "first_name": first_name,
            "last_name": last_name,
            "position": position,
            "center_code": center_code,
            "center_name": center_name,
            "province": province,
            "district": district,
            "subdistrict": subdistrict,
            "phone_original": to_arabic_numerals(phone_orig),
            "id_card_number": id_card_number,
            "status": "pending"
        })
        
    print(f"2. สกัดข้อมูลสำเร็จทั้งหมด: {len(rows_to_insert)} รายการ (แปลงเลขอารบิกและกู้คืนจังหวัดเรียบร้อย)")
    
    # Batch upsert to Supabase REST API in chunks of 500
    chunk_size = 500
    endpoint = f"{SUPABASE_URL}/rest/v1/mediator_officers"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    print(f"3. กำลังนำเข้าข้อมูลสู่ Supabase ({SUPABASE_URL}) ...")
    success_count = 0
    
    for i in range(0, len(rows_to_insert), chunk_size):
        chunk = rows_to_insert[i:i + chunk_size]
        data_json = json.dumps(chunk).encode('utf-8')
        post_req = urllib.request.Request(endpoint, data=data_json, headers=headers, method='POST')
        
        try:
            with urllib.request.urlopen(post_req) as resp:
                if resp.status in (200, 201):
                    success_count += len(chunk)
                    print(f"   - นำเข้าแล้ว {success_count}/{len(rows_to_insert)} รายการ...")
                else:
                    print(f"   [คำเตือน] ตอบกลับสถานะ: {resp.status}")
        except urllib.error.HTTPError as he:
            err_msg = he.read().decode('utf-8')
            print(f"   [ข้อผิดพลาด] ไม่สามารถนำเข้าชุดที่ {i} ถึง {i+len(chunk)}: {he.code} {err_msg}")
            return
        except Exception as ex:
            print(f"   [ข้อผิดพลาด] {ex}")
            
    print(f"\nเสร็จสิ้น! นำเข้าข้อมูลสำเร็จ {success_count} รายการ (เลขอารบิกครบถ้วน)")

if __name__ == "__main__":
    fetch_and_sync()
