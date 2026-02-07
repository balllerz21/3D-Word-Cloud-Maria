import { Canvas, useFrame } from "@react-three/fiber";
import { Text, OrbitControls } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

type Keyword = {
  word: string;
  weight: number;
};

function WordCloud({ keywords }: { keywords: Keyword[] }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  const positions = useMemo(() => {
    return keywords.map((k, i) => {
      const phi = Math.acos(-1 + (2 * i) / keywords.length);
      const theta = Math.sqrt(keywords.length * Math.PI) * phi;

      const radius = 2.5;

      return {
        word: k.word,
        weight: k.weight,
        position: [
          radius * Math.cos(theta) * Math.sin(phi),
          radius * Math.sin(theta) * Math.sin(phi),
          radius * Math.cos(phi),
        ] as [number, number, number],
      };
    });
  }, [keywords]);

  return (
    <group ref={groupRef}>
      {positions.map((p) => (
        <Text
          key={p.word}
          position={p.position}
          fontSize={0.3 + p.weight * 0.8}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {p.word}
        </Text>
      ))}
    </group>
  );
}

export function GlobeVisualization({
  keywords,
}: {
  keywords: Keyword[];
}) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 0, 6] }}>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <WordCloud keywords={keywords.slice(0, 40)} />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
