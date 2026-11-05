import React from "react";
import { Sequence, Audio, staticFile, useCurrentFrame, interpolate } from "remotion";

/**
 * RadarStoriesSoundtrack
 * Duração Total: 2.880 Frames (48.0s @ 60 FPS)
 *
 * Arquitetura de Mixagem Final Sem Sobreposição:
 * - Cada ato tem Sequences estritamente delimitadas por durationInFrames
 * - playbackRate calibrado para que cada fala termine com folga de 15 a 40 frames antes da próxima cena
 * - Audio Ducking adaptativo na trilha de fundo (0.08 com voz, 0.16 nas transições)
 * - SFX de Estúdio calibrados entre 0.60 e 0.75
 */
export const RadarStoriesSoundtrack: React.FC = () => {
  const frame = useCurrentFrame();

  // Curva de Audio Ducking Dinâmico sincronizada com os términos exatos de cada fala:
  // - Ato 1 fala até frame 465 (sobe para 0.16 na transição 465-480)
  // - Ato 2 fala até frame 1041 (sobe para 0.16 na transição 1045-1080)
  // - Ato 3 fala até frame 1563 (sobe para 0.16 no respiro 1570-1680)
  // - Ato 4 fala até frame 2301 (sobe para 0.16 na transição 2305-2340)
  // - Ato 5 fala até frame 2791 (sobe para 0.14 no acorde final e fade-out)
  const trackVolume = interpolate(
    frame,
    [
      0, 20, 25, 40,
      445, 465, 475, 485,
      1030, 1050, 1070, 1085,
      1550, 1580, 1665, 1685,
      2290, 2315, 2335, 2345,
      2780, 2810, 2835, 2880
    ],
    [
      0, 0.12, 0.08, 0.08,
      0.08, 0.16, 0.16, 0.08,
      0.08, 0.16, 0.16, 0.08,
      0.08, 0.16, 0.16, 0.08,
      0.08, 0.16, 0.16, 0.08,
      0.08, 0.14, 0.14, 0
    ],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <>
      {/* ========================================================= */}
      {/* PISTAS DE VOZ: NARRAÇÃO ELEVENLABS (5 ATOS ISOLADOS)      */}
      {/* ========================================================= */}
      {/* Ato 1: O Ponto Cego (Frames 25 a 480 / 455 frames máx) */}
      {/* 506 frames originais @ 1.15x = 440 frames (termina no frame 465) */}
      <Sequence from={25} durationInFrames={455}>
        <Audio
          src={staticFile("audio/locucao_ato1.mp3")}
          playbackRate={1.15}
          volume={1.0}
        />
      </Sequence>

      {/* Ato 2: Monitorização & Vitrina (Frames 480 a 1080 / 600 frames máx) */}
      {/* 679 frames originais @ 1.21x = 561 frames (termina no frame 1041) */}
      <Sequence from={480} durationInFrames={600}>
        <Audio
          src={staticFile("audio/locucao_ato2.mp3")}
          playbackRate={1.21}
          volume={1.0}
        />
      </Sequence>

      {/* Ato 3: Métricas de 7 Dias & Segmento (Frames 1080 a 1680 / 600 frames máx) */}
      {/* 483 frames originais @ 1.0x = 483 frames (termina no frame 1563) */}
      <Sequence from={1080} durationInFrames={600}>
        <Audio
          src={staticFile("audio/locucao_ato3.mp3")}
          playbackRate={1.0}
          volume={1.0}
        />
      </Sequence>

      {/* Ato 4: Meta Ads & Abordagem IA (Frames 1680 a 2340 / 660 frames máx) */}
      {/* 746 frames originais @ 1.20x = 621 frames (termina no frame 2301) */}
      <Sequence from={1680} durationInFrames={660}>
        <Audio
          src={staticFile("audio/locucao_ato4.mp3")}
          playbackRate={1.20}
          volume={1.0}
        />
      </Sequence>

      {/* Ato 5: Encerramento & Assinatura (Frames 2340 a 2880 / 540 frames máx) */}
      {/* 555 frames originais @ 1.23x = 451 frames (termina no frame 2791) */}
      <Sequence from={2340} durationInFrames={540}>
        <Audio
          src={staticFile("audio/locucao_ato5.mp3")}
          playbackRate={1.23}
          volume={1.0}
        />
      </Sequence>

      {/* ========================================================= */}
      {/* PISTA SOUNDBED: TRILHA INSTRUMENTAL COM AUDIO DUCKING     */}
      {/* ========================================================= */}
      <Audio
        src={staticFile("sounds/ambient-tech-loop.wav")}
        volume={trackVolume}
        loop
      />

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
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.70} />
      </Sequence>

      {/* ========================================================= */}
      {/* CENA 2: CABEÇALHO DO RADAR, 4 KPIS E VITRINE (480 a 1080) */}
      {/* ========================================================= */}
      {/* Chimes táteis na contagem dos 4 KPIs (Frame 540) */}
      <Sequence from={540} durationInFrames={35}>
        <Audio src={staticFile("sounds/notification-chime.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={560} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.60} />
      </Sequence>
      <Sequence from={580} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.60} />
      </Sequence>

      {/* Revelação da Vitrine de Stories Ativos */}
      <Sequence from={620} durationInFrames={35}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.70} />
      </Sequence>

      {/* Match Cut Push-In para Cena 3 */}
      <Sequence from={1060} durationInFrames={30}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.70} />
      </Sequence>

      {/* ========================================================= */}
      {/* CENA 3: FLUXO DE 7 DIAS & SEGMENTO (1080 a 1680)          */}
      {/* ========================================================= */}
      {/* Riser / frequência harmônica na subida da curva spline (Frame 1120) */}
      <Sequence from={1120} durationInFrames={45}>
        <Audio src={staticFile("sounds/sub-bass-drop.wav")} volume={0.70} />
      </Sequence>
      <Sequence from={1180} durationInFrames={30}>
        <Audio src={staticFile("sounds/notification-chime.wav")} volume={0.70} />
      </Sequence>

      {/* Preenchimento 100% Maquinários */}
      <Sequence from={1220} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.60} />
      </Sequence>

      {/* Match Cut Push-In para Cena 4 */}
      <Sequence from={1660} durationInFrames={30}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.70} />
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
        <Audio src={staticFile("sounds/mouse-tap.wav")} volume={0.75} />
      </Sequence>

      {/* Abertura da Gaveta IA */}
      <Sequence from={1830} durationInFrames={30}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.65} />
      </Sequence>

      {/* Notificação / Toast de Oportunidade Criada no CRM (Frame 1940) */}
      <Sequence from={1940} durationInFrames={35}>
        <Audio src={staticFile("sounds/message-sent.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={1945} durationInFrames={30}>
        <Audio src={staticFile("sounds/notification-chime.wav")} volume={0.70} />
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
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.70} />
      </Sequence>

      {/* Sub-bass drop e impacto harmônico na revelação da marca VALLOR */}
      <Sequence from={2540} durationInFrames={60}>
        <Audio src={staticFile("sounds/sub-bass-drop.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={2540} durationInFrames={35}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.75} />
      </Sequence>

      {/* Feixe Laser cruzando o logo */}
      <Sequence from={2600} durationInFrames={30}>
        <Audio src={staticFile("sounds/notification-chime.wav")} volume={0.75} />
      </Sequence>

      {/* Clique no Botão CTA Final */}
      <Sequence from={2720} durationInFrames={25}>
        <Audio src={staticFile("sounds/mouse-tap.wav")} volume={0.75} />
      </Sequence>
    </>
  );
};
