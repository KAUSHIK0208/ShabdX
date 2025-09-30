import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Trash2, 
  CheckCircle, 
  WifiOff, 
  HardDrive, 
  Globe,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { offlineTranslationService, type LanguagePack } from '@/services/OfflineTranslation';

const OfflineLanguagePacks = () => {
  const [languagePacks, setLanguagePacks] = useState<LanguagePack[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
  const [isDownloading, setIsDownloading] = useState<{ [key: string]: boolean }>({});
  const [storageInfo, setStorageInfo] = useState({ totalSize: 0, usedSize: 0, availablePacks: 0, downloadedPacks: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    loadLanguagePacks();
    updateStorageInfo();
    
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadLanguagePacks = () => {
    const packs = offlineTranslationService.getAvailableLanguagePacks();
    setLanguagePacks(packs);
  };

  const updateStorageInfo = () => {
    const info = offlineTranslationService.getStorageInfo();
    setStorageInfo(info);
  };

  const handleDownload = async (langCode: string) => {
    if (!isOnline) {
      toast({
        title: 'No internet connection',
        description: 'Please connect to the internet to download language packs',
        variant: 'destructive'
      });
      return;
    }

    setIsDownloading(prev => ({ ...prev, [langCode]: true }));
    setDownloadProgress(prev => ({ ...prev, [langCode]: 0 }));

    try {
      const success = await offlineTranslationService.downloadLanguagePack(
        langCode,
        (progress) => {
          setDownloadProgress(prev => ({ ...prev, [langCode]: progress }));
        }
      );

      if (success) {
        toast({
          title: 'Language pack downloaded!',
          description: `${languagePacks.find(p => p.code === langCode)?.name} is now available offline`,
        });
        loadLanguagePacks();
        updateStorageInfo();
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Failed to download language pack',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(prev => ({ ...prev, [langCode]: false }));
      setDownloadProgress(prev => ({ ...prev, [langCode]: 0 }));
    }
  };

  const handleRemove = async (langCode: string) => {
    try {
      const success = await offlineTranslationService.removeLanguagePack(langCode);
      if (success) {
        toast({
          title: 'Language pack removed',
          description: `${languagePacks.find(p => p.code === langCode)?.name} has been removed from offline storage`
        });
        loadLanguagePacks();
        updateStorageInfo();
      }
    } catch (error) {
      toast({
        title: 'Remove failed',
        description: 'Failed to remove language pack',
        variant: 'destructive'
      });
    }
  };

  const formatSize = (sizeInMB: number): string => {
    return `${sizeInMB.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <WifiOff className="h-6 w-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-slate-800 bg-white/95 px-6 py-2 rounded-lg shadow-lg border border-purple-200">
            Offline Translation
          </h2>
        </div>
        <p className="text-slate-700 bg-white/95 px-6 py-3 rounded-lg inline-block font-medium shadow-lg border border-purple-100">
          Download language packs to translate without internet connection
        </p>
      </div>

      {/* Connection Status */}
      <Card className="glass-card p-4 border border-purple-400/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse shadow-lg`}></div>
            <span className="text-slate-800 font-bold text-lg drop-shadow-sm">
              {isOnline ? 'Online' : 'Offline'} Mode
            </span>
          </div>
          {!isOnline && (
            <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Limited functionality</span>
            </div>
          )}
        </div>
      </Card>

      {/* Storage Info */}
      <Card className="glass-card p-6 border border-purple-400/30">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <HardDrive className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-slate-800 drop-shadow-sm">Storage Usage</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{storageInfo.downloadedPacks}</div>
              <div className="text-sm text-green-600 font-medium">Downloaded</div>
            </div>
            <div className="text-center bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{storageInfo.availablePacks}</div>
              <div className="text-sm text-blue-600 font-medium">Available</div>
            </div>
            <div className="text-center bg-purple-50 p-3 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-700">{formatSize(storageInfo.usedSize)}</div>
              <div className="text-sm text-purple-600 font-medium">Used</div>
            </div>
            <div className="text-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-2xl font-bold text-slate-700">{formatSize(storageInfo.totalSize)}</div>
              <div className="text-sm text-slate-600 font-medium">Total</div>
            </div>
          </div>

          {storageInfo.totalSize > 0 && (
            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">Storage Usage</span>
                <span className="text-slate-800 font-bold">{((storageInfo.usedSize / storageInfo.totalSize) * 100).toFixed(1)}%</span>
              </div>
              <Progress 
                value={(storageInfo.usedSize / storageInfo.totalSize) * 100} 
                className="h-3"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Language Packs */}
      <div className="space-y-4">
        <div className="bg-white/95 p-4 rounded-lg shadow-lg border border-purple-200">
          <h3 className="text-xl font-semibold text-slate-800 flex items-center space-x-2">
            <Globe className="h-5 w-5 text-purple-600" />
            <span>Available Language Packs</span>
          </h3>
        </div>

        <div className="grid gap-4">
          {languagePacks.map((pack) => (
            <Card key={pack.code} className="glass-card p-6 border border-purple-400/30 hover:border-purple-400/50 transition-all">
              <div className="flex items-center justify-between">
                {/* Language Info */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{pack.code === 'ne' ? '🇳🇵' : '🇱🇰'}</div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 drop-shadow-sm">{pack.name}</h4>
                      <p className="text-slate-600 text-sm font-medium">{pack.nativeName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-slate-600 font-medium">
                    <span>Size: {formatSize(pack.size)}</span>
                    <span>Version: {pack.version}</span>
                    {pack.isDownloaded && (
                      <div className="flex items-center space-x-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-semibold">Downloaded</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {!pack.isDownloaded ? (
                    <div className="space-y-2">
                      {isDownloading[pack.code] && (
                        <div className="space-y-1 bg-slate-50 p-2 rounded border">
                          <Progress value={downloadProgress[pack.code] || 0} className="h-2 w-32" />
                          <p className="text-xs text-center text-slate-700 font-bold">
                            {Math.round(downloadProgress[pack.code] || 0)}%
                          </p>
                        </div>
                      )}
                      <Button
                        onClick={() => handleDownload(pack.code)}
                        disabled={isDownloading[pack.code] || !isOnline}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 min-w-32"
                      >
                        {isDownloading[pack.code] ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleRemove(pack.code)}
                      variant="outline"
                      className="border-red-400/30 text-red-400 hover:bg-red-900/20 hover:border-red-400/50 min-w-32"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              {/* Pack Features */}
              {pack.isDownloaded && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center space-x-4 text-sm text-slate-600 font-medium">
                    <span className="flex items-center space-x-1">
                      <span className="text-green-600">✓</span>
                      <span>Word-by-word translation</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="text-green-600">✓</span>
                      <span>Common phrases</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="text-green-600">✓</span>
                      <span>Cached translations</span>
                    </span>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Offline Benefits */}
      <Card className="glass-card p-6 border border-green-400/30 bg-green-50/80">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-700 flex items-center space-x-2 drop-shadow-sm">
            <CheckCircle className="h-5 w-5" />
            <span>Offline Benefits</span>
          </h3>
          <ul className="space-y-3 text-slate-700">
            <li className="flex items-center space-x-3 bg-white/60 p-3 rounded-lg border border-green-200">
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              <span className="font-medium">Translate without internet connection</span>
            </li>
            <li className="flex items-center space-x-3 bg-white/60 p-3 rounded-lg border border-green-200">
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              <span className="font-medium">Faster translation for common words and phrases</span>
            </li>
            <li className="flex items-center space-x-3 bg-white/60 p-3 rounded-lg border border-green-200">
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              <span className="font-medium">No data usage for offline translations</span>
            </li>
            <li className="flex items-center space-x-3 bg-white/60 p-3 rounded-lg border border-green-200">
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              <span className="font-medium">Works in areas with poor connectivity</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default OfflineLanguagePacks;