import React, { useMemo, useRef } from "react";
import { useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";

const SpherePointsContent: React.FC<{ size: number }> = ({ size }) => {
  const frame = useCurrentFrame();
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // 900 vértices distribuídos pela espiral de Fibonacci para perfeição esférica
  const { positions, colors } = useMemo(() => {
    const count = 900;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const radius = 2.4;

    const colorFront = new THREE.Color("#00D2FF"); // Ciano vibrante
    const colorBack = new THREE.Color("#003399");  // Azul escuro profundo

    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; // de 1 a -1
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      pos[i * 3] = x * radius;
      pos[i * 3 + 1] = y * radius;
      pos[i * 3 + 2] = z * radius;

      // Profundidade de campo (DoF): interpola cor entre frontal e fundo
      const depthFactor = (z + 1) / 2; // 0 (fundo) a 1 (frente)
      const c = colorBack.clone().lerp(colorFront, depthFactor);

      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    return { positions: pos, colors: col };
  }, []);

  // Rotação suave sincronizada com useCurrentFrame
  const rotY = frame * 0.016;
  const rotX = Math.sin(frame * 0.008) * 0.35 + 0.15;

  return (
    <group ref={groupRef} rotation={[rotX, rotY, 0]}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} color="#00D2FF" />

      {/* Nuvem de 900 Pontos Esféricos Orbitais */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.11}
          vertexColors
          transparent
          opacity={0.92}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Anel Equatorial Fino com Iluminação */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.2, 0, frame * 0.01]}>
        <torusGeometry args={[3.2, 0.022, 16, 120]} />
        <meshStandardMaterial
          color="#00D2FF"
          emissive="#0055FF"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
    </group>
  );
};

export const OrbitalSphere3D: React.FC<{ size?: number }> = ({ size = 760 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Halo de luz central traseiro */}
      <div
        style={{
          position: "absolute",
          width: size * 0.65,
          height: size * 0.65,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0, 85, 255, 0.35) 0%, rgba(0, 210, 255, 0.12) 50%, transparent 75%)",
          filter: "blur(36px)",
          pointerEvents: "none",
        }}
      />
      <ThreeCanvas
        width={size}
        height={size}
        camera={{ position: [0, 0, 7.2], fov: 42 }}
        style={{
          width: size,
          height: size,
          pointerEvents: "none",
        }}
      >
        <SpherePointsContent size={size} />
      </ThreeCanvas>
    </div>
  );
};

