import React from "react";
import { Sequence, Audio, staticFile, useCurrentFrame, interpolate } from "remotion";

export const RadarStoriesSoundtrack: React.FC = () => {
  const frame = useCurrentFrame();

  // Pista 1 (Soundbed): Trilha Instrumental Ambient Tech contínua (48s / 2880 frames)
  // Fade-in suave após o blackout de 30 frames
  const trackVolume = interpolate(
    frame,
    [30, 60, 2830, 2880],
    [0, 0.18, 0.18, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <>
      {/* ========================================================= */}
      {/* PISTA 1: TRILHA SONORA INSTRUMENTAL CONTÍNUA (48 SEGUNDOS)*/}
      {/* ========================================================= */}
      {frame >= 25 && (
        <Audio
          src={staticFile("sounds/ambient-tech-loop.wav")}
          volume={trackVolume}
          loop
        />
      )}

      {/* ========================================================= */}
      {/* CENA 1: O GANCHO & ABERTURA (0 a 480)                     */}
      {/* ========================================================= */}
      {/* Transição para Frase 2 (Frame 170) */}
      <Sequence from={170} durationInFrames={30}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.65} />
      </Sequence>

      {/* Digitação da URL Técnica: app.vallor.com.br/radar-status */}
      <Sequence from={305} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.65} />
      </Sequence>
      <Sequence from={318} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.65} />
      </Sequence>
      <Sequence from={331} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.65} />
      </Sequence>
      <Sequence from={344} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.65} />
      </Sequence>
      <Sequence from={357} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.65} />
      </Sequence>
      <Sequence from={370} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.65} />
      </Sequence>

      {/* Colapso elástico da barra para logo VALLOR oficial (Frame 430) */}
      <Sequence from={430} durationInFrames={35}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.75} />
      </Sequence>

      {/* Match Cut Push-In para Cena 2 (Frame 465) */}
      <Sequence from={465} durationInFrames={30}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.7} />
      </Sequence>

      {/* ========================================================= */}
      {/* CENA 2: CABEÇALHO DO RADAR, 4 KPIS E VITRINE (480 a 1080) */}
      {/* ========================================================= */}
      {/* Chimes táteis na contagem dos 4 KPIs (Frame 540) */}
      <Sequence from={540} durationInFrames={35}>
        <Audio src={staticFile("sounds/notification-chime.wav")} volume={0.85} />
      </Sequence>
      <Sequence from={560} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.6} />
      </Sequence>
      <Sequence from={580} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.6} />
      </Sequence>

      {/* Revelação da Vitrine de Stories Ativos */}
      <Sequence from={620} durationInFrames={35}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.7} />
      </Sequence>

      {/* Match Cut Push-In para Cena 3 */}
      <Sequence from={1060} durationInFrames={30}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.7} />
      </Sequence>

      {/* ========================================================= */}
      {/* CENA 3: FLUXO DE 7 DIAS & SEGMENTO (1080 a 1680)          */}
      {/* ========================================================= */}
      {/* Riser / frequência harmônica na subida da curva spline (Frame 1120) */}
      <Sequence from={1120} durationInFrames={45}>
        <Audio src={staticFile("sounds/sub-bass-drop.wav")} volume={0.7} />
      </Sequence>
      <Sequence from={1180} durationInFrames={30}>
        <Audio src={staticFile("sounds/notification-chime.wav")} volume={0.8} />
      </Sequence>

      {/* Preenchimento 100% Maquinários */}
      <Sequence from={1220} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.6} />
      </Sequence>

      {/* Match Cut Push-In para Cena 4 */}
      <Sequence from={1660} durationInFrames={30}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.7} />
      </Sequence>

      {/* ========================================================= */}
      {/* CENA 4: META ADS & BOTÃO "ABORDAR IA" (1680 a 2340)       */}
      {/* ========================================================= */}
      {/* Pulso do Meta Ads */}
      <Sequence from={1720} durationInFrames={25}>
        <Audio src={staticFile("sounds/notification-chime.wav")} volume={0.65} />
      </Sequence>

      {/* Clique tátil seco de mouse no botão [Abordar IA] (Frame 1820) */}
      <Sequence from={1820} durationInFrames={25}>
        <Audio src={staticFile("sounds/mouse-tap.wav")} volume={0.95} />
      </Sequence>

      {/* Abertura da Gaveta IA */}
      <Sequence from={1830} durationInFrames={30}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.65} />
      </Sequence>

      {/* Notificação / Toast de Oportunidade Criada no CRM (Frame 1940) */}
      <Sequence from={1940} durationInFrames={35}>
        <Audio src={staticFile("sounds/message-sent.wav")} volume={0.85} />
      </Sequence>
      <Sequence from={1945} durationInFrames={30}>
        <Audio src={staticFile("sounds/notification-chime.wav")} volume={0.8} />
      </Sequence>

      {/* Match Cut Push-In para Cena 5 */}
      <Sequence from={2320} durationInFrames={30}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.75} />
      </Sequence>

      {/* ========================================================= */}
      {/* CENA 5: FECHAMENTO & ASSINATURA DA MARCA (2340 a 2880)    */}
      {/* ========================================================= */}
      {/* Frase 2: "EM RECEITA ATIVA." */}
      <Sequence from={2440} durationInFrames={35}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.7} />
      </Sequence>

      {/* Sub-bass drop e impacto harmônico na revelação da marca VALLOR */}
      <Sequence from={2540} durationInFrames={60}>
        <Audio src={staticFile("sounds/sub-bass-drop.wav")} volume={0.95} />
      </Sequence>
      <Sequence from={2540} durationInFrames={35}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.8} />
      </Sequence>

      {/* Feixe Laser cruzando o logo */}
      <Sequence from={2600} durationInFrames={30}>
        <Audio src={staticFile("sounds/notification-chime.wav")} volume={0.75} />
      </Sequence>

      {/* Clique no Botão CTA Final */}
      <Sequence from={2720} durationInFrames={25}>
        <Audio src={staticFile("sounds/mouse-tap.wav")} volume={0.85} />
      </Sequence>
    </>
  );
};
