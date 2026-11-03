import React from "react";
import { Composition } from "remotion";
import { MainCompositionRadar } from "./MainCompositionRadar";
import { VallorRadarStoriesComposition } from "./VallorRadarStoriesComposition";
import { MainComposition } from "./MainComposition";
import { Scene1InboundTrigger } from "./scenes/Scene1InboundTrigger";

export const Root: React.FC = () => {
  return (
    <>
      {/* Composição Oficial de Motion Design do Produto: Radar de Stories & Status */}
      {/* Duração: 48 segundos (2.880 frames a 60 FPS / Formato Reels 9:16) */}
      <Composition
        id="VallorRadarStoriesReels"
        component={MainCompositionRadar}
        durationInFrames={2880}
        fps={60}
        width={1080}
        height={1920}
      />

      {/* Composição Institucional Resumida (15 segundos a 60 FPS) */}
      <Composition
        id="VallorReels"
        component={MainComposition}
        durationInFrames={900}
        fps={60}
        width={1080}
        height={1920}
      />

      {/* Composição Individual: Cena 1 (Gatilho Inbound / Teste Rápido) */}
      <Composition
        id="Scene1Quick"
        component={Scene1InboundTrigger}
        durationInFrames={200}
        fps={60}
        width={1080}
        height={1920}
      />
    </>
  );
};
