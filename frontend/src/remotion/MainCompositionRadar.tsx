import React from "react";
import { Sequence, AbsoluteFill } from "remotion";
import { GridBackground } from "./components/GridBackground";
import { CinematicOverlay } from "./components/CinematicOverlay";
import { SceneReal1Hook } from "./scenes/SceneReal1Hook";
import { SceneReal2KpisAndShowcase } from "./scenes/SceneReal2KpisAndShowcase";
import { SceneReal3AnalyticsFlow } from "./scenes/SceneReal3AnalyticsFlow";
import { SceneReal4MetaAdsAndAiModal } from "./scenes/SceneReal4MetaAdsAndAiModal";
import { SceneReal5ClosingSignature } from "./scenes/SceneReal5ClosingSignature";
import { RadarStoriesSoundtrack } from "./audio/RadarStoriesSoundtrack";

/**
 * MainCompositionRadar
 * Duração Total: 2.880 Frames (48.0s @ 60 FPS)
 * Resolução: 1080 x 1920 (Vertical 9:16)
 *
 * Arquitetura das 5 Cenas com Interface Real:
 * - Cena 1: Frames 0 a 480 (0s a 8s) - O Gancho & Abertura
 * - Cena 2: Frames 480 a 1080 (8s a 18s) - Cabeçalho do Radar, 4 KPIs e Vitrine Ativa
 * - Cena 3: Frames 1080 a 1680 (18s a 28s) - Fluxo de 7 Dias & Interesse por Segmento
 * - Cena 4: Frames 1680 a 2340 (28s a 39s) - Audiência Meta Ads & Botão [Abordar IA]
 * - Cena 5: Frames 2340 a 2880 (39s a 48s) - Fechamento & Assinatura da Marca
 */
export const MainCompositionRadar: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#030611" }}>
      {/* Camada 0: Grelha Técnica Milimétrica Pontilhada */}
      <GridBackground />

      {/* Camada 1: As 5 Cenas Principais Encadeadas por Match Cut */}
      {/* CENA 1: O GANCHO & ABERTURA (480 frames) */}
      <Sequence from={0} durationInFrames={480}>
        <SceneReal1Hook />
      </Sequence>

      {/* CENA 2: CABEÇALHO, 4 KPIS E VITRINE (600 frames) */}
      <Sequence from={480} durationInFrames={600}>
        <SceneReal2KpisAndShowcase />
      </Sequence>

      {/* CENA 3: FLUXO DE 7 DIAS & SEGMENTO (600 frames) */}
      <Sequence from={1080} durationInFrames={600}>
        <SceneReal3AnalyticsFlow />
      </Sequence>

      {/* CENA 4: AUDIÊNCIA META ADS & O BOTÃO [ABORDAR IA] (660 frames) */}
      <Sequence from={1680} durationInFrames={660}>
        <SceneReal4MetaAdsAndAiModal />
      </Sequence>

      {/* CENA 5: FECHAMENTO & ASSINATURA DA MARCA (540 frames) */}
      <Sequence from={2340} durationInFrames={540}>
        <SceneReal5ClosingSignature />
      </Sequence>

      {/* Camada 2: Sound Design & Trilha Instrumental Sincronizada */}
      <RadarStoriesSoundtrack />

      {/* Camada 3: Overlay Cinematográfico de Estúdio (Vinheta, Scanlines & Grain) */}
      <CinematicOverlay />
    </AbsoluteFill>
  );
};

