/// <reference lib="dom" />
/// <reference lib="esnext" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Provide a minimal type declaration so editors don't underline `Deno` in non-Deno toolchains
declare const Deno: {
  env: { get(name: string): string | undefined };
};

type TranslatePayload = {
  text?: string;
  sourceLang?: string;
  targetLang?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let payload: TranslatePayload = {};
    try {
      payload = await req.json();
    } catch (_) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { text, sourceLang, targetLang = "en" } = payload; // Default to English if targetLang not provided
    if (!text || !sourceLang) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: text, sourceLang" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const GEMINI_KEY =
      Deno.env.get("GOOGLE_API_KEY") || Deno.env.get("GEMINI_API_KEY");
    const HF_KEY = Deno.env.get("HUGGINGFACE_API_KEY");

    // Helper: choose a Hugging Face model for language pair
    const resolveHFModel = (src: string, tgt: string): string | null => {
      const key = `${src}-${tgt}`;
      const map: Record<string, string> = {
        // Nepali
        "en-ne": "Helsinki-NLP/opus-mt-en-ne",
        "ne-en": "Helsinki-NLP/opus-mt-ne-en",
        // Sinhala
        "en-si": "Helsinki-NLP/opus-mt-en-si",
        "si-en": "Helsinki-NLP/opus-mt-si-en",
        // Hindi (examples, can expand)
        "en-hi": "Helsinki-NLP/opus-mt-en-hi",
        "hi-en": "Helsinki-NLP/opus-mt-hi-en",
      };
      return map[key] ?? null;
    };

    // Helper: call HF inference for one chunk
    const hfTranslateOnce = async (model: string, input: string): Promise<string> => {
      const resp = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: input }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        console.error("HuggingFace API error:", resp.status, t);
        throw new Error(`HF inference failed: ${resp.status}`);
      }
      const data = await resp.json();
      // API can return array or object depending on model
      const out = Array.isArray(data) ? data[0]?.translation_text ?? data[0]?.generated_text : (data.translation_text ?? data.generated_text);
      return typeof out === "string" ? out : input;
    };

    // Helper: translate possibly long text via HF with paragraph-safe chunking
    const hfTranslate = async (input: string, src: string, tgt: string): Promise<string> => {
      // Direct model
      const direct = resolveHFModel(src, tgt);

      // Fallback via English
      const viaEnglish = async (): Promise<string> => {
        if (src === 'en' || tgt === 'en') throw new Error('viaEnglish called unnecessarily');
        const toEn = resolveHFModel(src, 'en');
        const fromEn = resolveHFModel('en', tgt);
        if (!toEn || !fromEn) throw new Error('No HF model for pivot pair');
        const mid = await hfTranslateCore(input, toEn);
        return await hfTranslateCore(mid, fromEn);
      };

      const hfTranslateCore = async (txt: string, model: string): Promise<string> => {
        // Split by paragraphs to preserve formatting
        const paragraphs = txt.split(/\r?\n\r?\n/);
        const outputs: string[] = [];
        for (const p of paragraphs) {
          if (!p.trim()) { outputs.push(""); continue; }
          // Further split overly long paragraphs by sentences
          const pieces = p.length > 1800 ? p.split(/(?<=[.!?।॥])\s+/) : [p];
          const outPieces: string[] = [];
          for (const piece of pieces) {
            const safe = piece.length > 2000 ? piece.slice(0, 2000) : piece;
            outPieces.push(await hfTranslateOnce(model, safe));
          }
          outputs.push(outPieces.join(' '));
        }
        return outputs.join("\n\n");
      };

      if (direct) {
        return await hfTranslateCore(input, direct);
      }
      // Try pivot via English
      return await viaEnglish();
    };

    const languageNames: Record<string, string> = {
      en: "English",
      ne: "Nepali",
      si: "Sinhala",
      hi: "Hindi",
      bn: "Bengali",
      ta: "Tamil",
      te: "Telugu",
      ur: "Urdu",
      es: "Spanish",
      fr: "French",
      de: "German",
      zh: "Chinese",
      ja: "Japanese",
      ko: "Korean",
      ar: "Arabic",
      ru: "Russian",
      pt: "Portuguese",
    };

    // If a direct Gemini key is provided, use Google API directly.
    if (GEMINI_KEY) {
      const endpoint =
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
      const sourceLanguageName = languageNames[sourceLang] ?? sourceLang;
      const targetLanguageName = languageNames[targetLang] ?? targetLang;
      
      const prompt =
        `You are a professional translator. Translate the following ${sourceLanguageName} text into ${targetLanguageName}.\n` +
        `Requirements:\n` +
        `- Output MUST be entirely in ${targetLanguageName} script (no English words or explanations).\n` +
        `- Preserve paragraphs, line breaks, punctuation, lists, and formatting.\n` +
        `- Keep numbers as-is.\n` +
        `- Do not add any preface or notes. Return ONLY the translated text.\n\n` +
        `${text}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: { temperature: 0.1, topP: 0.9 },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Payment required. Please add funds to your workspace." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        const errorText = await response.text();
        console.error("Gemini API error:", response.status, errorText);
        return new Response(JSON.stringify({ error: "Translation failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await response.json();
      const translation = data.candidates?.[0]?.content?.parts?.[0]?.text;

      return new Response(
        JSON.stringify({ translation }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // If Gemini key is not configured, try Hugging Face next
    if (HF_KEY) {
      try {
        const hfOut = await hfTranslate(text, sourceLang, targetLang);
        return new Response(JSON.stringify({ translation: hfOut }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        console.warn("HF translation failed, falling back to gateway:", e);
      }
    }

    // Fallback to Lovable gateway if neither Gemini nor HF works
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY/GEMINI_API_KEY or HUGGINGFACE_API_KEY or LOVABLE_API_KEY must be configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                `You are a professional translator. Translate the given ${languageNames[sourceLang] ?? sourceLang} text to ${languageNames[targetLang] ?? targetLang}. ` +
                `Rules: Output ONLY in ${languageNames[targetLang] ?? targetLang} script, preserve paragraph breaks and punctuation, keep numbers unchanged, and do not add explanations. Return just the translation.`,
            },
            {
              role: "user",
              content: text,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Translation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const translation = data.choices?.[0]?.message?.content;

    return new Response(
      JSON.stringify({ translation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
