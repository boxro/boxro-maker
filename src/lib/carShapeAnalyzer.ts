/**
 * 자동차 쉐입 분석기 - 단순화된 형태 분석
 * 그리기 캔버스에서 그린 그림을 분석하여 차종을 정확하게 분류합니다.
 */

export interface CarShapeAnalysis {
  carType: CarType;
  confidence: number;
  features: {
    aspectRatio: number;
    heightProfile: number[];
    widthProfile: number[];
    centerOfMass: { x: number; y: number };
    bounds: { x: number; y: number; width: number; height: number };
  };
  analysis: {
    aspectRatio: number;
    heightProfile: number[];
    widthProfile: number[];
    centerOfMass: { x: number; y: number };
    bounds: { x: number; y: number; width: number; height: number };
    classification: { carType: CarType; confidence: number };
  };
}

export type CarType = 'sedan' | 'suv' | 'truck' | 'bus' | 'sports';

export class CarShapeAnalyzer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context를 가져올 수 없습니다.');
    }
    this.ctx = ctx;
  }

  /**
   * 캔버스 비율 감지 (모바일 4:3 vs 데스크톱 16:9)
   */
  private getCanvasType(): 'mobile' | 'desktop' {
    const aspectRatio = this.canvas.width / this.canvas.height;
    const mobileRatio = 4/3; // 1.33
    const desktopRatio = 16/9; // 1.78
    
    // 4:3에 더 가까우면 모바일, 16:9에 더 가까우면 데스크톱
    const mobileDiff = Math.abs(aspectRatio - mobileRatio);
    const desktopDiff = Math.abs(aspectRatio - desktopRatio);
    
    return mobileDiff < desktopDiff ? 'mobile' : 'desktop';
  }

  /**
   * 메인 분석 함수 - 단순화된 분석
   */
  analyze(): CarShapeAnalysis {
    console.log('🚗 단순화된 자동차 쉐입 분석 시작...');
    console.log('📐 Canvas 크기:', this.canvas.width, 'x', this.canvas.height);
    console.log('🔍 분석 함수가 호출되었습니다 - 새로운 알고리즘 사용 중');
    
    try {
      // 1. 그려진 영역의 정확한 경계 찾기
      const drawingBounds = this.findDrawingBounds();
      console.log('📏 그려진 영역:', drawingBounds);
      
      if (drawingBounds.width === 0 || drawingBounds.height === 0) {
        console.log('⚠️ 그려진 내용이 없음, 기본값 반환');
        return this.getDefaultAnalysis();
      }
      
      // 2. 단순화된 형태 분석
      const shapeAnalysis = this.analyzeSimpleShape(drawingBounds);
      console.log('🔍 단순화된 형태 분석 결과:', shapeAnalysis);
      
      // 3. 차종별 특징 매칭
      const classification = this.classifyBySimpleShape(shapeAnalysis);
      console.log('🎯 최종 분류 결과:', classification);
      
      return classification;
    } catch (error) {
      console.error('❌ 분석 중 오류:', error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * 기본 분석 결과 반환
   */
  private getDefaultAnalysis(): CarShapeAnalysis {
    return {
      carType: 'sedan',
      confidence: 0.5,
      features: {
        aspectRatio: 2.0,
        heightProfile: [0.3, 0.8, 0.4],
        widthProfile: [1.0, 1.0, 1.0],
        centerOfMass: { x: 0, y: 0 },
        bounds: { x: 0, y: 0, width: 0, height: 0 }
      },
      analysis: {
        aspectRatio: 2.0,
        heightProfile: [0.3, 0.8, 0.4],
        widthProfile: [1.0, 1.0, 1.0],
        centerOfMass: { x: 0, y: 0 },
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        classification: { carType: 'sedan', confidence: 0.5 }
      }
    };
  }

  /**
   * 그려진 영역 찾기
   */
  private findDrawingBounds(): { x: number; y: number; width: number; height: number } {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const { data, width, height } = imageData;
    
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let hasDrawing = false;
    let pixelCount = 0;
    
    // 검은색 또는 어두운 픽셀 찾기 (그려진 부분)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const alpha = data[idx + 3];
        
        // 어두운 픽셀 (그려진 부분) 찾기
        if (alpha > 0 && r < 200 && g < 200 && b < 200) {
          hasDrawing = true;
          pixelCount++;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    console.log('🎨 그려진 픽셀 수:', pixelCount);
    
    return {
      x: minX,
      y: minY,
      width: hasDrawing ? maxX - minX : 0,
      height: hasDrawing ? maxY - minY : 0
    };
  }

  /**
   * 단순화된 형태 분석
   */
  private analyzeSimpleShape(bounds: { x: number; y: number; width: number; height: number }) {
    const imageData = this.ctx.getImageData(bounds.x, bounds.y, bounds.width, bounds.height);
    const { data, width, height } = imageData;
    
    console.log('🔍 단순화된 형태 분석 시작:', { width, height });
    
    // 1. 종횡비 계산
    const aspectRatio = bounds.width / bounds.height;
    console.log('📐 종횡비:', aspectRatio);
    
    // 2. 높이 프로파일 분석 (3구간: 앞-중간-뒤)
    const heightProfile = this.analyzeHeightProfileSimple(data, width, height);
    console.log('📊 높이 프로파일 (3구간):', heightProfile);
    
    // 3. 너비 프로파일 분석 (3구간: 상-중-하)
    const widthProfile = this.analyzeWidthProfileSimple(data, width, height);
    console.log('📊 너비 프로파일 (3구간):', widthProfile);
    
    // 4. 중심점 계산
    const centerOfMass = this.calculateCenterOfMass(data, width, height);
    console.log('📍 중심점:', centerOfMass);
    
    return {
      aspectRatio,
      heightProfile,
      widthProfile,
      centerOfMass,
      bounds
    };
  }

  /**
   * 새로운 단계별 특징 확인 방식으로 분류 (캔버스 비율 고려)
   */
  private classifyByFeatures(aspectRatio: number, frontHeight: number, middleHeight: number, rearHeight: number, avgHeight: number): {carType: CarType, confidence: number} {
    const canvasType = this.getCanvasType();
    console.log('🎯 단계별 특징 확인 분류 시작:', { canvasType, aspectRatio });
    
    // 1단계: 트럭 확인 (가장 명확한 특징)
    if (this.isTruck(frontHeight, middleHeight, rearHeight, canvasType)) {
      console.log('🚛 트럭으로 분류됨');
      return { carType: 'truck', confidence: 0.9 };
    }
    
    // 2단계: 버스 확인
    if (this.isBus(aspectRatio, frontHeight, middleHeight, rearHeight, avgHeight, canvasType)) {
      console.log('🚌 버스로 분류됨');
      return { carType: 'bus', confidence: 0.9 };
    }
    
    // 3단계: 스포츠카 확인 (낮은 차체, 긴 앞부분)
    if (this.isSportsCar(aspectRatio, frontHeight, middleHeight, rearHeight, avgHeight, canvasType)) {
      console.log('🏎️ 스포츠카로 분류됨');
      return { carType: 'sports', confidence: 0.85 };
    }
    
    // 4단계: 세단 vs SUV 구분
    if (this.isSedan(aspectRatio, frontHeight, middleHeight, rearHeight, avgHeight, canvasType)) {
      console.log('🚗 세단으로 분류됨');
      return { carType: 'sedan', confidence: 0.8 };
    } else if (this.isSUV(aspectRatio, frontHeight, middleHeight, rearHeight, avgHeight, canvasType)) {
      console.log('🚙 SUV로 분류됨');
      return { carType: 'suv', confidence: 0.8 };
    } else {
      // 명확하지 않은 경우 기본값으로 세단
      console.log('🚗 명확하지 않아 세단으로 분류됨');
      return { carType: 'sedan', confidence: 0.6 };
    }
  }

  /**
   * 트럭 판별: 2박스 구조 (캐빈+베드), 캐빈이 높고 베드가 뒤까지 연결
   */
  private isTruck(frontHeight: number, middleHeight: number, rearHeight: number, canvasType: 'mobile' | 'desktop'): boolean {
    const frontRearRatio = frontHeight / rearHeight;
    const rearMiddleRatio = rearHeight / middleHeight;
    const frontMiddleRatio = frontHeight / middleHeight;
    
    console.log('🚛 트럭 판별:', { frontRearRatio, rearMiddleRatio, frontMiddleRatio, canvasType });
    
    // 트럭의 핵심 특징: 2박스 구조 (캐빈+베드)
    // 캔버스 비율에 따라 기준 조정
    const minFrontRearRatio = canvasType === 'mobile' ? 1.4 : 1.5; // 모바일에서는 조금 더 관대하게
    
    return frontRearRatio >= minFrontRearRatio;
  }

  /**
   * 버스 판별: 1박스 구조, 전체가 하나의 덩어리로 앞뒤 높이 거의 동일
   */
  private isBus(aspectRatio: number, frontHeight: number, middleHeight: number, rearHeight: number, avgHeight: number, canvasType: 'mobile' | 'desktop'): boolean {
    const heightDifference = Math.abs(frontHeight - rearHeight);
    const heightSimilarity = heightDifference / middleHeight;
    const frontRearRatio = Math.min(frontHeight, rearHeight) / Math.max(frontHeight, rearHeight);
    
    console.log('🚌 버스 판별:', { aspectRatio, heightSimilarity, frontRearRatio, avgHeight, canvasType });
    
    // 버스의 핵심 특징: 1박스 구조 (전체가 하나의 덩어리)
    // 캔버스 비율에 따라 기준 조정
    const maxHeightSimilarity = canvasType === 'mobile' ? 0.12 : 0.10; // 모바일에서는 조금 더 관대하게
    const minFrontRearRatio = canvasType === 'mobile' ? 0.85 : 0.90;
    const minAvgHeight = canvasType === 'mobile' ? 80 : 100; // 모바일에서는 더 작은 캔버스이므로 기준 낮춤
    
    return heightSimilarity < maxHeightSimilarity && frontRearRatio >= minFrontRearRatio && avgHeight > minAvgHeight &&
           !(middleHeight > frontHeight && middleHeight > rearHeight); // 세단과 구분
  }

  /**
   * 세단 판별: 3박스 구조 (보닛+캐빈+트렁크), 캐빈이 가장 높고 큼
   */
  private isSedan(aspectRatio: number, frontHeight: number, middleHeight: number, rearHeight: number, avgHeight: number, canvasType: 'mobile' | 'desktop'): boolean {
    const rearFrontRatio = rearHeight / frontHeight;
    const rearMiddleRatio = rearHeight / middleHeight;
    const frontMiddleRatio = frontHeight / middleHeight;
    
    console.log('🚗 세단 판별:', { aspectRatio, rearFrontRatio, rearMiddleRatio, frontMiddleRatio, avgHeight, canvasType });
    
    // 세단의 핵심 특징: 3박스 구조 (보닛+캐빈+트렁크)
    // 캔버스 비율에 따라 기준 조정
    const maxHeightDifference = canvasType === 'mobile' ? 0.30 : 0.25; // 모바일에서는 조금 더 관대하게
    const maxRearMiddleRatio = canvasType === 'mobile' ? 0.90 : 0.95; // 모바일에서는 조금 더 관대하게
    
    return middleHeight > frontHeight && middleHeight > rearHeight &&
           Math.abs(frontHeight - rearHeight) / middleHeight < maxHeightDifference &&
           rearMiddleRatio < maxRearMiddleRatio; // 뒤가 중간보다 낮음 (트렁크 특징)
  }

  /**
   * 스포츠카 판별: 낮은 차체, 긴 앞부분, 짧은 캐빈
   */
  private isSportsCar(aspectRatio: number, frontHeight: number, middleHeight: number, rearHeight: number, avgHeight: number, canvasType: 'mobile' | 'desktop'): boolean {
    const frontMiddleRatio = frontHeight / middleHeight;
    const rearMiddleRatio = rearHeight / middleHeight;
    const frontRearRatio = frontHeight / rearHeight;
    const heightVariation = Math.abs(frontHeight - rearHeight) / avgHeight;
    
    console.log('🏎️ 스포츠카 판별:', { aspectRatio, frontMiddleRatio, rearMiddleRatio, frontRearRatio, heightVariation, avgHeight, canvasType });
    
    // 스포츠카의 핵심 특징: 낮은 차체, 긴 앞부분, 짧은 캐빈
    // 캔버스 비율에 따라 기준 조정
    const maxHeightVariation = canvasType === 'mobile' ? 0.15 : 0.12; // 높이 변화가 적음 (낮고 일정한 차체)
    const minFrontMiddleRatio = canvasType === 'mobile' ? 0.85 : 0.90; // 앞이 중간보다 낮음 (낮은 보닛)
    const maxRearMiddleRatio = canvasType === 'mobile' ? 0.90 : 0.85; // 뒤가 중간보다 낮음 (낮은 트렁크)
    const maxAvgHeight = canvasType === 'mobile' ? 120 : 150; // 전체적으로 낮은 차체
    
    return heightVariation < maxHeightVariation && // 높이 변화가 적음
           frontMiddleRatio >= minFrontMiddleRatio && // 앞이 중간보다 낮음
           rearMiddleRatio <= maxRearMiddleRatio && // 뒤가 중간보다 낮음
           avgHeight < maxAvgHeight; // 전체적으로 낮은 차체
  }

  /**
   * SUV 판별: 2박스 구조 (보닛+캐빈), 캐빈이 뒤까지 연결됨
   */
  private isSUV(aspectRatio: number, frontHeight: number, middleHeight: number, rearHeight: number, avgHeight: number, canvasType: 'mobile' | 'desktop'): boolean {
    const rearFrontRatio = rearHeight / frontHeight;
    const rearMiddleRatio = rearHeight / middleHeight;
    const frontMiddleRatio = frontHeight / middleHeight;
    
    console.log('🚙 SUV 판별:', { aspectRatio, rearFrontRatio, rearMiddleRatio, frontMiddleRatio, avgHeight, canvasType });
    
    // SUV의 핵심 특징: 2박스 구조 (보닛+캐빈)
    // 캔버스 비율에 따라 기준 조정
    const minRearMiddleRatio = canvasType === 'mobile' ? 0.90 : 0.95; // 모바일에서는 조금 더 관대하게
    const minRearFrontRatio = canvasType === 'mobile' ? 1.10 : 1.15; // 모바일에서는 조금 더 관대하게
    
    return frontHeight < middleHeight && 
           rearMiddleRatio >= minRearMiddleRatio && // 뒤가 중간과 비슷하거나 높음
           rearFrontRatio >= minRearFrontRatio; // 뒤가 앞보다 더 높음
  }

  /**
   * 단순화된 높이 프로파일 분석 (3구간)
   */
  private analyzeHeightProfileSimple(data: Uint8ClampedArray, width: number, height: number): number[] {
    const segments = 3;
    const segmentWidth = Math.floor(width / segments);
    const heights = [];
    
    for (let i = 0; i < segments; i++) {
      let maxHeight = 0;
      const startX = i * segmentWidth;
      const endX = Math.min((i + 1) * segmentWidth, width);
      
      for (let x = startX; x < endX; x++) {
        let topY = height;
        let bottomY = 0;
        
        // 위에서 아래로 스캔하여 첫 번째 픽셀 찾기
        for (let y = 0; y < height; y++) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const alpha = data[idx + 3];
          
          if (alpha > 0 && r < 200 && g < 200 && b < 200) {
            topY = y;
            break;
          }
        }
        
        // 아래에서 위로 스캔하여 마지막 픽셀 찾기
        for (let y = height - 1; y >= 0; y--) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const alpha = data[idx + 3];
          
          if (alpha > 0 && r < 200 && g < 200 && b < 200) {
            bottomY = y;
            break;
          }
        }
        
        const columnHeight = bottomY - topY + 1;
        maxHeight = Math.max(maxHeight, columnHeight);
      }
      
      heights.push(maxHeight);
    }
    
    return heights;
  }

  /**
   * 단순화된 너비 프로파일 분석 (3구간)
   */
  private analyzeWidthProfileSimple(data: Uint8ClampedArray, width: number, height: number): number[] {
    const segments = 3;
    const segmentHeight = Math.floor(height / segments);
    const widths = [];
    
    for (let i = 0; i < segments; i++) {
      let maxWidth = 0;
      const startY = i * segmentHeight;
      const endY = Math.min((i + 1) * segmentHeight, height);
      
      for (let y = startY; y < endY; y++) {
        let leftX = width;
        let rightX = 0;
        
        // 왼쪽에서 오른쪽으로 스캔하여 첫 번째 픽셀 찾기
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const alpha = data[idx + 3];
          
          if (alpha > 0 && r < 200 && g < 200 && b < 200) {
            leftX = x;
            break;
          }
        }
        
        // 오른쪽에서 왼쪽으로 스캔하여 마지막 픽셀 찾기
        for (let x = width - 1; x >= 0; x--) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const alpha = data[idx + 3];
          
          if (alpha > 0 && r < 200 && g < 200 && b < 200) {
            rightX = x;
            break;
          }
        }
        
        const rowWidth = rightX - leftX + 1;
        maxWidth = Math.max(maxWidth, rowWidth);
      }
      
      widths.push(maxWidth);
    }
    
    return widths;
  }

  /**
   * 중심점 계산
   */
  private calculateCenterOfMass(data: Uint8ClampedArray, width: number, height: number): { x: number; y: number } {
    let sumX = 0;
    let sumY = 0;
    let pixelCount = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const alpha = data[idx + 3];
        
        if (alpha > 0 && r < 200 && g < 200 && b < 200) {
          sumX += x;
          sumY += y;
          pixelCount++;
        }
      }
    }
    
    if (pixelCount === 0) return { x: 0.5, y: 0.5 };
    
    return {
      x: sumX / pixelCount / width,
      y: sumY / pixelCount / height
    };
  }

  /**
   * 단순화된 차종 분류
   */
  private classifyBySimpleShape(shapeAnalysis: any): CarShapeAnalysis {
    const { aspectRatio, heightProfile, widthProfile, centerOfMass, bounds } = shapeAnalysis;
    const [frontHeight, middleHeight, rearHeight] = heightProfile;
    const [topWidth, middleWidth, bottomWidth] = widthProfile;
    
    console.log('🔍 분류용 데이터:', {
      aspectRatio,
      frontHeight,
      middleHeight,
      rearHeight,
      topWidth,
      middleWidth,
      bottomWidth,
      centerOfMass
    });
    
    // 새로운 단계별 특징 확인 방식으로 분류
    const avgHeight = (frontHeight + middleHeight + rearHeight) / 3;
    const result = this.classifyByFeatures(aspectRatio, frontHeight, middleHeight, rearHeight, avgHeight);
    
    console.log('🎯 최종 분류 결과:', result);
    
    return {
      carType: result.carType,
      confidence: result.confidence,
      features: {
        aspectRatio,
        heightProfile,
        widthProfile,
        centerOfMass,
        bounds
      },
      analysis: {
        aspectRatio,
        heightProfile,
        widthProfile,
        centerOfMass,
        bounds,
        classification: result
      }
    };
  }





}

/**
 * 편의 함수: Canvas에서 자동차 쉐입 분석
 */
export function analyzeCarShape(canvas: HTMLCanvasElement): CarShapeAnalysis {
  console.log('🚗 analyzeCarShape 함수 호출됨 - 새로운 알고리즘 사용');
  console.log('📐 Canvas 요소:', canvas);
  console.log('📐 Canvas 크기:', canvas.width, 'x', canvas.height);
  console.log('🔍 함수 시작 - 이 로그가 보이면 새로운 코드가 실행되고 있습니다');
  
  // Canvas가 실제로 그려진 내용이 있는지 확인
  const tempCtx = canvas.getContext('2d');
  if (!tempCtx) {
    console.error('❌ Canvas context를 가져올 수 없음');
    return {
      carType: 'sedan',
      confidence: 0.1,
      features: {
        aspectRatio: 1.5,
        heightProfile: [0, 0, 0, 0, 0, 0, 0],
        widthProfile: [0, 0, 0, 0, 0],
        centerOfMass: { x: 0, y: 0 },
        bounds: { x: 0, y: 0, width: 0, height: 0 }
      },
      analysis: {
        aspectRatio: 1.5,
        heightProfile: [0, 0, 0, 0, 0, 0, 0],
        widthProfile: [0, 0, 0, 0, 0],
        centerOfMass: { x: 0, y: 0 },
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        classification: { carType: 'sedan', confidence: 0.1 }
      }
    };
  }
  
  // Canvas 내용을 임시로 확인
  const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  let nonWhitePixels = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];
    
    // 흰색이 아니고 투명하지 않은 픽셀 찾기
    if (alpha > 0 && !(r > 240 && g > 240 && b > 240)) {
      nonWhitePixels++;
    }
  }
  
  console.log('🎨 Canvas 픽셀 분석:', {
    totalPixels: data.length / 4,
    nonWhitePixels,
    percentage: (nonWhitePixels / (data.length / 4)) * 100
  });
  
  // 캔버스 크기에 비례한 최소 픽셀 수 계산
  const totalPixels = canvas.width * canvas.height;
  const minPixelThreshold = Math.max(100, Math.floor(totalPixels * 0.001)); // 전체 픽셀의 0.1% 또는 최소 100개
  
  console.log('📊 픽셀 수 기준:', {
    totalPixels,
    minPixelThreshold,
    nonWhitePixels,
    canvasSize: `${canvas.width}x${canvas.height}`
  });
  
  if (nonWhitePixels < minPixelThreshold) {
    console.log('⚠️ 그려진 내용이 거의 없음, 기본값 반환');
    return {
      carType: 'sedan',
      confidence: 0.1,
      features: {
        aspectRatio: 1.5,
        heightProfile: [0, 0, 0, 0, 0, 0, 0],
        widthProfile: [0, 0, 0, 0, 0],
        centerOfMass: { x: 0, y: 0 },
        bounds: { x: 0, y: 0, width: canvas.width, height: canvas.height }
      },
      analysis: {
        aspectRatio: 1.5,
        heightProfile: [0, 0, 0, 0, 0, 0, 0],
        widthProfile: [0, 0, 0, 0, 0],
        centerOfMass: { x: 0, y: 0 },
        bounds: { x: 0, y: 0, width: canvas.width, height: canvas.height },
        classification: { carType: 'sedan', confidence: 0.1 }
      }
    };
  }
  
  const analyzer = new CarShapeAnalyzer(canvas);
  return analyzer.analyze();
}
