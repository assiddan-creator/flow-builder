import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, input_images, model = 'gemini-2.5-flash-image', apiKey } = await req.json();

  const parts: any[] = [];

  // Add input images FIRST (before text)
  if (input_images && input_images.length > 0) {
    for (const img of input_images) {
      const base64 = img.split(',')[1];
      const mimeType = img.split(';')[0].split(':')[1];
      parts.push({ inlineData: { mimeType, data: base64 } });
    }
  }

  // Add prompt text
  parts.push({ text: prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    }
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: JSON.stringify(data) }, { status: 400 });
  }

  const candidate = data.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

  if (!imagePart) {
    const textPart = candidate?.content?.parts?.find((p: any) => p.text);
    return NextResponse.json({ 
      error: 'No image in response. Text: ' + (textPart?.text || 'none') 
    }, { status: 500 });
  }

  const outputDataUri = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
  return NextResponse.json({ output_url: outputDataUri });
}
