import { saveAs } from 'file-saver';
import htmlDocx from 'html-docx-js/dist/html-docx';

// Function to download HTML as Word Document
export const downloadAsWord = (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    alert("Preview not found for download.");
    return;
  }

  // Basic styling for Word
  const styles = `
    <style>
      @page { size: A4; margin: 0.75in; }
      body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #222; }
      h1 { font-size: 22pt; color: #111; margin-bottom: 6pt; }
      h2 { font-size: 14pt; color: #333; margin-top: 16pt; border-bottom: 1px solid #ccc; padding-bottom: 4pt; }
      h3 { font-size: 12pt; color: #222; margin-top: 10pt; }
      p { margin-bottom: 8pt; }
      ul { margin-top: 4pt; margin-bottom: 8pt; padding-left: 18pt; }
      li { margin-bottom: 3pt; }
      .avoid-break { page-break-inside: avoid; }
      table { border-collapse: collapse; width: 100%; }
    </style>
  `;

  // Get the HTML content
  const content = element.innerHTML;

  // Combine styles and content
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

  // Convert to blob and download
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

// Function to trigger print (for PDF)
export const downloadAsPDF = () => {
  window.print();
};