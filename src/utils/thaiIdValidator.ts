/**
 * แปลงตัวเลขไทย (๐-๙) เป็นตัวเลขอารบิก (0-9)
 */
export function convertThaiToArabicNumerals(text: string): string {
  if (!text) return text;
  const thaiNumerals = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return text.replace(/[๐-๙]/g, (char) => {
    const idx = thaiNumerals.indexOf(char);
    return idx !== -1 ? idx.toString() : char;
  });
}

/**
 * ตรวจสอบรูปแบบรหัสศูนย์ไกล่เกลี่ยข้อพิพาทภาคประชาชน
 * ต้องเป็นรูปแบบ ศกช.xx xxxxxx เท่านั้น (เช่น ศกช.กท 010101, ศกช.กบ 010101)
 */
export function isValidCenterCode(code: string): boolean {
  if (!code) return false;
  const normalized = convertThaiToArabicNumerals(code).trim().replace(/\s+/g, ' ');
  return /^ศกช\.[ก-๙]{2}\s\d{6}$/.test(normalized);
}

/**
 * ตรวจสอบความถูกต้องของเลขประจำตัวประชาชนไทย 13 หลัก ตามสูตร Check Digit (Modulo 11)
 */
export function validateThaiNationalID(id: string): boolean {
  if (!id) return false;
  
  // แปลงเลขไทยเป็นเลขอารบิกก่อนตรวจ
  const arabicId = convertThaiToArabicNumerals(id);
  const cleaned = arabicId.replace(/\D/g, '');
  
  if (cleaned.length !== 13) return false;
  
  // ห้ามเป็นเลขซ้ำกันทั้งหมด 13 ตัว เช่น 1111111111111
  if (/^(\d)\1{12}$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (13 - i);
  }
  
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(cleaned.charAt(12), 10);
}

/**
 * จัดรูปแบบเลขบัตรประชาชนเป็น X-XXXX-XXXXX-XX-X
 */
export function formatThaiNationalID(id: string): string {
  const arabicId = convertThaiToArabicNumerals(id);
  const cleaned = arabicId.replace(/\D/g, '').slice(0, 13);
  if (cleaned.length <= 1) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 1)}-${cleaned.slice(1)}`;
  if (cleaned.length <= 10) return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5)}`;
  if (cleaned.length <= 12) return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10)}`;
  return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10, 12)}-${cleaned.slice(12, 13)}`;
}

/**
 * จัดรูปแบบเบอร์โทรศัพท์เป็น XXX-XXX-XXXX
 */
export function formatThaiPhone(phone: string): string {
  const arabicPhone = convertThaiToArabicNumerals(phone);
  const cleaned = arabicPhone.replace(/\D/g, '').slice(0, 10);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}

/**
 * ตรวจสอบและดึงเบอร์โทรศัพท์มือถือที่ถูกต้อง (10 หลัก ขึ้นต้นด้วย 06, 08, 09)
 * หากไม่ถูกต้องหรือไม่ครบ จะคืนค่าเป็นค่าว่าง เพื่อบังคับให้กรอกใหม่
 */
export function getCleanedValidMobile(phone: string): string {
  if (!phone) return '';
  const arabic = convertThaiToArabicNumerals(phone);
  let digits = arabic.replace(/\D/g, '');
  
  // กรณี 9 หลัก ขาด 0 ตัวหน้า (เช่น 891234567)
  if (digits.length === 9 && ['6', '8', '9'].includes(digits[0])) {
    digits = '0' + digits;
  }
  
  // ต้องเป็น 10 หลัก และขึ้นต้นด้วย 06, 08 หรือ 09 เท่านั้น
  if (/^0[689]\d{8}$/.test(digits)) {
    return digits;
  }
  
  return '';
}
