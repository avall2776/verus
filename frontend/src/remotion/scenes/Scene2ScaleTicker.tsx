import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { OrbitalSphere3D } from "../components/OrbitalSphere3D";
import { monoFont, interFont, displayFont } from "../typography/fonts";

export const Scene2ScaleTicker: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. ENTRADA MATCH CUT (Surge de dentro do push-in da Cena 1: 0.84 -> 1.0 com overshoot)
  const entrySpring = spring({
    frame,
    fps,
    config: {
      damping: 14,
      stiffness: 240,
      mass: 0.6,
    },
  });

  const entryScale = interpolate(entrySpring, [0, 1], [0.84, 1]);
  const entryBlur = interpolate(frame, [0, 8], [6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 2. Contador Dinâmico em Tempo Real (0 -> 48.210)
  const counterValue = Math.floor(
    interpolate(frame, [8, 140], [0, 48210], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const formattedCount = counterValue.toLocaleString("pt-BR");

  // 3. Entrada em Cascata dos Badges de Telemetria (920px)
  const badgeSpring1 = spring({
    frame: frame - 40,
    fps,
    config: { damping: 14, stiffness: 200 },
  });
  const badgeSpring2 = spring({
    frame: frame - 60,
    fps,
    config: { damping: 14, stiffness: 200 },
  });
  const badgeSpring3 = spring({
    frame: frame - 80,
    fps,
    config: { damping: 14, stiffness: 200 },
  });

  // 4. SAÍDA MATCH CUT CONTÍNUO (Frames 234 a 250 - Push-in 1.0 -> 1.35)
  const exitPushIn = interpolate(frame, [234, 250], [1, 1.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitBlur = interpolate(frame, [236, 250], [0, 10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // AMPLIAÇÃO RADICAL DE ESCALA: 1.45x aplicado na composição do bloco
  const baseScale = entryScale * exitPushIn;
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
        transform: `scale(${baseScale})`,
        filter: currentBlur > 0.5 ? `blur(${currentBlur}px)` : "none",
        padding: "0 40px",
      }}
    >
      {/* 1. Esfera 3D Vetorial com Three.js Ampliada (880px) */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1,
          opacity: 0.95,
        }}
      >
        <OrbitalSphere3D size={880} />
      </div>

      {/* 2. Bloco Central com Escala Ampliada em 1.45x e Ocupação Real de 920px */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          width: 920,
          gap: 26,
          marginTop: -20,
        }}
      >
        {/* Top Header Tag */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 34px",
            borderRadius: 999,
            backgroundColor: "rgba(11, 18, 36, 0.92)",
            backdropFilter: "blur(22px)",
            border: "1px solid rgba(0, 210, 255, 0.45)",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.65)",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: "#10B981",
              boxShadow: "0 0 16px #10B981",
            }}
          />
          <span
            style={{
              fontFamily: interFont,
              fontSize: 21,
              fontWeight: 800,
              color: "#E2E8F0",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            RADAR DE INTELIGÊNCIA EM TEMPO REAL
          </span>
        </div>

        {/* Ticker Imponente (text-9xl equivalente: 172px) com JetBrains Mono Bold e tabular-nums */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <div
            style={{
              fontFamily: monoFont,
              fontVariantNumeric: "tabular-nums",
              fontSize: 172,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
              textShadow:
                "0 0 100px rgba(0, 150, 255, 0.8), 0 30px 60px rgba(0, 0, 0, 0.9)",
            }}
          >
            {formattedCount}
          </div>

          <div
            style={{
              fontFamily: displayFont,
              fontSize: 32,
              fontWeight: 800,
              color: "#00D2FF",
              letterSpacing: "0.2em",
              marginTop: 18,
              textTransform: "uppercase",
              textShadow: "0 0 28px rgba(0, 210, 255, 0.65)",
            }}
          >
            LEADS QUALIFICADOS
          </div>
        </div>

        {/* 3 Blocos Inferiores de Telemetria com Largura Total de 920px */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginTop: 42,
            width: "100%",
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "22px 34px",
              borderRadius: 24,
              backgroundColor: "rgba(11, 18, 36, 0.9)",
              backdropFilter: "blur(26px)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              boxShadow: "0 20px 45px rgba(0,0,0,0.65)",
              transform: `translateY(${interpolate(badgeSpring1, [0, 1], [35, 0])}px)`,
              opacity: badgeSpring1,
            }}
          >
            <span
              style={{
                fontFamily: interFont,
                fontSize: 23,
                color: "#94A3B8",
                fontWeight: 600,
              }}
            >
              Taxa de Resposta Ativa
            </span>
            <span
              style={{
                fontFamily: monoFont,
                fontVariantNumeric: "tabular-nums",
                fontSize: 27,
                color: "#10B981",
                fontWeight: 700,
              }}
            >
              98.4% ↑
            </span>
          </div>

          {/* Card 2 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "22px 34px",
              borderRadius: 24,
              backgroundColor: "rgba(11, 18, 36, 0.9)",
              backdropFilter: "blur(26px)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              boxShadow: "0 20px 45px rgba(0,0,0,0.65)",
              transform: `translateY(${interpolate(badgeSpring2, [0, 1], [35, 0])}px)`,
              opacity: badgeSpring2,
            }}
          >
            <span
              style={{
                fontFamily: interFont,
                fontSize: 23,
                color: "#94A3B8",
                fontWeight: 600,
              }}
            >
              Tempo Médio de Atendimento
            </span>
            <span
              style={{
                fontFamily: monoFont,
                fontVariantNumeric: "tabular-nums",
                fontSize: 27,
                color: "#00D2FF",
                fontWeight: 700,
              }}
            >
              12 seg
            </span>
          </div>

          {/* Card 3 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "22px 34px",
              borderRadius: 24,
              backgroundColor: "rgba(11, 18, 36, 0.9)",
              backdropFilter: "blur(26px)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              boxShadow: "0 20px 45px rgba(0,0,0,0.65)",
              transform: `translateY(${interpolate(badgeSpring3, [0, 1], [35, 0])}px)`,
              opacity: badgeSpring3,
            }}
          >
            <span
              style={{
                fontFamily: interFont,
                fontSize: 23,
                color: "#94A3B8",
                fontWeight: 600,
              }}
            >
              Aumento em Faturamento
            </span>
            <span
              style={{
                fontFamily: monoFont,
                fontVariantNumeric: "tabular-nums",
                fontSize: 27,
                color: "#38BDF8",
                fontWeight: 700,
              }}
            >
              +42.8%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
