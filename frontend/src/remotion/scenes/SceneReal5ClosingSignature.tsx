import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { displayFont, monoFont } from "../typography/fonts";
import { VallorAnimatedLogo } from "../components/VallorAnimatedLogo";

export const SceneReal5ClosingSignature: React.FC = () => {
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

  // 2. TIPOGRAFIA CINÉTICA MONUMENTAL FLUTUANTE (SEM MOLDURAS/CAIXAS)
  // Frase 1: "TRANSFORME STATUS PASSIVO" (0 a 100)
  // Frase 2: "EM RECEITA ATIVA." (100 a 200)
  const isPhrase2 = frame >= 100;
  const phraseSpring = spring({
    frame: frame - 100,
    fps,
    config: { damping: 12, stiffness: 240, mass: 0.5 },
  });

  // 3. REVELAÇÃO DA ASSINATURA TRIUNFAL VALLOR (Frames 200 em diante)
  const isSignature = frame >= 195;
  const signatureSpring = spring({
    frame: frame - 200,
    fps,
    config: { damping: 14, stiffness: 200, mass: 0.7 },
  });
  const signatureScale = interpolate(signatureSpring, [0, 1], [0.85, 1]);
  const signatureOpacity = interpolate(signatureSpring, [0, 0.4], [0, 1]);

  // Rotação contínua do anel orbital em 60 FPS
  const ringRotation = (frame - 200) * 2.2;

  // Feixe Laser Horizontal cruzando a logo oficial
  const laserX = interpolate(frame - 200, [30, 160], [-140, 240], {
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
        transform: `scale(${entryScale})`,
        filter: entryBlur > 0.5 ? `blur(${entryBlur}px)` : "none",
        padding: "0 40px",
      }}
    >
      {/* Luz Volumétrica Traseira em Azul Royal / Ciano */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          background:
            "radial-gradient(circle, rgba(0, 85, 255, 0.35) 0%, rgba(0, 210, 255, 0.12) 40%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* ----------------------------------------------------------------- */}
      {/* PARTE A: TIPOGRAFIA DISPLAY MONUMENTAL FLUTUANTE (SEM MOLDURAS)   */}
      {/* ----------------------------------------------------------------- */}
      {!isSignature && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 24,
            zIndex: 10,
          }}
        >
          {/* Telemetria Técnica Flutuante */}
          <div
            style={{
              fontFamily: monoFont,
              fontSize: 16,
              fontWeight: 700,
              color: "#00D2FF",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              textShadow: "0 0 20px rgba(0, 210, 255, 0.5)",
            }}
          >
            • RESULTADO & EFICIÊNCIA COMERCIAL •
          </div>

          {!isPhrase2 ? (
            <h1
              style={{
                fontFamily: displayFont,
                fontSize: 84,
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: "-0.04em",
                lineHeight: 1.08,
                margin: 0,
                maxWidth: 960,
                textShadow: "0 20px 50px rgba(0, 0, 0, 0.95), 0 0 40px rgba(0, 85, 255, 0.4)",
              }}
            >
              TRANSFORME STATUS PASSIVO
            </h1>
          ) : (
            <h1
              style={{
                fontFamily: displayFont,
                fontSize: 90,
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: "-0.04em",
                lineHeight: 1.08,
                margin: 0,
                maxWidth: 960,
                transform: `scale(${interpolate(phraseSpring, [0, 1], [0.92, 1])})`,
                textShadow: "0 20px 50px rgba(0, 0, 0, 0.95)",
              }}
            >
              EM{" "}
              <span
                style={{
                  color: "#00D2FF",
                  textShadow:
                    "0 0 40px rgba(0, 210, 255, 0.9), 0 0 80px rgba(0, 85, 255, 0.6)",
                }}
              >
                RECEITA ATIVA.
              </span>
            </h1>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* PARTE B: ASSINATURA OFICIAL VETORIAL VALLOR COM BACKLIGHT ROYAL   */}
      {/* ----------------------------------------------------------------- */}
      {isSignature && (
        <div
          style={{
            opacity: signatureOpacity,
            transform: `scale(${signatureScale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 36,
            textAlign: "center",
            zIndex: 10,
          }}
        >
          {/* Backlight Azul Royal (#0055FF) e Logo Vetorial Oficial VALLOR */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Logo Oficial VALLOR com o Próprio 'O' Girando a 60 FPS */}
            <div
              style={{
                position: "relative",
                width: 860,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                padding: "20px 0",
              }}
            >
              {/* Feixe Laser Cruzando a Logo */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(0, 210, 255, 0.75) 50%, transparent 100%)",
                  transform: `translateX(${laserX}%) skewX(-25deg)`,
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />

              <VallorAnimatedLogo ringRotation={ringRotation} width={860} />
            </div>
          </div>

          {/* Subtítulo Institucional Oficial */}
          <div
            style={{
              fontFamily: monoFont,
              fontSize: 22,
              fontWeight: 700,
              color: "#00D2FF",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              textShadow: "0 0 20px rgba(0, 210, 255, 0.4)",
            }}
          >
            Inteligência Comercial & Reconversão de Vendas
          </div>

          {/* Botão CTA Oficial de Autoridade */}
          <div
            style={{
              marginTop: 10,
              padding: "24px 56px",
              borderRadius: 32,
              background: "linear-gradient(135deg, #0055FF 0%, #00D2FF 100%)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow:
                "0 20px 50px rgba(0, 85, 255, 0.6), 0 0 60px rgba(0, 210, 255, 0.45)",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span
              style={{
                fontFamily: displayFont,
                fontSize: 28,
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: "-0.01em",
              }}
            >
              Solicite Demonstração
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
