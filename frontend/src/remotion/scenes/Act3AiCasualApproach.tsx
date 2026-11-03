import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { displayFont, monoFont, interFont } from "../typography/fonts";

export const Act3AiCasualApproach: React.FC = () => {
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

  // 2. TEXTO DA ABORDAGEM CASUAL (TYPEWRITER)
  // Frames 30 a 240 (Master 1350 a 1560)
  const fullText =
    "Fala Carlos, tudo certo? Viemos acompanhando a safra na sua região e chegaram as novas semeadeiras com taxa variável. Como está o planejamento do plantio por aí?";
  
  const typingProgress = interpolate(frame, [30, 240], [0, fullText.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const displayedText = fullText.slice(0, Math.floor(typingProgress));
  const isTyping = frame >= 30 && frame < 240;
  const cursorBlink = isTyping ? (Math.floor(frame / 12) % 2 === 0 ? "|" : "") : "";

  // 3. CURSOR DE PRECISÃO VETORIAL
  // Move-se de (x: 750, y: 1350) para o centro do botão (x: 480, y: 720) entre frames 220 e 298
  const cursorMoveSpring = spring({
    frame: frame - 220,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.9 },
  });
  const cursorX = interpolate(cursorMoveSpring, [0, 1], [740, 480]);
  const cursorY = interpolate(cursorMoveSpring, [0, 1], [1200, 755]);
  const cursorVisible = frame >= 200 && frame <= 420;

  // Feedback do Clique no Botão (Frame 300 / Master 1620)
  const clickSpring = spring({
    frame: frame - 300,
    fps,
    config: { damping: 10, stiffness: 320, mass: 0.4 },
  });
  const buttonScale =
    frame < 300
      ? 1
      : interpolate(clickSpring, [0, 0.4, 1], [1, 0.93, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  // Efeito de onda de choque do clique (Ripple ring)
  const rippleActive = frame >= 300 && frame <= 340;
  const rippleScale = interpolate(frame, [300, 340], [0.3, 2.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rippleOpacity = interpolate(frame, [300, 340], [0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isClicked = frame >= 300;

  // 4. MENSAGEM WHATSAPP ENVIADA & DUPLO CHECK AZUL (Frame 360 / Master 1680)
  const isSent = frame >= 360;
  const sentSpring = spring({
    frame: frame - 360,
    fps,
    config: { damping: 14, stiffness: 200, mass: 0.7 },
  });
  const sentTranslateY = interpolate(sentSpring, [0, 1], [30, 0]);
  const sentOpacity = interpolate(sentSpring, [0, 0.5], [0, 1]);

  // Toast de Confirmação Topo (Frame 360+)
  const toastSpring = spring({
    frame: frame - 360,
    fps,
    config: { damping: 13, stiffness: 220, mass: 0.6 },
  });
  const toastY = interpolate(toastSpring, [0, 1], [-80, 0]);
  const toastOpacity = interpolate(toastSpring, [0, 0.4], [0, 1]);

  // 5. MATCH CUT PUSH-IN FINAL (Frames 760 a 780)
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
      {/* Toast Flutuante no Topo: Confirmação de Deal no CRM */}
      <div
        style={{
          position: "absolute",
          top: 140,
          zIndex: 50,
          opacity: toastOpacity,
          transform: `translateY(${toastY}px)`,
          width: 900,
          borderRadius: 24,
          backgroundColor: "#061A14",
          border: "1.5px solid #10B981",
          boxShadow:
            "0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.35)",
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: "rgba(16, 185, 129, 0.2)",
            border: "1px solid #10B981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            color: "#10B981",
            flexShrink: 0,
          }}
        >
          ✓
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              fontFamily: displayFont,
              fontSize: 22,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.01em",
            }}
          >
            Deal Criado no Funil: <span style={{ color: "#34D399" }}>R$ 85.000,00</span>
          </div>
          <div
            style={{
              fontFamily: interFont,
              fontSize: 16,
              color: "#94A3B8",
            }}
          >
            Etapa: <strong style={{ color: "#F8FAFC" }}>Em Qualificação</strong> • Lead: Carlos Eduardo (Fazenda Santa Fé)
          </div>
        </div>
      </div>

      {/* Card Principal do Copiloto Comercial IA (Largura 960px) */}
      <div
        style={{
          width: 960,
          borderRadius: 36,
          backgroundColor: "#0B1224",
          border: "1px solid rgba(0, 210, 255, 0.3)",
          boxShadow:
            "0 40px 100px rgba(0, 0, 0, 0.9), 0 0 90px rgba(0, 210, 255, 0.18)",
          padding: "36px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
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
            width: 600,
            height: 180,
            background:
              "radial-gradient(ellipse at center, rgba(0, 210, 255, 0.25) 0%, transparent 70%)",
            filter: "blur(30px)",
            pointerEvents: "none",
          }}
        />

        {/* Header do Copiloto */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "linear-gradient(135deg, #00D2FF 0%, #0055FF 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                boxShadow: "0 0 24px rgba(0, 210, 255, 0.6)",
              }}
            >
              ⚡
            </div>
            <div>
              <div
                style={{
                  fontFamily: displayFont,
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  letterSpacing: "-0.02em",
                }}
              >
                Copiloto Comercial IA
              </div>
              <div
                style={{
                  fontFamily: interFont,
                  fontSize: 15,
                  color: "#94A3B8",
                }}
              >
                Geração Contextual Hiper-Personalizada • Abordagem Não-Invasiva
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "8px 18px",
              borderRadius: 20,
              backgroundColor: "rgba(0, 210, 255, 0.12)",
              border: "1px solid rgba(0, 210, 255, 0.4)",
              fontFamily: monoFont,
              fontSize: 12,
              fontWeight: 700,
              color: "#00D2FF",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            ⚡ INTELIGÊNCIA PREDITIVA
          </div>
        </div>

        {/* Barra de Gatilho / Contexto do Lead */}
        <div
          style={{
            padding: "14px 20px",
            borderRadius: 16,
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 14,
            fontFamily: interFont,
            color: "#94A3B8",
          }}
        >
          <div>
            <strong style={{ color: "#FFFFFF" }}>Alvo:</strong> Carlos Eduardo (Fazenda Santa Fé)
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <span>
              Gatilho: <strong style={{ color: "#00D2FF" }}>Status Visualizado</strong>
            </span>
            <span>
              Afinidade: <strong style={{ color: "#10B981" }}>95%</strong>
            </span>
            <span>
              Deal Estimado: <strong style={{ color: "#F59E0B" }}>R$ 85.000</strong>
            </span>
          </div>
        </div>

        {/* Caixa de Sugestão de Mensagem (Typewriter Real) */}
        <div
          style={{
            borderRadius: 24,
            backgroundColor: "#060A17",
            border: "1px solid rgba(0, 210, 255, 0.25)",
            padding: "28px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            boxShadow: "inset 0 2px 20px rgba(0, 0, 0, 0.6)",
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
                fontSize: 13,
                fontWeight: 600,
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Sugestão de Abordagem Não-Invasiva (Zero Fricção):
            </span>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 12,
                color: "#00D2FF",
              }}
            >
              {displayedText.length} / {fullText.length} caracteres
            </span>
          </div>

          <div
            style={{
              fontFamily: interFont,
              fontSize: 25,
              lineHeight: 1.5,
              fontWeight: 500,
              color: "#F8FAFC",
              minHeight: 120,
            }}
          >
            "{displayedText}
            <span style={{ color: "#00D2FF", fontWeight: 700 }}>
              {cursorBlink}
            </span>
            "
          </div>
        </div>

        {/* Botão de Ação: [Aprovar Abordagem & Criar Deal no CRM] */}
        <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
          <div
            style={{
              width: "100%",
              padding: "24px 36px",
              borderRadius: 22,
              background: isClicked
                ? "linear-gradient(135deg, #059669 0%, #10B981 100%)"
                : "linear-gradient(135deg, #0066FF 0%, #00D2FF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              transform: `scale(${buttonScale})`,
              boxShadow: isClicked
                ? "0 15px 40px rgba(16, 185, 129, 0.45)"
                : "0 15px 40px rgba(0, 102, 255, 0.45)",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <span style={{ fontSize: 26 }}>{isClicked ? "✓" : "🚀"}</span>
            <span
              style={{
                fontFamily: displayFont,
                fontSize: 24,
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "-0.01em",
              }}
            >
              {isClicked
                ? "Abordagem Enviada & Deal Criado no CRM!"
                : "Aprovar Abordagem & Criar Deal no CRM"}
            </span>

            {/* Ripple Wave no Clique */}
            {rippleActive && (
              <div
                style={{
                  position: "absolute",
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  transform: `scale(${rippleScale})`,
                  opacity: rippleOpacity,
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        </div>

        {/* Preview do Balão WhatsApp Enviado (Aparece no frame 360 / Master 1680) */}
        {isSent && (
          <div
            style={{
              opacity: sentOpacity,
              transform: `translateY(${sentTranslateY}px)`,
              backgroundColor: "#075E54",
              borderRadius: "20px 20px 4px 20px",
              padding: "18px 24px",
              alignSelf: "flex-end",
              maxWidth: 760,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginTop: 4,
            }}
          >
            <div
              style={{
                fontFamily: interFont,
                fontSize: 18,
                lineHeight: 1.45,
                color: "#FFFFFF",
              }}
            >
              {fullText}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8,
                fontSize: 13,
                fontFamily: monoFont,
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              <span>10:42</span>
              {/* Duplo Check Azul WhatsApp */}
              <span
                style={{
                  color: "#34B7F6",
                  fontWeight: 900,
                  fontSize: 15,
                  letterSpacing: "-2px",
                }}
              >
                ✓✓
              </span>
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
            width="44"
            height="44"
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

