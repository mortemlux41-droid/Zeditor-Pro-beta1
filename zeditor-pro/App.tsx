
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { EditorTool, Adjustments, FILTERS, Filter, NanoBananaModel } from './types';
import {
  IconAdjust, IconFilter, IconAI, IconTransform, IconUpload,
  IconClose, IconCheck, IconSave, IconUndo, IconMenuMore, IconBrightness,
  IconSettings, IconGlobe, IconMoon
} from './components/Icons';
import { Logo } from './components/Logo';
import { geminiService } from './services/geminiService';

const Sparkle: React.FC<{ x: number, y: number }> = ({ x, y }) => (
  <div className="sparkle fixed pointer-events-none z-[9999]" style={{ left: x, top: y }}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="white" className="animate-pulse opacity-80">
      <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
    </svg>
  </div>
);

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<EditorTool>(EditorTool.NONE);
  const [sparkles, setSparkles] = useState<{ id: number, x: number, y: number }[]>([]);
  const [showExportHub, setShowExportHub] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings States
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [language, setLanguage] = useState<'ES' | 'EN' | 'KR'>('ES');
  const [highPrecision, setHighPrecision] = useState(true);

  const [adjustments, setAdjustments] = useState<Adjustments>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    exposure: 100,
    vignette: 0,
    sharpness: 0,
  });
  const [activeFilter, setActiveFilter] = useState<Filter>(FILTERS[0]);
  const [rotation, setRotation] = useState(0);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<string>('free');

  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<NanoBananaModel>(NanoBananaModel.PRO);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  const addSparkles = (e?: React.MouseEvent | { x: number, y: number }) => {
    const x = e && 'clientX' in e ? e.clientX : window.innerWidth / 2;
    const y = e && 'clientY' in e ? e.clientY : window.innerHeight / 2;
    const newSparkles = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() + i,
      x: x + (Math.random() - 0.5) * 120,
      y: y + (Math.random() - 0.5) * 120,
    }));
    setSparkles(prev => [...prev, ...newSparkles].slice(-50));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImage(result);
        setHistory([result]);
        resetState();
        addSparkles();
      };
      reader.readAsDataURL(file);
    }
  };

  const resetState = () => {
    setActiveTool(EditorTool.NONE);
    setAdjustments({ brightness: 100, contrast: 100, saturation: 100, exposure: 100, vignette: 0, sharpness: 0 });
    setActiveFilter(FILTERS[0]);
    setRotation(0); setScaleX(1); setScaleY(1); setAspectRatio('free');
  };

  const handleAiEdit = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiPrompt;
    if (!image || !promptToUse) return;
    setIsProcessing(true);
    addSparkles();
    try {
      const result = await geminiService.processImage(image, promptToUse, selectedModel);
      if (result) {
        setImage(result);
        setHistory(prev => [...prev, result]);
        setAiPrompt('');
        addSparkles();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const undo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      setHistory(newHistory);
      setImage(newHistory[newHistory.length - 1]);
      resetState();
    }
  };

  const imageStyle = useMemo((): React.CSSProperties => {
    const filters = [
      activeFilter.css,
      `brightness(${adjustments.brightness}%)`,
      `contrast(${adjustments.contrast}%)`,
      `saturate(${adjustments.saturation}%)`,
    ].filter(Boolean).join(' ');

    return {
      filter: filters,
      transform: `rotate(${rotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
      transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: (aspectRatio === 'free' ? 'contain' : 'cover') as any,
      aspectRatio: aspectRatio === 'free' ? 'auto' : aspectRatio.replace(':', '/'),
    };
  }, [activeFilter, adjustments, rotation, scaleX, scaleY, aspectRatio]);

  const saveImage = (resolution: 'orig' | '2k' | '4k') => {
    if (!image) return;
    addSparkles();

    const img = new Image();
    img.src = image;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let targetWidth = img.width;
      let targetHeight = img.height;

      if (resolution === '2k') {
        const ratio = 2560 / img.width;
        targetWidth = 2560; targetHeight = img.height * ratio;
      } else if (resolution === '4k') {
        const ratio = 3840 / img.width;
        targetWidth = 3840; targetHeight = img.height * ratio;
      }

      canvas.width = targetWidth; canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.filter = imageStyle.filter || '';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const link = document.createElement('a');
        link.download = `ZEditor_PRO_${resolution}_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      }
      setShowExportHub(false);
    };
  };

  return (
    <div className={`fixed inset-0 flex flex-col ${theme === 'dark' ? 'bg-[#020204]' : 'bg-[#f0f0f5]'} text-white overflow-hidden select-none font-sans`}>
      {/* Splash Screen */}
      {showSplash && (
        <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center animate-fade-out">
          <Logo className="w-48 h-48 mb-10 scale-100 shadow-[0_0_80px_rgba(99,102,241,0.2)]" />
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-black tracking-[0.8em] text-white/40 uppercase">ZEditor PRO | NEURAL 2026</span>
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-indigo-500/60 mt-2">Enhanced by Gemini 3.0 Suite</span>
            <div className="w-40 h-[1px] bg-white/10 rounded-full overflow-hidden mt-6">
              <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-[loading-bar_2s_linear_infinite]" />
            </div>
          </div>
        </div>
      )}

      {/* Luminous Ambient Glow */}
      {image && (
        <div className="absolute inset-0 opacity-[0.12] blur-[120px] pointer-events-none scale-150 transition-opacity duration-1000"
          style={{ backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      )}

      {/* Sparkles */}
      {sparkles.map(s => <Sparkle key={s.id} x={s.x} y={s.y} />)}

      {/* Header */}
      <header className="h-20 flex items-center justify-between px-6 z-50 pt-[env(safe-area-inset-top)] bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          <button
            aria-label="Ajustes"
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 flex items-center justify-center glass-premium rounded-full active-scale transition-all border-white/5">
            <IconSettings />
          </button>
        </div>

        <div className="flex items-center gap-4 group absolute left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-black tracking-tight leading-none shimmer-text uppercase">ZEditor <span className="text-white/40 italic">PRO</span></h1>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20 mt-1">S26 Ultra Neural Suite</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {image && (
            <button
              aria-label="Deshacer"
              onClick={undo}
              disabled={history.length <= 1}
              className={`w-10 h-10 flex items-center justify-center glass-premium rounded-full active-scale transition-all ${history.length <= 1 ? 'opacity-5' : 'opacity-100'}`}>
              <IconUndo />
            </button>
          )}
          <div className="relative">
            <button
              aria-label="Exportar"
              onClick={() => image && setShowExportHub(!showExportHub)}
              disabled={!image}
              className={`px-5 h-10 rounded-full font-black text-[10px] uppercase tracking-widest active-scale transition-all border border-white/10 ${image ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-white/20'}`}>
              Save
            </button>

            {showExportHub && (
              <div className="absolute top-12 right-0 w-56 glass-premium squircle-lg p-2 shadow-2xl z-[100] slide-up border border-white/10 overflow-hidden">
                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 px-4 py-2 border-b border-white/5 mb-1">Export Lab</div>
                {['orig', '2k', '4k'].map((res) => (
                  <button key={res} onClick={() => saveImage(res as any)}
                    className="w-full text-left px-4 py-3.5 hover:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex justify-between items-center active-scale">
                    {res === 'orig' ? 'Standard' : res.toUpperCase()}
                    {res !== 'orig' && <span className="text-[8px] text-indigo-400 font-black">ULTRA</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-premium squircle-ultra p-8 modal-open border-white/10 shadow-[0_50px_100px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-10">
              <div className="flex flex-col">
                <h3 className="text-2xl font-black italic tracking-tight uppercase">Ajustes</h3>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mt-1">PRO Configuration</span>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-12 h-12 glass-premium rounded-2xl flex items-center justify-center active-scale"><IconClose /></button>
            </div>

            <div className="space-y-8">
              {/* Galaxy AI Hub Status */}
              <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <IconAI />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-wider">Galaxy AI Hub</span>
                    <span className="text-[9px] text-green-400 font-black uppercase tracking-widest mt-0.5">Vínculo Activo</span>
                  </div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse" />
              </div>

              {/* Theme Selection */}
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 px-2">Apariencia</span>
                <div className="grid grid-cols-2 gap-3">
                  {['dark', 'light'].map(t => (
                    <button key={t} onClick={() => setTheme(t as any)}
                      className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all flex items-center justify-center gap-3 ${theme === t ? 'bg-white text-black border-white' : 'glass-premium border-white/5 text-white/40'}`}>
                      <IconMoon /> {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 px-2">Idioma</span>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {['ES', 'EN', 'KR'].map(l => (
                    <button key={l} onClick={() => setLanguage(l as any)}
                      className={`px-8 py-5 rounded-2xl font-black text-[11px] border transition-all ${language === l ? 'bg-indigo-600 text-white border-indigo-400 shadow-xl' : 'glass-premium border-white/5 text-white/40'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Precision Toggle */}
              <div onClick={() => setHighPrecision(!highPrecision)}
                className="flex items-center justify-between p-2 cursor-pointer group">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-black uppercase tracking-widest">Motor Neural Pro</span>
                  <span className="text-[9px] font-bold text-white/20">Generación de alta fidelidad 4K</span>
                </div>
                <div className={`w-14 h-8 rounded-full p-1 transition-all duration-500 ${highPrecision ? 'bg-indigo-500' : 'bg-white/10'}`}>
                  <div className={`w-6 h-6 rounded-full bg-white transition-all duration-500 shadow-md ${highPrecision ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>

            <div className="mt-12 text-center opacity-20 hover:opacity-100 transition-opacity">
              <span className="text-[9px] font-black uppercase tracking-[0.5em]">ZEditor PRO © 2026 Samsung Electronics</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 relative flex items-center justify-center p-4 z-10 overflow-hidden">
        {!image ? (
          <div onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-[320px] aspect-[4/5] glass-premium squircle-ultra flex flex-col items-center justify-center gap-10 active-scale cursor-pointer group border border-white/5 transition-transform hover:rotate-1">
            <div className="relative">
              <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center shadow-xl group-hover:scale-105 transition-all">
                <IconUpload />
              </div>
              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100" />
            </div>
            <div className="text-center px-10">
              <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase italic text-white">STUDIO <span className="text-indigo-500">PRO</span></h2>
              <p className="text-[10px] text-white/30 font-black tracking-[0.6em] uppercase">Galaxy S26 Ultra Edition</p>
            </div>
            <div className="px-10 py-4 glass-premium rounded-full text-[9px] font-black uppercase tracking-[0.5em] text-white/40 border-white/5 group-hover:text-white group-hover:border-white/20 transition-all">
              Launch Creative Hub
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          </div>
        ) : (
          <div className={`w-full h-full flex items-center justify-center relative transition-all duration-[1s] cubic-bezier(0.16, 1, 0.3, 1) ${activeTool !== EditorTool.NONE ? 'scale-[0.82] -translate-y-20' : 'scale-100'}`}>
            <div className={`relative rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 max-w-full max-h-full transition-all ${isProcessing ? 'scale-95' : ''}`}>
              <div className={`neural-grid ${isProcessing ? 'active' : ''}`} />
              {isProcessing && <div className="aurora-wave" />}

              <img src={image} style={imageStyle} alt="S26 Masterpiece" className={`${isProcessing ? 'opacity-30 blur-[60px] grayscale scale-110 contrast-150' : 'opacity-100'}`} />

              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-12 z-50">
                  <div className="neural-core">
                    <div className="neural-ring" />
                    <div className="neural-ring-alt" />
                    <div className="scale-[2.5] text-white animate-pulse">
                      <IconAI />
                    </div>
                    {/* Floating Data Particles */}
                    <div className="absolute inset-[-40px] pointer-events-none">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute w-1.5 h-1.5 bg-white rounded-full blur-[1px]"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `core-breathe ${1.5 + i}s infinite ease-in-out`
                          }} />
                      ))}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black tracking-[0.8em] uppercase shimmer-text italic">Synthesizing...</p>
                    <p className="text-[10px] font-black tracking-[1.2em] text-white/30 uppercase mt-5">ZEditor PRO Neural Engine 9.5</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Control Panel */}
      {image && activeTool !== EditorTool.NONE && (
        <div className="fixed bottom-28 left-4 right-4 z-50 slide-up">
          <div className="glass-premium squircle-lg p-7 shadow-[0_50px_100px_rgba(0,0,0,0.9)] border border-white/10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-[0.5em] shimmer-text italic">
                  {activeTool === 'adjust' ? 'Neural Tuning' : activeTool === 'filter' ? 'Spectrum Prism' : activeTool === 'ai' ? 'Neural Workspace' : 'Advanced'}
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mt-2">Vision Hub v.26.0</span>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setActiveTool(EditorTool.NONE)} className="w-11 h-11 glass-premium rounded-2xl flex items-center justify-center active-scale border-white/10"><IconClose /></button>
                <button onClick={(e) => { addSparkles(e); setActiveTool(EditorTool.NONE); }} className="w-11 h-11 bg-white text-black rounded-2xl flex items-center justify-center active-scale shadow-xl"><IconCheck /></button>
              </div>
            </div>

            <div className="max-h-[38vh] overflow-y-auto no-scrollbar pb-2">
              {activeTool === EditorTool.ADJUST && (
                <div className="space-y-10 pb-6">
                  {[
                    { label: 'Luminancia', key: 'brightness', min: 0, max: 200 },
                    { label: 'Dinámica', key: 'contrast', min: 0, max: 200 },
                    { label: 'Pureza', key: 'saturation', min: 0, max: 200 },
                  ].map(adj => (
                    <div key={adj.key} className="space-y-5">
                      <div className="flex justify-between items-end px-1">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">{adj.label}</span>
                        <span className="text-lg font-black text-indigo-400 italic">{(adjustments as any)[adj.key]}%</span>
                      </div>
                      <input type="range" min={adj.min} max={adj.max} value={(adjustments as any)[adj.key]}
                        onChange={(e) => setAdjustments(p => ({ ...p, [adj.key]: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-white/10 rounded-full appearance-none accent-indigo-500 cursor-pointer" />
                    </div>
                  ))}
                </div>
              )}

              {activeTool === EditorTool.FILTER && (
                <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x">
                  {FILTERS.map(f => (
                    <button key={f.id} onClick={() => setActiveFilter(f)} className="flex-shrink-0 flex flex-col items-center gap-4 snap-center group">
                      <div className={`w-22 h-22 rounded-[2rem] overflow-hidden border-[4px] transition-all duration-700 ${activeFilter.id === f.id ? 'border-indigo-500 scale-105 shadow-[0_15px_30px_rgba(99,102,241,0.4)]' : 'border-transparent opacity-50'}`}>
                        <img src={image} style={{ filter: f.css }} className="w-full h-full object-cover" />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeFilter.id === f.id ? 'text-indigo-400' : 'text-white/20'}`}>{f.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTool === EditorTool.AI && (
                <div className="space-y-8 pb-4">
                  {/* Model Selector */}
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {[
                      { id: NanoBananaModel.FAST, name: 'Neural Flash', label: 'FAST' },
                      { id: NanoBananaModel.FAST_3, name: 'Gemini 3.0 Fast', label: 'SPEED' },
                      { id: NanoBananaModel.PRO, name: 'Gemini 3.0 Pro', label: 'EXPERIMENTAL' },
                      { id: NanoBananaModel.ULTRA, name: 'Neural Ultra', label: '2.0 EXP' }
                    ].map(m => (
                      <button key={m.id} onClick={() => setSelectedModel(m.id)}
                        className={`flex-shrink-0 px-6 py-4 rounded-2xl border transition-all flex flex-col items-start gap-1 ${selectedModel === m.id ? 'bg-indigo-600 border-indigo-400 shadow-xl' : 'glass-premium border-white/5 opacity-40'}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest">{m.name}</span>
                        <span className={`text-[7px] font-black tracking-widest ${selectedModel === m.id ? 'text-indigo-200' : 'text-white/20'}`}>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="relative group">
                    <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={`Describe tu visión a ${selectedModel.includes('pro') ? 'Gemini 3.0 Pro' : selectedModel.includes('fast_3') ? 'Gemini 3.0 Fast' : 'Nano Banana Hub'}...`}
                      className="w-full bg-white/[0.03] glass-premium rounded-[2.5rem] p-8 text-base font-bold placeholder:text-white/10 focus:outline-none min-h-[160px] resize-none border border-white/10 shadow-inner focus:border-indigo-500/40 transition-all" />
                    <button
                      aria-label="Ejecutar"
                      onClick={() => handleAiEdit()}
                      disabled={!aiPrompt || isProcessing}
                      className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.2rem] flex items-center justify-center active-scale shadow-2xl disabled:opacity-10 group-focus-within:scale-110 transition-transform">
                      <div className="scale-125"><IconAI /></div>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {['Neural Expansion 4K', 'Gen-AI Studio Background', 'Remaster Masterpiece', 'Ray Tracing Light'].map(opt => (
                      <button key={opt} onClick={() => handleAiEdit(opt)}
                        className="px-6 py-4 glass-premium rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] text-white/40 active-scale border border-white/5 hover:text-white transition-all hover:bg-white/5">
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === EditorTool.MORE && (
                <div className="grid grid-cols-2 gap-5 pb-4">
                  <button onClick={() => handleAiEdit("Eraser Pro High Precision")} className="p-8 glass-premium rounded-[2.5rem] flex flex-col items-center gap-5 active-scale border border-white/10 hover:bg-white/5 transition-colors group">
                    <div className="scale-150 text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity"><IconTransform /></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mt-2">Magic Eraser</span>
                  </button>
                  <button onClick={() => handleAiEdit("Portrait Pro Lighting Suite")} className="p-8 glass-premium rounded-[2.5rem] flex flex-col items-center gap-5 active-scale border border-white/10 hover:bg-white/5 transition-colors group">
                    <div className="scale-150 text-purple-400 opacity-60 group-hover:opacity-100 transition-opacity"><IconBrightness /></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mt-2">Relight Pro</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="h-24 glass-premium border-t border-white/5 flex items-center justify-around px-4 pb-[env(safe-area-inset-bottom)] z-[100] shadow-2xl">
        <NavButton active={activeTool === EditorTool.ADJUST} onClick={() => setActiveTool(EditorTool.ADJUST)} icon={<IconAdjust />} label="Lab" disabled={!image} />
        <NavButton active={activeTool === EditorTool.FILTER} onClick={() => setActiveTool(EditorTool.FILTER)} icon={<IconFilter />} label="Prism" disabled={!image} />

        <div className="relative -top-10">
          {isProcessing && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#4f46e5] via-[#8b5cf6] to-[#d946ef] animate-[ai-processing-pulse_2.5s_infinite]" style={{ transform: 'scale(1.2)' }} />
          )}
          <button
            aria-label="Galaxy AI Hub"
            onClick={() => image && setActiveTool(EditorTool.AI)}
            disabled={!image}
            className={`relative w-20 h-20 rounded-full bg-gradient-to-br from-[#4f46e5] via-[#8b5cf6] to-[#d946ef] flex items-center justify-center shadow-2xl transition-all nav-active-scale disabled:opacity-10 ${activeTool === EditorTool.AI ? 'scale-110 ring-[6px] ring-white/10 rotate-[-15deg]' : ''}`}>
            <div className={`scale-[2] text-white transition-transform ${activeTool === EditorTool.AI ? 'rotate-[15deg]' : ''}`}>
              <IconAI />
            </div>
            {image && !isProcessing && activeTool !== EditorTool.AI && (
              <div className="absolute inset-0 rounded-full border-[6px] border-white/20 animate-[ping-slow_4s_infinite]" />
            )}
          </button>
        </div>

        <NavButton active={activeTool === EditorTool.TRANSFORM} onClick={() => setActiveTool(EditorTool.TRANSFORM)} icon={<IconTransform />} label="Morph" disabled={!image} />
        <NavButton active={activeTool === EditorTool.MORE} onClick={() => setActiveTool(EditorTool.MORE)} icon={<IconMenuMore />} label="Nova" disabled={!image} />
      </nav>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes ping-slow { 0% { transform: scale(1); opacity: 0.3; } 100% { transform: scale(2.2); opacity: 0; } }
        .w-22 { width: 5.5rem; } .h-22 { height: 5.5rem; }
      `}} />
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string, disabled?: boolean }> = ({ active, onClick, icon, label, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    className={`flex flex-col items-center gap-2.5 transition-all flex-1 py-4 ${disabled ? 'opacity-5' : active ? 'text-white' : 'text-white/20 nav-active-scale'}`}>
    <div className={`transition-all duration-700 ${active ? 'scale-150 -translate-y-4 text-indigo-400' : 'scale-110'}`}>
      {icon}
    </div>
    <span className={`text-[9px] font-black tracking-[0.4em] uppercase transition-all ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
    {active && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 animate-pulse shadow-[0_0_15px_#6366f1]" />}
  </button>
);

export default App;
