import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { displayFont, interFont } from "../typography/fonts";

export const Scene4KineticClose: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. ENTRADA MATCH CUT (Surge do push-in da Cena 3: 0.85 -> 1.0)
  const entrySpring = spring({
    frame,
    fps,
    config: {
      damping: 14,
      stiffness: 240,
      mass: 0.6,
    },
  });

  const entryScale = interpolate(entrySpring, [0, 1], [0.85, 1]);
  const entryBlur = interpolate(frame, [0, 8], [6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 2. TIPOGRAFIA MONUMENTAL UNIFICADA COM STAGGER RÍGIDO (Frames 0 a 64 / Master 700 a 764)
  // Linha 1: "TRANSFORME CONVERSAS" (Entrada no Frame 0)
  const text1Spring = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 220, mass: 0.65 },
  });
  const text1EntryY = interpolate(text1Spring, [0, 1], [120, 0]);

  // Linha 2: "EM FATURAMENTO PREVISÍVEL." (Stagger rígido: entrada no Frame 14)
  const text2Spring = spring({
    frame: frame - 14,
    fps,
    config: { damping: 13, stiffness: 220, mass: 0.65 },
  });
  const text2EntryY = interpolate(text2Spring, [0, 1], [120, 0]);

  // Saída rápida via máscara vertical no frame 60 (Master 760)
  const exitMaskY = interpolate(frame, [54, 64], [0, -140], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitOpacity = interpolate(frame, [58, 64], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Corte rígido: Tipografia ativa de 0 a 64; Marca ativa a partir de 65 (Master 765)
  const isTypographyActive = frame < 65;
  const isBrandActive = frame >= 65;

  // 3. Revelação Isolada e Triunfal da Marca VALLOR (A partir do Frame 65 / Master 765)
  const brandSpring = spring({
    frame: frame - 65,
    fps,
    config: { damping: 14, stiffness: 190, mass: 0.8 },
  });

  const brandScale = interpolate(brandSpring, [0, 1], [0.72, 1]);

  // Rotação contínua do anel "O" da VALLOR
  const ringRotation = frame * 2.2;

  // Reflexo laser horizontal cruzando a marca (Frames 80 a 130 / Master 780 a 830)
  const laserX = interpolate(frame, [80, 130], [-450, 450], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulso tátil do botão CTA
  const buttonPulse =
    frame > 95 ? Math.sin((frame - 95) * 0.18) * 0.045 + 1 : 1;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${entryScale})`,
        filter: entryBlur > 0.5 ? `blur(${entryBlur}px)` : "none",
        padding: "0 30px",
      }}
    >
      {/* Camada 1: Tipografia Monumental de Impacto (Frames 700 a 764) */}
      {isTypographyActive && (
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 16,
            zIndex: 10,
            width: 1020,
            opacity: exitOpacity,
            transform: `translateY(${exitMaskY}px)`,
          }}
        >
          {/* Linha 1 */}
          <div style={{ overflow: "hidden", padding: "10px 0", width: "100%" }}>
            <div
              style={{
                fontFamily: displayFont,
                fontSize: 84,
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                transform: `translateY(${text1EntryY}px)`,
                textShadow: "0 10px 40px rgba(0, 85, 255, 0.65)",
                textTransform: "uppercase",
              }}
            >
              TRANSFORME CONVERSAS
            </div>
          </div>

          {/* Linha 2 com Gradiente Ciano-Azul */}
          <div style={{ overflow: "hidden", padding: "10px 0", width: "100%" }}>
            <div
              style={{
                fontFamily: displayFont,
                fontSize: 88,
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                transform: `translateY(${text2EntryY}px)`,
                background:
                  "linear-gradient(135deg, #00D2FF 0%, #0055FF 55%, #FFFFFF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 10px 50px rgba(0, 210, 255, 0.65))",
                textTransform: "uppercase",
              }}
            >
              EM FATURAMENTO PREVISÍVEL.
            </div>
          </div>
        </div>
      )}

      {/* Camada 2: Revelação Triunfal da Marca VALLOR aos 765 frames */}
      {isBrandActive && (
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            transform: `scale(${brandScale})`,
            zIndex: 20,
            width: 960,
          }}
        >
          {/* Halo de Luz Traseiro */}
          <div
            style={{
              position: "absolute",
              top: -90,
              width: 620,
              height: 620,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(0, 85, 255, 0.5) 0%, rgba(0, 210, 255, 0.25) 40%, transparent 70%)",
              filter: "blur(70px)",
              pointerEvents: "none",
            }}
          />

          {/* Anel Vetorial VALLOR Giratório */}
          <div
            style={{
              position: "relative",
              width: 160,
              height: 160,
              marginBottom: 32,
            }}
          >
            <svg
              width="160"
              height="160"
              viewBox="0 0 100 100"
              fill="none"
              style={{
                transform: `rotate(${ringRotation}deg)`,
                filter: "drop-shadow(0 0 45px rgba(0, 210, 255, 0.9))",
              }}
            >
              <defs>
                <linearGradient id="brandRingGradFin3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00D2FF" />
                  <stop offset="50%" stopColor="#0055FF" />
                  <stop offset="100%" stopColor="#FFFFFF" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="36"
                stroke="url(#brandRingGradFin3)"
                strokeWidth="7.5"
                strokeLinecap="round"
                strokeDasharray="180 40"
              />
              <circle cx="50" cy="50" r="11" fill="#00D2FF" />
            </svg>
          </div>

          {/* Logotipo Monumental com Reflexo Laser */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              padding: "6px 28px",
            }}
          >
            <div
              style={{
                fontFamily: displayFont,
                fontSize: 104,
                fontWeight: 900,
                letterSpacing: "0.06em",
                color: "#FFFFFF",
                lineHeight: 1,
                textShadow: "0 0 80px rgba(0, 150, 255, 0.9)",
              }}
            >
              VALLOR
            </div>

            {/* Reflexo Laser Horizontal */}
            {frame >= 80 && frame <= 130 && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: "50%",
                  width: 100,
                  transform: `translateX(${laserX}px) skewX(-25deg)`,
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.85) 50%, transparent 100%)",
                  pointerEvents: "none",
                  mixBlendMode: "overlay",
                }}
              />
            )}
          </div>

          {/* Subtítulo de Posicionamento */}
          <div
            style={{
              fontFamily: interFont,
              fontSize: 23,
              fontWeight: 600,
              color: "#94A3B8",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginTop: 18,
            }}
          >
            Inteligência Comercial &amp; Motion Omnichannel
          </div>

          {/* Botão Tátil "Iniciar Agora" */}
          <div
            style={{
              marginTop: 58,
              transform: `scale(${buttonPulse})`,
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              padding: "26px 66px",
              borderRadius: 999,
              backgroundColor: "#0055FF",
              border: "1px solid rgba(0, 210, 255, 0.7)",
              boxShadow:
                "0 24px 60px rgba(0, 85, 255, 0.65), 0 0 40px rgba(0, 210, 255, 0.5)",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                fontFamily: interFont,
                fontSize: 28,
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "0.02em",
              }}
            >
              Iniciar Agora
            </span>
            <span
              style={{
                fontSize: 30,
                color: "#FFFFFF",
                transform: "translateX(2px)",
              }}
            >
              →
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
