/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

export const geminiService = {
  processAudio: async (audioBlob: Blob, apiKey: string) => {
    const ai = new GoogleGenAI({ apiKey });

    // Convert blob to base64
    const base64Audio = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.readAsDataURL(audioBlob);
    });

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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: audioBlob.type,
                data: base64Audio
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("Invalid AI response format");
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");
    
    return JSON.parse(jsonMatch[0]);
  },

  transcribeOnly: async (audioBlob: Blob, apiKey: string) => {
    const ai = new GoogleGenAI({ apiKey });

    const base64Audio = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.readAsDataURL(audioBlob);
    });

    const prompt = `
      Transcribe the provided audio accurately. 
      Be strictly evidence-based. Only transcribe what is actually heard.
      If there is no speech, return an empty string.
      Do not add any commentary or summaries. Just the transcript.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: audioBlob.type,
                data: base64Audio
              }
            }
          ]
        }
      ]
    });

    return response.text || "";
  },

  processTranscript: async (transcript: string, apiKey: string) => {
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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt + "\n\nTranscript:\n" + transcript }] }],
      config: { responseMimeType: "application/json" }
    });

    const text = response.text;
    if (!text) throw new Error("Invalid AI response format");
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");
    return JSON.parse(jsonMatch[0]);
  },

  askAssistant: async (context: string, question: string, apiKey: string) => {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are a helpful meeting assistant. 
      Use the following meeting context to answer the user's question.
      Context: ${context}
      
      Question: ${question}
      
      Provide a concise, professional, and helpful answer.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });

    return response.text || "I couldn't generate an answer. Please try again.";
  }
};
