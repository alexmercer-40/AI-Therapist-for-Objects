export type Mode = "monologue" | "haiku" | "dialogue" | "minimal";
export type Tone = "warm" | "playful" | "wise" | "matter_of_fact";
export type Length = "short" | "medium" | "long";
export type ReadingLevel = "plain" | "childlike" | "lyrical";
export type NudgeStyle = "wellness" | "tidy" | "gratitude" | "boundary" | "humor";

export interface Controls {
  mode?: Mode;
  tone?: Tone;
  length?: Length;
  reading_level?: ReadingLevel;
  language?: string; // BCP47 language tag
  nudge_style?: NudgeStyle;
  allow_gentle_humor?: boolean;
  cultural_context?: string | "auto";
}

export interface MonologueResponse {
  object_name: string;
  setting: string;
  inferred_details: string[];
  mode: Mode;
  tone: Tone;
  language: string;
  monologue: string;
  actions: string[];
}

// For sending to Gemini API
export interface ApiChatMessage {
  role: 'user' | 'model';
  parts: any[]; 
}

// For rendering in the UI
export interface DisplayMessage {
    sender: 'user' | 'object';
    text: string;
    // The initial response has more details we want to preserve
    responseDetails?: MonologueResponse;
}
