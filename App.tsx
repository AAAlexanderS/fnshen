import React, { useState, useEffect } from 'react';
import { AppState, INITIAL_WARDROBE, BodyInfo, Wardrobe, ClothingItem } from './types';
import { ImageUploader } from './components/ImageUploader';
import { generateOutfit } from './services/geminiService';

const DAILY_LIMIT = 10;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    profilePhoto: null,
    profilePreviewUrl: null,
    bodyInfo: {
      gender: 'female',
      heightCm: '170',
      weightKg: '60',
      bodyShape: 'average',
      otherNotes: '',
    },
    wardrobe: INITIAL_WARDROBE,
    style: {
      image: null,
      previewUrl: null,
      textPrompt: '',
    },
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dailyCount, setDailyCount] = useState<number>(0);

  // Initialize Daily Limit
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('gemini_outfit_limit');
    if (stored) {
      try {
        const { date, count } = JSON.parse(stored);
        if (date === today) {
          setDailyCount(count);
        } else {
          localStorage.setItem('gemini_outfit_limit', JSON.stringify({ date: today, count: 0 }));
          setDailyCount(0);
        }
      } catch (e) {
        localStorage.setItem('gemini_outfit_limit', JSON.stringify({ date: today, count: 0 }));
        setDailyCount(0);
      }
    } else {
      localStorage.setItem('gemini_outfit_limit', JSON.stringify({ date: today, count: 0 }));
      setDailyCount(0);
    }
  }, []);

  const incrementLimit = () => {
    const today = new Date().toISOString().split('T')[0];
    const newCount = dailyCount + 1;
    setDailyCount(newCount);
    localStorage.setItem('gemini_outfit_limit', JSON.stringify({ date: today, count: newCount }));
  };

  const updateBodyInfo = (key: keyof BodyInfo, value: string) => {
    setState(prev => ({
      ...prev,
      bodyInfo: { ...prev.bodyInfo, [key]: value }
    }));
  };

  const addWardrobeItem = (category: keyof Wardrobe, file: File) => {
    const newItem: ClothingItem = {
      id: Date.now().toString() + Math.random().toString(),
      file,
      previewUrl: URL.createObjectURL(file)
    };

    setState(prev => {
      const currentList = prev.wardrobe[category];
      if (currentList.length >= 3) return prev; 

      return {
        ...prev,
        wardrobe: {
          ...prev.wardrobe,
          [category]: [...currentList, newItem]
        }
      };
    });
  };

  const removeWardrobeItem = (category: keyof Wardrobe, id: string) => {
    setState(prev => ({
      ...prev,
      wardrobe: {
        ...prev.wardrobe,
        [category]: prev.wardrobe[category].filter(item => item.id !== id)
      }
    }));
  };

  const handleGenerate = async () => {
    if (dailyCount >= DAILY_LIMIT) {
      setError("Daily limit reached. Please come back tomorrow!");
      return;
    }

    if (!state.profilePhoto) {
      setError("Please upload a profile photo first.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const imageUrl = await generateOutfit(state);
      setGeneratedImage(imageUrl);
      incrementLimit();
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Failed to generate outfit. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const remainingGens = Math.max(0, DAILY_LIMIT - dailyCount);

  return (
    // Dark Theme Background
    <div className="h-screen w-full bg-[#09090b] text-zinc-100 font-sans overflow-hidden flex flex-col relative selection:bg-indigo-500/30">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-purple-900/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-900/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light"></div>
      </div>

      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h1 className="text-sm font-bold tracking-tight text-zinc-100 uppercase">AI Outfit Try-On</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden z-10 relative">
        
        {/* Left Panel (Inputs) */}
        <div className="w-[360px] flex-shrink-0 h-full flex flex-col border-r border-white/5 bg-zinc-950/40 backdrop-blur-2xl">
           
           {/* Scrollable Content Container */}
           {/* Added overflow-y-auto to ensure content is accessible if it exceeds height */}
           <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar">
             
             {/* 1. Identity & Style Section */}
             <div className="flex-shrink-0 space-y-2">
               <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest pl-1">01. Identity & Style</h2>
               <div className="bg-zinc-900/30 p-3 rounded-2xl border border-white/5 space-y-3">
                 
                 {/* Images Grid */}
                 <div className="grid grid-cols-2 gap-3">
                    <ImageUploader 
                      label="Profile"
                      maxFiles={1}
                      previewUrl={state.profilePreviewUrl}
                      aspectRatio="aspect-[4/5]" 
                      onFileSelect={(file) => setState(prev => ({ 
                        ...prev, 
                        profilePhoto: file, 
                        profilePreviewUrl: URL.createObjectURL(file) 
                      }))}
                      onClear={() => setState(prev => ({ 
                        ...prev, 
                        profilePhoto: null, 
                        profilePreviewUrl: null 
                      }))}
                    />
                    <ImageUploader 
                      label="Style Ref"
                      maxFiles={1}
                      previewUrl={state.style.previewUrl}
                      aspectRatio="aspect-[4/5]"
                      onFileSelect={(file) => setState(prev => ({ 
                        ...prev, 
                        style: { ...prev.style, image: file, previewUrl: URL.createObjectURL(file) } 
                      }))}
                      onClear={() => setState(prev => ({ 
                        ...prev, 
                        style: { ...prev.style, image: null, previewUrl: null } 
                      }))}
                    />
                 </div>

                 {/* Stats Grid */}
                 <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                    <div className="flex flex-col gap-1">
                       <label className="text-[9px] uppercase text-zinc-500 font-bold ml-0.5">Gender</label>
                       <div className="relative">
                         <select 
                           value={state.bodyInfo.gender}
                           onChange={(e) => updateBodyInfo('gender', e.target.value)}
                           className="w-full bg-black/40 text-[11px] text-zinc-300 py-1.5 px-2 rounded-lg border border-white/5 focus:outline-none focus:border-indigo-500/50 appearance-none hover:border-white/10 transition-colors"
                         >
                           <option value="female">Female</option>
                           <option value="male">Male</option>
                           <option value="non-binary">Non-binary</option>
                         </select>
                       </div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <label className="text-[9px] uppercase text-zinc-500 font-bold ml-0.5">Shape</label>
                       <div className="relative">
                         <select 
                           value={state.bodyInfo.bodyShape}
                           onChange={(e) => updateBodyInfo('bodyShape', e.target.value)}
                           className="w-full bg-black/40 text-[11px] text-zinc-300 py-1.5 px-2 rounded-lg border border-white/5 focus:outline-none focus:border-indigo-500/50 appearance-none hover:border-white/10 transition-colors"
                         >
                           <option value="slim">Slim</option>
                           <option value="average">Average</option>
                           <option value="athletic">Athletic</option>
                           <option value="plus-size">Plus Size</option>
                         </select>
                       </div>
                    </div>
                 </div>
               </div>
             </div>

             {/* 2. Wardrobe Section */}
             <div className="flex-shrink-0 space-y-2">
                <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest pl-1">02. Garments</h2>
                
                {/* Main Body Grid */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                   <ImageUploader 
                      label="Upper Body"
                      aspectRatio="aspect-[3/2]"
                      maxFiles={3}
                      images={state.wardrobe.upperBody}
                      onFileSelect={(f) => addWardrobeItem('upperBody', f)}
                      onRemove={(id) => removeWardrobeItem('upperBody', id)}
                    />
                   <ImageUploader 
                      label="Lower Body"
                      aspectRatio="aspect-[3/2]"
                      maxFiles={3}
                      images={state.wardrobe.lowerBody}
                      onFileSelect={(f) => addWardrobeItem('lowerBody', f)}
                      onRemove={(id) => removeWardrobeItem('lowerBody', id)}
                    />
                </div>

                 {/* Accessories Grid */}
                 <div className="grid grid-cols-3 gap-2">
                   <ImageUploader 
                      label="Headwear"
                      compact
                      maxFiles={3}
                      images={state.wardrobe.headwear}
                      onFileSelect={(f) => addWardrobeItem('headwear', f)}
                      onRemove={(id) => removeWardrobeItem('headwear', id)}
                   />
                   <ImageUploader 
                      label="Accessories"
                      compact
                      maxFiles={3}
                      images={state.wardrobe.accessories}
                      onFileSelect={(f) => addWardrobeItem('accessories', f)}
                      onRemove={(id) => removeWardrobeItem('accessories', id)}
                   />
                   <ImageUploader 
                      label="Shoes"
                      compact
                      maxFiles={3}
                      images={state.wardrobe.footwear}
                      onFileSelect={(f) => addWardrobeItem('footwear', f)}
                      onRemove={(id) => removeWardrobeItem('footwear', id)}
                   />
                </div>
             </div>
           </div>

           {/* Fixed Footer with Generate Button & Limit */}
           <div className="p-4 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 mt-auto z-20">
             <div className="flex flex-col gap-3">
               
               {/* Limit Counter */}
               <div className="flex justify-between items-center px-1">
                 <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Daily Usage</span>
                 <div className="text-[10px] font-medium text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                   <span className={remainingGens === 0 ? "text-red-400 font-bold" : "text-indigo-400 font-bold"}>{remainingGens}</span>
                   <span className="mx-1 text-zinc-600">/</span>
                   <span>{DAILY_LIMIT} runs left</span>
                 </div>
               </div>

               <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || dailyCount >= DAILY_LIMIT}
                  className={`
                    w-full py-3.5 rounded-xl font-bold text-xs tracking-wide shadow-lg
                    flex items-center justify-center gap-2 transition-all duration-300 border border-white/10
                    ${isGenerating || dailyCount >= DAILY_LIMIT
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border-transparent' 
                      : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]'
                    }
                  `}
                >
                  {isGenerating ? "GENERATING..." : "GENERATE OUTFIT"}
               </button>
             </div>
             {error && <p className="text-red-400 text-[10px] text-center mt-3 bg-red-900/20 p-2 rounded-lg border border-red-500/20">{error}</p>}
           </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex items-center justify-center p-10 relative bg-zinc-900/20">
           
           {generatedImage ? (
             <div className="relative w-full h-full flex flex-col items-center justify-center animate-fadeInUp z-10">
                <div className="relative max-h-full rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-zinc-950/50 backdrop-blur-sm group">
                  <div className="absolute inset-0 bg-grid-white/[0.02] -z-10"></div>
                  <img src={generatedImage} alt="Generated Outfit" className="max-h-[85vh] w-auto object-contain relative z-10" />
                  <a 
                     href={generatedImage} 
                     download={`outfit_tryon_${Date.now()}.png`}
                     className="absolute bottom-6 right-6 bg-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded-full text-xs font-bold shadow-xl transition-all flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300 z-20"
                   >
                     Download
                   </a>
                </div>
             </div>
           ) : (
             <div className="text-center space-y-6 opacity-30 z-10">
                <div className="w-32 h-32 mx-auto rounded-full border border-dashed border-zinc-700 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm">
                  <svg className="w-12 h-12 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <div>
                   <p className="text-zinc-500 font-bold tracking-widest text-xs mb-1.5">PREVIEW AREA</p>
                   <p className="text-zinc-600 text-[10px] max-w-xs mx-auto">Upload your profile and garments on the left.</p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default App;