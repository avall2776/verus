import React, { useEffect, useRef } from "react";
import { useCurrentFrame } from "remotion";

interface Sphere3DProps {
  size?: number;
  color?: string;
  accentColor?: string;
}

export const Sphere3D: React.FC<Sphere3DProps> = ({
  size = 640,
  color = "#0055FF",
  accentColor = "#00D2FF",
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Precalcula os pontos da esfera pelo método Fibonacci Sphere para distribuição homogênea
  const numPoints = 260;
  const pointsRef = useRef<{ x: number; y: number; z: number }[]>([]);

  if (pointsRef.current.length === 0) {
    const pts = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2; // de 1 a -1
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      pts.push({ x, y, z });
    }
    pointsRef.current = pts;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.38;

    // Rotação suave baseada nos frames
    const angleY = frame * 0.018;
    const angleX = Math.sin(frame * 0.01) * 0.35 + 0.2;

    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);

    // Projetar e ordenar por profundidade (Z-buffer)
    const projected = pointsRef.current.map((pt) => {
      // Rotação em Y
      const x1 = pt.x * cosY - pt.z * sinY;
      const z1 = pt.z * cosY + pt.x * sinY;

      // Rotação em X
      const y2 = pt.y * cosX - z1 * sinX;
      const z2 = z1 * cosX + pt.y * sinX;

      // Projeção perspectiva
      const distance = 2.8;
      const fov = 1 / (distance - z2);
      const px = centerX + x1 * radius * fov * 2.2;
      const py = centerY + y2 * radius * fov * 2.2;

      return { px, py, z: z2 };
    });

    // Ordena do fundo para a frente
    projected.sort((a, b) => a.z - b.z);

    // Desenha linhas de filamento entre pontos próximos frontais
    ctx.lineWidth = 1;
    for (let i = 0; i < projected.length; i++) {
      const p1 = projected[i];
      if (p1.z < -0.1) continue; // desenha filamentos apenas na face visível

      for (let j = i + 1; j < Math.min(i + 6, projected.length); j++) {
        const p2 = projected[j];
        const distSq = (p1.px - p2.px) ** 2 + (p1.py - p2.py) ** 2;
        if (distSq < 2200) {
          const alpha = Math.max(0, (1 - distSq / 2200) * 0.28 * (p1.z + 1));
          ctx.strokeStyle = `rgba(0, 150, 255, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.stroke();
        }
      }
    }

    // Desenha as partículas com iluminação e halo
    projected.forEach((p) => {
      const depthAlpha = Math.max(0.12, (p.z + 1) / 2);
      const ptRadius = Math.max(1.5, (p.z + 1.2) * 2.4);

      // Gradiente de cor por profundidade
      const isForeground = p.z > 0.4;
      ctx.fillStyle = isForeground
        ? `rgba(0, 210, 255, ${depthAlpha.toFixed(2)})`
        : `rgba(0, 85, 255, ${(depthAlpha * 0.75).toFixed(2)})`;

      ctx.beginPath();
      ctx.arc(p.px, p.py, ptRadius, 0, Math.PI * 2);
      ctx.fill();

      // Brilho intenso no ponto mais frontal
      if (p.z > 0.75) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(depthAlpha * 0.9).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(p.px, p.py, ptRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [frame, size, color, accentColor]);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Halo de luz central */}
      <div
        style={{
          position: "absolute",
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(0, 85, 255, 0.35) 0%, rgba(0, 210, 255, 0.1) 50%, transparent 75%)`,
          filter: "blur(32px)",
          pointerEvents: "none",
        }}
      />
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          position: "absolute",
          width: size,
          height: size,
        }}
      />
    </div>
  );
};

