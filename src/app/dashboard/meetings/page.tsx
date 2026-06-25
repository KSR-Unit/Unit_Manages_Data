'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Edit, Trash2, Search, ArrowLeft, Mic, MicOff, Printer, 
  QrCode, FileText, CheckCircle, AlertTriangle, Users, Loader2, Save, X, RefreshCw, Sparkles, Download
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface MeetingAttendee {
  id: string;
  attendee_name: string;
  check_in_time: string;
}

export default function MeetingsPage() {
  const { user, profile } = useAuth();
  
  // Navigation & UI States
  const [view, setView] = useState<'list' | 'form'>('list');
  const [activeTab, setActiveTab] = useState<'details' | 'agendas' | 'qr' | 'print'>('details');
  const [meetings, setMeetings] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<MeetingAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // AI Voice & Text integration states
  const [aiStoryText, setAiStoryText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [highlightFields, setHighlightFields] = useState<Record<string, boolean>>({});

  // Field Speech Recognition state
  const [activeVoiceField, setActiveVoiceField] = useState<string | null>(null);
  const activeVoiceFieldRef = useRef<string | null>(null);

  // Hook for global dictation (Large mic button)
  const {
    isListening: isGlobalListening,
    startListening: startGlobalListening,
    stopListening: stopGlobalListening
  } = useSpeechRecognition({
    onResult: (text, isFinal) => {
      if (isFinal) {
        setAiStoryText(prev => (prev ? prev + ' ' + text : text));
      }
    }
  });

  // Hook for single field dictation (Small mic buttons)
  const {
    isListening: isFieldListening,
    startListening: startFieldListening,
    stopListening: stopFieldListening
  } = useSpeechRecognition({
    continuous: true,
    interimResults: false,
    onResult: (text, isFinal) => {
      const currentField = activeVoiceFieldRef.current;
      if (currentField && isFinal) {
        setFormData((prev: any) => {
          const currentVal = prev[currentField] || '';
          return {
            ...prev,
            [currentField]: currentVal + (currentVal ? ' ' : '') + text
          };
        });
      }
    },
    onEnd: () => {
      setActiveVoiceField(null);
      activeVoiceFieldRef.current = null;
    }
  });

  const toggleFieldVoice = (fieldName: string) => {
    if (activeVoiceFieldRef.current === fieldName) {
      stopFieldListening();
    } else {
      if (activeVoiceFieldRef.current) {
        stopFieldListening();
      }
      activeVoiceFieldRef.current = fieldName;
      setActiveVoiceField(fieldName);
      startFieldListening();
    }
  };

  const handleAIParsing = async () => {
    if (!aiStoryText || !aiStoryText.trim()) {
      Swal.fire('เตือน', 'กรุณากรอกหรือพูดเล่ารายละเอียดก่อนกดประมวลผล', 'warning');
      return;
    }

    setAiParsing(true);
    try {
      const res = await fetch('/api/ai/parse-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          story: aiStoryText,
          fieldsSchema: [
            { name: 'meeting_name', label: 'ชื่อการประชุม', type: 'text' },
            { name: 'meeting_date', label: 'วันที่ประชุม', type: 'date' },
            { name: 'location', label: 'สถานที่ประชุม', type: 'text' },
            { name: 'recorder_name', label: 'ชื่อผู้จดรายงาน', type: 'text' },
            { name: 'reporter_phone', label: 'เบอร์ติดต่อผู้จดรายงาน', type: 'text' },
            { name: 'reporter_name', label: 'ผู้มีอำนาจลงนาม', type: 'text' },
            { name: 'reporter_position', label: 'ตำแหน่งผู้มีอำนาจลงนาม', type: 'select', options: [
              { value: 'ประธานคณะทำงาน', label: 'ประธานคณะทำงาน' },
              { value: 'รองประธานคณะทำงาน', label: 'รองประธานคณะทำงาน' }
            ]},
            { name: 'source_info', label: 'ชื่อผู้ประสานงานจัดงาน', type: 'text' },
            { name: 'source_contact', label: 'เบอร์โทรติดต่อผู้ประสานงาน', type: 'text' },
            { name: 'invitation_text', label: 'เนื้อหาหนังสือส่งเชิญเข้าร่วมประชุม', type: 'textarea' }
          ]
        })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการประมวลผลของ AI');
      }

      const parsedData = result.data;
      if (parsedData) {
        const newFormData = { ...formData };
        const fieldsFilled: Record<string, boolean> = {};

        Object.keys(parsedData).forEach(key => {
          if (parsedData[key] !== undefined && parsedData[key] !== '') {
            newFormData[key] = parsedData[key];
            fieldsFilled[key] = true;
          }
        });

        setFormData(newFormData);
        setHighlightFields(fieldsFilled);
        setAiStoryText('');

        Swal.fire({
          icon: 'success',
          title: 'ถอดข้อมูลลงฟอร์มสำเร็จ',
          text: 'กรุณาตรวจสอบความถูกต้องและแก้ไขจุดที่ไฮไลท์หากจำเป็น',
          timer: 2000,
          showConfirmButton: false
        });

        setTimeout(() => {
          setHighlightFields({});
        }, 6000);
      }

    } catch (err: any) {
      console.error(err);
      Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
    } finally {
      setAiParsing(false);
    }
  };

  // Form states
  const [formData, setFormData] = useState<any>({
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
    agenda_1: '',
    agenda_2: '',
    agenda_3: '',
    agenda_4: '',
    agenda_5: '',
    invitation_text: ''
  });

  useEffect(() => {
    if (user && profile) {
      fetchMeetings();
    }
  }, [user, profile, view]);

  useEffect(() => {
    if (editingId && activeTab === 'qr') {
      fetchAttendees();
    }
  }, [editingId, activeTab]);

  // Check for global mic pending data
  useEffect(() => {
    const pendingData = sessionStorage.getItem('ai_pending_autofill');
    if (pendingData) {
      try {
        const { category, data } = JSON.parse(pendingData);
        if (category === 'meetings') {
          setView('form');
          setEditingId(null);
          setFormData((prev: any) => ({
            ...prev,
            ...data,
            reporter_name: data.reporter_name || profile?.name || '',
            reporter_phone: data.reporter_phone || profile?.phone || '',
          }));

          const highlights: Record<string, boolean> = {};
          Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
              highlights[key] = true;
            }
          });
          setHighlightFields(highlights);
          setTimeout(() => {
            setHighlightFields({});
          }, 6000);

          Swal.fire({
            icon: 'success',
            title: 'ดึงข้อมูล AI จากหน้าหลักสำเร็จ',
            text: 'ระบบได้กรอกข้อมูลการประชุมที่ AI ดึงข้อมูลได้เรียบร้อยแล้ว กรุณาตรวจสอบข้อมูลที่ไฮไลต์และมติการประชุมก่อนบันทึก',
            confirmButtonColor: '#4f46e5',
            background: '#0f172a',
            color: '#f8fafc'
          });
        }
      } catch (err) {
        console.error('Error parsing pending global mic data in meetings:', err);
      } finally {
        sessionStorage.removeItem('ai_pending_autofill');
      }
    }
  }, [profile]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const role = profile?.role || 'user';
      const myProvince = profile?.province;
      
      let query = supabase
        .from('meetings')
        .select('*, profiles!inner(*)')
        .eq('status', 'Active');

      if (role === 'subadmin' && myProvince) {
        query = query.eq('profiles.province', myProvince);
      } else if (role === 'user') {
        query = query.eq('user_id', user?.id);
      }

      const { data, error } = await query.order('meeting_date', { ascending: false });
      if (error) throw error;
      setMeetings(data || []);
    } catch (e: any) {
      console.error(e);
      Swal.fire('Error', 'เกิดข้อผิดพลาดในการดึงข้อมูลการประชุม: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async () => {
    if (!editingId) return;
    try {
      const { data, error } = await supabase
        .from('meeting_attendees')
        .select('*')
        .eq('meeting_id', editingId)
        .order('check_in_time', { ascending: true });

      if (error) throw error;
      setAttendees(data || []);
    } catch (e: any) {
      console.error(e);
    }
  };



  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormData({
      meeting_name: '',
      meeting_date: new Date().toISOString().split('T')[0],
      location: '',
      summary: '',
      reporter_name: '',
      reporter_phone: '',
      reporter_position: 'ประธานคณะทำงาน',
      recorder_name: profile?.name || '',
      source_info: '',
      source_contact: '',
      agenda_1: 'เรื่องแจ้งที่ประชุมทราบ:',
      agenda_2: 'การรับรองรายงานการประชุมครั้งก่อน: ไม่มี/รับรองรายงานการประชุมครั้งที่...',
      agenda_3: 'เรื่องเสนอเพื่อทราบ:',
      agenda_4: 'เรื่องเสนอเพื่อพิจารณา:',
      agenda_5: 'เรื่องอื่นๆ (ถ้ามี):',
      invitation_text: `ด้วย ศูนย์ไกล่เกลี่ยข้อพิพาทภาคประชาชน มีความประสงค์จะจัดการประชุมคณะทำงานและผู้ไกล่เกลี่ย เพื่อร่วมปรึกษาหารือการดำเนินงานและพิจารณาข้อร้องเรียนคดีความประจำงวดงาน`
    });
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
      const payload = {
        ...formData,
        user_id: editingId ? formData.user_id : user?.id,
        status: 'Active'
      };

      // Clean profiles from payload
      delete payload.profiles;

      let savedData = null;

      if (editingId) {
        const { data, error } = await supabase
          .from('meetings')
          .update(payload)
          .eq('id', editingId)
          .select();
        if (error) throw error;
        savedData = data?.[0];
      } else {
        const { data, error } = await supabase
          .from('meetings')
          .insert([payload])
          .select();
        if (error) throw error;
        savedData = data?.[0];
      }

      Swal.fire({
        icon: 'success',
        title: 'บันทึกข้อมูลสำเร็จ',
        timer: 1500,
        showConfirmButton: false
      });

      if (savedData && !editingId) {
        setEditingId(savedData.id);
      }
      
      // Stay on form to allow adding agendas or QR code
      setView('form');
      fetchMeetings();

    } catch (e: any) {
      console.error(e);
      Swal.fire('Error', 'ไม่สามารถบันทึกคลาสประชุมได้: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: 'ต้องการลบการประชุมนี้?',
      text: 'ข้อมูลบันทึกประชุมจะเข้าถังขยะและไม่แสดงผลในรายงานสรุปสะสม',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const { error } = await supabase
            .from('meetings')
            .update({ status: 'Deleted' })
            .eq('id', id);
          if (error) throw error;
          Swal.fire('สำเร็จ', 'ลบข้อมูลเรียบร้อย', 'success');
          fetchMeetings();
        } catch (e: any) {
          Swal.fire('Error', 'ไม่สามารถลบได้: ' + e.message, 'error');
        }
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const getInvitationHtml = () => {
    return `
      <div class="meta">
        เลขที่หนังสือ: ศก.ปช./${editingId ? editingId.substring(0, 5) : 'XXXX'}
      </div>
      <div class="title">
        หนังสือเชิญประชุมคณะทำงานผู้ไกล่เกลี่ยข้อพิพาท<br/>
        เรื่อง: ขอเชิญเข้าร่วมการประชุม
      </div>
      <div class="content">
        <p><strong>เรียน:</strong> คณะทำงานและผู้ประสานงานศูนย์ไกล่เกลี่ยประจำพื้นที่</p>
        <p class="indent">${formData.invitation_text || '...'}</p>
        <p class="indent">
          ทั้งนี้ กำหนดจัดประชุมในวันที่ <strong>${formData.meeting_date ? new Date(formData.meeting_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '...'}</strong> ณ สถานที่ <strong>${formData.location || '...'}</strong>
        </p>
        <p class="indent">จึงเรียนมาเพื่อทราบและขอเรียนเชิญเข้าร่วมการประชุมโดยพร้อมเพรียงกัน</p>
      </div>
      <div class="signatures">
        <p>ขอแสดงความนับถือ</p>
        <p style="margin-top: 40px;">(ลงชื่อ)....................................................</p>
        <p><strong>(${formData.reporter_name || 'ผู้มีอำนาจลงนาม'})</strong></p>
        <p style="font-size: 12px; color: #666;">ตำแหน่ง: ${formData.reporter_position || 'ประธานคณะทำงาน'}</p>
      </div>
    `;
  };

  const getAgendaHtml = () => {
    return `
      <div class="meta">
        วันที่จัดประชุม: ${formData.meeting_date ? new Date(formData.meeting_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '...'}
      </div>
      <div class="title">
        รายงานการประชุมคณะทำงานผู้ไกล่เกลี่ยข้อพิพาท<br/>
        ประจำปีงบประมาณ ${formData.meeting_date ? new Date(formData.meeting_date).getFullYear() + 543 : 'XXXX'}
      </div>
      <div class="content">
        <p><strong>สถานที่ประชุม:</strong> ${formData.location || '...'}</p>
        <p><strong>บันทึกโดย:</strong> ${formData.reporter_name || 'ผู้บันทึกรายงาน'}</p>
        
        <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px;">ระเบียบวาระการประชุม</h3>
        
        <div class="agenda-item">
          <div class="agenda-title">วาระที่ 1: เรื่องแจ้งให้ที่ประชุมทราบ</div>
          <div class="agenda-body" style="white-space: pre-wrap;">${formData.agenda_1 || 'ไม่มีข้อมูลบันทึกในวาระนี้'}</div>
        </div>
        
        <div class="agenda-item" style="margin-top: 20px;">
          <div class="agenda-title">วาระที่ 2: รับรองรายงานการประชุมครั้งก่อน</div>
          <div class="agenda-body" style="white-space: pre-wrap;">${formData.agenda_2 || 'ไม่มีข้อมูลบันทึกในวาระนี้'}</div>
        </div>
        
        <div class="agenda-item" style="margin-top: 20px;">
          <div class="agenda-title">วาระที่ 3: เรื่องเสนอเพื่อทราบ</div>
          <div class="agenda-body" style="white-space: pre-wrap;">${formData.agenda_3 || 'ไม่มีข้อมูลบันทึกในวาระนี้'}</div>
        </div>
        
        <div class="agenda-item" style="margin-top: 20px;">
          <div class="agenda-title">วาระที่ 4: เรื่องเสนอเพื่อพิจารณา</div>
          <div class="agenda-body" style="white-space: pre-wrap;">${formData.agenda_4 || 'ไม่มีข้อมูลบันทึกในวาระนี้'}</div>
        </div>
        
        <div class="agenda-item" style="margin-top: 20px;">
          <div class="agenda-title">วาระที่ 5: เรื่องอื่นๆ</div>
          <div class="agenda-body" style="white-space: pre-wrap;">${formData.agenda_5 || 'ไม่มีข้อมูลบันทึกในวาระนี้'}</div>
        </div>
      </div>
      
      <div class="signatures">
        <p>ลงนามรับรองรายงานการประชุม</p>
        <p style="margin-top: 40px;">(ลงชื่อ)....................................................</p>
        <p><strong>(${formData.reporter_name || 'ผู้บันทึก'})</strong></p>
        <p style="font-size: 12px; color: #666;">ตำแหน่ง: ${formData.reporter_position || 'ประธานคณะทำงาน'}</p>
      </div>
    `;
  };

  const handlePrintPdf = (type: 'invitation' | 'agenda') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = type === 'invitation' ? getInvitationHtml() : getAgendaHtml();

    printWindow.document.write(`
      <html>
        <head>
          <title>\${type === 'invitation' ? 'หนังสือเชิญประชุม' : 'รายงานการประชุม'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;800&display=swap');
            body {
              font-family: 'Sarabun', sans-serif;
              padding: 40px;
              color: #333;
              line-height: 1.6;
              font-size: 14px;
            }
            .header {
              text-align: center;
              font-weight: bold;
              font-size: 18px;
              margin-bottom: 20px;
            }
            .meta {
              text-align: right;
              color: #666;
              margin-bottom: 30px;
            }
            .title {
              text-align: center;
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 30px;
            }
            .content {
              margin-bottom: 40px;
              text-align: justify;
            }
            .indent {
              text-indent: 40px;
            }
            .signatures {
              margin-top: 60px;
              text-align: right;
              width: 300px;
              margin-left: auto;
            }
            .agenda-item {
              margin-bottom: 20px;
            }
            .agenda-title {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .agenda-body {
              margin-left: 20px;
              text-indent: 0;
            }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          \${content}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // QR link construction
  const getRegistrationLink = () => {
    if (typeof window === 'undefined' || !editingId) return '';
    return `${window.location.origin}/register/${editingId}`;
  };

  const qrImageUrl = editingId 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(getRegistrationLink())}`
    : '';

  return (
    <div className="space-y-6">
      {/* Hide elements on browser printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 2cm !important;
          }
          aside, header, nav, button, select, .no-print {
            display: none !important;
          }
        }
      `}</style>

      {view === 'list' ? (
        <div className="space-y-6 no-print">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="h-6 w-6 text-indigo-400" />
                <span>ตัวช่วยบันทึกการประชุมอัจฉริยะ</span>
              </h1>
              <p className="text-xs text-slate-400 font-light mt-1">จัดการหนังสือเชิญประชุม บันทึกรายงานการประชุม และระบบลงทะเบียน QR Code</p>
            </div>

            <button
              onClick={handleOpenAddForm}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>เริ่มจัดประชุมใหม่</span>
            </button>
          </div>

          {/* Table List of meetings */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-500 mb-3" />
                <span className="text-xs">กำลังสแกนหาประวัติการประชุม...</span>
              </div>
            ) : meetings.length > 0 ? (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium">
                      {profile?.role !== 'user' && <th className="p-4">จังหวัด</th>}
                      <th className="p-4">หัวข้อการประชุม</th>
                      <th className="p-4">วันที่ประชุม</th>
                      <th className="p-4">สถานที่</th>
                      <th className="p-4">ผู้บันทึก</th>
                      <th className="p-4 text-right">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {meetings.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/20 transition-colors">
                        {profile?.role !== 'user' && (
                          <td className="p-4 text-indigo-400 font-semibold">{m.profiles?.province}</td>
                        )}
                        <td className="p-4 font-semibold text-white">{m.meeting_name}</td>
                        <td className="p-4">{new Date(m.meeting_date).toLocaleDateString('th-TH')}</td>
                        <td className="p-4">{m.location}</td>
                        <td className="p-4">{m.reporter_name}</td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditForm(m)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="เปิดเครื่องมือแก้ไข"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="ลบ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-slate-500 text-xs">
                <FileText className="h-10 w-10 mb-2 text-slate-600" />
                <span>ไม่มีบันทึกประชุมเปิดใช้งานในระบบ</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Form view with Tabs */
        <div className="space-y-6 no-print">
          {/* Form Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>กลับรายการประชุม</span>
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-lg"
            >
              <Save className="h-4 w-4" />
              <span>บันทึกการประชุม</span>
            </button>
          </div>

          {/* Steps Tab header */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 min-w-[100px] text-center py-2.5 rounded-lg cursor-pointer transition-all ${activeTab === 'details' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              1. รายละเอียด & หนังสือเชิญ
            </button>
            <button
              onClick={() => setActiveTab('agendas')}
              className={`flex-1 min-w-[100px] text-center py-2.5 rounded-lg cursor-pointer transition-all ${activeTab === 'agendas' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              2. บันทึก 5 วาระ (Speech-to-Text)
            </button>
            <button
              disabled={!editingId}
              onClick={() => setActiveTab('qr')}
              className={`flex-1 min-w-[100px] text-center py-2.5 rounded-lg cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${activeTab === 'qr' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              3. สแกน QR ลงชื่อเข้างาน
            </button>
            <button
              disabled={!editingId}
              onClick={() => setActiveTab('print')}
              className={`flex-1 min-w-[100px] text-center py-2.5 rounded-lg cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${activeTab === 'print' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              4. รายงานการประชุมทางการ
            </button>
          </div>

          {/* Tab Content 1: Details & invitation letter */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Input fields */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-4 text-xs text-slate-300">
                <h3 className="text-sm font-semibold text-white">รายละเอียดจัดประชุมคณะทำงาน</h3>

                {/* AI Auto-fill helper box */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-lg shadow-indigo-950/5">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="space-y-3">
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2 relative overflow-hidden">
                      {isGlobalListening ? (
                        <button
                          type="button"
                          onClick={stopGlobalListening}
                          className="w-12 h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center cursor-pointer transition-all shadow-lg shadow-rose-500/30 relative"
                          title="หยุดบันทึกเสียง"
                        >
                          <span className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
                          <Mic className="h-5.5 w-5.5 animate-pulse" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startGlobalListening}
                          className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center cursor-pointer transition-all shadow-lg shadow-indigo-600/30 hover:scale-105"
                          title="เริ่มพูดบรรยายรายละเอียด"
                        >
                          <Mic className="h-5.5 w-5.5" />
                        </button>
                      )}
                      
                      <span className="text-[9px] font-semibold text-slate-400">
                        {isGlobalListening ? "🔴 กำลังฟังเสียงพูดของคุณ..." : "🎤 กดเพื่อพูดเล่าเรื่อง (อ่านสคริป) ทั้งหมด"}
                      </span>

                      <textarea
                        rows={5}
                        placeholder="ข้อความที่ถอดความได้ จะปรากฏตรงนี้ และคุณสามารถพิมพ์แก้ไขเพิ่มเติมได้..."
                        value={aiStoryText}
                        onChange={(e) => setAiStoryText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all resize-y min-h-[120px] mt-1"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={aiParsing || !aiStoryText.trim()}
                      onClick={handleAIParsing}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/10 transition-all text-[11px]"
                    >
                      {aiParsing ? (
                        <>
                          <Loader2 className="animate-spin h-3.5 w-3.5" />
                          <span>AI กำลังแยกวิเคราะห์ข้อมูล...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
                          <span>สั่ง AI กรอกข้อมูลลงฟอร์ม</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-slate-400 font-medium">หัวข้อ/ชื่อการประชุม <span className="text-rose-500">*</span></label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        required
                        placeholder="เช่น ประชุมทบทวนแผนคดีและพิจารณาประเมิน"
                        value={formData.meeting_name}
                        onChange={(e) => setFormData((p: any) => ({ ...p, meeting_name: e.target.value }))}
                        className={`w-full bg-slate-950 border rounded-xl py-2 px-3 pr-9 text-white focus:outline-none focus:border-indigo-500 transition-all ${
                          highlightFields.meeting_name
                            ? 'border-indigo-500/80 bg-indigo-500/5 ring-1 ring-indigo-500/30 animate-pulse'
                            : activeVoiceField === 'meeting_name'
                              ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30'
                              : 'border-slate-800'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleFieldVoice('meeting_name')}
                        className={`absolute right-2.5 p-1 rounded-md transition-all cursor-pointer ${
                          activeVoiceField === 'meeting_name'
                            ? 'text-rose-400 bg-rose-500/10 animate-pulse'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {activeVoiceField === 'meeting_name' ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">วันที่จัดประชุม <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={formData.meeting_date}
                      onChange={(e) => setFormData((p: any) => ({ ...p, meeting_date: e.target.value }))}
                      className={`w-full bg-slate-950 border rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500 transition-all ${
                        highlightFields.meeting_date
                          ? 'border-indigo-500/80 bg-indigo-500/5 ring-1 ring-indigo-500/30 animate-pulse'
                          : 'border-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">สถานที่จัด <span className="text-rose-500">*</span></label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        required
                        placeholder="เช่น ห้องประชุมใหญ่ศูนย์ หรือ Zoom"
                        value={formData.location}
                        onChange={(e) => setFormData((p: any) => ({ ...p, location: e.target.value }))}
                        className={`w-full bg-slate-950 border rounded-xl py-2 px-3 pr-9 text-white focus:outline-none focus:border-indigo-500 transition-all ${
                          highlightFields.location
                            ? 'border-indigo-500/80 bg-indigo-500/5 ring-1 ring-indigo-500/30 animate-pulse'
                            : activeVoiceField === 'location'
                              ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30'
                              : 'border-slate-800'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleFieldVoice('location')}
                        className={`absolute right-2.5 p-1 rounded-md transition-all cursor-pointer ${
                          activeVoiceField === 'location'
                            ? 'text-rose-400 bg-rose-500/10 animate-pulse'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {activeVoiceField === 'location' ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">ผู้จดรายงาน/ผู้บันทึก <span className="text-rose-500">*</span></label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        required
                        value={formData.recorder_name || ''}
                        onChange={(e) => setFormData((p: any) => ({ ...p, recorder_name: e.target.value }))}
                        className={`w-full bg-slate-950 border rounded-xl py-2 px-3 pr-9 text-white focus:outline-none focus:border-indigo-500 transition-all ${
                          highlightFields.recorder_name
                            ? 'border-indigo-500/80 bg-indigo-500/5 ring-1 ring-indigo-500/30 animate-pulse'
                            : activeVoiceField === 'recorder_name'
                              ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30'
                              : 'border-slate-800'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleFieldVoice('recorder_name')}
                        className={`absolute right-2.5 p-1 rounded-md transition-all cursor-pointer ${
                          activeVoiceField === 'recorder_name'
                            ? 'text-rose-400 bg-rose-500/10 animate-pulse'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {activeVoiceField === 'recorder_name' ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">เบอร์โทรศัพท์ผู้จดรายงาน</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={formData.reporter_phone || ''}
                        onChange={(e) => setFormData((p: any) => ({ ...p, reporter_phone: e.target.value }))}
                        className={`w-full bg-slate-950 border rounded-xl py-2 px-3 pr-9 text-white focus:outline-none focus:border-indigo-500 transition-all ${
                          highlightFields.reporter_phone
                            ? 'border-indigo-500/80 bg-indigo-500/5 ring-1 ring-indigo-500/30 animate-pulse'
                            : activeVoiceField === 'reporter_phone'
                              ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30'
                              : 'border-slate-800'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleFieldVoice('reporter_phone')}
                        className={`absolute right-2.5 p-1 rounded-md transition-all cursor-pointer ${
                          activeVoiceField === 'reporter_phone'
                            ? 'text-rose-400 bg-rose-500/10 animate-pulse'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {activeVoiceField === 'reporter_phone' ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">ผู้มีอำนาจ <span className="text-rose-500">*</span></label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        required
                        placeholder="เช่น นายกมลเดช สมบูรณ์"
                        value={formData.reporter_name || ''}
                        onChange={(e) => setFormData((p: any) => ({ ...p, reporter_name: e.target.value }))}
                        className={`w-full bg-slate-950 border rounded-xl py-2 px-3 pr-9 text-white focus:outline-none focus:border-indigo-500 transition-all ${
                          highlightFields.reporter_name
                            ? 'border-indigo-500/80 bg-indigo-500/5 ring-1 ring-indigo-500/30 animate-pulse'
                            : activeVoiceField === 'reporter_name'
                              ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30'
                              : 'border-slate-800'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleFieldVoice('reporter_name')}
                        className={`absolute right-2.5 p-1 rounded-md transition-all cursor-pointer ${
                          activeVoiceField === 'reporter_name'
                            ? 'text-rose-400 bg-rose-500/10 animate-pulse'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {activeVoiceField === 'reporter_name' ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">ตำแหน่งผู้มีอำนาจ <span className="text-rose-500">*</span></label>
                    <select
                      value={formData.reporter_position || 'ประธานคณะทำงาน'}
                      onChange={(e) => setFormData((p: any) => ({ ...p, reporter_position: e.target.value }))}
                      className={`w-full bg-slate-950 border rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500 cursor-pointer transition-all ${
                        highlightFields.reporter_position
                          ? 'border-indigo-500/80 bg-indigo-500/5 ring-1 ring-indigo-500/30 animate-pulse'
                          : 'border-slate-800'
                      }`}
                    >
                      <option value="ประธานคณะทำงาน">ประธานคณะทำงาน</option>
                      <option value="รองประธานคณะทำงาน">รองประธานคณะทำงาน</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">ชื่อผู้ประสานงานจัดงาน</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={formData.source_info}
                        onChange={(e) => setFormData((p: any) => ({ ...p, source_info: e.target.value }))}
                        className={`w-full bg-slate-950 border rounded-xl py-2 px-3 pr-9 text-white focus:outline-none focus:border-indigo-500 transition-all ${
                          highlightFields.source_info
                            ? 'border-indigo-500/80 bg-indigo-500/5 ring-1 ring-indigo-500/30 animate-pulse'
                            : activeVoiceField === 'source_info'
                              ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30'
                              : 'border-slate-800'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleFieldVoice('source_info')}
                        className={`absolute right-2.5 p-1 rounded-md transition-all cursor-pointer ${
                          activeVoiceField === 'source_info'
                            ? 'text-rose-400 bg-rose-500/10 animate-pulse'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {activeVoiceField === 'source_info' ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">เบอร์โทรติดต่อผู้ประสานงาน</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={formData.source_contact}
                        onChange={(e) => setFormData((p: any) => ({ ...p, source_contact: e.target.value }))}
                        className={`w-full bg-slate-950 border rounded-xl py-2 px-3 pr-9 text-white focus:outline-none focus:border-indigo-500 transition-all ${
                          highlightFields.source_contact
                            ? 'border-indigo-500/80 bg-indigo-500/5 ring-1 ring-indigo-500/30 animate-pulse'
                            : activeVoiceField === 'source_contact'
                              ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30'
                              : 'border-slate-800'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleFieldVoice('source_contact')}
                        className={`absolute right-2.5 p-1 rounded-md transition-all cursor-pointer ${
                          activeVoiceField === 'source_contact'
                            ? 'text-rose-400 bg-rose-500/10 animate-pulse'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {activeVoiceField === 'source_contact' ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">เนื้อหาหนังสือส่งเชิญเข้าร่วมประชุม</label>
                  <div className="relative flex items-start">
                    <textarea
                      rows={4}
                      value={formData.invitation_text}
                      onChange={(e) => setFormData((p: any) => ({ ...p, invitation_text: e.target.value }))}
                      className={`w-full bg-slate-950 border rounded-xl py-2 px-3 pr-9 text-white focus:outline-none focus:border-indigo-500 leading-5 transition-all ${
                        highlightFields.invitation_text
                          ? 'border-indigo-500/80 bg-indigo-500/5 ring-1 ring-indigo-500/30 animate-pulse'
                          : activeVoiceField === 'invitation_text'
                            ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30'
                            : 'border-slate-800'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => toggleFieldVoice('invitation_text')}
                      className={`absolute right-2.5 top-2.5 p-1 rounded-md transition-all cursor-pointer ${
                        activeVoiceField === 'invitation_text'
                          ? 'text-rose-400 bg-rose-500/10 animate-pulse'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {activeVoiceField === 'invitation_text' ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Styled Invitation Letter Preview */}
              <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl text-slate-800 shadow-md flex flex-col justify-between h-fit">
                <div className="space-y-6 text-[10px] font-sans">
                  <div className="text-center font-bold text-xs border-b pb-3 text-slate-900">
                    หนังสือเชิญประชุม (พรีวิว)
                  </div>
                  
                  <div className="text-right text-slate-500">
                    เลขที่หนังสือ: ศก.ปช./{editingId ? editingId.substring(0, 5) : 'XXXX'}
                  </div>

                  <div className="text-center font-semibold text-slate-900 leading-5">
                    หนังสือเชิญประชุมคณะทำงานผู้ไกล่เกลี่ยข้อพิพาท<br/>
                    เรื่อง: ขอเชิญเข้าร่วมการประชุม
                  </div>

                  <div className="space-y-2 leading-relaxed text-slate-700">
                    <p><span className="font-semibold text-slate-900">เรียน:</span> คณะทำงานและผู้ประสานงานศูนย์ไกล่เกลี่ยประจำพื้นที่</p>
                    <p className="indent-8 text-justify">{formData.invitation_text || '...'}</p>
                    <p className="indent-8 text-justify">
                      ทั้งนี้ กำหนดจัดประชุมในวันที่ <span className="font-semibold text-slate-900">{formData.meeting_date ? new Date(formData.meeting_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '...'}</span> ณ สถานที่ <span className="font-semibold text-slate-900">{formData.location || '...'}</span> 
                    </p>
                    <p className="indent-8">จึงเรียนมาเพื่อทราบและขอเรียนเชิญเข้าร่วมการประชุมโดยพร้อมเพรียงกัน</p>
                  </div>

                  <div className="text-right pt-6 space-y-1">
                    <p>ขอแสดงความนับถือ</p>
                    <p className="pt-4 text-slate-500">(ลงชื่อ)....................................................</p>
                    <p className="text-slate-900 font-semibold">({formData.reporter_name || 'ผู้มีอำนาจลงนาม'})</p>
                    <p className="text-slate-500 text-[9px]">ตำแหน่ง: {formData.reporter_position || 'ประธานคณะทำงาน'}</p>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-[9px] text-slate-400">กรอกรายละเอียดครบถ้วนแล้ว ให้ขยับไปแท็บที่ 2 เพื่อบันทึกวาระการประชุม</span>
                  <button
                    type="button"
                    onClick={() => handlePrintPdf('invitation')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-[10px] transition-all cursor-pointer shadow-lg shadow-indigo-600/10 shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>ดาวน์โหลด PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 2: Minutes with Speech-to-Text */}
          {activeTab === 'agendas' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Form Fields */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-6 text-xs text-slate-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">จดบันทึกระเบียบวาระมติที่ประชุม (5 วาระมาตรฐาน)</h3>
                    <p className="text-[10px] text-slate-500 font-light mt-0.5">กดปุ่มไมโครโฟนเพื่อพูดภาษาไทยในการถอดความแทนการคีย์พิมพ์</p>
                  </div>
                </div>

                {/* 5 Agendas list */}
                <div className="space-y-5">
                  {[
                    { key: 'agenda_1', label: 'วาระที่ 1: เรื่องแจ้งให้ที่ประชุมทราบ', placeholder: 'ประธานแจ้งนโยบาย รายงานข่าวประชาสัมพันธ์หน่วยงาน...' },
                    { key: 'agenda_2', label: 'วาระที่ 2: รับรองรายงานการประชุมครั้งก่อน', placeholder: 'การรับรองสรุปเรื่องร้องเรียนหรือผลคดีในการประชุมรอบที่แล้ว...' },
                    { key: 'agenda_3', label: 'วาระที่ 3: เรื่องเสนอเพื่อทราบ', placeholder: 'รายงานจำนวนคดีไกล่เกลี่ยที่สำเร็จ งบที่ใช้สะสม...' },
                    { key: 'agenda_4', label: 'วาระที่ 4: เรื่องเสนอเพื่อพิจารณา', placeholder: 'การโหวตข้อพิพาท ประเมินความถูกต้อง หรือคัดกรองจัดระดับศูนย์...' },
                    { key: 'agenda_5', label: 'วาระที่ 5: เรื่องอื่นๆ', placeholder: 'ข้อสงสัยเพิ่มเติม การนัดประชุมครั้งถัดไป...' },
                  ].map(ag => {
                    const listening = activeVoiceField === ag.key;
                    return (
                      <div key={ag.key} className="space-y-2 border border-slate-800/60 p-4 rounded-xl bg-slate-950/20">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200">{ag.label}</label>
                          
                          <button
                            type="button"
                            onClick={() => toggleFieldVoice(ag.key)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                              listening 
                                ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse' 
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                            <span>{listening ? 'กำลังถอดเสียง (กดเพื่อหยุด)' : 'พูดเพื่อถอดความ'}</span>
                          </button>
                        </div>

                        <textarea
                          rows={3}
                          placeholder={ag.placeholder}
                          value={formData[ag.key] || ''}
                          onChange={(e) => setFormData((p: any) => ({ ...p, [ag.key]: e.target.value }))}
                          className={`w-full bg-slate-950 border rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500 leading-5 transition-all ${
                            listening
                              ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30'
                              : 'border-slate-800'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Styled Minutes/Agenda Preview */}
              <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl text-slate-800 shadow-md flex flex-col justify-between h-fit">
                <div className="space-y-6 text-[10px] font-sans">
                  <div className="text-center font-bold text-xs border-b pb-3 text-slate-900">
                    รายงานการประชุม (พรีวิว)
                  </div>
                  
                  <div className="text-right text-slate-500">
                    วันที่จัดประชุม: {formData.meeting_date ? new Date(formData.meeting_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '...'}
                  </div>

                  <div className="text-center font-semibold text-slate-900 leading-5">
                    รายงานการประชุมคณะทำงานผู้ไกล่เกลี่ยข้อพิพาท<br/>
                    ประจำปีงบประมาณ {formData.meeting_date ? new Date(formData.meeting_date).getFullYear() + 543 : 'XXXX'}
                  </div>

                  <div className="space-y-4 leading-relaxed text-slate-700">
                    <p><span className="font-semibold text-slate-900">สถานที่ประชุม:</span> {formData.location || '...'}</p>
                    <p><span className="font-semibold text-slate-900">บันทึกโดย:</span> {formData.reporter_name || 'ผู้บันทึกรายงาน'}</p>
                    
                    <div className="border-t border-slate-100 my-2 pt-2" />
                    
                    <div className="space-y-3">
                      <div>
                        <span className="font-semibold text-slate-900 block">วาระที่ 1: เรื่องแจ้งให้ที่ประชุมทราบ</span>
                        <p className="pl-3 text-justify text-slate-600 whitespace-pre-line">{formData.agenda_1 || '(ไม่มีบันทึกข้อมูล)'}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">วาระที่ 2: รับรองรายงานการประชุมครั้งก่อน</span>
                        <p className="pl-3 text-justify text-slate-600 whitespace-pre-line">{formData.agenda_2 || '(ไม่มีบันทึกข้อมูล)'}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">วาระที่ 3: เรื่องเสนอเพื่อทราบ</span>
                        <p className="pl-3 text-justify text-slate-600 whitespace-pre-line">{formData.agenda_3 || '(ไม่มีบันทึกข้อมูล)'}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">วาระที่ 4: เรื่องเสนอเพื่อพิจารณา</span>
                        <p className="pl-3 text-justify text-slate-600 whitespace-pre-line">{formData.agenda_4 || '(ไม่มีบันทึกข้อมูล)'}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">วาระที่ 5: เรื่องอื่นๆ</span>
                        <p className="pl-3 text-justify text-slate-600 whitespace-pre-line">{formData.agenda_5 || '(ไม่มีบันทึกข้อมูล)'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right pt-6 space-y-1 border-t border-slate-100 mt-4">
                    <p>ลงนามรับรองรายงานการประชุม</p>
                    <p className="pt-4 text-slate-500">(ลงชื่อ)....................................................</p>
                    <p className="text-slate-900 font-semibold">({formData.reporter_name || 'ผู้บันทึก'})</p>
                    <p className="text-slate-500 text-[9px]">ตำแหน่ง: {formData.reporter_position || 'ประธานคณะทำงาน'}</p>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-[9px] text-slate-400">กรอกวาระครบถ้วนแล้ว ให้ขยับไปแท็บที่ 3 เพื่อดึง QR Code ลงชื่อผู้เข้าร่วมประชุม</span>
                  <button
                    type="button"
                    onClick={() => handlePrintPdf('agenda')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-[10px] transition-all cursor-pointer shadow-lg shadow-indigo-600/10 shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>ดาวน์โหลด PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: QR registration and attendee list */}
          {activeTab === 'qr' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* QR display */}
              <div className="lg:col-span-1 bg-slate-900 border border-slate-800/80 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                <QrCode className="h-10 w-10 text-indigo-400" />
                <div>
                  <h3 className="text-xs font-semibold text-white">ลงทะเบียนเข้าประชุมด้วย QR Code</h3>
                  <p className="text-[10px] text-slate-500 font-light mt-1">ให้ผู้ร่วมประชุมสแกนรหัสนี้บนจอภาพ เพื่อพิมพ์ชื่อลงทะเบียนด้วยโทรศัพท์ของตนเอง</p>
                </div>

                {qrImageUrl ? (
                  <div className="p-4 bg-white rounded-2xl border border-slate-700/30">
                    <img src={qrImageUrl} alt="Meeting Registration QR Code" className="w-48 h-48" />
                  </div>
                ) : (
                  <div className="h-48 w-48 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-600 text-xs">
                    บันทึกสคริปต์ก่อนเปิดรหัส
                  </div>
                )}

                <div className="w-full text-left bg-slate-950 p-3.5 rounded-xl border border-slate-800/60 text-[10px] break-all select-all font-mono text-indigo-400 cursor-pointer">
                  {getRegistrationLink()}
                </div>
              </div>

              {/* Attendee list */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Users className="h-4.5 w-4.5 text-indigo-400" />
                    <span>ใบลงชื่อเข้าร่วมประชุม ({attendees.length} คน)</span>
                  </h3>

                  <button
                    type="button"
                    onClick={fetchAttendees}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-indigo-400 hover:text-white transition-colors cursor-pointer"
                    title="ดึงข้อมูลรายชื่อใหม่"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                <div className="overflow-y-auto max-h-[350px] space-y-2 text-xs">
                  {attendees.length > 0 ? (
                    attendees.map((at, idx) => (
                      <div key={at.id} className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/40 hover:border-slate-800 transition-all">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-500 w-6">{idx + 1}.</span>
                          <span className="font-semibold text-slate-200">{at.attendee_name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{new Date(at.check_in_time).toLocaleTimeString('th-TH')}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center text-slate-500 italic flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl">
                      <Users className="h-8 w-8 mb-2 text-slate-700" />
                      <span>ยังไม่มีผู้ร่วมประชุมมาแสกนลงทะเบียนเข้าห้องงาน</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 4: Minutes PDF Print Layout */}
          {activeTab === 'print' && (
            <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">รายงานสรุปบันทึกการประชุมอย่างเป็นทางการ</h3>
                  <p className="text-[10px] text-slate-500 font-light mt-0.5">พรีวิวโครงสร้างก่อนสั่งพิมพ์หรือบันทึกเป็นเอกสาร PDF แนบส่ง</p>
                </div>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-lg"
                >
                  <Printer className="h-4 w-4" />
                  <span>พิมพ์เอกสารบันทึกรายงาน / Save PDF</span>
                </button>
              </div>

              {/* Print Sheet container */}
              <div className="bg-white border rounded-2xl p-8 max-w-2xl mx-auto shadow-md text-slate-800 text-[10px] font-sans leading-relaxed print-area">
                <div className="text-center font-bold text-xs uppercase text-black leading-6">
                  รายงานการประชุมคณะทำงานและผู้ไกล่เกลี่ยข้อพิพาทประจำศูนย์<br/>
                  ครั้งที่ {editingId ? editingId.substring(0, 4) : 'X'}/{formData.meeting_date ? new Date(formData.meeting_date).getFullYear() + 543 : 'XXXX'}<br/>
                  ณ สถานที่ {formData.location}
                </div>

                <div className="border-b border-slate-200 my-4" />

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="font-semibold text-black">วันทีประชุม:</span> {formData.meeting_date ? new Date(formData.meeting_date).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '...'}</div>
                    <div><span className="font-semibold text-black">ผู้ประสานงานการจัด:</span> {formData.source_info || '-'}</div>
                  </div>

                  {/* Attendees names in print */}
                  <div>
                    <span className="font-semibold text-black block mb-2">รายชื่อผู้เข้าร่วมการประชุมจริง:</span>
                    {attendees.length > 0 ? (
                      <ol className="list-decimal pl-5 space-y-1">
                        {attendees.map(at => (
                          <li key={at.id}>{at.attendee_name}</li>
                        ))}
                      </ol>
                    ) : (
                      <span className="text-slate-400 italic">ไม่มีข้อมูลการลงชื่อเข้าใช้</span>
                    )}
                  </div>

                  <div className="border-b border-slate-100 my-2" />

                  {/* Agendas summaries */}
                  <div className="space-y-4">
                    <div>
                      <span className="font-semibold text-black block mb-1">ระเบียบวาระที่ 1: เรื่องแจ้งให้ที่ประชุมทราบ</span>
                      <p className="pl-4 text-justify whitespace-pre-line text-slate-600">{formData.agenda_1 || '(ไม่มีบันทึกข้อมูล)'}</p>
                    </div>

                    <div>
                      <span className="font-semibold text-black block mb-1">ระเบียบวาระที่ 2: รับรองรายงานการประชุมครั้งก่อน</span>
                      <p className="pl-4 text-justify whitespace-pre-line text-slate-600">{formData.agenda_2 || '(ไม่มีบันทึกข้อมูล)'}</p>
                    </div>

                    <div>
                      <span className="font-semibold text-black block mb-1">ระเบียบวาระที่ 3: เรื่องเสนอเพื่อทราบ</span>
                      <p className="pl-4 text-justify whitespace-pre-line text-slate-600">{formData.agenda_3 || '(ไม่มีบันทึกข้อมูล)'}</p>
                    </div>

                    <div>
                      <span className="font-semibold text-black block mb-1">ระเบียบวาระที่ 4: เรื่องเสนอเพื่อพิจารณา</span>
                      <p className="pl-4 text-justify whitespace-pre-line text-slate-600">{formData.agenda_4 || '(ไม่มีบันทึกข้อมูล)'}</p>
                    </div>

                    <div>
                      <span className="font-semibold text-black block mb-1">ระเบียบวาระที่ 5: เรื่องอื่นๆ</span>
                      <p className="pl-4 text-justify whitespace-pre-line text-slate-600">{formData.agenda_5 || '(ไม่มีบันทึกข้อมูล)'}</p>
                    </div>
                  </div>

                  <div className="border-b border-slate-200 my-6" />

                  {/* Signs footer */}
                  <div className="flex justify-between pt-4">
                    <div className="text-center w-1/2">
                      <p>ลงชื่อ............................................................ผู้จดรายงาน</p>
                      <p className="mt-2 text-slate-900 font-semibold">({formData.recorder_name || '...........................................'})</p>
                    </div>
                    <div className="text-center w-1/2">
                      <p>ลงชื่อ............................................................ผู้ตรวจรายงาน</p>
                      <p className="mt-2 text-slate-900 font-semibold">({formData.reporter_name || '...........................................'})</p>
                      <p className="text-slate-500 text-[9px] mt-0.5">({formData.reporter_position || 'ประธานคณะทำงาน'})</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
