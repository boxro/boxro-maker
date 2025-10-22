'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface ThreeDRendererProps {
  carType: string;
  drawingAnalysis?: any;
  width?: number;
  height?: number;
  fill?: boolean;
  scale?: number;
  // 꾸미기 색상 정보
  carColor?: string;
  roofColor?: string;
  headlightColor?: string;
  taillightColor?: string;
  selectedBadge?: string | null;
  selectedPlate?: string | null;
  // 헤드램프 타입
  selectedHeadlight?: string | null;
  // 휠 타입
  selectedWheel?: string | null;
  // 그릴 타입
  selectedGrille?: string | null;
  // 리어램프 타입
  selectedTaillight?: string | null;
  // 모바일 여부
  isMobile?: boolean;
}

const ThreeDRenderer = forwardRef<{ getRenderer: () => THREE.WebGLRenderer | null }, ThreeDRendererProps>(({ carType, drawingAnalysis, width, height, fill, scale = 1.0, carColor, roofColor, headlightColor, taillightColor, selectedBadge, selectedPlate, selectedHeadlight, selectedWheel, selectedGrille, selectedTaillight, isMobile }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);


  // 부모 컴포넌트에서 렌더러에 접근할 수 있도록 노출
  useImperativeHandle(ref, () => ({
    getRenderer: () => {
      console.log('🎯 ThreeDRenderer getRenderer 호출됨, rendererRef.current:', rendererRef.current);
      if (rendererRef.current) {
        console.log('🎯 렌더러 domElement:', rendererRef.current.domElement);
        console.log('🎯 렌더러 크기:', rendererRef.current.domElement.width, 'x', rendererRef.current.domElement.height);
        console.log('🎯 렌더러 scene:', sceneRef.current);
        console.log('🎯 렌더러 camera:', cameraRef.current);
      }
      return rendererRef.current;
    },
    getScene: () => sceneRef.current,
    getCamera: () => cameraRef.current,
    forceRender: () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        console.log('🎨 ThreeDRenderer 강제 렌더링 실행');
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    },
  }));

  useEffect(() => {
    if (!mountRef.current) return;

    // 이전 렌더링 완전 제거
    if (mountRef.current.firstChild) {
      mountRef.current.innerHTML = '';
    }
    
    // 이전 씬이 있다면 완전히 정리
    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((mat) => mat.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      sceneRef.current.clear();
    }
    
    // 이전 렌더러가 있다면 정리
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }

    // DOM이 완전히 렌더링된 후 실행되도록 지연
    const mobileMode = window.innerWidth <= 768;
    
    // carType prop을 우선적으로 사용 (사용자 선택 반영)
    let actualCarType = carType;
    
    console.log('🚗 ThreeDRenderer - 차량 타입:', { carType, actualCarType, drawingAnalysis });
    console.log('🎯 실제 사용될 차량 타입:', actualCarType);

    console.log('ThreeDRenderer 시작:', actualCarType);

    // Scene 설정
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    sceneRef.current = scene;

    // 반응형 크기 계산 (그리기 캔버스와 동일한 로직)
    let renderWidth, renderHeight;
    
    if (fill && mountRef.current) {
      // mobileMode 매개변수를 사용하여 크기 계산
      const screenWidth = window.innerWidth;
      const canvasSize = mobileMode ? Math.floor(screenWidth * 0.9) : Math.floor(screenWidth * 0.85); // 모바일에서 90%로 증가
      
      renderWidth = canvasSize;
      renderHeight = mobileMode 
        ? Math.floor(canvasSize * 0.75) // 모바일: 4:3 비율
        : Math.floor(canvasSize * 0.5625); // 데스크톱: 16:9 비율
      
      console.log('🔍 ThreeDRenderer fill=true 크기 (mobileMode 기반):', {
        mobileMode,
        screenWidth,
        canvasSize,
        renderWidth,
        renderHeight,
        aspectRatio: renderWidth / renderHeight
      });
    } else {
      // props로 전달된 크기 사용, 기본값은 400x300 (4:3 비율)
      const baseSize = width && width > 0 ? width : 400;
      renderWidth = baseSize;
      renderHeight = Math.floor(baseSize * 0.75); // 4:3 비율
    }
    
    console.log('ThreeDRenderer 크기 설정:', {
      fill,
      propsWidth: width,
      propsHeight: height,
      renderWidth,
      renderHeight
    });

    // Camera 설정 (데스크톱: 16:9, 모바일: 4:3)
    const aspectRatio = renderWidth / renderHeight;
    const isMobile = window.innerWidth <= 768;
    const fov = 75; // FOV 값 정의
    
    // Camera 설정 - 3D 프리뷰와 동일하게
    const camera = new THREE.PerspectiveCamera(fov, aspectRatio, 0.1, 1000);
    
      // 모바일과 데스크톱 카메라 위치 구분 (10% 차이)
      const isMobileDevice = window.innerWidth <= 768;
      const baseDistance = isMobileDevice ? 5.4 : 6; // 모바일: 10% 더 가깝게
      camera.position.set(-baseDistance * 1.1, 2.5, baseDistance * 0.8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer 설정 - 모바일 고해상도 최적화
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false,
      powerPreference: "high-performance", // 고성능 GPU 사용
      precision: "highp" // 고정밀도
    });
    
    // 모바일 해상도 개선 (2배 해상도 적용)
    const isMobileDevice = window.innerWidth <= 768;
    const pixelRatio = isMobileDevice ? 2 : Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(renderWidth, renderHeight);
    
    // 디버깅 정보 출력
    console.log('🔍 3D 렌더러 설정:', {
      mobileMode,
      devicePixelRatio: window.devicePixelRatio,
      pixelRatio,
      renderWidth,
      renderHeight,
      actualCanvasWidth: renderer.domElement.width,
      actualCanvasHeight: renderer.domElement.height
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // 렌더러를 중앙에 정렬하고 선명도 최적화
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.margin = '0 auto';
    renderer.domElement.style.imageRendering = 'crisp-edges'; // 선명한 렌더링
    renderer.domElement.style.imageRendering = '-webkit-optimize-contrast'; // WebKit 최적화
    rendererRef.current = renderer;
    console.log('✅ ThreeDRenderer 렌더러 초기화 완료:', renderer);
    console.log('✅ 렌더러 domElement:', renderer.domElement);
    console.log('✅ 렌더러 크기:', renderer.domElement.width, 'x', renderer.domElement.height);
    console.log('✅ 렌더러 scene:', renderer.scene);
    console.log('✅ 렌더러 camera:', renderer.camera);

    // Controls 설정
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);

    // 조명 설정 (원래대로 복원)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(-10, 10, 5); // 앞면에서 비추도록 X축을 음수로 변경
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 바닥 그리드 (모바일과 동일한 연한 색상으로 조정)
    const gridHelper = new THREE.GridHelper(10, 10, 0xF0F0F0, 0xF5F5F5); // 더 연한 회색 그리드
    scene.add(gridHelper);

    // 귀여운 세단 형태들
    const baseTotalLength = 6.0;
    // 큰세단(sedan-type2)는 앞뒤로 길게 (길이 30% 증가)
    const totalLength = actualCarType === 'sedan-type2' ? baseTotalLength * 1.2 : baseTotalLength;
    const totalHeight = 3.0;
    const totalDepth = 2.5;

    // 꼬마세단(sedan): (초기 템플릿) 보닛/트렁크 비율 증가, 캐빈 비율 감소
    const createSedanShape = () => {
      const sedanShape = new THREE.Shape();
      sedanShape.moveTo(-totalLength/2, 0);
      
      const bonnetHeight = totalHeight * 0.4;   // 보닛 (더 높게)
      const cabinHeight = totalHeight * 0.84;   // 캐빈 (낮게)
      const trunkHeight = totalHeight * 0.5;    // 트렁크 (더 높게)
      
      // 보닛 (앞부분)
      sedanShape.lineTo(-totalLength/2, bonnetHeight);
      sedanShape.lineTo(-totalLength/4, bonnetHeight * 1.4);
      
      // A필러 (앞유리)
      sedanShape.lineTo(-totalLength/10, cabinHeight);
      
      // 캐빈 지붕 - 트렁크 방향으로
      sedanShape.lineTo(totalLength/6, cabinHeight);
      
      // C필러 (뒷유리)
      sedanShape.lineTo(totalLength/3.2, trunkHeight * 1.1);
      
      // 트렁크 (뒷부분)
      sedanShape.lineTo(totalLength/2, trunkHeight);
      sedanShape.lineTo(totalLength/2, 0);
      sedanShape.closePath();
      return sedanShape;
    };

    // 세단 타입2: 차체를 앞뒤로 길게 늘린 변형 (길이는 위에서 조정)
    // 큰세단(sedan-type2): 나중에 추가된 큰 세단
    const createSedanType2Shape = () => {
      const sedanShape = new THREE.Shape();
      sedanShape.moveTo(-totalLength/2, 0);
      
      const bonnetHeight = totalHeight * 0.4;
      const cabinHeight = totalHeight * 0.84;
      const trunkHeight = totalHeight * 0.5;
      
      // 보닛 (앞부분) - 앞쪽만 낮춤
      sedanShape.lineTo(-totalLength/2, bonnetHeight * 1.0); // 보닛 시작점 원래 높이로 올림
      sedanShape.lineTo(-totalLength/4, bonnetHeight * 1.3); // 보닛 끝점 조금만 낮춤
      
      // A필러 (앞유리)
      sedanShape.lineTo(-totalLength/10, cabinHeight);
      
      // 캐빈 지붕 - 길어진 바디 비율에 맞게 조금 더 길게
      sedanShape.lineTo(totalLength/5.5, cabinHeight);
      
      // C필러 (뒷유리)
      sedanShape.lineTo(totalLength/3, trunkHeight * 1.02); // 트렁크 시작점 조금만 낮춤
      
      // 트렁크 (뒷부분)
      sedanShape.lineTo(totalLength/2, trunkHeight * 0.9); // 트렁크 끝점 조금만 낮춤
      sedanShape.lineTo(totalLength/2, 0);
      sedanShape.closePath();
      return sedanShape;
    };

    // 빵빵트럭(truck): 트럭
    const createTruckShape = () => {
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
    };

    // 네모버스(bus): 네모난 버스
    const createBusShape = () => {
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
    };

    // 통통버스(bus-type2): 둥근 버스
    const createBusType2Shape = () => {
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
    };

    // SUV(suv): SUV
    const createSUVShape = () => {
      const suvShape = new THREE.Shape();
      suvShape.moveTo(-totalLength/2, 0);
      
      // SUV: 템플릿과 정확히 동일한 모양
      const bonnetHeight = totalHeight * 0.4;   // 보닛 (템플릿과 동일)
      const cabinHeight = totalHeight * 0.84;   // 캐빈 (템플릿과 동일)
      
      // 보닛 (앞부분) - 템플릿과 동일한 경사 (캐빈 쪽으로 올라가는 경사)
      suvShape.lineTo(-totalLength/2, bonnetHeight);
      suvShape.lineTo(-totalLength/4, bonnetHeight * 1.4); // 템플릿과 동일한 경사
      
      // A필러 (앞유리) - 템플릿과 동일한 각도
      suvShape.lineTo(-totalLength/10, cabinHeight);
      
      // 캐빈 지붕 - SUV는 뒤로 쭉 늘림 (트렁크 없음)
      suvShape.lineTo(totalLength/2.5, cabinHeight); // 뒤로 쭉 늘림
      
      // 뒷 창문 경사도 (C필러) - 템플릿과 동일
      suvShape.lineTo(totalLength/2, cabinHeight * 0.6); // 경사도 추가
      
      // 뒷부분 직각으로 바닥까지
      suvShape.lineTo(totalLength/2, 0); // 직각으로 바닥까지
      suvShape.closePath();
      return suvShape;
    };

    // 스포츠카(sports): 스포츠카
    const createSportsCarShape = () => {
      const sportsShape = new THREE.Shape();
      sportsShape.moveTo(-totalLength/2, 0);
      
      // 스포츠카: 세단타입2 기반, 낮고 길쭉한 형태
      const bonnetHeight = totalHeight * 0.25;   // 보닛 (낮게)
      const cabinHeight = totalHeight * 0.6;    // 캐빈 (낮게)
      const trunkHeight = totalHeight * 0.3;    // 트렁크 (낮게)
      
      // 보닛 (앞부분) - 낮고 경사가 강함
      sportsShape.lineTo(-totalLength/2, bonnetHeight * 1.4); // 보닛 시작점 1.4로 조정
      sportsShape.lineTo(-totalLength/5, bonnetHeight * 1.7); // 보닛 끝점 위로 조금만 올림
      
      // A필러 (앞유리) - 경사가 강함
      sportsShape.lineTo(-totalLength/25, cabinHeight * 1.15); // A필러 끝점 위쪽으로 올림
      
      // 캐빈 지붕 - 짧고 낮음
      sportsShape.lineTo(totalLength/5, cabinHeight * 1.1); // 지붕 높이를 위쪽으로 올림
      
      // C필러 (뒷유리) - 강한 경사
      sportsShape.lineTo(totalLength/2.5, trunkHeight * 1.5); // 강한 경사
      
      // 트렁크 (뒷부분) - 낮고 짧음
      sportsShape.lineTo(totalLength/2, trunkHeight * 1.1); // 트렁크 끝점 살짝 위로
      sportsShape.lineTo(totalLength/2, 0);
      sportsShape.closePath();
      return sportsShape;
    };

    // 차종에 따라 적절한 템플릿 선택
    console.log('🔍 3D 모델 생성 - 차종:', actualCarType);
    let shape;
    switch (actualCarType) {
      case 'truck':
        shape = createTruckShape();
        console.log('🚛 빵빵트럭(truck) 모양 생성됨');
        break;
      case 'bus':
        shape = createBusShape();
        console.log('🚌 네모버스(bus) 모양 생성됨');
        break;
      case 'sedan-type2':
        shape = createSedanType2Shape();
        console.log('🚗 큰세단(sedan-type2) 모양 생성됨');
        break;
      case 'bus-type2':
        shape = createBusType2Shape(); // 통통버스(bus-type2)는 직각 테일게이트
        console.log('🚌 통통버스(bus-type2) 모양 생성됨');
        break;
      case 'suv':
        shape = createSUVShape(); // SUV(suv)는 경사도 있는 뒷창문
        console.log('🚙 SUV(suv) 모양 생성됨');
        break;
      case 'sports':
        shape = createSportsCarShape(); // 스포츠카(sports)는 낮고 길쭉한 형태
        console.log('🏎️ 스포츠카(sports) 모양 생성됨');
        break;
      default:
        shape = createSedanShape();
        console.log('🚗 꼬마세단(sedan) 모양 생성됨 (기본값)');
        break;
    }

    // 3D 모델 생성
    const geometry = new THREE.ExtrudeGeometry(shape, { 
      depth: totalDepth, 
      bevelEnabled: false 
    });
    geometry.scale(1.0, 1.0, 1.0);
    geometry.translate(0, 0.5, -totalDepth / 2); // 바퀴 높이만큼 띄움
    

    // 차체 재질
    const defaultColor = carColor || (() => {
      switch (actualCarType) {
        case 'sedan': return 0xff6b6b; // 꼬마세단: 빨간색
        case 'sedan-type2': return 0x4ecdc4; // 큰세단: 청록색
        case 'truck': return 0x45b7d1; // 빵빵트럭: 파란색
        case 'bus': return 0x96ceb4; // 네모버스: 연두색
        case 'bus-type2': return 0xfeca57; // 통통버스: 노란색
        case 'suv': return 0xff9ff3; // SUV: 분홍색
        case 'sports': return 0x54a0ff; // 스포츠카: 하늘색
        default: return 0xffffff; // 기본 흰색
      }
    })();
    let material = new THREE.MeshPhongMaterial({ 
      color: defaultColor,
      shininess: 30, // 반사율 설정
      specular: 0x222222 // 약간의 반사광 추가
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    console.log('차체 추가됨');

    // 바퀴 - 기본 바퀴 (항상 렌더링)
    const wheelZ = totalDepth / 2 + 0.2; // 차체 밖으로 확실히
    const wheelR = 0.6; // 바퀴 크기
    const wheelX = [-totalLength * 0.35, totalLength * 0.35]; // BoxcarConverter와 동일
    
    for (const x of wheelX) {
      for (const side of [1, -1]) {
        const w = new THREE.Mesh(
          new THREE.CylinderGeometry(wheelR, wheelR, 0.2, 24), 
          new THREE.MeshPhongMaterial({ 
            color: '#404040', // 더 밝은 회색
            shininess: 20,
            specular: 0x111111
          })
        );
        w.position.set(x, wheelR, side * wheelZ);
        w.rotation.x = Math.PI / 2; 
        w.castShadow = true; 
        scene.add(w);
      }
    }
    
    // 휠 이미지 - 선택된 경우에만 바퀴 위에 추가
    if (selectedWheel === 'wheel-1' || selectedWheel === 'wheel-2' || selectedWheel === 'wheel-3' || selectedWheel === 'wheel-4' || selectedWheel === 'wheel-5' || selectedWheel === 'wheel-6' || selectedWheel === 'wheel-7' || selectedWheel === 'wheel-8') {
      const wheelTextureLoader = new THREE.TextureLoader();
      const wheelImagePath = selectedWheel === 'wheel-1' ? '/wheels/wheel-1.png' : 
                            selectedWheel === 'wheel-2' ? '/wheels/wheel-2.png' : 
                            selectedWheel === 'wheel-3' ? '/wheels/wheel-3.png' :
                            selectedWheel === 'wheel-4' ? '/wheels/wheel-4.png' :
                            selectedWheel === 'wheel-5' ? '/wheels/wheel-5.png' :
                            selectedWheel === 'wheel-6' ? '/wheels/wheel-6.png' :
                            selectedWheel === 'wheel-7' ? '/wheels/wheel-7.png' :
                            '/wheels/wheel-8.png';
      const wheelTexture = wheelTextureLoader.load(wheelImagePath);
      
      wheelTexture.onLoad = () => {
        console.log(`${selectedWheel} 이미지 로딩 완료`);
      };
      
      wheelTexture.onError = (error) => {
        console.error(`${selectedWheel} 이미지 로딩 실패:`, error);
      };
      
      const wheelImageSize = 0.8; // 휠 이미지 크기
      
      for (const x of wheelX) {
        for (const side of [1, -1]) {
          // 휠 이미지 메시 생성 (PlaneGeometry 사용)
          const wheelImageGeometry = new THREE.PlaneGeometry(wheelImageSize, wheelImageSize);
          const wheelImageMaterial = new THREE.MeshBasicMaterial({ 
            map: wheelTexture,
        transparent: true,
            side: THREE.DoubleSide
          });
          const wheelImage = new THREE.Mesh(wheelImageGeometry, wheelImageMaterial);
          
          wheelImage.position.set(x, wheelR, side * (wheelZ + 0.15)); // 바퀴보다 적당히 앞쪽에 위치
          wheelImage.rotation.x = 0; // 바퀴가 세로로 서도록 (90도 세우기)
          wheelImage.rotation.y = side > 0 ? 0 : Math.PI; // 좌우 바퀴 방향 조정
          wheelImage.castShadow = false; // 이미지 기반이므로 그림자 제거
          wheelImage.receiveShadow = false;
          
          console.log(`${selectedWheel} 이미지 위치: x=${x}, y=${wheelR}, z=${side * wheelZ}, side=${side}`);
          console.log(`${selectedWheel} 이미지 회전: x=${wheelImage.rotation.x}, y=${wheelImage.rotation.y}`);
          
          scene.add(wheelImage);
        }
      }
    }

    console.log('바퀴 4개 추가됨');

    // 뱃지 렌더링 - 차량 앞쪽에 배치
    if (selectedBadge && selectedBadge.startsWith('badge-')) {
      const badgeTextureLoader = new THREE.TextureLoader();
      const badgeImagePath = `/badges/${selectedBadge}.png`;
      
      badgeTextureLoader.load(
        badgeImagePath,
        (badgeTexture) => {
          console.log(`${selectedBadge} 뱃지 이미지 로딩 성공`);
          
          const badgeGeometry = new THREE.PlaneGeometry(0.936, 0.936); // 10% 줄인 크기 (1.04 * 0.9)
          const badgeMaterial = new THREE.MeshBasicMaterial({ 
            map: badgeTexture,
          transparent: true,
            side: THREE.DoubleSide
          });
          
          // 왼쪽 뱃지
          const leftBadgeMesh = new THREE.Mesh(badgeGeometry, badgeMaterial.clone());
          let badgeY;
          if (carType === 'sports' || carType === 'truck') {
            // 스포츠카(sports), 빵빵트럭(truck): 낮은 위치로 조정
            badgeY = totalHeight * 0.39; // 43%에서 39%로 4% 내림
          } else {
            // 일반 차량: 기존 위치 유지
            badgeY = totalHeight * 0.43;
          }
          leftBadgeMesh.position.set(0, badgeY, totalDepth / 2 + 0.15);
          leftBadgeMesh.rotation.y = 0; // 앞쪽을 향하도록
          leftBadgeMesh.castShadow = false;
          leftBadgeMesh.receiveShadow = false;
          scene.add(leftBadgeMesh);
          
          // 오른쪽 뱃지
          const rightBadgeMesh = new THREE.Mesh(badgeGeometry, badgeMaterial.clone());
          rightBadgeMesh.position.set(0, badgeY, -totalDepth / 2 - 0.15); // 왼쪽 뱃지와 동일한 Y 위치 사용
          rightBadgeMesh.rotation.y = Math.PI; // 180도 회전하여 거꾸로 보이지 않도록
          rightBadgeMesh.castShadow = false;
          rightBadgeMesh.receiveShadow = false;
          scene.add(rightBadgeMesh);
          
          console.log(`${selectedBadge} 뱃지 양쪽에 추가됨`);
        },
        undefined,
        (error) => {
          console.error(`${selectedBadge} 뱃지 이미지 로딩 실패:`, error);
        }
      );
    }


    // 창문 - 캐빈 형태에 맞게 경사진 모양
    if (actualCarType === 'sedan') {
      // 꼬마세단(sedan): A필러와 C필러 경사에 맞춘 창문
      
      // 앞창문 - 폭 벌려서 기울기 강화, 사이즈 맞춤
      const frontWindowShape = new THREE.Shape();
      frontWindowShape.moveTo(-0.35, -0.35);  // 왼쪽 아래 (폭 벌림)
      frontWindowShape.lineTo(0.7, -0.35);   // 오른쪽 아래 (폭 더 벌림)
      frontWindowShape.lineTo(0.7, 0.28);     // 오른쪽 위 (완전 직각)
      frontWindowShape.lineTo(0.2, 0.28);     // 왼쪽 위 (가파른 기울기)
      frontWindowShape.closePath();
      
      const frontWindowGeom = new THREE.ExtrudeGeometry(frontWindowShape, { 
        depth: totalDepth + 0.1, 
        bevelEnabled: false 
      });
      // 큰세단(sedan-type2)만 좌측으로 이동, 꼬마세단(sedan)은 기존 위치 유지
      const frontWindowX = actualCarType === 'sedan-type2' ? -0.90 : -0.75;
      frontWindowGeom.translate(frontWindowX, totalHeight * 0.808, -totalDepth/2 - 0.05);
      
      const frontWindowHole = new THREE.Mesh(frontWindowGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      scene.add(frontWindowHole);
      
      // 뒷창문 - 왼쪽 완전 직각, 세단 타입2는 오른쪽 가로폭 확장
      const rearWindowShape = new THREE.Shape();
      const rearRightBottomX = actualCarType === 'sedan-type2' ? 0.8 : 0.5; // 큰세단(sedan-type2): 가로폭 확대
      const rearTopRightX = actualCarType === 'sedan-type2' ? 0.12 : 0.02;  // 큰세단(sedan-type2): 상단 우측도 약간 벌림
      rearWindowShape.moveTo(-0.55, -0.35);  // 왼쪽 아래 (완전 직각 맞춤)
      rearWindowShape.lineTo(rearRightBottomX, -0.35);   // 오른쪽 아래
      rearWindowShape.lineTo(rearTopRightX, 0.28);       // 오른쪽 위 (C필러 기울기)
      rearWindowShape.lineTo(-0.55, 0.28);               // 왼쪽 위 (완전 직각)
      rearWindowShape.closePath();
      
      const rearWindowGeom = new THREE.ExtrudeGeometry(rearWindowShape, { 
        depth: totalDepth + 0.1, 
        bevelEnabled: false 
      });
      // 큰세단(sedan-type2)만 좌측으로 이동, 꼬마세단(sedan)은 기존 위치 유지 (꼬마세단 뒷창문을 아주 조금 뒤쪽으로)
      const rearWindowX = actualCarType === 'sedan-type2' ? 0.65 : 0.85;
      rearWindowGeom.translate(rearWindowX, totalHeight * 0.808, -totalDepth/2 - 0.05);
      
      const rearWindowHole = new THREE.Mesh(rearWindowGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      scene.add(rearWindowHole);
      
      console.log('세단 창문 2개 추가됨 (경사진 모양)');
      
      // 세단 앞유리 추가 - 새로운 직육면체로
      const frontWindshieldGeom = new THREE.BoxGeometry(0.7, 0.08, 1.8); // 가로 0.7, 세로 0.08, 두께 1.8 (세로 0.7로 변경)
      
      const frontWindshield = new THREE.Mesh(frontWindshieldGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      
      frontWindshield.position.set(-totalLength/10 - 0.5, totalHeight * 0.85, 0); // 미세하게 아래로 이동
      frontWindshield.rotation.z = Math.atan(0.84 / 0.9); // Z축으로 회전 (캐빈 각도와 동일)
      
      scene.add(frontWindshield);
      
      console.log('세단 앞유리 추가됨');
      
      // 세단 뒷유리 추가 - 앞유리와 동일한 크기
      const rearWindshieldGeom = new THREE.BoxGeometry(0.7, 0.08, 1.8); // 가로 0.7, 세로 0.08, 두께 1.8 (앞유리와 동일)
      
      const rearWindshield = new THREE.Mesh(rearWindshieldGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      
      rearWindshield.position.set(totalLength/3.2 - 0.4, totalHeight * 0.85, 0); // 뒷유리 위치 (아주 미세하게 앞으로 이동)
      rearWindshield.rotation.z = -Math.atan(0.84 / 0.9); // Z축으로 회전 (캐빈 각도와 반대)
      
      scene.add(rearWindshield);
      
      console.log('꼬마세단(sedan) 뒷유리 추가됨');
    } else if (actualCarType === 'sedan-type2') {
      // 큰세단(sedan-type2): A필러와 C필러 경사에 맞춘 창문 (꼬마세단과 동일하지만 앞유리 위치 다름)
      
      // 앞창문 - 폭 벌려서 기울기 강화, 사이즈 맞춤
      const frontWindowShape = new THREE.Shape();
      frontWindowShape.moveTo(-0.35, -0.35);  // 왼쪽 아래 (폭 벌림)
      frontWindowShape.lineTo(0.7, -0.35);   // 오른쪽 아래 (폭 더 벌림)
      frontWindowShape.lineTo(0.7, 0.28);     // 오른쪽 위 (완전 직각)
      frontWindowShape.lineTo(0.2, 0.28);     // 왼쪽 위 (가파른 기울기)
      frontWindowShape.closePath();
      
      const frontWindowGeom = new THREE.ExtrudeGeometry(frontWindowShape, { 
        depth: totalDepth + 0.1, 
        bevelEnabled: false 
      });
      // 세단타입2만 좌측으로 이동, 세단은 기존 위치 유지
      const frontWindowX = -0.75; // 뒷쪽으로 이동 (-0.90 -> -0.75)
      frontWindowGeom.translate(frontWindowX, totalHeight * 0.808, -totalDepth/2 - 0.05);
      
      const frontWindowHole = new THREE.Mesh(frontWindowGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      scene.add(frontWindowHole);
      
      // 뒷창문 - 왼쪽 완전 직각, 세단 타입2는 오른쪽 가로폭 확장
      const rearWindowShape = new THREE.Shape();
      const rearRightBottomX = 0.8; // 타입2: 가로폭 확대
      const rearTopRightX = 0.12;
      rearWindowShape.moveTo(-0.55, -0.35);  // 왼쪽 아래 (완전 직각 맞춤)
      rearWindowShape.lineTo(rearRightBottomX, -0.35);   // 오른쪽 아래
      rearWindowShape.lineTo(rearTopRightX, 0.28);       // 오른쪽 위 (C필러 기울기)
      rearWindowShape.lineTo(-0.55, 0.28);               // 왼쪽 위 (완전 직각)
      rearWindowShape.closePath();
      
      const rearWindowGeom = new THREE.ExtrudeGeometry(rearWindowShape, { 
        depth: totalDepth + 0.1, 
        bevelEnabled: false 
      });
      rearWindowGeom.translate(0.80, totalHeight * 0.808, -totalDepth/2 - 0.05); // 뒷쪽으로 이동 (0.65 -> 0.80)
      
      const rearWindowHole = new THREE.Mesh(rearWindowGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      scene.add(rearWindowHole);
      
      console.log('세단 타입2 창문 2개 추가됨 (경사진 모양)');
      
      // 세단 타입2 앞유리 추가 - 세단 참고
      const bonnetHeight = totalHeight * 0.4;
      const cabinHeight = totalHeight * 0.84;
      
      const frontWindshieldGeom = new THREE.BoxGeometry(0.7, 0.08, 1.8); // 가로 0.7, 세로 0.08, 두께 1.8
      
      const frontWindshield = new THREE.Mesh(frontWindshieldGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      
      frontWindshield.position.set(-totalLength/10 - 0.5, totalHeight * 0.85, 0); // 원복
      // 세단2 A필러 각도 계산: (-totalLength/4, bonnetHeight * 1.3) -> (-totalLength/10, cabinHeight)
      const sedan2A = (cabinHeight - bonnetHeight * 1.3) / (totalLength/4 - totalLength/10); // 기울기
      frontWindshield.rotation.z = Math.atan(sedan2A); // 세단2 캐빈 각도 적용
      
      scene.add(frontWindshield);
      
      console.log('세단 타입2 앞유리 추가됨');
      
      // 세단 타입2 뒷유리 추가 - 세단 참고
      const rearWindshieldGeom = new THREE.BoxGeometry(0.7, 0.08, 1.8); // 가로 0.7, 세로 0.08, 두께 1.8
      
      const rearWindshield = new THREE.Mesh(rearWindshieldGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      
      rearWindshield.position.set(totalLength/3.2 - 0.4, totalHeight * 0.84, 0); // 0.84로 조정
      // 세단2 C필러 각도 계산: (totalLength/5.5, cabinHeight) -> (totalLength/3, trunkHeight * 1.02)
      const trunkHeight = totalHeight * 0.5;
      const sedan2C = (trunkHeight * 1.02 - cabinHeight) / (totalLength/3 - totalLength/5.5); // 기울기
      rearWindshield.rotation.z = Math.atan(sedan2C); // 세단2 C필러 각도 그대로 적용
      
      scene.add(rearWindshield);
      
      console.log('큰세단(sedan-type2) 뒷유리 추가됨');
    } else if (actualCarType === 'truck') {
      // 빵빵트럭(truck): 앞창문만 (꼬마세단의 왼쪽 창문과 동일)
      
      // 앞창문 - 폭 벌려서 기울기 강화, 사이즈 맞춤
      const frontWindowShape = new THREE.Shape();
      frontWindowShape.moveTo(-0.35, -0.35);  // 왼쪽 아래 (폭 벌림)
      frontWindowShape.lineTo(1.0, -0.35);   // 오른쪽 아래 (폭 더 벌림)
      frontWindowShape.lineTo(1.0, 0.28);     // 오른쪽 위 (완전 직각)
      frontWindowShape.lineTo(0.02, 0.28);    // 왼쪽 위 (기울기)
      frontWindowShape.closePath();
      
      const frontWindowGeom = new THREE.ExtrudeGeometry(frontWindowShape, { 
        depth: totalDepth + 0.1, 
        bevelEnabled: false 
      });
      frontWindowGeom.translate(-1.9, totalHeight * 0.808, -totalDepth/2 - 0.05); // A필라 왼쪽 끝으로 이동
      
      const frontWindowHole = new THREE.Mesh(frontWindowGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      scene.add(frontWindowHole);
      
      console.log('트럭 앞창문 1개 추가됨');
      
      // 트럭 앞유리 추가 - 세단 참고
      const bonnetHeight = totalHeight * 0.4;   // 보닛 높이
      const cabinHeight = totalHeight * 0.84;   // 캐빈 높이
      
      const frontWindshieldGeom = new THREE.BoxGeometry(0.8, 0.08, 1.8); // 가로 0.8, 세로 0.08, 두께 1.8
      
      const frontWindshield = new THREE.Mesh(frontWindshieldGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      
      frontWindshield.position.set(-totalLength/3 - 0.45, totalHeight * 0.8, 0); // 아주 아주 미세하게 앞쪽으로 이동
      // 트럭 A필러 각도 계산: (-totalLength/2, bonnetHeight) -> (-totalLength/3, cabinHeight)
      const truckA = (cabinHeight - bonnetHeight) / (totalLength/2 - totalLength/3); // 기울기
      frontWindshield.rotation.z = Math.atan(truckA); // 트럭 캐빈 각도 적용
      
      scene.add(frontWindshield);
      
      console.log('트럭 앞유리 추가됨');
      
      // 트럭 뒷유리 추가 - 세단 뒷유리 참고
      const rearWindshieldGeom = new THREE.BoxGeometry(0.7, 0.08, 1.8); // 가로 0.7, 세로 0.08, 두께 1.8 (세단과 동일)
      
      const rearWindshield = new THREE.Mesh(rearWindshieldGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      
      rearWindshield.position.set(totalLength/500 + 0.02, totalHeight * 0.8, 0); // 아주아주 미세하게 한 번만 더 앞쪽으로 이동
      rearWindshield.rotation.z = Math.PI / 2; // Z축으로 90도 회전
      
      scene.add(rearWindshield);
      
      console.log('트럭 뒷유리 추가됨');
    } else if (actualCarType === 'bus') {
      // 버스: 트럭과 동일한 앞창문
      
      // 앞창문 - 폭 벌려서 기울기 강화, 사이즈 맞춤
      const frontWindowShape = new THREE.Shape();
      frontWindowShape.moveTo(-0.35, -0.35);  // 왼쪽 아래 (폭 벌림)
      frontWindowShape.lineTo(0.8, -0.35);   // 오른쪽 아래 (폭 더 줄임)
      frontWindowShape.lineTo(0.8, 0.28);     // 오른쪽 위 (완전 직각)
      frontWindowShape.lineTo(0.02, 0.28);    // 왼쪽 위 (기울기)
      frontWindowShape.closePath();
      
      const frontWindowGeom = new THREE.ExtrudeGeometry(frontWindowShape, { 
        depth: totalDepth + 0.1, 
        bevelEnabled: false 
      });
      frontWindowGeom.translate(-1.9, totalHeight * 0.808, -totalDepth/2 - 0.05); // A필라 왼쪽 끝으로 이동
      
      const frontWindowHole = new THREE.Mesh(frontWindowGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      scene.add(frontWindowHole);
      
      console.log('버스 앞창문 1개 추가됨');
      
      // 추가 창문 3개 - 세단 창문과 같은 폭
      const additionalWindowWidth = 0.95; // 세단 창문 폭 (0.6 - (-0.35))
      const windowSpacing = 0.3; // 창문 간격 증가
      
      for (let i = 0; i < 3; i++) {
        const additionalWindowShape = new THREE.Shape();
        additionalWindowShape.moveTo(-0.35, -0.35);  // 왼쪽 아래
        additionalWindowShape.lineTo(0.6, -0.35);   // 오른쪽 아래 (세단과 동일)
        additionalWindowShape.lineTo(0.6, 0.28);     // 오른쪽 위 (세단과 동일)
        additionalWindowShape.lineTo(-0.35, 0.28);   // 왼쪽 위 (세단과 동일)
        additionalWindowShape.closePath();
        
        const additionalWindowGeom = new THREE.ExtrudeGeometry(additionalWindowShape, { 
          depth: totalDepth + 0.1, 
          bevelEnabled: false 
        });
        
        // 창문 위치 계산: 두 번째부터 네 번째까지 오른쪽으로 이동
        const windowX = -1.9 + additionalWindowWidth + windowSpacing * 1.7 + (additionalWindowWidth + windowSpacing) * i;
        additionalWindowGeom.translate(windowX, totalHeight * 0.808, -totalDepth/2 - 0.05);
        
        const additionalWindowHole = new THREE.Mesh(additionalWindowGeom, new THREE.MeshLambertMaterial({ 
          color: 0x87CEEB, 
          transparent: false
        }));
        scene.add(additionalWindowHole);
      }
      
      console.log('버스 추가 창문 3개 추가됨');
      
      // 버스 앞유리 추가 - 트럭과 동일한 설정
      const bonnetHeight = totalHeight * 0.4;   // 보닛 높이
      const cabinHeight = totalHeight * 0.84;   // 캐빈 높이
      
      const frontWindshieldGeom = new THREE.BoxGeometry(0.8, 0.08, 1.8); // 가로 0.8, 세로 0.08, 두께 1.8
      
      const frontWindshield = new THREE.Mesh(frontWindshieldGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      
      frontWindshield.position.set(-totalLength/3 - 0.45, totalHeight * 0.8, 0); // 트럭과 동일한 위치
      // 버스 A필러 각도 계산: 트럭과 동일
      const truckA = (cabinHeight - bonnetHeight) / (totalLength/2 - totalLength/3); // 기울기
      frontWindshield.rotation.z = Math.atan(truckA); // 트럭과 동일한 캐빈 각도 적용
      
      scene.add(frontWindshield);
      
      console.log('버스 앞유리 추가됨');
      
      // 버스 뒷유리 추가 - 트럭 뒷유리 참고
      const rearWindshieldGeom = new THREE.BoxGeometry(0.7, 0.08, 1.8); // 가로 0.7, 세로 0.08, 두께 1.8 (트럭과 동일)
      
      const rearWindshield = new THREE.Mesh(rearWindshieldGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      
      rearWindshield.position.set(totalLength/2 + 0.35, totalHeight * 0.8, 0); // 아주 미세하게 뒤쪽으로 이동
      rearWindshield.rotation.z = Math.PI / 2; // Z축으로 90도 회전 (트럭과 동일)
      
      scene.add(rearWindshield);
      
      console.log('버스 뒷유리 추가됨');
    } else if (actualCarType === 'bus-type2') {
      // 버스 타입2: 세단의 왼쪽 첫 번째 창문과 동일 (가로폭 벌림)
      
      // 앞창문 - 가로폭 벌림
      const frontWindowShape = new THREE.Shape();
      frontWindowShape.moveTo(-0.35, -0.35);  // 왼쪽 아래 (폭 벌림)
      frontWindowShape.lineTo(1.0, -0.35);   // 오른쪽 아래 (폭 더 벌림)
      frontWindowShape.lineTo(1.0, 0.28);     // 오른쪽 위 (완전 직각)
      frontWindowShape.lineTo(0.25, 0.28);    // 왼쪽 위 (기울기)
      frontWindowShape.closePath();
      
      const frontWindowGeom = new THREE.ExtrudeGeometry(frontWindowShape, { 
        depth: totalDepth + 0.1, 
        bevelEnabled: false 
      });
      frontWindowGeom.translate(-0.65, totalHeight * 0.808, -totalDepth/2 - 0.05); // 세단과 동일한 위치
      
      const frontWindowHole = new THREE.Mesh(frontWindowGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      scene.add(frontWindowHole);
      
      console.log('버스 타입2 앞창문 1개 추가됨');
      
      // 버스 타입2 옆 창문 추가 - 버스의 두 번째 창문(직육면체) 참고
      const additionalWindowWidth = 0.95; // 세단 창문 폭 (0.6 - (-0.35))
      const windowSpacing = 0.3; // 창문 간격 증가
      
      for (let i = 0; i < 2; i++) { // 2개 창문 추가
        const additionalWindowShape = new THREE.Shape();
        additionalWindowShape.moveTo(-0.35, -0.35);  // 왼쪽 아래
        // 오른쪽을 조금씩 줄임 (두 번째 창문: 0.55, 세 번째 창문: 0.45)
        const rightEdge = 0.6 - (i + 1) * 0.05; // 0.55, 0.45
        additionalWindowShape.lineTo(rightEdge, -0.35);   // 오른쪽 아래 (조금씩 줄임)
        additionalWindowShape.lineTo(rightEdge, 0.28);     // 오른쪽 위 (조금씩 줄임)
        additionalWindowShape.lineTo(-0.35, 0.28);   // 왼쪽 위 (세단과 동일)
        additionalWindowShape.closePath();
        
        const additionalWindowGeom = new THREE.ExtrudeGeometry(additionalWindowShape, { 
          depth: totalDepth + 0.1, 
          bevelEnabled: false 
        });
        
        // 창문 위치 계산: 첫 번째 창문 옆에 배치하고 뒤쪽으로 이동 (세 번째 창문은 아주 조금 앞쪽으로)
        const baseOffset = 0.4;
        const thirdWindowAdjustment = i === 1 ? -0.1 : 0; // 세 번째 창문(i=1)만 앞쪽으로 0.1 당김
        const windowX = -0.65 + additionalWindowWidth + windowSpacing + (additionalWindowWidth + windowSpacing) * i + baseOffset + thirdWindowAdjustment;
        additionalWindowGeom.translate(windowX, totalHeight * 0.808, -totalDepth/2 - 0.05);
        
        const additionalWindowHole = new THREE.Mesh(additionalWindowGeom, new THREE.MeshLambertMaterial({ 
          color: 0x87CEEB, 
          transparent: false
        }));
        scene.add(additionalWindowHole);
      }
      
      console.log('버스 타입2 옆 창문 2개 추가됨');
      
      // 버스타입2 앞유리 추가 - 세단 참고
      const bonnetHeight = totalHeight * 0.4;   // 보닛 높이
      const cabinHeight = totalHeight * 0.84;   // 캐빈 높이
      
      const frontWindshieldGeom = new THREE.BoxGeometry(0.7, 0.08, 1.8); // 가로 0.7, 세로 0.08, 두께 1.8 (세단과 동일)
      
      const frontWindshield = new THREE.Mesh(frontWindshieldGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      
      frontWindshield.position.set(-totalLength/10 - 0.5, totalHeight * 0.85, 0); // 세단과 동일한 위치
      frontWindshield.rotation.z = Math.atan(0.84 / 0.9); // 세단과 동일한 각도
      
      scene.add(frontWindshield);
      
      console.log('버스타입2 앞유리 추가됨');
      
      // 버스타입2 뒷유리 추가 - 버스 뒷유리 참고
      const rearWindshieldGeom = new THREE.BoxGeometry(0.7, 0.08, 1.8); // 가로 0.7, 세로 0.08, 두께 1.8 (버스와 동일)
      
      const rearWindshield = new THREE.Mesh(rearWindshieldGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      
      rearWindshield.position.set(totalLength/2, totalHeight * 0.8, 0); // 0으로 조정
      rearWindshield.rotation.z = Math.PI / 2; // Z축으로 90도 회전 (버스와 동일)
      
      scene.add(rearWindshield);
      
      console.log('버스타입2 뒷유리 추가됨');
    } else if (actualCarType === 'suv') {
      // SUV: 버스 타입2와 동일한 앞창문
      
      // 앞창문 - 가로폭 벌림
      const frontWindowShape = new THREE.Shape();
      frontWindowShape.moveTo(-0.35, -0.35);  // 왼쪽 아래 (폭 벌림)
      frontWindowShape.lineTo(0.8, -0.35);   // 오른쪽 아래 (폭 더 벌림)
      frontWindowShape.lineTo(0.8, 0.28);     // 오른쪽 위 (완전 직각)
      frontWindowShape.lineTo(0.25, 0.28);    // 왼쪽 위 (가파른 기울기)
      frontWindowShape.closePath();
      
      const frontWindowGeom = new THREE.ExtrudeGeometry(frontWindowShape, { 
        depth: totalDepth + 0.1, 
        bevelEnabled: false 
      });
      frontWindowGeom.translate(-0.65, totalHeight * 0.808, -totalDepth/2 - 0.05); // 세단과 동일한 위치
      
      const frontWindowHole = new THREE.Mesh(frontWindowGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      scene.add(frontWindowHole);
      
      // 좌측 창문 옆에 직사각형 창문 추가
      const sideWindowShape = new THREE.Shape();
      sideWindowShape.moveTo(-0.35, -0.35);  // 왼쪽 아래
      sideWindowShape.lineTo(0.6, -0.35);   // 오른쪽 아래 (세단과 동일한 폭)
      sideWindowShape.lineTo(0.6, 0.28);     // 오른쪽 위 (세단과 동일한 높이)
      sideWindowShape.lineTo(-0.35, 0.28);   // 왼쪽 위 (직사각형)
      sideWindowShape.closePath();
      
      const sideWindowGeom = new THREE.ExtrudeGeometry(sideWindowShape, { 
        depth: totalDepth + 0.1, 
        bevelEnabled: false 
      });
      sideWindowGeom.translate(0.8, totalHeight * 0.808, -totalDepth/2 - 0.05); // 첫 번째 창문 옆에 배치 (간격 조정)
      
      const sideWindowHole = new THREE.Mesh(sideWindowGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      scene.add(sideWindowHole);
      
      // 세 번째 창문 추가 (왼쪽 직각, 오른쪽 경사진 다각형)
      const thirdWindowShape = new THREE.Shape();
      thirdWindowShape.moveTo(-0.35, -0.35);  // 왼쪽 아래
      thirdWindowShape.lineTo(0.6, -0.35);   // 오른쪽 아래
      thirdWindowShape.lineTo(0.25, 0.28);    // 오른쪽 위 (더 완만한 기울기)
      thirdWindowShape.lineTo(-0.35, 0.28);   // 왼쪽 위 (직각)
      thirdWindowShape.closePath();
      
      const thirdWindowGeom = new THREE.ExtrudeGeometry(thirdWindowShape, { 
        depth: totalDepth + 0.1, 
        bevelEnabled: false 
      });
      thirdWindowGeom.translate(2.0, totalHeight * 0.808, -totalDepth/2 - 0.05); // 왼쪽에서 세 번째 위치 (간격 더 벌림)
      
      const thirdWindowHole = new THREE.Mesh(thirdWindowGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      scene.add(thirdWindowHole);
      
      console.log('SUV 앞창문 1개 + 측면 창문 2개 추가됨');
      
      // SUV 앞유리 추가 - 세단 참고
      const bonnetHeight = totalHeight * 0.4;   // 보닛 높이
      const cabinHeight = totalHeight * 0.84;   // 캐빈 높이
      
      const frontWindshieldGeom = new THREE.BoxGeometry(0.7, 0.08, 1.8); // 가로 0.7, 세로 0.08, 두께 1.8 (세단과 동일)
      
      const frontWindshield = new THREE.Mesh(frontWindshieldGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      
      frontWindshield.position.set(-totalLength/10 - 0.5, totalHeight * 0.85, 0); // 세단과 동일한 위치
      frontWindshield.rotation.z = Math.atan(0.84 / 0.9); // 세단과 동일한 각도
      
      scene.add(frontWindshield);
      
      console.log('SUV 앞유리 추가됨');
      
      // SUV 뒷유리 추가 - 버스타입2 뒷유리 참고
      const rearWindshieldGeom = new THREE.BoxGeometry(0.7, 0.08, 1.8); // 가로 0.7, 세로 0.08, 두께 1.8 (버스타입2와 동일)
      
      const rearWindshield = new THREE.Mesh(rearWindshieldGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      
      rearWindshield.position.set(totalLength/2 - 0.23, totalHeight * 0.8, 0); // 0.23으로 조정
      // SUV C필러 각도 계산: (totalLength/2.5, cabinHeight) -> (totalLength/2, cabinHeight * 0.6)
      const suvC = (cabinHeight * 0.6 - cabinHeight) / (totalLength/2 - totalLength/2.5); // 기울기
      rearWindshield.rotation.z = Math.atan(suvC); // SUV 캐빈 뒷쪽 각도 적용
      
      scene.add(rearWindshield);
      
      console.log('SUV 뒷유리 추가됨');
    } else if (actualCarType === 'sports') {
      // 스포츠카: 세단과 유사하지만 더 작은 창문
      
      // 앞창문 - 세단2와 유사한 형태 (높이 줄임, 뒤쪽으로 늘림)
      const frontWindowShape = new THREE.Shape();
      frontWindowShape.moveTo(-0.35, -0.35);  // 왼쪽 아래
      frontWindowShape.lineTo(2.0, -0.35);   // 오른쪽 아래 (뒤로 조금 더: 1.8 -> 2.0)
      frontWindowShape.lineTo(1.5, 0.12);     // 오른쪽 위 (뒤로 조금만 더 이동: 1.3 -> 1.5)
      frontWindowShape.lineTo(0.2, 0.18);     // 왼쪽 위 아주아주 조금만 올림 (0.15 -> 0.18)
      frontWindowShape.closePath();
      
      const frontWindowGeom = new THREE.ExtrudeGeometry(frontWindowShape, { 
        depth: totalDepth + 0.1, 
        bevelEnabled: false 
      });
      // 스포츠카는 앞쪽으로 더 이동
      const frontWindowX = -0.4; // 뒤로 이동 (-0.6 -> -0.4)
      frontWindowGeom.translate(frontWindowX, totalHeight * 0.7, -totalDepth/2 - 0.05); // 위쪽으로 조금만 올림 (0.65 -> 0.7)
      
      const frontWindowHole = new THREE.Mesh(frontWindowGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      scene.add(frontWindowHole);
      
      console.log('스포츠카 앞쪽 옆 창문 추가됨');
      
      // 스포츠카 앞유리 추가 - 세단2 참고
      const bonnetHeight = totalHeight * 0.25;   // 스포츠카 보닛 높이
      const cabinHeight = totalHeight * 0.6;     // 스포츠카 캐빈 높이
      
      const frontWindshieldGeom = new THREE.BoxGeometry(0.7, 0.08, 1.8); // 가로 0.7, 세로 0.08, 두께 1.8
      
      const frontWindshield = new THREE.Mesh(frontWindshieldGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      
      frontWindshield.position.set(-totalLength/7.9, totalHeight * 0.71, 0); // 0.71로 조정
      // 스포츠카 A필러 각도 계산: (-totalLength/5, bonnetHeight * 1.7) -> (-totalLength/25, cabinHeight * 1.15)
      const sportsA = (cabinHeight * 1.15 - bonnetHeight * 1.7) / (totalLength/5 - totalLength/25);
      frontWindshield.rotation.z = Math.atan(sportsA); // 스포츠카 캐빈 각도 적용
      
      scene.add(frontWindshield);
      
      console.log('스포츠카 앞유리 추가됨');
      
      // 스포츠카 뒷유리 추가 - 세단2 참고
      const rearWindshieldGeom = new THREE.BoxGeometry(0.525, 0.08, 1.8); // 가로 25% 줄임: 0.7 -> 0.525
      
      const rearWindshield = new THREE.Mesh(rearWindshieldGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      
      rearWindshield.position.set(totalLength/3.0, totalHeight * 0.68, 0); // 0.68로 조정
      // 스포츠카 C필러 각도 계산: (totalLength/5, cabinHeight * 1.1) -> (totalLength/2.5, trunkHeight * 1.5)
      const trunkHeight = totalHeight * 0.3;
      const sportsC = (trunkHeight * 1.5 - cabinHeight * 1.1) / (totalLength/2.5 - totalLength/5);
      rearWindshield.rotation.z = Math.atan(sportsC); // 스포츠카 C필러 각도 적용
      
      scene.add(rearWindshield);
      
      console.log('스포츠카 뒷유리 추가됨');
    }

    // 헤드램프 렌더링 (selectedHeadlight prop에 따라)
    if (selectedHeadlight) {
      // 헤드램프 타입에 따른 기본 색상 결정
      const getHeadlightColor = (type: string) => {
        if (type.includes('yellow')) return '#FFD700';
        if (type.includes('white')) return '#FFFFFF';
        if (type.includes('angry')) return '#FF6B6B';
        return headlightColor || '#FFD700'; // 사용자 선택 색상 또는 기본 노란색
      };
      
      const headlightMaterial = new THREE.MeshLambertMaterial({ 
        color: getHeadlightColor(selectedHeadlight)
      });
      
          // 헤드램프 위치 계산 (차량 전면 양쪽 가장자리)
          let headlightY;
          if (carType === 'sports') {
            // 스포츠카: 아주 조금만 아래로
            headlightY = totalHeight * 0.40; // 차량 높이의 40% 위치
          } else {
            // 일반 차량: 차량 높이의 42% 위치 (45%에서 3% 내림)
            headlightY = totalHeight * 0.42;
          }
          const headlightX = -totalLength / 2 - 0.05; // 차량 앞쪽 끝에서 간격 좁히기
      const headlightPositions = [
        { x: headlightX, z: totalDepth * 0.3 }, // 왼쪽 헤드램프
        { x: headlightX, z: -totalDepth * 0.3 }  // 오른쪽 헤드램프
      ];
      
      headlightPositions.forEach((pos) => {
        let headlightGeometry;
        let headlightMesh;
        
        switch (selectedHeadlight) {
          case 'round-yellow':
          case 'round-white':
            // 동그란 헤드램프 (원판 모양) - 넓은 면이 앞면에 맞닿도록
            headlightGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
            headlightMesh = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlightMesh.rotation.z = Math.PI / 2; // Z축으로 90도 회전해서 눞히기
            break;
            
          case 'square-yellow':
          case 'square-white':
            // 사각형 헤드램프 (판 모양) - 넓은 면이 앞면에 맞닿도록
            headlightGeometry = new THREE.BoxGeometry(0.3, 0.25, 0.05);
            headlightMesh = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlightMesh.rotation.y = Math.PI / 2; // Y축으로 90도 회전해서 판이 차체 앞면에 평평하게 붙도록
            break;
            
          case 'cute-eyes':
            // 귀여운 눈 - 기존 방식 (원복)
            headlightGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16);
            headlightMesh = new THREE.Mesh(headlightGeometry, new THREE.MeshLambertMaterial({ color: '#FFFFFF' }));
            headlightMesh.rotation.z = Math.PI / 2; // Z축으로 90도 회전해서 눞히기
            break;
            
          case 'cute-eyes-image':
            // 귀여운 눈 - 이미지 사용 (새로운 타입)
            const textureLoader = new THREE.TextureLoader();
            const cuteEyesTexture = textureLoader.load('/headlights/headlight-cute1.png');
            
            // 이미지 로딩 완료 후 처리
            cuteEyesTexture.onLoad = () => {
              console.log('귀여운 눈 이미지 로딩 완료');
            };
            
            cuteEyesTexture.onError = (error) => {
              console.error('귀여운 눈 이미지 로딩 실패:', error);
            };
            
            headlightGeometry = new THREE.PlaneGeometry(0.6, 0.6 * (293/288)); // 실제 이미지 비율: 288x293
            const cuteEyesMaterial = new THREE.MeshBasicMaterial({ 
              map: cuteEyesTexture,
              transparent: true,
              side: THREE.DoubleSide // 양면 렌더링
            });
            headlightMesh = new THREE.Mesh(headlightGeometry, cuteEyesMaterial);
            headlightMesh.rotation.y = -Math.PI / 2; // 차체 앞면에 붙이기 (좌우 반전)
            console.log('귀여운 눈 헤드램프 생성:', headlightMesh);
            break;
            
          case 'cute2':
            // 귀여운 눈2 - 이미지 사용
            const textureLoader2 = new THREE.TextureLoader();
            const cute2Texture = textureLoader2.load('/headlights/headlight-cute2.png');
            
            // 이미지 로딩 완료 후 처리
            cute2Texture.onLoad = () => {
              console.log('귀여운 눈2 이미지 로딩 완료');
            };
            
            cute2Texture.onError = (error) => {
              console.error('귀여운 눈2 이미지 로딩 실패:', error);
            };
            
            headlightGeometry = new THREE.PlaneGeometry(0.6, 0.6 * (293/288)); // 실제 이미지 비율: 288x293
            const cute2Material = new THREE.MeshBasicMaterial({ 
              map: cute2Texture,
              transparent: true,
              side: THREE.DoubleSide // 양면 렌더링
            });
            headlightMesh = new THREE.Mesh(headlightGeometry, cute2Material);
            headlightMesh.rotation.y = -Math.PI / 2; // 차체 앞면에 붙이기 (좌우 반전)
            console.log('귀여운 눈2 헤드램프 생성:', headlightMesh);
            break;
            
          case 'cute3':
            // 귀여운 눈3 - 둥근 정사각형 이미지 사용
            const textureLoader3 = new THREE.TextureLoader();
            const cute3Texture = textureLoader3.load('/headlights/headlight-cute3.png');
            
            // 이미지 로딩 완료 후 처리
            cute3Texture.onLoad = () => {
              console.log('귀여운 눈3 이미지 로딩 완료');
            };
            
            cute3Texture.onError = (error) => {
              console.error('귀여운 눈3 이미지 로딩 실패:', error);
            };
            
            headlightGeometry = new THREE.PlaneGeometry(0.5, 0.5); // 둥근 정사각형이므로 약간 작게
            const cute3Material = new THREE.MeshBasicMaterial({ 
              map: cute3Texture,
              transparent: true,
              side: THREE.DoubleSide // 양면 렌더링
            });
            headlightMesh = new THREE.Mesh(headlightGeometry, cute3Material);
            headlightMesh.rotation.y = -Math.PI / 2; // 차체 앞면에 붙이기 (좌우 반전)
            console.log('귀여운 눈3 헤드램프 생성:', headlightMesh);
            break;
            
          case 'cute4':
            // 귀여운 눈4 - 이미지 사용
            const textureLoader4 = new THREE.TextureLoader();
            const cute4Texture = textureLoader4.load('/headlights/headlight-cute4.png');
            
            // 이미지 로딩 완료 후 처리
            cute4Texture.onLoad = () => {
              console.log('귀여운 눈4 이미지 로딩 완료');
            };
            
            cute4Texture.onError = (error) => {
              console.error('귀여운 눈4 이미지 로딩 실패:', error);
            };
            
            headlightGeometry = new THREE.PlaneGeometry(0.6, 0.6 * (293/288)); // 실제 이미지 비율: 288x293
            const cute4Material = new THREE.MeshBasicMaterial({ 
              map: cute4Texture,
              transparent: true,
              side: THREE.DoubleSide // 양면 렌더링
            });
            headlightMesh = new THREE.Mesh(headlightGeometry, cute4Material);
            headlightMesh.rotation.y = -Math.PI / 2; // 차체 앞면에 붙이기 (좌우 반전)
            console.log('귀여운 눈4 헤드램프 생성:', headlightMesh);
            break;
            
          case 'cute5':
            // 귀여운 눈5 - 이미지 사용
            const textureLoader5 = new THREE.TextureLoader();
            const cute5Texture = textureLoader5.load('/headlights/headlight-cute5.png');
            
            // 이미지 로딩 완료 후 처리
            cute5Texture.onLoad = () => {
              console.log('귀여운 눈5 이미지 로딩 완료');
            };
            
            cute5Texture.onError = (error) => {
              console.error('귀여운 눈5 이미지 로딩 실패:', error);
            };
            
            headlightGeometry = new THREE.PlaneGeometry(0.6, 0.6 * (293/288)); // 실제 이미지 비율: 288x293
            const cute5Material = new THREE.MeshBasicMaterial({ 
              map: cute5Texture,
              transparent: true,
              side: THREE.DoubleSide // 양면 렌더링
            });
            headlightMesh = new THREE.Mesh(headlightGeometry, cute5Material);
            headlightMesh.rotation.y = -Math.PI / 2; // 차체 앞면에 붙이기 (좌우 반전)
            console.log('귀여운 눈5 헤드램프 생성:', headlightMesh);
            break;
            
          case 'cute6':
            // 귀여운 눈6 - 좌우 다른 이미지 사용
            const textureLoader6 = new THREE.TextureLoader();
            // 좌우 위치에 따라 다른 이미지 로드 (pos.z 사용) - 반대로 수정
            const imagePath = pos.z > 0 ? '/headlights/headlight-cute6-eyes-right.png' : '/headlights/headlight-cute6-eyes-left.png';
            console.log(`귀여운 눈6 이미지 경로: ${imagePath}, pos.x: ${pos.x}, pos.z: ${pos.z}`);
            const cute6Texture = textureLoader6.load(imagePath);
            
            // 이미지 로딩 완료 후 처리
            cute6Texture.onLoad = () => {
              console.log(`귀여운 눈6 ${pos.z > 0 ? '왼쪽' : '오른쪽'} 이미지 로딩 완료: ${imagePath}`);
            };
            
            cute6Texture.onError = (error) => {
              console.error(`귀여운 눈6 ${pos.z > 0 ? '왼쪽' : '오른쪽'} 이미지 로딩 실패:`, error, `경로: ${imagePath}`);
            };
            
            headlightGeometry = new THREE.PlaneGeometry(0.648, 0.648 * (201/293)); // 실제 이미지 비율: 293x201
            const cute6Material = new THREE.MeshBasicMaterial({ 
              map: cute6Texture,
              transparent: true,
              side: THREE.DoubleSide // 양면 렌더링
            });
            headlightMesh = new THREE.Mesh(headlightGeometry, cute6Material);
            
            // 좌우 눈에 따른 회전 조정 (pos.z 사용)
            if (pos.z < 0) { // 오른쪽 눈
              headlightMesh.rotation.y = -Math.PI / 2; // 오른쪽 눈도 왼쪽과 같은 방향
            } else { // 왼쪽 눈
              headlightMesh.rotation.y = -Math.PI / 2; // 왼쪽은 기존대로
            }
            
            console.log(`귀여운 눈6 ${pos.z > 0 ? '왼쪽' : '오른쪽'} 헤드램프 생성:`, headlightMesh);
            break;
            
          case 'cute7':
            // 귀여운 눈7 - 이미지 사용
            const textureLoader7 = new THREE.TextureLoader();
            const cute7Texture = textureLoader7.load('/headlights/headlight-cute7.png');
            
            // 이미지 로딩 완료 후 처리
            cute7Texture.onLoad = () => {
              console.log('귀여운 눈7 이미지 로딩 완료');
            };
            
            cute7Texture.onError = (error) => {
              console.error('귀여운 눈7 이미지 로딩 실패:', error);
            };
            
            headlightGeometry = new THREE.PlaneGeometry(0.6, 0.6 * (293/288)); // 실제 이미지 비율: 288x293
            const cute7Material = new THREE.MeshBasicMaterial({ 
              map: cute7Texture,
              transparent: true,
              side: THREE.DoubleSide // 양면 렌더링
            });
            headlightMesh = new THREE.Mesh(headlightGeometry, cute7Material);
            headlightMesh.rotation.y = -Math.PI / 2; // 차체 앞면에 붙이기 (좌우 반전)
            console.log('귀여운 눈7 헤드램프 생성:', headlightMesh);
            break;
            
          case 'cute8':
            // 귀여운 눈8 - 이미지 사용
            const textureLoader8 = new THREE.TextureLoader();
            const cute8Texture = textureLoader8.load('/headlights/headlight-cute8.png');
            
            // 이미지 로딩 완료 후 처리
            cute8Texture.onLoad = () => {
              console.log('귀여운 눈8 이미지 로딩 완료');
            };
            
            cute8Texture.onError = (error) => {
              console.error('귀여운 눈8 이미지 로딩 실패:', error);
            };
            
            headlightGeometry = new THREE.PlaneGeometry(0.6, 0.6 * (293/288)); // 실제 이미지 비율: 288x293
            const cute8Material = new THREE.MeshBasicMaterial({ 
              map: cute8Texture,
              transparent: true,
              side: THREE.DoubleSide // 양면 렌더링
            });
            headlightMesh = new THREE.Mesh(headlightGeometry, cute8Material);
            headlightMesh.rotation.y = -Math.PI / 2; // 차체 앞면에 붙이기 (좌우 반전)
            console.log('귀여운 눈8 헤드램프 생성:', headlightMesh);
            break;
            
          case 'cute9':
            // 귀여운 눈9 - 이미지 사용
            const textureLoader9 = new THREE.TextureLoader();
            const cute9Texture = textureLoader9.load('/headlights/headlight-cute9.png');
            
            // 이미지 로딩 완료 후 처리
            cute9Texture.onLoad = () => {
              console.log('귀여운 눈9 이미지 로딩 완료');
            };
            
            cute9Texture.onError = (error) => {
              console.error('귀여운 눈9 이미지 로딩 실패:', error);
            };
            
            headlightGeometry = new THREE.PlaneGeometry(0.6, 0.6 * (293/288)); // 실제 이미지 비율: 288x293
            const cute9Material = new THREE.MeshBasicMaterial({ 
              map: cute9Texture,
              transparent: true,
              side: THREE.DoubleSide // 양면 렌더링
            });
            headlightMesh = new THREE.Mesh(headlightGeometry, cute9Material);
            headlightMesh.rotation.y = -Math.PI / 2; // 차체 앞면에 붙이기 (좌우 반전)
            console.log('귀여운 눈9 헤드램프 생성:', headlightMesh);
            break;
            
          case 'cute10':
            // 귀여운 눈10 - 이미지 사용
            const textureLoader10 = new THREE.TextureLoader();
            const cute10Texture = textureLoader10.load('/headlights/headlight-cute10.png');
            
            // 이미지 로딩 완료 후 처리
            cute10Texture.onLoad = () => {
              console.log('귀여운 눈10 이미지 로딩 완료');
            };
            
            cute10Texture.onError = (error) => {
              console.error('귀여운 눈10 이미지 로딩 실패:', error);
            };
            
            headlightGeometry = new THREE.PlaneGeometry(0.6, 0.6 * (293/288)); // 실제 이미지 비율: 288x293
            const cute10Material = new THREE.MeshBasicMaterial({ 
              map: cute10Texture,
              transparent: true,
              side: THREE.DoubleSide // 양면 렌더링
            });
            headlightMesh = new THREE.Mesh(headlightGeometry, cute10Material);
            headlightMesh.rotation.y = -Math.PI / 2; // 차체 앞면에 붙이기 (좌우 반전)
            console.log('귀여운 눈10 헤드램프 생성:', headlightMesh);
            break;
            
          case 'cute11':
            // 귀여운 눈11 - 이미지 사용
            const textureLoader11 = new THREE.TextureLoader();
            const cute11Texture = textureLoader11.load('/headlights/headlight-cute11.png');
            
            // 이미지 로딩 완료 후 처리
            cute11Texture.onLoad = () => {
              console.log('귀여운 눈11 이미지 로딩 완료');
            };
            
            cute11Texture.onError = (error) => {
              console.error('귀여운 눈11 이미지 로딩 실패:', error);
            };
            
            headlightGeometry = new THREE.PlaneGeometry(0.6, 0.6 * (293/288)); // 실제 이미지 비율: 288x293
            const cute11Material = new THREE.MeshBasicMaterial({ 
              map: cute11Texture,
              transparent: true,
              side: THREE.DoubleSide // 양면 렌더링
            });
            headlightMesh = new THREE.Mesh(headlightGeometry, cute11Material);
            headlightMesh.rotation.y = -Math.PI / 2; // 차체 앞면에 붙이기 (좌우 반전)
            console.log('귀여운 눈11 헤드램프 생성:', headlightMesh);
            break;
            
          case 'cute12':
            // 귀여운 눈12 - 이미지 사용
            const textureLoader12 = new THREE.TextureLoader();
            const cute12Texture = textureLoader12.load('/headlights/headlight-cute12.png');
            
            // 이미지 로딩 완료 후 처리
            cute12Texture.onLoad = () => {
              console.log('귀여운 눈12 이미지 로딩 완료');
            };
            
            cute12Texture.onError = (error) => {
              console.error('귀여운 눈12 이미지 로딩 실패:', error);
            };
            
            headlightGeometry = new THREE.PlaneGeometry(0.6, 0.6 * (293/288)); // 실제 이미지 비율: 288x293
            const cute12Material = new THREE.MeshBasicMaterial({ 
              map: cute12Texture,
              transparent: true,
              side: THREE.DoubleSide // 양면 렌더링
            });
            headlightMesh = new THREE.Mesh(headlightGeometry, cute12Material);
            headlightMesh.rotation.y = -Math.PI / 2; // 차체 앞면에 붙이기 (좌우 반전)
            console.log('귀여운 눈12 헤드램프 생성:', headlightMesh);
            break;
            
          case 'angry-eyes':
            // 화난 눈 - 기울어진 직사각형 판
            headlightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.05);
            headlightMesh = new THREE.Mesh(headlightGeometry, new THREE.MeshLambertMaterial({ color: '#FF6B6B' }));
            headlightMesh.rotation.y = Math.PI / 2; // Y축으로 90도 회전
            headlightMesh.rotation.z = pos.z > 0 ? -0.3 : 0.3; // 양쪽이 다르게 기울어짐
            break;
            
          case 'happy-eyes':
            // 웃는 눈 - 반달 모양 판
            headlightGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16, 1, false, 0, Math.PI);
            headlightMesh = new THREE.Mesh(headlightGeometry, new THREE.MeshLambertMaterial({ color: '#FFFFFF' }));
            headlightMesh.rotation.z = Math.PI / 2; // Z축으로 90도 회전해서 눞히기 (동그란 헤드램프와 동일)
            break;
            
          case 'blinking-eyes':
            // 깜빡이는 눈 - 작은 타원형 판
            headlightGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16);
            headlightGeometry.scale(1, 0.3, 1); // Y축으로 압축해서 깜빡이는 모양
            headlightMesh = new THREE.Mesh(headlightGeometry, new THREE.MeshLambertMaterial({ color: '#FFFFFF' }));
            headlightMesh.rotation.z = Math.PI / 2; // Z축으로 90도 회전해서 눞히기
            break;
            
          default:
            // 기본 헤드램프 (동그란 노란색 원판)
            headlightGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
            headlightMesh = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlightMesh.rotation.z = Math.PI / 2; // Z축으로 90도 회전해서 눞히기
            headlightMesh.rotation.y = Math.PI / 2; // Y축으로 90도 회전
            break;
        }
        
        if (headlightMesh) {
          headlightMesh.position.set(pos.x, headlightY, pos.z);
          
          // cute-eyes-image, cute2, cute3, cute4, cute5, cute6, cute7, cute8, cute9, cute10, cute11, cute12는 그림자 제거
          if (selectedHeadlight === 'cute-eyes-image' || selectedHeadlight === 'cute2' || selectedHeadlight === 'cute3' || selectedHeadlight === 'cute4' || selectedHeadlight === 'cute5' || selectedHeadlight === 'cute6' || selectedHeadlight === 'cute7' || selectedHeadlight === 'cute8' || selectedHeadlight === 'cute9' || selectedHeadlight === 'cute10' || selectedHeadlight === 'cute11' || selectedHeadlight === 'cute12') {
            headlightMesh.castShadow = false;
            headlightMesh.receiveShadow = false;
          } else {
            headlightMesh.castShadow = true;
          }
          
          scene.add(headlightMesh);
        }
      });
      
      console.log(`헤드램프 추가됨: ${selectedHeadlight}`);
    }

    // 그릴 렌더링 (selectedGrille prop에 따라)
    if (selectedGrille && selectedGrille.startsWith('grill-')) {
      const grilleTextureLoader = new THREE.TextureLoader();
      const grilleImagePath = `/grills/${selectedGrille}.png`;
      
      grilleTextureLoader.load(
        grilleImagePath,
        (grilleTexture) => {
          console.log(`${selectedGrille} 그릴 이미지 로딩 성공`);
          
          // 그릴 크기 설정 (이미지 비율에 맞춰서: 696 * 229)
          // 비율: 696/229 ≈ 3.04 (가로가 세로보다 3.04배 길음)
          const grilleWidth = 0.8 * 1.4 * 1.1 * 1.1; // 가로 크기 (40% + 10% + 10% 증가)
          const grilleHeight = grilleWidth / (696 / 229); // 실제 이미지 비율에 맞춘 세로 크기
          const grilleGeometry = new THREE.PlaneGeometry(grilleWidth, grilleHeight);
          const grilleMaterial = new THREE.MeshBasicMaterial({ 
            map: grilleTexture,
            transparent: true,
            side: THREE.DoubleSide
          });
          
          // 그릴 메시 생성
          const grilleMesh = new THREE.Mesh(grilleGeometry, grilleMaterial);
          
          // 그릴 위치 설정 (헤드램프 사이, 차량 앞면 중앙)
          // 헤드램프는 totalDepth * 0.3과 -totalDepth * 0.3에 위치하므로 그 사이 중앙(0)에 배치
          // 그릴을 차체 표면에 붙이되 헤드램프와 겹치지 않도록 배치
          let grilleY;
          if (carType === 'sports') {
            // 스포츠카: 미세하게 위로 조정
            grilleY = totalHeight * 0.275; // 0.265에서 0.275로 더 위로
          } else {
            // 일반 차량: 미세하게 위로 조정
            grilleY = totalHeight * 0.285; // 0.28에서 0.285로 미세하게 위로
          }
          grilleMesh.position.set(-totalLength / 2 - 0.01, grilleY, 0);
          grilleMesh.rotation.x = 0; // 앞쪽을 향하도록
          grilleMesh.rotation.y = Math.PI / 2 + Math.PI; // Y축으로 90도 + 180도 회전하여 올바른 방향으로
          grilleMesh.rotation.z = 0;
          grilleMesh.castShadow = false;
          grilleMesh.receiveShadow = false;
          
          scene.add(grilleMesh);
          console.log(`${selectedGrille} 그릴 추가됨`);
        },
        undefined,
        (error) => {
          console.error(`${selectedGrille} 그릴 이미지 로딩 실패:`, error);
        }
      );
    }

    // 리어램프 렌더링 (selectedTaillight prop에 따라)
    console.log('리어램프 렌더링 체크:', selectedTaillight);
    if (selectedTaillight) {
      console.log('리어램프 렌더링 시작:', selectedTaillight);
      const taillightTextureLoader = new THREE.TextureLoader();
      const taillightImagePath = `/rearlights/${selectedTaillight}.png`;
      console.log('리어램프 이미지 경로:', taillightImagePath);
      
      taillightTextureLoader.load(
        taillightImagePath,
        (taillightTexture) => {
          console.log(`${selectedTaillight} 리어램프 이미지 로딩 성공`);
          
          // 리어램프 크기 설정 (이미지 비율에 맞춰서: 293 x 288)
          // 비율: 293/288 ≈ 1.02 (거의 정사각형)
          const taillightWidth = 0.5; // 가로 크기
          const taillightHeight = taillightWidth * (288 / 293); // 실제 이미지 비율에 맞춘 세로 크기
          const taillightGeometry = new THREE.PlaneGeometry(taillightWidth, taillightHeight);
          const taillightMaterial = new THREE.MeshBasicMaterial({ 
            map: taillightTexture,
            transparent: true,
            side: THREE.DoubleSide
          });
          
          // 리어램프 위치 계산 (차량 후면 양쪽 가장자리)
          let taillightY;
          if (carType === 'sports') {
            // 스포츠카: 낮은 차체 구조로 인해 리어램프를 조금 아래로
            taillightY = totalHeight * 0.38; // 차량 높이의 38% 위치 (조금 올림)
          } else if (carType === 'truck') {
            // 트럭: 기존 위치 유지
            taillightY = totalHeight * 0.4; // 차량 높이의 40% 위치
          } else {
            // 일반 차량 (꼬마세단, 큰세단, SUV, 통통버스, 네모버스): 5% 위로
            taillightY = totalHeight * 0.45; // 차량 높이의 45% 위치 (40%에서 5% 올림)
          }
          
          // 차량 타입에 따른 리어램프 위치 조정
          let taillightX;
          if (carType === 'truck') {
            // 트럭: 차체가 totalLength/1.5까지 길어짐
            taillightX = totalLength / 1.5 + 0.02;
          } else if (carType === 'bus') {
            // 네모버스: 차체가 totalLength/1.8까지 길어짐
            taillightX = totalLength / 1.8 + 0.02;
          } else {
            // 일반 차량 (세단, SUV, 스포츠카, 통통버스): 차체가 totalLength/2까지
            taillightX = totalLength / 2 + 0.02;
          }
          const taillightPositions = [
            { x: taillightX, y: taillightY, z: totalDepth * 0.3 }, // 왼쪽 리어램프
            { x: taillightX, y: taillightY, z: -totalDepth * 0.3 }  // 오른쪽 리어램프
          ];
          
          taillightPositions.forEach((pos, index) => {
            const taillightMesh = new THREE.Mesh(taillightGeometry, taillightMaterial.clone());
            
            // 리어램프 위치 설정
            taillightMesh.position.set(pos.x, pos.y, pos.z);
            taillightMesh.rotation.x = 0; // 앞쪽을 향하도록
            taillightMesh.rotation.y = Math.PI / 2; // Y축으로 90도 회전하여 뒤쪽을 향하도록
            taillightMesh.rotation.z = 0;
            taillightMesh.castShadow = false;
            taillightMesh.receiveShadow = false;
            
            console.log(`리어램프 ${index + 1} 위치:`, pos.x, pos.y, pos.z);
            scene.add(taillightMesh);
          });
          
          console.log(`${selectedTaillight} 리어램프 양쪽에 추가됨`);
        },
        undefined,
        (error) => {
          console.error(`${selectedTaillight} 리어램프 이미지 로딩 실패:`, error);
        }
      );
    }

    // 번호판 렌더링 (selectedPlate prop에 따라)
    console.log('번호판 렌더링 체크:', selectedPlate);
    if (selectedPlate) {
      console.log('번호판 렌더링 시작:', selectedPlate);
      const plateTextureLoader = new THREE.TextureLoader();
      const plateImagePath = `/plates/${selectedPlate}.png`;
      console.log('번호판 이미지 경로:', plateImagePath);
      
      plateTextureLoader.load(
        plateImagePath,
        (plateTexture) => {
          console.log(`${selectedPlate} 번호판 이미지 로딩 성공`);
          
          // 번호판 크기 설정 (실제 이미지 비율에 맞춤: 517 x 174)
          const plateWidth = 1.0; // 가로 크기
          const plateHeight = plateWidth * (174 / 517); // 실제 이미지 비율에 맞춘 세로 크기
          const plateGeometry = new THREE.PlaneGeometry(plateWidth, plateHeight);
          const plateMaterial = new THREE.MeshBasicMaterial({ 
            map: plateTexture,
            transparent: true,
            side: THREE.DoubleSide
          });
          
          // 번호판 위치 계산 (리어램프보다 더 아래로)
          let plateY;
          if (carType === 'sports') {
            plateY = totalHeight * 0.24; // 스포츠카: 아주 조금만 위로
          } else if (carType === 'truck') {
            plateY = totalHeight * 0.25; // 트럭: 아주 조금만 위로
          } else {
            plateY = totalHeight * 0.28; // 일반 차량: 조금 위로
          }
          
          // 차량 타입에 따른 번호판 X 위치 (리어램프와 동일)
          let plateX;
          if (carType === 'truck') {
            plateX = totalLength / 1.5 + 0.02;
          } else if (carType === 'bus') {
            plateX = totalLength / 1.8 + 0.02;
          } else {
            plateX = totalLength / 2 + 0.02;
          }
          
          // 번호판 1개만 생성 (중앙에 배치)
          const plateMesh = new THREE.Mesh(plateGeometry, plateMaterial);
          plateMesh.position.set(plateX, plateY, 0); // z: 0으로 중앙에 배치
          plateMesh.rotation.x = 0; // 앞쪽을 향하도록
          plateMesh.rotation.y = Math.PI / 2; // Y축으로 90도 회전하여 뒤쪽을 향하도록
          plateMesh.rotation.z = 0;
          plateMesh.castShadow = false;
          plateMesh.receiveShadow = false;
          plateMesh.name = 'plate';
          
          console.log(`번호판 위치:`, plateX, plateY, 0);
          scene.add(plateMesh);
          
          console.log(`${selectedPlate} 번호판 중앙에 추가됨`);
        },
        undefined,
        (error) => {
          console.error(`${selectedPlate} 번호판 이미지 로딩 실패:`, error);
        }
      );
    }

    // 렌더링
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 마운트
    mountRef.current.appendChild(renderer.domElement);

    console.log('렌더링 시작됨');

    // 윈도우 리사이즈 이벤트 추가 (반응형 크기 재계산)
    const handleResize = (mobileMode: boolean) => {
      if (mountRef.current && fill) {
        // mobileMode 매개변수를 사용하여 크기 계산
        const screenWidth = window.innerWidth;
        const canvasSize = mobileMode ? Math.floor(screenWidth * 0.9) : Math.floor(screenWidth * 0.85); // 모바일에서 90%로 증가
        
        const newWidth = canvasSize;
        const newHeight = mobileMode 
          ? Math.floor(canvasSize * 0.75) // 모바일: 4:3 비율
          : Math.floor(canvasSize * 0.5625); // 데스크톱: 16:9 비율
        
        console.log('🔄 ThreeDRenderer handleResize 크기 (mobileMode 기반):', {
          mobileMode,
          screenWidth,
          canvasSize,
          newWidth,
          newHeight,
          aspectRatio: newWidth / newHeight
        });
        
        if (newWidth > 0 && newHeight > 0) {
          // 모바일 해상도 제한
          const isMobileDevice = window.innerWidth <= 768;
          const pixelRatio = isMobileDevice ? 1 : Math.min(window.devicePixelRatio || 1, 2);
          renderer.setPixelRatio(pixelRatio);
          renderer.setSize(newWidth, newHeight);
        camera.aspect = newWidth / newHeight;
          camera.fov = fov;
        camera.updateProjectionMatrix();
          console.log('3D 캔버스 크기 조정됨:', newWidth, 'x', newHeight, '모바일:', mobileMode, '픽셀비율:', pixelRatio);
        }
      }
    };

    window.addEventListener('resize', () => handleResize(window.innerWidth <= 768));

    // Cleanup
    return () => {
      window.removeEventListener('resize', () => handleResize(window.innerWidth <= 768));
      
      // 씬의 모든 객체 정리
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((mat) => mat.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      
      // 씬 초기화
      scene.clear();
      
      // 렌더러 정리
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
        renderer.dispose();
      
      // ref 정리
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [carType, drawingAnalysis, carColor, roofColor, headlightColor, taillightColor, selectedHeadlight, selectedWheel || null, selectedBadge, selectedPlate, selectedGrille, selectedTaillight]);


  return (
    <div 
      className="w-full h-full relative"
      style={{ 
        minHeight: '400px',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 1
      }}
    >
    <div 
      ref={mountRef} 
        className="w-full h-full bg-white"
        style={{ 
          position: 'relative',
          zIndex: 0
        }}
      />
    </div>
  );
});

ThreeDRenderer.displayName = 'ThreeDRenderer';

export default ThreeDRenderer;
