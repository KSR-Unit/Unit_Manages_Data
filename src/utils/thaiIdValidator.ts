/**
 * ตรวจสอบความถูกต้องของเลขประจำตัวประชาชนไทย 13 หลัก ตามสูตร Check Digit (Modulo 11)
 */
export function validateThaiNationalID(id: string): boolean {
  if (!id) return false;
  
  // ล้างอักขระที่ไม่ใช่ตัวเลข
  const cleaned = id.replace(/\D/g, '');
  
  if (cleaned.length !== 13) return false;
  
  // ตัวเลขหลักแรกของคนไทยมักเป็น 1-8 (แต่ระบบราชการอาจมี 0 สำหรับกลุ่มบุคคลเฉพาะ)
  // แต่ห้ามเป็นเลขซ้ำกันทั้งหมด 13 ตัว เช่น 1111111111111
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
  const cleaned = id.replace(/\D/g, '').slice(0, 13);
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
  const cleaned = phone.replace(/\D/g, '').slice(0, 10);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}
