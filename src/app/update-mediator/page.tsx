'use client';

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { validateThaiNationalID, formatThaiNationalID, formatThaiPhone } from '@/utils/thaiIdValidator';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  UserCheck, 
  Building2, 
  MapPin, 
  Calendar, 
  Phone, 
  CreditCard,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';

interface CenterOption {
  center_code: string;
  center_name: string;
}

interface OfficerRecord {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  position: string;
  center_code: string;
  center_name: string;
  province: string;
  district: string;
  subdistrict: string;
  phone_original: string;
  phone_updated?: string;
  status: 'pending' | 'completed';
  birth_date_be?: string;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function UpdateMediatorPage() {
  // PDPA State
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [showFullPrivacy, setShowFullPrivacy] = useState(false);

  // Cascading Location States
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [subdistricts, setSubdistricts] = useState<string[]>([]);
  const [centers, setCenters] = useState<CenterOption[]>([]);

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState('');
  const [selectedCenterCode, setSelectedCenterCode] = useState('');

  // Loading States
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubdistricts, setLoadingSubdistricts] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [searchResults, setSearchResults] = useState<OfficerRecord[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerRecord | null>(null);

  // Form Input States
  const [idCardInput, setIdCardInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYearBe, setBirthYearBe] = useState('');

  // Submission Completed
  const [isDone, setIsDone] = useState(false);

  // 1. โหลดรายชื่อจังหวัดทั้งหมดเมื่อเปิดหน้า
  useEffect(() => {
    async function loadProvinces() {
      setLoadingProvinces(true);
      try {
        const res = await fetch('/api/mediator-portal/locations');
        const json = await res.json();
        if (json.success) {
          setProvinces(json.data);
        }
      } catch (err) {
        console.error('Failed to load provinces:', err);
      } finally {
        setLoadingProvinces(false);
      }
    }
    loadProvinces();
  }, []);

  // 2. เมื่อเลือกจังหวัด -> โหลดอำเภอ
  const handleProvinceChange = async (prov: string) => {
    setSelectedProvince(prov);
    setSelectedDistrict('');
    setSelectedSubdistrict('');
    setSelectedCenterCode('');
    setDistricts([]);
    setSubdistricts([]);
    setCenters([]);
    resetSearchState();

    if (!prov) return;

    setLoadingDistricts(true);
    try {
      const res = await fetch(`/api/mediator-portal/locations?province=${encodeURIComponent(prov)}`);
      const json = await res.json();
      if (json.success) {
        setDistricts(json.data);
      }
    } catch (err) {
      console.error('Failed to load districts:', err);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // 3. เมื่อเลือกอำเภอ -> โหลดตำบล
  const handleDistrictChange = async (dist: string) => {
    setSelectedDistrict(dist);
    setSelectedSubdistrict('');
    setSelectedCenterCode('');
    setSubdistricts([]);
    setCenters([]);
    resetSearchState();

    if (!dist) return;

    setLoadingSubdistricts(true);
    try {
      const res = await fetch(`/api/mediator-portal/locations?province=${encodeURIComponent(selectedProvince)}&district=${encodeURIComponent(dist)}`);
      const json = await res.json();
      if (json.success) {
        setSubdistricts(json.data);
      }
    } catch (err) {
      console.error('Failed to load subdistricts:', err);
    } finally {
      setLoadingSubdistricts(false);
    }
  };

  // 4. เมื่อเลือกตำบล -> โหลดศูนย์ไกล่เกลี่ยฯ
  const handleSubdistrictChange = async (sub: string) => {
    setSelectedSubdistrict(sub);
    setSelectedCenterCode('');
    setCenters([]);
    resetSearchState();

    if (!sub) return;

    setLoadingCenters(true);
    try {
      const res = await fetch(`/api/mediator-portal/locations?province=${encodeURIComponent(selectedProvince)}&district=${encodeURIComponent(selectedDistrict)}&subdistrict=${encodeURIComponent(sub)}`);
      const json = await res.json();
      if (json.success) {
        setCenters(json.data);
      }
    } catch (err) {
      console.error('Failed to load centers:', err);
    } finally {
      setLoadingCenters(false);
    }
  };

  const resetSearchState = () => {
    setSearchAttempted(false);
    setSearchResults([]);
    setSelectedOfficer(null);
    setIdCardInput('');
    setPhoneInput('');
    setBirthDay('');
    setBirthMonth('');
    setBirthYearBe('');
    setIsDone(false);
  };

  // 5. ค้นหาชื่อในศูนย์ที่เลือก
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentAccepted) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณายอมรับเงื่อนไข',
        text: 'กรุณาอ่านและกดยอมรับประกาศการคุ้มครองข้อมูลส่วนบุคคล (PDPA) ด้านบนก่อนทำการค้นหา',
        confirmButtonColor: '#4f46e5',
      });
      return;
    }

    if (!selectedCenterCode) {
      Swal.fire({
        icon: 'info',
        title: 'กรุณาเลือกศูนย์ไกล่เกลี่ยฯ',
        text: 'กรุณาเลือก จังหวัด, อำเภอ, ตำบล และศูนย์ไกล่เกลี่ยข้อพิพาทภาคประชาชนให้ครบถ้วนก่อนค้นหา',
        confirmButtonColor: '#4f46e5',
      });
      return;
    }

    if (!searchKeyword.trim()) {
      Swal.fire({
        icon: 'info',
        title: 'กรุณาระบุชื่อค้นหา',
        text: 'กรุณาพิมพ์ชื่อหรือนามสกุลอย่างน้อยบางส่วนเพื่อตรวจสอบ',
        confirmButtonColor: '#4f46e5',
      });
      return;
    }

    setIsSearching(true);
    setSearchAttempted(true);
    setSelectedOfficer(null);
    setIsDone(false);

    try {
      const res = await fetch(`/api/mediator-portal/search?center_code=${encodeURIComponent(selectedCenterCode)}&keyword=${encodeURIComponent(searchKeyword.trim())}`);
      const json = await res.json();

      if (json.success) {
        setSearchResults(json.data);
        if (json.data.length === 1) {
          // ถ้าเจอคนเดียว เลือกให้อัตโนมัติ
          selectOfficerToUpdate(json.data[0]);
        }
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search failed:', err);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถค้นหาข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: '#4f46e5',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const selectOfficerToUpdate = (officer: OfficerRecord) => {
    setSelectedOfficer(officer);
    // เติมเบอร์โทรศัพท์เดิมให้เป็นค่าเริ่มต้น ถ้ามี
    if (officer.phone_updated) {
      setPhoneInput(formatThaiPhone(officer.phone_updated));
    } else if (officer.phone_original) {
      setPhoneInput(formatThaiPhone(officer.phone_original));
    } else {
      setPhoneInput('');
    }
    setIdCardInput('');
    setBirthDay('');
    setBirthMonth('');
    setBirthYearBe('');
  };

  // ตรวจสอบความถูกต้องของเลขบัตรประชาชนปัจจุบัน
  const isIdCardValid = validateThaiNationalID(idCardInput.replace(/\D/g, ''));
  const isIdCardFilled = idCardInput.replace(/\D/g, '').length === 13;

  // 6. บันทึกข้อมูล
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOfficer) return;

    if (!isIdCardValid) {
      Swal.fire({
        icon: 'warning',
        title: 'เลขบัตรประชาชนไม่ถูกต้อง',
        text: 'กรุณาตรวจสอบเลขประจำตัวประชาชน 13 หลักให้ถูกต้องตามสูตรคำนวณของทางราชการ',
        confirmButtonColor: '#4f46e5',
      });
      return;
    }

    const cleanedPhone = phoneInput.replace(/\D/g, '');
    if (cleanedPhone.length !== 10 || !['06', '08', '09'].some(p => cleanedPhone.startsWith(p))) {
      Swal.fire({
        icon: 'warning',
        title: 'เบอร์โทรศัพท์ไม่ถูกต้อง',
        text: 'กรุณาระบุหมายเลขโทรศัพท์มือถือ 10 หลัก (ขึ้นต้นด้วย 06, 08 หรือ 09)',
        confirmButtonColor: '#4f46e5',
      });
      return;
    }

    if (!birthDay || !birthMonth || !birthYearBe) {
      Swal.fire({
        icon: 'warning',
        title: 'วันเดือนปีเกิดไม่ครบถ้วน',
        text: 'กรุณาเลือก วัน, เดือน และ ปี พ.ศ. เกิดให้ครบถ้วน',
        confirmButtonColor: '#4f46e5',
      });
      return;
    }

    const birthDateBeStr = `${birthDay} ${birthMonth} ${birthYearBe}`;

    const confirmRes = await Swal.fire({
      title: 'ยืนยันข้อมูลความถูกต้อง',
      html: `
        <div class="text-left text-sm space-y-2 p-3 bg-slate-50 rounded-lg">
          <div><b>ชื่อ-สกุล:</b> ${selectedOfficer.title || ''}${selectedOfficer.first_name} ${selectedOfficer.last_name}</div>
          <div><b>เลขบัตรประชาชน:</b> ${formatThaiNationalID(idCardInput)}</div>
          <div><b>เบอร์โทรศัพท์:</b> ${formatThaiPhone(phoneInput)}</div>
          <div><b>วันเดือนปีเกิด:</b> ${birthDateBeStr}</div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันและบันทึกข้อมูล',
      cancelButtonText: 'แก้ไขข้อมูล',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#94a3b8',
    });

    if (!confirmRes.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/mediator-portal/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedOfficer.id,
          id_card_number: idCardInput,
          phone: cleanedPhone,
          birth_date_be: birthDateBeStr,
          consent: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsDone(true);
        Swal.fire({
          icon: 'success',
          title: 'บันทึกข้อมูลสำเร็จ',
          text: 'ข้อมูลของท่านได้รับการปรับปรุงเข้าสู่ระบบเรียบร้อยแล้ว ขอบพระคุณครับ',
          confirmButtonColor: '#4f46e5',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'ไม่สามารถบันทึกได้',
          text: json.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
          confirmButtonColor: '#4f46e5',
        });
      }
    } catch (err) {
      console.error('Submit error:', err);
      Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาดระบบ',
        text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: '#4f46e5',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // สร้างตัวเลือกปี พ.ศ. เกิด (ตั้งแต่ พ.ศ. 2470 ถึง 2550)
  const currentYearBe = new Date().getFullYear() + 543;
  const beYears = [];
  for (let y = currentYearBe - 18; y >= 2470; y--) {
    beYears.push(y);
  }

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-semibold tracking-wider text-indigo-100 mb-3">
            โครงการพัฒนาระบบฐานข้อมูลทะเบียนประวัติ
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            แบบปรับปรุงข้อมูลคณะทำงานประจำศูนย์ไกล่เกลี่ยข้อพิพาทภาคประชาชน
          </h2>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            เพื่อรองรับการพัฒนาระบบใหม่ของกรมคุ้มครองสิทธิและเสรีภาพ ขอความร่วมมือท่านตรวจสอบและบันทึกเลขประจำตัวประชาชน 13 หลัก และข้อมูลการติดต่อให้ครบถ้วนสมบูรณ์
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* ส่วนที่ 0: ประกาศนโยบายการคุ้มครองข้อมูลส่วนบุคคล (PDPA) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base sm:text-lg">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3>ประกาศการคุ้มครองข้อมูลส่วนบุคคล (PDPA)</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowFullPrivacy(!showFullPrivacy)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1"
          >
            <span>{showFullPrivacy ? 'ย่อรายละเอียด' : 'อ่านรายละเอียดทั้งหมด'}</span>
            {showFullPrivacy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          กรมคุ้มครองสิทธิและเสรีภาพ ให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของท่าน ข้อมูลที่จัดเก็บ (เลขบัตรประชาชน 13 หลัก, วันเดือนปีเกิด, เบอร์โทรศัพท์) จะใช้เพื่อประโยชน์ในการตรวจสอบและปรับปรุงฐานข้อมูลคณะทำงานบริหารประจำศูนย์ไกล่เกลี่ยข้อพิพาทภาคประชาชน ตาม พ.ร.บ. การไกล่เกลี่ยข้อพิพาท พ.ศ. 2562 และจะไม่นำไปเปิดเผยต่อบุคคลภายนอกโดยไม่ได้รับอนุญาต
        </p>

        {showFullPrivacy && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-3 leading-relaxed animate-in fade-in duration-200">
            <div>
              <p className="font-semibold text-slate-800">1. วัตถุประสงค์การเก็บรวบรวมข้อมูล</p>
              <p>เพื่อใช้ในการปรับปรุงและพัฒนาระบบฐานข้อมูลทะเบียนประวัติของคณะทำงานบริหารประจำศูนย์ไกล่เกลี่ยข้อพิพาทภาคประชาชน ให้มีความครบถ้วนถูกต้อง เพื่อรองรับการเชื่อมโยงระบบบริหารจัดการฐานข้อมูลใหม่ การประสานงานภารกิจ และการส่งเสริมสนับสนุนสิทธิประโยชน์ตามที่กฎหมายกำหนด</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">2. ข้อมูลที่มีการเก็บรวบรวมเพิ่มเติม</p>
              <p>ชื่อ-นามสกุล, เลขประจำตัวประชาชน 13 หลัก, วันเดือนปีเกิด, หมายเลขโทรศัพท์มือถือ, ตำแหน่งในศูนย์ไกล่เกลี่ยฯ</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">3. สิทธิของเจ้าของข้อมูล</p>
              <p>ท่านมีสิทธิตามกฎหมายในการขอเข้าถึง ขอรับสำเนา ขอแก้ไข หรือระงับการใช้ข้อมูลได้ โดยติดต่อ กรมคุ้มครองสิทธิและเสรีภาพ กระทรวงยุติธรรม</p>
            </div>
          </div>
        )}

        {/* Checkbox ให้กดยอมรับ */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className="flex items-start space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-indigo-600 border-slate-300 rounded-sm focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-slate-700 leading-snug font-medium select-none group-hover:text-indigo-900 transition-colors">
              ข้าพเจ้าได้อ่านและเข้าใจรายละเอียดตามประกาศการคุ้มครองข้อมูลส่วนบุคคลข้างต้น และขอยืนยันว่าข้อมูลที่ระบุในการปรับปรุงข้อมูลนี้เป็นข้อมูลของข้าพเจ้าจริง พร้อมทั้งยินยอมให้กรมคุ้มครองสิทธิและเสรีภาพ ประมวลผลข้อมูลดังกล่าวเพื่อวัตถุประสงค์ข้างต้น
            </span>
          </label>
        </div>
      </div>

      {/* ถ้ากดยอมรับแล้ว ปลดล็อกขั้นตอนค้นหาและกรอกข้อมูล */}
      <div className={`space-y-6 transition-all duration-300 ${!consentAccepted ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        {/* ส่วนที่ 1: เลือกศูนย์ไกล่เกลี่ยฯ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base sm:text-lg">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3>ขั้นตอนที่ 1: เลือกศูนย์ไกล่เกลี่ยข้อพิพาทภาคประชาชนที่ท่านสังกัด</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* จังหวัด */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                จังหวัด <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedProvince}
                onChange={(e) => handleProvinceChange(e.target.value)}
                disabled={loadingProvinces}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50"
              >
                <option value="">-- เลือกจังหวัด --</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* อำเภอ */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                อำเภอ / เขต <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={!selectedProvince || loadingDistricts}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50"
              >
                <option value="">-- เลือกอำเภอ/เขต --</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* ตำบล */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ตำบล / แขวง <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedSubdistrict}
                onChange={(e) => handleSubdistrictChange(e.target.value)}
                disabled={!selectedDistrict || loadingSubdistricts}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50"
              >
                <option value="">-- เลือกตำบล/แขวง --</option>
                {subdistricts.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ศูนย์ไกล่เกลี่ย */}
          <div className="pt-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ศูนย์ไกล่เกลี่ยข้อพิพาทภาคประชาชน <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedCenterCode}
              onChange={(e) => {
                setSelectedCenterCode(e.target.value);
                resetSearchState();
              }}
              disabled={!selectedSubdistrict || loadingCenters}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50"
            >
              <option value="">-- เลือกศูนย์ไกล่เกลี่ยข้อพิพาทฯ --</option>
              {centers.map((c) => (
                <option key={c.center_code || c.center_name} value={c.center_code || c.center_name}>
                  {c.center_code ? `[${c.center_code}] ` : ''}{c.center_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ส่วนที่ 2: ค้นหารายชื่อตนเอง */}
        {selectedCenterCode && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-base sm:text-lg">
              <Search className="w-5 h-5 text-indigo-600" />
              <h3>ขั้นตอนที่ 2: พิมพ์ค้นหารายชื่อของท่านในศูนย์นี้</h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              พิมพ์ชื่อ หรือ นามสกุลของท่าน (สามารถพิมพ์เพียงบางส่วนได้) แล้วกดปุ่ม <b>&quot;ตรวจสอบข้อมูล&quot;</b>
            </p>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="ตัวอย่าง: สมชาย หรือ นามสกุล"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-10 py-3 text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => { setSearchKeyword(''); resetSearchState(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl text-sm transition-all shadow-md shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSearching ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>กำลังตรวจสอบ...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>ตรวจสอบข้อมูล</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ส่วนที่ 3: ผลการตรวจสอบ */}
        {searchAttempted && !isSearching && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* กรณีที่ 1: ไม่พบข้อมูลในกลุ่มที่ไม่สมบูรณ์ (ข้อมูลครบแล้ว) */}
            {searchResults.length === 0 && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-emerald-900">
                  ข้อมูลของท่านในระบบมีความครบถ้วนสมบูรณ์แล้ว
                </h4>
                <p className="text-sm text-emerald-800 max-w-lg mx-auto leading-relaxed">
                  ไม่พบรายชื่อของท่านในกลุ่มข้อมูลที่ต้องปรับปรุงเพิ่มเติม เนื่องจากในฐานข้อมูลของกรมคุ้มครองสิทธิและเสรีภาพ มีข้อมูลของท่านครบถ้วนแล้ว จึงไม่จำเป็นต้องดำเนินการใดเพิ่มเติม ขอบพระคุณครับ
                </p>
              </div>
            )}

            {/* กรณีที่ 2: พบรายชื่อมากกว่า 1 คน ให้เลือกตัวเอง */}
            {searchResults.length > 1 && !selectedOfficer && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  <span>พบรายชื่อที่ตรงกับคำค้นหา ({searchResults.length} ท่าน) - กรุณากดเลือกชื่อของท่าน:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.map((officer) => (
                    <div
                      key={officer.id}
                      onClick={() => selectOfficerToUpdate(officer)}
                      className="border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {officer.title || ''}{officer.first_name} {officer.last_name}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">ตำแหน่ง: {officer.position}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{officer.center_name}</div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${officer.status === 'completed' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                          {officer.status === 'completed' ? '✓ บันทึกข้อมูลแล้ว' : 'รอการปรับปรุงข้อมูล'}
                        </span>
                        <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                          เลือกข้อมูลนี้ →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* กรณีที่ 3: เลือกบุคคลแล้ว และสถานะเคยบันทึกไปแล้ว (Completed) */}
            {selectedOfficer && selectedOfficer.status === 'completed' && !isDone && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-blue-900">
                  {selectedOfficer.title || ''}{selectedOfficer.first_name} {selectedOfficer.last_name} ได้ทำการปรับปรุงข้อมูลเรียบร้อยแล้ว
                </h4>
                <p className="text-sm text-blue-800 max-w-md mx-auto">
                  ตำแหน่ง: <b>{selectedOfficer.position}</b><br />
                  ข้อมูลของท่านได้รับการบันทึกเข้าสู่ระบบเรียบร้อยแล้ว ไม่จำเป็นต้องกรอกซ้ำ
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedOfficer(null)}
                  className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                >
                  ค้นหารายชื่ออื่น
                </button>
              </div>
            )}

            {/* กรณีที่ 4: บันทึกข้อมูลเรียบร้อยใหม่ๆ (Is Done) */}
            {isDone && (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-8 text-center space-y-4 shadow-md animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-emerald-900">
                  บันทึกข้อมูลเรียบร้อยแล้ว ขอบพระคุณครับ
                </h3>
                <p className="text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
                  ข้อมูลเลขประจำตัวประชาชน วันเดือนปีเกิด และเบอร์โทรศัพท์ของ <b>{selectedOfficer?.title || ''}{selectedOfficer?.first_name} {selectedOfficer?.last_name}</b> ได้รับการปรับปรุงเข้าสู่ระบบเรียบร้อยแล้ว
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetSearchState();
                      setSearchKeyword('');
                    }}
                    className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all shadow-xs"
                  >
                    <span>กลับไปหน้าค้นหา</span>
                  </button>
                </div>
              </div>
            )}

            {/* กรณีที่ 5: บุคคลที่ยังไม่ได้กรอก (Pending) -> แสดงฟอร์มกรอกข้อมูล */}
            {selectedOfficer && selectedOfficer.status === 'pending' && !isDone && (
              <div className="bg-white rounded-2xl border-2 border-indigo-200 p-5 sm:p-7 shadow-md space-y-6">
                {/* Header การ์ดยืนยันตัวตน */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                      ข้อมูลคณะทำงานประจำศูนย์ไกล่เกลี่ยฯ
                    </span>
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900">
                      {selectedOfficer.title || ''}{selectedOfficer.first_name} {selectedOfficer.last_name}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      ตำแหน่ง: <span className="font-semibold text-slate-700">{selectedOfficer.position}</span> | สังกัด: {selectedOfficer.center_name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOfficer(null)}
                    className="self-start sm:self-center text-xs text-slate-400 hover:text-slate-600 underline"
                  >
                    เปลี่ยนชื่อ
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* ฟิลด์ 1: เลขบัตรประชาชน 13 หลัก */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center space-x-1.5">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        <span>เลขประจำตัวประชาชน 13 หลัก</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      {isIdCardFilled && (
                        <span className={`text-xs font-medium flex items-center space-x-1 ${isIdCardValid ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {isIdCardValid ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>เลขถูกต้องตามสูตรคำนวณ</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>รูปแบบไม่ถูกต้อง (ตรวจสอบเลขอีกครั้ง)</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={17}
                      placeholder="X-XXXX-XXXXX-XX-X"
                      value={idCardInput}
                      onChange={(e) => setIdCardInput(formatThaiNationalID(e.target.value))}
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-base sm:text-lg font-mono tracking-wider text-slate-900 focus:bg-white focus:outline-hidden transition-colors ${
                        isIdCardFilled 
                          ? isIdCardValid 
                            ? 'border-emerald-500 ring-2 ring-emerald-100' 
                            : 'border-rose-400 ring-2 ring-rose-100'
                          : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
                      }`}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      * ข้อมูลนี้ใช้เพื่อผูกประวัติในระบบงานราชการของกรมคุ้มครองสิทธิและเสรีภาพเท่านั้น
                    </p>
                  </div>

                  {/* ฟิลด์ 2: หมายเลขโทรศัพท์มือถือ */}
                  <div>
                    <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center space-x-1.5 mb-1.5">
                      <Phone className="w-4 h-4 text-indigo-600" />
                      <span>หมายเลขโทรศัพท์มือถือ (10 หลัก)</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={12}
                      placeholder="0XX-XXX-XXXX"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(formatThaiPhone(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base sm:text-lg font-mono tracking-wider text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  {/* ฟิลด์ 3: วันเดือนปีเกิด (รูปแบบ พ.ศ.) */}
                  <div>
                    <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center space-x-1.5 mb-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span>วันเดือนปีเกิด (รูปแบบปี พ.ศ.)</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {/* วัน */}
                      <select
                        value={birthDay}
                        onChange={(e) => setBirthDay(e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">วัน</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>

                      {/* เดือน */}
                      <select
                        value={birthMonth}
                        onChange={(e) => setBirthMonth(e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">เดือน</option>
                        {THAI_MONTHS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>

                      {/* ปี พ.ศ. */}
                      <select
                        value={birthYearBe}
                        onChange={(e) => setBirthYearBe(e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">ปี พ.ศ.</option>
                        {beYears.map((y) => (
                          <option key={y} value={y}>พ.ศ. {y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ปุ่มบันทึก */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting || !isIdCardValid}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl text-base transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          <span>กำลังบันทึกข้อมูล...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>ยืนยันและบันทึกข้อมูล</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
