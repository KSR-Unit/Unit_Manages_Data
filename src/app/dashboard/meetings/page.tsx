'use client';

import React from 'react';
import {
  Plus, Edit, Trash2, ArrowLeft, Mic, MicOff, Printer,
  QrCode, FileText, Users, Loader2, Save, RefreshCw, Download, Sparkles
} from 'lucide-react';
import { useMeetingsController } from '@/components/meetings/_MeetingsController';
import { VoiceAssistantCard } from '@/components/shared/VoiceAssistantCard';

export default function MeetingsPage() {
  const {
    view, setView, activeTab, setActiveTab,
    meetings, attendees, loading, editingId, formData, setFormData,
    profile,
    activeVoiceField, toggleFieldVoice,
    aiStoryText, setAiStoryText, aiParsing, highlightFields, handleAIParsing,
    handleOpenAddForm, handleOpenEditForm, handleSave, handleDelete,
    handleDownloadDocx, getRegistrationLink,
  } = useMeetingsController();

  // ---- helpers ----
  const fieldClass = (field: string) =>
    `w-full bg-slate-950 border rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500 transition-all ${
      highlightFields[field]
        ? 'border-indigo-500/80 bg-indigo-500/5 ring-1 ring-indigo-500/30 animate-pulse'
        : activeVoiceField === field
          ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30'
          : 'border-slate-800'
    }`;

  const MicBtn = ({ field, isTextarea = false }: { field: string; isTextarea?: boolean }) => (
    <button
      type="button"
      onClick={() => toggleFieldVoice(field)}
      className={`absolute ${isTextarea ? 'top-2.5 right-2.5' : 'right-2.5'} p-1 rounded-md transition-all cursor-pointer ${
        activeVoiceField === field
          ? 'text-rose-400 bg-rose-500/10 animate-pulse'
          : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {activeVoiceField === field ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
    </button>
  );

  const qrImageUrl = editingId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(getRegistrationLink())}`
    : '';

  const handlePrint = () => window.print();

  // ---- print PDF helper ----
  const handlePrintPdf = (type: 'invitation' | 'agenda') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = type === 'invitation' ? `
      <div class="meta">เลขที่หนังสือ: ศก.ปช./${editingId ? editingId.substring(0, 5) : 'XXXX'}</div>
      <div class="title">หนังสือเชิญประชุมคณะทำงานผู้ไกล่เกลี่ยข้อพิพาท<br/>เรื่อง: ขอเชิญเข้าร่วมการประชุม</div>
      <div class="content">
        <p><strong>เรียน:</strong> คณะทำงานและผู้ประสานงานศูนย์ไกล่เกลี่ยประจำพื้นที่</p>
        <p class="indent">${formData.invitation_text || '...'}</p>
        <p class="indent">กำหนดจัดประชุมในวันที่ <strong>${formData.meeting_date ? new Date(formData.meeting_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '...'}</strong> ณ <strong>${formData.location || '...'}</strong></p>
        <p class="indent">จึงเรียนมาเพื่อทราบและขอเรียนเชิญเข้าร่วมการประชุมโดยพร้อมเพรียงกัน</p>
      </div>
      <div class="signatures">
        <p>ขอแสดงความนับถือ</p>
        <p style="margin-top: 40px;">(ลงชื่อ)....................................................</p>
        <p><strong>(${formData.reporter_name || 'ผู้มีอำนาจลงนาม'})</strong></p>
        <p style="font-size: 12px; color: #666;">ตำแหน่ง: ${formData.reporter_position || 'ประธานคณะทำงาน'}</p>
      </div>` : `
      <div class="meta">วันที่จัดประชุม: ${formData.meeting_date ? new Date(formData.meeting_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '...'}</div>
      <div class="title">รายงานการประชุมคณะทำงานผู้ไกล่เกลี่ยข้อพิพาท</div>
      <div class="content">
        <p><strong>สถานที่ประชุม:</strong> ${formData.location || '...'}</p>
        <p><strong>บันทึกโดย:</strong> ${formData.reporter_name || '...'}</p>
        ${[1,2,3,4,5].map(n => `<div class="agenda-item"><div class="agenda-title">วาระที่ ${n}</div><div class="agenda-body">${formData[`agenda_${n}`] || '(ไม่มีข้อมูล)'}</div></div>`).join('')}
      </div>
      <div class="signatures">
        <p style="margin-top: 40px;">(ลงชื่อ)....................................................</p>
        <p><strong>(${formData.reporter_name || '...................'})</strong></p>
        <p style="font-size: 12px; color: #666;">${formData.reporter_position || 'ประธานคณะทำงาน'}</p>
      </div>`;

    printWindow.document.write(`
      <html><head><title>${type === 'invitation' ? 'หนังสือเชิญประชุม' : 'รายงานการประชุม'}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;800&display=swap');
        body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #333; line-height: 1.6; font-size: 14px; }
        .meta { text-align: right; color: #666; margin-bottom: 30px; }
        .title { text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 30px; }
        .content { margin-bottom: 40px; text-align: justify; }
        .indent { text-indent: 40px; }
        .signatures { margin-top: 60px; text-align: right; width: 300px; margin-left: auto; }
        .agenda-item { margin-bottom: 20px; }
        .agenda-title { font-weight: bold; margin-bottom: 5px; }
        .agenda-body { margin-left: 20px; }
        @media print { body { padding: 0; } button { display: none; } }
      </style></head><body>
        ${content}
        <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }</script>
      </body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; background: white !important; color: black !important; padding: 2cm !important; }
          aside, header, nav, button, select, .no-print { display: none !important; }
        }
      `}</style>

      {/* ======== LIST VIEW ======== */}
      {view === 'list' ? (
        <div className="space-y-6 no-print">
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
                        {profile?.role !== 'user' && <td className="p-4 text-indigo-400 font-semibold">{m.profiles?.province}</td>}
                        <td className="p-4 font-semibold text-white">{m.meeting_name}</td>
                        <td className="p-4">{new Date(m.meeting_date).toLocaleDateString('th-TH')}</td>
                        <td className="p-4">{m.location}</td>
                        <td className="p-4">{m.reporter_name}</td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={() => handleOpenEditForm(m)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer" title="เปิดเครื่องมือแก้ไข">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(m.id)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors cursor-pointer" title="ลบ">
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
        /* ======== FORM VIEW ======== */
        <div className="space-y-6 no-print">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 transition-colors cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              <span>กลับรายการประชุม</span>
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-lg">
              <Save className="h-4 w-4" />
              <span>บันทึกการประชุม</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs w-full overflow-x-auto">
            {(['details', 'agendas', 'qr', 'print'] as const).map((tab, idx) => {
              const labels = ['1. รายละเอียด & หนังสือเชิญ', '2. บันทึก 5 วาระ (Speech-to-Text)', '3. สแกน QR ลงชื่อเข้างาน', '4. รายงานการประชุมทางการ'];
              const disabled = (tab === 'qr' || tab === 'print') && !editingId;
              return (
                <button
                  key={tab}
                  onClick={() => !disabled && setActiveTab(tab)}
                  disabled={disabled}
                  className={`flex-1 min-w-[100px] text-center py-2.5 rounded-lg cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${activeTab === tab ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  {labels[idx]}
                </button>
              );
            })}
          </div>

          {/* ---- TAB 1: Details & Invitation ---- */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-4 text-xs text-slate-300">
                <h3 className="text-sm font-semibold text-white">รายละเอียดจัดประชุมคณะทำงาน</h3>

                {/* AI Voice Card */}
                <VoiceAssistantCard
                  aiStoryText={aiStoryText}
                  onStoryChange={setAiStoryText}
                  aiParsing={aiParsing}
                  onParse={handleAIParsing}
                  placeholder="พูดเล่าบรรยายรายละเอียดการประชุม... เช่น การประชุมครั้งที่ 1/2569 วันที่ 10 มีนาคม 2569 ณ ห้องประชุมเทศบาล โดยมีนายสมศักดิ์เป็นประธาน..."
                  onDownload={handleDownloadDocx}
                  downloadLabel="ดาวน์โหลดรายงาน (.docx)"
                />

                {/* meeting_name */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">หัวข้อ/ชื่อการประชุม <span className="text-rose-500">*</span></label>
                  <div className="relative flex items-center">
                    <input type="text" required placeholder="เช่น ประชุมทบทวนแผนคดีและพิจารณาประเมิน"
                      value={formData.meeting_name}
                      onChange={(e) => setFormData((p: any) => ({ ...p, meeting_name: e.target.value }))}
                      className={fieldClass('meeting_name') + ' pr-9'}
                    />
                    <MicBtn field="meeting_name" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">วันที่จัดประชุม <span className="text-rose-500">*</span></label>
                    <input type="date" required value={formData.meeting_date}
                      onChange={(e) => setFormData((p: any) => ({ ...p, meeting_date: e.target.value }))}
                      className={fieldClass('meeting_date')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">สถานที่จัด <span className="text-rose-500">*</span></label>
                    <div className="relative flex items-center">
                      <input type="text" required placeholder="เช่น ห้องประชุมใหญ่ศูนย์"
                        value={formData.location}
                        onChange={(e) => setFormData((p: any) => ({ ...p, location: e.target.value }))}
                        className={fieldClass('location') + ' pr-9'}
                      />
                      <MicBtn field="location" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">ผู้จดรายงาน/ผู้บันทึก <span className="text-rose-500">*</span></label>
                    <div className="relative flex items-center">
                      <input type="text" required value={formData.recorder_name || ''}
                        onChange={(e) => setFormData((p: any) => ({ ...p, recorder_name: e.target.value }))}
                        className={fieldClass('recorder_name') + ' pr-9'}
                      />
                      <MicBtn field="recorder_name" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">เบอร์โทรศัพท์ผู้จดรายงาน</label>
                    <div className="relative flex items-center">
                      <input type="text" value={formData.reporter_phone || ''}
                        onChange={(e) => setFormData((p: any) => ({ ...p, reporter_phone: e.target.value }))}
                        className={fieldClass('reporter_phone') + ' pr-9'}
                      />
                      <MicBtn field="reporter_phone" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">ผู้มีอำนาจ <span className="text-rose-500">*</span></label>
                    <div className="relative flex items-center">
                      <input type="text" required placeholder="เช่น นายกมลเดช สมบูรณ์"
                        value={formData.reporter_name || ''}
                        onChange={(e) => setFormData((p: any) => ({ ...p, reporter_name: e.target.value }))}
                        className={fieldClass('reporter_name') + ' pr-9'}
                      />
                      <MicBtn field="reporter_name" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">ตำแหน่งผู้มีอำนาจ <span className="text-rose-500">*</span></label>
                    <select value={formData.reporter_position || 'ประธานคณะทำงาน'}
                      onChange={(e) => setFormData((p: any) => ({ ...p, reporter_position: e.target.value }))}
                      className={fieldClass('reporter_position') + ' cursor-pointer'}
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
                      <input type="text" value={formData.source_info}
                        onChange={(e) => setFormData((p: any) => ({ ...p, source_info: e.target.value }))}
                        className={fieldClass('source_info') + ' pr-9'}
                      />
                      <MicBtn field="source_info" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">เบอร์โทรติดต่อผู้ประสานงาน</label>
                    <div className="relative flex items-center">
                      <input type="text" value={formData.source_contact}
                        onChange={(e) => setFormData((p: any) => ({ ...p, source_contact: e.target.value }))}
                        className={fieldClass('source_contact') + ' pr-9'}
                      />
                      <MicBtn field="source_contact" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">เนื้อหาหนังสือส่งเชิญเข้าร่วมประชุม</label>
                  <div className="relative flex items-start">
                    <textarea rows={4} value={formData.invitation_text}
                      onChange={(e) => setFormData((p: any) => ({ ...p, invitation_text: e.target.value }))}
                      className={fieldClass('invitation_text') + ' pr-9 leading-5'}
                    />
                    <MicBtn field="invitation_text" isTextarea />
                  </div>
                </div>
              </div>

              {/* Invitation Preview */}
              <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl text-slate-800 shadow-md flex flex-col justify-between h-fit">
                <div className="space-y-4 text-[10px] font-sans">
                  <div className="text-center font-bold text-xs border-b pb-3 text-slate-900">หนังสือเชิญประชุม (พรีวิว)</div>
                  <div className="text-right text-slate-500">เลขที่หนังสือ: ศก.ปช./{editingId ? editingId.substring(0, 5) : 'XXXX'}</div>
                  <div className="text-center font-semibold text-slate-900 leading-5">หนังสือเชิญประชุมคณะทำงานผู้ไกล่เกลี่ยข้อพิพาท<br/>เรื่อง: ขอเชิญเข้าร่วมการประชุม</div>
                  <div className="space-y-2 leading-relaxed text-slate-700">
                    <p><span className="font-semibold text-slate-900">เรียน:</span> คณะทำงานและผู้ประสานงานศูนย์ไกล่เกลี่ยประจำพื้นที่</p>
                    <p className="indent-8 text-justify">{formData.invitation_text || '...'}</p>
                    <p className="indent-8 text-justify">ทั้งนี้ กำหนดจัดประชุมในวันที่ <span className="font-semibold">{formData.meeting_date ? new Date(formData.meeting_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '...'}</span> ณ <span className="font-semibold">{formData.location || '...'}</span></p>
                    <p className="indent-8">จึงเรียนมาเพื่อทราบและขอเรียนเชิญเข้าร่วมการประชุมโดยพร้อมเพรียงกัน</p>
                  </div>
                  <div className="text-right pt-4 space-y-1">
                    <p>ขอแสดงความนับถือ</p>
                    <p className="pt-4 text-slate-500">(ลงชื่อ)....................................................</p>
                    <p className="text-slate-900 font-semibold">({formData.reporter_name || 'ผู้มีอำนาจลงนาม'})</p>
                    <p className="text-slate-500 text-[9px]">ตำแหน่ง: {formData.reporter_position || 'ประธานคณะทำงาน'}</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t flex items-center justify-between gap-3">
                  <span className="text-[9px] text-slate-400">กรอกรายละเอียดครบถ้วนแล้ว ให้ขยับไปแท็บที่ 2 เพื่อบันทึกวาระการประชุม</span>
                  <button type="button" onClick={() => handlePrintPdf('invitation')} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-[10px] transition-all cursor-pointer shadow-lg shrink-0">
                    <Download className="h-3.5 w-3.5" /><span>ดาวน์โหลด PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---- TAB 2: Agendas ---- */}
          {activeTab === 'agendas' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-6 text-xs text-slate-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">จดบันทึกระเบียบวาระมติที่ประชุม (5 วาระมาตรฐาน)</h3>
                    <p className="text-[10px] text-slate-500 font-light mt-0.5">กดปุ่มไมโครโฟนเพื่อพูดภาษาไทยในการถอดความแทนการคีย์พิมพ์</p>
                  </div>
                </div>
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
                          <button type="button" onClick={() => toggleFieldVoice(ag.key)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${listening ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
                          >
                            {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                            <span>{listening ? 'กำลังถอดเสียง (กดเพื่อหยุด)' : 'พูดเพื่อถอดความ'}</span>
                          </button>
                        </div>
                        <textarea rows={3} placeholder={ag.placeholder}
                          value={formData[ag.key] || ''}
                          onChange={(e) => setFormData((p: any) => ({ ...p, [ag.key]: e.target.value }))}
                          className={`w-full bg-slate-950 border rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500 leading-5 transition-all ${listening ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30' : 'border-slate-800'}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Agenda Preview */}
              <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl text-slate-800 shadow-md flex flex-col h-fit">
                <div className="space-y-4 text-[10px] font-sans">
                  <div className="text-center font-bold text-xs border-b pb-3">รายงานการประชุม (พรีวิว)</div>
                  <div className="text-right text-slate-500">วันที่: {formData.meeting_date ? new Date(formData.meeting_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '...'}</div>
                  <div className="text-center font-semibold leading-5">รายงานการประชุมคณะทำงานผู้ไกล่เกลี่ยข้อพิพาท<br/>ประจำปีงบประมาณ {formData.meeting_date ? new Date(formData.meeting_date).getFullYear() + 543 : 'XXXX'}</div>
                  <div className="space-y-3 text-slate-700">
                    <p><span className="font-semibold">สถานที่:</span> {formData.location || '...'}</p>
                    <p><span className="font-semibold">บันทึกโดย:</span> {formData.reporter_name || '...'}</p>
                    <div className="border-t border-slate-100 my-2" />
                    {[1,2,3,4,5].map(n => (
                      <div key={n}>
                        <span className="font-semibold block">วาระที่ {n}</span>
                        <p className="pl-3 text-justify whitespace-pre-line text-slate-600">{formData[`agenda_${n}`] || '(ไม่มีบันทึกข้อมูล)'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="text-right pt-4 border-t border-slate-100 space-y-1">
                    <p className="text-slate-500">(ลงชื่อ)....................................................</p>
                    <p className="font-semibold">({formData.reporter_name || '...'})</p>
                    <p className="text-[9px] text-slate-500">{formData.reporter_position || 'ประธานคณะทำงาน'}</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t flex items-center justify-between gap-3">
                  <span className="text-[9px] text-slate-400">กรอกวาระครบถ้วนแล้ว ให้ขยับไปแท็บที่ 3</span>
                  <button type="button" onClick={() => handlePrintPdf('agenda')} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-[10px] transition-all cursor-pointer shadow-lg shrink-0">
                    <Download className="h-3.5 w-3.5" /><span>ดาวน์โหลด PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---- TAB 3: QR Code ---- */}
          {activeTab === 'qr' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                  <div className="h-48 w-48 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-600 text-xs">บันทึกสคริปต์ก่อนเปิดรหัส</div>
                )}
                <div className="w-full text-left bg-slate-950 p-3.5 rounded-xl border border-slate-800/60 text-[10px] break-all select-all font-mono text-indigo-400 cursor-pointer">
                  {getRegistrationLink()}
                </div>
              </div>

              <div className="lg:col-span-2 bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-400" />
                    <span>ใบลงชื่อเข้าร่วมประชุม ({attendees.length} คน)</span>
                  </h3>
                  <button type="button" onClick={() => {}} className="p-1.5 hover:bg-slate-800 rounded-lg text-indigo-400 hover:text-white transition-colors cursor-pointer" title="ดึงข้อมูลรายชื่อใหม่">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[350px] space-y-2 text-xs">
                  {attendees.length > 0 ? attendees.map((at, idx) => (
                    <div key={at.id} className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/40">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-500 w-6">{idx + 1}.</span>
                        <span className="font-semibold text-slate-200">{at.attendee_name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{new Date(at.check_in_time).toLocaleTimeString('th-TH')}</span>
                    </div>
                  )) : (
                    <div className="py-16 text-center text-slate-500 italic flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl">
                      <Users className="h-8 w-8 mb-2 text-slate-700" />
                      <span>ยังไม่มีผู้ร่วมประชุมมาแสกนลงทะเบียนเข้าห้องงาน</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---- TAB 4: Official Minutes Print ---- */}
          {activeTab === 'print' && (
            <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">รายงานสรุปบันทึกการประชุมอย่างเป็นทางการ</h3>
                  <p className="text-[10px] text-slate-500 font-light mt-0.5">พรีวิวโครงสร้างก่อนสั่งพิมพ์หรือบันทึกเป็นเอกสาร PDF แนบส่ง</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleDownloadDocx} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-lg">
                    <FileText className="h-4 w-4" /><span>ดาวน์โหลดรายงานประชุม (.docx)</span>
                  </button>
                  <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-lg">
                    <Printer className="h-4 w-4" /><span>พิมพ์รายงานบันทึก (A4 / PDF)</span>
                  </button>
                </div>
              </div>

              {/* Print area */}
              <div className="bg-white border rounded-2xl p-8 max-w-2xl mx-auto shadow-md text-slate-800 text-[10px] font-sans leading-relaxed print-area">
                <div className="text-center font-bold text-xs uppercase text-black leading-6">
                  รายงานการประชุมคณะทำงานและผู้ไกล่เกลี่ยข้อพิพาทประจำศูนย์<br/>
                  ครั้งที่ {editingId ? editingId.substring(0, 4) : 'X'}/{formData.meeting_date ? new Date(formData.meeting_date).getFullYear() + 543 : 'XXXX'}<br/>
                  ณ สถานที่ {formData.location}
                </div>
                <div className="border-b border-slate-200 my-4" />
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="font-semibold text-black">วันที่ประชุม:</span> {formData.meeting_date ? new Date(formData.meeting_date).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '...'}</div>
                    <div><span className="font-semibold text-black">ผู้ประสานงานการจัด:</span> {formData.source_info || '-'}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-black block mb-2">รายชื่อผู้เข้าร่วมการประชุมจริง:</span>
                    {attendees.length > 0 ? (
                      <ol className="list-decimal pl-5 space-y-1">{attendees.map(at => <li key={at.id}>{at.attendee_name}</li>)}</ol>
                    ) : (
                      <span className="text-slate-400 italic">ไม่มีข้อมูลการลงชื่อเข้าใช้</span>
                    )}
                  </div>
                  <div className="border-b border-slate-100 my-2" />
                  <div className="space-y-4">
                    {[1,2,3,4,5].map(n => (
                      <div key={n}>
                        <span className="font-semibold text-black block mb-1">ระเบียบวาระที่ {n}</span>
                        <p className="pl-4 text-justify whitespace-pre-line text-slate-600">{formData[`agenda_${n}`] || '(ไม่มีบันทึกข้อมูล)'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-b border-slate-200 my-6" />
                  <div className="flex justify-between pt-4">
                    <div className="text-center w-1/2">
                      <p>ลงชื่อ............................................................ผู้จดรายงาน</p>
                      <p className="mt-2 text-slate-900 font-semibold">({formData.recorder_name || '...'})</p>
                    </div>
                    <div className="text-center w-1/2">
                      <p>ลงชื่อ............................................................ผู้ตรวจรายงาน</p>
                      <p className="mt-2 text-slate-900 font-semibold">({formData.reporter_name || '...'})</p>
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
