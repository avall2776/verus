import React from "react";
import { Sequence } from "remotion";
import { GridBackground } from "./components/GridBackground";
import { CinematicOverlay } from "./components/CinematicOverlay";
import { Scene1InboundTrigger } from "./scenes/Scene1InboundTrigger";
import { Scene2ScaleTicker } from "./scenes/Scene2ScaleTicker";
import { Scene3ExecutiveDashboard } from "./scenes/Scene3ExecutiveDashboard";
import { Scene4KineticClose } from "./scenes/Scene4KineticClose";
import { SoundtrackAndSFX } from "./audio/SoundtrackAndSFX";

export const MainComposition: React.FC = () => {
  return (
    <div
      style={{
        position: "relative",
        width: 1080,
        height: 1920,
        backgroundColor: "#030611",
        overflow: "hidden",
      }}
    >
      {/* 1. Camada de Cenografia de Estúdio e Grade Técnica (#030611) */}
      <GridBackground />

      {/* 2. CENA 1: O Gatilho Inbound & Colapso com Snap Físico (Frames 0 a 200) */}
      <Sequence from={0} durationInFrames={200} name="Cena 1 - Gatilho Inbound">
        <Scene1InboundTrigger />
      </Sequence>

      {/* 3. CENA 2: Ticker Monumental & Esfera 3D Three.js (Frames 200 a 450) */}
      <Sequence from={200} durationInFrames={250} name="Cena 2 - Ticker & Esfera 3D Three.js">
        <Scene2ScaleTicker />
      </Sequence>

      {/* 4. CENA 3: Dashboard 3D & Spline Graph @remotion/paths (Frames 450 a 700) */}
      <Sequence from={450} durationInFrames={250} name="Cena 3 - Dashboard 3D & Spline Paths">
        <Scene3ExecutiveDashboard />
      </Sequence>

      {/* 5. CENA 4: Tipografia Cinética Space Grotesk & Assinatura (Frames 700 a 900) */}
      <Sequence from={700} durationInFrames={200} name="Cena 4 - Fechamento & Assinatura VALLOR">
        <Scene4KineticClose />
      </Sequence>

      {/* 6. Sound Design Tátil Real e Trilha Sonora Contínua */}
      <SoundtrackAndSFX />

      {/* 7. Overlay de Ruído Cinematográfico (Film Grain Fractal Noise) e Vinheta */}
      <CinematicOverlay />
    </div>
  );
};
