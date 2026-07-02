import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

/**
 * Generates a Word document (.docx) by filling a template with dynamic data.
 * Works entirely client-side.
 * 
 * @param templatePath The URL/path to the template file in public folder (e.g. '/templates/ตารางกำหนดการอบรม.docx')
 * @param data The JSON data containing placeholder keys and their replacement values.
 * @param outputFilename The output name of the file to save (e.g. 'ตารางกำหนดการอบรม.docx')
 */
export async function generateDocx(templatePath: string, data: any, outputFilename: string): Promise<boolean> {
  try {
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch template at ${templatePath}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    
    // Dynamically import docxtemplater to prevent Next.js SSR build issues
    const Docxtemplater = (await import('docxtemplater')).default;
    
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: '{{',
        end: '}}',
      },
    });
    
    doc.render(data);
    
    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    
    saveAs(out, outputFilename);
    return true;
  } catch (error) {
    console.error('Error generating DOCX document:', error);
    throw error;
  }
}
