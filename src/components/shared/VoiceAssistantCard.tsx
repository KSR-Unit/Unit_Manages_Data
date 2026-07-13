'use client';

import React, { useRef } from 'react';
import { Mic, MicOff, Sparkles, Loader2, FileText, Info } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

// ------------------------------------------------------------------
// VoiceAssistantCard
// ------------------------------------------------------------------
// Shared component ที่ใช้ทุกหน้าฟอร์ม (meetings, plans, budgets, etc.)
// รับ props สองส่วน:
//   1. Global dictation — textarea + mic button → เรียก /api/ai/parse-report
//   2. Field-level dictation — mic ปุ่มเล็กต่อ field
// ------------------------------------------------------------------

interface VoiceAssistantCardProps {
  /** ข้อความปัจจุบันในช่อง textarea */
  aiStoryText: string;
  /** อัพเดตข้อความ */
  onStoryChange: (text: string) => void;
  /** กำลัง parse อยู่หรือไม่ */
  aiParsing: boolean;
  /** กด "ประมวลผลด้วย AI" */
  onParse: () => void;
  /** placeholder ของ textarea */
  placeholder?: string;
  /** ถ้าต้องการให้แสดงปุ่ม Download .docx */
  onDownload?: () => void;
  /** label ของ download button */
  downloadLabel?: string;
  /** ถ้าต้องการแสดงปุ่ม Print */
  onPrint?: () => void;
}

export function VoiceAssistantCard({
  aiStoryText,
  onStoryChange,
  aiParsing,
  onParse,
  placeholder = 'แตะไมค์แล้วเริ่มพูดเล่าเรื่องรายละเอียดที่ต้องการบันทึก หรือจะพิมพ์ข้อมูลโดยตรงก็ได้...',
  onDownload,
  downloadLabel = 'ดาวน์โหลด .docx',
  onPrint,
}: VoiceAssistantCardProps) {

  const { isListening, startListening, stopListening, isSupported } = useSpeechRecognition({
    onResult: (text, isFinal) => {
      if (isFinal) {
        onStoryChange(aiStoryText ? aiStoryText + ' ' + text : text);
      }
    }
  });

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/40 to-slate-900/40 border border-slate-800/60 p-5 rounded-2xl relative overflow-hidden shadow-xl">
      <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <span className="text-xs font-semibold text-slate-200">AI Voice Assistant — พูดเพื่อกรอกข้อมูล</span>
        </div>

        {/* Optional action buttons */}
        <div className="flex items-center gap-2">
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-[10px] font-medium transition-all cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>สคริปต์พิมพ์</span>
            </button>
          )}
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-[10px] font-medium transition-all cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              <span>{downloadLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative rounded-xl border border-slate-800 bg-slate-950/80 p-3">
        <textarea
          value={aiStoryText}
          onChange={(e) => onStoryChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent border-0 text-slate-100 placeholder-slate-500 text-sm focus:ring-0 focus:outline-none resize-y min-h-[100px] font-light leading-relaxed"
          rows={4}
        />

        {/* Bottom actions row */}
        <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5 mt-1.5">
          <div className="flex items-center gap-3">
            {isSupported ? (
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/20'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-3.5 w-3.5" />
                    <span>หยุดบันทึกเสียง</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5 text-indigo-400" />
                    <span>บันทึกเสียงพูด</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-[10px] text-slate-500">บราวเซอร์ไม่รองรับ Speech Recognition</span>
            )}

            {isListening && (
              <div className="flex items-center gap-1.5 pl-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[10px] text-rose-400 font-medium">กำลังรับฟังเสียง...</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onParse}
            disabled={aiParsing || !aiStoryText.trim()}
            className="flex items-center justify-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            {aiParsing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                <span>กำลังวิเคราะห์...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>ประมวลผลด้วย AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// FieldMicButton
// ------------------------------------------------------------------
// ปุ่มไมค์ขนาดเล็กที่ใช้ต่อกับ field แต่ละตัว
// ------------------------------------------------------------------

interface FieldMicButtonProps {
  fieldName: string;
  activeVoiceField: string | null;
  onToggle: (fieldName: string) => void;
}

export function FieldMicButton({ fieldName, activeVoiceField, onToggle }: FieldMicButtonProps) {
  const isActive = activeVoiceField === fieldName;
  return (
    <button
      type="button"
      onClick={() => onToggle(fieldName)}
      title={isActive ? 'หยุดบันทึกเสียงสำหรับช่องนี้' : 'บันทึกเสียงสำหรับช่องนี้'}
      className={`flex-shrink-0 p-1.5 rounded-lg transition-all cursor-pointer ${
        isActive
          ? 'bg-rose-600/20 text-rose-400 border border-rose-600/30 animate-pulse'
          : 'bg-slate-800/60 text-slate-500 border border-slate-700/50 hover:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30'
      }`}
    >
      {isActive ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
    </button>
  );
}

// ------------------------------------------------------------------
// useFieldVoice hook
// ------------------------------------------------------------------
// Encapsulates the field-level speech recognition state that
// every form page previously duplicated.
// Usage:
//   const { activeVoiceField, toggleFieldVoice } = useFieldVoice(setFormData);
// ------------------------------------------------------------------

export function useFieldVoice(setFormData: React.Dispatch<React.SetStateAction<any>>) {
  const activeVoiceFieldRef = useRef<string | null>(null);
  const [activeVoiceField, setActiveVoiceField] = React.useState<string | null>(null);

  const { startListening: startFieldListening, stopListening: stopFieldListening } = useSpeechRecognition({
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
      activeVoiceFieldRef.current = null;
      setActiveVoiceField(null);
    } else {
      if (activeVoiceFieldRef.current) {
        stopFieldListening();
      }
      activeVoiceFieldRef.current = fieldName;
      setActiveVoiceField(fieldName);
      startFieldListening();
    }
  };

  return { activeVoiceField, toggleFieldVoice };
}
