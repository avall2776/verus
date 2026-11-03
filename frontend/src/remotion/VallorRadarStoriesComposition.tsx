import React from "react";
import { Sequence, AbsoluteFill } from "remotion";
import { GridBackground } from "./components/GridBackground";
import { CinematicOverlay } from "./components/CinematicOverlay";
import { Act1CommercialBlindspot } from "./scenes/Act1CommercialBlindspot";
import { Act2TrackingStoryRing } from "./scenes/Act2TrackingStoryRing";
import { Act3AiCasualApproach } from "./scenes/Act3AiCasualApproach";
import { Act4TractionAndSignature } from "./scenes/Act4TractionAndSignature";
import { RadarStoriesSoundtrack } from "./audio/RadarStoriesSoundtrack";

/**
 * VallorRadarStoriesComposition
 * Duração Total: 2.880 Frames (48 segundos @ 60 FPS)
 * Formato: 1080x1920 (Vertical 9:16)
 *
 * Timeline:
 * - Ato 1: Frames 0 a 540 (0s a 9s) - O Ponto Cego Comercial
 * - Ato 2: Frames 540 a 1320 (9s a 22s) - Rastreamento Real & Story Ring no CRM
 * - Ato 3: Frames 1320 a 2100 (22s a 35s) - Copiloto Comercial IA & 1 Clique
 * - Ato 4: Frames 2100 a 2880 (35s a 48s) - Escalada de Receita & Assinatura Triunfal
 */
export const VallorRadarStoriesComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#030611" }}>
      {/* Camada 0: Grelha Técnica Milimétrica de Coordenadas */}
      <GridBackground />

      {/* Camada 1: Cenas Encadeadas por Match Cut Contínuo */}
      {/* ATO 1 (0 a 540 frames / 9.0s) */}
      <Sequence from={0} durationInFrames={540}>
        <Act1CommercialBlindspot />
      </Sequence>

      {/* ATO 2 (540 a 1320 frames / 13.0s) */}
      <Sequence from={540} durationInFrames={780}>
        <Act2TrackingStoryRing />
      </Sequence>

      {/* ATO 3 (1320 a 2100 frames / 13.0s) */}
      <Sequence from={1320} durationInFrames={780}>
        <Act3AiCasualApproach />
      </Sequence>

      {/* ATO 4 (2100 a 2880 frames / 13.0s) */}
      <Sequence from={2100} durationInFrames={780}>
        <Act4TractionAndSignature />
      </Sequence>

      {/* Camada 2: Sound Design & Trilha Instrumental Sincronizada */}
      <RadarStoriesSoundtrack />

      {/* Camada 3: Overlay Cinematográfico de Estúdio (Vinheta, Scanlines & Grain) */}
      <CinematicOverlay />
    </AbsoluteFill>
  );
};

