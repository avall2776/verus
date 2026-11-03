import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { GridBackground } from "../components/GridBackground";

export const Scene01PillTicker: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // =========================================================================
  // FASE 1: FRAMES 0 - 45 (Digitação do endereço vallor.app/radar-stories)
  // =========================================================================
  const fullText = "vallor.app/radar-stories";
  const typedCharCount = Math.floor(
    interpolate(frame, [6, 38], [0, fullText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const displayedText = fullText.slice(0, typedCharCount);
  const showBlinkingCursor = frame < 45 && frame % 20 < 10;

  // =========================================================================
  // FASE 2: FRAMES 45 - 90 (Colapso Elástico em Pílula Titânio com Snap)
  // =========================================================================
  const collapseSpring = spring({
    frame: frame - 45,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.8 },
  });

  // =========================================================================
  // FASE 3: FRAMES 90 - 120 (Movimento de Cursor e Clique Háptico)
  // =========================================================================
  const cursorSpring = spring({
    frame: frame - 82,
    fps,
    config: { damping: 15, stiffness: 150, mass: 0.9 },
  });

  const cursorX = interpolate(cursorSpring, [0, 1], [720, 540]);
  const cursorY = interpolate(cursorSpring, [0, 1], [1300, 960]);
  const cursorOpacity = interpolate(frame, [78, 85, 118, 126], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Escala do clique na pílula (Snap tátil: 1 -> 0.93 -> 1)
  const clickScale = interpolate(frame, [104, 108, 115], [1, 0.93, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Onda de choque translúcida disparada no clique (Frame 106)
  const shockwaveScale = interpolate(frame, [106, 128], [0.8, 3.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shockwaveOpacity = interpolate(frame, [106, 112, 128], [0, 0.75, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // =========================================================================
  // FASE 4: FRAMES 120 - 240 (Expansão Horizontal em Cartão Executivo)
  // =========================================================================
  const expandSpring = spring({
    frame: frame - 120,
    fps,
    config: { damping: 14, stiffness: 140, mass: 0.9 },
  });

  // Dimensões dinâmicas calculadas com precisão física
  // Estado 1 (Input Bar): 720px x 110px
  // Estado 2 (Pílula Titânio): 120px x 120px
  // Estado 3 (Cartão Executivo): 920px x 560px
  const boxWidth =
    frame < 45
      ? 720
      : frame < 120
      ? interpolate(collapseSpring, [0, 1], [720, 120])
      : interpolate(expandSpring, [0, 1], [120, 920]);

  const boxHeight =
    frame < 45
      ? 110
      : frame < 120
      ? interpolate(collapseSpring, [0, 1], [110, 120])
      : interpolate(expandSpring, [0, 1], [120, 560]);

  const borderRadius =
    frame < 45
      ? 28
      : frame < 120
      ? interpolate(collapseSpring, [0, 1], [28, 60])
      : interpolate(expandSpring, [0, 1], [60, 36]);

  // Transições de conteúdo interno
  const inputContentOpacity = interpolate(frame, [45, 52], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pillIconOpacity =
    frame < 120
      ? interpolate(frame, [52, 65], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : interpolate(frame, [120, 130], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const cardContentOpacity = interpolate(frame, [128, 142], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Contador Numérico Ascendente (0 -> 48.210)
  const rawCounter = interpolate(frame, [130, 205], [0, 48210], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const formattedCounter = Math.floor(rawCounter).toLocaleString("pt-BR");

  // Animação de traçado do gráfico linear Bézier
  const chartProgress = interpolate(frame, [135, 215], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pontos da Curva Bézier do Gráfico
  const chartPath = "M 0 160 C 140 140, 220 180, 340 110 C 460 40, 560 130, 680 50 C 760 10, 840 30, 920 0";
  const chartAreaPath = `${chartPath} L 920 220 L 0 220 Z`;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        backgroundColor: "#050814",
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 1. Grelha de Fundo com Feixe Volumétrico */}
      <GridBackground />

      {/* 2. Onda de Choque do Clique Háptico */}
      {frame >= 106 && (
        <div
          style={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "2px solid #00D2FF",
            backgroundColor: "rgba(0, 210, 255, 0.15)",
            transform: `scale(${shockwaveScale})`,
            opacity: shockwaveOpacity,
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      )}

      {/* 3. A Caixa Central / Pílula / Cartão Executivo */}
      <div
        style={{
          position: "relative",
          width: boxWidth,
          height: boxHeight,
          borderRadius,
          backgroundColor: frame < 45 ? "#080F20" : "#0B1224",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          boxShadow:
            frame < 120
              ? "0 20px 50px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 210, 255, 0.22)"
              : "0 35px 80px rgba(0, 0, 0, 0.85), 0 0 60px rgba(0, 85, 255, 0.28)",
          transform: `scale(${clickScale})`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 20,
        }}
      >
        {/* Glow Superior Interno de Estúdio */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
            zIndex: 5,
          }}
        />

        {/* =================================================================== */}
        {/* CONTEÚDO 1: A BARRA DE DIGITAÇÃO INICIAL                            */}
        {/* =================================================================== */}
        {frame < 55 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 36px",
              opacity: inputContentOpacity,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Ícone de Busca / Link */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D2FF" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              <span
                style={{
                  fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
                  fontSize: 28,
                  fontWeight: 600,
                  color: "#FFFFFF",
                  letterSpacing: "-0.5px",
                }}
              >
                {displayedText}
                {showBlinkingCursor && (
                  <span style={{ color: "#00D2FF", fontWeight: 700, marginLeft: 2 }}>|</span>
                )}
              </span>
            </div>

            {/* Badge de Protocolo Seguro */}
            <div
              style={{
                backgroundColor: "rgba(0, 210, 255, 0.12)",
                border: "1px solid rgba(0, 210, 255, 0.3)",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 14,
                fontFamily: "monospace",
                fontWeight: 700,
                color: "#00D2FF",
              }}
            >
              HTTPS
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* CONTEÚDO 2: O ÍCONE OFICIAL VALLOR NA PÍLULA TITÂNIO                 */}
        {/* =================================================================== */}
        {frame >= 50 && frame < 135 && (
          <div
            style={{
              position: "absolute",
              opacity: pillIconOpacity,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Anel Vetorial VALLOR Oficial com Brilho Ciano */}
            <svg width="68" height="68" viewBox="0 0 256 256">
              <defs>
                <linearGradient id="vallorCyanRemotion" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00A8FF" />
                  <stop offset="50%" stopColor="#00E5FF" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
              <circle
                cx="128"
                cy="128"
                r="96"
                fill="none"
                stroke="url(#vallorCyanRemotion)"
                strokeWidth="44"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}

        {/* =================================================================== */}
        {/* CONTEÚDO 3: O CARTÃO EXECUTIVO EXPANDIDO COM TICKER ASCENDENTE      */}
        {/* =================================================================== */}
        {frame >= 120 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: "48px 56px",
              opacity: cardContentOpacity,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Topo do Cartão: Identidade VALLOR e Badge de Alta */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* Mini Anel VALLOR */}
                <svg width="40" height="40" viewBox="0 0 256 256">
                  <circle
                    cx="128"
                    cy="128"
                    r="96"
                    fill="none"
                    stroke="#00D2FF"
                    strokeWidth="44"
                    strokeLinecap="round"
                  />
                </svg>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF", letterSpacing: "1px" }}>
                    RADAR DE STORIES
                  </div>
                  <div style={{ fontSize: 14, color: "#94A3B8", fontWeight: 500 }}>
                    Telemetria Preditiva VALLOR
                  </div>
                </div>
              </div>

              {/* Badge de Alta */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  borderRadius: 20,
                  padding: "8px 18px",
                  color: "#10B981",
                  fontWeight: 800,
                  fontSize: 16,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <span>↑ +42.8%</span>
              </div>
            </div>

            {/* Centro: Ticker Numérico Gigante */}
            <div style={{ zIndex: 10, margin: "20px 0" }}>
              <div
                style={{
                  fontSize: 78,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "-2px",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                }}
              >
                <span>{formattedCounter}</span>
                <span style={{ fontSize: 28, color: "#00D2FF", fontWeight: 700, letterSpacing: "0px" }}>
                  LEADS
                </span>
              </div>

              <div
                style={{
                  fontSize: 18,
                  color: "#00D2FF",
                  fontWeight: 800,
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  marginTop: 12,
                }}
              >
                LEADS QUALIFICADOS COM SCORE &gt; 90
              </div>
            </div>

            {/* Fundo do Cartão: Gráfico Linear Bézier Azul Royal (#0055FF) */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 220,
                overflow: "hidden",
                pointerEvents: "none",
                zIndex: 2,
              }}
            >
              <svg width="920" height="220" viewBox="0 0 920 220" fill="none">
                <defs>
                  <linearGradient id="chartFillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0055FF" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#0055FF" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Preenchimento Descendente em Gradiente */}
                <path
                  d={chartAreaPath}
                  fill="url(#chartFillGrad)"
                  style={{
                    opacity: chartProgress,
                  }}
                />

                {/* Linha Bézier do Gráfico em Azul Royal com Traçado Animado */}
                <path
                  d={chartPath}
                  stroke="#0055FF"
                  strokeWidth="5"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 1000,
                    strokeDashoffset: (1 - chartProgress) * 1000,
                  }}
                />
              </svg>
            </div>

            {/* Rodapé do Cartão com Dados de Conversão */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                paddingTop: 18,
                zIndex: 10,
              }}
            >
              <div style={{ display: "flex", gap: 24, fontSize: 15, color: "#94A3B8" }}>
                <span>Visualizadores: <strong style={{ color: "#FFF" }}>18.400</strong></span>
                <span>Abordagem IA: <strong style={{ color: "#00D2FF" }}>100% Pronta</strong></span>
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#10B981",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                ● TEMPO REAL
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Cursor Vetorial de Precisão */}
      {frame >= 78 && frame <= 126 && (
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            opacity: cursorOpacity,
            zIndex: 50,
            pointerEvents: "none",
            transform: "translate(-6px, -4px)",
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))",
          }}
        >
          {/* Cursor SVG Mac/Figma Estilo Dub */}
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 3L10.07 20.97L13.58 13.58L20.97 10.07L3 3Z"
              fill="#FFFFFF"
              stroke="#0B1224"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

