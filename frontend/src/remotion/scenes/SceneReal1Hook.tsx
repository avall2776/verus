import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, Img, staticFile } from "remotion";
import { Search } from "lucide-react";
import { displayFont, monoFont, interFont } from "../typography/fonts";

export const SceneReal1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. BLACKOUT ABSOLUTO (Frames 0 a 30)
  const isBlackout = frame < 30;

  // 2. FÍSICA CINÉTICA 3D - TEXTO 1: "SEUS CLIENTES OLHAM SEUS STATUS." (Frames 30 a 170)
  const isText1 = frame >= 30 && frame < 170;
  const text1Spring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 14, stiffness: 200, mass: 0.7 },
  });
  const text1Y = interpolate(text1Spring, [0, 1], [140, 0]);
  const text1Blur = interpolate(frame - 30, [0, 12, 125, 140], [12, 0, 0, 8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const text1Opacity = interpolate(frame, [30, 42, 155, 170], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3. FÍSICA CINÉTICA 3D - TEXTO 2: "E VOCÊ NÃO SABIA QUEM." (Frames 170 a 290)
  const isText2 = frame >= 170 && frame < 290;
  const text2Spring = spring({
    frame: frame - 170,
    fps,
    config: { damping: 13, stiffness: 220, mass: 0.65 },
  });
  const text2Y = interpolate(text2Spring, [0, 1], [140, 0]);
  const text2Blur = interpolate(frame - 170, [0, 12, 105, 120], [12, 0, 0, 8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const text2Opacity = interpolate(frame, [170, 182, 275, 290], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 4. BARRA DE BUSCA EXPANDIDA COM LEITURA CONFORTÁVEL (> 120 FRAMES)
  // Frames 290 a 480 (Digitação suave de 300 a 390, leitura estendida até 430)
  const isSearchPhase = frame >= 290;
  const searchSpring = spring({
    frame: frame - 290,
    fps,
    config: { damping: 15, stiffness: 180, mass: 0.8 },
  });
  const searchBarY = interpolate(searchSpring, [0, 1], [60, 0]);
  const searchBarOpacity = interpolate(searchSpring, [0, 0.4], [0, 1]);

  const targetUrl = "https://www.avallmarketing.com.br/vallor/crm/radar-stories";
  const urlLen = Math.floor(
    interpolate(frame, [300, 390], [0, targetUrl.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const currentUrl = targetUrl.slice(0, urlLen);
  const isTyping = frame >= 300 && frame < 390;
  const cursorBlink = isTyping ? (Math.floor(frame / 10) % 2 === 0 ? "|" : "") : "";

  // Colapso elástico da barra na logo VALLOR oficial (Frames 430 a 470)
  const collapseSpring = spring({
    frame: frame - 430,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.6 },
  });
  const barWidth = interpolate(collapseSpring, [0, 1], [980, 120]);
  const barHeight = interpolate(collapseSpring, [0, 1], [96, 120]);
  const barRadius = interpolate(collapseSpring, [0, 1], [24, 60]);
  const contentOpacity = interpolate(collapseSpring, [0, 0.25], [1, 0]);
  const logoOpacity = interpolate(collapseSpring, [0.35, 1], [0, 1]);
  const logoScale = interpolate(collapseSpring, [0.2, 1], [0.4, 1]);
  const ringRotation = (frame - 430) * 4;

  // 5. MATCH CUT PUSH-IN FINAL (Frames 460 a 480)
  const pushInScale = interpolate(frame, [460, 480], [1, 1.36], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const motionBlur = interpolate(frame, [464, 480], [0, 10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (isBlackout) {
    return <div style={{ position: "absolute", inset: 0, backgroundColor: "#030611" }} />;
  }

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
      {/* FASE 1: TEXTO 1 COM ROTAÇÃO 3D E BLUR DE VELOCIDADE               */}
      {/* ----------------------------------------------------------------- */}
      {isText1 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            opacity: text1Opacity,
            gap: 20,
            transform: "perspective(1000px) rotateX(10deg) rotateY(-6deg)",
            filter: text1Blur > 0.5 ? `blur(${text1Blur}px)` : "none",
          }}
        >
          {/* Badge de Telemetria Técnica */}
          <div
            style={{
              padding: "10px 24px",
              borderRadius: 30,
              backgroundColor: "rgba(0, 210, 255, 0.08)",
              border: "1px solid rgba(0, 210, 255, 0.3)",
              fontFamily: monoFont,
              fontSize: 14,
              fontWeight: 700,
              color: "#00D2FF",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            • PONTO CEGO COMERCIAL NO AGRO •
          </div>

          <div
            style={{
              overflow: "hidden",
              padding: "10px 0",
            }}
          >
            <h1
              style={{
                fontFamily: displayFont,
                fontSize: 80,
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: "-0.04em",
                lineHeight: 1.08,
                transform: `translateY(${text1Y}px)`,
                margin: 0,
                maxWidth: 960,
                textShadow: "0 20px 40px rgba(0, 0, 0, 0.9)",
              }}
            >
              SEUS CLIENTES OLHAM SEUS STATUS.
            </h1>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* FASE 2: TEXTO 2 COM ROTAÇÃO 3D                                    */}
      {/* ----------------------------------------------------------------- */}
      {isText2 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            opacity: text2Opacity,
            gap: 20,
            transform: "perspective(1000px) rotateX(10deg) rotateY(-6deg)",
            filter: text2Blur > 0.5 ? `blur(${text2Blur}px)` : "none",
          }}
        >
          <div
            style={{
              padding: "10px 24px",
              borderRadius: 30,
              backgroundColor: "rgba(0, 85, 255, 0.12)",
              border: "1px solid rgba(0, 210, 255, 0.4)",
              fontFamily: monoFont,
              fontSize: 14,
              fontWeight: 700,
              color: "#00D2FF",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            • INTELIGÊNCIA EM TEMPO REAL •
          </div>

          <div
            style={{
              overflow: "hidden",
              padding: "10px 0",
            }}
          >
            <h1
              style={{
                fontFamily: displayFont,
                fontSize: 82,
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: "-0.04em",
                lineHeight: 1.08,
                transform: `translateY(${text2Y}px)`,
                margin: 0,
                maxWidth: 960,
                textShadow: "0 20px 40px rgba(0, 0, 0, 0.9)",
              }}
            >
              E VOCÊ NÃO{" "}
              <span
                style={{
                  color: "#00D2FF",
                  textShadow: "0 0 30px rgba(0, 210, 255, 0.6)",
                }}
              >
                SABIA QUEM.
              </span>
            </h1>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* FASE 3: BARRA DE BUSCA TÉCNICA E COLAPSO NA LOGO OFICIAL          */}
      {/* ----------------------------------------------------------------- */}
      {isSearchPhase && (
        <div
          style={{
            opacity: searchBarOpacity,
            transform: `translateY(${searchBarY}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
          }}
        >
          <div
            style={{
              width: barWidth,
              height: barHeight,
              borderRadius: barRadius,
              backgroundColor: "#0B1224",
              border: "1px solid rgba(0, 210, 255, 0.35)",
              boxShadow:
                "0 30px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(0, 85, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Conteúdo da Barra de URL */}
            <div
              style={{
                opacity: contentOpacity,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "0 36px",
                position: "absolute",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Search size={22} color="#00D2FF" strokeWidth={1.5} style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#FFFFFF",
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentUrl}
                  <span style={{ color: "#00D2FF", fontWeight: 900 }}>
                    {cursorBlink}
                  </span>
                </span>
              </div>

              <div
                style={{
                  flexShrink: 0,
                  padding: "8px 16px",
                  borderRadius: 12,
                  backgroundColor: "rgba(0, 210, 255, 0.12)",
                  border: "1px solid rgba(0, 210, 255, 0.35)",
                  fontFamily: monoFont,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#00D2FF",
                  letterSpacing: "0.05em",
                  whiteSpace: "nowrap",
                }}
              >
                RADAR ATIVO
              </div>
            </div>

            {/* Logo Oficial Real VALLOR revelada no colapso (Zero V Genérico!) */}
            <div
              style={{
                opacity: logoOpacity,
                transform: `scale(${logoScale})`,
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 80,
                  height: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Anel Orbital em Rotação Contínua */}
                <div
                  style={{
                    position: "absolute",
                    inset: -4,
                    transform: `rotate(${ringRotation}deg)`,
                  }}
                >
                  <Img
                    src={staticFile("Favicon_vallor.svg")}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
