import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Radio, ShieldCheck, Eye, Users, TrendingUp, Activity, Clock, Film } from "lucide-react";
import { displayFont, monoFont, interFont } from "../typography/fonts";

export const SceneReal2KpisAndShowcase: React.FC = () => {
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

  // 2. CONTADORES ANIMADOS DOS 4 KPIS (Frames 20 a 160)
  const countProgress = interpolate(frame, [20, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const kpi1 = Math.floor(countProgress * 41);
  const kpi2 = Math.floor(countProgress * 6666);
  const kpi3 = Math.floor(countProgress * 46);
  const kpi4 = Math.floor(countProgress * 296);

  // 3. APARIÇÃO DA VITRINE DE STORIES (Frames 140+)
  const showcaseSpring = spring({
    frame: frame - 140,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.7 },
  });
  const showcaseY = interpolate(showcaseSpring, [0, 1], [40, 0]);
  const showcaseOpacity = interpolate(showcaseSpring, [0, 0.4], [0, 1]);

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
      {/* Container Principal da Interface Real (Largura 960px) */}
      <div
        style={{
          width: 960,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* ======================================================================= */}
        {/* 1. CABEÇALHO DO RADAR                                                   */}
        {/* ======================================================================= */}
        <div
          style={{
            borderRadius: 28,
            backgroundColor: "#0B1224",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "24px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow:
              "0 20px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(0, 85, 255, 0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                backgroundColor: "rgba(0, 210, 255, 0.12)",
                border: "1.5px solid rgba(0, 210, 255, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00D2FF",
              }}
            >
              <Radio size={28} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span
                  style={{
                    fontFamily: displayFont,
                    fontSize: 28,
                    fontWeight: 900,
                    color: "#FFFFFF",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Radar de Stories & Status
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 14px",
                    borderRadius: 20,
                    backgroundColor: "rgba(0, 210, 255, 0.12)",
                    border: "1px solid rgba(0, 210, 255, 0.35)",
                    color: "#00D2FF",
                    fontFamily: interFont,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>WhatsApp Conectado</span>
                </div>
              </div>

              <span
                style={{
                  fontFamily: interFont,
                  fontSize: 14,
                  color: "#94A3B8",
                }}
              >
                Rastreamento e inteligência sobre visualizadores silenciosos no Agro.
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "8px 18px",
              borderRadius: 14,
              backgroundColor: "rgba(0, 85, 255, 0.15)",
              border: "1px solid rgba(0, 210, 255, 0.3)",
              fontFamily: monoFont,
              fontSize: 13,
              fontWeight: 700,
              color: "#00D2FF",
              letterSpacing: "0.05em",
            }}
          >
            AUDITÁVEL 100%
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 2. OS 4 CARDS DE KPIS EXECUTIVOS (PALETA PURA VALLOR)                   */}
        {/* ======================================================================= */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {/* Card 1: Visualizadores Únicos Hoje */}
          <div
            style={{
              borderRadius: 24,
              backgroundColor: "#0B1224",
              border: "1px solid rgba(0, 210, 255, 0.25)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
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
                  fontFamily: monoFont,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#94A3B8",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Visualizadores Únicos (Hoje)
              </span>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: "rgba(0, 210, 255, 0.12)",
                  border: "1px solid rgba(0, 210, 255, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#00D2FF",
                }}
              >
                <Eye size={20} />
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: monoFont,
                  fontSize: 48,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {kpi1}
              </div>
              <div
                style={{
                  fontFamily: interFont,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#00D2FF",
                  marginTop: 6,
                }}
              >
                46 visualizadores únicos no ciclo
              </div>
            </div>
          </div>

          {/* Card 2: Base de Contatos na Linha */}
          <div
            style={{
              borderRadius: 24,
              backgroundColor: "#0B1224",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
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
                  fontFamily: monoFont,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#94A3B8",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Base de Contatos na Linha
              </span>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: "rgba(0, 85, 255, 0.15)",
                  border: "1px solid rgba(0, 85, 255, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#00D2FF",
                }}
              >
                <Users size={20} />
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: monoFont,
                  fontSize: 48,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {kpi2.toLocaleString("pt-BR")}
              </div>
              <div
                style={{
                  fontFamily: interFont,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#94A3B8",
                  marginTop: 6,
                }}
              >
                Contatos reais com WhatsApp no ecossistema
              </div>
            </div>
          </div>

          {/* Card 3: Interações de Status */}
          <div
            style={{
              borderRadius: 24,
              backgroundColor: "#0B1224",
              border: "1px solid rgba(0, 210, 255, 0.25)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
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
                  fontFamily: monoFont,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#94A3B8",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Interações de Status
              </span>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: "rgba(0, 210, 255, 0.12)",
                  border: "1px solid rgba(0, 210, 255, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#00D2FF",
                }}
              >
                <TrendingUp size={20} />
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: monoFont,
                  fontSize: 48,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {kpi3}
              </div>
              <div
                style={{
                  fontFamily: interFont,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#00D2FF",
                  marginTop: 6,
                }}
              >
                Clientes que visualizaram status nesta semana
              </div>
            </div>
          </div>

          {/* Card 4: Oportunidades no CRM */}
          <div
            style={{
              borderRadius: 24,
              backgroundColor: "#0B1224",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
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
                  fontFamily: monoFont,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#94A3B8",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Oportunidades no CRM
              </span>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: "rgba(0, 85, 255, 0.15)",
                  border: "1px solid rgba(0, 85, 255, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#00D2FF",
                }}
              >
                <Activity size={20} />
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: monoFont,
                  fontSize: 48,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {kpi4}
              </div>
              <div
                style={{
                  fontFamily: interFont,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#94A3B8",
                  marginTop: 6,
                }}
              >
                Negócios ativos em negociação na carteira
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 3. VITRINE DE STORIES ATIVOS (ÚLTIMAS 24H)                              */}
        {/* ======================================================================= */}
        <div
          style={{
            opacity: showcaseOpacity,
            transform: `translateY(${showcaseY}px)`,
            borderRadius: 28,
            backgroundColor: "#0B1224",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.85)",
          }}
        >
          {/* Header da Vitrine */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: "rgba(0, 210, 255, 0.12)",
                  border: "1px solid rgba(0, 210, 255, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#00D2FF",
                }}
              >
                <Radio size={18} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: displayFont,
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#FFFFFF",
                    }}
                  >
                    Vitrine de Stories Ativos (Últimas 24h)
                  </span>
                  <span
                    style={{
                      padding: "2px 10px",
                      borderRadius: 12,
                      backgroundColor: "rgba(0, 210, 255, 0.12)",
                      border: "1px solid rgba(0, 210, 255, 0.3)",
                      fontFamily: monoFont,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#00D2FF",
                    }}
                  >
                    1 no ar
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: interFont,
                    fontSize: 12,
                    color: "#94A3B8",
                  }}
                >
                  Status publicados no WhatsApp corporativo com contagem auditável de visualizadores silenciosos.
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "6px 14px",
                borderRadius: 12,
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                fontFamily: interFont,
                fontSize: 12,
                fontWeight: 600,
                color: "#E2E8F0",
              }}
            >
              No Ar (24h)
            </div>
          </div>

          {/* Card do Story Ativo */}
          <div
            style={{
              borderRadius: 20,
              backgroundColor: "#070D1B",
              border: "1px solid rgba(0, 210, 255, 0.25)",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            {/* Thumbnail Story 9:16 */}
            <div
              style={{
                width: 72,
                height: 112,
                borderRadius: 14,
                backgroundColor: "#02040A",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(180deg, #0055FF 0%, #070D1B 100%)",
                flexShrink: 0,
              }}
            >
              {/* Barra de progresso WhatsApp no topo */}
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  right: 6,
                  height: 2,
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  borderRadius: 2,
                }}
              />
              <span style={{ fontSize: 24 }}>🚜</span>
            </div>

            {/* Informações Reais do Story */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 8,
                    backgroundColor: "rgba(0, 85, 255, 0.2)",
                    border: "1px solid rgba(0, 210, 255, 0.35)",
                    fontFamily: monoFont,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#00D2FF",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Film size={12} />
                  <span>Maquinários</span>
                </span>
                <span
                  style={{
                    fontFamily: interFont,
                    fontSize: 12,
                    color: "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Clock size={12} />
                  <span>há 2 horas</span>
                </span>
              </div>

              <div
                style={{
                  fontFamily: displayFont,
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                Linha Versátil Instalada em Cliente • Plantadeira Taxa Variável
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 2,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: monoFont,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#00D2FF",
                  }}
                >
                  <Eye size={16} color="#00D2FF" />
                  <span>41 hoje</span>
                  <span style={{ color: "#64748B" }}>•</span>
                  <span style={{ color: "#94A3B8" }}>41 total</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
