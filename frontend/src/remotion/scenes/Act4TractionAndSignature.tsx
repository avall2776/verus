import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { displayFont, monoFont, interFont } from "../typography/fonts";
import { DynamicSplineGraph } from "../components/DynamicSplineGraph";

export const Act4TractionAndSignature: React.FC = () => {
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

  // 2. EVOLUÇÃO DO GRÁFICO SPLINE (Frames 30 a 320)
  const graphProgress = interpolate(frame, [30, 320], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3. TICKER FINANCEIRO (R$ 0,00 -> R$ 214.500,00)
  const counterValue = interpolate(frame, [40, 340], [0, 214500], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const formattedCounter = counterValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // 4. TIPOGRAFIA CINÉTICA (Troca aos 270 frames / 4.5s)
  // Frase 1: "TRANSFORME STATUS PASSIVO" (0 a 270)
  // Frase 2: "EM RECEITA ATIVA." (270 a 540)
  const isPhrase2 = frame >= 270;
  const phraseSpring = spring({
    frame: frame - 270,
    fps,
    config: { damping: 12, stiffness: 240, mass: 0.5 },
  });

  // 5. TRANSIÇÃO PARA A ASSINATURA TRIUNFAL (Frame 540 em diante / Master 2640+)
  const isSignature = frame >= 540;
  const signatureSpring = spring({
    frame: frame - 540,
    fps,
    config: { damping: 15, stiffness: 200, mass: 0.7 },
  });
  const signatureScale = interpolate(signatureSpring, [0, 1], [0.85, 1]);
  const signatureOpacity = interpolate(signatureSpring, [0, 0.4], [0, 1]);

  // Laser Sweep Effect na Logo
  const laserPosition = interpolate(frame - 540, [30, 140], [-100, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Rotação contínua do anel orbital em 60 FPS
  const orbitalRotation = (frame - 540) * 1.5;

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
      {/* ======================================================== */}
      {/* PARTE A: DASHBOARD DE TRAÇÃO 3D & TICKER (Frames 0 a 540) */}
      {/* ======================================================== */}
      {!isSignature && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 40,
            width: "100%",
          }}
        >
          {/* Tipografia Cinética de Impacto */}
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              minHeight: 180,
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: monoFont,
                fontSize: 16,
                fontWeight: 700,
                color: "#00D2FF",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              • RESULTADO CONVERTIDO EM TEMPO REAL •
            </div>

            {!isPhrase2 ? (
              <div
                style={{
                  fontFamily: displayFont,
                  fontSize: 64,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  maxWidth: 960,
                }}
              >
                TRANSFORME STATUS PASSIVO
              </div>
            ) : (
              <div
                style={{
                  fontFamily: displayFont,
                  fontSize: 72,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  maxWidth: 960,
                  transform: `scale(${interpolate(phraseSpring, [0, 1], [0.92, 1])})`,
                }}
              >
                EM{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #10B981 0%, #00D2FF 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  RECEITA ATIVA.
                </span>
              </div>
            )}
          </div>

          {/* Card 3D com Spline & Ticker (Largura 960px, Inclinação 7deg) */}
          <div
            style={{
              width: 960,
              perspective: 1200,
              transform: "rotateX(7deg)",
              transformStyle: "preserve-3d",
            }}
          >
            <div
              style={{
                borderRadius: 36,
                backgroundColor: "#0B1224",
                border: "1px solid rgba(0, 210, 255, 0.35)",
                boxShadow:
                  "0 40px 100px rgba(0, 0, 0, 0.9), 0 0 100px rgba(0, 210, 255, 0.2)",
                padding: "36px 40px",
                display: "flex",
                flexDirection: "column",
                gap: 24,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Glow Interno */}
              <div
                style={{
                  position: "absolute",
                  top: -80,
                  right: -80,
                  width: 320,
                  height: 320,
                  background:
                    "radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)",
                  filter: "blur(40px)",
                  pointerEvents: "none",
                }}
              />

              {/* Cabeçalho do Card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: 14,
                      color: "#94A3B8",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Receita Gerada via Radar de Stories
                  </span>
                  <div
                    style={{
                      fontFamily: monoFont,
                      fontSize: 68,
                      fontWeight: 800,
                      color: "#FFFFFF",
                      letterSpacing: "-0.03em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    R$ {formattedCounter}
                  </div>
                </div>

                {/* Badge de Reconversão */}
                <div
                  style={{
                    padding: "12px 22px",
                    borderRadius: 20,
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    border: "1.5px solid #10B981",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: "0 0 30px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <span style={{ fontSize: 20, color: "#10B981" }}>▲</span>
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#34D399",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    +412% de Reconversão Ativa
                  </span>
                </div>
              </div>

              {/* Gráfico Spline Vetorial Dinâmico */}
              <div style={{ margin: "10px 0" }}>
                <DynamicSplineGraph progress={graphProgress} width={880} height={200} />
              </div>

              {/* Linha de Indicadores Complementares */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 16,
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  paddingTop: 20,
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                    borderRadius: 16,
                    padding: "14px 18px",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: interFont,
                      fontSize: 13,
                      color: "#94A3B8",
                    }}
                  >
                    Taxa de Resposta
                  </div>
                  <div
                    style={{
                      fontFamily: monoFont,
                      fontSize: 26,
                      fontWeight: 700,
                      color: "#00D2FF",
                    }}
                  >
                    78.4%
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                    borderRadius: 16,
                    padding: "14px 18px",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: interFont,
                      fontSize: 13,
                      color: "#94A3B8",
                    }}
                  >
                    Ciclo Médio
                  </div>
                  <div
                    style={{
                      fontFamily: monoFont,
                      fontSize: 26,
                      fontWeight: 700,
                      color: "#10B981",
                    }}
                  >
                    3.2 dias
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                    borderRadius: 16,
                    padding: "14px 18px",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: interFont,
                      fontSize: 13,
                      color: "#94A3B8",
                    }}
                  >
                    Deals Criados
                  </div>
                  <div
                    style={{
                      fontFamily: monoFont,
                      fontSize: 26,
                      fontWeight: 700,
                      color: "#F59E0B",
                    }}
                  >
                    14 novos
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PARTE B: ASSINATURA OFICIAL TRIUNFAL VALLOR (Frames 540+) */}
      {/* ======================================================== */}
      {isSignature && (
        <div
          style={{
            opacity: signatureOpacity,
            transform: `scale(${signatureScale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
            textAlign: "center",
          }}
        >
          {/* Logo VALLOR Central com Anel Orbital Pulsante em 60 FPS */}
          <div
            style={{
              position: "relative",
              width: 220,
              height: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Anel Orbital 1 */}
            <div
              style={{
                position: "absolute",
                inset: -20,
                borderRadius: "50%",
                border: "2px dashed rgba(0, 210, 255, 0.5)",
                transform: `rotate(${orbitalRotation}deg)`,
              }}
            />

            {/* Anel Orbital 2 (Contrário) */}
            <div
              style={{
                position: "absolute",
                inset: -8,
                borderRadius: "50%",
                border: "2px solid rgba(0, 85, 255, 0.4)",
                transform: `rotate(-${orbitalRotation * 0.7}deg)`,
              }}
            />

            {/* Fundo do Emblema */}
            <div
              style={{
                width: 170,
                height: 170,
                borderRadius: 44,
                background: "linear-gradient(135deg, #0055FF 0%, #00D2FF 100%)",
                boxShadow:
                  "0 0 80px rgba(0, 210, 255, 0.7), 0 20px 50px rgba(0, 0, 0, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Laser Sweep Effect */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.7) 50%, transparent 100%)",
                  transform: `translateX(${laserPosition}%) skewX(-25deg)`,
                  pointerEvents: "none",
                }}
              />

              <span
                style={{
                  fontFamily: displayFont,
                  fontSize: 90,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  letterSpacing: "-0.05em",
                }}
              >
                V
              </span>
            </div>
          </div>

          {/* Nome VALLOR */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                fontFamily: displayFont,
                fontSize: 92,
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: "0.14em",
                textShadow: "0 10px 40px rgba(0, 0, 0, 0.8)",
              }}
            >
              VALLOR
            </div>

            <div
              style={{
                fontFamily: monoFont,
                fontSize: 19,
                fontWeight: 600,
                color: "#00D2FF",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              O Sistema Operacional Comercial da Agroindústria
            </div>
          </div>

          {/* Botão CTA Final */}
          <div
            style={{
              marginTop: 20,
              padding: "22px 52px",
              borderRadius: 30,
              background: "linear-gradient(135deg, #0055FF 0%, #00D2FF 100%)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow:
                "0 20px 50px rgba(0, 85, 255, 0.5), 0 0 60px rgba(0, 210, 255, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span
              style={{
                fontFamily: displayFont,
                fontSize: 26,
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "-0.01em",
              }}
            >
              Conheça o Radar • vallor.app →
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

