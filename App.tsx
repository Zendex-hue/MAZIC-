import React, { useState, useRef, useEffect } from "react";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { Sidebar } from "./components/Sidebar";
import { ImageEditor } from "./components/ImageEditor";
import { FeatureType } from "./types";
import {
  generateImage,
  generateStory,
  generateRecipe,
  translateText,
  askGeneralQuestion,
  writeSummary,
  makeCode,
} from "./services/geminiService";
import { motion, AnimatePresence } from "motion/react";
import {
  Image as ImageIcon,
  BookOpen,
  ChefHat,
  Languages,
  Send,
  Paperclip,
  X,
  Sparkles,
  FileText,
  Code,
  Edit2,
  Download,
} from "lucide-react";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<FeatureType>("HOME");
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<any>(null);
  const [pinnedImage, setPinnedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string, type?: 'TEXT' | 'IMAGE', imageBase64?: string}>>([]);
  const [geminiHistory, setGeminiHistory] = useState<Array<{role: string, parts: any[]}>>([]);
  const [suggestedFeature, setSuggestedFeature] = useState<{type: FeatureType, icon: any, label: string, prompt: string} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [chatSessions, setChatSessions] = useState<Array<{id: string, title: string, date: string}>>([]);
  const [randomFeatures, setRandomFeatures] = useState<typeof featuresList>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const featuresList = [
    { type: 'IMAGE' as FeatureType, icon: ImageIcon, label: 'Generate Image', prompt: 'A futuristic city at sunset' },
    { type: 'IMAGE' as FeatureType, icon: ImageIcon, label: 'Ghibli Style', prompt: 'A magical forest in Studio Ghibli style, anime art, vibrant colors' },
    { type: 'STORY' as FeatureType, icon: BookOpen, label: 'Write Story', prompt: 'Write a short story about a time traveler' },
    { type: 'RECIPE' as FeatureType, icon: ChefHat, label: 'Learn Recipe', prompt: 'How do I make authentic carbonara?' },
    { type: 'TRANSLATE' as FeatureType, icon: Languages, label: 'Translate Text', prompt: 'Hello world to Spanish' },
    { type: 'SUMMARY' as FeatureType, icon: FileText, label: 'Write Summary', prompt: 'Summarize the plot of The Matrix' },
    { type: 'CODE' as FeatureType, icon: Code, label: 'Make Code', prompt: 'Write a Python script to scrape a website' }
  ];

  const shuffleFeatures = () => {
    const shuffled = [...featuresList].sort(() => 0.5 - Math.random());
    setRandomFeatures(shuffled.slice(0, 4));
  };

  useEffect(() => {
    shuffleFeatures();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPinnedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      const title = messages[0].content.substring(0, 30) + (messages[0].content.length > 30 ? '...' : '');
      setChatSessions(prev => [{
        id: Date.now().toString(),
        title: title || 'New Chat',
        date: new Date().toLocaleDateString()
      }, ...prev]);
    }
    setMessages([]);
    setGeminiHistory([]);
    setCurrentView("HOME");
    setResult(null);
    setIsSidebarOpen(false);
    shuffleFeatures();
  };

  const handleSelectFeature = (type: FeatureType, featurePrompt: string) => {
    setCurrentView(type);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    setChatSessions(prev => prev.filter(session => session.id !== id));
  };

  const handleDownloadImage = (base64Data: string, filename = 'mazic-image.png') => {
    const a = document.createElement('a');
    a.href = base64Data;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getLoadingMessage = (view: FeatureType) => {
    switch (view) {
      case "IMAGE": return "Generating image...";
      case "STORY": return "Writing story...";
      case "RECIPE": return "Learning recipe...";
      case "TRANSLATE": return "Translating text...";
      case "SUMMARY": return "Writing summary...";
      case "CODE": return "Making code...";
      case "HOME":
      case "CHAT":
      default: return "Thinking...";
    }
  };

  const handleAction = async (forcedType?: FeatureType) => {
    const activeType = forcedType || currentView;
    const inputPrompt = prompt.trim();
    if (!inputPrompt && !pinnedImage) return;

    const userMessage = {
      role: 'user' as const,
      content: inputPrompt,
      imageBase64: pinnedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt("");
    setPinnedImage(null);
    setIsLoading(true);
    setResult(null);

    const isImageRequest = /generate.*image|make.*photo|draw|create.*picture|ghibli/i.test(inputPrompt);
    let effectiveView = activeType === "FEATURES" ? "HOME" : activeType;
    
    if (effectiveView === "HOME" && isImageRequest) {
      effectiveView = "IMAGE";
    }

    if (effectiveView !== "HOME") setCurrentView(effectiveView);

    try {
      let res;
      switch (effectiveView) {
        case "IMAGE":
          res = await generateImage(inputPrompt, userMessage.imageBase64);
          setResult({ type: "IMAGE", data: res });
          setMessages(prev => [...prev, { role: 'assistant', content: res || '', type: 'IMAGE' }]);
          break;
        case "STORY":
          res = await generateStory(inputPrompt);
          setResult({ type: "TEXT", data: res });
          setMessages(prev => [...prev, { role: 'assistant', content: res }]);
          break;
        case "RECIPE":
          res = await generateRecipe(inputPrompt);
          setResult({ type: "TEXT", data: res });
          setMessages(prev => [...prev, { role: 'assistant', content: res }]);
          break;
        case "TRANSLATE":
          const parts = inputPrompt.split(" to ");
          res = await translateText(parts[0], parts[1] || "Spanish");
          setResult({ type: "TEXT", data: res });
          setMessages(prev => [...prev, { role: 'assistant', content: res }]);
          break;
        case "SUMMARY":
          res = await writeSummary(inputPrompt);
          setResult({ type: "TEXT", data: res });
          setMessages(prev => [...prev, { role: 'assistant', content: res }]);
          break;
        case "CODE":
          res = await makeCode(inputPrompt);
          setResult({ type: "TEXT", data: res });
          setMessages(prev => [...prev, { role: 'assistant', content: res }]);
          break;
        case "HOME":
        case "CHAT":
        default:
          res = await askGeneralQuestion(
            inputPrompt || "Tell me about this image",
            userMessage.imageBase64,
            geminiHistory
          );
          
          const newHistoryParts: any[] = [{ text: inputPrompt || "Tell me about this image" }];
          if (userMessage.imageBase64) {
            newHistoryParts.push({
              inlineData: {
                mimeType: "image/jpeg",
                data: userMessage.imageBase64.split(',')[1]
              }
            });
          }
          
          setGeminiHistory(prev => [
            ...prev,
            { role: "user", parts: newHistoryParts },
            { role: "model", parts: [{ text: res }] }
          ]);
          
          setMessages(prev => [...prev, { role: 'assistant', content: res }]);
          break;
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderChat = () => (
    <div className="flex flex-col space-y-6 pb-8">
      {messages.length === 0 && !prompt.trim() && !pinnedImage ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-8 mt-12">
          <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight">How can I help you today?</h2>
          
          <div className="grid grid-cols-2 gap-3 md:gap-4 w-full max-w-2xl mt-8">
            {randomFeatures.map((feature, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: idx * 0.05, duration: 0.2 }}
                onClick={() => {
                  setCurrentView(feature.type);
                }}
                className="px-4 py-4 md:px-6 md:py-5 rounded-full border border-white/5 bg-zinc-900/50 hover:bg-zinc-800/80 text-center transition-all duration-300 flex items-center justify-center gap-3 group hover:scale-[1.02] hover:shadow-lg hover:shadow-white/5"
              >
                <feature.icon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                <span className="text-sm md:text-base font-medium text-zinc-200 whitespace-nowrap overflow-hidden text-ellipsis">{feature.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-5 ${
              msg.role === 'user' 
                ? 'bg-zinc-800 text-white rounded-br-sm' 
                : 'bg-transparent text-zinc-300'
            }`}>
              {msg.imageBase64 && (
                <img src={msg.imageBase64} alt="Uploaded" className="w-48 h-48 object-cover rounded-xl mb-3 shadow-md" />
              )}
              {msg.type === 'IMAGE' ? (
                msg.content ? (
                  <div className="relative group">
                    <img src={msg.content} alt="Generated" className="w-full rounded-xl shadow-md" />
                    <button
                      onClick={() => handleDownloadImage(msg.content)}
                      className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                      title="Download Image"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-red-400 text-sm">Failed to generate image.</div>
                )
              ) : (
                <div className="prose prose-invert prose-zinc max-w-none leading-relaxed whitespace-pre-wrap font-sans text-sm md:text-base">
                  {msg.content}
                </div>
              )}
            </div>
          </motion.div>
        ))
      )}
      {isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
          <div className="p-4">
            <LoadingSpinner message={getLoadingMessage(currentView)} />
          </div>
        </motion.div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );

  return (
    <div className="h-screen relative overflow-hidden bg-zinc-950 text-zinc-50 selection:bg-white/30 flex font-sans">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        onNewChat={handleNewChat}
        onSelectFeature={handleSelectFeature}
        chatSessions={chatSessions}
        onDeleteSession={handleDeleteSession}
      />
      
      <div className={`flex-1 relative transition-all duration-200 h-screen flex flex-col overflow-hidden ${isSidebarOpen ? 'md:ml-[280px]' : 'ml-0'}`}>
        <main className="flex-1 pb-32 flex flex-col relative z-10 w-full overflow-hidden">
          {/* Minimalist Header */}
          <header className="absolute top-0 left-0 right-0 pt-6 pb-4 px-6 flex justify-between items-center pointer-events-none z-20 bg-zinc-950/80 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center gap-2 cursor-pointer pointer-events-auto" onClick={() => { setCurrentView("HOME"); setResult(null); }}>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-white">
                MAZIC
              </h1>
            </div>
          </header>

          <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 overflow-y-auto px-4 no-scrollbar pt-24">
        <AnimatePresence mode="wait">
          {currentView === "HOME" ? (
            <motion.div
              key="home"
              className="flex-1 flex flex-col"
            >
              {renderChat()}
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8 flex-1"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  {currentView} MODE
                </h2>
                <button
                  onClick={() => {
                    setCurrentView("HOME");
                    setResult(null);
                  }}
                  className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Close
                </button>
              </div>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12"
                >
                  <LoadingSpinner message={getLoadingMessage(currentView)} />
                </motion.div>
              )}

              {result && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-6 md:p-8 rounded-3xl"
                >
                  {result.type === "IMAGE" ? (
                    result.data ? (
                      <div className="relative group inline-block w-full">
                        <img
                          src={result.data}
                          className="rounded-2xl w-full shadow-2xl object-cover"
                          alt="Generated Result"
                        />
                        <button
                          onClick={() => handleDownloadImage(result.data)}
                          className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-lg"
                          title="Download Image"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-red-400">Failed to generate image.</div>
                    )
                  ) : (
                    <div className="prose prose-invert prose-zinc max-w-none text-lg leading-relaxed whitespace-pre-wrap font-sans">
                      {result.data}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
          </div>
      </main>

        {/* Input Area */}
        <div className={`fixed bottom-0 right-0 p-4 md:p-8 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent z-30 transition-all duration-200 ${isSidebarOpen ? 'left-0 md:left-[280px]' : 'left-0'}`}>
          <div className="max-w-3xl mx-auto relative">
          <AnimatePresence>
            {pinnedImage && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-full mb-4 left-4"
              >
                <div className="relative group">
                  <img
                    src={pinnedImage}
                    className="w-20 h-20 object-cover rounded-2xl border border-white/10 shadow-xl"
                    alt="Pinned"
                  />
                  <button
                    onClick={() => setIsEditingImage(true)}
                    className="absolute -top-2 right-6 bg-zinc-800 text-zinc-300 hover:text-white rounded-full p-1.5 shadow-lg border border-white/10 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setPinnedImage(null)}
                    className="absolute -top-2 -right-2 bg-zinc-800 text-zinc-300 hover:text-white rounded-full p-1.5 shadow-lg border border-white/10 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-3xl p-2 flex items-center transition-all bg-zinc-900 border border-white/10 focus-within:border-white/30 shadow-2xl">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
              title="Attach image"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAction()}
              placeholder="Message Mazic..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-white px-2 placeholder:text-zinc-500 font-medium outline-none"
            />

            <button
              onClick={() => handleAction()}
              disabled={isLoading || (!prompt.trim() && !pinnedImage)}
              className="bg-white text-black disabled:bg-zinc-800 disabled:text-zinc-500 w-10 h-10 rounded-full font-bold transition-colors flex items-center justify-center shrink-0 mr-1"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>
      </div>
      
      <AnimatePresence>
        {isEditingImage && pinnedImage && (
          <ImageEditor
            imageUrl={pinnedImage}
            onSave={(editedImage) => {
              setPinnedImage(editedImage);
              setIsEditingImage(false);
            }}
            onCancel={() => setIsEditingImage(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
