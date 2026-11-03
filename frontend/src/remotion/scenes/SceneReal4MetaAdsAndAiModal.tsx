import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import {
  Users,
  ShieldCheck,
  Sparkles,
  Clock,
  Building2,
} from "lucide-react";
import { displayFont, monoFont, interFont } from "../typography/fonts";

export const SceneReal4MetaAdsAndAiModal: React.FC = () => {
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

  // 2. PULSO DE LUZ NO BOTÃO META ADS (SHA-256) (Frames 40 a 110)
  const isMetaPulsing = frame >= 40 && frame <= 120;

  // 3. CURSOR VETORIAL DE PRECISÃO & CLIQUE EM [ ✨ Abordar IA ] (Frame 140 / Master 1820)
  // Move-se de (x: 840, y: 860) para (x: 775, y: 475) entre frames 70 e 138
  const cursorMoveSpring = spring({
    frame: frame - 70,
    fps,
    config: { damping: 16, stiffness: 140, mass: 0.8 },
  });
  const cursorX = interpolate(cursorMoveSpring, [0, 1], [840, 775]);
  const cursorY = interpolate(cursorMoveSpring, [0, 1], [860, 475]);
  const cursorVisible = frame >= 60 && frame <= 340;

  // Efeito elástico do clique no frame 140
  const clickSpring = spring({
    frame: frame - 140,
    fps,
    config: { damping: 10, stiffness: 320, mass: 0.4 },
  });
  const buttonScale =
    frame < 140
      ? 1
      : interpolate(clickSpring, [0, 0.4, 1], [1, 0.92, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  // 4. EXPANSÃO DO POPOVER/DRAWER DA ABORDAGEM IA (Frames 150 em diante)
  const isModalOpen = frame >= 150;
  const modalSpring = spring({
    frame: frame - 150,
    fps,
    config: { damping: 14, stiffness: 200, mass: 0.7 },
  });
  const modalScale = interpolate(modalSpring, [0, 1], [0.85, 1]);
  const modalOpacity = interpolate(modalSpring, [0, 0.4], [0, 1]);

  // Mensagem gerada pela IA (Anonimizada / LGPD)
  const aiMessage =
    "Fala Carlos! Viemos acompanhando a safra na sua região e chegou a nova Linha Versátil com plantio em taxa variável. Como estão os preparativos para a próxima janela por aí?";
  const typedLen = Math.floor(
    interpolate(frame, [180, 360], [0, aiMessage.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const displayedMessage = aiMessage.slice(0, typedLen);

  // 5. TOAST DE CONFIRMAÇÃO DO CRM (Frame 260 em diante)
  const isToastVisible = frame >= 260;
  const toastSpring = spring({
    frame: frame - 260,
    fps,
    config: { damping: 13, stiffness: 220, mass: 0.6 },
  });
  const toastY = interpolate(toastSpring, [0, 1], [-80, 0]);
  const toastOpacity = interpolate(toastSpring, [0, 0.4], [0, 1]);

  // 6. MATCH CUT PUSH-IN FINAL (Frames 640 a 660)
  const pushInScale = interpolate(frame, [640, 660], [1, 1.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitBlur = interpolate(frame, [644, 660], [0, 10], {
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
      {/* Toast de Confirmação Superior (Paleta VALLOR Ciano/Azul) */}
      {isToastVisible && (
        <div
          style={{
            position: "absolute",
            top: 130,
            zIndex: 60,
            opacity: toastOpacity,
            transform: `translateY(${toastY}px)`,
            width: 900,
            borderRadius: 24,
            backgroundColor: "#0B1224",
            border: "1.5px solid #00D2FF",
            boxShadow:
              "0 20px 60px rgba(0, 0, 0, 0.85), 0 0 50px rgba(0, 210, 255, 0.35)",
            padding: "20px 28px",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 16,
              backgroundColor: "rgba(0, 210, 255, 0.15)",
              border: "1px solid #00D2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              color: "#00D2FF",
              flexShrink: 0,
            }}
          >
            ✓
          </div>
          <div>
            <div
              style={{
                fontFamily: displayFont,
                fontSize: 22,
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              Oportunidade Criada no CRM a partir do Status
            </div>
            <div
              style={{
                fontFamily: interFont,
                fontSize: 15,
                color: "#94A3B8",
              }}
            >
              Contato: <strong style={{ color: "#FFFFFF" }}>Carlos Eduardo • Grupo Safra</strong> • Negócio vinculado no Funil
            </div>
          </div>
        </div>
      )}

      {/* Card da Tabela Real (Largura 960px) */}
      <div
        style={{
          width: 960,
          borderRadius: 32,
          backgroundColor: "#0B1224",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "32px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          boxShadow:
            "0 30px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(0, 85, 255, 0.15)",
          position: "relative",
        }}
      >
        {/* Header do Card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: "rgba(0, 210, 255, 0.12)",
                border: "1px solid rgba(0, 210, 255, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00D2FF",
              }}
            >
              <Users size={22} />
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
                Contatos & Visualizadores Identificados
              </div>
              <div
                style={{
                  fontFamily: interFont,
                  fontSize: 13,
                  color: "#94A3B8",
                }}
              >
                Cruzamento de post visualizado, data, horário exato e abordagem com IA.
              </div>
            </div>
          </div>

          {/* Botão Meta Ads (SHA-256) em destaque */}
          <div
            style={{
              padding: "10px 18px",
              borderRadius: 14,
              backgroundColor: isMetaPulsing
                ? "rgba(0, 85, 255, 0.25)"
                : "rgba(0, 85, 255, 0.12)",
              border: isMetaPulsing
                ? "1.5px solid #00D2FF"
                : "1px solid rgba(0, 210, 255, 0.35)",
              boxShadow: isMetaPulsing
                ? "0 0 25px rgba(0, 210, 255, 0.6)"
                : "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: monoFont,
              fontSize: 13,
              fontWeight: 700,
              color: "#00D2FF",
              transition: "all 0.2s",
            }}
          >
            <ShieldCheck size={18} color="#00D2FF" />
            <span>Meta Ads (SHA-256)</span>
          </div>
        </div>

        {/* Linha de Filtros de IA Ativos */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: monoFont,
              fontSize: 12,
              fontWeight: 700,
              color: "#64748B",
              textTransform: "uppercase",
            }}
          >
            Filtro IA:
          </span>

          <div
            style={{
              padding: "6px 14px",
              borderRadius: 10,
              backgroundColor: "#0055FF",
              fontFamily: interFont,
              fontSize: 12,
              fontWeight: 700,
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>Todos</span>
            <span style={{ backgroundColor: "rgba(255, 255, 255, 0.25)", padding: "1px 6px", borderRadius: 10 }}>44</span>
          </div>

          <div
            style={{
              padding: "6px 14px",
              borderRadius: 10,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              fontFamily: interFont,
              fontSize: 12,
              fontWeight: 600,
              color: "#94A3B8",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>Compradores</span>
            <span style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", padding: "1px 6px", borderRadius: 10 }}>2</span>
          </div>

          <div
            style={{
              padding: "6px 14px",
              borderRadius: 10,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              fontFamily: interFont,
              fontSize: 12,
              fontWeight: 600,
              color: "#94A3B8",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>Negociação</span>
            <span style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", padding: "1px 6px", borderRadius: 10 }}>19</span>
          </div>

          <div
            style={{
              padding: "6px 14px",
              borderRadius: 10,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              fontFamily: interFont,
              fontSize: 12,
              fontWeight: 600,
              color: "#94A3B8",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>Potenciais</span>
            <span style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", padding: "1px 6px", borderRadius: 10 }}>12</span>
          </div>
        </div>

        {/* Linha da Tabela Real (Anonimizada / LGPD): Carlos Eduardo • Grupo Safra */}
        <div
          style={{
            borderRadius: 20,
            backgroundColor: "#070D1B",
            border: "1px solid rgba(0, 210, 255, 0.25)",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Contato Anonimizado & Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                backgroundColor: "#0B1224",
                border: "2px solid #00D2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: monoFont,
                fontSize: 18,
                fontWeight: 800,
                color: "#FFFFFF",
                position: "relative",
              }}
            >
              CE
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: "#00D2FF",
                  border: "2px solid #070D1B",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div
                style={{
                  fontFamily: displayFont,
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#FFFFFF",
                }}
              >
                Carlos Eduardo • Grupo Safra
              </div>
              <div
                style={{
                  fontFamily: monoFont,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#94A3B8",
                }}
              >
                +55 (54) 99123-••••
              </div>
              <div
                style={{
                  fontFamily: interFont,
                  fontSize: 12,
                  color: "#64748B",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Building2 size={12} />
                <span>Grupo Safra • Passo Fundo - RS</span>
              </div>
            </div>
          </div>

          {/* Post Identificado & Miniatura */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 12,
                backgroundColor: "#030611",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              🚜
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontFamily: interFont,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#E2E8F0",
                  maxWidth: 200,
                }}
              >
                Linha Versátil Plantadeira
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: monoFont,
                  fontSize: 12,
                  color: "#00D2FF",
                  fontWeight: 700,
                }}
              >
                <Clock size={12} />
                <span>17:02:47</span>
                <span style={{ color: "#64748B" }}>•</span>
                <span style={{ color: "#94A3B8" }}>Hoje</span>
              </div>
            </div>
          </div>

          {/* Botão [ ✨ Abordar IA ] */}
          <div
            style={{
              transform: `scale(${buttonScale})`,
              padding: "14px 24px",
              borderRadius: 16,
              background: "linear-gradient(135deg, #0055FF 0%, #00D2FF 100%)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              boxShadow: "0 10px 25px rgba(0, 85, 255, 0.45)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#FFFFFF",
              fontFamily: displayFont,
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            <Sparkles size={18} color="#FFFFFF" />
            <span>Abordar IA</span>
          </div>
        </div>

        {/* Popover / Modal da Abordagem Comercial Contextual */}
        {isModalOpen && (
          <div
            style={{
              opacity: modalOpacity,
              transform: `scale(${modalScale})`,
              borderRadius: 24,
              backgroundColor: "#030611",
              border: "1px solid rgba(0, 210, 255, 0.35)",
              boxShadow:
                "0 20px 60px rgba(0, 0, 0, 0.95), 0 0 50px rgba(0, 85, 255, 0.2)",
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginTop: 4,
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                paddingBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                  <Sparkles size={18} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: displayFont,
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#FFFFFF",
                    }}
                  >
                    Abordagem Comercial Contextual (OpenAI + Histórico WhatsApp)
                  </div>
                  <div
                    style={{
                      fontFamily: interFont,
                      fontSize: 12,
                      color: "#94A3B8",
                    }}
                  >
                    Geração sem invasão • Gatilho: Linha Versátil assistida às 17:02:47
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "4px 12px",
                  borderRadius: 10,
                  backgroundColor: "rgba(0, 210, 255, 0.12)",
                  border: "1px solid rgba(0, 210, 255, 0.3)",
                  fontFamily: monoFont,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#00D2FF",
                }}
              >
                Zero Fricção
              </div>
            </div>

            {/* Mensagem Gerada com Typewriter */}
            <div
              style={{
                borderRadius: 16,
                backgroundColor: "#070D1B",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                padding: "16px 20px",
                fontFamily: interFont,
                fontSize: 16,
                lineHeight: 1.5,
                color: "#F8FAFC",
                minHeight: 80,
              }}
            >
              "{displayedMessage}"
            </div>
          </div>
        )}
      </div>

      {/* Cursor Vetorial de Precisão */}
      {cursorVisible && (
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            pointerEvents: "none",
            zIndex: 100,
            filter: "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.8))",
          }}
        >
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 3L10.07 19.97L12.58 13.58L18.97 11.07L3 3Z"
              fill="#00D2FF"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
