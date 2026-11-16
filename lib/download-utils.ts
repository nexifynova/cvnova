export const downloadAsPDF = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) return alert("Preview not found");

  try {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    // Original element ko safe rakhne ke liye clone banate hain
    const clone = element.cloneNode(true) as HTMLElement;
    document.body.appendChild(clone);
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.width = '210mm'; 

    const canvas = await html2canvas(clone, { scale: 2, useCORS: true });
    document.body.removeChild(clone);

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("PDF generation error:", error);
    alert("Direct PDF fail ho gaya. Print window khol rahe hain...");
    window.print();
  }
};