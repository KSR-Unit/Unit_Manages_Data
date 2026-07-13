'use client';

import { useState } from 'react';
import Swal from 'sweetalert2';
import { FieldSchema } from '@/types';

// ------------------------------------------------------------------
// useAIParsing
// ------------------------------------------------------------------
// Hook ที่รวม logic การส่ง aiStoryText ไป /api/ai/parse-report
// และ fill ผลลัพธ์ลง formData พร้อม highlight fields
//
// ใช้ในทุกหน้าฟอร์ม: meetings, plans, budgets, [category], justice-fund, assessment
// ------------------------------------------------------------------

interface UseAIParsingOptions {
  /** Schema ของ fields สำหรับส่งให้ AI รู้ว่ามีช่องอะไรบ้าง */
  fieldsSchema: FieldSchema[];
  /** callback หลัง fill สำเร็จ */
  onFilled?: (parsedData: Record<string, any>) => void;
}

export function useAIParsing(
  setFormData: React.Dispatch<React.SetStateAction<any>>,
  options: UseAIParsingOptions,
  profile?: { name?: string | null; phone?: string | null }
) {
  const [aiStoryText, setAiStoryText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [highlightFields, setHighlightFields] = useState<Record<string, boolean>>({});

  const handleAIParsing = async () => {
    if (!aiStoryText || !aiStoryText.trim()) {
      Swal.fire('เตือน', 'กรุณากรอกหรือพูดเล่ารายละเอียดก่อนกดประมวลผล', 'warning');
      return;
    }

    setAiParsing(true);
    try {
      const res = await fetch('/api/ai/parse-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story: aiStoryText,
          fieldsSchema: options.fieldsSchema
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการประมวลผลของ AI');
      }

      const parsedData = result.data;
      if (parsedData) {
        const fieldsFilled: Record<string, boolean> = {};

        setFormData((prev: any) => {
          const updated = { ...prev };
          Object.keys(parsedData).forEach(key => {
            if (parsedData[key] !== undefined && parsedData[key] !== '') {
              updated[key] = parsedData[key];
              fieldsFilled[key] = true;
            }
          });
          // Auto-fill reporter from profile if AI didn't detect it
          if (!updated.reporter_name && profile?.name) {
            updated.reporter_name = profile.name;
          }
          if (!updated.reporter_phone && profile?.phone) {
            updated.reporter_phone = profile.phone;
          }
          return updated;
        });

        setHighlightFields(fieldsFilled);
        setAiStoryText('');
        options.onFilled?.(parsedData);

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

  /**
   * รับ pending data จาก sessionStorage (จาก Global AI ที่ dashboard)
   * เรียกใน useEffect([profile]) ของทุกหน้า
   */
  const consumeSessionAutofill = (
    category: string,
    setView?: (v: any) => void,
    extraMerge?: (data: Record<string, any>) => Record<string, any>
  ) => {
    const pendingRaw = sessionStorage.getItem('ai_pending_autofill');
    if (!pendingRaw) return;

    try {
      const { category: cat, data } = JSON.parse(pendingRaw);
      if (cat !== category) return;

      // Optional: switch to form view
      setView?.('form');

      setFormData((prev: any) => {
        const merged = {
          ...prev,
          ...data,
          reporter_name: data.reporter_name || profile?.name || prev.reporter_name || '',
          reporter_phone: data.reporter_phone || profile?.phone || prev.reporter_phone || '',
          ...(extraMerge ? extraMerge(data) : {})
        };
        return merged;
      });

      const highlights: Record<string, boolean> = {};
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
          highlights[key] = true;
        }
      });
      setHighlightFields(highlights);

      setTimeout(() => setHighlightFields({}), 6000);

      Swal.fire({
        icon: 'success',
        title: 'ดึงข้อมูล AI จากหน้าหลักสำเร็จ',
        text: 'ระบบได้กรอกข้อมูลที่ AI ดึงได้เรียบร้อยแล้ว กรุณาตรวจสอบข้อมูลที่ไฮไลต์ก่อนบันทึก',
        confirmButtonColor: '#4f46e5',
        background: '#0f172a',
        color: '#f8fafc'
      });
    } catch (err) {
      console.error('Error parsing pending global mic data:', err);
    } finally {
      sessionStorage.removeItem('ai_pending_autofill');
    }
  };

  return {
    aiStoryText,
    setAiStoryText,
    aiParsing,
    highlightFields,
    handleAIParsing,
    consumeSessionAutofill
  };
}
