import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { displayFont, monoFont, interFont } from "../typography/fonts";

export const Act2TrackingStoryRing: React.FC = () => {
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

  // 2. STORY RING PULSANTE (Acende no frame 50 / Master 590)
  const ringActive = frame >= 50;
  const ringSpring = spring({
    frame: frame - 50,
    fps,
    config: { damping: 12, stiffness: 220, mass: 0.6 },
  });
  const ringPulse = ringActive ? Math.sin((frame - 50) * 0.16) * 0.08 + 1 : 1;
  const ringRotation = frame * 1.8;

  // 3. EXPANSÃO DA GAVETA LATERAL 360° DO CLIENTE (Frame 160 em diante)
  const drawerSpring = spring({
    frame: frame - 160,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.8 },
  });
  const drawerY = interpolate(drawerSpring, [0, 1], [40, 0]);
  const drawerOpacity = interpolate(drawerSpring, [0, 0.4], [0, 1]);

  // Gauge Circular de Score de Intenção (0 a 95%)
  const scoreValue = Math.floor(
    interpolate(frame, [220, 360], [0, 95], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  // Perímetro do círculo: 2 * PI * r = 2 * PI * 40 = 251.2
  const circleCircumference = 251.2;
  const circleOffset = circleCircumference - (circleCircumference * scoreValue) / 100;

  // 4. MATCH CUT PUSH-IN FINAL (Frames 760 a 780)
  const pushInScale = interpolate(frame, [760, 780], [1, 1.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitBlur = interpolate(frame, [764, 780], [0, 10], {
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
      {/* Mockup do WhatsApp Inbox Corporativo VALLOR (Largura 960px) */}
      <div
        style={{
          width: 960,
          borderRadius: 36,
          backgroundColor: "#0B1224",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow:
            "0 40px 100px rgba(0, 0, 0, 0.9), 0 0 100px rgba(0, 85, 255, 0.22)",
          padding: "36px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow Superior */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0, 210, 255, 0.25) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        {/* Topo do Inbox */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 2,
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: "rgba(37, 211, 102, 0.15)",
                border: "1px solid rgba(37, 211, 102, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#25D366",
                fontWeight: 900,
                fontSize: 22,
              }}
            >
              W
            </div>
            <div>
              <div
                style={{
                  fontFamily: displayFont,
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#FFFFFF",
                }}
              >
                VALLOR WhatsApp Inbox Corporativo
              </div>
              <div
                style={{
                  fontFamily: interFont,
                  fontSize: 14,
                  color: "#94A3B8",
                }}
              >
                Instância Oficial • Conexão Ativa em Nuvem
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 18px",
              borderRadius: 999,
              backgroundColor: "rgba(0, 210, 255, 0.12)",
              border: "1px solid rgba(0, 210, 255, 0.35)",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#00D2FF",
                boxShadow: "0 0 10px #00D2FF",
              }}
            />
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 14,
                fontWeight: 700,
                color: "#00D2FF",
              }}
            >
              RADAR DE STORIES: ATIVO
            </span>
          </div>
        </div>

        {/* Linha do Lead Principal: Carlos Eduardo • Fazenda Santa Fé com o STORY RING */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 28px",
            borderRadius: 24,
            backgroundColor: ringActive
              ? "rgba(0, 210, 255, 0.08)"
              : "rgba(15, 23, 42, 0.8)",
            border: ringActive
              ? "1.5px solid rgba(0, 210, 255, 0.45)"
              : "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: ringActive
              ? "0 10px 40px rgba(0, 210, 255, 0.25)"
              : "none",
            position: "relative",
            zIndex: 2,
            transition: "all 0.3s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {/* Avatar com o STORY RING PULSANTE */}
            <div
              style={{
                position: "relative",
                width: 84,
                height: 84,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* O Story Ring */}
              {ringActive && (
                <div
                  style={{
                    position: "absolute",
                    inset: -5,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #00D2FF 0%, #0055FF 50%, #25D366 100%)",
                    transform: `rotate(${ringRotation}deg) scale(${ringPulse})`,
                    boxShadow: "0 0 24px rgba(0, 210, 255, 0.85)",
                    opacity: ringSpring,
                  }}
                />
              )}

              {/* Avatar Central */}
              <div
                style={{
                  position: "relative",
                  width: 76,
                  height: 76,
                  borderRadius: "50%",
                  backgroundColor: "#1E293B",
                  border: "3px solid #0B1224",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: displayFont,
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  zIndex: 2,
                }}
              >
                CE
              </div>

              {/* Badge Ícone de Story no Canto */}
              {ringActive && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    backgroundColor: "#00D2FF",
                    border: "2px solid #0B1224",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    color: "#050814",
                    fontWeight: 900,
                    zIndex: 3,
                  }}
                >
                  ●
                </div>
              )}
            </div>

            <div>
              <div
                style={{
                  fontFamily: displayFont,
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#FFFFFF",
                }}
              >
                Carlos Eduardo
              </div>
              <div
                style={{
                  fontFamily: interFont,
                  fontSize: 17,
                  color: "#94A3B8",
                  marginTop: 2,
                }}
              >
                Fazenda Santa Fé • Sorriso/MT
              </div>
            </div>
          </div>

          {/* Badge Story Ring Ativo */}
          {ringActive && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: 15,
                  padding: "8px 16px",
                  borderRadius: 999,
                  backgroundColor: "rgba(0, 210, 255, 0.18)",
                  border: "1px solid rgba(0, 210, 255, 0.5)",
                  color: "#00D2FF",
                  fontWeight: 700,
                }}
              >
                NOVO STATUS ASSISTIDO
              </span>
              <span
                style={{
                  fontFamily: interFont,
                  fontSize: 13,
                  color: "#64748B",
                }}
              >
                Acabou de ver
              </span>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* GAVETA DE CONTEXTO 360° DO CLIENTE (Enriquecimento em Tempo Real) */}
        {/* ------------------------------------------------------------- */}
        {frame >= 160 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              opacity: drawerOpacity,
              transform: `translateY(${drawerY}px)`,
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Card 1: Tag de Story Visualizado */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 24px",
                borderRadius: 20,
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                border: "1px solid rgba(0, 210, 255, 0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: "rgba(0, 210, 255, 0.15)",
                    border: "1px solid rgba(0, 210, 255, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    color: "#00D2FF",
                  }}
                >
                  👁️
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: interFont,
                      fontSize: 17,
                      fontWeight: 700,
                      color: "#FFFFFF",
                    }}
                  >
                    Visualizou "Demonstração Semeadeira Verto"
                  </div>
                  <div
                    style={{
                      fontFamily: interFont,
                      fontSize: 14,
                      color: "#94A3B8",
                    }}
                  >
                    Assistiu há 14 minutos • Categoria: Maquinários
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: 14,
                  color: "#00D2FF",
                  fontWeight: 700,
                }}
              >
                14m atrás
              </span>
            </div>

            {/* Card 2: Tag de CRM Histórico */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 24px",
                borderRadius: 20,
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    border: "1px solid rgba(245, 158, 11, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    color: "#F59E0B",
                  }}
                >
                  📊
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: interFont,
                      fontSize: 17,
                      fontWeight: 700,
                      color: "#FFFFFF",
                    }}
                  >
                    Cliente Inativo há 84 dias
                  </div>
                  <div
                    style={{
                      fontFamily: interFont,
                      fontSize: 14,
                      color: "#94A3B8",
                    }}
                  >
                    Faturamento Histórico Acumulado: R$ 340.000,00
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: 14,
                  padding: "6px 14px",
                  borderRadius: 999,
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  color: "#F59E0B",
                  fontWeight: 700,
                }}
              >
                REAQUECIMENTO
              </span>
            </div>

            {/* Card 3: Gauge Circular de Score de Intenção (95/100) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 28px",
                borderRadius: 22,
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                border: "1.5px solid rgba(16, 185, 129, 0.45)",
                boxShadow: "0 10px 30px rgba(16, 185, 129, 0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                {/* SVG Gauge Circular Animado */}
                <div style={{ position: "relative", width: 68, height: 68 }}>
                  <svg width="68" height="68" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="10"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#10B981"
                      strokeWidth="10"
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={circleOffset}
                      strokeLinecap="round"
                      fill="none"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: monoFont,
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#FFFFFF",
                    }}
                  >
                    {scoreValue}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontFamily: displayFont,
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#FFFFFF",
                    }}
                  >
                    Score de Intenção: {scoreValue}/100
                  </div>
                  <div
                    style={{
                      fontFamily: interFont,
                      fontSize: 15,
                      color: "#6EE7B7",
                      fontWeight: 600,
                    }}
                  >
                    Lead Quente • Momento Ideal de Conversão 🔥
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: 15,
                  padding: "8px 18px",
                  borderRadius: 999,
                  backgroundColor: "#10B981",
                  color: "#050814",
                  fontWeight: 800,
                }}
              >
                ALTA PRIORIDADE
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

