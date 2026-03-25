"use client";

import { useMemo, useState, useCallback } from "react";
import type { Provider } from "@/lib/runGeneration";

export interface PromptBuilderState {
  subjectAction: string;
  shotType: string | null;
  lighting: string | null;
  cameraBody: string | null;
  focalLength: string | null;
  lensType: string | null;
  movieLook: string | null;
  faceRef: string | null;
  outfitRef: string | null;
  globalRef: string | null;
  provider: Provider;
  model: string;
}

const REPLICATE_MODELS = [
  { value: "google/nano-banana-2", label: "Nano Banana 2" },
  { value: "black-forest-labs/flux-2-pro", label: "Flux 2 Pro" },
  { value: "bytedance/seedream-5-lite", label: "Seedream 5 Lite" },
];

const GEMINI_MODELS = [
  { value: "gemini-3.1-flash-image-preview", label: "Nano Banana 2 (מהיר)" },
  { value: "gemini-2.5-flash-image", label: "Nano Banana (איכות)" },
];

export function buildPromptString(s: {
  subjectAction: string;
  shotType: string | null;
  lighting: string | null;
  cameraBody: string | null;
  focalLength: string | null;
  lensType: string | null;
  movieLook: string | null;
  faceRef: string | null;
  outfitRef: string | null;
  globalRef: string | null;
}): string {
  const subject = (s.subjectAction || "").trim() || "the subject";
  const shot = (s.shotType || "").trim() || "cinematic";

  const refs: string[] = [];
  if (s.faceRef) refs.push("image_1 as Character 1 face reference");
  if (s.outfitRef) refs.push("image_2 as Character 1 clothing reference");
  if (s.globalRef) refs.push("image_3 as global visual style reference");

  let prefix = "";
  if (refs.length > 0) {
    prefix =
      "Create a new image by combining the provided elements: " +
      refs.join("; ") +
      ". ";
  }

  let body = `A photorealistic image of a ${shot} shot of ${subject}.`;

  const hasCamBlock = !!(s.cameraBody || s.focalLength || s.lensType);
  if (hasCamBlock) {
    const parts: string[] = [];
    if (s.cameraBody) parts.push(`a ${s.cameraBody}`);
    if (s.focalLength) parts.push(`${s.focalLength} lens`);
    if (s.lensType) parts.push(s.lensType);
    body += ` Captured with ${parts.join(", ")}.`;
  }

  if (s.movieLook) {
    body += ` With the visual aesthetic of the movie ${s.movieLook} — matching its color grading, lighting mood, and visual tone.`;
  }

  if (s.lighting) {
    body += ` The scene is illuminated by ${s.lighting}, creating a mood that feels ${s.lighting}.`;
  }

  body +=
    " No blurred faces. The image should be in a 16:9 format. Ultra high quality, sharp details, professional photography.";

  return prefix + body;
}

export function usePromptBuilder() {
  const [subjectAction, setSubjectAction] = useState("");
  const [shotType, setShotType] = useState<string | null>(null);
  const [lighting, setLighting] = useState<string | null>(null);
  const [cameraBody, setCameraBody] = useState<string | null>(null);
  const [focalLength, setFocalLength] = useState<string | null>(null);
  const [lensType, setLensType] = useState<string | null>(null);
  const [movieLook, setMovieLook] = useState<string | null>(null);
  const [faceRef, setFaceRef] = useState<string | null>(null);
  const [outfitRef, setOutfitRef] = useState<string | null>(null);
  const [globalRef, setGlobalRef] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>("replicate");
  const [model, setModel] = useState(REPLICATE_MODELS[0].value);

  const builtPrompt = useMemo(
    () =>
      buildPromptString({
        subjectAction,
        shotType,
        lighting,
        cameraBody,
        focalLength,
        lensType,
        movieLook,
        faceRef,
        outfitRef,
        globalRef,
      }),
    [
      subjectAction,
      shotType,
      lighting,
      cameraBody,
      focalLength,
      lensType,
      movieLook,
      faceRef,
      outfitRef,
      globalRef,
    ]
  );

  /** Ordered for API: face, outfit, global */
  const referenceImages = useMemo(() => {
    const arr: string[] = [];
    if (faceRef) arr.push(faceRef);
    if (outfitRef) arr.push(outfitRef);
    if (globalRef) arr.push(globalRef);
    return arr;
  }, [faceRef, outfitRef, globalRef]);

  const setProviderAndModel = useCallback((p: Provider) => {
    setProvider(p);
    setModel(p === "gemini" ? GEMINI_MODELS[0].value : REPLICATE_MODELS[0].value);
  }, []);

  return {
    subjectAction,
    setSubjectAction,
    shotType,
    setShotType,
    lighting,
    setLighting,
    cameraBody,
    setCameraBody,
    focalLength,
    setFocalLength,
    lensType,
    setLensType,
    movieLook,
    setMovieLook,
    faceRef,
    setFaceRef,
    outfitRef,
    setOutfitRef,
    globalRef,
    setGlobalRef,
    provider,
    setProvider,
    setProviderAndModel,
    model,
    setModel,
    builtPrompt,
    referenceImages,
    REPLICATE_MODELS,
    GEMINI_MODELS,
  };
}
