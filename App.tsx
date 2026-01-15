import React, { useState } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import StoryboardCard from './components/StoryboardCard';
import { analyzeContent, generateSceneImage } from './services/geminiService';
import { StoryboardScene, ProcessingState, AppStatus } from './types';

const App: React.FC = () => {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: AppStatus.IDLE,
    progress: 0,
    message: ''
  });
  const [scenes, setScenes] = useState<StoryboardScene[]>([]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleProcess = async (text: string, files: File[]) => {
    try {
      setProcessingState({
        status: AppStatus.ANALYZING,
        progress: 10,
        message: 'Analyzing content and drafting scenes...'
      });
      setScenes([]);

      const imageBase64s = await Promise.all(files.map(fileToBase64));
      
      const storyboardData = await analyzeContent(text, imageBase64s);
      
      // Initialize scenes with no images yet
      setScenes(storyboardData.scenes);
      
      setProcessingState({
        status: AppStatus.GENERATING_IMAGES,
        progress: 30,
        message: 'Bringing your story to life... generating images.'
      });

      const totalScenes = storyboardData.scenes.length;
      const updatedScenes = [...storyboardData.scenes];
      let lastGeneratedImageUrl: string | undefined = undefined;

      // Generate images sequentially to ensure continuity by passing the previous image
      for (let i = 0; i < totalScenes; i++) {
        const scene = updatedScenes[i];
        
        setProcessingState(prev => ({
          ...prev,
          progress: 30 + Math.floor(((i + 1) / totalScenes) * 60),
          message: `Illustrating scene ${i + 1} of ${totalScenes}: ${scene.title}`
        }));

        try {
          // Pass the previous image URL as a reference for consistency
          const imageUrl = await generateSceneImage(scene.visualPrompt, lastGeneratedImageUrl);
          updatedScenes[i] = { ...scene, imageUrl };
          lastGeneratedImageUrl = imageUrl;
          
          // Real-time update of scenes
          setScenes([...updatedScenes]);
        } catch (imgError) {
          console.warn(`Failed to generate image for scene ${i + 1}`, imgError);
          // Don't fail the whole process, just leave image blank and continue without context
          lastGeneratedImageUrl = undefined; 
        }
      }

      setProcessingState({
        status: AppStatus.COMPLETED,
        progress: 100,
        message: 'Storyboard generation complete!'
      });

    } catch (error: any) {
      console.error("Processing error:", error);
      setProcessingState({
        status: AppStatus.ERROR,
        progress: 0,
        message: 'An error occurred during processing.',
        error: error.message || 'Unknown error'
      });
    }
  };

  const reset = () => {
    setScenes([]);
    setProcessingState({
      status: AppStatus.IDLE,
      progress: 0,
      message: ''
    });
  };

  return (
    <div className="pb-20">
      <Header />
      
      <main className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-1 lg:sticky lg:top-8">
            <InputSection 
              onProcess={handleProcess} 
              isLoading={processingState.status === AppStatus.ANALYZING || processingState.status === AppStatus.GENERATING_IMAGES} 
            />

            {processingState.status !== AppStatus.IDLE && (
              <div className="mt-6 bg-white p-5 rounded-xl shadow-md border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Status</h3>
                  <span className="text-xs text-orange-600 font-semibold">{processingState.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                  <div 
                    className="bg-orange-500 h-full transition-all duration-500 ease-out"
                    style={{ width: `${processingState.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-600 flex items-center">
                  {processingState.status === AppStatus.ANALYZING || processingState.status === AppStatus.GENERATING_IMAGES ? (
                    <i className="fas fa-sync fa-spin mr-2 text-orange-500"></i>
                  ) : processingState.status === AppStatus.COMPLETED ? (
                    <i className="fas fa-check-circle mr-2 text-green-500"></i>
                  ) : processingState.status === AppStatus.ERROR ? (
                    <i className="fas fa-exclamation-triangle mr-2 text-red-500"></i>
                  ) : null}
                  {processingState.message}
                </p>
                {processingState.error && (
                  <p className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
                    {processingState.error}
                  </p>
                )}
                {processingState.status === AppStatus.COMPLETED && (
                  <button 
                    onClick={reset}
                    className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors"
                  >
                    Create Another
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-2">
            {scenes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {scenes.map((scene) => (
                  <StoryboardCard key={scene.id} scene={scene} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 opacity-60">
                <i className="fas fa-film text-6xl text-slate-300 mb-4"></i>
                <p className="text-slate-400 font-medium text-lg">Your storyboard will appear here</p>
                <p className="text-slate-400 text-sm">Fill out the form to generate sequential illustrations</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button for Support (Aesthetic) */}
      <div className="fixed bottom-6 right-6">
        <button 
          title="How it works"
          className="bg-orange-600 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center text-white hover:bg-orange-700 transition-transform hover:scale-110"
        >
          <i className="fas fa-question"></i>
        </button>
      </div>
    </div>
  );
};

export default App;