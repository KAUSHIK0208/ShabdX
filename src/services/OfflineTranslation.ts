// Offline Translation Service
// Manages language packs and offline translation capabilities

export interface LanguagePack {
  code: string;
  name: string;
  nativeName: string;
  version: string;
  size: number; // Size in MB
  downloadUrl: string;
  isDownloaded: boolean;
  lastUpdated: Date;
  dictionary: Map<string, string>;
}

export interface TranslationCache {
  [key: string]: {
    translation: string;
    confidence: number;
    timestamp: Date;
  };
}

class OfflineTranslationService {
  private languagePacks: Map<string, LanguagePack> = new Map();
  private translationCache: TranslationCache = {};
  private dbName = 'ShabdhXOfflineDB';
  private dbVersion = 1;

  constructor() {
    this.initializeLanguagePacks();
    this.loadCachedTranslations();
  }

  // Initialize available language packs
  private initializeLanguagePacks() {
    const packs: LanguagePack[] = [
      {
        code: 'ne',
        name: 'Nepali',
        nativeName: 'नेपाली',
        version: '1.0.0',
        size: 15.5, // MB
        downloadUrl: '/language-packs/nepali-en.pack',
        isDownloaded: false,
        lastUpdated: new Date(),
        dictionary: new Map()
      },
      {
        code: 'si',
        name: 'Sinhala',
        nativeName: 'සිංහල',
        version: '1.0.0',
        size: 12.3, // MB
        downloadUrl: '/language-packs/sinhala-en.pack',
        isDownloaded: false,
        lastUpdated: new Date(),
        dictionary: new Map()
      }
    ];

    packs.forEach(pack => {
      this.languagePacks.set(pack.code, pack);
    });
  }

  // Check if a language pack is available offline
  public isLanguagePackDownloaded(langCode: string): boolean {
    const pack = this.languagePacks.get(langCode);
    return pack ? pack.isDownloaded : false;
  }

  // Get all available language packs
  public getAvailableLanguagePacks(): LanguagePack[] {
    return Array.from(this.languagePacks.values());
  }

  // Download a language pack
  public async downloadLanguagePack(langCode: string, onProgress?: (progress: number) => void): Promise<boolean> {
    const pack = this.languagePacks.get(langCode);
    if (!pack) {
      throw new Error(`Language pack not found: ${langCode}`);
    }

    try {
      // Simulate download progress for demo
      // In real implementation, this would download actual language models
      const totalSteps = 100;
      for (let i = 0; i <= totalSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        if (onProgress) {
          onProgress((i / totalSteps) * 100);
        }
      }

      // Load demo dictionary for the language
      await this.loadLanguageDictionary(langCode);
      
      pack.isDownloaded = true;
      await this.saveLanguagePackStatus(langCode, true);
      
      return true;
    } catch (error) {
      console.error(`Failed to download language pack: ${langCode}`, error);
      return false;
    }
  }

  // Load language dictionary (demo implementation)
  private async loadLanguageDictionary(langCode: string) {
    const pack = this.languagePacks.get(langCode);
    if (!pack) {
      console.warn(`Language pack not found: ${langCode}`);
      return;
    }

    // Demo dictionaries - In real implementation, these would be comprehensive language models
    const dictionaries = {
      'ne': new Map([
        // Nepali to English basic dictionary
        ['नमस्ते', 'Hello'],
        ['धन्यवाद', 'Thank you'],
        ['माफ गर्नुहोस्', 'Sorry'],
        ['कृपया', 'Please'],
        ['हो', 'Yes'],
        ['होइन', 'No'],
        ['पानी', 'Water'],
        ['खाना', 'Food'],
        ['घर', 'Home'],
        ['विद्यालय', 'School'],
        ['काम', 'Work'],
        ['समय', 'Time'],
        ['पैसा', 'Money'],
        ['मित्र', 'Friend'],
        ['परिवार', 'Family'],
        ['प्रेम', 'Love'],
        ['खुशी', 'Happiness'],
        ['दुःख', 'Sadness'],
        ['स्वास्थ्य', 'Health'],
        ['शिक्षा', 'Education'],
        // Common phrases
        ['तपाईं कस्तो हुनुहुन्छ?', 'How are you?'],
        ['मेरो नाम', 'My name is'],
        ['म नेपाली बोल्छु', 'I speak Nepali'],
        ['तपाईंलाई भेटेर खुशी लाग्यो', 'Nice to meet you'],
        ['यो कति हो?', 'How much is this?']
      ]),
      'si': new Map([
        // Sinhala to English basic dictionary
        ['ආයුබෝවන්', 'Hello'],
        ['ස්තූතියි', 'Thank you'],
        ['සමාවන්න', 'Sorry'],
        ['කරුණාකර', 'Please'],
        ['ඔව්', 'Yes'],
        ['නැහැ', 'No'],
        ['වතුර', 'Water'],
        ['කෑම', 'Food'],
        ['ගෙදර', 'Home'],
        ['පාසල', 'School'],
        ['වැඩ', 'Work'],
        ['වෙලාව', 'Time'],
        ['පිසු', 'Money'],
        ['යාළුවා', 'Friend'],
        ['පවුල', 'Family'],
        ['ආදරය', 'Love'],
        ['සතුට', 'Happiness'],
        ['දුක', 'Sadness'],
        ['සෞඛ්‍යය', 'Health'],
        ['අධ්‍යාපනය', 'Education'],
        // Common phrases
        ['ඔයා කොහොමද?', 'How are you?'],
        ['මගේ නම', 'My name is'],
        ['මම සිංහල කතා කරනවා', 'I speak Sinhala'],
        ['ඔයාව මුණගැසීම සතුටක්', 'Nice to meet you'],
        ['මේක කීයද?', 'How much is this?']
      ])
    };

    const dictionary = dictionaries[langCode as keyof typeof dictionaries];
    if (dictionary) {
      pack.dictionary = dictionary;
    }
  }

  // Perform offline translation
  public async translateOffline(text: string, sourceLang: string, targetLang: string = 'en'): Promise<string> {
    // Check if language pack is available
    if (!this.isLanguagePackDownloaded(sourceLang)) {
      throw new Error(`Language pack not downloaded: ${sourceLang}`);
    }

    // Create cache key
    const cacheKey = `${sourceLang}-${targetLang}-${text}`;
    
    // Check cache first
    if (this.translationCache[cacheKey]) {
      const cached = this.translationCache[cacheKey];
      // Return cached translation if it's recent (within 24 hours)
      if (Date.now() - cached.timestamp.getTime() < 24 * 60 * 60 * 1000) {
        return cached.translation;
      }
    }

    const pack = this.languagePacks.get(sourceLang);
    if (!pack || !pack.dictionary) {
      throw new Error(`Dictionary not available for: ${sourceLang}`);
    }

    // Simple word-by-word translation for demo
    // In real implementation, this would use sophisticated NLP models
    let translation = await this.performDictionaryTranslation(text, pack.dictionary);
    
    // If no direct translation found, try phrase matching
    if (translation === text) {
      translation = await this.performPhraseTranslation(text, pack.dictionary);
    }

    // Cache the translation
    this.translationCache[cacheKey] = {
      translation,
      confidence: translation === text ? 0.3 : 0.8, // Low confidence if no translation found
      timestamp: new Date()
    };

    await this.saveCacheToStorage();
    return translation;
  }

  // Dictionary-based word translation
  private async performDictionaryTranslation(text: string, dictionary: Map<string, string>): Promise<string> {
    // Try exact match first
    const exactMatch = dictionary.get(text.trim());
    if (exactMatch) {
      return exactMatch;
    }

    // Try word-by-word translation
    const words = text.split(/\s+/);
    const translatedWords = words.map(word => {
      const cleanWord = word.toLowerCase().trim();
      return dictionary.get(cleanWord) || word;
    });

    const result = translatedWords.join(' ');
    return result !== text ? result : text;
  }

  // Phrase-based translation
  private async performPhraseTranslation(text: string, dictionary: Map<string, string>): Promise<string> {
    // Check for partial phrase matches
    for (const [phrase, translation] of dictionary.entries()) {
      if (text.includes(phrase) || phrase.includes(text)) {
        return translation;
      }
    }

    // If no match found, return original text
    return `[Offline] ${text}`;
  }

  // Remove a language pack
  public async removeLanguagePack(langCode: string): Promise<boolean> {
    const pack = this.languagePacks.get(langCode);
    if (!pack) return false;

    try {
      pack.isDownloaded = false;
      pack.dictionary.clear();
      await this.saveLanguagePackStatus(langCode, false);
      
      // Clear related cache entries
      Object.keys(this.translationCache).forEach(key => {
        if (key.startsWith(`${langCode}-`)) {
          delete this.translationCache[key];
        }
      });

      await this.saveCacheToStorage();
      return true;
    } catch (error) {
      console.error(`Failed to remove language pack: ${langCode}`, error);
      return false;
    }
  }

  // Get storage usage information
  public getStorageInfo(): { totalSize: number; usedSize: number; availablePacks: number; downloadedPacks: number } {
    const packs = Array.from(this.languagePacks.values());
    const downloadedPacks = packs.filter(p => p.isDownloaded);
    const usedSize = downloadedPacks.reduce((sum, pack) => sum + pack.size, 0);
    const totalSize = packs.reduce((sum, pack) => sum + pack.size, 0);

    return {
      totalSize,
      usedSize,
      availablePacks: packs.length,
      downloadedPacks: downloadedPacks.length
    };
  }

  // Check if device is online
  public isOnline(): boolean {
    return navigator.onLine;
  }

  // Save language pack status to localStorage
  private async saveLanguagePackStatus(langCode: string, isDownloaded: boolean) {
    const status = JSON.parse(localStorage.getItem('languagePackStatus') || '{}');
    status[langCode] = isDownloaded;
    localStorage.setItem('languagePackStatus', JSON.stringify(status));
  }

  // Load cached translations from localStorage
  private loadCachedTranslations() {
    try {
      const cached = localStorage.getItem('offlineTranslationCache');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Convert timestamp strings back to Date objects
        Object.keys(parsed).forEach(key => {
          parsed[key].timestamp = new Date(parsed[key].timestamp);
        });
        this.translationCache = parsed;
      }

      // Load language pack status
      const status = JSON.parse(localStorage.getItem('languagePackStatus') || '{}');
      Object.keys(status).forEach(langCode => {
        const pack = this.languagePacks.get(langCode);
        if (pack && status[langCode]) {
          pack.isDownloaded = true;
          this.loadLanguageDictionary(langCode); // Load dictionary if pack is downloaded
        }
      });
    } catch (error) {
      console.error('Failed to load cached translations:', error);
    }
  }

  // Save cache to localStorage
  private async saveCacheToStorage() {
    try {
      localStorage.setItem('offlineTranslationCache', JSON.stringify(this.translationCache));
    } catch (error) {
      console.error('Failed to save translation cache:', error);
    }
  }

  // Clear all offline data
  public async clearOfflineData(): Promise<void> {
    this.translationCache = {};
    this.languagePacks.forEach(pack => {
      pack.isDownloaded = false;
      pack.dictionary.clear();
    });

    localStorage.removeItem('offlineTranslationCache');
    localStorage.removeItem('languagePackStatus');
  }
}

// Singleton instance
export const offlineTranslationService = new OfflineTranslationService();