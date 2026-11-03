import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// 1. Display / Títulos de Impacto: Space Grotesk (700 e 800)
const spaceGroteskData = loadSpaceGrotesk("normal", {
  weights: ["700"],
});

// 2. Telemetria / Tickers / Código: JetBrains Mono (500 e 700)
const jetBrainsMonoData = loadJetBrainsMono("normal", {
  weights: ["500", "700"],
});

// 3. Interface / Textos Limpos: Inter (400, 500 e 600)
const interData = loadInter("normal", {
  weights: ["400", "500", "600"],
  ignoreTooManyRequestsWarning: true,
});

export const displayFont = spaceGroteskData.fontFamily;
export const monoFont = jetBrainsMonoData.fontFamily;
export const interFont = interData.fontFamily;

export const waitUntilFontsLoaded = async () => {
  await Promise.all([
    spaceGroteskData.waitUntilDone(),
    jetBrainsMonoData.waitUntilDone(),
    interData.waitUntilDone(),
  ]);
};

