import { saveAs } from 'file-saver';
import htmlDocx from 'html-docx-js/dist/html-docx';

export const downloadAsWord = (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    alert("Preview not found for download.");
    return;
  }

  const styles = `
    <style>
      @page { size: A4; margin: 0.5in; }
      body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #222; }
      h1 { font-size: 24pt; color: #111; margin-bottom: 8pt; font-weight: bold; }
      h2 { font-size: 14pt; color: #333; margin-top: 16pt; margin-bottom: 8pt; border-bottom: 1px solid #ccc; padding-bottom: 4pt; text-transform: uppercase; }
      h3 { font-size: 12pt; color: #222; margin-top: 10pt; margin-bottom: 4pt; }
      p { margin-bottom: 6pt; }
      ul { margin-top: 4pt; margin-bottom: 8pt; padding-left: 20pt; }
      li { margin-bottom: 2pt; }
      .avoid-break { page-break-inside: avoid; }
      table { border-collapse: collapse; width: 100%; }
      .flex { display: flex; }
      .grid { display: block; }
    </style>
  `;

  const content = element.innerHTML;

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${fileName}</title>
        ${styles}
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;

  try {
    const converted = htmlDocx.asBlob(fullHtml, {
      orientation: 'portrait',
      margins: { top: 720, right: 720, bottom: 720, left: 720 },
    });
    saveAs(converted, `${fileName}.docx`);
  } catch (error) {
    console.error("Word generation error:", error);
    alert("Failed to generate Word document. Please try PDF instead.");
  }
};

// PDF ke liye ab window.print use hoga jo kabhi hang nahi hota
export const downloadAsPDF = (elementId?: string, fileName?: string) => {
  window.print();
};