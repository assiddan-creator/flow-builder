import { NextRequest, NextResponse } from "next/server";

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 300; // Video can take longer

async function pollPrediction(
  predictionId: string,
  apiKey: string
): Promise<string> {
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!res.ok) throw new Error(`Poll failed: ${res.status}`);

    const prediction = await res.json();

    if (prediction.status === "succeeded") {
      const output = prediction.output;
      if (Array.isArray(output)) return output[0];
      if (typeof output === "string") return output;
      throw new Error("Unexpected output format");
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(`Prediction ${prediction.status}: ${prediction.error}`);
    }
  }

  throw new Error("Prediction timed out");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model, start_frame_url, prompt, duration, apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Replicate API key is required" },
        { status: 401 }
      );
    }

    if (!model || !prompt) {
      return NextResponse.json(
        { error: "model and prompt are required" },
        { status: 400 }
      );
    }

    const durationNum = parseFloat(duration || "5");

    const input: Record<string, unknown> = {
      prompt,
      duration: durationNum,
    };

    if (start_frame_url) {
      input.start_image = start_frame_url;
      input.image = start_frame_url;
    }

    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({ model, input }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return NextResponse.json(
        { error: `Replicate error: ${errText}` },
        { status: createRes.status }
      );
    }

    const prediction = await createRes.json();

    let outputUrl: string;

    if (prediction.status === "succeeded") {
      const output = prediction.output;
      outputUrl = Array.isArray(output) ? output[0] : output;
    } else {
      outputUrl = await pollPrediction(prediction.id, apiKey);
    }

    return NextResponse.json({ output_url: outputUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
