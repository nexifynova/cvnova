import { saveAs } from 'file-saver';

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
      body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; }
      h1 { font-size: 24pt; color: #333; }
      h2 { font-size: 16pt; color: #444; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
      h3 { font-size: 14pt; color: #222; }
      p { margin-bottom: 10px; }
      ul { margin-top: 5px; margin-bottom: 10px; }
      .avoid-break { page-break-inside: avoid; }
    </style>
  `;

  // Get the HTML content
  const content = element.innerHTML;

  // Combine styles and content
  const fullHtml = `
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
    // @ts-ignore (html-docx-js lacks proper types)
    const converted = window.htmlDocx.asBlob(fullHtml, { orientation: 'portrait', margins: { top: 720, right: 720, bottom: 720, left: 720 } });
    saveAs(converted, `${fileName}.docx`);
  } catch (error) {
    console.error("Word generation error:", error);
    alert("Failed to generate Word document. Please try PDF.");
  }
};

// Function to trigger print (for PDF)
export const downloadAsPDF = () => {
  window.print();
};