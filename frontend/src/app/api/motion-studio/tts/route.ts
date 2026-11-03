import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, voice = "onyx", speed = 1.0 } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Texto para narração é obrigatório." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chave OPENAI_API_KEY não configurada no servidor." },
        { status: 500 }
      );
    }

    // Chamada oficial à API de Áudio / TTS da OpenAI (tts-1 / tts-1-hd)
    const openAiResponse = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: voice, // onyx (masculina grave B2B), nova (feminina enérgica), alloy (corporativa neutra), echo (masculina calorosa), shimmer (feminina executiva)
        speed: Math.max(0.75, Math.min(2.0, Number(speed) || 1.0)),
        response_format: "mp3",
      }),
    });

    if (!openAiResponse.ok) {
      const errDetail = await openAiResponse.text();
      console.error("[OpenAI TTS Error]:", errDetail);
      return NextResponse.json(
        { error: "Erro ao gerar áudio com OpenAI TTS.", detail: errDetail },
        { status: openAiResponse.status }
      );
    }

    const audioBuffer = await openAiResponse.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error: any) {
    console.error("[Motion Studio TTS Route Error]:", error);
    return NextResponse.json(
      { error: "Falha interna ao processar narração de IA.", message: error.message },
      { status: 500 }
    );
  }
}

