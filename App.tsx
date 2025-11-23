
import React, { useState, useEffect } from 'react';
import RetroCamera from './components/RetroCamera';
import Gallery from './components/Gallery';
import { Photo } from './types';
import { Sparkles, Share, PlusSquare, X, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Install Guide Component
const InstallGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
    <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl flex flex-col gap-4 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <h3 className="text-lg font-bold text-gray-800">Install App</h3>
        <button onClick={onClose} className="p-1 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
            <X size={16} />
        </button>
      </div>
      
      <div className="space-y-4 text-sm text-gray-600">
        <p>Add to your Home Screen for the full fullscreen camera experience.</p>
        
        <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="min-w-[32px] h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-blue-500">
                <Share size={18} />
            </div>
            <div>
                <span className="font-bold text-gray-800 block mb-0.5">Step 1</span>
                Tap the <span className="font-bold">Share</span> button in your browser menu bar.
            </div>
        </div>

         <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="min-w-[32px] h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-700">
                <PlusSquare size={18} />
            </div>
            <div>
                <span className="font-bold text-gray-800 block mb-0.5">Step 2</span>
                Scroll down and select <br/><span className="font-bold">"Add to Home Screen"</span>.
            </div>
        </div>
      </div>

      <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white font-bold rounded-2xl mt-2 shadow-lg hover:bg-black transition-transform active:scale-95">
        Got it!
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [hasPlayedGreeting, setHasPlayedGreeting] = useState(false);

  // Check if running in standalone mode (installed)
  useEffect(() => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);
  }, []);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('retro-photos');
    if (saved) {
      try {
        setPhotos(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load photos", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem('retro-photos', JSON.stringify(photos));
      setStorageError(false);
    } catch (e) {
      console.error("Failed to save photos - storage full?", e);
      // If storage is full, we set an error state but DO NOT crash the app
      if (photos.length > 0) {
        setStorageError(true);
      }
    }
  }, [photos]);

  // Handle first user interaction to play voice
  const handleInteraction = () => {
    if (hasPlayedGreeting) return;

    if ('speechSynthesis' in window) {
        // Cancel any previous speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance("徐雨晖和梁高请看镜头，茄子");
        utterance.lang = 'zh-CN'; 
        utterance.rate = 0.9; 
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        window.speechSynthesis.speak(utterance);
        setHasPlayedGreeting(true);
    }
  };

  const analyzePhotoContent = async (photoId: string, base64Image: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Clean base64 string
      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      
      // Get current time for context
      const now = new Date();
      const timeString = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

      const prompt = `
        请仔细观察这张照片。
        你的任务是生成一个简短的、像拍立得照片备注一样的中文描述。
        
        严格遵守以下人物识别规则：
        1. 如果看到男生，必须称呼他为“梁高”。
        2. 如果看到女生，必须称呼她为“徐雨晖”。
        3. 如果两人同时出现，必须称呼为“徐雨晖和梁高”。
        4. 如果没有看到人，就描述风景或物体。

        输出格式要求：
        "[时间] [地点] [人物在做什么]"
        
        例如：
        "14:30 家里 梁高在喝咖啡"
        "09:15 公园里 徐雨晖和梁高在散步"
        
        当前时间是：${timeString}。请识别照片中的地点场景（如卧室、客厅、街道、海边等）。
        描述要温馨、自然，不要太长（20字以内）。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
             { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
             { text: prompt }
          ]
        }
      });

      const generatedCaption = response.text?.trim();

      if (generatedCaption) {
        setPhotos(prev => prev.map(p => 
          p.id === photoId ? { ...p, caption: generatedCaption } : p
        ));
      }

    } catch (error) {
      console.error("AI Analysis failed:", error);
      setPhotos(prev => prev.map(p => 
        p.id === photoId ? { ...p, caption: "美好的一刻" } : p
      ));
    }
  };

  const handleCapture = (dataUrl: string) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const id = Date.now().toString();

    const newPhoto: Photo = {
      id: id,
      dataUrl,
      timestamp: dateStr,
      caption: "正在显影...", // Temporary caption while AI thinks
      rotation: Math.random() * 6 - 3,
    };

    setPhotos(prev => [...prev, newPhoto]);
    
    // Trigger AI analysis in background
    analyzePhotoContent(id, dataUrl);
  };

  const handleDelete = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleReset = () => {
      if(window.confirm("Clear all photos?")) {
          setPhotos([]);
          localStorage.removeItem('retro-photos');
          setStorageError(false);
      }
  }

  return (
    <div 
      className="min-h-screen w-full bg-[#f0f2f5] flex flex-col items-center overflow-x-hidden font-sans"
      onClick={handleInteraction}
    >
      
      {/* Install Guide Modal */}
      {showInstallGuide && <InstallGuide onClose={() => setShowInstallGuide(false)} />}

      {/* App Bar */}
      <header className="sticky top-0 w-full bg-white/80 backdrop-blur-md px-4 flex items-center justify-between z-50 shadow-sm border-b border-white/50 h-16 relative">
        
        {/* Left Spacer (to balance layout for centering) */}
        <div className="w-16"></div>

        {/* Centered Title */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
           <div className="bg-gradient-to-tr from-orange-400 to-pink-500 p-1.5 rounded-full text-white shadow-sm">
               <Sparkles size={16} fill="currentColor" />
           </div>
           <h1 className="text-xl font-bold text-gray-800 tracking-widest font-sans">日常留念</h1>
        </div>
        
        {/* Right Side Actions */}
        <div className="w-16 flex justify-end">
            {photos.length > 0 && (
                <button 
                    onClick={handleReset}
                    className="text-xs font-bold text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-full border border-transparent hover:bg-red-50 transition-colors"
                >
                    CLEAR
                </button>
            )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md flex flex-col gap-8 p-4 pb-12">
        
        {/* Storage Warning */}
        {storageError && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-3 text-sm text-orange-800 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <div>
              <span className="font-bold block">Storage Full</span>
              New photos won't be saved after you close the app. Please delete some old photos.
            </div>
          </div>
        )}

        {/* Section 1: Camera */}
        <div className="mt-2 flex flex-col items-center">
           <RetroCamera onCapture={handleCapture} />
        </div>

        {/* Section 2: Recent Photos (Gallery) */}
        {photos.length > 0 && (
            <div className="w-full animate-in slide-in-from-bottom-10 duration-700 fade-in">
                <div className="flex items-center justify-between px-2 mb-2">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Your Prints</h2>
                    <span className="text-xs text-gray-400">{photos.length} photos</span>
                </div>
                <div className="bg-gray-200/50 p-1 rounded-3xl shadow-inner border border-white/50 overflow-hidden">
                    <Gallery photos={photos} onDelete={handleDelete} />
                </div>
            </div>
        )}
        
        {photos.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center opacity-40 mt-8">
                <p className="font-hand text-xl rotate-[-5deg]">Snap a memory!</p>
                <div className="w-16 h-0.5 bg-gray-300 mt-2"></div>
            </div>
        )}

      </main>

    </div>
  );
};

export default App;
