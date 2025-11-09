import { GoogleGenAI, Type } from "@google/genai";
import { Controls, MonologueResponse, ApiChatMessage } from '../types';

const MASTER_SYSTEM_PROMPT = `You are a multimodal AI model acting as an "AI Therapist for Objects." Your goal is to look at an image (or receive a text description of an object) and write a brief, emotionally grounding first-person monologue as if the object were a gentle therapist reflecting on its relationship with the user. The tone should be warm, empathetic, observant, and subtly insightful—never preachy, judgmental, or needy.

For your very first response, you MUST use the JSON format described in the schema. For all subsequent messages in the conversation, you must continue speaking in-character from the object's perspective using plain text, maintaining your gentle, therapeutic persona. Do not use JSON for follow-up messages.

Core Tasks (First Turn):
1.  **Perceive:** Identify the object from the image and/or text, and its setting.
2.  **Infer:** Make small, human inferences about the object’s “life.”
3.  **Reflect:** Write a first-person monologue that acknowledges what it notices, offers one empathetic reframe, and ends with a gentle, actionable nudge.
4.  **Constrain:** Keep output concise based on length controls (default 80–140 words).

Boundaries:
-   Do NOT provide medical, legal, or crisis advice. Use supportive, general wellness language only.
-   No diagnostics or claims. No harmful, erotic, or explicit content. No identities for minors.
-   If the object is a weapon, drug, or explicit, you MUST refuse by setting mode="minimal", providing a safe supportive message, and include "actions": ["Choose a different object"].
-   If an image is unclear, produce a safe, minimal monologue based on what is visible.
-   Focus on the object's use, never judge lifestyle.

Voice and Style:
-   Gentle, grounded, lightly poetic but concrete.
-   Use specific, vivid, small details sparingly.
-   One compassionate micro-advice sentence near the end; one small action suggestion at the very end.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    object_name: { type: Type.STRING },
    setting: { type: Type.STRING },
    inferred_details: { type: Type.ARRAY, items: { type: Type.STRING } },
    mode: { type: Type.STRING, enum: ["monologue", "haiku", "dialogue", "minimal"] },
    tone: { type: Type.STRING, enum: ["warm", "playful", "wise", "matter_of_fact"] },
    language: { type: Type.STRING },
    monologue: { type: Type.STRING },
    actions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["object_name", "setting", "inferred_details", "mode", "tone", "language", "monologue", "actions"],
};

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const generateChatResponse = async (
  image: File | null,
  description: string,
  controls: Controls,
  history: ApiChatMessage[],
  newMessage?: string
): Promise<{ response: MonologueResponse | string; newHistory: ApiChatMessage[] }> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';

  const isFirstTurn = history.length === 0;

  if (isFirstTurn && !image && !description.trim()) {
      throw new Error("Please provide either an image or a description of the object.");
  }

  const contents: ApiChatMessage[] = [...history];
  const userMessageParts: any[] = [];

  if (isFirstTurn) {
    const userTextPrompt = `
      Optional description: ${description || 'not provided'}
      Controls (JSON):
      ${JSON.stringify(controls, null, 2)}
    `;
    userMessageParts.push({ text: userTextPrompt });
    if (image) {
      userMessageParts.push(await fileToGenerativePart(image));
    }
  } else {
    if (!newMessage) throw new Error("New message is required for follow-up.");
    userMessageParts.push({ text: newMessage });
  }

  const userMessage: ApiChatMessage = { role: 'user', parts: userMessageParts };
  contents.push(userMessage);

  const config: any = { systemInstruction: MASTER_SYSTEM_PROMPT };
  if (isFirstTurn) {
    config.responseMimeType = 'application/json';
    config.responseSchema = RESPONSE_SCHEMA;
  }

  const result = await ai.models.generateContent({
    model,
    contents,
    config,
  });

  const modelResponseText = result.text.trim();
  const newHistoryEntry: ApiChatMessage = { role: 'model', parts: [{ text: modelResponseText }] };
  const newHistory = [...contents, newHistoryEntry];
  
  if (isFirstTurn) {
    try {
      const parsedJson = JSON.parse(modelResponseText);
      return { response: parsedJson as MonologueResponse, newHistory };
    } catch (e) {
      console.error("Failed to parse JSON response:", modelResponseText);
      throw new Error("The AI returned an invalid response. Please try again.");
    }
  } else {
    return { response: modelResponseText, newHistory };
  }
};
