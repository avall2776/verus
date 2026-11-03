import React from "react";
import { useCurrentFrame } from "remotion";

export const CinematicOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  // Variação de semente de ruído a cada frame para granulação de película viva (film grain)
  const seed = (frame % 10) + 1;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {/* 1. Camada de Ruído de Película SVG (Film Grain Fractal Noise) */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.032,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      >
        <filter id={`filmGrain-${seed}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves={3}
            seed={seed}
            result="noise"
          />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
          />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter={`url(#filmGrain-${seed})`}
        />
      </svg>

      {/* 2. Vinheta Óptica Suave nas Bordas */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow:
            "inset 0 0 140px rgba(0, 0, 0, 0.75), inset 0 0 280px rgba(2, 5, 14, 0.65)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

