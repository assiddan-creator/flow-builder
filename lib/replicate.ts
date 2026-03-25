/**
 * Converts any image source to a base64 data URI.
 * - If src is already a data URI, returns it unchanged.
 * - If src is a remote URL, proxies through our API route to avoid CORS.
 */
export async function toBase64DataURI(src: string): Promise<string> {
  if (!src) return "";
  if (src.startsWith("data:")) return src;

  const res = await fetch("/api/proxy-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: src }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to convert image to base64: ${err}`);
  }

  const { dataUri } = await res.json();
  return dataUri;
}

export interface ReplicateGenerateImageParams {
  model: string;
  prompt: string;
  input_images?: string[];
  apiKey: string;
}

export interface ReplicateGenerateVideoParams {
  model: string;
  start_frame_url?: string;
  prompt: string;
  duration: string;
  apiKey: string;
}

async function callApi<T>(path: string, body: object): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    let message = `API error ${res.status}`;
    try {
      const json = JSON.parse(errText);
      message = json.error || message;
    } catch {
      message = errText || message;
    }
    throw new Error(message);
  }

  return res.json();
}

export async function generateImage(
  params: ReplicateGenerateImageParams
): Promise<string> {
  const data = await callApi<{ output_url: string }>(
    "/api/replicate/generate-image",
    params
  );
  return data.output_url;
}

export async function generateVideo(
  params: ReplicateGenerateVideoParams
): Promise<string> {
  const data = await callApi<{ output_url: string }>(
    "/api/replicate/generate-video",
    params
  );
  return data.output_url;
}
