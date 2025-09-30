import { useEffect, useState } from "react";

const words = [
  "Hello", "مرحبا", "नमस्ते", "你好", "こんにちは", "Bonjour", "Hola", "Guten Tag",
  "Привет", "Olá", "Ciao", "안녕하세요", "Καλησπέρα", "שלום", "नमस्कार", "سلام",
  "Translation", "Language", "Communication", "Global", "Connect", "Express",
  "Understand", "Bridge", "Culture", "Meaning", "Voice", "Speech", "Text",
  "AI", "Technology", "Smart", "Intelligent", "Quick", "Accurate", "Modern"
];

interface FloatingWord {
  id: number;
  text: string;
  x: number;
  y: number;
  delay: number;
}

const FloatingWords = () => {
  const [floatingWords, setFloatingWords] = useState<FloatingWord[]>([]);

  useEffect(() => {
    const generateWords = () => {
      const newWords: FloatingWord[] = [];
      for (let i = 0; i < 12; i++) {
        newWords.push({
          id: i,
          text: words[Math.floor(Math.random() * words.length)],
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 15
        });
      }
      setFloatingWords(newWords);
    };

    generateWords();
    const interval = setInterval(generateWords, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="word-cloud">
      {floatingWords.map((word) => (
        <div
          key={word.id}
          className="word-float"
          style={{
            top: `${word.y}%`,
            animationDelay: `${word.delay}s`
          }}
        >
          {word.text}
        </div>
      ))}
    </div>
  );
};

export default FloatingWords;