import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { model, prompt, input_images, apiKey } = await req.json();

  let input: Record<string, unknown> = {};

  if (model === 'black-forest-labs/flux-2-pro') {
    input = {
      prompt,
      input_images: input_images ?? [],
      aspect_ratio: 'match_input_image',
      output_format: 'jpg',
      resolution: '1 MP',
      safety_tolerance: 2,
    };
  } else if (model === 'google/nano-banana-2') {
    input = {
      prompt,
      image_input: input_images ?? [],
      aspect_ratio: 'match_input_image',
      resolution: '1K',
      output_format: 'jpg',
      google_search: false,
      image_search: false,
    };
  } else if (model === 'bytedance/seedream-5-lite') {
    input = {
      prompt,
      image_input: input_images ?? [],
      size: '2K',
      aspect_ratio: 'match_input_image',
      output_format: 'jpeg',
      sequential_image_generation: 'disabled',
    };
  } else {
    return NextResponse.json({ error: 'Unknown model: ' + model }, { status: 400 });
  }

  const [owner, name] = model.split('/');
  const url = `https://api.replicate.com/v1/models/${owner}/${name}/predictions`;

  const createRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait',
    },
    body: JSON.stringify({ input }),
  });

  const prediction = await createRes.json();

  if (!createRes.ok) {
    return NextResponse.json({ error: JSON.stringify(prediction) }, { status: 400 });
  }

  if (prediction.status === 'succeeded') {
    const out = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    return NextResponse.json({ output_url: out });
  }

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const data = await poll.json();
    if (data.status === 'succeeded') {
      const out = Array.isArray(data.output) ? data.output[0] : data.output;
      return NextResponse.json({ output_url: out });
    }
    if (data.status === 'failed' || data.status === 'canceled') {
      return NextResponse.json({ error: data.error || 'Generation failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Timeout' }, { status: 504 });
}
