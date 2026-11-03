import React from "react";
import { Sequence, Audio, staticFile, useCurrentFrame, interpolate } from "remotion";

export const SoundtrackAndSFX: React.FC = () => {
  const frame = useCurrentFrame();

  // Pista 1 (Soundbed): Curva de volume elegante da Trilha Instrumental Contínua
  // Fade-in nos primeiros 20 frames até volume 0.22, e fade-out suave nos últimos 30 frames
  const trackVolume = interpolate(
    frame,
    [0, 20, 870, 900],
    [0, 0.22, 0.22, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <>
      {/* ========================================================= */}
      {/* PISTA 1: TRILHA SONORA INSTRUMENTAL CONTÍNUA (SOUNDBED)   */}
      {/* ========================================================= */}
      <Audio
        src={staticFile("sounds/ambient-tech-loop.wav")}
        volume={trackVolume}
        loop
      />

      {/* ========================================================= */}
      {/* PISTA 2: DIGITAÇÃO MECÂNICA CLICK-SWITCH (Frames 15 a 45) */}
      {/* ========================================================= */}
      <Sequence from={15} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.7} />
      </Sequence>
      <Sequence from={21} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.7} />
      </Sequence>
      <Sequence from={27} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.7} />
      </Sequence>
      <Sequence from={33} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.7} />
      </Sequence>
      <Sequence from={39} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.7} />
      </Sequence>
      <Sequence from={45} durationInFrames={8}>
        <Audio src={staticFile("sounds/click-switch.wav")} volume={0.7} />
      </Sequence>

      {/* ========================================================= */}
      {/* PISTA 3: WHOOSH DE AR PRESSURIZADO (Frame 55)             */}
      {/* ========================================================= */}
      <Sequence from={55} durationInFrames={35}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.75} />
      </Sequence>

      {/* ========================================================= */}
      {/* PISTA 4: CLIQUE MECÂNICO DE MOUSE-TAP (Frame 105)         */}
      {/* ========================================================= */}
      <Sequence from={105} durationInFrames={25}>
        <Audio src={staticFile("sounds/mouse-tap.wav")} volume={0.85} />
      </Sequence>

      {/* ========================================================= */}
      {/* PISTA 5: SUB-BASS-DROP 808 NO TICKER E 3D (Frame 200)     */}
      {/* ========================================================= */}
      <Sequence from={200} durationInFrames={55}>
        <Audio src={staticFile("sounds/sub-bass-drop.wav")} volume={0.85} />
      </Sequence>

      {/* ========================================================= */}
      {/* PISTA 6: NOTIFICATION-CHIME NOS TOASTS (480, 520, 560)    */}
      {/* ========================================================= */}
      <Sequence from={480} durationInFrames={25}>
        <Audio src={staticFile("sounds/notification-chime.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={520} durationInFrames={25}>
        <Audio src={staticFile("sounds/notification-chime.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={560} durationInFrames={30}>
        <Audio src={staticFile("sounds/notification-chime.wav")} volume={0.85} />
      </Sequence>

      {/* ========================================================= */}
      {/* PISTA 7: IMPACTO FINAL DE MARCA & REVELAÇÃO (Frame 740)   */}
      {/* ========================================================= */}
      <Sequence from={740} durationInFrames={50}>
        <Audio src={staticFile("sounds/sub-bass-drop.wav")} volume={0.85} />
      </Sequence>
      <Sequence from={740} durationInFrames={30}>
        <Audio src={staticFile("sounds/whoosh-air.wav")} volume={0.7} />
      </Sequence>
      <Sequence from={820} durationInFrames={25}>
        <Audio src={staticFile("sounds/mouse-tap.wav")} volume={0.8} />
      </Sequence>
    </>
  );
};
