import React from "react";
import { useCurrentFrame } from "remotion";

export const GridBackground: React.FC = () => {
  const frame = useCurrentFrame();

  // Pulso sutil da iluminação de estúdio
  const pulse = Math.sin((frame / 45) * Math.PI) * 0.05;
  const lightScale = 1.0 + pulse;

  return (
    <div
      style={{
        position: "absolute",
        width: "1080px",
        height: "1920px",
        backgroundColor: "#030611",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 1. Malha de Coordenadas Ortogonais Técnicas com Glow Ciano (40px) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(0, 210, 255, 0.08) 1.5px, transparent 1.5px)",
          backgroundSize: "40px 40px",
          opacity: 0.95,
          maskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0.15) 90%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0.15) 90%)",
        }}
      />

      {/* 2. Luz de Estúdio Direcional Superior (50% 25%) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 25%, rgba(0, 85, 255, 0.3) 0%, rgba(0, 210, 255, 0.1) 45%, transparent 75%)",
          transform: `scale(${lightScale})`,
          pointerEvents: "none",
        }}
      />

      {/* 3. Feixe Volumétrico Profundo */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 950,
          height: 950,
          borderRadius: "50%",
          backgroundColor: "#0055FF",
          filter: "blur(180px)",
          opacity: 0.18,
          pointerEvents: "none",
        }}
      />

      {/* 4. Vinheta Óptica Cinematográfica Escura nas Bordas */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow:
            "inset 0 0 200px rgba(0, 0, 0, 0.95), inset 0 0 350px rgba(2, 5, 15, 0.9)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
