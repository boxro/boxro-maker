/**
 * 자동차 템플릿 매퍼
 * 분석된 차종을 3D 템플릿과 매핑합니다.
 */

import { CarShapeAnalysis } from './carShapeAnalyzer';

export interface CarTemplateMapping {
  templateType: string;
  confidence: number;
  adjustments: {
    scale: number;
    rotation: number;
    position: { x: number; y: number; z: number };
  };
}

export class CarTemplateMapper {
  /**
   * 분석 결과를 3D 템플릿과 매핑
   */
  static mapToTemplate(analysis: CarShapeAnalysis): CarTemplateMapping {
    console.log('🎯 템플릿 매핑 시작:', analysis);
    
    const mapping = this.selectBestTemplate(analysis);
    const adjustments = this.calculateAdjustments(analysis);
    
    const result: CarTemplateMapping = {
      templateType: mapping.templateType,
      confidence: mapping.confidence,
      adjustments
    };
    
    console.log('✅ 템플릿 매핑 완료:', result);
    return result;
  }

  /**
   * 최적의 템플릿 선택
   */
  private static selectBestTemplate(analysis: CarShapeAnalysis): { templateType: string; confidence: number } {
    const { carType, confidence, features } = analysis;
    
    // 차종별 템플릿 매핑
    const templateMap: Record<string, string> = {
      'sedan': 'sedan',
      'truck': 'truck', 
      'bus': 'bus',
      'suv': 'suv'
    };
    
    // 기본 템플릿 선택
    let templateType = templateMap[carType] || 'sedan';
    
    // 특징에 따른 세부 템플릿 조정
    if (carType === 'sedan') {
      // 세단의 경우 길이에 따라 타입 선택
      if (features.totalLength > features.totalHeight * 2.5) {
        templateType = 'sedan-type2'; // 긴 세단
      }
    } else if (carType === 'bus') {
      // 버스의 경우 형태에 따라 타입 선택
      if (features.cabinRatio > 0.8) {
        templateType = 'bus-type2'; // 긴 버스
      }
    }
    
    return {
      templateType,
      confidence: confidence * 0.9 // 템플릿 매핑으로 인한 신뢰도 조정
    };
  }

  /**
   * 3D 모델 조정값 계산
   */
  private static calculateAdjustments(analysis: CarShapeAnalysis): CarTemplateMapping['adjustments'] {
    const { features } = analysis;
    
    // 기본 스케일 계산 (그림 크기에 맞춰 조정)
    const baseScale = 1.0;
    const lengthScale = Math.min(features.totalLength / 200, 1.5); // 최대 1.5배
    const heightScale = Math.min(features.totalHeight / 150, 1.3); // 최대 1.3배
    
    const scale = baseScale * Math.min(lengthScale, heightScale);
    
    // 회전값 계산 (그림의 기울기에 따라)
    const rotation = 0; // 기본적으로 회전 없음
    
    // 위치 조정 (중앙 정렬)
    const position = {
      x: 0,
      y: 0,
      z: 0
    };
    
    return {
      scale,
      rotation,
      position
    };
  }

  /**
   * 차종별 기본 색상 매핑
   */
  static getDefaultColor(carType: string): string {
    const colorMap: Record<string, string> = {
      'sedan': '#FFB6C1',        // 밝은 분홍색
      'sedan-type2': '#FFB6C1',  // 밝은 분홍색
      'truck': '#98FB98',        // 밝은 연두색
      'bus': '#87CEEB',          // 밝은 하늘색
      'bus-type2': '#87CEEB',    // 밝은 하늘색
      'suv': '#DDA0DD',          // 밝은 연보라색
      'sports': '#FF6B6B'        // 밝은 빨간색
    };
    
    return colorMap[carType] || '#FFB6C1';
  }

  /**
   * 차종별 창문 패턴 매핑
   */
  static getWindowPattern(carType: string): string[] {
    const windowMap: Record<string, string[]> = {
      'sedan': ['front', 'rear'],
      'sedan-type2': ['front', 'rear'],
      'truck': ['front'],
      'bus': ['front', 'side1', 'side2', 'side3'],
      'bus-type2': ['front'],
      'suv': ['front', 'side1', 'side2'],
      'sports': ['front', 'rear']
    };
    
    return windowMap[carType] || ['front'];
  }

  /**
   * 차종별 바퀴 위치 매핑
   */
  static getWheelPositions(carType: string): { x: number; y: number; z: number }[] {
    const wheelMap: Record<string, { x: number; y: number; z: number }[]> = {
      'sedan': [
        { x: -2.1, y: 0.6, z: 1.25 },
        { x: -2.1, y: 0.6, z: -1.25 },
        { x: 2.1, y: 0.6, z: 1.25 },
        { x: 2.1, y: 0.6, z: -1.25 }
      ],
      'sedan-type2': [
        { x: -2.5, y: 0.6, z: 1.25 },
        { x: -2.5, y: 0.6, z: -1.25 },
        { x: 2.5, y: 0.6, z: 1.25 },
        { x: 2.5, y: 0.6, z: -1.25 }
      ],
      'truck': [
        { x: -1.5, y: 0.6, z: 1.25 },
        { x: -1.5, y: 0.6, z: -1.25 },
        { x: 2.5, y: 0.6, z: 1.25 },
        { x: 2.5, y: 0.6, z: -1.25 }
      ],
      'bus': [
        { x: -2.0, y: 0.6, z: 1.25 },
        { x: -2.0, y: 0.6, z: -1.25 },
        { x: 2.0, y: 0.6, z: 1.25 },
        { x: 2.0, y: 0.6, z: -1.25 }
      ],
      'bus-type2': [
        { x: -2.0, y: 0.6, z: 1.25 },
        { x: -2.0, y: 0.6, z: -1.25 },
        { x: 2.0, y: 0.6, z: 1.25 },
        { x: 2.0, y: 0.6, z: -1.25 }
      ],
      'suv': [
        { x: -2.0, y: 0.6, z: 1.25 },
        { x: -2.0, y: 0.6, z: -1.25 },
        { x: 2.0, y: 0.6, z: 1.25 },
        { x: 2.0, y: 0.6, z: -1.25 }
      ],
      'sports': [
        { x: -1.8, y: 0.4, z: 1.0 },
        { x: -1.8, y: 0.4, z: -1.0 },
        { x: 1.8, y: 0.4, z: 1.0 },
        { x: 1.8, y: 0.4, z: -1.0 }
      ]
    };
    
    return wheelMap[carType] || wheelMap['sedan'];
  }
}

/**
 * 편의 함수: 분석 결과를 템플릿으로 매핑
 */
export function mapAnalysisToTemplate(analysis: CarShapeAnalysis): CarTemplateMapping {
  return CarTemplateMapper.mapToTemplate(analysis);
}

