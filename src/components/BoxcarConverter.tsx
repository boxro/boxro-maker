"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RotateCcw, ArrowLeft } from "lucide-react";

interface BoxcarConverterProps {
  drawingData: string;
  onBack: () => void;
}

type Point = { x: number; y: number };

function isBlank(data: ImageData) {
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!(d[i] === 255 && d[i + 1] === 255 && d[i + 2] === 255 && d[i + 3] === 255)) return false;
  }
  return true;
}

function buildAnyMask(data: ImageData) {
  const { data: d, width, height } = data;
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = d[i + 3];
      if (a < 16) continue;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (!(r === 255 && g === 255 && b === 255)) mask[y * width + x] = 1;
    }
  }
  return mask;
}

function largestRegionBounds(mask: Uint8Array, width: number, height: number) {
  const visited = new Uint8Array(width * height);
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
  ];
  let best = { count: 0, minX: 0, minY: 0, maxX: -1, maxY: -1 };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!mask[idx] || visited[idx]) continue;
      let q: Point[] = [{ x, y }];
      visited[idx] = 1;
      let minX = x, minY = y, maxX = x, maxY = y, c = 0;
      while (q.length) {
        const p = q.shift()!;
        c++;
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
        for (const [dx, dy] of dirs) {
          const nx = p.x + dx, ny = p.y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const ni = ny * width + nx;
          if (!mask[ni] || visited[ni]) continue;
          visited[ni] = 1; q.push({ x: nx, y: ny });
        }
      }
      if (c > best.count) best = { count: c, minX, minY, maxX, maxY };
    }
  }
  return best.count > 0 ? best : null;
}

function extractRegions(mask: Uint8Array, width: number, height: number, minPixels = 20) {
  const visited = new Uint8Array(width * height);
  const regions: { pixels: Point[]; bounds: { x0: number; y0: number; x1: number; y1: number } }[] = [];
  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1],
  ];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!mask[i] || visited[i]) continue;
      const q: Point[] = [{ x, y }];
      const pixels: Point[] = [];
      visited[i] = 1;
      let x0 = x, y0 = y, x1 = x, y1 = y;
      while (q.length) {
        const p = q.shift()!;
        pixels.push(p);
        if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
        if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
        for (const [dx, dy] of dirs) {
          const nx = p.x + dx, ny = p.y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const ni = ny * width + nx;
          if (!mask[ni] || visited[ni]) continue;
          visited[ni] = 1; q.push({ x: nx, y: ny });
        }
      }
      if (pixels.length >= minPixels) regions.push({ pixels, bounds: { x0, y0, x1, y1 } });
    }
  }
  return regions;
}

function zoomToFit(camera: THREE.PerspectiveCamera, controls: OrbitControls, obj: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = (camera.fov * Math.PI) / 180;
  const dist = maxDim / 2 / Math.tan(fov / 2);
  const isMobile = window.innerWidth <= 768;
  const d = dist * (isMobile ? 1.125 : 1.25); // 모바일: 10% 더 가깝게
  camera.position.set(center.x + d, center.y + d * 0.8, center.z + d);
  camera.lookAt(center);
  controls.target.copy(center);
}

export const BoxcarConverter: React.FC<BoxcarConverterProps> = ({ drawingData, onBack }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    if (sceneRef.current) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const w = mountRef.current.clientWidth || 800;
    const h = mountRef.current.clientHeight || 400;
    // 모바일 해상도 개선 (2배 해상도 적용)
    const isMobile = window.innerWidth <= 768;
    const pixelRatio = isMobile ? 2 : Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h);
    
    // Canvas를 정확한 크기로 제한
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    
    mountRef.current.appendChild(renderer.domElement);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; 
    controls.dampingFactor = 0.08;
    controls.enablePan = false; // 드래그로 이동 비활성화
    controls.enableZoom = true; // 줌은 유지
    controls.enableRotate = true; // 회전은 유지
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(8, 10, 6); scene.add(dl);
    scene.add(new THREE.GridHelper(20, 20));
    const group = new THREE.Group(); scene.add(group);

    sceneRef.current = scene; rendererRef.current = renderer; cameraRef.current = camera;
    controlsRef.current = controls; groupRef.current = group;

    const animate = () => { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
    animate();

    const onResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth || 800; const h = mountRef.current.clientHeight || 400;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h; cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); };
  }, []);

  async function convert() {
    if (!sceneRef.current || !groupRef.current || !cameraRef.current || !controlsRef.current) return;
    if (!drawingData) { groupRef.current.clear(); return; }
    setBusy(true);
    try {
      const img = new Image();
      const ok = await new Promise<boolean>((res) => { img.onload = () => res(true); img.onerror = () => res(false); img.src = drawingData; });
      if (!ok) { groupRef.current.clear(); setBusy(false); return; }
      const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); if (!ctx) { setBusy(false); return; }
      canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (isBlank(imageData)) { groupRef.current.clear(); setBusy(false); return; }

      const mask = buildAnyMask(imageData);
      const bounds = largestRegionBounds(mask, canvas.width, canvas.height) || { minX: 0, minY: 0, maxX: canvas.width - 1, maxY: canvas.height - 1, count: canvas.width * canvas.height } as any;
      
      // 창문 감지 (연한 파란색 영역)
      const windowMask = new Uint8Array(canvas.width * canvas.height);
      const imgData = imageData.data;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = imgData[idx], g = imgData[idx + 1], b = imgData[idx + 2], a = imgData[idx + 3];
          
          if (a > 16 && b > r && b > g && b > 100) {
            windowMask[y * canvas.width + x] = 1;
          }
        }
      }
      const windowRegions = extractRegions(windowMask, canvas.width, canvas.height, 20);
      const bw = Math.max(1, bounds.maxX - bounds.minX + 1);
      const bh = Math.max(1, bounds.maxY - bounds.minY + 1);

      const dynHeight = Math.max(3.2, Math.min(5.0, (bh / canvas.height) * 4.0));
      const dynLength = Math.max(6.0, Math.min(9.0, (bw / bh) * dynHeight));
      const dynDepth = Math.max(2.0, Math.min(3.0, dynLength * 0.38));

      groupRef.current.clear();

      // 기본 박스카 모양 생성 (차종 분류 없이)
      const createBasicBoxcarShape = () => {
        const shape = new THREE.Shape();
        shape.moveTo(-dynLength/2, 0);
        shape.lineTo(-dynLength/2, dynHeight);
        shape.lineTo(dynLength/2, dynHeight);
        shape.lineTo(dynLength/2, 0);
        shape.closePath();
        return shape;
      };

      const shape = createBasicBoxcarShape();
      const geom = new THREE.ExtrudeGeometry(shape, { depth: dynDepth, bevelEnabled: false });
      geom.translate(0, 0, -dynDepth / 2);
      const body = new THREE.Mesh(geom, new THREE.MeshLambertMaterial({ color: '#FF8C42' }));
      body.castShadow = true; body.receiveShadow = true;
      groupRef.current.add(body);
      
      console.log('Created basic boxcar shape');
      
      // 창문 배치
      if (windowRegions.length > 0) {
        const windowWidth = dynLength * 0.12;
        const windowHeight = dynHeight * 0.15;
        const cabinCenterY = dynHeight * 0.6;
        const spacing = dynLength * 0.2;
        
        for (let i = 0; i < 2; i++) {
          const windowX = (i - 0.5) * spacing;
          
          const windowShape = new THREE.Shape();
          windowShape.moveTo(-windowWidth/2, -windowHeight/2);
          windowShape.lineTo(windowWidth/2, -windowHeight/2);
          windowShape.lineTo(windowWidth/2, windowHeight/2);
          windowShape.lineTo(-windowWidth/2, windowHeight/2);
          windowShape.closePath();
          
          const windowGeom = new THREE.ExtrudeGeometry(windowShape, { 
            depth: dynDepth + 0.1, 
            bevelEnabled: false 
          });
          windowGeom.translate(windowX, cabinCenterY, -dynDepth/2 - 0.05);
          
          const windowHole = new THREE.Mesh(windowGeom, new THREE.MeshLambertMaterial({ 
            color: 0x87CEEB, 
            transparent: true, 
            opacity: 0.4 
          }));
          groupRef.current.add(windowHole);
        }
      }

      // 바퀴 배치
      const wheelZ = dynDepth / 2 + Math.max(0.15, dynDepth * 0.12);
      const wheelR = Math.max(0.5, dynHeight * 0.18);
      const wheelX = [-dynLength * 0.35, dynLength * 0.35];
      
      for (const x of wheelX) {
        for (const side of [1, -1]) {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(wheelR, wheelR, Math.max(0.2, wheelR * 0.35), 24), new THREE.MeshLambertMaterial({ color: '#2F2F2F' }));
          w.position.set(x, wheelR, side * wheelZ);
          w.rotation.x = Math.PI / 2; w.castShadow = true; groupRef.current.add(w);
        }
      }

      zoomToFit(cameraRef.current, controlsRef.current, groupRef.current);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { convert(); }, [drawingData]);

  const download = () => {};

    return (
    <div className="w-full h-full">
      {!drawingData ? (
        <div className="text-center text-gray-500 py-32 text-lg">
          먼저 그림을 그려주세요!<br />
          2D 그림을 그리면 3D 박스카가 자동으로 생성됩니다.
        </div>
      ) : (
        <div 
          ref={mountRef} 
          className="w-full h-full"
        />
      )}
    </div>
  );
};
