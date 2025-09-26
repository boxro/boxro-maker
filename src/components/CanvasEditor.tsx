'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Box, 
  Circle, 
  Save, 
  Download, 
  Trash2, 
  Copy, 
  RotateCcw,
  RotateCw,
  FileText,
  Cylinder
} from 'lucide-react';

interface CanvasEditorProps {
  onSave?: (canvasData: string) => void;
  initialData?: string;
}

interface Shape3D {
  id: string;
  type: 'box' | 'cylinder' | 'sphere' | 'triangularPrism' | 'trapezoidPrism';
  mesh: THREE.Mesh;
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  color: string;
  isHole?: boolean; // 병합 시 구멍(빼기) 역할
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ onSave, initialData }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const [shapes, setShapes] = useState<Shape3D[]>([]);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const isRotatingRef = useRef(false);
  const orbitRef = useRef<OrbitControls>();
  const transformRef = useRef<TransformControls>();
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const isTransformDraggingRef = useRef(false);
  const [blueprintTitle, setBlueprintTitle] = useState<string>('Boxro Blueprint');
  const [blueprintDescription, setBlueprintDescription] = useState<string>('');
  const [mmPerUnit, setMmPerUnit] = useState<number>(30);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  // 드래그 이동 제어
  const isDraggingRef = useRef(false);
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragOffsetRef = useRef(new THREE.Vector3());
  const dragStartYRef = useRef<number>(0);
  const lastMouseYRef = useRef<number>(0);
  const pixelsPerUnitRef = useRef<number>(100);
  const [secondarySelected, setSecondarySelected] = useState<string | null>(null);
  const [csgAvailable, setCsgAvailable] = useState<boolean>(false);
  const csgRef = useRef<any>(null);
  const [uniformScale, setUniformScale] = useState<boolean>(true);
  const [verticalDragMode, setVerticalDragMode] = useState<boolean>(false);
  const [showRealTimeInfo, setShowRealTimeInfo] = useState<boolean>(false);

  const getHalfHeight = (mesh: THREE.Object3D) => {
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    return size.y / 2;
  };

  const getSelected = () => shapes.find(s => s.id === selectedShape);

  const clampMeshToGround = (mesh: THREE.Mesh) => {
    const half = getHalfHeight(mesh);
    if (mesh.position.y < half) mesh.position.y = half;
  };

  // Three.js 초기화
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return; // 이미 초기화된 경우 중복 방지

    // Scene 생성
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera 생성
    const camera = new THREE.PerspectiveCamera(
      75,
      800 / 600,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer 생성
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // DOM에 추가 (기존 캔버스가 있으면 제거)
    if (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    // 조명 설정
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 그리드 추가
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // 축 헬퍼 추가
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // OrbitControls
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;
    orbit.enablePan = true;
    orbitRef.current = orbit;

    // TransformControls
    try {
      if (typeof TransformControls === 'function') {
        const transform = new TransformControls(camera, renderer.domElement);
        if (transform && transform instanceof THREE.Object3D) {
          transform.setMode(transformMode);
          transform.addEventListener('dragging-changed', (event: any) => {
            if (orbitRef.current) {
              orbitRef.current.enabled = !event.value;
            }
            isTransformDraggingRef.current = !!event.value;
          });
          transform.addEventListener('objectChange', () => {
            if (!transform.object) return;
            setShapes(prev => prev.map(s => {
              if (s.mesh === transform.object) {
                return {
                  ...s,
                  position: { x: s.mesh.position.x, y: s.mesh.position.y, z: s.mesh.position.z },
                  rotation: { x: s.mesh.rotation.x, y: s.mesh.rotation.y, z: s.mesh.rotation.z },
                  scale: { x: s.mesh.scale.x, y: s.mesh.scale.y, z: s.mesh.scale.z },
                };
              }
              return s;
            }));
          });
          scene.add(transform);
          transformRef.current = transform;
          console.log('TransformControls 초기화 성공');
        } else {
          console.warn('TransformControls가 THREE.Object3D 인스턴스가 아님');
          transformRef.current = null;
        }
      } else {
        console.warn('TransformControls가 함수가 아님');
        transformRef.current = null;
      }
    } catch (error) {
      console.warn('TransformControls 초기화 실패:', error);
      transformRef.current = null;
    }

    console.log('Three.js 3D 에디터 초기화 완료');

    // 정리
    return () => {
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sceneRef.current = undefined;
    };
  }, []); // 의존성 배열을 빈 배열로 변경

  // 애니메이션 루프 (단일 루프 고정)
  useEffect(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isRotatingRef.current && sceneRef.current) {
        sceneRef.current.rotation.y += 0.01;
      }

      // 선택된 도형 하이라이트 + 선택 표시
      shapes.forEach(shape => {
        const mat = shape.mesh.material as THREE.MeshLambertMaterial;
        if (!mat) return;
        
        if (shape.id === selectedShape) {
          // 선택된 도형: 밝게 + 외곽선 효과
          mat.transparent = false; 
          mat.opacity = 1;
          mat.emissive.setHex(0x444444);
          
          // 선택 표시 (외곽선) 추가
          if (!shape.mesh.userData.outline) {
            const outlineMaterial = new THREE.MeshBasicMaterial({ 
              color: 0x00ff00, 
              side: THREE.BackSide,
              transparent: true,
              opacity: 0.8
            });
            const outlineMesh = new THREE.Mesh(shape.mesh.geometry, outlineMaterial);
            outlineMesh.scale.multiplyScalar(1.05);
            outlineMesh.position.copy(shape.mesh.position);
            outlineMesh.rotation.copy(shape.mesh.rotation);
            outlineMesh.userData.isOutline = true;
            shape.mesh.userData.outline = outlineMesh;
            sceneRef.current!.add(outlineMesh);
          }
        } else {
          // 비선택 도형: 약간 투명
          mat.transparent = true; 
          mat.opacity = 0.7;
          mat.emissive.setHex(0x000000);
          
          // 선택 표시 제거
          if (shape.mesh.userData.outline) {
            sceneRef.current!.remove(shape.mesh.userData.outline);
            shape.mesh.userData.outline = null;
          }
        }
      });

      orbitRef.current?.update();
      rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [shapes, selectedShape]);

  // 회전 상태를 ref에 동기화
  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  // CSG 모듈 동적 로드는 보안 레지스트리 정책상 비활성화. 설치 가능해지면 활성화.
  useEffect(() => {
    setCsgAvailable(false);
  }, []);

  // 기본 마우스 조작 테스트
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getIntersects = (event: MouseEvent) => {
      const rect = rendererRef.current!.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current!);
      const intersects = raycaster.intersectObjects(shapes.map(s => s.mesh));
      return intersects;
    };

    const handleClick = (event: MouseEvent) => {
      console.log('클릭 이벤트 발생!');
      
      const intersects = getIntersects(event);
      console.log('클릭, 교차 객체:', intersects.length);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const clickedShape = shapes.find(s => s.mesh === clickedMesh);
        if (clickedShape) {
          setSelectedShape(clickedShape.id);
          setSecondarySelected(null);
          console.log('도형 선택됨:', clickedShape.id);
        }
      } else {
        setSelectedShape(null);
        setSecondarySelected(null);
        console.log('선택 해제됨');
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      console.log('마우스 다운 이벤트 발생!', event.button);
    };

    const handleMouseMove = (event: MouseEvent) => {
      console.log('마우스 무브 이벤트 발생!');
    };

    const handleWheel = (event: WheelEvent) => {
      console.log('휠 이벤트 발생!', event.deltaY);
      
      // 간단한 줌
      if (cameraRef.current) {
        const zoomSpeed = 0.1;
        const zoom = event.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
        cameraRef.current.position.multiplyScalar(zoom);
        console.log('카메라 줌:', zoom);
      }
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      console.log('우클릭 이벤트 발생!');
    };

    const canvas = rendererRef.current.domElement;
    
    // 이벤트 리스너 등록
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('contextmenu', onContextMenu);

    console.log('마우스 이벤트 리스너 등록 완료');

    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };
  }, [shapes, selectedShape]);

  // 3D 도형 생성 함수들
  const createBox = () => {
    if (!sceneRef.current) return;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0xD7BFA6 }); // 밝은 갈색
    const mesh = new THREE.Mesh(geometry, material);
    
    // 랜덤 위치에 배치
    mesh.position.set(
      (Math.random() - 0.5) * 4,
      0.5,
      (Math.random() - 0.5) * 4
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const newShape: Shape3D = {
      id: `box-${Date.now()}`,
      type: 'box',
      mesh,
      position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
      scale: { x: 1, y: 1, z: 1 },
      color: '#8B4513'
    };

    sceneRef.current.add(mesh);
    setShapes(prev => [...prev, newShape]);
    setSelectedShape(newShape.id);
    console.log('박스 추가됨:', newShape.id);
  };

  const createCylinder = () => {
    if (!sceneRef.current) return;

    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32);
    const material = new THREE.MeshLambertMaterial({ color: 0x666666 }); // 중간 회색
    const mesh = new THREE.Mesh(geometry, material);
    
    // 랜덤 위치에 배치
    mesh.position.set(
      (Math.random() - 0.5) * 4,
      0.1,
      (Math.random() - 0.5) * 4
    );
    // 바퀴가 눕지 않도록 Z축 기준으로 세워두기
    mesh.rotation.z = Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const newShape: Shape3D = {
      id: `cylinder-${Date.now()}`,
      type: 'cylinder',
      mesh,
      position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
      scale: { x: 1, y: 1, z: 1 },
      color: '#2C2C2C'
    };

    sceneRef.current.add(mesh);
    setShapes(prev => [...prev, newShape]);
    setSelectedShape(newShape.id);
    console.log('실린더 추가됨:', newShape.id);
  };

  const createTriangularPrism = () => {
    if (!sceneRef.current) return;
    const shape2d = new THREE.Shape();
    shape2d.moveTo(-0.5, 0);
    shape2d.lineTo(0.5, 0);
    shape2d.lineTo(0, 0.7);
    shape2d.lineTo(-0.5, 0);
    const geometry = new THREE.ExtrudeGeometry(shape2d, { depth: 1, bevelEnabled: false });
    geometry.center();
    const material = new THREE.MeshLambertMaterial({ color: 0xcbd5e1 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((Math.random() - 0.5) * 4, 0.5, (Math.random() - 0.5) * 4);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const newShape: Shape3D = {
      id: `tri-${Date.now()}`,
      type: 'triangularPrism',
      mesh,
      position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
      scale: { x: 1, y: 1, z: 1 },
      color: '#9ca3af'
    };

    sceneRef.current.add(mesh);
    setShapes(prev => [...prev, newShape]);
    setSelectedShape(newShape.id);
  };

  const createTrapezoidPrism = () => {
    if (!sceneRef.current) return;
    const shape2d = new THREE.Shape();
    const topWidth = 0.6, bottomWidth = 1.0, height = 0.6;
    shape2d.moveTo(-bottomWidth / 2, -height / 2);
    shape2d.lineTo(bottomWidth / 2, -height / 2);
    shape2d.lineTo(topWidth / 2, height / 2);
    shape2d.lineTo(-topWidth / 2, height / 2);
    shape2d.lineTo(-bottomWidth / 2, -height / 2);
    const geometry = new THREE.ExtrudeGeometry(shape2d, { depth: 1, bevelEnabled: false });
    geometry.center();
    const material = new THREE.MeshLambertMaterial({ color: 0xfcd34d });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((Math.random() - 0.5) * 4, 0.5, (Math.random() - 0.5) * 4);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const newShape: Shape3D = {
      id: `trap-${Date.now()}`,
      type: 'trapezoidPrism',
      mesh,
      position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
      scale: { x: 1, y: 1, z: 1 },
      color: '#f59e0b'
    };

    sceneRef.current.add(mesh);
    setShapes(prev => [...prev, newShape]);
    setSelectedShape(newShape.id);
  };

  // 3D 편집 기능들
  const deleteSelected = () => {
    if (!selectedShape || !sceneRef.current) return;
    
    const shape = shapes.find(s => s.id === selectedShape);
    if (shape) {
      sceneRef.current.remove(shape.mesh);
      setShapes(prev => prev.filter(s => s.id !== selectedShape));
      setSelectedShape(null);
      console.log('선택된 도형 삭제됨');
    }
  };

  const duplicateSelected = () => {
    if (!selectedShape || !sceneRef.current) return;
    
    const originalShape = shapes.find(s => s.id === selectedShape);
    if (originalShape) {
      const geometry = originalShape.mesh.geometry.clone();
      const material = originalShape.mesh.material.clone();
      const mesh = new THREE.Mesh(geometry, material);
      
      // 약간 오프셋된 위치에 배치
      mesh.position.copy(originalShape.mesh.position);
      mesh.position.x += 0.5;
      mesh.position.z += 0.5;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const newShape: Shape3D = {
        id: `${originalShape.type}-${Date.now()}`,
        type: originalShape.type,
        mesh,
        position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
        rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
        scale: { ...originalShape.scale },
        color: originalShape.color
      };

      sceneRef.current.add(mesh);
      setShapes(prev => [...prev, newShape]);
      setSelectedShape(newShape.id);
      console.log('도형 복사됨:', newShape.id);
    }
  };

  const clearScene = () => {
    if (!sceneRef.current) return;
    
    shapes.forEach(shape => {
      sceneRef.current!.remove(shape.mesh);
    });
    setShapes([]);
    setSelectedShape(null);
    console.log('씬 클리어됨');
  };

  // 카메라 컨트롤
  const rotateCamera = (direction: 'left' | 'right') => {
    if (!cameraRef.current) return;
    
    const angle = direction === 'left' ? -0.2 : 0.2;
    const x = cameraRef.current.position.x;
    const z = cameraRef.current.position.z;
    
    cameraRef.current.position.x = x * Math.cos(angle) - z * Math.sin(angle);
    cameraRef.current.position.z = x * Math.sin(angle) + z * Math.cos(angle);
    cameraRef.current.lookAt(0, 0, 0);
  };

  const toggleAutoRotate = () => {
    setIsRotating(!isRotating);
    console.log('자동 회전:', !isRotating ? '활성화' : '비활성화');
  };

  // 정렬 기능
  const alignHeights = (mode: 'ground' | 'selected') => {
    if (shapes.length === 0) return;
    let targetY = 0;
    if (mode === 'selected' && selectedShape) {
      const s = shapes.find(x => x.id === selectedShape);
      if (s) targetY = s.mesh.position.y;
    }
    shapes.forEach(s => {
      s.mesh.position.y = targetY;
      clampMeshToGround(s.mesh);
      s.position.y = targetY;
    });
    setShapes([...shapes]);
  };

  const quickRotate = (axis: 'x' | 'y' | 'z', deg: number) => {
    if (!selectedShape) return;
    const s = shapes.find(x => x.id === selectedShape);
    if (!s) return;
    const rad = THREE.MathUtils.degToRad(deg);
    s.mesh.rotation[axis] += rad;
    s.rotation = { x: s.mesh.rotation.x, y: s.mesh.rotation.y, z: s.mesh.rotation.z };
    setShapes([...shapes]);
  };

  const canBoolean = () => {
    return !!(csgAvailable && selectedShape && secondarySelected && selectedShape !== secondarySelected);
  };

  const booleanOp = (op: 'union' | 'subtract' | 'intersect') => {
    if (!sceneRef.current) return;
    if (!csgAvailable || !csgRef.current) {
      // CSG 대안: BufferGeometryUtils로 단순 합치기(유니온 근사). 빼기/교집합은 미지원.
      if (op !== 'union') {
        alert('현재 환경에서는 합치기만 지원합니다. 빼기/교집합은 서버 CSG 또는 라이브러리 도입 후 가능합니다.');
        return;
      }
      const a = shapes.find(s => s.id === selectedShape);
      const b = shapes.find(s => s.id === secondarySelected);
      if (!a || !b) return;
      const geoA = (a.mesh.geometry as THREE.BufferGeometry).clone();
      const geoB = (b.mesh.geometry as THREE.BufferGeometry).clone();
      geoA.applyMatrix4(a.mesh.matrix);
      geoB.applyMatrix4(b.mesh.matrix);
      const merged = BufferGeometryUtils.mergeGeometries([geoA, geoB], true);
      const mat = (a.mesh.material as THREE.Material).clone();
      const resultMesh = new THREE.Mesh(merged, mat);
      resultMesh.castShadow = true; resultMesh.receiveShadow = true;
      sceneRef.current.remove(a.mesh); sceneRef.current.remove(b.mesh);
      sceneRef.current.add(resultMesh);
      const newShape: Shape3D = {
        id: `merged-${Date.now()}`,
        type: a.type,
        mesh: resultMesh,
        position: { x: resultMesh.position.x, y: resultMesh.position.y, z: resultMesh.position.z },
        rotation: { x: resultMesh.rotation.x, y: resultMesh.rotation.y, z: resultMesh.rotation.z },
        scale: { x: resultMesh.scale.x, y: resultMesh.scale.y, z: resultMesh.scale.z },
        color: '#cccccc'
      };
      setShapes(prev => prev.filter(s => s.id !== a.id && s.id !== b.id).concat(newShape));
      setSelectedShape(newShape.id); setSecondarySelected(null);
      transformRef.current?.attach(resultMesh);
      return;
    }
    const a = shapes.find(s => s.id === selectedShape);
    const b = shapes.find(s => s.id === secondarySelected);
    if (!a || !b) return;

    const meshA = a.mesh.clone();
    meshA.updateMatrixWorld(true);
    const meshB = b.mesh.clone();
    meshB.updateMatrixWorld(true);

    const { CSG } = csgRef.current;
    const csgA = CSG.fromMesh(meshA as any);
    const csgB = CSG.fromMesh(meshB as any);
    // 구멍 역할 도형은 자동으로 subtract 처리
    const finalOp = (a.isHole || b.isHole)
      ? 'subtract'
      : op;
    let result: any;
    if (finalOp === 'union') result = csgA.union(csgB);
    if (finalOp === 'subtract') {
      // a가 구멍이면 b를 a에서 빼는 형태가 되어야 하므로 순서를 바꿉니다
      result = a.isHole ? csgB.subtract(csgA) : csgA.subtract(csgB);
    }
    if (finalOp === 'intersect') result = csgA.intersect(csgB);

    const resultMesh = CSG.toMesh(result, meshA.matrix, meshA.material as any);
    resultMesh.castShadow = true;
    resultMesh.receiveShadow = true;
    resultMesh.position.copy(a.mesh.position);
    resultMesh.rotation.copy(a.mesh.rotation);
    resultMesh.scale.copy(a.mesh.scale);

    sceneRef.current.remove(a.mesh);
    sceneRef.current.remove(b.mesh);
    sceneRef.current.add(resultMesh);

    const newShape: Shape3D = {
      id: `csg-${Date.now()}`,
      type: a.type,
      mesh: resultMesh,
      position: { x: resultMesh.position.x, y: resultMesh.position.y, z: resultMesh.position.z },
      rotation: { x: resultMesh.rotation.x, y: resultMesh.rotation.y, z: resultMesh.rotation.z },
      scale: { x: resultMesh.scale.x, y: resultMesh.scale.y, z: resultMesh.scale.z },
      color: '#cccccc'
    };
    setShapes(prev => prev.filter(s => s.id !== a.id && s.id !== b.id).concat(newShape));
    setSelectedShape(newShape.id);
    setSecondarySelected(null);
    transformRef.current?.attach(resultMesh);
  };

  // 선택된 도형 이동
  const moveSelected = (direction: 'up' | 'down' | 'left' | 'right' | 'forward' | 'back') => {
    if (!selectedShape) return;
    
    const shape = shapes.find(s => s.id === selectedShape);
    if (!shape) return;
    
    const moveDistance = 0.5;
    
    switch (direction) {
      case 'left':
        shape.mesh.position.x -= moveDistance;
        break;
      case 'right':
        shape.mesh.position.x += moveDistance;
        break;
      case 'forward':
        shape.mesh.position.z -= moveDistance;
        break;
      case 'back':
        shape.mesh.position.z += moveDistance;
        break;
      case 'up':
        shape.mesh.position.y += moveDistance;
        break;
      case 'down':
        shape.mesh.position.y -= moveDistance;
        clampMeshToGround(shape.mesh);
        break;
    }
    
    // 위치 업데이트
    shape.position = {
      x: shape.mesh.position.x,
      y: shape.mesh.position.y,
      z: shape.mesh.position.z
    };
    
    console.log(`도형 이동: ${direction}`);
  };

  // 저장 기능
  const handleSave = () => {
    if (!onSave) return;
    const designData = JSON.stringify(shapes.map(shape => ({
      id: shape.id,
      type: shape.type,
      position: shape.position,
      rotation: shape.rotation,
      scale: shape.scale,
      color: shape.color,
      isHole: !!shape.isHole
    })));
    onSave(designData);
    console.log('3D 디자인 저장됨:', shapes.length, '개 도형');
  };

  // 3D 씬 스크린샷
  const downloadAsImage = () => {
    if (!rendererRef.current) return;
    
    const dataURL = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `boxcar-3d-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('3D 스크린샷 다운로드됨');
  };

  // 전개도 PDF 빌드 공통 함수
  const buildBlueprint = (pdf: jsPDF) => {
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const scaleMMPerUnit = mmPerUnit;

    let cursorX = margin;
    let cursorY = margin + 16;
    const partGap = 8;
    let currentRowMaxH = 0;

    const cutColor: [number, number, number] = [211, 47, 47];
    const foldColor: [number, number, number] = [25, 118, 210];
    const tabFill: [number, number, number] = [230, 230, 230];
    const tabOutline: [number, number, number] = [120, 120, 120];

    pdf.setFontSize(16);
    pdf.text(blueprintTitle && blueprintTitle.trim() ? blueprintTitle.trim() : 'Boxro Maker 전개도', margin, margin);
    pdf.setFontSize(9);
    if (blueprintDescription && blueprintDescription.trim()) {
      const desc = pdf.splitTextToSize(blueprintDescription.trim(), pageW - margin * 2);
      pdf.text(desc, margin, margin + 5);
      cursorY += Math.min(20, desc.length * 4);
    } else {
      pdf.text('참고: 치수/탭은 단순화된 초안입니다.', margin, margin + 5);
    }
    pdf.setFontSize(8);
    pdf.text(`스케일: 1 unit = ${scaleMMPerUnit} mm`, pageW - margin - 60, margin);
    let lx = pageW - margin - 70;
    const ly = margin + 5;
    pdf.setDrawColor(...cutColor); pdf.setLineDashPattern([], 0); pdf.line(lx, ly, lx + 12, ly); pdf.text('절취', lx + 14, ly + 1.5);
    lx += 30;
    pdf.setDrawColor(...foldColor); pdf.setLineDashPattern([1.5, 1.5], 0); pdf.line(lx, ly, lx + 12, ly); pdf.setLineDashPattern([], 0); pdf.text('접기', lx + 14, ly + 1.5);
    lx += 30;
    pdf.setFillColor(...tabFill); pdf.setDrawColor(...tabOutline); pdf.rect(lx, ly - 3, 10, 6, 'FD'); pdf.text('탭', lx + 12, ly + 1.5);

    const placeBox = (needW: number, needH: number) => {
      if (cursorX + needW > pageW - margin) {
        cursorX = margin;
        cursorY += currentRowMaxH + partGap;
        currentRowMaxH = 0;
      }
      if (cursorY + needH > pageH - margin) {
        pdf.addPage('a4', 'landscape');
        cursorX = margin;
        cursorY = margin + 16;
        currentRowMaxH = 0;
      }
      currentRowMaxH = Math.max(currentRowMaxH, needH);
    };

    shapes.forEach((shape, idx) => {
      if (shape.type === 'box') {
        const w = 1 * scaleMMPerUnit;
        const h = 1 * scaleMMPerUnit;
        const d = 1 * scaleMMPerUnit;
        const neededW = w * 3 + partGap;
        const neededH = h + d * 2 + partGap;
        placeBox(neededW, neededH);
        const ox = cursorX; const oy = cursorY;
        pdf.setDrawColor(211,47,47); pdf.setLineWidth(0.3); pdf.setLineDashPattern([], 0);
        pdf.rect(ox + w, oy + d, w, h);
        pdf.rect(ox, oy + d, w, h);
        pdf.rect(ox + 2 * w, oy + d, w, h);
        pdf.rect(ox + w, oy, w, d);
        pdf.rect(ox + w, oy + d + h, w, d);
        pdf.setDrawColor(25,118,210); pdf.setLineDashPattern([1.5,1.5], 0);
        pdf.line(ox + w, oy + d, ox + w, oy + d + h);
        pdf.line(ox + 2 * w, oy + d, ox + 2 * w, oy + d + h);
        pdf.line(ox + w, oy + d, ox + 2 * w, oy + d);
        pdf.line(ox + w, oy + d + h, ox + 2 * w, oy + d + h);
        pdf.setLineDashPattern([], 0);
        const tab = Math.min(10, d * 0.3);
        pdf.setFillColor(230,230,230); pdf.setDrawColor(120,120,120);
        pdf.rect(ox - tab, oy + d + 5, tab, h - 10, 'FD');
        pdf.text(`BOX ${idx + 1}`, ox, oy - 2);
        cursorX += neededW + partGap;
      } else if (shape.type === 'cylinder') {
        const radius = 0.5 * scaleMMPerUnit; const height = 0.2 * scaleMMPerUnit;
        const circumference = 2 * Math.PI * radius;
        const neededW = Math.max(circumference, radius * 2) + partGap;
        const neededH = height + radius * 2 + partGap;
        placeBox(neededW, neededH);
        const ox = cursorX; const oy = cursorY;
        pdf.setDrawColor(211,47,47); pdf.setLineWidth(0.3); pdf.setLineDashPattern([], 0);
        pdf.rect(ox, oy, circumference, height);
        const tabW = Math.min(10, height * 0.6);
        pdf.setFillColor(230,230,230); pdf.setDrawColor(120,120,120);
        pdf.rect(ox + circumference, oy + (height - tabW) / 2, tabW, tabW, 'FD');
        pdf.setDrawColor(25,118,210); pdf.setLineDashPattern([1.5,1.5], 0);
        pdf.line(ox, oy, ox + circumference, oy);
        pdf.line(ox, oy + height, ox + circumference, oy + height);
        pdf.setDrawColor(211,47,47); pdf.setLineDashPattern([], 0);
        pdf.circle(ox + radius, oy + height + radius + 5, radius, 'S');
        pdf.circle(ox + radius * 3 + 10, oy + height + radius + 5, radius, 'S');
        pdf.text(`WHEEL ${idx + 1}`, ox, oy - 2);
        cursorX += neededW + partGap;
      } else if (shape.type === 'triangularPrism') {
        const depth = 1 * scaleMMPerUnit; const base = 1 * scaleMMPerUnit; const height = 0.7 * scaleMMPerUnit;
        const neededW = base * 3 + partGap; const neededH = Math.max(depth, height) + partGap + 20;
        placeBox(neededW, neededH);
        const ox = cursorX; const oy = cursorY + 10;
        pdf.setDrawColor(211,47,47); pdf.setLineWidth(0.3);
        pdf.rect(ox, oy, base, depth); pdf.rect(ox + base, oy, base, depth); pdf.rect(ox + base * 2, oy, base, depth);
        pdf.setDrawColor(25,118,210); pdf.setLineDashPattern([1.5,1.5], 0);
        pdf.line(ox, oy - height, ox + base, oy); pdf.line(ox + base, oy - height, ox + base, oy); pdf.line(ox + base, oy - height, ox, oy - height);
        pdf.setLineDashPattern([], 0);
        pdf.text(`TRI-PRISM ${idx + 1}`, ox, oy - height - 2);
        cursorX += neededW + partGap;
      } else if (shape.type === 'trapezoidPrism') {
        const depth = 1 * scaleMMPerUnit; const topW = 0.6 * scaleMMPerUnit; const bottomW = 1.0 * scaleMMPerUnit; const height = 0.6 * scaleMMPerUnit;
        const neededW = bottomW * 2 + topW + partGap; const neededH = Math.max(depth, height) + partGap + 20;
        placeBox(neededW, neededH);
        const ox = cursorX; const oy = cursorY + 10;
        pdf.setDrawColor(211,47,47); pdf.setLineWidth(0.3);
        pdf.rect(ox, oy, bottomW, depth); pdf.rect(ox + bottomW, oy, topW, depth); pdf.rect(ox + bottomW + topW, oy, bottomW, depth);
        pdf.setDrawColor(25,118,210); pdf.setLineDashPattern([1.5,1.5], 0);
        pdf.line(ox, oy - height, ox + bottomW, oy - height);
        pdf.line(ox + (bottomW - topW) / 2, oy - height, ox + (bottomW + topW) / 2, oy);
        pdf.setLineDashPattern([], 0);
        pdf.text(`TRAP-PRISM ${idx + 1}`, ox, oy - height - 2);
        cursorX += neededW + partGap;
      }
    });

    pdf.setFontSize(8);
    pdf.text(`Generated: ${new Date().toLocaleString('ko-KR')}`, pageW - margin - 50, pageH - 6);
  };

  const previewBlueprint = () => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    buildBlueprint(pdf);
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  // 전개도 PDF 생성 (다운로드)
  const generateBlueprint = () => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    buildBlueprint(pdf);
    pdf.save(`${(blueprintTitle || 'boxro_blueprint').replace(/[^a-zA-Z0-9\u3131-\u3163\uac00-\ud7a3]/g, '_')}_${Date.now()}.pdf`);
  };

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 도형이 선택된 상태에서의 키보드 조작
      if (selectedShape) {
        switch (e.key) {
          case 'Delete':
            deleteSelected();
            break;
          case 'ArrowLeft':
            if (e.shiftKey) {
              moveSelected('left');
            } else {
              rotateCamera('left');
            }
            break;
          case 'ArrowRight':
            if (e.shiftKey) {
              moveSelected('right');
            } else {
              rotateCamera('right');
            }
            break;
          case 'ArrowUp':
            if (e.shiftKey) {
              moveSelected('forward');
            } else {
              moveSelected('up');
            }
            break;
          case 'ArrowDown':
            if (e.shiftKey) {
              moveSelected('back');
            } else {
              moveSelected('down');
            }
            break;
        }
      } else {
        // 도형이 선택되지 않은 상태에서는 카메라만 조작
        switch (e.key) {
          case 'ArrowLeft':
            rotateCamera('left');
            break;
          case 'ArrowRight':
            rotateCamera('right');
            break;
        }
      }
      
      if (e.key === 'Escape') {
        setSelectedShape(null);
        if (transformRef.current && transformRef.current.detach) {
          try {
            transformRef.current.detach();
          } catch (error) {
            console.warn('TransformControls detach 실패:', error);
          }
        }
      }
      if (e.key === 'g' || e.key === 'G') {
        setTransformMode('translate');
        if (transformRef.current && transformRef.current.setMode) {
          try {
            transformRef.current.setMode('translate');
          } catch (error) {
            console.warn('TransformControls setMode 실패:', error);
          }
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        setTransformMode('rotate');
        if (transformRef.current && transformRef.current.setMode) {
          try {
            transformRef.current.setMode('rotate');
          } catch (error) {
            console.warn('TransformControls setMode 실패:', error);
          }
        }
      }
      if (e.key === 's' || e.key === 'S') {
        setTransformMode('scale');
        if (transformRef.current && transformRef.current.setMode) {
          try {
            transformRef.current.setMode('scale');
          } catch (error) {
            console.warn('TransformControls setMode 실패:', error);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedShape]);

  return (
    <div className="flex h-full">
      {/* 도구 패널 */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">3D 도형 추가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={createBox}
            >
              <Box className="w-4 h-4 mr-2" />
              박스 (차체용)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={createCylinder}
            >
              <Cylinder className="w-4 h-4 mr-2" />
              실린더 (바퀴용)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={createTriangularPrism}
            >
              {/* 간단 아이콘 */}
              <span className="w-4 h-4 mr-2 inline-block">▲</span>
              삼각기둥
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={createTrapezoidPrism}
            >
              <span className="w-4 h-4 mr-2 inline-block">▱</span>
              사다리꼴 기둥
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">편집</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <Button
                variant={transformMode === 'translate' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => { 
                  setTransformMode('translate'); 
                  if (transformRef.current && transformRef.current.setMode) {
                    try {
                      transformRef.current.setMode('translate');
                    } catch (error) {
                      console.warn('TransformControls setMode 실패:', error);
                    }
                  }
                }}
                disabled={!selectedShape}
              >
                이동 (G)
              </Button>
              <Button
                variant={transformMode === 'rotate' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => { 
                  setTransformMode('rotate'); 
                  if (transformRef.current && transformRef.current.setMode) {
                    try {
                      transformRef.current.setMode('rotate');
                    } catch (error) {
                      console.warn('TransformControls setMode 실패:', error);
                    }
                  }
                }}
                disabled={!selectedShape}
              >
                회전 (R)
              </Button>
              <Button
                variant={transformMode === 'scale' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => { 
                  setTransformMode('scale'); 
                  if (transformRef.current && transformRef.current.setMode) {
                    try {
                      transformRef.current.setMode('scale');
                    } catch (error) {
                      console.warn('TransformControls setMode 실패:', error);
                    }
                  }
                }}
                disabled={!selectedShape}
              >
                크기 (S)
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">스냅</label>
              <input
                type="checkbox"
                checked={snapEnabled}
                onChange={(e) => {
                  setSnapEnabled(e.target.checked);
                  const t = transformRef.current;
                  if (t) {
                    // @ts-ignore allow null to disable
                    t.setTranslationSnap(e.target.checked ? 0.5 : null);
                    // @ts-ignore allow null to disable
                    t.setRotationSnap(e.target.checked ? THREE.MathUtils.degToRad(15) : null);
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-700">균등 스케일</label>
                <input type="checkbox" className="ml-2" checked={uniformScale} onChange={(e) => {
                  setUniformScale(e.target.checked);
                  if (transformRef.current && transformRef.current.setScaleSnap) {
                    try {
                      transformRef.current.setScaleSnap(0); // no snap
                    } catch (error) {
                      console.warn('TransformControls setScaleSnap 실패:', error);
                    }
                  }
                }} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-700">비율</label>
                <input
                  type="number"
                  step={0.1}
                  min={0.1}
                  value={getSelected() ? Number(getSelected()!.mesh.scale.x.toFixed(2)) : 1}
                  onChange={(e) => {
                    const s = getSelected(); if (!s) return;
                    const k = Math.max(0.1, Number(e.target.value) || 1);
                    if (uniformScale) {
                      s.mesh.scale.set(k, k, k);
                    } else {
                      s.mesh.scale.x = k;
                    }
                    s.scale = { x: s.mesh.scale.x, y: s.mesh.scale.y, z: s.mesh.scale.z };
                    clampMeshToGround(s.mesh);
                    setShapes([...shapes]);
                  }}
                  className="w-20 border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">선택 도형을 구멍으로 사용</label>
              <input
                type="checkbox"
                checked={!!shapes.find(s => s.id === selectedShape)?.isHole}
                onChange={(e) => {
                  if (!selectedShape) return;
                  setShapes(prev => prev.map(s => {
                    if (s.id === selectedShape) {
                      s.isHole = e.target.checked;
                      const mat = s.mesh.material as THREE.MeshLambertMaterial;
                      if (e.target.checked) {
                        mat.transparent = true; mat.opacity = 0.4;
                      } else {
                        mat.transparent = false; mat.opacity = 1;
                      }
                    }
                    return s;
                  }));
                }}
                disabled={!selectedShape}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" disabled={!selectedShape} onClick={() => quickRotate('x', -15)}>X-15°</Button>
              <Button variant="outline" disabled={!selectedShape} onClick={() => quickRotate('y', -15)}>Y-15°</Button>
              <Button variant="outline" disabled={!selectedShape} onClick={() => quickRotate('z', -15)}>Z-15°</Button>
              <Button variant="outline" disabled={!selectedShape} onClick={() => quickRotate('x', 15)}>X+15°</Button>
              <Button variant="outline" disabled={!selectedShape} onClick={() => quickRotate('y', 15)}>Y+15°</Button>
              <Button variant="outline" disabled={!selectedShape} onClick={() => quickRotate('z', 15)}>Z+15°</Button>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={duplicateSelected}
              disabled={!selectedShape}
            >
              <Copy className="w-4 h-4 mr-2" />
              복사
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={deleteSelected}
              disabled={!selectedShape}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              삭제
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={clearScene}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              전체 지우기
            </Button>
            <div className="pt-2 border-t border-gray-200 space-y-2">
              <CardTitle className="text-sm">정렬</CardTitle>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => alignHeights('ground')}>바닥에 맞추기</Button>
                <Button variant="outline" onClick={() => alignHeights('selected')} disabled={!selectedShape}>선택 높이에 맞추기</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">3D 뷰 컨트롤</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => rotateCamera('left')}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              좌회전
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => rotateCamera('right')}
            >
              <RotateCw className="w-4 h-4 mr-2" />
              우회전
            </Button>
            <Button
              variant={isRotating ? "default" : "outline"}
              className="w-full justify-start"
              onClick={toggleAutoRotate}
            >
              <RotateCw className="w-4 h-4 mr-2" />
              {isRotating ? '자동회전 중지' : '자동회전 시작'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">저장 & 내보내기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-2">
              <Label className="text-xs">도안 제목</Label>
              <Input
                value={blueprintTitle}
                onChange={(e) => setBlueprintTitle(e.target.value)}
                placeholder="예: 우리 반 박스카 - 3조"
              />
              <Label className="text-xs">도안 설명</Label>
              <Input
                value={blueprintDescription}
                onChange={(e) => setBlueprintDescription(e.target.value)}
                placeholder="예: 차체 1x1x1, 바퀴 직경 30mm"
              />
              <Label className="text-xs">스케일 (1 unit = mm)</Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={mmPerUnit}
                onChange={(e) => setMmPerUnit(Number(e.target.value) || 1)}
              />
            </div>
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
              onClick={previewBlueprint}
            >
              <FileText className="w-4 h-4 mr-2" />
              도안 PDF 미리보기
            </Button>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={generateBlueprint}>PDF 다운로드</Button>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={downloadAsImage}
            >
              <Download className="w-4 h-4 mr-2" />
              3D 스크린샷
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">도형 결합</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-gray-600">두 번째 대상으로 Ctrl/⌘ 클릭해 선택 (로딩 후 활성화)</div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={() => booleanOp('union')} disabled={!canBoolean()}>합치기</Button>
              <Button variant="outline" onClick={() => booleanOp('subtract')} disabled={!canBoolean()}>빼기</Button>
              <Button variant="outline" onClick={() => booleanOp('intersect')} disabled={!canBoolean()}>교집합</Button>
              {!csgAvailable && (
                <div className="col-span-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  CSG 모듈을 로드할 수 없어 도형 결합이 비활성화되었습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3D 뷰어 영역 */}
      <div className="flex-1 bg-gray-50 p-4 overflow-auto">
        <div className="bg-white rounded-lg shadow-sm p-4 inline-block relative">
          <div 
            ref={mountRef} 
            className="border border-gray-200 rounded"
            style={{ width: '800px', height: '600px' }}
          />
          
          {/* 어린이 친화적 정보 표시 */}
          {selectedShape && (
            <div className="absolute top-4 left-4 bg-blue-500 text-white p-3 rounded-lg text-sm">
              <div className="mb-2 font-bold">선택된 도형</div>
              <div>크기: {getSelected()?.mesh.scale.x.toFixed(1)}배</div>
              <div>회전: {Math.round(getSelected()?.mesh.rotation.y * 180 / Math.PI)}도</div>
              <div className="mt-1 text-yellow-200">💡 도형을 드래그해서 움직이거나 크기를 바꿔보세요!</div>
            </div>
          )}
          
          <div className="mt-2 text-sm text-gray-600 text-center space-y-1">
            <p>🖱️ <strong>간단한 조작법:</strong></p>
            <p>• 도형 클릭: 선택하기</p>
            <p>• 도형 드래그: 움직이기</p>
            <p>• 빈 공간 드래그: 화면 돌리기</p>
            <p>• 휠: 확대/축소</p>
            <p>🎮 <strong>버튼으로 조작:</strong></p>
            <p>• 회전 버튼: 도형 돌리기</p>
            <p>• 크기 버튼: 도형 크기 바꾸기</p>
            <p>📦 <strong>박스와 바퀴를 조합해서 자동차를 만들어보세요!</strong></p>
          </div>
        </div>
      </div>
      <Dialog open={previewOpen} onOpenChange={(o) => { if (!o && previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(''); } setPreviewOpen(o); }}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>PDF 미리보기</DialogTitle>
          </DialogHeader>
          <div className="h-[80vh]">
            {previewUrl ? (
              <iframe src={previewUrl} className="w-full h-full border" />
            ) : (
              <div className="text-center text-sm text-gray-500">미리보기를 불러오는 중...</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
