/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createPartFromUri, FileState, GoogleGenAI, type File as GeminiFile } from "@google/genai";

const MAX_INLINE_AUDIO_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_AUDIO_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
const FILE_PROCESSING_TIMEOUT_MS = 2 * 60 * 1000;
const FILE_PROCESSING_POLL_MS = 1500;

// Model fallback priority chain
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-8b'
];

export interface MeetingAnalysisResult {
  transcript: string;
  summary: string;
  keyPoints: string[];
  actionItems: Array<{ text: string; assignee?: string; dueDate?: string }>;
  keywords: string[];
  studyCards: Array<{ question: string; answer: string }>;
  speakerDetection: Array<{ speaker: string; text: string; feedback?: string }>;
  speakerBreakdown: Array<{ speaker: string; percentage: number; topics: string[] }>;
  analysis: {
    sentiment: string;
    productivity: string;
    decisions: string[];
    risks: string[];
  };
  hasContent: boolean;
}

const getMimeType = (blob: Blob) => blob.type || "audio/webm";

const getAudioExtension = (mimeType: string) => {
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
};

const createUploadableAudio = (audioBlob: Blob) => {
  const mimeType = getMimeType(audioBlob);
  if (typeof File !== "undefined" && audioBlob instanceof File && audioBlob.name) {
    return audioBlob;
  }
  return new File([audioBlob], `meeting-audio-${Date.now()}.${getAudioExtension(mimeType)}`, {
    type: mimeType,
  });
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || '';
      resolve(base64Data);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Request cancelled", "AbortError"));
      return;
    }

    const timeout = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      window.clearTimeout(timeout);
      reject(new DOMException("Request cancelled", "AbortError"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });

const withAbortSignal = <T extends Record<string, unknown>>(config: T, signal?: AbortSignal): T =>
  signal ? { ...config, abortSignal: signal } : config;

const waitForActiveFile = async (
  ai: GoogleGenAI,
  uploadedFile: GeminiFile,
  signal?: AbortSignal
) => {
  if (!uploadedFile.name) return uploadedFile;

  const startedAt = Date.now();
  let file = uploadedFile;

  while (file.state === FileState.PROCESSING && Date.now() - startedAt < FILE_PROCESSING_TIMEOUT_MS) {
    await wait(FILE_PROCESSING_POLL_MS, signal);
    file = await ai.files.get({
      name: uploadedFile.name,
      config: withAbortSignal({}, signal),
    });
  }

  if (file.state === FileState.FAILED) {
    throw new Error(file.error?.message || "Audio upload failed while Gemini processed the file.");
  }

  if (file.state === FileState.PROCESSING) {
    throw new Error("Audio upload is still processing. Please try again with a shorter recording.");
  }

  return file;
};

const prepareAudioPart = async (ai: GoogleGenAI, audioBlob: Blob, signal?: AbortSignal) => {
  if (audioBlob.size > MAX_AUDIO_UPLOAD_BYTES) {
    throw new Error("Audio file is larger than 50 MB. Please trim or split the recording and try again.");
  }

  const mimeType = getMimeType(audioBlob);

  // For small-to-medium audio (<= 20MB), use fast inline base64
  if (audioBlob.size <= MAX_INLINE_AUDIO_BYTES) {
    const base64Data = await blobToBase64(audioBlob);
    return {
      part: {
        inlineData: {
          mimeType: mimeType || "audio/webm",
          data: base64Data
        }
      },
      uploadedFile: null
    };
  }

  // For larger audio, use Files API
  const audioFile = createUploadableAudio(audioBlob);
  const uploadedFile = await ai.files.upload({
    file: audioFile,
    config: withAbortSignal(
      {
        mimeType,
        displayName: audioFile.name || `meeting-audio-${Date.now()}.${getAudioExtension(mimeType)}`,
      },
      signal
    ),
  });

  const activeFile = await waitForActiveFile(ai, uploadedFile, signal);
  if (!activeFile.uri) {
    throw new Error("Gemini did not return a usable file URI for the uploaded audio.");
  }

  return {
    part: createPartFromUri(activeFile.uri, activeFile.mimeType || mimeType),
    uploadedFile: activeFile,
  };
};

const cleanupUploadedFile = async (ai: GoogleGenAI, uploadedFile: GeminiFile | null, signal?: AbortSignal) => {
  if (!uploadedFile?.name || signal?.aborted) return;

  try {
    await ai.files.delete({
      name: uploadedFile.name,
      config: withAbortSignal({}, signal),
    });
  } catch (error) {
    console.warn("Could not delete uploaded Gemini audio file:", error);
  }
};

const generateWithModelFallback = async (
  ai: GoogleGenAI,
  buildRequestParams: (modelName: string) => any
) => {
  let lastError: any = null;

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      const params = buildRequestParams(modelName);
      const response = await ai.models.generateContent(params);
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      console.warn(`Gemini model ${modelName} failed, trying fallback:`, err?.message || err);
      lastError = err;
      // Continue to next model in chain
    }
  }

  throw lastError || new Error("All Gemini models failed to generate content.");
};

const parseJsonResponse = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (_) {
    const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (fencedJson) return JSON.parse(fencedJson);

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }

    throw new Error("Invalid AI response format");
  }
};

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const asArray = <T = unknown>(value: unknown): T[] =>
  Array.isArray(value) ? value : [];

const normalizeAnalysis = (value: any, transcriptFallback = ""): MeetingAnalysisResult => ({
  transcript: asString(value?.transcript, transcriptFallback),
  summary: asString(value?.summary, value?.hasContent === false ? "No clear speech was detected." : ""),
  keyPoints: asArray<string>(value?.keyPoints),
  actionItems: asArray<{ text: string; assignee?: string; dueDate?: string }>(value?.actionItems),
  keywords: asArray<string>(value?.keywords),
  studyCards: asArray<{ question: string; answer: string }>(value?.studyCards),
  speakerDetection: asArray<{ speaker: string; text: string; feedback?: string }>(value?.speakerDetection),
  speakerBreakdown: asArray<{ speaker: string; percentage: number; topics: string[] }>(value?.speakerBreakdown),
  analysis: {
    sentiment: asString(value?.analysis?.sentiment, "Neutral"),
    productivity: asString(value?.analysis?.productivity, "Not enough content to assess."),
    decisions: asArray<string>(value?.analysis?.decisions),
    risks: asArray<string>(value?.analysis?.risks),
  },
  hasContent: typeof value?.hasContent === "boolean" ? value.hasContent : true,
});

export const geminiService = {
  processAudio: async (audioBlob: Blob, apiKey: string, signal?: AbortSignal): Promise<MeetingAnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey });
    let uploadedFile: GeminiFile | null = null;

    const prompt = `
      You are a professional meeting assistant. 
      IMPORTANT: Be strictly evidence-based. Only transcribe and analyze what is actually heard in the audio.
      If the audio is silent, contains only noise, or has no clear speech, state that explicitly in the summary and leave other fields empty.
      DO NOT hallucinate or make up a generic meeting summary.
      
      1. Transcribe the provided audio accurately with speaker detection (e.g., Speaker 1: ..., Speaker 2: ...).
      2. Provide a concise summary of the discussion.
      3. Extract key action items (task, assignee, deadline).
      4. Extract key discussion points.
      5. Extract important keywords and topics.
      6. Generate 3-5 study cards (question and answer) based on the meeting content.
      7. Provide a speaker breakdown (percentage of time spoken and main topics per speaker).
      8. Perform an in-depth analysis:
          - Sentiment (overall mood)
          - Meeting productivity (how efficient was the discussion?)
          - Important decisions made
          - Risks identified
      
      Format the response as JSON with the following structure:
      {
        "transcript": "...",
        "summary": "...",
        "keyPoints": ["..."],
        "actionItems": [{"text": "...", "assignee": "...", "dueDate": "..."}],
        "keywords": ["..."],
        "studyCards": [{"question": "...", "answer": "..."}],
        "speakerDetection": [{"speaker": "...", "text": "..."}],
        "speakerBreakdown": [{"speaker": "...", "percentage": 0, "topics": ["..."]}],
        "analysis": {
          "sentiment": "...",
          "productivity": "...",
          "decisions": ["..."],
          "risks": ["..."]
        },
        "hasContent": true/false
      }
    `;

    try {
      const audioPrep = await prepareAudioPart(ai, audioBlob, signal);
      uploadedFile = audioPrep.uploadedFile;

      const response = await generateWithModelFallback(ai, (model) => ({
        model,
        contents: [
          {
            parts: [
              { text: prompt },
              audioPrep.part
            ]
          }
        ],
        config: withAbortSignal(
          {
            responseMimeType: "application/json",
          },
          signal
        )
      }));

      const text = response.text;
      if (!text) throw new Error("Invalid AI response format");

      return normalizeAnalysis(parseJsonResponse(text));
    } finally {
      await cleanupUploadedFile(ai, uploadedFile, signal);
    }
  },

  transcribeOnly: async (audioBlob: Blob, apiKey: string, signal?: AbortSignal): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });
    let uploadedFile: GeminiFile | null = null;

    const prompt = `
      Transcribe the provided audio accurately. 
      Be strictly evidence-based. Only transcribe what is actually heard.
      If there is no speech, return an empty string.
      Do not add any commentary or summaries. Just the transcript.
    `;

    try {
      const audioPrep = await prepareAudioPart(ai, audioBlob, signal);
      uploadedFile = audioPrep.uploadedFile;

      const response = await generateWithModelFallback(ai, (model) => ({
        model,
        contents: [
          {
            parts: [
              { text: prompt },
              audioPrep.part
            ]
          }
        ],
        config: withAbortSignal({}, signal),
      }));

      return response.text || "";
    } finally {
      await cleanupUploadedFile(ai, uploadedFile, signal);
    }
  },

  processTranscript: async (transcript: string, apiKey: string, signal?: AbortSignal): Promise<MeetingAnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are a professional meeting assistant. 
      Analyze the provided meeting transcript.
      
      1. Provide a concise summary of the discussion.
      2. Extract key action items (task, assignee, deadline).
      3. Extract key discussion points.
      4. Extract important keywords and topics.
      5. Generate 3-5 study cards (question and answer) based on the content.
      6. Provide a speaker breakdown if possible (percentage of time spoken and main topics per speaker).
      7. Perform an in-depth analysis:
         - Sentiment (overall mood)
         - Meeting productivity (how efficient was the discussion?)
         - Important decisions made
         - Risks identified
      
      Format the response as JSON with the following structure:
      {
        "summary": "...",
        "keyPoints": ["..."],
        "actionItems": [{"text": "...", "assignee": "...", "dueDate": "..."}],
        "keywords": ["..."],
        "studyCards": [{"question": "...", "answer": "..."}],
        "speakerBreakdown": [{"speaker": "...", "percentage": 0, "topics": ["..."]}],
        "analysis": {
          "sentiment": "...",
          "productivity": "...",
          "decisions": ["..."],
          "risks": ["..."]
        }
      }
    `;

    const response = await generateWithModelFallback(ai, (model) => ({
      model,
      contents: [{ parts: [{ text: prompt + "\n\nTranscript:\n" + transcript }] }],
      config: withAbortSignal({ responseMimeType: "application/json" }, signal)
    }));

    const text = response.text;
    if (!text) throw new Error("Invalid AI response format");
    return normalizeAnalysis(parseJsonResponse(text), transcript);
  },

  askAssistant: async (context: string, question: string, apiKey: string, signal?: AbortSignal) => {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are a helpful meeting assistant. 
      Use the following meeting context to answer the user's question.
      Context: ${context}
      
      Question: ${question}
      
      Provide a concise, professional, and helpful answer.
    `;

    const response = await generateWithModelFallback(ai, (model) => ({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: withAbortSignal({}, signal)
    }));

    return response.text || "I couldn't generate an answer. Please try again.";
  }
};

