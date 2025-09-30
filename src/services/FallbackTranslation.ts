// Fast Fallback Translation Service - Optimized for sentences and speed
interface TranslationPair {
  [key: string]: string;
}

interface LanguageDict {
  [key: string]: TranslationPair;
}

class FallbackTranslationService {
  // Rule-based sentence patterns for better sentence translation
  private patternRules: Record<string, { pattern: RegExp; template: string }[]> = {
    // English -> Nepali
    'en-ne': [
      { pattern: /^(?:\s*(?:hello|hi)[,!]?\s+)?this\s+is\s+(.+?)[.!?]?\s*$/i, template: 'यो $1 हो' },
      { pattern: /^\s*my\s+name\s+is\s+(.+?)[.!?]?\s*$/i, template: 'मेरो नाम $1 हो' },
      { pattern: /^\s*i\s+am\s+(.+?)[.!?]?\s*$/i, template: 'म $1 हुँ' },
      { pattern: /^\s*how\s+are\s+you\s*\??\s*$/i, template: 'तपाईं कस्तो हुनुहुन्छ?' }
    ],
    // English -> Sinhala
    'en-si': [
      { pattern: /^(?:\s*(?:hello|hi)[,!]?\s+)?this\s+is\s+(.+?)[.!?]?\s*$/i, template: 'මේ $1' },
      { pattern: /^\s*my\s+name\s+is\s+(.+?)[.!?]?\s*$/i, template: 'මගේ නම $1' },
      { pattern: /^\s*i\s+am\s+(.+?)[.!?]?\s*$/i, template: 'මම $1' },
      { pattern: /^\s*how\s+are\s+you\s*\??\s*$/i, template: 'ඔයා කොහොමද?' }
    ],
    // Nepali -> English
    'ne-en': [
      { pattern: /^\s*यो\s+(.+?)\s+हो\s*[।]?\s*$/i, template: 'this is $1' },
      { pattern: /^\s*मेरो\s+नाम\s+(.+?)\s+हो\s*[।]?\s*$/i, template: 'my name is $1' },
      { pattern: /^\s*म\s+(.+?)\s+हुँ\s*[।]?\s*$/i, template: 'i am $1' }
    ],
    // Sinhala -> English
    'si-en': [
      { pattern: /^\s*මෙය\s+(.+?)\s*යි\s*$/i, template: 'this is $1' },
      { pattern: /^\s*මේ\s+(.+?)\s*$/i, template: 'this is $1' },
      { pattern: /^\s*මගේ\s+නම\s+(.+?)\s*$/i, template: 'my name is $1' },
      { pattern: /^\s*මම\s+(.+?)\s*$/i, template: 'i am $1' }
    ]
  };

  private applyPatternRules(text: string, sourceLang: string, targetLang: string): string | null {
    const key = `${sourceLang}-${targetLang}`;
    const rules = this.patternRules[key];
    if (!rules) return null;
    const original = text.trim();
    for (const { pattern, template } of rules) {
      const m = original.match(pattern);
      if (m) {
        // Replace $1 etc. using captured groups
        let out = template;
        for (let i = 1; i < m.length; i++) {
          const grp = (m[i] || '').trim();
          out = out.replace(new RegExp(`\\$${i}`, 'g'), grp);
        }
        return out;
      }
    }
    return null;
  }
  private translations: LanguageDict = {
    // English to Hindi - Enhanced with common phrases
    'en-hi': {
      'hello': 'नमस्ते', 'hi': 'हैलो', 'goodbye': 'अलविदा', 'bye': 'बाय',
      'thank you': 'धन्यवाद', 'thanks': 'धन्यवाद', 'sorry': 'माफ करें', 
      'please': 'कृपया', 'yes': 'हाँ', 'no': 'नहीं', 'ok': 'ठीक है', 'okay': 'ठीक है',
      'good': 'अच्छा', 'bad': 'बुरा', 'water': 'पानी', 'food': 'खाना', 'eat': 'खाना',
      'home': 'घर', 'house': 'घर', 'school': 'स्कूल', 'work': 'काम', 'job': 'नौकरी',
      'time': 'समय', 'money': 'पैसा', 'friend': 'दोस्त', 'family': 'परिवार',
      'love': 'प्रेम', 'like': 'पसंद', 'want': 'चाहते हैं', 'need': 'जरूरत',
      'come': 'आओ', 'go': 'जाओ', 'see': 'देखो', 'look': 'देखो', 'give': 'दो',
      'take': 'लो', 'help': 'मदद', 'stop': 'रुको', 'wait': 'इंतज़ार करो',
      'morning': 'सुबह', 'evening': 'शाम', 'night': 'रात', 'day': 'दिन',
      'today': 'आज', 'tomorrow': 'कल', 'yesterday': 'कल', 'now': 'अभी',
      'here': 'यहाँ', 'there': 'वहाँ', 'where': 'कहाँ', 'what': 'क्या',
      'who': 'कौन', 'when': 'कब', 'why': 'क्यों', 'how': 'कैसे',
      'i': 'मैं', 'you': 'आप', 'he': 'वह', 'she': 'वह', 'we': 'हम', 'they': 'वे',
      'my': 'मेरा', 'your': 'आपका', 'his': 'उसका', 'her': 'उसका',
      'am': 'हूँ', 'is': 'है', 'are': 'हैं', 'was': 'था', 'were': 'थे',
      'will': 'होगा', 'can': 'सकते हैं', 'could': 'सकते थे', 'should': 'चाहिए',
      'and': 'और', 'or': 'या', 'but': 'लेकिन', 'if': 'अगर', 'then': 'तो',
      'how are you': 'आप कैसे हैं', 'how are you?': 'आप कैसे हैं?',
      'what is your name': 'आपका नाम क्या है', 'my name is': 'मेरा नाम है',
      'nice to meet you': 'आपसे मिलकर खुशी हुई', 'see you later': 'बाद में मिलते हैं',
      'good morning': 'शुभ प्रभात', 'good evening': 'शुभ संध्या', 'good night': 'शुभ रात्रि',
      'excuse me': 'माफ करिए', 'i love you': 'मैं आपसे प्रेम करता हूँ',
      'i am fine': 'मैं ठीक हूँ', 'i am good': 'मैं अच्छा हूँ'
    },

    // Hindi to English
    'hi-en': {
      'नमस्ते': 'hello', 'हैलो': 'hi', 'अलविदा': 'goodbye', 'बाय': 'bye',
      'धन्यवाद': 'thank you', 'माफ करें': 'sorry', 'कृपया': 'please',
      'हाँ': 'yes', 'नहीं': 'no', 'ठीक है': 'okay', 'अच्छा': 'good', 'बुरा': 'bad',
      'पानी': 'water', 'खाना': 'food', 'घर': 'home', 'स्कूल': 'school', 'काम': 'work',
      'समय': 'time', 'पैसा': 'money', 'दोस्त': 'friend', 'परिवार': 'family',
      'प्रेम': 'love', 'पसंद': 'like', 'चाहते हैं': 'want', 'जरूरत': 'need',
      'आओ': 'come', 'जाओ': 'go', 'देखो': 'see', 'दो': 'give', 'लो': 'take',
      'मदद': 'help', 'रुको': 'stop', 'आज': 'today', 'कल': 'tomorrow',
      'यहाँ': 'here', 'वहाँ': 'there', 'क्या': 'what', 'कौन': 'who',
      'मैं': 'i', 'आप': 'you', 'वह': 'he', 'हम': 'we', 'वे': 'they',
      'और': 'and', 'या': 'or', 'लेकिन': 'but', 'अगर': 'if'
    },

    // English to Spanish
    'en-es': {
      'hello': 'hola', 'hi': 'hola', 'goodbye': 'adiós', 'bye': 'adiós',
      'thank you': 'gracias', 'thanks': 'gracias', 'sorry': 'lo siento',
      'please': 'por favor', 'yes': 'sí', 'no': 'no', 'okay': 'está bien',
      'good': 'bueno', 'bad': 'malo', 'water': 'agua', 'food': 'comida',
      'home': 'casa', 'school': 'escuela', 'work': 'trabajo', 'time': 'tiempo',
      'money': 'dinero', 'friend': 'amigo', 'family': 'familia', 'love': 'amor',
      'i': 'yo', 'you': 'tú', 'he': 'él', 'she': 'ella', 'we': 'nosotros',
      'what': 'qué', 'where': 'dónde', 'when': 'cuándo', 'how': 'cómo',
      'and': 'y', 'or': 'o', 'but': 'pero', 'if': 'si',
      'how are you': 'cómo estás', 'my name is': 'mi nombre es',
      'good morning': 'buenos días', 'good night': 'buenas noches'
    },

    // Spanish to English
    'es-en': {
      'hola': 'hello', 'adiós': 'goodbye', 'gracias': 'thank you', 'lo siento': 'sorry',
      'por favor': 'please', 'sí': 'yes', 'no': 'no', 'bueno': 'good', 'malo': 'bad',
      'agua': 'water', 'comida': 'food', 'casa': 'home', 'escuela': 'school',
      'trabajo': 'work', 'tiempo': 'time', 'dinero': 'money', 'amigo': 'friend',
      'familia': 'family', 'amor': 'love', 'yo': 'i', 'tú': 'you', 'él': 'he',
      'ella': 'she', 'nosotros': 'we', 'qué': 'what', 'dónde': 'where'
    },

    // English to French
    'en-fr': {
      'hello': 'bonjour', 'hi': 'salut', 'goodbye': 'au revoir', 'thank you': 'merci',
      'sorry': 'désolé', 'please': 's\'il vous plaît', 'yes': 'oui', 'no': 'non',
      'water': 'eau', 'food': 'nourriture', 'home': 'maison', 'love': 'amour',
      'good morning': 'bonjour', 'good night': 'bonne nuit'
    },

    // French to English
    'fr-en': {
      'bonjour': 'hello', 'salut': 'hi', 'au revoir': 'goodbye', 'merci': 'thank you',
      'désolé': 'sorry', 'oui': 'yes', 'non': 'no', 'eau': 'water', 'amour': 'love'
    },

    // English to Portuguese
    'en-pt': {
      'hello': 'olá', 'goodbye': 'tchau', 'thank you': 'obrigado',
      'sorry': 'desculpa', 'yes': 'sim', 'no': 'não', 'water': 'água',
      'love': 'amor', 'good morning': 'bom dia'
    },

    // Portuguese to English
    'pt-en': {
      'olá': 'hello', 'tchau': 'goodbye', 'obrigado': 'thank you',
      'desculpa': 'sorry', 'sim': 'yes', 'não': 'no', 'água': 'water'
    },

    // English to Nepali
    'en-ne': {
      'hello': 'नमस्ते',
      'hi': 'नमस्ते',
      'goodbye': 'बिदाई',
      'thank you': 'धन्यवाद',
      'thanks': 'धन्यवाद',
      'sorry': 'माफ गर्नुहोस्',
      'please': 'कृपया',
      'yes': 'हो',
      'no': 'होइन',
      'water': 'पानी',
      'food': 'खाना',
      'home': 'घर',
      'house': 'घर',
      'school': 'विद्यालय',
      'work': 'काम',
      'job': 'काम',
      'time': 'समय',
      'money': 'पैसा',
      'friend': 'मित्र',
      'family': 'परिवार',
      'love': 'प्रेम',
      'happiness': 'खुशी',
      'sadness': 'दुःख',
      'health': 'स्वास्थ्य',
      'education': 'शिक्षा'
    },

    // Nepali to English
    'ne-en': {
      'नमस्ते': 'Hello',
      'बिदाई': 'Goodbye',
      'धन्यवाद': 'Thank you',
      'माफ गर्नुहोस्': 'Sorry',
      'कृपया': 'Please',
      'हो': 'Yes',
      'होइन': 'No',
      'पानी': 'Water',
      'खाना': 'Food',
      'घर': 'Home',
      'विद्यालय': 'School',
      'काम': 'Work',
      'समय': 'Time',
      'पैसा': 'Money',
      'मित्र': 'Friend',
      'परिवार': 'Family',
      'प्रेम': 'Love',
      'खुशी': 'Happiness',
      'दुःख': 'Sadness',
      'स्वास्थ्य': 'Health',
      'शिक्षा': 'Education'
    },

    // English to Sinhala
    'en-si': {
      'hello': 'ආයුබෝවන්',
      'hi': 'ආයුබෝවන්',
      'goodbye': 'ගිහින් එන්න',
      'thank you': 'ස්තූතියි',
      'thanks': 'ස්තූතියි',
      'sorry': 'සමාවන්න',
      'please': 'කරුණාකර',
      'yes': 'ඔව්',
      'no': 'නැහැ',
      'water': 'වතුර',
      'food': 'කෑම',
      'home': 'ගෙදර',
      'house': 'ගෙදර',
      'school': 'පාසල',
      'work': 'වැඩ',
      'job': 'රැකියාව',
      'time': 'වෙලාව',
      'money': 'පිසු',
      'friend': 'යාළුවා',
      'family': 'පවුල',
      'love': 'ආදරය',
      'happiness': 'සතුට',
      'sadness': 'දුක',
      'health': 'සෞඛ්‍යය',
      'education': 'අධ්‍යාපනය',
      'good morning': 'සුභ උදෑසනක්',
      'good evening': 'සුභ සන්ධ්‍යාවක්',
      'good night': 'සුභ රාත්‍රියක්',
      'how are you': 'ඔයා කොහොමද',
      'my name is': 'මගේ නම',
      'nice to meet you': 'ඔයාව මුණගැසීම සතුටක්'
    },

    // Sinhala to English
    'si-en': {
      'ආයුබෝවන්': 'Hello',
      'ගිහින් එන්න': 'Goodbye',
      'ස්තූතියි': 'Thank you',
      'සමාවන්න': 'Sorry',
      'කරුණාකර': 'Please',
      'ඔව්': 'Yes',
      'නැහැ': 'No',
      'වතුර': 'Water',
      'කෑම': 'Food',
      'ගෙදර': 'Home',
      'පාසල': 'School',
      'වැඩ': 'Work',
      'රැකියාව': 'Job',
      'වෙලාව': 'Time',
      'පිසු': 'Money',
      'යාළුවා': 'Friend',
      'පවුල': 'Family',
      'ආදරය': 'Love',
      'සතුට': 'Happiness',
      'දුක': 'Sadness',
      'සෞන්‍යය': 'Health',
      'අධ්‍යාපනය': 'Education',
      'සුභ උදෑසනක්': 'Good morning',
      'සුභ සන්ධ්‍යාවක්': 'Good evening',
      'සුභ රාත්‍රියක්': 'Good night',
      'ඔයා කොහොමද': 'How are you',
      'මගේ නම': 'My name is',
      'මම සිංහල කතා කරනවා': 'I speak Sinhala',
      'ඔයාව මුණගැසීම සතුටක්': 'Nice to meet you',
      'මේක කීයද': 'How much is this'
    },
    // Spanish translations
    'es-en': {
      'hola': 'hello',
      'gracias': 'thank you',
      'lo siento': 'sorry',
      'por favor': 'please',
      'sí': 'yes',
      'no': 'no',
      'agua': 'water',
      'comida': 'food',
      'casa': 'home',
      'escuela': 'school',
      'trabajo': 'work',
      'tiempo': 'time',
      'dinero': 'money',
      'amigo': 'friend',
      'familia': 'family',
      'amor': 'love'
    },
    'en-es': {
      'hello': 'hola',
      'hi': 'hola',
      'thank you': 'gracias',
      'sorry': 'lo siento',
      'please': 'por favor',
      'yes': 'sí',
      'no': 'no',
      'water': 'agua',
      'food': 'comida',
      'home': 'casa',
      'school': 'escuela',
      'work': 'trabajo',
      'time': 'tiempo',
      'money': 'dinero',
      'friend': 'amigo',
      'family': 'familia',
      'love': 'amor'
    },

    // English to Portuguese
    'en-pt': {
      'hello': 'olá',
      'hi': 'oi',
      'goodbye': 'tchau',
      'thank you': 'obrigado',
      'thanks': 'obrigado',
      'sorry': 'desculpa',
      'please': 'por favor',
      'yes': 'sim',
      'no': 'não',
      'water': 'água',
      'food': 'comida',
      'home': 'casa',
      'house': 'casa',
      'school': 'escola',
      'work': 'trabalho',
      'job': 'trabalho',
      'time': 'tempo',
      'money': 'dinheiro',
      'friend': 'amigo',
      'family': 'família',
      'love': 'amor',
      'happiness': 'felicidade',
      'sadness': 'tristeza',
      'health': 'saúde',
      'education': 'educação'
    },

    // Portuguese to English
    'pt-en': {
      'olá': 'hello',
      'oi': 'hi',
      'tchau': 'goodbye',
      'obrigado': 'thank you',
      'desculpa': 'sorry',
      'por favor': 'please',
      'sim': 'yes',
      'não': 'no',
      'água': 'water',
      'comida': 'food',
      'casa': 'home',
      'escola': 'school',
      'trabalho': 'work',
      'tempo': 'time',
      'dinheiro': 'money',
      'amigo': 'friend',
      'família': 'family',
      'amor': 'love',
      'felicidade': 'happiness',
      'tristeza': 'sadness',
      'saúde': 'health',
      'educação': 'education'
    },

    // English to French
    'en-fr': {
      'hello': 'bonjour',
      'hi': 'salut',
      'goodbye': 'au revoir',
      'thank you': 'merci',
      'thanks': 'merci',
      'sorry': 'désolé',
      'please': 's\'il vous plaît',
      'yes': 'oui',
      'no': 'non',
      'water': 'eau',
      'food': 'nourriture',
      'home': 'maison',
      'house': 'maison',
      'school': 'école',
      'work': 'travail',
      'job': 'emploi',
      'time': 'temps',
      'money': 'argent',
      'friend': 'ami',
      'family': 'famille',
      'love': 'amour',
      'happiness': 'bonheur',
      'sadness': 'tristesse',
      'health': 'santé',
      'education': 'éducation'
    },

    // French to English
    'fr-en': {
      'bonjour': 'hello',
      'salut': 'hi',
      'au revoir': 'goodbye',
      'merci': 'thank you',
      'désolé': 'sorry',
      's\'il vous plaît': 'please',
      'oui': 'yes',
      'non': 'no',
      'eau': 'water',
      'nourriture': 'food',
      'maison': 'home',
      'école': 'school',
      'travail': 'work',
      'emploi': 'job',
      'temps': 'time',
      'argent': 'money',
      'ami': 'friend',
      'famille': 'family',
      'amour': 'love',
      'bonheur': 'happiness',
      'tristesse': 'sadness',
      'santé': 'health',
      'éducation': 'education'
    },

    // English to German
    'en-de': {
      'hello': 'hallo',
      'hi': 'hallo',
      'goodbye': 'auf wiedersehen',
      'thank you': 'danke',
      'thanks': 'danke',
      'sorry': 'entschuldigung',
      'please': 'bitte',
      'yes': 'ja',
      'no': 'nein',
      'water': 'wasser',
      'food': 'essen',
      'home': 'zuhause',
      'house': 'haus',
      'school': 'schule',
      'work': 'arbeit',
      'job': 'job',
      'time': 'zeit',
      'money': 'geld',
      'friend': 'freund',
      'family': 'familie',
      'love': 'liebe',
      'happiness': 'glück',
      'sadness': 'traurigkeit',
      'health': 'gesundheit',
      'education': 'bildung'
    },

    // German to English
    'de-en': {
      'hallo': 'hello',
      'auf wiedersehen': 'goodbye',
      'danke': 'thank you',
      'entschuldigung': 'sorry',
      'bitte': 'please',
      'ja': 'yes',
      'nein': 'no',
      'wasser': 'water',
      'essen': 'food',
      'zuhause': 'home',
      'haus': 'house',
      'schule': 'school',
      'arbeit': 'work',
      'job': 'job',
      'zeit': 'time',
      'geld': 'money',
      'freund': 'friend',
      'familie': 'family',
      'liebe': 'love',
      'glück': 'happiness',
      'traurigkeit': 'sadness',
      'gesundheit': 'health',
      'bildung': 'education'
    },

    // English to Bengali
    'en-bn': {
      'hello': 'হ্যালো',
      'hi': 'হাই',
      'goodbye': 'বিদায়',
      'thank you': 'ধন্যবাদ',
      'thanks': 'ধন্যবাদ',
      'sorry': 'দুঃখিত',
      'please': 'অনুগ্রহ করে',
      'yes': 'হ্যাঁ',
      'no': 'না',
      'water': 'পানি',
      'food': 'খাবার',
      'home': 'বাড়ি',
      'house': 'বাড়ি',
      'school': 'স্কুল',
      'work': 'কাজ',
      'job': 'চাকরি',
      'time': 'সময়',
      'money': 'টাকা',
      'friend': 'বন্ধু',
      'family': 'পরিবার',
      'love': 'ভালোবাসা',
      'happiness': 'খুশি',
      'sadness': 'দুঃখ',
      'health': 'স্বাস্থ্য',
      'education': 'শিক্ষা'
    },

    // Bengali to English
    'bn-en': {
      'হ্যালো': 'hello',
      'হাই': 'hi',
      'বিদায়': 'goodbye',
      'ধন্যবাদ': 'thank you',
      'দুঃখিত': 'sorry',
      'অনুগ্রহ করে': 'please',
      'হ্যাঁ': 'yes',
      'না': 'no',
      'পানি': 'water',
      'খাবার': 'food',
      'বাড়ি': 'home',
      'স্কুল': 'school',
      'কাজ': 'work',
      'চাকরি': 'job',
      'সময়': 'time',
      'টাকা': 'money',
      'বন্ধু': 'friend',
      'পরিবার': 'family',
      'ভালোবাসা': 'love',
      'খুশি': 'happiness',
      'দুঃখ': 'sadness',
      'স্বাস্থ্য': 'health',
      'শিক্ষা': 'education'
    },

    // English to Tamil
    'en-ta': {
      'hello': 'வணக்கம்',
      'hi': 'ஹாய்',
      'goodbye': 'பிரியாவிடை',
      'thank you': 'நன்றி',
      'thanks': 'நன்றி',
      'sorry': 'மன்னிக்கவும்',
      'please': 'தயவுசெய்து',
      'yes': 'ஆம்',
      'no': 'இல்லை',
      'water': 'தண்ணீர்',
      'food': 'உணவு',
      'home': 'வீடு',
      'house': 'வீடு',
      'school': 'பள்ளி',
      'work': 'வேலை',
      'job': 'வேலை',
      'time': 'நேரம்',
      'money': 'பணம்',
      'friend': 'நண்பர்',
      'family': 'குடும்பம்',
      'love': 'அன்பு',
      'happiness': 'மகிழ்ச்சி',
      'sadness': 'துக்கம்',
      'health': 'உடல்நலம்',
      'education': 'கல்வி'
    },

    // Tamil to English
    'ta-en': {
      'வணக்கம்': 'hello',
      'ஹாய்': 'hi',
      'பிரியாவிடை': 'goodbye',
      'நன்றி': 'thank you',
      'மன்னிக்கவும்': 'sorry',
      'தயவுசெய்து': 'please',
      'ஆம்': 'yes',
      'இல்லை': 'no',
      'தண்ணீர்': 'water',
      'உணவு': 'food',
      'வீடு': 'home',
      'பள்ளி': 'school',
      'வேலை': 'work',
      'நேரம்': 'time',
      'பணம்': 'money',
      'நண்பர்': 'friend',
      'குடும்பம்': 'family',
      'அன்பு': 'love',
      'மகிழ்ச்சி': 'happiness',
      'துக்கம்': 'sadness',
      'உடல்நலம்': 'health',
      'கல்வி': 'education'
    },

    // English to Telugu
    'en-te': {
      'hello': 'హలో', 'hi': 'హాయ్', 'thank you': 'ధన్యవాదాలు', 'sorry': 'క్షమించండి',
      'please': 'దయచేసి', 'yes': 'అవును', 'no': 'లేదు', 'water': 'నీరు', 'food': 'ఆహారం', 'home': 'ఇల్లు'
    },
    'te-en': { 'హలో': 'hello', 'హాయ్': 'hi', 'ధన్యవాదాలు': 'thank you', 'క్షమించండి': 'sorry' },

    // English to Urdu
    'en-ur': {
      'hello': 'ہیلو', 'hi': 'سلام', 'thank you': 'شکریہ', 'sorry': 'معاف کریں',
      'please': 'براہ کرم', 'yes': 'ہاں', 'no': 'نہیں', 'water': 'پانی', 'food': 'کھانا', 'home': 'گھر'
    },
    'ur-en': { 'ہیلو': 'hello', 'سلام': 'hi', 'شکریہ': 'thank you', 'معاف کریں': 'sorry' },

    // English to Chinese
    'en-zh': {
      'hello': '你好', 'hi': '嗨', 'thank you': '謝謝', 'sorry': '對不起',
      'please': '請', 'yes': '是', 'no': '不是', 'water': '水', 'food': '食物', 'home': '家'
    },
    'zh-en': { '你好': 'hello', '嗨': 'hi', '謝謝': 'thank you', '對不起': 'sorry' },

    // English to Japanese
    'en-ja': {
      'hello': 'こんにちは', 'hi': 'やあ', 'thank you': 'ありがとう', 'sorry': 'ごめんなさい',
      'please': 'お願いします', 'yes': 'はい', 'no': 'いいえ', 'water': '水', 'food': '食べ物', 'home': '家'
    },
    'ja-en': { 'こんにちは': 'hello', 'やあ': 'hi', 'ありがとう': 'thank you', 'ごめんなさい': 'sorry' },

    // English to Korean
    'en-ko': {
      'hello': '안녕하세요', 'hi': '안녕', 'thank you': '감사합니다', 'sorry': '죄송합니다',
      'please': '제발', 'yes': '네', 'no': '아니오', 'water': '물', 'food': '음식', 'home': '집'
    },
    'ko-en': { '안녕하세요': 'hello', '안녕': 'hi', '감사합니다': 'thank you', '죄송합니다': 'sorry' },

    // English to Arabic
    'en-ar': {
      'hello': 'مرحبا', 'hi': 'أهلا', 'thank you': 'شكرا', 'sorry': 'آسف',
      'please': 'من فضلك', 'yes': 'نعم', 'no': 'لا', 'water': 'ماء', 'food': 'طعام', 'home': 'منزل'
    },
    'ar-en': { 'مرحبا': 'hello', 'أهلا': 'hi', 'شكرا': 'thank you', 'آسف': 'sorry' },

    // English to Russian
    'en-ru': {
      'hello': 'привет', 'hi': 'привет', 'thank you': 'спасибо', 'sorry': 'извините',
      'please': 'пожалуйста', 'yes': 'да', 'no': 'нет', 'water': 'вода', 'food': 'еда', 'home': 'дом'
    },
    'ru-en': { 'привет': 'hello', 'спасибо': 'thank you', 'извините': 'sorry', 'пожалуйста': 'please' }
  };

  public async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const translationKey = `${sourceLang}-${targetLang}`;
    const translations = this.translations[translationKey];

    console.log(`FallbackTranslationService: Translating "${text}" from ${sourceLang} to ${targetLang}`);

    if (!translations) {
      console.warn(`No direct dictionary for ${sourceLang} -> ${targetLang}. Trying pivot via English...`);

      // If target is English and we have a source->en dictionary, use it
      const toEnglish = this.translations[`${sourceLang}-en`];
      if (targetLang === 'en' && toEnglish) {
        return await this.translateComplexText(text, toEnglish, sourceLang, 'en');
      }

      // Generic pivot: source -> en -> target (en, ne, si supported and any other with dictionary)
      const fromEnglish = this.translations[`en-${targetLang}`];
      if (toEnglish && fromEnglish) {
        const intermediate = await this.translateComplexText(text, toEnglish, sourceLang, 'en');
        return await this.translateComplexText(intermediate, fromEnglish, 'en', targetLang);
      }

      // As a last resort, if target is not English but we at least know source->en, return the English translation
      if (toEnglish) {
        console.warn(`Falling back to English-only translation for ${sourceLang} -> en (no en -> ${targetLang} dictionary).`);
        return await this.translateComplexText(text, toEnglish, sourceLang, 'en');
      }

      return `[No dictionary: ${sourceLang}-${targetLang}] ${text}`;
    }

    // Handle complex text (sentences and paragraphs)
    return await this.translateComplexText(text, translations, sourceLang, targetLang);
  }

  private async translateComplexText(text: string, translations: TranslationPair, sourceLang: string, targetLang: string): Promise<string> {
    const originalText = text.trim();
    const cleanText = text.toLowerCase().trim();

    // Step 1: Try exact match first (for complete sentences/phrases)
    if (translations[cleanText]) {
      console.log(`Exact match found: ${cleanText} -> ${translations[cleanText]}`);
      return translations[cleanText];
    }

    if (translations[originalText]) {
      console.log(`Case-sensitive match found: ${originalText} -> ${translations[originalText]}`);
      return translations[originalText];
    }

    // Step 2: Handle paragraphs (split by sentences)
    if (this.isParagraph(text)) {
      console.log('Translating paragraph...');
      return await this.translateParagraph(text, translations, sourceLang, targetLang);
    }

    // Step 3: Handle sentences (split by clauses and phrases)
    if (this.isSentence(text)) {
      console.log('Translating sentence...');
      return await this.translateSentence(text, translations, sourceLang, targetLang);
    }

    // Step 4: Handle phrases and multiple words
    if (this.isPhrase(text)) {
      console.log('Translating phrase...');
      return await this.translatePhrase(text, translations, sourceLang, targetLang);
    }

    // Step 5: Single word translation
    return await this.translateWord(text, translations, sourceLang, targetLang);
  }

  private isParagraph(text: string): boolean {
    // Check if text contains multiple sentences
    const sentenceEnders = /[.!?।॥｜]/g;
    const matches = text.match(sentenceEnders);
    return matches ? matches.length > 1 : false;
  }

  private isSentence(text: string): boolean {
    // Check if text looks like a sentence
    const sentenceEnders = /[.!?।॥｜]/;
    const hasMultipleWords = text.trim().split(/\s+/).length > 3;
    return sentenceEnders.test(text) || hasMultipleWords;
  }

  private isPhrase(text: string): boolean {
    // Check if text has multiple words
    return text.trim().split(/\s+/).length > 1;
  }

  private async translateParagraph(text: string, translations: TranslationPair, sourceLang: string, targetLang: string): Promise<string> {
    // Preserve line breaks: translate each line independently, then sentences within lines
    const lines = text.split(/\r?\n/);
    const translatedLines: string[] = [];

    for (const line of lines) {
      if (!line.trim()) { translatedLines.push(""); continue; }
      const sentences = this.splitIntoSentences(line);
      const translatedSentences: string[] = [];
      for (const sentence of sentences) {
        if (sentence.trim()) {
          const translatedSentence = await this.translateSentence(sentence, translations, sourceLang, targetLang);
          translatedSentences.push(translatedSentence);
        }
      }
      translatedLines.push(translatedSentences.join(' '));
    }

    return translatedLines.join('\n');
  }

  private splitIntoSentences(text: string): string[] {
    // Split by common sentence endings
    return text.split(/[.!?।॥｜]+/).filter(s => s.trim().length > 0);
  }

  private async translateSentence(text: string, translations: TranslationPair, sourceLang: string, targetLang: string): Promise<string> {
    // First, try rule-based patterns (handles names/placeholders)
    const patterned = this.applyPatternRules(text, sourceLang, targetLang);
    if (patterned) {
      return patterned;
    }

    const cleanText = text.toLowerCase().trim();
    
    // Try to find complete sentence matches first
    for (const [phrase, translation] of Object.entries(translations)) {
      if (phrase.length > 10 && cleanText.includes(phrase.toLowerCase())) {
        console.log(`Long phrase match found: ${phrase} -> ${translation}`);
        return cleanText.replace(phrase.toLowerCase(), translation);
      }
    }

    // Split sentence into meaningful chunks
    const chunks = this.splitIntoMeaningfulChunks(text);
    const translatedChunks: string[] = [];

    for (const chunk of chunks) {
      const translatedChunk = await this.translatePhrase(chunk, translations, sourceLang, targetLang);
      translatedChunks.push(translatedChunk);
    }

    return translatedChunks.join(' ');
  }

  private splitIntoMeaningfulChunks(text: string): string[] {
    // Split by common delimiters while preserving meaning
    const delimiters = /[,;:()\[\]{}"'`।]/;
    const chunks = text.split(delimiters).map(chunk => chunk.trim()).filter(chunk => chunk.length > 0);
    
    // If no delimiters found, split into smaller phrases
    if (chunks.length === 1) {
      const words = text.trim().split(/\s+/);
      const phraseChunks: string[] = [];
      
      // Group words into meaningful phrases (3-5 words each)
      for (let i = 0; i < words.length; i += 3) {
        const phrase = words.slice(i, i + 3).join(' ');
        phraseChunks.push(phrase);
      }
      
      return phraseChunks;
    }
    
    return chunks;
  }

  private async translatePhrase(text: string, translations: TranslationPair, sourceLang: string, targetLang: string): Promise<string> {
    const cleanText = text.toLowerCase().trim();
    
    // Try exact phrase match
    if (translations[cleanText]) {
      console.log(`Phrase match found: ${cleanText} -> ${translations[cleanText]}`);
      return translations[cleanText];
    }

    // Try partial phrase matches
    for (const [phrase, translation] of Object.entries(translations)) {
      if (phrase.length > 3 && (cleanText.includes(phrase) || phrase.includes(cleanText))) {
        console.log(`Partial phrase match found: ${phrase} -> ${translation}`);
        return translation;
      }
    }

    // Fall back to word-by-word translation
    return await this.translateWordByWord(text, translations, sourceLang, targetLang);
  }

  private async translateWord(text: string, translations: TranslationPair, sourceLang: string, targetLang: string): Promise<string> {
    const cleanText = text.toLowerCase().trim();
    const originalText = text.trim();
    
    // Try exact match
    if (translations[cleanText]) {
      console.log(`Word match found: ${cleanText} -> ${translations[cleanText]}`);
      return translations[cleanText];
    }

    if (translations[originalText]) {
      console.log(`Case-sensitive word match found: ${originalText} -> ${translations[originalText]}`);
      return translations[originalText];
    }

    // Try removing punctuation
    const cleanWord = cleanText.replace(/[^\p{L}\p{N}]/gu, '');
    if (translations[cleanWord]) {
      console.log(`Clean word match found: ${cleanWord} -> ${translations[cleanWord]}`);
      return translations[cleanWord];
    }

    // Return original word if no translation found
    console.log(`No translation found for word: ${cleanText}`);
    return text;
  }

  private async translateWordByWord(text: string, translations: TranslationPair, sourceLang: string, targetLang: string): Promise<string> {
    const words = text.trim().split(/\s+/);
    const translatedWords: string[] = [];
    
    console.log(`Translating word-by-word: ${words.join(', ')}`);

    for (const word of words) {
      const translatedWord = await this.translateWord(word, translations, sourceLang, targetLang);
      translatedWords.push(translatedWord);
    }

    const result = translatedWords.join(' ');
    console.log(`Word-by-word result: ${result}`);
    
    return result;
  }

  public isLanguagePairSupported(sourceLang: string, targetLang: string): boolean {
    return Boolean(this.translations[`${sourceLang}-${targetLang}`]);
  }

  public getSupportedLanguagePairs(): string[] {
    return Object.keys(this.translations);
  }
}

export const fallbackTranslationService = new FallbackTranslationService();