import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mic, Volume2, Copy, Trash2, Download, Loader2, MessageSquare, ArrowRightLeft, Sparkles } from "lucide-react";
import ChatBot from "@/components/ChatBot";
import ModernHero from "@/components/ModernHero";
import FloatingWords from "@/components/FloatingWords";
import AnimatedBackground from "@/components/AnimatedBackground";
import ScrollControls from "@/components/ScrollControls";
import FileUpload from "@/components/FileUpload";
import OfflineLanguagePacks from "@/components/OfflineLanguagePacks";
import { offlineTranslationService } from "@/services/OfflineTranslation";
import { fallbackTranslationService } from "@/services/FallbackTranslation";
import { onlineTranslationService } from "@/services/OnlineTranslation";

const languages = [
  { code: "en", name: "English" },
  { code: "ne", name: "Nepali" },
  { code: "si", name: "Sinhala" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "ur", name: "Urdu" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "ru", name: "Russian" },
  { code: "pt", name: "Portuguese" },
];

// Allowed translation targets: English only
const targetLanguages = languages.filter(l => ["en"].includes(l.code));


const Index = () => {
  const [inputText, setInputText] = useState("");
  const [translation, setTranslation] = useState("");
  const [sourceLang, setSourceLang] = useState("ne");
  const [targetLang, setTargetLang] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'offline'>('text');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const outputRef = React.useRef<HTMLTextAreaElement>(null);

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      toast({ title: "Please enter some text", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    console.log(`Starting translation: "${inputText}" from ${sourceLang} to ${targetLang}`);
    
    try {
      let translatedText = "";
      let translationMethod = "";
      
      // Check if we can use offline translation
      const canUseOffline = offlineTranslationService.isLanguagePackDownloaded(sourceLang);
      const isDeviceOnline = navigator.onLine;
      
      if (canUseOffline && (!isDeviceOnline || activeTab === 'offline')) {
        // Use offline translation
        try {
          translatedText = await offlineTranslationService.translateOffline(inputText, sourceLang, targetLang);
          translationMethod = "Offline (Downloaded Pack)";
        } catch (offlineError) {
          console.warn('Offline translation failed:', offlineError);
          // Fall back to basic translation
          translatedText = await fallbackTranslationService.translate(inputText, sourceLang, targetLang);
          translationMethod = "Offline (Basic Dictionary)";
        }
      } else if (isDeviceOnline) {
        // Online: try Supabase Edge Function first, then local fallback
        console.log('Attempting online translation via Supabase Edge Function...');
        try {
          translatedText = await onlineTranslationService.translate(inputText, sourceLang, targetLang);
          translationMethod = "Online (Supabase)";
        } catch (onlineError) {
          console.warn('Online translation failed, falling back to local dictionary:', onlineError);
          translatedText = await fallbackTranslationService.translate(inputText, sourceLang, targetLang);
          translationMethod = "Local Dictionary";
        }
      } else {
        // Device offline, use fallback translation
        console.log('Device offline, using fallback translation');
        translatedText = await fallbackTranslationService.translate(inputText, sourceLang, targetLang);
        translationMethod = "Offline (Basic Dictionary)";
        console.log(`Offline fallback result: ${translatedText}`);
      }

      setTranslation(translatedText);
      
      // Show simple success message
      toast({ 
        title: "Translation complete!" 
      });
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Translation failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({ title: "Speech recognition not supported", variant: "destructive" });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = sourceLang === "ne" ? "ne-NP" : sourceLang === "si" ? "si-LK" : `${sourceLang}-${sourceLang.toUpperCase()}`;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      toast({ title: "Speech captured!" });
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      toast({ title: "Speech recognition error", description: event.error, variant: "destructive" });
    };

    recognition.start();
  };

  const speak = () => {
    if (!translation) {
      toast({ title: "No translation to speak", variant: "destructive" });
      return;
    }

    const utterance = new SpeechSynthesisUtterance(translation);
    const langMap: { [key: string]: string } = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'hi': 'hi-IN',
      'ne': 'ne-NP',
      'si': 'si-LK',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'ar': 'ar-SA',
      'ru': 'ru-RU',
      'pt': 'pt-BR',
      'bn': 'bn-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'ur': 'ur-PK'
    };
    utterance.lang = langMap[targetLang] || 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const copyTranslation = () => {
    navigator.clipboard.writeText(translation);
    toast({ title: "Copied to clipboard!" });
  };

  const clearAll = () => {
    setInputText("");
    setTranslation("");
  };

  const downloadTranslation = () => {
    const element = document.createElement("a");
    const file = new Blob([translation], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "translation.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({ title: "Translation downloaded!" });
  };

  const handleTextExtracted = (extractedText: string) => {
    setInputText(extractedText);
    setActiveTab('text'); // Switch to text tab after extraction
    toast({ title: "Text extracted successfully!", description: "Ready for translation" });
  };

// Monitor online/offline status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Ensure target language stays within allowed set (English only)
    if (!targetLanguages.find(t => t.code === targetLang)) {
      setTargetLang('en');
    }
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [targetLang]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Floating Words Background */}
      <FloatingWords />
      
      {/* Modern Hero Section */}
      <ModernHero />
      
      {/* Main Translation Interface */}
      <div className="relative z-10 px-4 md:px-8 pb-8">
        <div className="max-w-6xl mx-auto">

          {/* Translation Interface Header */}
<div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center space-x-3 bg-purple-900/70 backdrop-blur-md px-6 py-3 rounded-full border border-purple-400/60">
              <Sparkles className="h-5 w-5 text-purple-300" />
              <span className="text-lg font-semibold text-white drop-shadow-lg">
                Translation Workspace
              </span>
              <Sparkles className="h-5 w-5 text-cyan-300" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Input Card with Tabs */}
            <Card className="glass-card p-8 animate-scale-in neon-glow border border-primary/20 hover:border-primary/40 transition-all duration-500 group relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse"></div>
                  <label className="text-lg font-bold text-gray-900 drop-shadow-lg">
                    Input Source
                  </label>
                </div>
                <Select value={sourceLang} onValueChange={setSourceLang}>
<SelectTrigger className="w-44 glass-card border-primary/30 hover:border-primary/50 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-primary/30">
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code} className="hover:bg-primary/10">
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-6 bg-gray-100/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'text'
? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  📝 Text Input
                </button>
                <button
                  onClick={() => setActiveTab('file')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'file'
? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  📁 File Upload
                </button>
                <button
                  onClick={() => setActiveTab('offline')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 relative ${
                    activeTab === 'offline'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  🚫 Offline Mode
                  {!isOnline && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </button>
              </div>
              
              {/* Tab Content */}
              {activeTab === 'text' ? (
                <>
                  <Textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="✨ Type your text here or use voice input..."
                    className="min-h-[200px] max-h-[420px] mb-6 resize-none glass-card border-primary/20 focus:border-primary/40 bg-background/50 backdrop-blur-sm floating-words overflow-y-auto"
                  />
                  <ScrollControls targetRef={inputRef as any} deps={[inputText]} />
                  <div className="flex gap-3">
                    <Button
                      onClick={startListening}
                      disabled={isListening}
                      variant="outline"
className="flex-1 glass-card border-primary/30 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 group-hover:scale-[1.02]"
                    >
                      <Mic className={`mr-2 h-4 w-4 ${isListening ? 'animate-pulse text-destructive' : 'text-primary'}`} />
                      {isListening ? "🎤 Listening..." : "🎤 Record"}
                    </Button>
                    <Button 
                      onClick={handleTranslate} 
                      disabled={isLoading} 
className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 transition-all duration-300 pulse-border group-hover:scale-[1.02]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ✨ Translating...
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          ⚡ Translate
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : activeTab === 'file' ? (
                <FileUpload onTextExtracted={handleTextExtracted} />
              ) : (
                <OfflineLanguagePacks />
              )}
            </Card>

            {/* Output Card */}
<Card className="glass-card p-8 animate-scale-in neon-glow border border-accent/20 hover:border-accent/40 transition-all duration-500 group relative" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <label className="text-lg font-bold text-gray-900 drop-shadow-lg">
                    Translation ({languages.find(l => l.code === targetLang)?.name || 'English'})
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={speak} 
                    variant="ghost" 
                    size="sm" 
                    disabled={!translation}
                    className="glass-card border-accent/30 hover:border-accent/50 hover:bg-accent/10 transition-all duration-300"
                  >
                    <Volume2 className="h-4 w-4 text-accent" />
                  </Button>
                </div>
              </div>
              <Textarea
                ref={outputRef}
                value={translation}
                readOnly
                placeholder="🌟 Your translation will appear here like magic..."
                className="min-h-[200px] max-h-[420px] mb-6 resize-none glass-card border-accent/20 bg-background/50 backdrop-blur-sm floating-words overflow-y-auto"
              />
              <ScrollControls targetRef={outputRef as any} deps={[translation]} />
              <div className="flex gap-3">
                <Button 
                  onClick={copyTranslation} 
                  disabled={!translation} 
                  variant="outline" 
className="glass-card border-accent/30 hover:border-accent/50 hover:bg-accent/10 transition-all duration-300 group-hover:scale-[1.02]"
                >
                  <Copy className="h-4 w-4 text-accent mr-2" />
                  📋 Copy
                </Button>
                <Button 
                  onClick={downloadTranslation} 
                  disabled={!translation} 
                  variant="outline" 
                  className="glass-card border-accent/30 hover:border-accent/50 hover:bg-accent/10 transition-all duration-300 group-hover:scale-[1.02]"
                >
                  <Download className="h-4 w-4 text-accent mr-2" />
                  💾 Save
                </Button>
                <Button 
                  onClick={clearAll} 
                  variant="outline" 
className="ml-auto glass-card border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10 transition-all duration-300 group-hover:scale-[1.02]"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  🗑️ Clear
                </Button>
              </div>
            </Card>
        </div>

          {/* AI Chatbot Toggle */}
<div className="text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="inline-flex items-center space-x-4 mb-6">
              <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent flex-1"></div>
              <div className="flex items-center space-x-2 px-4 py-2 bg-purple-900/70 backdrop-blur-md border border-purple-400/60 rounded-full">
                <MessageSquare className="h-4 w-4 text-purple-300" />
                <span className="text-sm font-medium text-white">AI Assistant</span>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent flex-1"></div>
            </div>
            <Button
              onClick={() => setShowChat(!showChat)}
              size="lg"
className={`morph-shape bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 transition-all duration-500 transform hover:scale-105 neon-glow ${showChat ? 'animate-pulse' : ''}`}
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              {showChat ? "🙈 Hide" : "🤖 Open"} AI Chatbot
            </Button>
          </div>

          {showChat && (
<div className="mt-8 animate-scale-in">
              <div className="glass-card border border-primary/20 rounded-2xl overflow-hidden">
                <ChatBot />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
