import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(request: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ระบบเชื่อมต่อ AI ยังไม่ได้กำหนด API Key (GEMINI_API_KEY) กรุณาตรวจสอบไฟล์ .env.local' 
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { fileBase64, mimeType, fileUrl } = body;

    let finalBase64 = fileBase64;
    let finalMimeType = mimeType;

    // 1. หากระบุเป็น URL มา (เช่น กรณีแก้ไขข้อมูลที่มีไฟล์แนบเดิม) ให้ทำการดาวน์โหลดข้อมูลฝั่งเซิร์ฟเวอร์
    if (fileUrl && !finalBase64) {
      console.log('Downloading file from url for OCR:', fileUrl);
      const downloadResponse = await fetch(fileUrl);
      if (!downloadResponse.ok) {
        return NextResponse.json(
          { success: false, error: `ไม่สามารถดึงข้อมูลไฟล์จากคลังเก็บเอกสารได้: ${downloadResponse.statusText}` },
          { status: 400 }
        );
      }
      const arrayBuffer = await downloadResponse.arrayBuffer();
      finalBase64 = Buffer.from(arrayBuffer).toString('base64');
      finalMimeType = downloadResponse.headers.get('content-type') || 'image/jpeg';
    }

    if (!finalBase64) {
      return NextResponse.json(
        { success: false, error: 'กรุณาแนบไฟล์ภาพหรือ PDF ของวุฒิบัตรสำหรับทำ OCR' },
        { status: 400 }
      );
    }

    // 2. ปรับแต่งประเภท MIME ให้เข้ากันได้กับ Gemini API (จำกัดประเภท)
    const supportedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!supportedMimes.includes(finalMimeType)) {
      if (finalMimeType.startsWith('image/')) {
        finalMimeType = 'image/jpeg'; // แปลงภาพประเภทอื่นๆ เป็นภาพมาตรฐาน
      } else {
        return NextResponse.json(
          { success: false, error: 'ระบบรองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP) หรือไฟล์เอกสาร PDF เท่านั้น' },
          { status: 400 }
        );
      }
    }

    // 3. กำหนด System Instruction และสแกนหาฟิลด์ในใบวุฒิบัตร/เกียรติบัตรภาษาไทย
    const systemPrompt = `คุณเป็นระบบวิเคราะห์รูปภาพและข้อความอัจฉริยะ (Multimodal OCR Specialist) มีหน้าที่อ่านข้อความในใบวุฒิบัตร เกียรติบัตร ประกาศนียบัตร หรือเอกสารหลักฐานรับรองการฝึกอบรมสัมมนาต่างๆ ของไทย
กรุณาทำ OCR อ่านข้อมูลข้อความทั้งหมดที่ปรากฏบนเอกสารนี้ และคัดแยกสกัดเนื้อความไปใส่ในฟิลด์ที่กำหนดให้ตรงประเภทที่สุด โดยตอบกลับในรูปแบบ JSON เท่านั้น ห้ามตอบเกริ่นนำ อธิบายใดๆ ทั้งสิ้น นอกเหนือจาก JSON บล็อกนี้:
{
  "trainee_name": "ระบุชื่อและนามสกุลเต็มของผู้เข้าอบรมสะกดให้ถูกต้อง (หากพบรายชื่อผู้เข้าอบรมมากกว่า 1 คน ให้สรุปรายชื่อทั้งหมดคั่นด้วยเครื่องหมายจุลภาค , )",
  "course_name": "ระบุชื่อหลักสูตรอบรม หัวข้อสัมมนา หรือหัวข้อการศึกษาดูงานให้ครบถ้วนถูกต้องตามที่ระบุในเอกสาร",
  "unit_training": "ระบุชื่อหน่วยงาน องค์กร บริษัท หรือสถาบันที่เป็นผู้จัดอบรมหรือผู้มอบใบเกียรติบัตรนี้ให้ชัดเจน",
  "start_date": "วันที่อบรมเริ่มต้น ในรูปแบบปีสากล YYYY-MM-DD เช่น หากในเกียรติบัตรระบุจัดขึ้นวันที่ 27 มิถุนายน 2569 ให้แปลงปี พ.ศ. ลบด้วย 543 เสมอ เป็น ค.ศ. แล้วตอบในฟอร์แมต 2026-06-27 (หากในเอกสารระบุเป็นช่วงวันที่ เช่น 27-28 มิถุนายน 2569 ให้ใช้ '2026-06-27' ในฟิลด์นี้)",
  "end_date": "วันที่อบรมเสร็จสิ้น ในรูปแบบปีสากล YYYY-MM-DD เช่น หากอบรมเสร็จสิ้นวันที่ 28 มิถุนายน 2569 ให้ตอบในฟอร์แมต 2026-06-28 (หากเป็นหลักสูตรวันเดียว หรือไม่ระบุช่วงวันที่ชัดเจน ให้ใส่ค่าเดียวกับ start_date)",
  "location": "ระบุสถานที่จัดอบรมที่ระบุในเอกสาร (เช่น โรงแรมอัศวิน หรือหากมีคำระบุว่าผ่านสื่ออิเล็กทรอนิกส์, ออนไลน์, Zoom, Microsoft Teams, E-learning ให้ระบุ 'ออนไลน์')",
  "training_format": "วิเคราะห์รูปแบบการฝึกอบรม โดยต้องตอบว่า 'ออนไลน์' หรือ 'ออนไซต์' เท่านั้น (กติกา: หากระบุว่า ออนไลน์, ผ่าน Zoom, ผ่านแอปพลิเคชัน, MS Teams, Cisco, Webex, E-learning หรืออบรมทางไกล ให้เลือกตอบว่า 'ออนไลน์' หากไม่พบคีย์เวิร์ดระบบออนไลน์และเป็นสถานที่จริง หรือระบุห้องประชุมสถาบัน ให้เลือกตอบว่า 'ออนไซต์')"
}`;

    const requestPayload = {
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: finalMimeType,
              data: finalBase64
            }
          },
          {
            text: systemPrompt
          }
        ]
      }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };

    console.log('Sending OCR request to Gemini for mimeType:', finalMimeType);
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini OCR API failed:', errorData);
      return NextResponse.json(
        { success: false, error: `บริการ AI Gemini ล้มเหลว: ${errorData.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    const parsedText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!parsedText) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผลลัพธ์การอ่านข้อความจาก AI' },
        { status: 500 }
      );
    }

    // สรุปข้อมูลส่งกลับในรูปแบบ JSON
    const parsedJson = JSON.parse(parsedText);
    return NextResponse.json({
      success: true,
      data: parsedJson
    });

  } catch (err: any) {
    console.error('API route ocr-certificate crashed:', err);
    return NextResponse.json(
      { success: false, error: `เกิดข้อผิดพลาดในการรันระบบ OCR: ${err.message}` },
      { status: 500 }
    );
  }
}
