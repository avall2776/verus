import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const Scene1InboundTrigger: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. Efeito de Digitação "vallor.app/stories" (Frames 15 a 45)
  const fullText = "vallor.app/stories";
  const typedLength = Math.min(
    fullText.length,
    Math.floor(
      interpolate(frame, [15, 45], [0, fullText.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    )
  );
  const currentText = fullText.slice(0, typedLength);
  const cursorBlink = Math.floor(frame / 14) % 2 === 0;

  // 2. Colapso com Snap Físico no Frame 55 (damping: 13, stiffness: 220, mass: 0.6)
  const collapseSpring = spring({
    frame: frame - 55,
    fps,
    config: {
      damping: 13,
      stiffness: 220,
      mass: 0.6,
    },
  });

  // Ocupação de tela 90%: Barra inicial com 960px de largura
  const width = interpolate(collapseSpring, [0, 1], [960, 120]);
  const height = interpolate(collapseSpring, [0, 1], [104, 120]);
  const borderRadius = interpolate(collapseSpring, [0, 1], [26, 60]);
  const textOpacity = interpolate(collapseSpring, [0, 0.3], [1, 0]);
  const iconOpacity = interpolate(collapseSpring, [0.35, 1], [0, 1]);
  const iconScale = interpolate(collapseSpring, [0.15, 1], [0.4, 1]);

  // Rotação suave do anel VALLOR
  const ringRotation = frame * 2.4;

  // 3. Cursor Vetorial de Precisão (Entrada aos 75 frames, clique aos 105)
  const cursorSpring = spring({
    frame: frame - 75,
    fps,
    config: {
      damping: 16,
      stiffness: 160,
    },
  });

  const cursorX = interpolate(cursorSpring, [0, 1], [320, 26]);
  const cursorY = interpolate(cursorSpring, [0, 1], [380, 22]);
  const cursorOpacity = interpolate(frame, [75, 85, 180, 195], [0, 1, 1, 0]);

  // Clique no Frame 105 com recuo elástico 0.94 -> 1.0
  const clickScale =
    frame >= 105 && frame < 122
      ? interpolate(frame, [105, 109, 122], [1, 0.94, 1])
      : 1;

  // Onda de choque circular (Ripple do clique)
  const rippleProgress =
    frame >= 105
      ? interpolate(frame, [105, 148], [0, 1], { extrapolateRight: "clamp" })
      : 0;

  // 4. MATCH CUT CONTÍNUO (Push-In nos frames 184 a 200)
  // Sem fade preto! Aceleração de escala 1.0 -> 1.36 com blur de movimento direcional
  const pushInScale = interpolate(frame, [184, 200], [1, 1.36], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const motionBlur = interpolate(frame, [186, 200], [0, 10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${pushInScale})`,
        filter: motionBlur > 0.5 ? `blur(${motionBlur}px)` : "none",
      }}
    >
      {/* Container Central com a Barra / Pílula */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${clickScale})`,
        }}
      >
        {/* Onda de choque circular (Ripple do clique) */}
        {frame >= 105 && (
          <div
            style={{
              position: "absolute",
              width: 120,
              height: 120,
              borderRadius: "50%",
              border: `2px solid rgba(0, 210, 255, ${0.9 * (1 - rippleProgress)})`,
              transform: `scale(${1 + rippleProgress * 2.8})`,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Halo de Glow Ciano (#00D2FF) */}
        <div
          style={{
            position: "absolute",
            width: width + 80,
            height: height + 80,
            borderRadius,
            background:
              "radial-gradient(circle, rgba(0, 210, 255, 0.28) 0%, rgba(0, 85, 255, 0.12) 50%, transparent 80%)",
            filter: "blur(28px)",
            opacity: iconOpacity,
            pointerEvents: "none",
          }}
        />

        {/* Barra / Pílula em Titânio Fosco (#0B1224) com borda de precisão */}
        <div
          style={{
            width,
            height,
            borderRadius,
            backgroundColor: "#0B1224",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            boxShadow:
              "0 25px 60px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Conteúdo de Texto Digitado */}
          {textOpacity > 0 && (
            <div
              style={{
                position: "absolute",
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "0 42px",
                width: "100%",
                opacity: textOpacity,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: "#00D2FF",
                  boxShadow: "0 0 16px #00D2FF",
                }}
              />
              <span
                style={{
                  fontFamily: "JetBrains Mono, Geist Mono, monospace",
                  fontSize: 38,
                  fontWeight: 600,
                  color: "#FFFFFF",
                  letterSpacing: "-0.02em",
                }}
              >
                {currentText}
                {cursorBlink && (
                  <span style={{ color: "#00D2FF", marginLeft: 4 }}>|</span>
                )}
              </span>
            </div>
          )}

          {/* Anel Giratório Oficial VALLOR */}
          {iconOpacity > 0 && (
            <div
              style={{
                position: "absolute",
                opacity: iconOpacity,
                transform: `scale(${iconScale})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="70" height="70" viewBox="0 0 100 100" fill="none">
                <defs>
                  <linearGradient id="vallorPillRingCut" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00D2FF" />
                    <stop offset="50%" stopColor="#0055FF" />
                    <stop offset="100%" stopColor="#FFFFFF" />
                  </linearGradient>
                  <filter id="pillGlowCut" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  stroke="url(#vallorPillRingCut)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter="url(#pillGlowCut)"
                  strokeDasharray="165 45"
                  style={{
                    transform: `rotate(${ringRotation}deg)`,
                    transformOrigin: "50px 50px",
                  }}
                />
                <circle cx="50" cy="50" r="10" fill="#00D2FF" />
              </svg>
            </div>
          )}
        </div>

        {/* Cursor Vetorial de Precisão */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(${cursorX}px, ${cursorY}px)`,
            opacity: cursorOpacity,
            pointerEvents: "none",
            filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.85))",
          }}
        >
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 3L11 21L14 13L22 10L4 3Z"
              fill="#FFFFFF"
              stroke="#030611"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
