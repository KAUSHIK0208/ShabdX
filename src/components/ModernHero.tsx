import { useEffect, useState } from "react";
import { Globe, Zap, MessageCircle, Sparkles } from "lucide-react";

const ModernHero = () => {
  const [textIndex, setTextIndex] = useState(0);
  const dynamicTexts = [
    "Translate Instantly",
    "Connect Globally", 
    "Bridge Languages",
    "Communicate Freely",
    "Express Yourself"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % dynamicTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Subtle overlay for content visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/10 to-background/20 backdrop-blur-[1px]"></div>
      
      {/* Floating Icons */}
      <div className="absolute inset-0 pointer-events-none">
        <Globe className="absolute top-20 left-[10%] h-6 w-6 text-primary/30 animate-bounce" style={{ animationDelay: '0s' }} />
        <MessageCircle className="absolute top-32 right-[20%] h-5 w-5 text-accent/30 animate-bounce" style={{ animationDelay: '1s' }} />
        <Zap className="absolute bottom-40 left-[20%] h-4 w-4 text-primary/40 animate-bounce" style={{ animationDelay: '2s' }} />
        <Sparkles className="absolute bottom-32 right-[15%] h-5 w-5 text-accent/40 animate-bounce" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 text-center py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            <span className="text-white drop-shadow-2xl font-black">
              ShabdhX
            </span>
          </h1>
          
          {/* Dynamic Subtitle */}
          <div className="h-16 md:h-20 mb-8 flex items-center justify-center">
            <h2 className="text-2xl md:text-4xl font-semibold text-white animate-fade-in drop-shadow-lg font-black">
              <span className="inline-block min-w-[300px] text-center">
                {dynamicTexts[textIndex]}
              </span>
            </h2>
          </div>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-white max-w-2xl mx-auto mb-12 animate-fade-in drop-shadow-md font-medium" style={{ animationDelay: '0.3s' }}>
            Experience the future of translation with AI-powered voice recognition, 
            real-time processing, and seamless communication across languages.
          </p>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="bg-purple-900/70 backdrop-blur-md px-6 py-3 rounded-full border border-purple-400/60 hover:bg-purple-800/70 transition-all duration-300">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-purple-300" />
                <span className="text-sm font-medium text-white font-semibold drop-shadow-lg">Instant Translation</span>
              </div>
            </div>
            <div className="bg-blue-900/70 backdrop-blur-md px-6 py-3 rounded-full border border-blue-400/60 hover:bg-blue-800/70 transition-all duration-300">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-blue-300" />
                <span className="text-sm font-medium text-white font-semibold drop-shadow-lg">Voice Recognition</span>
              </div>
            </div>
            <div className="bg-cyan-900/70 backdrop-blur-md px-6 py-3 rounded-full border border-cyan-400/60 hover:bg-cyan-800/70 transition-all duration-300">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-cyan-300" />
                <span className="text-sm font-medium text-white font-semibold drop-shadow-lg">25+ Languages</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernHero;