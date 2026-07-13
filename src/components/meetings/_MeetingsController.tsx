'use client';

// ============================================================
// MeetingsController — รวม state + logic + handlers ทั้งหมด
// ของหน้า Meetings ไว้ที่เดียว
// meetings/page.tsx เหลือแค่ import ไฟล์นี้มา render
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Plus, Edit, Trash2, ArrowLeft, FileText,
  CheckCircle, Loader2, Save, X, RefreshCw, Sparkles, Download,
  QrCode, Mic, MicOff, Users
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAIParsing } from '@/hooks/useAIParsing';
import { generateDocx } from '@/utils/docxGenerator';
import { VoiceAssistantCard, useFieldVoice } from '@/components/shared/VoiceAssistantCard';
import { MeetingAttendee } from '@/types';

// ---- Field schema สำหรับ /api/ai/parse-report ----
const MEETINGS_FIELDS_SCHEMA = [
  { name: 'meeting_name', label: 'ชื่อการประชุม', type: 'text' as const },
  { name: 'meeting_date', label: 'วันที่ประชุม', type: 'date' as const },
  { name: 'location', label: 'สถานที่ประชุม', type: 'text' as const },
  { name: 'recorder_name', label: 'ชื่อผู้จดรายงาน', type: 'text' as const },
  { name: 'reporter_phone', label: 'เบอร์ติดต่อผู้จดรายงาน', type: 'text' as const },
  { name: 'reporter_name', label: 'ผู้มีอำนาจลงนาม', type: 'text' as const },
  { name: 'reporter_position', label: 'ตำแหน่งผู้มีอำนาจลงนาม', type: 'select' as const, options: [
    { value: 'ประธานคณะทำงาน', label: 'ประธานคณะทำงาน' },
    { value: 'รองประธานคณะทำงาน', label: 'รองประธานคณะทำงาน' }
  ]},
  { name: 'source_info', label: 'ชื่อผู้ประสานงานจัดงาน', type: 'text' as const },
  { name: 'source_contact', label: 'เบอร์โทรติดต่อผู้ประสานงาน', type: 'text' as const },
  { name: 'invitation_text', label: 'เนื้อหาหนังสือส่งเชิญเข้าร่วมประชุม', type: 'textarea' as const }
];

// ---- Default form state ----
const DEFAULT_FORM = {
  meeting_name: '',
  meeting_date: new Date().toISOString().split('T')[0],
  location: '',
  summary: '',
  reporter_name: '',
  reporter_phone: '',
  reporter_position: 'ประธานคณะทำงาน',
  recorder_name: '',
  source_info: '',
  source_contact: '',
  agenda_1: 'เรื่องแจ้งที่ประชุมทราบ:',
  agenda_2: 'การรับรองรายงานการประชุมครั้งก่อน: ไม่มี/รับรองรายงานการประชุมครั้งที่...',
  agenda_3: 'เรื่องเสนอเพื่อทราบ:',
  agenda_4: 'เรื่องเสนอเพื่อพิจารณา:',
  agenda_5: 'เรื่องอื่นๆ (ถ้ามี):',
  invitation_text: 'ด้วย ศูนย์ไกล่เกลี่ยข้อพิพาทภาคประชาชน มีความประสงค์จะจัดการประชุมคณะทำงานและผู้ไกล่เกลี่ย เพื่อร่วมปรึกษาหารือการดำเนินงานและพิจารณาข้อร้องเรียนคดีความประจำงวดงาน'
};

export function useMeetingsController() {
  const { user, profile } = useAuth();

  // ---- Nav & UI ----
  const [view, setView] = useState<'list' | 'form'>('list');
  const [activeTab, setActiveTab] = useState<'details' | 'agendas' | 'qr' | 'print'>('details');
  const [meetings, setMeetings] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<MeetingAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(DEFAULT_FORM);

  // ---- AI Voice (field level) ----
  const { activeVoiceField, toggleFieldVoice } = useFieldVoice(setFormData);

  // ---- AI Parsing (global dictation) ----
  const {
    aiStoryText, setAiStoryText, aiParsing,
    highlightFields, handleAIParsing, consumeSessionAutofill
  } = useAIParsing(setFormData, { fieldsSchema: MEETINGS_FIELDS_SCHEMA }, profile ?? undefined);

  // ---- Data fetching ----
  useEffect(() => {
    if (user && profile) fetchMeetings();
  }, [user, profile, view]);

  useEffect(() => {
    if (editingId && activeTab === 'qr') fetchAttendees();
  }, [editingId, activeTab]);

  // ---- Consume sessionStorage autofill from Global Voice ----
  useEffect(() => {
    if (!profile) return;
    consumeSessionAutofill('meetings', setView);
  }, [profile]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const role = profile?.role || 'user';
      const myProvince = profile?.province;
      let query = supabase.from('meetings').select('*, profiles!inner(*)').eq('status', 'Active');
      if (role === 'subadmin' && myProvince) {
        query = query.eq('profiles.province', myProvince);
      } else if (role === 'user') {
        query = query.eq('user_id', user?.id);
      }
      const { data, error } = await query.order('meeting_date', { ascending: false });
      if (error) throw error;
      setMeetings(data || []);
    } catch (e: any) {
      Swal.fire('Error', 'เกิดข้อผิดพลาดในการดึงข้อมูลการประชุม: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async () => {
    if (!editingId) return;
    try {
      const { data, error } = await supabase
        .from('meeting_attendees').select('*')
        .eq('meeting_id', editingId).order('check_in_time', { ascending: true });
      if (error) throw error;
      setAttendees(data || []);
    } catch (e: any) { console.error(e); }
  };

  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormData({ ...DEFAULT_FORM, recorder_name: profile?.name || '' });
    setActiveTab('details');
    setView('form');
  };

  const handleOpenEditForm = (meeting: any) => {
    setEditingId(meeting.id);
    setFormData(meeting);
    setActiveTab('details');
    setView('form');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { ...formData, user_id: editingId ? formData.user_id : user?.id, status: 'Active' };
      delete payload.profiles;

      let savedData = null;
      if (editingId) {
        const { data, error } = await supabase.from('meetings').update(payload).eq('id', editingId).select();
        if (error) throw error;
        savedData = data?.[0];
      } else {
        const { data, error } = await supabase.from('meetings').insert([payload]).select();
        if (error) throw error;
        savedData = data?.[0];
      }

      Swal.fire({ icon: 'success', title: 'บันทึกข้อมูลสำเร็จ', timer: 1500, showConfirmButton: false });
      if (savedData && !editingId) setEditingId(savedData.id);
      setView('form');
      fetchMeetings();
    } catch (e: any) {
      Swal.fire('Error', 'ไม่สามารถบันทึกได้: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: 'ต้องการลบการประชุมนี้?',
      text: 'ข้อมูลบันทึกประชุมจะเข้าถังขยะและไม่แสดงผลในรายงานสรุปสะสม',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#f43f5e', confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก'
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const { error } = await supabase.from('meetings').update({ status: 'Deleted' }).eq('id', id);
          if (error) throw error;
          Swal.fire('สำเร็จ', 'ลบข้อมูลเรียบร้อย', 'success');
          fetchMeetings();
        } catch (e: any) {
          Swal.fire('Error', 'ไม่สามารถลบได้: ' + e.message, 'error');
        }
      }
    });
  };

  const formatDateToThai = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const thMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    return `${date.getDate()} ${thMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
  };

  const handleDownloadDocx = async () => {
    try {
      const filename = 'รายงานการประชุมคณะทำงาน.docx';
      Swal.fire({ title: 'กำลังสร้างไฟล์...', text: 'ระบบกำลังดึงข้อมูลและกรอกลงในไฟล์ Word เทมเพลต', background: '#0f172a', color: '#f8fafc', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

      const docxData = {
        meeting_title: formData.meeting_title || 'การประชุมคณะทำงาน',
        meeting_no: editingId ? editingId.substring(0, 4) : '1',
        meeting_date: formData.meeting_date ? formatDateToThai(formData.meeting_date) : '',
        meeting_time: formData.meeting_time || '09:00 น.',
        meeting_location: formData.location || 'สำนักงานศูนย์ไกล่เกลี่ยข้อพิพาทประจำตำบล',
        chairman: formData.chairman || 'ประธานศูนย์ไกล่เกลี่ยข้อพิพาท',
        reporter: formData.recorder_name || 'ผู้จดบันทึกรายงานการประชุม',
        reporter_phone: formData.reporter_phone || '',
        resolution: formData.summary || '',
        current_date: formatDateToThai(new Date().toISOString().split('T')[0]),
      };

      await generateDocx(`/templates/${filename}`, docxData, filename);
      Swal.close();
      Swal.fire({ icon: 'success', title: 'ดาวน์โหลดสำเร็จ!', text: `ดาวน์โหลดไฟล์ ${filename} เรียบร้อยแล้ว`, background: '#0f172a', color: '#f8fafc', timer: 2000, showConfirmButton: false });
    } catch {
      Swal.close();
      Swal.fire({ icon: 'error', title: 'ดาวน์โหลดล้มเหลว!', text: 'ไม่พบไฟล์เทมเพลต Word ในระบบ', background: '#0f172a', color: '#f8fafc' });
    }
  };

  const getRegistrationLink = () => {
    if (typeof window === 'undefined' || !editingId) return '';
    return `${window.location.origin}/register/${editingId}`;
  };

  return {
    // state
    view, setView, activeTab, setActiveTab,
    meetings, attendees, loading, editingId, formData, setFormData,
    profile, user,
    // voice
    activeVoiceField, toggleFieldVoice,
    // AI
    aiStoryText, setAiStoryText, aiParsing, highlightFields, handleAIParsing,
    // handlers
    handleOpenAddForm, handleOpenEditForm, handleSave, handleDelete,
    handleDownloadDocx, formatDateToThai, getRegistrationLink,
  };
}
