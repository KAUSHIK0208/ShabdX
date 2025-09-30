import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Image, FileX, Loader2, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

interface FileUploadProps {
  onTextExtracted: (text: string) => void;
}

// Set up PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
} catch (error) {
  console.warn('PDF.js worker setup failed:', error);
}

const FileUpload = ({ onTextExtracted }: FileUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Global paste handler (paste image/file or plain text like Lens)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      try {
        const cd = e.clipboardData as DataTransfer | null;
        if (!cd) return;

        // Prefer items API to catch images reliably
        const items = cd.items;
        if (items && items.length) {
          for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (it.kind === 'file') {
              const f = it.getAsFile();
              if (f) {
                validateAndSetFile(f);
                toast({ title: 'Pasted file detected', description: f.type || f.name || 'file' });
                e.preventDefault();
                return;
              }
            }
          }
        }

        // Fallback to files list
        const files = (cd as any).files as FileList | undefined;
        if (files && files.length > 0) {
          const f = files[0];
          validateAndSetFile(f);
          toast({ title: 'Pasted file detected', description: f.type || f.name || 'file' });
          e.preventDefault();
          return;
        }

        // Plain text
        const text: string = cd.getData('text') || '';
        if (text && text.trim().length > 0) {
          onTextExtracted(text.trim());
          toast({ title: 'Pasted text captured', description: `${text.trim().length} characters` });
          e.preventDefault();
        }
      } catch (err) {
        // ignore
      }
    };
    document.addEventListener('paste', handlePaste as any, true);
    return () => document.removeEventListener('paste', handlePaste as any, true);
  }, [onTextExtracted, toast]);

  const supportedFormats = {
    'text/plain': 'Text files (.txt)',
    'application/pdf': 'PDF files (.pdf)',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word documents (.docx)',
    'application/msword': 'Word documents (.doc)',
    'image/jpeg': 'JPEG images (.jpg, .jpeg)',
    'image/png': 'PNG images (.png)',
    'image/gif': 'GIF images (.gif)',
    'image/bmp': 'BMP images (.bmp)',
    'image/webp': 'WebP images (.webp)'
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    const fileType = file.type;
    
    // Handle text files
    if (fileType === 'text/plain') {
      return await file.text();
    }
    
    // Handle PDF files
    if (fileType === 'application/pdf') {
      return await extractTextFromPDF(file);
    }
    
    // Handle Word documents
    if (fileType.includes('wordprocessingml') || fileType === 'application/msword') {
      return await extractTextFromWord(file);
    }
    
    // Handle images (OCR)
    if (fileType.startsWith('image/')) {
      return await extractTextFromImage(file);
    }
    
    throw new Error('Unsupported file format');
  };

const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      setExtractionProgress(10);
      const arrayBuffer = await file.arrayBuffer();
      setExtractionProgress(25);

      if (!pdfjsLib || !pdfjsLib.getDocument) {
        throw new Error('PDF.js library not loaded properly');
      }

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, verbosity: 0 });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      if (numPages === 0) throw new Error('PDF contains no pages');

      let extractedText = '';
      let pagesNeedingOCR: number[] = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .filter((item: any) => item.str && item.str.trim())
            .map((item: any) => item.str)
            .join(' ');

          if (pageText.trim().length > 10) {
            extractedText += pageText + '\n\n';
          } else {
            pagesNeedingOCR.push(pageNum);
          }

          setExtractionProgress(25 + (pageNum / numPages) * 35); // up to 60%
        } catch (e) {
          console.warn(`Text layer extraction failed on page ${pageNum}, switching to OCR`, e);
          pagesNeedingOCR.push(pageNum);
        }
      }

      // OCR pass for scanned pages
      if (pagesNeedingOCR.length) {
        for (let idx = 0; idx < pagesNeedingOCR.length; idx++) {
          const pageNum = pagesNeedingOCR[idx];
          try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: ctx as CanvasRenderingContext2D, viewport }).promise;

            const { data: { text } } = await Tesseract.recognize(canvas, 'eng+nep+sin', {
              logger: (m) => {
                if (m.status === 'recognizing text') {
                  const progressBase = 60 + (idx / pagesNeedingOCR.length) * 35; // 60-95%
                  setExtractionProgress(progressBase + (m.progress * (35 / pagesNeedingOCR.length)));
                }
              }
            });
            if (text && text.trim()) extractedText += text.trim() + '\n\n';
          } catch (ocrErr) {
            console.warn(`OCR failed on page ${pageNum}`, ocrErr);
          }
        }
      }

      setExtractionProgress(100);
      if (!extractedText.trim()) throw new Error('No readable text found in PDF');
      return extractedText.trim();
    } catch (error) {
      console.error('PDF extraction error:', error);
      if (error instanceof Error) {
        throw new Error(`PDF extraction failed: ${error.message}`);
      }
      throw new Error('Failed to extract text from PDF');
    }
  };

  const extractTextFromWord = async (file: File): Promise<string> => {
    try {
      setExtractionProgress(20);
      const arrayBuffer = await file.arrayBuffer();
      setExtractionProgress(50);
      
      const result = await mammoth.extractRawText({ arrayBuffer });
      setExtractionProgress(100);
      
      if (!result.value.trim()) {
        throw new Error('No text content found in Word document');
      }
      
      return result.value;
    } catch (error) {
      console.error('Word extraction error:', error);
      if (error instanceof Error) {
        throw new Error(`Word extraction failed: ${error.message}`);
      }
      throw new Error('Failed to extract text from Word document');
    }
  };

  const extractTextFromImage = async (file: File): Promise<string> => {
    try {
      setExtractionProgress(10);
      
      const imageUrl = URL.createObjectURL(file);
      setExtractionProgress(20);
      
      const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng+nep+sin', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setExtractionProgress(20 + m.progress * 80);
          }
        }
      });
      
      URL.revokeObjectURL(imageUrl);
      setExtractionProgress(100);
      
      if (!text.trim()) {
        throw new Error('No text detected in image');
      }
      
      return text;
    } catch (error) {
      console.error('OCR error:', error);
      if (error instanceof Error) {
        throw new Error(`OCR failed: ${error.message}`);
      }
      throw new Error('Failed to extract text from image');
    }
  };

  const validateAndSetFile = (file: File) => {
    const fileType = file.type;
    const isSupported = Object.keys(supportedFormats).some(type => 
      fileType === type || 
      (type.endsWith('*') && fileType.startsWith(type.slice(0, -1)))
    );
    
    if (!isSupported) {
      toast({
        title: 'Unsupported file format',
        description: `File type "${fileType || 'unknown'}" is not supported. Please upload a PDF, Word document, image, or text file.`,
        variant: 'destructive'
      });
      return;
    }
    
    setUploadedFile(file);
    setExtractionProgress(0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const processFile = async () => {
    if (!uploadedFile) return;
    
    setIsProcessing(true);
    setExtractionProgress(0);
    
    try {
      const extractedText = await extractTextFromFile(uploadedFile);
      onTextExtracted(extractedText);
      toast({
        title: 'Text extracted successfully',
        description: `Extracted ${extractedText.length} characters from ${uploadedFile.name}`
      });
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: 'Extraction failed',
        description: error instanceof Error ? error.message : 'Failed to extract text from file',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (uploadedFile) {
      processFile();
    }
  }, [uploadedFile]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!uploadedFile ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full">
              <Upload className="h-10 w-10 text-blue-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Upload a file or paste content</h3>
              <p className="text-sm text-gray-500">
                Drag & drop a file, or click to browse
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".txt,.pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.bmp,.webp"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Select File
            </Button>
            <div className="text-xs text-gray-500 flex flex-wrap justify-center gap-1 mt-2">
              {Object.values(supportedFormats).map((format, idx) => (
                <span key={idx} className="px-2 py-1 bg-gray-100 rounded-full">{format}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {uploadedFile.type.startsWith('image/') ? (
                <Image className="h-10 w-10 text-blue-600" />
              ) : uploadedFile.type.includes('pdf') ? (
                <FileText className="h-10 w-10 text-red-600" />
              ) : (
                <FileText className="h-10 w-10 text-blue-600" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setUploadedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                <FileX className="h-5 w-5" />
              </Button>
            </div>
            
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Extracting text...</span>
                  <span>{extractionProgress.toFixed(0)}%</span>
                </div>
                <Progress value={extractionProgress} className="h-2" />
              </div>
            )}
            
            <div className="flex space-x-3">
              <Button
                onClick={processFile}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting Text...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Extract Again
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setUploadedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="min-w-32"
              >
                Upload Another
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard hint */}
      <div className="text-center">
        <p className="text-slate-600 text-xs font-medium bg-white/80 px-4 py-2 rounded-full inline-block mr-2">
          Tip: Press Ctrl+V to paste screenshots or copied text directly
        </p>
      </div>

      {/* Supported Formats */}
      <div className="text-center">
        <p className="text-slate-600 text-xs font-medium bg-white/80 px-4 py-2 rounded-full inline-block">
          Drag & drop files or paste (Ctrl+V) images/text. Supported: PDF, Word (.doc/.docx), Images (JPG, PNG, GIF, BMP, WebP), Text files
        </p>
      </div>
    </div>
  );
};

export default FileUpload;
