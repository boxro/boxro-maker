import { jsPDF } from 'jspdf';
import { Canvas } from 'fabric';

export const exportCanvasToPDF = (canvas: Canvas, title: string = 'Boxcar Design') => {
  // A4 사이즈 PDF 생성
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // 캔버스를 이미지로 변환
  const canvasDataURL = canvas.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: 2 // 고화질을 위한 배율
  });

  // PDF 페이지 크기
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // 여백 설정
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const contentHeight = pageHeight - (margin * 2);

  // 제목 추가
  pdf.setFontSize(16);
  pdf.text(title, margin, margin);
  
  // 캔버스 이미지의 비율 계산
  const canvasAspectRatio = canvas.width! / canvas.height!;
  
  let imageWidth = contentWidth;
  let imageHeight = contentWidth / canvasAspectRatio;
  
  // 높이가 페이지를 넘으면 높이를 기준으로 재계산
  if (imageHeight > contentHeight - 20) { // 제목 공간 확보
    imageHeight = contentHeight - 20;
    imageWidth = imageHeight * canvasAspectRatio;
  }

  // 이미지를 중앙에 배치
  const imageX = (pageWidth - imageWidth) / 2;
  const imageY = margin + 15; // 제목 아래 여백

  // PDF에 이미지 추가
  pdf.addImage(canvasDataURL, 'PNG', imageX, imageY, imageWidth, imageHeight);

  // 하단에 생성 정보 추가
  pdf.setFontSize(10);
  const date = new Date().toLocaleDateString('ko-KR');
  pdf.text(`Created with Boxro Maker - ${date}`, margin, pageHeight - 10);

  // PDF 다운로드
  const fileName = `${title.replace(/[^a-zA-Z0-9\u3131-\u3163\uac00-\ud7a3]/g, '_')}_${Date.now()}.pdf`;
  pdf.save(fileName);
};
