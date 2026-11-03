import React from "react";
import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";

interface DynamicSplineGraphProps {
  progress: number; // 0 to 1
  width?: number;
  height?: number;
}

export const DynamicSplineGraph: React.FC<DynamicSplineGraphProps> = ({
  progress,
  width = 860,
  height = 220,
}) => {
  // Curva Spline Ascendente de Alto Desempenho
  const linePath = "M 20 190 Q 210 185, 360 135 T 640 85 T 840 30";
  const areaPath = "M 20 190 Q 210 185, 360 135 T 640 85 T 840 30 L 840 210 L 20 210 Z";

  const pathLength = getLength(linePath);
  const evolution = evolvePath(progress, linePath);

  // Coordenadas exatas da ponta do vetor em tempo real
  const currentLength = Math.max(0.1, Math.min(pathLength - 0.1, pathLength * progress));
  const tipPoint = getPointAtLength(linePath, currentLength);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        overflow: "visible",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Gradiente sob a área da curva */}
          <linearGradient id="splineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0055FF" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#00D2FF" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0055FF" stopOpacity="0" />
          </linearGradient>

          {/* Gradiente da linha spline */}
          <linearGradient id="splineLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0055FF" />
            <stop offset="70%" stopColor="#00D2FF" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          {/* Filtro de brilho no ponto de luz */}
          <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Linhas de Grade Sutis */}
        <line x1="0" y1="55" x2={width} y2="55" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
        <line x1="0" y1="115" x2={width} y2="115" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
        <line x1="0" y1="175" x2={width} y2="175" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

        {/* 1. Área preenchida sob a curva que surge com o traçado */}
        <path
          d={areaPath}
          fill="url(#splineAreaGrad)"
          opacity={progress * 0.9}
        />

        {/* 2. Traçado da Linha Evolutiva via @remotion/paths */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#splineLineGrad)"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeDasharray={evolution.strokeDasharray}
          strokeDashoffset={evolution.strokeDashoffset}
        />

        {/* 3. Ponto de Luz Ciano na Ponta Exata da Linha */}
        {progress > 0.02 && tipPoint && (
          <g transform={`translate(${tipPoint.x}, ${tipPoint.y})`}>
            {/* Halo de luz externo */}
            <circle
              r="18"
              fill="rgba(0, 210, 255, 0.35)"
              filter="url(#pointGlow)"
            />
            {/* Anel intermediário */}
            <circle
              r="8"
              fill="#00D2FF"
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />
            {/* Núcleo de luz branco puro */}
            <circle
              r="3.5"
              fill="#FFFFFF"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
