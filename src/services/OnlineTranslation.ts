// OnlineTranslation.ts
// Uses Supabase Edge Function to translate text with paragraph and chunk handling

export class OnlineTranslationService {
  private endpoint = "https://aluodstxvbofgychxahg.functions.supabase.co/translate"; // from supabase/config.toml project_id

  // Split text into manageable chunks while preserving paragraph boundaries
  private chunkText(text: string, maxLen = 2000): string[] {
    const paragraphs = text.split(/\r?\n\r?\n/); // keep blank line as paragraph break
    const chunks: string[] = [];
    let current = "";

    const flush = () => {
      if (current.trim().length) chunks.push(current);
      current = "";
    };

    for (const p of paragraphs) {
      // If a single paragraph exceeds maxLen, split by sentences
      if (p.length > maxLen) {
        const sentences = p.split(/(?<=[.!?।॥])\s+/);
        for (const s of sentences) {
          if ((current + (current ? " " : "") + s).length > maxLen) {
            flush();
          }
          current += (current ? " " : "") + s;
        }
        flush();
      } else {
        const paragraphWithBreak = current ? current + "\n\n" + p : p;
        if (paragraphWithBreak.length > maxLen) {
          flush();
          current = p;
          flush();
        } else {
          current = paragraphWithBreak;
        }
      }
    }
    flush();
    return chunks.length ? chunks : [text];
  }

  public async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const chunks = this.chunkText(text);
    const out: string[] = [];

    for (const chunk of chunks) {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chunk, sourceLang, targetLang })
      });
      if (!res.ok) {
        throw new Error(`Online translation failed: ${res.status}`);
      }
      const data = await res.json();
      const translated: string = data.translation ?? chunk;
      out.push(translated);
    }

    return out.join("\n\n");
  }
}

export const onlineTranslationService = new OnlineTranslationService();
