import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { DynamicSplineGraph } from "../components/DynamicSplineGraph";
import { monoFont, interFont, displayFont } from "../typography/fonts";

export const Scene3ExecutiveDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. ENTRADA MATCH CUT (Surge de dentro do push-in da Cena 2: 0.85 -> 1.0)
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

  // 2. Progresso da Curva Spline com @remotion/paths (Frames 10 a 90)
  const splineProgress = interpolate(frame, [10, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3. 3 Toasts Flutuantes em Cascata (frames 30, 70, 110)
  const toast1Spring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 13, stiffness: 200 },
  });
  const toast2Spring = spring({
    frame: frame - 70,
    fps,
    config: { damping: 13, stiffness: 200 },
  });
  const toast3Spring = spring({
    frame: frame - 110,
    fps,
    config: { damping: 13, stiffness: 200 },
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

  const currentScale = entryScale * exitPushIn;
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
        perspective: 1000,
        transform: `scale(${currentScale})`,
        filter: currentBlur > 0.5 ? `blur(${currentBlur}px)` : "none",
        padding: "0 30px",
      }}
    >
      {/* Card Executivo 3D - Largura 960px (~90% da tela) com perspective(1000px) rotateX(6deg) scale(1.08) */}
      <div
        style={{
          width: 960,
          borderRadius: 38,
          backgroundColor: "rgba(11, 18, 36, 0.95)",
          backdropFilter: "blur(30px)",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          boxShadow:
            "0 40px 100px rgba(0, 0, 0, 0.9), 0 0 120px rgba(0, 85, 255, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
          padding: "46px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          transform: "rotateX(6deg) scale(1.08)",
          transformOrigin: "center center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow Superior de Estúdio */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: "50%",
            transform: "translateX(-50%)",
            width: 750,
            height: 240,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0, 210, 255, 0.3) 0%, transparent 70%)",
            filter: "blur(70px)",
            pointerEvents: "none",
          }}
        />

        {/* Cabeçalho do Card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* Ícone VALLOR Mini com Glow */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: "rgba(0, 85, 255, 0.22)",
                border: "1px solid rgba(0, 210, 255, 0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: "3.5px solid #00D2FF",
                  borderTopColor: "transparent",
                  transform: "rotate(45deg)",
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: displayFont,
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  letterSpacing: "-0.01em",
                }}
              >
                Pipeline Preditivo Omnichannel
              </div>
              <div
                style={{
                  fontFamily: interFont,
                  fontSize: 16,
                  fontWeight: 500,
                  color: "#94A3B8",
                  marginTop: 2,
                }}
              >
                Monitoramento contínuo de conversões e fechamento
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 20px",
              borderRadius: 999,
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
            }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                backgroundColor: "#10B981",
                boxShadow: "0 0 12px #10B981",
              }}
            />
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 15,
                fontWeight: 700,
                color: "#10B981",
              }}
            >
              AO VIVO
            </span>
          </div>
        </div>

        {/* Gráfico Linear com @remotion/paths DynamicSplineGraph */}
        <div style={{ position: "relative", width: "100%", zIndex: 2 }}>
          <DynamicSplineGraph progress={splineProgress} width={864} height={220} />
        </div>

        {/* 3 Toasts Flutuantes em Cascata (Ocupando Largura Total de 960px) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            zIndex: 2,
          }}
        >
          {/* Toast 1: Lead Quente Identificado • WhatsApp */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 28px",
              borderRadius: 22,
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 16px 36px rgba(0,0,0,0.65)",
              transform: `translateY(${interpolate(toast1Spring, [0, 1], [35, 0])}px)`,
              opacity: toast1Spring,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0, 210, 255, 0.22)",
                  border: "2px solid #00D2FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 17,
                  color: "#FFFFFF",
                }}
              >
                MS
              </div>
              <div>
                <div
                  style={{
                    fontFamily: interFont,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#FFFFFF",
                  }}
                >
                  Lead Quente Identificado • WhatsApp
                </div>
                <div
                  style={{
                    fontFamily: interFont,
                    fontSize: 15,
                    color: "#94A3B8",
                  }}
                >
                  Dr. Marcos Silveira • Conversão em andamento
                </div>
              </div>
            </div>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 15,
                padding: "8px 16px",
                borderRadius: 999,
                backgroundColor: "rgba(0, 210, 255, 0.16)",
                border: "1px solid rgba(0, 210, 255, 0.4)",
                color: "#00D2FF",
                fontWeight: 700,
              }}
            >
              LEAD QUENTE
            </span>
          </div>

          {/* Toast 2: Score de Intenção de Compra: 95% 🔥 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 28px",
              borderRadius: 22,
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 16px 36px rgba(0,0,0,0.65)",
              transform: `translateY(${interpolate(toast2Spring, [0, 1], [35, 0])}px)`,
              opacity: toast2Spring,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: "rgba(16, 185, 129, 0.22)",
                  border: "2px solid #10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  color: "#10B981",
                }}
              >
                🔥
              </div>
              <div>
                <div
                  style={{
                    fontFamily: interFont,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#FFFFFF",
                  }}
                >
                  Score de Intenção de Compra: 95% 🔥
                </div>
                <div
                  style={{
                    fontFamily: interFont,
                    fontSize: 15,
                    color: "#94A3B8",
                  }}
                >
                  Pronto para fechamento imediato
                </div>
              </div>
            </div>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 15,
                padding: "8px 16px",
                borderRadius: 999,
                backgroundColor: "rgba(16, 185, 129, 0.16)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                color: "#10B981",
                fontWeight: 700,
              }}
            >
              FECHAMENTO ALTO
            </span>
          </div>

          {/* Toast 3: Oportunidade Criada: R$ 48.500,00 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 28px",
              borderRadius: 22,
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 16px 36px rgba(0,0,0,0.65)",
              transform: `translateY(${interpolate(toast3Spring, [0, 1], [35, 0])}px)`,
              opacity: toast3Spring,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0, 85, 255, 0.25)",
                  border: "2px solid #0055FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  color: "#0055FF",
                }}
              >
                💎
              </div>
              <div>
                <div
                  style={{
                    fontFamily: interFont,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#FFFFFF",
                  }}
                >
                  Oportunidade Criada: R$ 48.500,00
                </div>
                <div
                  style={{
                    fontFamily: interFont,
                    fontSize: 15,
                    color: "#94A3B8",
                  }}
                >
                  Negócio registrado automaticamente no CRM
                </div>
              </div>
            </div>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 19,
                fontWeight: 700,
                color: "#38BDF8",
                letterSpacing: "-0.01em",
              }}
            >
              R$ 48.500,00
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
