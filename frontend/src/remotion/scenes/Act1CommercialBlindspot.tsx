import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, staticFile } from "remotion";
import { displayFont, monoFont, interFont } from "../typography/fonts";

export const Act1CommercialBlindspot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // =========================================================================
  // FASE 1: TIPOGRAFIA CINÉTICA (Frames 0 a 160)
  // "SEUS CLIENTES OLHAM SEU STATUS." -> "E NINGUÉM FAZ NADA."
  // =========================================================================
  const text1Spring = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 220, mass: 0.65 },
  });
  const text1Y = interpolate(text1Spring, [0, 1], [110, 0]);

  const text2Spring = spring({
    frame: frame - 60,
    fps,
    config: { damping: 13, stiffness: 220, mass: 0.65 },
  });
  const text2Y = interpolate(text2Spring, [0, 1], [110, 0]);

  const phase1Opacity = interpolate(frame, [145, 160], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // =========================================================================
  // FASE 2: SIMULAÇÃO DE MENSAGEM CANCELADA DO WHATSAPP (Frames 160 a 380)
  // "Vi que você olhou meu status..." -> backspace -> [ABORDAGEM INVASIVA: PROIBIDA]
  // =========================================================================
  const isPhase2 = frame >= 160 && frame < 380;
  const p2LocalFrame = frame - 160;

  // Digitação nos frames 15 a 65 de Phase 2 (175 a 225 master)
  const draftMessage = "Vi que você olhou meu status...";
  let typedLen = 0;
  if (p2LocalFrame >= 15 && p2LocalFrame < 75) {
    typedLen = Math.floor(
      interpolate(p2LocalFrame, [15, 75], [0, draftMessage.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
  } else if (p2LocalFrame >= 75 && p2LocalFrame < 110) {
    // Pausa de hesitação
    typedLen = draftMessage.length;
  } else if (p2LocalFrame >= 110 && p2LocalFrame < 150) {
    // Backspace rápido apagando tudo!
    typedLen = Math.floor(
      interpolate(p2LocalFrame, [110, 145], [draftMessage.length, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
  } else if (p2LocalFrame >= 150) {
    typedLen = 0;
  }
  const currentDraft = draftMessage.slice(0, typedLen);

  // Badge Vermelho [ABORDAGEM INVASIVA: PROIBIDA] entra aos 145 de Phase 2 (Frame 305)
  const badgeSpring = spring({
    frame: p2LocalFrame - 145,
    fps,
    config: { damping: 12, stiffness: 240, mass: 0.7 },
  });
  const badgeScale = interpolate(badgeSpring, [0, 1], [0.65, 1]);

  const phase2Opacity = interpolate(frame, [365, 380], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // =========================================================================
  // FASE 3: BARRA TÉCNICA "vallor.app/radar" & COLAPSO EM PÍLULA (380 a 540)
  // =========================================================================
  const isPhase3 = frame >= 380;
  const p3LocalFrame = frame - 380;

  // Digitação de "vallor.app/radar"
  const urlText = "vallor.app/radar";
  const urlLen = Math.floor(
    interpolate(p3LocalFrame, [10, 50], [0, urlText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const currentUrl = urlText.slice(0, urlLen);

  // Colapso no frame 75 de Phase 3 (Frame 455 master)
  const collapseSpring = spring({
    frame: p3LocalFrame - 75,
    fps,
    config: { damping: 13, stiffness: 220, mass: 0.6 },
  });

  const barWidth = interpolate(collapseSpring, [0, 1], [940, 120]);
  const barHeight = interpolate(collapseSpring, [0, 1], [104, 120]);
  const barRadius = interpolate(collapseSpring, [0, 1], [26, 60]);
  const urlOpacity = interpolate(collapseSpring, [0, 0.3], [1, 0]);
  const iconOpacity = interpolate(collapseSpring, [0.35, 1], [0, 1]);
  const iconScale = interpolate(collapseSpring, [0.2, 1], [0.4, 1]);

  // Match Cut Push-In nos últimos 20 frames (520 a 540)
  const pushInScale = interpolate(frame, [520, 540], [1, 1.38], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const motionBlur = interpolate(frame, [524, 540], [0, 10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${pushInScale})`,
        filter: motionBlur > 0.5 ? `blur(${motionBlur}px)` : "none",
        padding: "0 40px",
      }}
    >
      {/* ----------------------------------------------------------------- */}
      {/* FASE 1: TIPOGRAFIA DE IMPACTO COMERCIAL                           */}
      {/* ----------------------------------------------------------------- */}
      {frame < 160 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 20,
            width: 1000,
            opacity: phase1Opacity,
          }}
        >
          {/* Frase 1 */}
          <div style={{ overflow: "hidden", padding: "10px 0" }}>
            <div
              style={{
                fontFamily: displayFont,
                fontSize: 76,
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                transform: `translateY(${text1Y}px)`,
                textShadow: "0 10px 40px rgba(0, 85, 255, 0.65)",
                textTransform: "uppercase",
              }}
            >
              SEUS CLIENTES OLHAM SEU STATUS.
            </div>
          </div>

          {/* Frase 2 */}
          <div style={{ overflow: "hidden", padding: "10px 0" }}>
            <div
              style={{
                fontFamily: displayFont,
                fontSize: 82,
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                transform: `translateY(${text2Y}px)`,
                background:
                  "linear-gradient(135deg, #00D2FF 0%, #0055FF 55%, #FFFFFF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 10px 50px rgba(0, 210, 255, 0.65))",
                textTransform: "uppercase",
              }}
            >
              E NINGUÉM FAZ NADA.
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* FASE 2: MENSAGEM CANCELADA & BADGE "ABORDAGEM INVASIVA: PROIBIDA" */}
      {/* ----------------------------------------------------------------- */}
      {isPhase2 && (
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: 920,
            opacity: phase2Opacity,
          }}
        >
          {/* Simulação de Balão do WhatsApp Dark */}
          <div
            style={{
              width: "100%",
              maxWidth: 720,
              padding: "26px 36px",
              borderRadius: "28px 28px 6px 28px",
              backgroundColor: "#005C4B",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.7)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              alignSelf: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: interFont,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#25D366",
                }}
              >
                Rascunho no WhatsApp
              </span>
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: 14,
                  color: "#94A3B8",
                }}
              >
                14:22
              </span>
            </div>

            <div
              style={{
                fontFamily: interFont,
                fontSize: 32,
                fontWeight: 600,
                color: "#FFFFFF",
                minHeight: 48,
                display: "flex",
                alignItems: "center",
              }}
            >
              {currentDraft}
              <span
                style={{
                  width: 3,
                  height: 34,
                  backgroundColor: "#25D366",
                  marginLeft: 6,
                  display: "inline-block",
                }}
              />
            </div>
          </div>

          {/* Badge Vermelho Sobreposto de Proibição */}
          {p2LocalFrame >= 140 && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                transform: `translateY(-50%) scale(${badgeScale})`,
                display: "inline-flex",
                alignItems: "center",
                gap: 16,
                padding: "20px 42px",
                borderRadius: 999,
                backgroundColor: "rgba(220, 38, 38, 0.95)",
                border: "2px solid #FCA5A5",
                boxShadow:
                  "0 20px 50px rgba(220, 38, 38, 0.7), 0 0 40px rgba(239, 68, 68, 0.8)",
                zIndex: 20,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  backgroundColor: "#FFFFFF",
                  color: "#DC2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 20,
                }}
              >
                ✕
              </div>
              <span
                style={{
                  fontFamily: displayFont,
                  fontSize: 26,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                ABORDAGEM INVASIVA: PROIBIDA
              </span>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* FASE 3: BARRA "vallor.app/radar" & COLAPSO NA MARCA               */}
      {/* ----------------------------------------------------------------- */}
      {isPhase3 && (
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Halo de Glow Ciano */}
          <div
            style={{
              position: "absolute",
              width: barWidth + 80,
              height: barHeight + 80,
              borderRadius: barRadius,
              background:
                "radial-gradient(circle, rgba(0, 210, 255, 0.3) 0%, rgba(0, 85, 255, 0.12) 50%, transparent 80%)",
              filter: "blur(28px)",
              opacity: iconOpacity,
              pointerEvents: "none",
            }}
          />

          {/* Caixa / Pílula */}
          <div
            style={{
              width: barWidth,
              height: barHeight,
              borderRadius: barRadius,
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
            {/* Texto URL */}
            {urlOpacity > 0 && (
              <div
                style={{
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "0 40px",
                  width: "100%",
                  opacity: urlOpacity,
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
                    fontFamily: monoFont,
                    fontSize: 38,
                    fontWeight: 700,
                    color: "#FFFFFF",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {currentUrl}
                  <span style={{ color: "#00D2FF", marginLeft: 4 }}>|</span>
                </span>
              </div>
            )}

            {/* Logo Oficial VALLOR em Vetor */}
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
                <svg width="72" height="72" viewBox="0 0 100 100" fill="none">
                  <defs>
                    <linearGradient id="act1LogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00D2FF" />
                      <stop offset="50%" stopColor="#0055FF" />
                      <stop offset="100%" stopColor="#FFFFFF" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    stroke="url(#act1LogoGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="165 45"
                    transform="rotate(-45 50 50)"
                  />
                  <circle cx="50" cy="50" r="10" fill="#00D2FF" />
                </svg>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

