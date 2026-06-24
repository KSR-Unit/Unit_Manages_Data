import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

interface FieldSchemaInput {
  name: string;
  label: string;
  type: string;
  options?: { value: string; label: string }[];
}

export async function POST(request: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'ระบบเชื่อมต่อ AI ยังไม่ได้กำหนด API Key (GEMINI_API_KEY) กรุณาตรวจสอบไฟล์ .env.local' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { story, fieldsSchema } = body as { story: string; fieldsSchema: FieldSchemaInput[] };

    if (!story || !story.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุเรื่องเล่าคดี' }, { status: 400 });
    }

    if (!fieldsSchema || !Array.isArray(fieldsSchema) || fieldsSchema.length === 0) {
      return NextResponse.json({ error: 'กรุณาระบุโครงสร้างคอลัมน์ของแบบฟอร์ม' }, { status: 400 });
    }

    // 1. สร้าง Properties และ Schema สำหรับส่งให้ Gemini
    const properties: Record<string, unknown> = {};
    const requiredFields: string[] = [];

    fieldsSchema.forEach(field => {
      // ไม่ต้องให้ AI วิเคราะห์ฟิลด์ประเภทไฟล์ หรือฟิลด์ที่คำนวณอัตโนมัติ
      if (field.type === 'file') return;

      const descParts = [field.label];
      if (field.options && field.options.length > 0) {
        const optionValues = field.options.map(opt => opt.value);
        descParts.push(`ต้องเลือกจากตัวเลือกดังต่อไปนี้เท่านั้น: ${optionValues.join(', ')}`);
      }

      properties[field.name] = {
        type: field.type === 'number' ? 'number' : 'string',
        description: descParts.join('. ')
      };

      // ทุกฟิลด์ที่เราต้องการแยก ให้อยู่ใน required เพื่อป้องกัน AI ละเลยคอลัมน์
      requiredFields.push(field.name);
    });

    // 2. สร้าง Prompt สำหรับสั่งการระบบ (System instruction & User prompt)
    const fieldsText = fieldsSchema
      .filter(f => f.type !== 'file')
      .map(f => {
        const opts = f.options ? ` (ตัวเลือกที่เป็นไปได้: ${f.options.map(o => o.value).join(', ')})` : '';
        return `- ${f.name} (${f.label})${opts}`;
      })
      .join('\n');

    const promptMessage = `คุณเป็นระบบวิเคราะห์ภาษาไทยอัจฉริยะ ทำหน้าที่วิเคราะห์และดึงข้อมูลจากการพูดเล่าเรื่อง (Voice Dictation) หรือพิมพ์บอกรายงานประจำวันของศูนย์ไกล่เกลี่ยข้อพิพาทภาคประชาชน

กรุณาวิเคราะห์ข้อความเล่าเรื่องด้านล่างนี้ และคัดแยกเอาเนื้อความไปใส่ในฟิลด์ที่กำหนดให้ตรงประเภทที่สุด:

เรื่องเล่า/คำพูดผู้ใช้:
"${story.trim()}"

รายละเอียดฟิลด์ที่ต้องการและคำอธิบาย:
${fieldsText}

ข้อตกลงพิเศษในการตอบกลับ:
- หากพบตัวเลขจำนวนเงินหรือตัวเลขใด ๆ ให้แปลงเป็นตัวเลขอารบิกที่ไม่มีลูกน้ำคั่นในฟิลด์ตัวเลข
- หากเป็นฟิลด์วันที่ ให้แปลงปี พ.ศ. หรือใด ๆ ให้อยู่ในฟอร์แมตสากล YYYY-MM-DD เสมอ เช่น 5 มกราคม 2569 -> 2026-01-05 หรือถ้าเป็นปี พ.ศ. 2569 ให้แปลงเป็น ค.ศ. 2026
- หากฟิลด์ใดมีตัวเลือก (options) กำหนดไว้ ให้จับคู่เข้าหาตัวเลือกที่ใกล้เคียงที่สุดจากที่กำหนดให้ หากไม่ตรงเลยให้เลือกตัวเลือก "อื่นๆ" (หากมี) หรือปล่อยว่างไว้
- หากไม่มีเบาะแสใด ๆ ในเรื่องเล่าสำหรับฟิลด์นั้น ๆ ไม่ต้องใส่คีย์ของฟิลด์นั้นมาในผลลัพธ์ JSON (ให้ละเว้นคีย์นั้นไปเลย) เพื่อความรวดเร็วในการประมวลผล`;

    const requestPayload = {
      contents: [{
        parts: [{
          text: promptMessage
        }]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: properties
        }
      }
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API request failed:', errorData);
      return NextResponse.json(
        { error: `ไม่สามารถประมวลผลผ่าน Gemini API ได้: ${errorData.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    const parsedText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!parsedText) {
      return NextResponse.json({ error: 'ไม่ได้รับข้อมูลคำตอบจาก AI' }, { status: 500 });
    }

    // แปลงผลลัพธ์ JSON ส่งกลับไปหน้าบ้าน
    const parsedJson = JSON.parse(parsedText);
    return NextResponse.json({ data: parsedJson });

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('API route parse-report crashed:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการรันระบบ: ' + errMsg }, { status: 500 });
  }
}
