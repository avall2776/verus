import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { ShieldCheck } from "lucide-react";
import { displayFont, monoFont, interFont } from "../typography/fonts";

export const SceneReal3AnalyticsFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. ENTRADA MATCH CUT (0.85 -> 1.0)
  const entrySpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 240, mass: 0.6 },
  });
  const entryScale = interpolate(entrySpring, [0, 1], [0.85, 1]);
  const entryBlur = interpolate(frame, [0, 8], [6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 2. CURVA SPLINE DE 7 DIAS COM EVOLUÇÃO VIA @remotion/paths
  // Frames 20 a 140 (Master 1100 a 1220)
  const splineProgress = interpolate(frame, [20, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Caminho da curva: Seg (18) -> Ter (22) -> Qua (19) -> Qui (35) -> Sex (42) -> Sáb (38) -> Hoje (100 DISPARO EXPONENCIAL!)
  const splinePath = "M 40 220 C 140 210, 240 215, 340 180 C 440 160, 540 145, 640 155 C 720 160, 780 120, 840 30";
  const areaPath = "M 40 220 C 140 210, 240 215, 340 180 C 440 160, 540 145, 640 155 C 720 160, 780 120, 840 30 L 840 250 L 40 250 Z";

  const pathLen = getLength(splinePath);
  const evolution = evolvePath(splineProgress, splinePath);
  const currentLen = Math.max(0.1, Math.min(pathLen - 0.1, pathLen * splineProgress));
  const tipPoint = getPointAtLength(splinePath, currentLen);

  // 3. BARRA DE PROGRESSO DE SEGMENTO: Maquinários 100% (Frames 100 a 220)
  const segmentProgress = interpolate(frame, [100, 220], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 4. MATCH CUT PUSH-IN FINAL (Frames 580 a 600)
  const pushInScale = interpolate(frame, [580, 600], [1, 1.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitBlur = interpolate(frame, [584, 600], [0, 10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const currentScale = entryScale * pushInScale;
  const currentBlur = Math.max(entryBlur, exitBlur);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${currentScale})`,
        filter: currentBlur > 0.5 ? `blur(${currentBlur}px)` : "none",
        padding: "0 30px",
      }}
    >
      <div
        style={{
          width: 960,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* ======================================================================= */}
        {/* CARD 1: FLUXO DE VISUALIZAÇÕES DE STATUS (ÚLTIMOS 7 DIAS)               */}
        {/* ======================================================================= */}
        <div
          style={{
            borderRadius: 28,
            backgroundColor: "#0B1224",
            border: "1px solid rgba(0, 210, 255, 0.25)",
            padding: "28px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            boxShadow:
              "0 25px 70px rgba(0, 0, 0, 0.85), 0 0 50px rgba(0, 85, 255, 0.15)",
          }}
        >
          {/* Header do Gráfico com Legendas Purificadas */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: displayFont,
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  letterSpacing: "-0.01em",
                }}
              >
                Fluxo de Visualizações de Status (Últimos 7 dias)
              </div>
              <div
                style={{
                  fontFamily: interFont,
                  fontSize: 13,
                  color: "#94A3B8",
                  marginTop: 2,
                }}
              >
                Segmentação diária baseada em eventos reais do WhatsApp conectado.
              </div>
            </div>

            {/* Legendas Oficiais em Azul/Ciano/Slate */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 8,
                  backgroundColor: "rgba(0, 210, 255, 0.12)",
                  border: "1px solid rgba(0, 210, 255, 0.35)",
                  fontFamily: monoFont,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#00D2FF",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "#00D2FF" }} />
                <span>Maquinários</span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 8,
                  backgroundColor: "rgba(0, 85, 255, 0.15)",
                  border: "1px solid rgba(0, 85, 255, 0.35)",
                  fontFamily: monoFont,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#60A5FA",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "#0055FF" }} />
                <span>Insumos</span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 8,
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  fontFamily: monoFont,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#94A3B8",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "#94A3B8" }} />
                <span>Cotações</span>
              </div>
            </div>
          </div>

          {/* Gráfico Vetorial em SVG com Interpolação via @remotion/paths */}
          <div style={{ position: "relative", width: "100%", height: 260 }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 880 260"
              fill="none"
              style={{ overflow: "visible" }}
            >
              <defs>
                <linearGradient id="areaFlowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0055FF" stopOpacity="0.4" />
                  <stop offset="70%" stopColor="#00D2FF" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#0055FF" stopOpacity="0" />
                </linearGradient>

                <linearGradient id="lineFlowGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0055FF" />
                  <stop offset="70%" stopColor="#00D2FF" />
                  <stop offset="100%" stopColor="#FFFFFF" />
                </linearGradient>

                <filter id="glowPoint" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Linhas de Grade de Fundo */}
              <line x1="40" y1="60" x2="840" y2="60" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="40" y1="120" x2="840" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="40" y1="180" x2="840" y2="180" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="40" y1="240" x2="840" y2="240" stroke="rgba(255,255,255,0.1)" />

              {/* Área Sombreada */}
              <path
                d={areaPath}
                fill="url(#areaFlowGrad)"
                opacity={splineProgress * 0.9}
              />

              {/* Traçado da Curva Spline com rastro luminoso */}
              <path
                d={splinePath}
                fill="none"
                stroke="url(#lineFlowGrad)"
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={pathLen}
                strokeDashoffset={evolution.strokeDashoffset}
              />

              {/* Ponto de Luz na Ponta da Curva em Tempo Real */}
              {tipPoint && splineProgress > 0.02 && (
                <g transform={`translate(${tipPoint.x}, ${tipPoint.y})`} filter="url(#glowPoint)">
                  <circle r={14} fill="#00D2FF" opacity={0.4} />
                  <circle r={8} fill="#FFFFFF" />
                </g>
              )}

              {/* Rótulos dos Dias da Semana */}
              <text x="40" y="258" fill="#64748B" fontSize="12" fontFamily={monoFont}>Seg</text>
              <text x="170" y="258" fill="#64748B" fontSize="12" fontFamily={monoFont}>Ter</text>
              <text x="300" y="258" fill="#64748B" fontSize="12" fontFamily={monoFont}>Qua</text>
              <text x="440" y="258" fill="#64748B" fontSize="12" fontFamily={monoFont}>Qui</text>
              <text x="570" y="258" fill="#64748B" fontSize="12" fontFamily={monoFont}>Sex</text>
              <text x="700" y="258" fill="#64748B" fontSize="12" fontFamily={monoFont}>Sáb</text>
              <text x="820" y="258" fill="#00D2FF" fontSize="13" fontWeight="bold" fontFamily={monoFont}>HOJE (100)</text>
            </svg>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* CARD 2: INTERESSE POR SEGMENTO & BOX DE AUDITORIA                       */}
        {/* ======================================================================= */}
        <div
          style={{
            borderRadius: 28,
            backgroundColor: "#0B1224",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "28px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            boxShadow: "0 25px 70px rgba(0, 0, 0, 0.85)",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: displayFont,
                fontSize: 22,
                fontWeight: 800,
                color: "#FFFFFF",
              }}
            >
              Interesse por Segmento
            </div>
            <div
              style={{
                fontFamily: interFont,
                fontSize: 13,
                color: "#94A3B8",
                marginTop: 2,
              }}
            >
              Distribuição percentual de visualizações por categoria técnica.
            </div>
          </div>

          {/* Barras de Segmento em Ciano/Azul */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Maquinários & Implementos (100%) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontFamily: interFont,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#E2E8F0",
                }}
              >
                <span>Maquinários & Implementos Agrícolas</span>
                <span style={{ fontFamily: monoFont, fontWeight: 800, color: "#00D2FF" }}>
                  {Math.floor(segmentProgress)}%
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${segmentProgress}%`,
                    borderRadius: 6,
                    background: "linear-gradient(90deg, #0055FF 0%, #00D2FF 100%)",
                    boxShadow: "0 0 16px rgba(0, 210, 255, 0.5)",
                  }}
                />
              </div>
            </div>

            {/* Insumos & Defensivos (0%) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontFamily: interFont,
                  fontSize: 13,
                  color: "#64748B",
                }}
              >
                <span>Insumos & Nutrição de Safra</span>
                <span style={{ fontFamily: monoFont }}>0%</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                }}
              />
            </div>
          </div>

          {/* Box de Auditoria e Certeza */}
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 18,
              backgroundColor: "rgba(0, 85, 255, 0.1)",
              border: "1px solid rgba(0, 210, 255, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "rgba(0, 210, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00D2FF",
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={24} />
            </div>

            <div>
              <div
                style={{
                  fontFamily: interFont,
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#00D2FF",
                }}
              >
                Certeza e Rastreabilidade Total:
              </div>
              <div
                style={{
                  fontFamily: interFont,
                  fontSize: 13,
                  color: "#94A3B8",
                  marginTop: 2,
                }}
              >
                Cada visualizador é associado ao número do WhatsApp, data, hora exata e post no catálogo.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
