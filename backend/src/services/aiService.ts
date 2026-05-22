import Groq from 'groq-sdk';
import {
  GoogleGenerativeAI,
  GenerationConfig,
} from '@google/generative-ai';
import { IQuestionType } from '../models/Assignment';
import { ISection } from '../models/Result';

// ── Clients ───────────────────────────────────────────────────────────────────
const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const geminiClient = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ''
);

const GROQ_MODEL = 'openai/gpt-oss-120b';
const GEMINI_MODEL = 'gemini-2.0-flash-001';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface GenerationInput {
  title: string;
  subject: string;
  branch: string;
  questionTypes: IQuestionType[];
  additionalInstructions?: string;
  fileContent?: string;
}

export interface GeneratedPaper {
  sections: ISection[];
  totalMarks: number;
  totalQuestions: number;
  provider: 'groq' | 'gemini'; // useful for debugging/logging
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const SECTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const DIFFICULTY_MAP: Record<string, 'easy' | 'moderate' | 'hard'> = {
  'multiple choice': 'easy',
  mcq: 'easy',
  'fill in': 'easy',
  'true/false': 'easy',
  short: 'moderate',
  diagram: 'moderate',
  long: 'hard',
  essay: 'hard',
  numerical: 'hard',
  application: 'hard',
  descriptive: 'hard',
};

const inferDifficulty = (type: string): 'easy' | 'moderate' | 'hard' => {
  const lower = type.toLowerCase();
  for (const [key, val] of Object.entries(DIFFICULTY_MAP)) {
    if (lower.includes(key)) return val;
  }
  return 'moderate';
};

// ── Prompt Builder ────────────────────────────────────────────────────────────
const buildPrompt = (input: GenerationInput): string => {
  const sectionsSpec = input.questionTypes
    .map((qt, i) => {
      const label = SECTION_LABELS[i] ?? String.fromCharCode(65 + i);
      return `Section ${label}: ${qt.type} — ${qt.count} question(s), ${qt.marks} mark(s) each`;
    })
    .join('\n');

  const contextBlock = input.fileContent
    ? `\n\nSource material to base questions on:\n"""\n${input.fileContent.substring(0, 3000)}\n"""`
    : '';

  const instructionsBlock = input.additionalInstructions
    ? `\n\nTeacher instructions: ${input.additionalInstructions}`
    : '';

  return `Generate a complete exam question paper for the following assignment.

Title: ${input.title}
Subject: ${input.subject}
Branch / Class: ${input.branch || 'Not specified'}

Paper structure:
${sectionsSpec}${contextBlock}${instructionsBlock}

Rules:
- Generate EXACTLY the number of questions specified per section
- Make questions realistic and appropriate for an exam
- Do NOT number questions (the UI handles numbering)
- difficulty must be one of: "easy", "moderate", "hard"

Return ONLY valid JSON — no markdown, no explanation — matching this exact schema:
{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries N mark(s).",
      "questions": [
        {
          "text": "Question text here",
          "difficulty": "easy",
          "marks": 1,
          "type": "Multiple Choice Questions"
        }
      ]
    }
  ]
}`;
};

const SYSTEM_PROMPT =
  'You are an expert exam paper generator. Always return valid JSON only — no markdown, no explanation.';

// ── Response Parser ───────────────────────────────────────────────────────────
const validateAndParse = (
  raw: string,
  input: GenerationInput
): Omit<GeneratedPaper, 'provider'> => {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: { sections: ISection[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`AI returned invalid JSON:\n${cleaned.substring(0, 200)}`);
  }

  if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
    throw new Error('Response missing sections array');
  }

  const sections: ISection[] = parsed.sections.map((section, sIdx) => {
    const qt = input.questionTypes[sIdx];
    const questions = Array.isArray(section.questions) ? section.questions : [];

    return {
      title: section.title || `Section ${SECTION_LABELS[sIdx] ?? sIdx + 1}`,
      instruction: section.instruction || 'Attempt all questions.',
      questions: questions.map((q) => ({
        text: String(q.text || '').trim(),
        difficulty: (['easy', 'moderate', 'hard'].includes(q.difficulty)
          ? q.difficulty
          : inferDifficulty(qt?.type ?? '')) as 'easy' | 'moderate' | 'hard',
        marks: Number(q.marks) || qt?.marks || 1,
        type: String(q.type || qt?.type || 'Question'),
      })),
    };
  });

  const totalQuestions = sections.reduce((s, sec) => s + sec.questions.length, 0);
  const totalMarks = sections.reduce(
    (s, sec) => s + sec.questions.reduce((qs, q) => qs + q.marks, 0),
    0
  );

  return { sections, totalMarks, totalQuestions };
};

// ── Provider: Groq ────────────────────────────────────────────────────────────
const generateWithGroq = async (
  input: GenerationInput
): Promise<GeneratedPaper> => {
  const userPrompt = buildPrompt(input);

  const response = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: 'json_object' }, // enforces JSON output
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const rawContent = response.choices[0]?.message?.content || '';

  if (!rawContent) {
    throw new Error('Groq returned empty content');
  }

  return { ...validateAndParse(rawContent, input), provider: 'groq' };
};

// ── Provider: Gemini ──────────────────────────────────────────────────────────
const generateWithGemini = async (
  input: GenerationInput
): Promise<GeneratedPaper> => {
  const userPrompt = buildPrompt(input);

  const generationConfig: GenerationConfig = {
    temperature: 0.7,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json', // native JSON mode — no parsing issues
  };

  const model = geminiClient.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig,
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent(userPrompt);
  const rawContent = result.response.text();

  if (!rawContent) {
    throw new Error('Gemini returned empty content');
  }

  return { ...validateAndParse(rawContent, input), provider: 'gemini' };
};

// ── Main Export — Groq first, Gemini fallback ─────────────────────────────────
export const generateQuestionPaper = async (
  input: GenerationInput
): Promise<GeneratedPaper> => {
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    throw new Error('No AI provider configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env');
  }

  // ── Try Groq first ──
  if (process.env.GROQ_API_KEY) {
    try {
      console.log('[AI] Using Groq (primary)');
      return await generateWithGroq(input);
    } catch (groqError: any) {
      const isRateLimit =
        groqError?.status === 429 ||
        groqError?.message?.toLowerCase().includes('rate limit') ||
        groqError?.message?.toLowerCase().includes('quota');

      console.warn(
        `[AI] Groq failed (${isRateLimit ? 'rate limit' : 'error'}): ${groqError?.message}. Falling back to Gemini.`
      );

      // Only fall back if Gemini is configured
      if (!process.env.GEMINI_API_KEY) {
        throw groqError;
      }
    }
  }

  // ── Gemini fallback ──
  console.log('[AI] Using Gemini (fallback)');
  return await generateWithGemini(input);
};
