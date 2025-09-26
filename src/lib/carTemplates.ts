import * as THREE from 'three';

// 차종 타입 정의 (주의: 다른 차종 수정 시 혼동 방지)
// 꼬마세단: sedan (기본 세단)
// 큰세단: sedan-type2 (나중에 추가된 큰 세단) - 현재 타입에 없음
// 스포츠카: sports
// SUV: suv
// 빵빵트럭: truck (트럭)
// 통통버스: bus-type2 (둥근 버스) - 현재 타입에 없음
// 네모버스: bus (네모난 버스)
export type CarType = 'sedan' | 'truck' | 'bus' | 'suv' | 'sports';

// 꼬마세단(sedan): 기본 세단
export function createSedanShape(totalLength: number, totalHeight: number) {
  const sedanShape = new THREE.Shape();
  sedanShape.moveTo(-totalLength/2, 0);
  
  // 꼬마세단(sedan): 보닛과 트렁크 비율 증가, 캐빈 비율 감소
  const bonnetHeight = totalHeight * 0.4;   // 보닛 (더 높게)
  const cabinHeight = totalHeight * 0.84;    // 캐빈 (낮게)
  const trunkHeight = totalHeight * 0.5;    // 트렁크 (더 높게)
  
  // 보닛 (앞부분) - 더 강한 경사로 캐빈 쪽으로 높아짐
  sedanShape.lineTo(-totalLength/2, bonnetHeight);
  sedanShape.lineTo(-totalLength/4, bonnetHeight * 1.4); // 더 강한 경사
  
  // A필러 (앞유리) - 경사
  sedanShape.lineTo(-totalLength/10, cabinHeight);
  
  // 캐빈 지붕 - 트렁크 방향으로 더 길게
  sedanShape.lineTo(totalLength/6, cabinHeight);
  
  // C필러 (뒷유리) - 경사
  sedanShape.lineTo(totalLength/3.2, trunkHeight * 1.1); // 경사도 더 강하게
  
  // 트렁크 (뒷부분) - 더 길고 높게, 캐빈 쪽으로 경사
  sedanShape.lineTo(totalLength/2, trunkHeight);
  sedanShape.lineTo(totalLength/2, 0);
  sedanShape.closePath();
  return sedanShape;
}

// 큰세단(sedan-type2): 나중에 추가된 큰 세단
export function createSedanType2Shape(totalLength: number, totalHeight: number) {
  const sedanShape = new THREE.Shape();
  sedanShape.moveTo(-totalLength/2, 0);
  
  // 큰세단(sedan-type2): 꼬마세단과 동일한 함수 사용 (템플릿과 동일)
  const bonnetHeight = totalHeight * 0.4;   // 보닛 (더 높게)
  const cabinHeight = totalHeight * 0.84;    // 캐빈 (낮게)
  const trunkHeight = totalHeight * 0.5;    // 트렁크 (더 높게)
  
  // 보닛 (앞부분) - 더 강한 경사로 캐빈 쪽으로 높아짐
  sedanShape.lineTo(-totalLength/2, bonnetHeight);
  sedanShape.lineTo(-totalLength/4, bonnetHeight * 1.4); // 더 강한 경사
  
  // A필러 (앞유리) - 경사
  sedanShape.lineTo(-totalLength/10, cabinHeight);
  
  // 캐빈 지붕 - 트렁크 방향으로 더 길게
  sedanShape.lineTo(totalLength/6, cabinHeight);
  
  // C필러 (뒷유리) - 경사
  sedanShape.lineTo(totalLength/3.2, trunkHeight * 1.1); // 경사도 더 강하게
  
  // 트렁크 (뒷부분) - 더 길고 높게, 캐빈 쪽으로 경사
  sedanShape.lineTo(totalLength/2, trunkHeight);
  sedanShape.lineTo(totalLength/2, 0);
  sedanShape.closePath();
  return sedanShape;
}

// 빵빵트럭(truck): 트럭
export function createTruckShape(totalLength: number, totalHeight: number) {
  const truckShape = new THREE.Shape();
  truckShape.moveTo(-totalLength/2, 0);
  
  // 트럭: SUV 기반, SUV 뒷면이 트럭 앞면과 같음
  const bonnetHeight = totalHeight * 0.4;   // 보닛 (SUV와 동일)
  const cabinHeight = totalHeight * 0.84;   // 캐빈 (SUV와 동일)
  const bedHeight = totalHeight * 0.4;      // 베드 (높이 낮춤)
  
  // 앞면 - 보닛 비율 0 (보닛 없음)
  truckShape.lineTo(-totalLength/2, bonnetHeight);
  truckShape.lineTo(-totalLength/2, bonnetHeight); // 보닛 비율 0
  
  // A필러 - 경사도 줄임
  truckShape.lineTo(-totalLength/3, cabinHeight);
  
  // 캐빈 지붕 - 더더더더더더 줄임
  truckShape.lineTo(totalLength/500, cabinHeight);
  
  // 캐빈 뒷면 직각으로 떨어짐
  truckShape.lineTo(totalLength/500, bedHeight);          // 베드 시작
  truckShape.lineTo(totalLength/1.5, bedHeight);         // 베드 (길이 줄임)
  truckShape.lineTo(totalLength/1.5, 0);                 // 뒤
  truckShape.closePath();
  return truckShape;
}

export function createTruckType2Shape(totalLength: number, totalHeight: number) {
  const truckShape = new THREE.Shape();
  truckShape.moveTo(-totalLength/2, 0);
  
  // 트럭 타입2: 트럭과 동일하지만 높이가 낮음
  const bonnetHeight = totalHeight * 0.35;   // 보닛 (더 낮음)
  const cabinHeight = totalHeight * 0.75;   // 캐빈 (더 낮음)
  const bedHeight = totalHeight * 0.35;      // 베드 (더 낮음)
  
  // 앞면 - 보닛 비율 0 (보닛 없음)
  truckShape.lineTo(-totalLength/2, bonnetHeight);
  truckShape.lineTo(-totalLength/2, bonnetHeight); // 보닛 없음
  
  // A필러 - 경사도 줄임
  truckShape.lineTo(-totalLength/3, cabinHeight);
  
  // 캐빈 지붕 - 더더더더더더 줄임
  truckShape.lineTo(totalLength/500, cabinHeight);
  
  // 캐빈 뒷면 직각으로 떨어짐
  truckShape.lineTo(totalLength/500, bedHeight);          // 베드 시작
  truckShape.lineTo(totalLength/1.5, bedHeight);         // 베드 (길이 줄임)
  truckShape.lineTo(totalLength/1.5, 0);                 // 뒤
  truckShape.closePath();
  return truckShape;
}

// 네모버스(bus): 네모난 버스
export function createBusShape(totalLength: number, totalHeight: number) {
  const busShape = new THREE.Shape();
  busShape.moveTo(-totalLength/2, 0);
  
  // 버스: 트럭 기반, 캐빈을 쭉 늘려서 뒷면까지
  const bonnetHeight = totalHeight * 0.4;   // 보닛 (트럭과 동일)
  const cabinHeight = totalHeight * 0.84;   // 캐빈 (트럭과 동일)
  
  // 앞부분 - 트럭과 동일
  busShape.lineTo(-totalLength/2, bonnetHeight);
  busShape.lineTo(-totalLength/2, bonnetHeight); // 보닛 비율 0
  busShape.lineTo(-totalLength/3, cabinHeight); // A필러
  busShape.lineTo(totalLength/1.8, cabinHeight); // 캐빈 지붕 (배드 부분까지 쭉 늘림)
  
  // 뒷면 직각으로 끝까지
  busShape.lineTo(totalLength/1.8, 0);                   // 뒤
  busShape.closePath();
  return busShape;
}

// 통통버스(bus-type2): 둥근 버스
export function createBusType2Shape(totalLength: number, totalHeight: number) {
  const busShape = new THREE.Shape();
  busShape.moveTo(-totalLength/2, 0);
  
  // 버스 타입2: 트렁크 없이 지붕을 뒤로 쭉 늘림, 테일게이트와 맞닿음
  const bonnetHeight = totalHeight * 0.4;   // 보닛 (세단과 동일)
  const cabinHeight = totalHeight * 0.84;   // 캐빈 (세단과 동일)
  
  // 보닛 (앞부분) - 세단과 동일
  busShape.lineTo(-totalLength/2, bonnetHeight);
  busShape.lineTo(-totalLength/4, bonnetHeight * 1.4); // 세단과 동일한 경사
  
  // A필러 (앞유리) - 세단과 동일
  busShape.lineTo(-totalLength/10, cabinHeight);
  
  // 캐빈 지붕 - 버스는 뒤로 쭉 늘림 (트렁크 없음)
  busShape.lineTo(totalLength/2, cabinHeight); // 뒤로 쭉 늘림
  
  // 테일게이트 (뒷부분) - 지붕과 바로 연결
  busShape.lineTo(totalLength/2, 0); // 테일게이트와 맞닿음
  busShape.closePath();
  return busShape;
}

// SUV(suv): SUV
export function createSUVShape(totalLength: number, totalHeight: number) {
  const suvShape = new THREE.Shape();
  suvShape.moveTo(-totalLength/2, 0);
  
  // SUV: 버스 타입2 기반, 뒷 창문에 경사도 추가, 뒷부분은 직각
  const bonnetHeight = totalHeight * 0.4;   // 보닛 (세단과 동일)
  const cabinHeight = totalHeight * 0.84;   // 캐빈 (세단과 동일)
  
  // 보닛 (앞부분) - 세단과 동일
  suvShape.lineTo(-totalLength/2, bonnetHeight);
  suvShape.lineTo(-totalLength/4, bonnetHeight * 1.4); // 세단과 동일한 경사
  
  // A필러 (앞유리) - 세단과 동일
  suvShape.lineTo(-totalLength/10, cabinHeight);
  
  // 캐빈 지붕 - SUV는 뒤로 쭉 늘림 (트렁크 없음)
  suvShape.lineTo(totalLength/2.5, cabinHeight); // 뒤로 쭉 늘림
  
  // 뒷 창문 경사도 (C필러)
  suvShape.lineTo(totalLength/2, cabinHeight * 0.6); // 경사도 추가
  
  // 뒷부분 직각으로 바닥까지
  suvShape.lineTo(totalLength/2, 0); // 직각으로 바닥까지
  suvShape.closePath();
  return suvShape;
}

export function createCarShape(carType: CarType, totalLength: number, totalHeight: number) {
  switch (carType) {
    case 'sedan': // 꼬마세단(sedan)
      return createSedanShape(totalLength, totalHeight);
    case 'truck': // 빵빵트럭(truck)
      return createTruckShape(totalLength, totalHeight);
    case 'bus': // 네모버스(bus)
      return createBusShape(totalLength, totalHeight);
    case 'suv': // SUV(suv)
      return createSUVShape(totalLength, totalHeight);
    default:
      return createSedanShape(totalLength, totalHeight);
  }
}
// 드로잉 분석을 위한 타입 정의
export interface DrawingAnalysis {
  carType: CarType;
  confidence: number;
  boxes: {
    bonnet: boolean;
    cabin: boolean;
    trunk: boolean;
    bed?: boolean;
  };
  dimensions: {
    aspectRatio: number;
    width: number;
    height: number;
  };
  features: {
    hasHood: boolean;
    hasTrunk: boolean;
    hasBed: boolean;
    isLongCabin: boolean;
    frontSlope: number;
    rearSlope: number;
  };
}

// 고도화된 드로잉 분석 함수
export function analyzeDrawing(canvas: HTMLCanvasElement): DrawingAnalysis {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return getDefaultAnalysis();
  }

  const width = canvas.width;
  const height = canvas.height;
  const aspectRatio = width / height;
  
  // 이미지 데이터 분석
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // 그림이 있는지 확인
  let hasDrawing = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) { // 투명도가 255 미만이면 그림이 있음
      hasDrawing = true;
      break;
    }
  }
  
  if (!hasDrawing) {
    return getDefaultAnalysis();
  }

  // 수평 프로파일 분석 (각 x좌표에서 가장 높은 y값)
  const horizontalProfile = new Array(width).fill(0);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const index = (y * width + x) * 4;
      if (data[index + 3] < 255) { // 투명도가 255 미만이면 그림
        horizontalProfile[x] = Math.max(horizontalProfile[x], height - y);
      }
    }
  }

  // 수직 프로파일 분석 (각 y좌표에서 가장 왼쪽과 오른쪽 x값)
  const verticalProfile = new Array(height).fill({ left: width, right: 0 });
  for (let y = 0; y < height; y++) {
    let left = width;
    let right = 0;
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      if (data[index + 3] < 255) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
    verticalProfile[height - 1 - y] = { left, right };
  }

  // 특징 분석
  const features = analyzeFeatures(horizontalProfile, verticalProfile, width, height);
  
  // 차량 타입 결정
  const carType = determineCarType(features);
  
  // 신뢰도 계산
  const confidence = calculateConfidence(features, carType);
  
  // 박스 구조 결정
  const boxes = determineBoxes(features, carType);
  
  return {
    carType,
    confidence,
    boxes,
    dimensions: { aspectRatio, width, height },
    features
  };
}

// 특징 분석 함수
function analyzeFeatures(horizontalProfile: number[], verticalProfile: Array<{left: number, right: number}>, width: number, height: number) {
  // 보닛 존재 여부 (앞부분에 높은 부분이 있는지)
  const frontSection = Math.floor(width * 0.3);
  const frontMaxHeight = Math.max(...horizontalProfile.slice(0, frontSection));
  const overallMaxHeight = Math.max(...horizontalProfile);
  const hasHood = frontMaxHeight > overallMaxHeight * 0.7;

  // 트렁크 존재 여부 (뒷부분에 높은 부분이 있는지)
  const rearSection = Math.floor(width * 0.7);
  const rearMaxHeight = Math.max(...horizontalProfile.slice(rearSection));
  const hasTrunk = rearMaxHeight > overallMaxHeight * 0.6;

  // 베드 존재 여부 (뒷부분이 낮고 긴지) - 수정된 로직
  const frontWidth = verticalProfile[Math.floor(height * 0.3)].right - verticalProfile[Math.floor(height * 0.3)].left;
  const rearWidth = verticalProfile[Math.floor(height * 0.7)].right - verticalProfile[Math.floor(height * 0.7)].left;
  const hasBed = rearWidth > frontWidth * 1.2 && rearMaxHeight < overallMaxHeight * 0.5;

  // 긴 캐빈 여부 (중간 부분이 길고 높은지)
  const middleSection = horizontalProfile.slice(Math.floor(width * 0.3), Math.floor(width * 0.7));
  const middleHeight = Math.max(...middleSection);
  const isLongCabin = middleHeight > overallMaxHeight * 0.8 && middleSection.length > width * 0.3;

  // 앞쪽 경사도
  const frontSlope = calculateSlope(horizontalProfile, 0, Math.floor(width * 0.3));

  // 뒷쪽 경사도
  const rearSlope = calculateSlope(horizontalProfile, Math.floor(width * 0.7), width);

  return {
    hasHood,
    hasTrunk,
    hasBed,
    isLongCabin,
    frontSlope,
    rearSlope
  };
}

// 경사도 계산 함수
function calculateSlope(profile: number[], start: number, end: number): number {
  if (end - start < 2) return 0;
  
  const startHeight = profile[start];
  const endHeight = profile[end - 1];
  const distance = end - start;
  
  return (endHeight - startHeight) / distance;
}

// 차량 타입 결정 함수 - 개선된 로직
function determineCarType(features: any): CarType {
  // 네모버스(bus): 캐빈만 (보닛, 트렁크, 베드 없음, 긴 캐빈)
  if (!features.hasHood && !features.hasTrunk && !features.hasBed && features.isLongCabin) {
    return 'bus';
  }
  
  // 빵빵트럭(truck): 베드 존재 (보닛 없음, 베드 있음)
  if (!features.hasHood && features.hasBed) {
    return 'truck';
  }
  
  // 스포츠카(sports): 낮은 차체, 강한 경사 (앞/뒤 유리 기울기)
  if (features.hasHood && features.hasTrunk && !features.hasBed && 
      Math.abs(features.frontSlope) > 0.3 && Math.abs(features.rearSlope) > 0.3) {
    return 'sports';
  }
  
  // SUV(suv): 보닛 + 캐빈 (트렁크 없음, 베드 없음)
  if (features.hasHood && !features.hasTrunk && !features.hasBed) {
    return 'suv';
  }
  
  // 꼬마세단(sedan): 보닛 + 캐빈 + 트렁크
  if (features.hasHood && features.hasTrunk && !features.hasBed) {
    return 'sedan';
  }
  
  // 기본값: 가장 가능성이 높은 타입 (보닛이 있으면 SUV(suv), 없으면 꼬마세단(sedan))
  if (features.hasHood) {
    return 'suv';
  } else {
    return 'sedan';
  }
}

// 신뢰도 계산 함수 - 개선된 로직
function calculateConfidence(features: any, carType: CarType): number {
  let confidence = 0.3; // 기본 신뢰도 낮춤
  
  switch (carType) {
    case 'sedan': // 꼬마세단(sedan)
      if (features.hasHood) confidence += 0.25;
      if (features.hasTrunk) confidence += 0.25;
      if (!features.hasBed) confidence += 0.15;
      if (features.frontSlope > 0) confidence += 0.1; // 앞쪽 경사
      if (features.rearSlope < 0) confidence += 0.1; // 뒷쪽 경사
      break;
    case 'suv': // SUV(suv)
      if (features.hasHood) confidence += 0.25;
      if (!features.hasTrunk) confidence += 0.25;
      if (!features.hasBed) confidence += 0.15;
      if (features.frontSlope > 0) confidence += 0.1;
      if (Math.abs(features.rearSlope) < 0.1) confidence += 0.1; // 뒷쪽이 직각
      break;
    case 'truck': // 빵빵트럭(truck)
      if (!features.hasHood) confidence += 0.25;
      if (features.hasBed) confidence += 0.25;
      if (!features.hasTrunk) confidence += 0.15;
      if (features.rearSlope < 0) confidence += 0.1; // 뒷쪽 경사
      break;
    case 'bus': // 네모버스(bus)
      if (!features.hasHood) confidence += 0.25;
      if (!features.hasTrunk) confidence += 0.25;
      if (features.isLongCabin) confidence += 0.25;
      if (!features.hasBed) confidence += 0.15;
      break;
    case 'sports': // 스포츠카(sports)
      if (features.hasHood) confidence += 0.25;
      if (features.hasTrunk) confidence += 0.25;
      if (!features.hasBed) confidence += 0.15;
      if (Math.abs(features.frontSlope) > 0.3) confidence += 0.15; // 강한 앞쪽 경사
      if (Math.abs(features.rearSlope) > 0.3) confidence += 0.15; // 강한 뒷쪽 경사
      break;
  }
  
  return Math.min(confidence, 1.0);
}

// 박스 구조 결정 함수
function determineBoxes(features: any, carType: CarType) {
  switch (carType) {
    case 'sedan': // 꼬마세단(sedan)
      return {
        bonnet: features.hasHood,
        cabin: true,
        trunk: features.hasTrunk
      };
    case 'suv': // SUV(suv)
      return {
        bonnet: features.hasHood,
        cabin: true,
        trunk: false
      };
    case 'truck': // 빵빵트럭(truck)
      return {
        bonnet: false,
        cabin: true,
        trunk: false,
        bed: features.hasBed
      };
    case 'bus': // 네모버스(bus)
      return {
        bonnet: false,
        cabin: true,
        trunk: false
      };
    case 'sports': // 스포츠카(sports)
      return {
        bonnet: features.hasHood,
        cabin: true,
        trunk: features.hasTrunk
      };
    default:
      return {
        bonnet: false,
        cabin: true,
        trunk: false
      };
  }
}

// 기본 분석 결과
function getDefaultAnalysis(): DrawingAnalysis {
  return {
    carType: 'sedan',
    confidence: 0,
    boxes: {
      bonnet: false,
      cabin: false,
      trunk: false
    },
    dimensions: {
      aspectRatio: 1,
      width: 0,
      height: 0
    },
    features: {
      hasHood: false,
      hasTrunk: false,
      hasBed: false,
      isLongCabin: false,
      frontSlope: 0,
      rearSlope: 0
    }
  };
}

