'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, Rect, Circle as FabricCircle, Line } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { exportCanvasToPDF } from '@/lib/pdfExport';
import { 
  Square, 
  Circle, 
  Save, 
  Download, 
  Trash2, 
  Copy, 
  RotateCcw,
  ZoomIn,
  ZoomOut,
  FileText
} from 'lucide-react';

interface CanvasEditorProps {
  onSave?: (canvasData: string) => void;
  initialData?: string;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ onSave, initialData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any | null>(null);

  useEffect(() => {
    console.log('CanvasEditor useEffect 실행됨', { canvasRef: canvasRef.current, canvas });
    if (canvasRef.current && !canvas) {
      console.log('새 캔버스 생성 중...');
      const fabricCanvas = new Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: 'white',
      });
      console.log('Fabric Canvas 생성됨:', fabricCanvas);

      // 그리드 추가
      const gridSize = 20;
      const grid = [];

      // 세로선
      for (let i = 0; i <= fabricCanvas.width! / gridSize; i++) {
        const line = new Line([i * gridSize, 0, i * gridSize, fabricCanvas.height!], {
          stroke: '#e0e0e0',
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        grid.push(line);
      }

      // 가로선
      for (let i = 0; i <= fabricCanvas.height! / gridSize; i++) {
        const line = new Line([0, i * gridSize, fabricCanvas.width!, i * gridSize], {
          stroke: '#e0e0e0',
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        grid.push(line);
      }

      // 그리드를 캔버스에 추가
      grid.forEach(line => {
        fabricCanvas.add(line);
        // 그리드를 맨 뒤로 보내기
        try {
          fabricCanvas.sendObjectToBack(line);
        } catch (error) {
          console.log('sendObjectToBack 에러:', error);
          // 대안: 그리드를 비활성화하고 뒤로 보내기
          line.moveTo(0);
        }
      });
      
      console.log('그리드 추가 완료, 총 객체 수:', fabricCanvas.getObjects().length);

      // 선택 이벤트 처리 (Fabric.js v6 방식)
      fabricCanvas.on('selection:created', (e: any) => {
        const activeObject = fabricCanvas.getActiveObject();
        setSelectedObject(activeObject);
      });

      fabricCanvas.on('selection:updated', (e: any) => {
        const activeObject = fabricCanvas.getActiveObject();
        setSelectedObject(activeObject);
      });

      fabricCanvas.on('selection:cleared', () => {
        setSelectedObject(null);
      });

      // 초기 데이터 로드
      if (initialData) {
        fabricCanvas.loadFromJSON(initialData, () => {
          fabricCanvas.renderAll();
        });
      }

      setCanvas(fabricCanvas);
      console.log('캔버스 상태 설정 완료');

      return () => {
        console.log('캔버스 정리 중...');
        fabricCanvas.dispose();
      };
    }
  }, [canvas, initialData]);

  // 도형 추가 함수들
  const addRectangle = () => {
    console.log('addRectangle 호출됨, canvas:', canvas);
    if (!canvas) {
      console.log('canvas가 없습니다!');
      return;
    }

    const rect = new Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 80,
      fill: 'rgba(255, 0, 0, 0.1)', // 임시로 반투명 빨간색으로 테스트
      stroke: '#333',
      strokeWidth: 2,
    });

    console.log('사각형 생성됨:', rect);
    console.log('캔버스에 추가 전 객체 수:', canvas.getObjects().length);
    
    canvas.add(rect);
    console.log('캔버스에 추가 후 객체 수:', canvas.getObjects().length);
    
    canvas.setActiveObject(rect);
    canvas.renderAll();
    console.log('사각형 추가 완료, 활성 객체:', canvas.getActiveObject());
  };

  const addCircle = () => {
    console.log('addCircle 호출됨, canvas:', canvas);
    if (!canvas) {
      console.log('canvas가 없습니다!');
      return;
    }

    const circle = new FabricCircle({
      left: 150,
      top: 150,
      radius: 50,
      fill: 'rgba(0, 0, 255, 0.1)', // 임시로 반투명 파란색으로 테스트
      stroke: '#333',
      strokeWidth: 2,
    });

    console.log('원 생성됨:', circle);
    console.log('캔버스에 추가 전 객체 수:', canvas.getObjects().length);
    
    canvas.add(circle);
    console.log('캔버스에 추가 후 객체 수:', canvas.getObjects().length);
    
    canvas.setActiveObject(circle);
    canvas.renderAll();
    console.log('원 추가 완료, 활성 객체:', canvas.getActiveObject());
  };

  // 편집 기능들
  const deleteSelected = () => {
    if (!canvas || !selectedObject) return;
    canvas.remove(selectedObject);
    canvas.renderAll();
  };

  const duplicateSelected = async () => {
    if (!canvas || !selectedObject) return;
    
    try {
      const cloned = await selectedObject.clone();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    } catch (error) {
      console.error('복사 중 오류 발생:', error);
    }
  };

  const clearCanvas = () => {
    if (!canvas) return;
    
    // 모든 객체를 제거 (그리드 제외)
    const objects = canvas.getObjects();
    objects.forEach(obj => {
      // 그리드 라인이 아닌 객체만 제거
      if (obj.selectable !== false) {
        canvas.remove(obj);
      }
    });
    
    canvas.backgroundColor = 'white';
    canvas.renderAll();
  };

  // 줌 기능
  const zoomIn = () => {
    console.log('zoomIn 호출됨, canvas:', canvas);
    if (!canvas) return;
    const zoom = canvas.getZoom();
    const newZoom = Math.min(zoom * 1.1, 3);
    canvas.setZoom(newZoom);
    canvas.renderAll();
    console.log('줌 인:', zoom, '->', newZoom);
  };

  const zoomOut = () => {
    console.log('zoomOut 호출됨, canvas:', canvas);
    if (!canvas) return;
    const zoom = canvas.getZoom();
    const newZoom = Math.max(zoom * 0.9, 0.1);
    canvas.setZoom(newZoom);
    canvas.renderAll();
    console.log('줌 아웃:', zoom, '->', newZoom);
  };

  // 저장 기능
  const handleSave = () => {
    if (!canvas || !onSave) return;
    const canvasData = JSON.stringify(canvas.toJSON());
    onSave(canvasData);
  };

  // 이미지 다운로드
  const downloadAsImage = () => {
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    
    const link = document.createElement('a');
    link.download = `boxcar-design-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF 다운로드
  const downloadAsPDF = () => {
    if (!canvas) return;
    exportCanvasToPDF(canvas, 'My Boxcar Design');
  };

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedObject) {
        deleteSelected();
      }
      if (e.key === 'Escape') {
        canvas?.discardActiveObject();
        canvas?.renderAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject, canvas]);

  return (
    <div className="flex h-full">
      {/* 도구 패널 */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">도형 추가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={addRectangle}
            >
              <Square className="w-4 h-4 mr-2" />
              사각형
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={addCircle}
            >
              <Circle className="w-4 h-4 mr-2" />
              원
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">편집</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={duplicateSelected}
              disabled={!selectedObject}
            >
              <Copy className="w-4 h-4 mr-2" />
              복사
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={deleteSelected}
              disabled={!selectedObject}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              삭제
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={clearCanvas}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              전체 지우기
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">보기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={zoomIn}
            >
              <ZoomIn className="w-4 h-4 mr-2" />
              확대
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={zoomOut}
            >
              <ZoomOut className="w-4 h-4 mr-2" />
              축소
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">저장 & 내보내기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {onSave && (
              <Button
                className="w-full justify-start"
                onClick={handleSave}
              >
                <Save className="w-4 h-4 mr-2" />
                저장
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={downloadAsPDF}
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF 다운로드
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={downloadAsImage}
            >
              <Download className="w-4 h-4 mr-2" />
              이미지 다운로드
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 캔버스 영역 */}
      <div className="flex-1 bg-gray-50 p-4 overflow-auto">
        <div className="bg-white rounded-lg shadow-sm p-4 inline-block">
          <canvas ref={canvasRef} className="border border-gray-200" />
        </div>
      </div>
    </div>
  );
};
