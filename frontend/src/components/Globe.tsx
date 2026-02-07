import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import type { Keyword } from "../lib/types";

interface Globe3DProps {
  keywords: Keyword[];
  isActive: boolean;
}

type PlacedWord = {
  word: string;
  w: number;
  wn: number;
  pos: THREE.Vector3;
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function weightToColor(t01: number) {
  const t = clamp(t01, 0, 1);
  const r = Math.round(lerp(120, 170, t));
  const g = Math.round(lerp(170, 140, t));
  const b = 255;
  return new THREE.Color(`rgb(${r}, ${g}, ${b})`);
}

function fibonacciSphere(n: number) {
  const pts: THREE.Vector3[] = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = ga * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    pts.push(new THREE.Vector3(x, y, z).normalize());
  }
  return pts;
}

function relaxPoints(points: THREE.Vector3[], weights: number[], iters = 36, step = 0.025) {
  const p = points.map((v) => v.clone());
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        const big = Math.max(weights[i], weights[j]);
        const needed = 0.22 + big * 0.45;

        const dot = clamp(p[i].dot(p[j]), -1, 1);
        const ang = Math.acos(dot);

        if (ang < needed) {
          const dir = p[i].clone().sub(p[j]);
          const m = dir.length() || 1;
          dir.multiplyScalar(1 / m);

          const push = (needed - ang) * step;
          p[i].addScaledVector(dir, push).normalize();
          p[j].addScaledVector(dir, -push).normalize();
        }
      }
    }
  }
  return p;
}

function Scene({
  placed,
  isActive,
  onHover,
}: {
  placed: PlacedWord[];
  isActive: boolean;
  onHover: (h: { word: string; weight: number; x: number; y: number } | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const textRefs = useRef<THREE.Object3D[]>([]);
  const { camera } = useThree();

  const AUTO_ROT_SPEED = 0.45; 
  const radius = 2.2;

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    groupRef.current.rotation.y += AUTO_ROT_SPEED * delta;

    for (const obj of textRefs.current) {
      obj.lookAt(camera.position);
    }
  });

  textRefs.current = [];

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshStandardMaterial
          color={new THREE.Color("#4b8bff")}
          transparent
          opacity={0.1} 
          emissive={new THREE.Color("#6ea8ff")}
          emissiveIntensity={0.55}
          roughness={0.45}
          metalness={0.0}
          depthWrite={false}
        />
      </mesh>

      <mesh renderOrder={0}>
        <sphereGeometry args={[radius * 1.003, 24, 24]} />
        <meshBasicMaterial
          color={new THREE.Color("rgb(120, 180, 255)")}
          transparent
          opacity={.2} 
          wireframe
          depthWrite={false}
        />
      </mesh>

      {isActive &&
        placed.map((p) => {
          const fontSize = lerp(0.12, 0.30, Math.pow(p.wn, 1.15));

          const outward = 0.14 + p.wn * 0.10;
          const pos = p.pos.clone().multiplyScalar(radius + outward);

          const color = weightToColor(p.wn);

          return (
            <Text
              key={p.word}
              ref={(r) => {
                if (r) textRefs.current.push(r);
              }}
              renderOrder={10}
              position={[pos.x, pos.y * 0.78, pos.z]}
              fontSize={fontSize}
              color={color}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.003}
              outlineColor={"#0b1220"}
              onPointerOver={(e) => {
                e.stopPropagation();
                onHover({
                  word: p.word,
                  weight: p.w,
                  x: e.nativeEvent.clientX,
                  y: e.nativeEvent.clientY,
                });
                document.body.style.cursor = "pointer";
              }}
              onPointerMove={(e) => {
                e.stopPropagation();
                onHover({
                  word: p.word,
                  weight: p.w,
                  x: e.nativeEvent.clientX,
                  y: e.nativeEvent.clientY,
                });
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                onHover(null);
                document.body.style.cursor = "default";
              }}
            >
              {p.word}
              <meshBasicMaterial
                transparent
                opacity={1}
                depthWrite={false}
                depthTest={false}
                toneMapped={false}
              />
            </Text>
          );
        })}
    </group>
  );
}

export function Globe3D({ keywords, isActive }: Globe3DProps) {
  const [hover, setHover] = useState<{ word: string; weight: number; x: number; y: number } | null>(null);

  const placed: PlacedWord[] = useMemo(() => {
    const cleaned = [...keywords]
      .filter((k) => k.word?.trim())
      .map((k) => ({ word: k.word.trim(), w: clamp(k.weight ?? 0, 0, 1) }))
      .sort((a, b) => b.w - a.w);

    if (!cleaned.length) return [];

    const ws = cleaned.map((x) => x.w);
    const wMax = Math.max(...ws);
    const wMin = Math.min(...ws);
    const denom = Math.max(1e-6, wMax - wMin);

    const wnList = cleaned.map((x) => clamp((x.w - wMin) / denom, 0, 1));
    const base = fibonacciSphere(cleaned.length);
    const relaxed = relaxPoints(base, wnList, 36, 0.025);

    return cleaned.map((k, i) => ({
      word: k.word,
      w: k.w,
      wn: wnList[i],
      pos: relaxed[i],
    }));
  }, [keywords]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas camera={{ position: [0, 0, 6.4], fov: 45 }} dpr={[1, 1.5]} style={{ width: "100%", height: "100%" }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 6, 4]} intensity={1.3} />
        <Scene placed={placed} isActive={isActive} onHover={setHover} />
        <OrbitControls enablePan={false} enableZoom={true} rotateSpeed={0.6} />
      </Canvas>

      {hover && (
        <div
          style={{
            position: "fixed",
            left: hover.x + 12,
            top: hover.y + 12,
            padding: "6px 10px",
            borderRadius: 10,
            background: "rgba(10, 14, 22, 0.85)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.92)",
            fontSize: 12,
            pointerEvents: "none",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 9999,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{hover.word}</div>
          <div style={{ opacity: 0.85 }}>weight: {hover.weight.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}
