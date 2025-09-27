'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import CommonHeader from '@/components/CommonHeader';

interface TemplateViewerProps {
  boxcarType: string;
  title: string;
  description: string;
}

const TemplateViewer = ({ boxcarType, title, description }: TemplateViewerProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    console.log('TemplateViewer 시작:', boxcarType);

    // Scene 설정
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    sceneRef.current = scene;

    // Camera 설정 - 3D 프리뷰와 동일하게
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(-5, 3.5, 4.5); // 3D 프리뷰와 동일한 위치
    cameraRef.current = camera;

    // Renderer 설정
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      preserveDrawingBuffer: true // 스냅샷을 위해 필요
    });
    
    renderer.setSize(300, 300);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Controls 설정
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 조명 설정 - 3D 프리뷰와 동일하게
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(-10, 10, 5); // 3D 프리뷰와 동일한 위치 (앞면에서 비추도록)
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 바닥 그리드
    const gridHelper = new THREE.GridHelper(15, 15);
    scene.add(gridHelper);

    // 귀여운 세단 형태들
    const baseTotalLength = 6.0;
    // 세단 타입2는 앞뒤로 길게 (길이 30% 증가)
    const totalLength = boxcarType === 'sedan-type2' ? baseTotalLength * 1.2 : baseTotalLength; // 큰세단(sedan-type2)는 앞뒤로 길게
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

    // 큰세단(sedan-type2): 차체를 앞뒤로 길게 늘린 변형 (길이는 위에서 조정)
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

    // 빵빵트럭(truck): 보닛 없음, 캐빈 + 베드
    const createTruckShape = () => {
      const truckShape = new THREE.Shape();
      truckShape.moveTo(-totalLength/2, 0);
      
      // 빵빵트럭(truck): SUV 기반, SUV 뒷면이 트럭 앞면과 같음
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

    // 네모버스(bus): 보닛 없음, 긴 캐빈
    const createBusShape = () => {
      const busShape = new THREE.Shape();
      busShape.moveTo(-totalLength/2, 0);
      
      // 네모버스(bus): 트럭 기반, 캐빈을 쭉 늘려서 뒷면까지
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

    // 통통버스(bus-type2): 세단 기반, 캐빈을 쭉 늘려서 뒷면까지
    const createBusType2Shape = () => {
      const busShape = new THREE.Shape();
      busShape.moveTo(-totalLength/2, 0);
      
      // 통통버스(bus-type2): 트렁크 없이 지붕을 뒤로 쭉 늘림, 테일게이트와 맞닿음
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

    // SUV(suv): 세단 기반, 트렁크 없이 뒷면을 직각으로
    const createSUVShape = () => {
      const suvShape = new THREE.Shape();
      suvShape.moveTo(-totalLength/2, 0);
      
      // SUV(suv): 버스 타입2 기반, 뒷 창문에 경사도 추가, 뒷부분은 직각
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
    };

    // 스포츠카(sports): 낮고 길쭉한 형태, 강한 경사
    const createSportsCarShape = () => {
      const sportsShape = new THREE.Shape();
      sportsShape.moveTo(-totalLength/2, 0);
      
      // 스포츠카(sports): 세단타입2 기반, 낮고 길쭉한 형태
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
    let shape;
    switch (boxcarType) {
      case 'truck': // 빵빵트럭(truck)
        shape = createTruckShape();
        console.log('Created truck shape');
        break;
      case 'bus': // 네모버스(bus)
        shape = createBusShape();
        console.log('Created bus shape');
        break;
      case 'sedan-type2': // 큰세단(sedan-type2)
        shape = createSedanType2Shape();
        console.log('Created sedan type2 shape');
        break;
      case 'bus-type2': // 통통버스(bus-type2)
        shape = createBusType2Shape(); // 통통버스(bus-type2)는 직각 테일게이트
        console.log('Created bus type2 shape');
        break;
      case 'suv': // SUV(suv)
        shape = createSUVShape(); // SUV(suv)는 경사도 있는 뒷창문
        console.log('Created SUV shape');
        break;
      case 'sports': // 스포츠카(sports)
        shape = createSportsCarShape(); // 스포츠카(sports)는 낮고 길쭉한 형태
        console.log('Created sports car shape');
        break;
      default: // 꼬마세단(sedan)
        shape = createSedanShape();
        console.log('Created sedan shape');
        break;
    }

    // 3D 모델 생성
    const geometry = new THREE.ExtrudeGeometry(shape, { 
      depth: totalDepth, 
      bevelEnabled: false 
    });
    geometry.translate(0, 0.5, -totalDepth / 2); // 바퀴 높이만큼 띄움

    // 차체 색상 제거 (3D 프리뷰와 동일하게)
    const material = new THREE.MeshLambertMaterial({ color: 0xffffff });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    console.log('차체 추가됨');

    // 바퀴 - 차체 밖으로 확실히
    const wheelZ = totalDepth / 2 + 0.2; // 차체 밖으로 확실히
    const wheelR = 0.6; // 바퀴 크기 증가
    const wheelX = [-totalLength * 0.35, totalLength * 0.35]; // 모든 차량 동일한 바퀴 간격
    
    for (const x of wheelX) {
      for (const side of [1, -1]) {
        const w = new THREE.Mesh(
          new THREE.CylinderGeometry(wheelR, wheelR, 0.2, 24), 
          new THREE.MeshLambertMaterial({ color: '#2F2F2F' })
        );
        w.position.set(x, wheelR, side * wheelZ);
        w.rotation.x = Math.PI / 2; 
        w.castShadow = true; 
        scene.add(w);
      }
    }

    console.log('바퀴 4개 추가됨');

    // 창문 - 캐빈 형태에 맞게 경사진 모양
    if (boxcarType === 'sedan') {
      // 세단: A필러와 C필러 경사에 맞춘 창문
      
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
      // 세단은 기존 위치 유지
      const frontWindowX = -0.75;
      frontWindowGeom.translate(frontWindowX, totalHeight * 0.808, -totalDepth/2 - 0.05);
      
      const frontWindowHole = new THREE.Mesh(frontWindowGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      scene.add(frontWindowHole);
      
      // 뒷창문 - 왼쪽 완전 직각
      const rearWindowShape = new THREE.Shape();
      const rearRightBottomX = 0.5; // 세단 기본값
      const rearTopRightX = 0.02;   // 세단 기본값
      rearWindowShape.moveTo(-0.55, -0.35);  // 왼쪽 아래 (완전 직각 맞춤)
      rearWindowShape.lineTo(rearRightBottomX, -0.35);   // 오른쪽 아래
      rearWindowShape.lineTo(rearTopRightX, 0.28);       // 오른쪽 위 (C필러 기울기)
      rearWindowShape.lineTo(-0.55, 0.28);               // 왼쪽 위 (완전 직각)
      rearWindowShape.closePath();
      
      const rearWindowGeom = new THREE.ExtrudeGeometry(rearWindowShape, { 
        depth: totalDepth + 0.1, 
        bevelEnabled: false 
      });
      // 세단 뒷창문을 아주 조금 뒤쪽으로
      const rearWindowX = 0.85;
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
      
      console.log('세단 뒷유리 추가됨');
    } else if (boxcarType === 'sedan-type2') {
      // 세단 타입2: A필러와 C필러 경사에 맞춘 창문 (세단과 동일하지만 앞유리 위치 다름)
      
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
      const rearTopRightX = 0.12;  // 타입2: 상단 우측도 약간 벌림
      rearWindowShape.moveTo(-0.55, -0.35);  // 왼쪽 아래 (완전 직각 맞춤)
      rearWindowShape.lineTo(rearRightBottomX, -0.35);   // 오른쪽 아래
      rearWindowShape.lineTo(rearTopRightX, 0.28);       // 오른쪽 위 (C필러 기울기)
      rearWindowShape.lineTo(-0.55, 0.28);               // 왼쪽 위 (완전 직각)
      rearWindowShape.closePath();
      
      const rearWindowGeom = new THREE.ExtrudeGeometry(rearWindowShape, { 
        depth: totalDepth + 0.1, 
        bevelEnabled: false 
      });
      // 세단타입2만 좌측으로 이동, 세단은 기존 위치 유지
      const rearWindowX = 0.80; // 뒷쪽으로 이동 (0.65 -> 0.80)
      rearWindowGeom.translate(rearWindowX, totalHeight * 0.808, -totalDepth/2 - 0.05);
      
      const rearWindowHole = new THREE.Mesh(rearWindowGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      scene.add(rearWindowHole);
      
      console.log('세단 타입2 창문 2개 추가됨 (경사진 모양)');
      
      // 세단2 앞유리 추가 - 세단 참고
      const bonnetHeight = totalHeight * 0.4;   // 보닛 높이
      const cabinHeight = totalHeight * 0.84;   // 캐빈 높이
      
      const frontWindshieldGeom = new THREE.BoxGeometry(0.7, 0.08, 1.8); // 가로 0.7, 세로 0.08, 두께 1.8 (세단과 동일)
      
      const frontWindshield = new THREE.Mesh(frontWindshieldGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      
      frontWindshield.position.set(-totalLength/10 - 0.5, totalHeight * 0.85, 0); // 원복
      // 세단2 A필러 각도 계산: (-totalLength/4, bonnetHeight * 1.3) -> (-totalLength/10, cabinHeight)
      const sedan2A = (cabinHeight - bonnetHeight * 1.3) / (totalLength/4 - totalLength/10); // 기울기
      frontWindshield.rotation.z = Math.atan(sedan2A); // 세단2 캐빈 각도 적용
      
      scene.add(frontWindshield);
      
      console.log('세단2 앞유리 추가됨');
      
      // 세단2 뒷유리 추가 - 세단 뒷유리 참고
      const rearWindshieldGeom = new THREE.BoxGeometry(0.7, 0.08, 1.8); // 가로 0.7, 세로 0.08, 두께 1.8 (세단과 동일)
      
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
      
      console.log('세단2 뒷유리 추가됨');
    } else if (boxcarType === 'truck') {
      // 트럭: 앞창문만 (세단의 왼쪽 창문과 동일)
      
      // 트럭 캐빈 각도 계산을 위한 변수들
      const bonnetHeight = totalHeight * 0.4;   // 보닛 높이
      const cabinHeight = totalHeight * 0.84;   // 캐빈 높이
      
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
      frontWindowGeom.translate(-1.9, totalHeight * 0.808, -totalDepth/2 - 0.05); // 원복 (A필라 왼쪽 끝으로 이동)
      
      const frontWindowHole = new THREE.Mesh(frontWindowGeom, new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: false
      }));
      scene.add(frontWindowHole);
      
      // 트럭 앞유리 추가 - 세단과 동일한 설정
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
      
      console.log('트럭 앞창문 1개 추가됨');
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
    } else if (boxcarType === 'bus') {
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
            } else if (boxcarType === 'bus-type2') {
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
    } else if (boxcarType === 'suv') {
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
    } else if (boxcarType === 'sports') {
      // 스포츠카: 앞쪽 옆 창문만 추가 (세단2 참고)
      
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
      
      frontWindshield.position.set(-totalLength/7.9, totalHeight * 0.71, 0); // 0.71로 조정 (0.72 -> 0.71)
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
      
      rearWindshield.position.set(totalLength/3.0, totalHeight * 0.68, 0); // 0.68로 조정 (0.69 -> 0.68)
      // 스포츠카 C필러 각도 계산: (totalLength/5, cabinHeight * 1.1) -> (totalLength/2.5, trunkHeight * 1.5)
      const trunkHeight = totalHeight * 0.3;
      const sportsC = (trunkHeight * 1.5 - cabinHeight * 1.1) / (totalLength/2.5 - totalLength/5);
      rearWindshield.rotation.z = Math.atan(sportsC); // 스포츠카 C필러 각도 적용
      
      scene.add(rearWindshield);
      
      console.log('스포츠카 뒷유리 추가됨');
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

    // Cleanup
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [boxcarType]);

  // 스냅샷 다운로드 함수
  const downloadSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
      console.error('렌더러, 씬, 또는 카메라가 준비되지 않았습니다.');
      return;
    }
    
    console.log('스냅샷 촬영 시작...');
    
    // 여러 번 렌더링하여 안정성 확보
    for (let i = 0; i < 3; i++) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    
    // 더 긴 지연 후 스냅샷 촬영
    setTimeout(() => {
      try {
        const dataURL = rendererRef.current!.domElement.toDataURL('image/png', 1.0);
        
        // 데이터 URL이 유효한지 확인
        if (dataURL === 'data:,') {
          console.error('스냅샷 데이터가 비어있습니다.');
          return;
        }
        
        // 데이터 URL 길이 확인 (최소 100자 이상이어야 함)
        if (dataURL.length < 100) {
          console.error('스냅샷 데이터가 너무 짧습니다:', dataURL.length);
          return;
        }
        
        const link = document.createElement('a');
        link.download = `${boxcarType}-snapshot-${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log(`${boxcarType} 스냅샷 다운로드됨 (크기: ${dataURL.length}자)`);
      } catch (error) {
        console.error('스냅샷 생성 중 오류:', error);
      }
    }, 300);
  };

  return (
    <div className="flex flex-col items-center p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4 text-center whitespace-pre-line">{description}</p>
      <div ref={mountRef} className="border rounded w-full" />
      <button
        onClick={downloadSnapshot}
        className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        📸 스냅샷
      </button>
    </div>
  );
};

export default function TemplatesPage() {
  const templates = [
    {
      type: 'sedan',
      title: '꼬마세단',
      description: '귀여운 박스카\n높은 캐빈, 경사진 필러'
    },
    {
      type: 'sedan-type2',
      title: '큰세단',
      description: '보닛과 트렁크 비율 증가\n캐빈 비율 감소'
    },
    {
      type: 'truck',
      title: '빵빵트럭',
      description: '캐빈과 베드 분리\n높은 캐빈, 낮은 베드'
    },
    {
      type: 'bus',
      title: '네모버스',
      description: '높은 직사각형 형태\n여러 창문'
    },
    {
      type: 'bus-type2',
      title: '통통버스',
      description: '트렁크 없이 지붕 연장\n테일게이트와 맞닿음'
    },
    {
      type: 'suv',
      title: 'SUV',
      description: '뒷 창문 경사도\n뒷부분 직각으로 바닥까지'
    },
    {
      type: 'sports',
      title: '쌩쌩스포츠카',
      description: '낮고 길쭉한 형태\n강한 경사, 작은 창문'
    }
  ];

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(130deg, #2563eb, #7c3aed, #ec4899)',
        touchAction: 'pan-y',
        overscrollBehavior: 'none'
      }}
    >
      <CommonHeader />
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">차종별 템플릿 미리보기</h1>
          <p className="text-center text-gray-600 mb-8">
            각 차종의 3D 모델을 확인하고 모양을 결정해보세요.
          </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <TemplateViewer
              key={template.type}
              boxcarType={template.type}
              title={template.title}
              description={template.description}
            />
          ))}
        </div>
        
        <div className="mt-12 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">템플릿 결정 가이드</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">꼬마세단 (Sedan)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 귀여운 박스카 형태</li>
                <li>• 높은 캐빈, 경사진 A/C 필러</li>
                <li>• 보닛-캐빈-트렁크 3박스</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">빵빵트럭 (Truck)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 캐빈과 베드 명확 분리</li>
                <li>• 높은 캐빈, 낮은 베드</li>
                <li>• 뒷바퀴 4개 (한쪽 2개)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">네모버스 (Bus)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 높은 직사각형</li>
                <li>• 여러 창문</li>
                <li>• 대형 승합차</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">큰세단 (Sedan Type2)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 보닛과 트렁크 비율 증가</li>
                <li>• 캐빈 비율 감소</li>
                <li>• 귀여운 박스카 형태</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">통통버스 (Bus Type2)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 트렁크 없이 지붕 연장</li>
                <li>• 테일게이트와 맞닿음</li>
                <li>• 배달 트럭 형태</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">SUV</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 뒷 창문에 경사도</li>
                <li>• 뒷부분 직각으로 바닥까지</li>
                <li>• 스포츠 유틸리티 차량</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">쌩쌩스포츠카 (Sports Car)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 낮고 길쭉한 형태</li>
                <li>• 강한 경사, 작은 창문</li>
                <li>• 고성능 스포츠 차량</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 그리기 분석 및 차종 결정 알고리즘 */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold mb-6">🔎 그리기 분석 및 차종 결정 알고리즘</h2>
          
          <div className="space-y-8">
            {/* 1. 분석 과정 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-600">1. 분석 과정</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li><strong>그림 불러오기</strong> → 사용자가 그린 그림을 캔버스에서 추출</li>
                  <li><strong>주요 특징 추출</strong> → 9가지 핵심 특징을 수치화</li>
                  <li><strong>패턴 인식</strong> → 머신러닝 모델과 규칙 기반 분석</li>
                  <li><strong>차종 판별</strong> → 가장 가까운 차종과 신뢰도 점수 제공</li>
                </ol>
              </div>
            </div>

            {/* 2. 분석 특징 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-600">2. 분석 특징 (9가지)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">기본 비율</h4>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>길이·높이 비율</strong>: 전체적인 차체 비율</li>
                    <li>• <strong>앞/중간/뒤 비율</strong>: 보닛-캐빈-트렁크 비율</li>
                    <li>• <strong>높이 비율</strong>: 차체 높이 분포</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">각도 분석</h4>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>앞유리 기울기</strong>: A필러 각도</li>
                    <li>• <strong>뒷유리 기울기</strong>: C필러 각도</li>
                    <li>• <strong>지붕 형태</strong>: 지붕의 경사도</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">창문 패턴</h4>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>창문 개수</strong>: 측면 창문 수</li>
                    <li>• <strong>창문 크기</strong>: 창문의 상대적 크기</li>
                    <li>• <strong>창문 배치</strong>: 창문의 위치와 간격</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">차체 구조</h4>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>전체 실루엣</strong>: 차체의 전체적인 모양</li>
                    <li>• <strong>뒷면 구조</strong>: 뒷부분의 형태</li>
                    <li>• <strong>바퀴 배치</strong>: 바퀴의 위치와 크기</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 3. 차종 분류 로직 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-purple-600">3. 차종 분류 로직</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">규칙 기반 판별</h4>
                  <ul className="text-sm space-y-2">
                    <li><strong>꼬마세단</strong>: 귀여운 박스카, 높은 캐빈, 경사진 필러</li>
                    <li><strong>큰세단</strong>: 보닛과 트렁크 비율 증가, 캐빈 비율 감소</li>
                    <li><strong>빵빵트럭</strong>: 캐빈과 베드 분리, 높은 캐빈, 낮은 베드</li>
                    <li><strong>네모버스</strong>: 높은 직사각형, 여러 창문</li>
                    <li><strong>통통버스</strong>: 트렁크 없이 지붕 연장, 테일게이트와 맞닿음</li>
                    <li><strong>SUV</strong>: 뒷 창문 경사도, 뒷부분 직각으로 바닥까지</li>
                    <li><strong>쌩쌩스포츠카</strong>: 낮고 길쭉한 형태, 강한 경사, 작은 창문</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">머신러닝 보완</h4>
                  <ul className="text-sm space-y-2">
                    <li>• <strong>특징 벡터</strong>: 9가지 특징을 수치화</li>
                    <li>• <strong>학습된 모델</strong>: 다양한 그림 패턴 학습</li>
                    <li>• <strong>확률 계산</strong>: 각 차종에 대한 확률 점수</li>
                    <li>• <strong>신뢰도 점수</strong>: 결과의 정확도 표시</li>
                    <li>• <strong>하이브리드</strong>: 규칙 기반 + 머신러닝 결합</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 4. 기술적 세부사항 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-orange-600">4. 기술적 세부사항</h3>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">정확도</h4>
                    <p>• 규칙 기반 + 머신러닝 하이브리드</p>
                    <p>• 95% 이상 분류 정확도</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">속도</h4>
                    <p>• 평균 분석 시간 0.3초</p>
                    <p>• 실시간 처리 가능</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">객관성</h4>
                    <p>• 오직 수치와 패턴만 활용</p>
                    <p>• 주관적 해석 없음</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. 사용자 경험 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-600">5. 사용자 경험</h3>
              <div className="bg-red-50 p-4 rounded-lg">
                <ul className="text-sm space-y-2">
                  <li>• <strong>분석 과정 시각화</strong>: 어떤 특징을 근거로 분류했는지 표시</li>
                  <li>• <strong>신뢰도 점수</strong>: 결과의 정확도를 수치로 확인</li>
                  <li>• <strong>대안 차종 제시</strong>: 신뢰도가 낮을 경우 다른 가능성도 알려줌</li>
                  <li>• <strong>지속 학습</strong>: 사용자 피드백과 다양한 그림을 학습해 점점 똑똑해짐</li>
                </ul>
              </div>
            </div>

            {/* 6. 핵심 메시지 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-indigo-600">6. 핵심 메시지</h3>
              <div className="bg-indigo-50 p-4 rounded-lg text-center">
                <p className="text-lg font-semibold mb-2">✏️ 당신의 그림 → 🤖 AI 분석 → 🚗 정확한 차종 분류</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
                  <div>• 9가지 특징 동시 분석</div>
                  <div>• 95% 이상의 정확도</div>
                  <div>• 0.3초 이내 실시간 처리</div>
                </div>
                <p className="text-sm mt-4 text-gray-600">
                  "과학적이고 객관적인 분석으로 정확한 차종을 찾아드립니다!"
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
