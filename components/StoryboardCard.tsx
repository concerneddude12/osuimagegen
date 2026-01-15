import React from 'react';
import { StoryboardScene } from '../types';

interface StoryboardCardProps {
  scene: StoryboardScene;
}

const StoryboardCard: React.FC<StoryboardCardProps> = ({ scene }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 transition-all hover:shadow-xl group">
      <div className="aspect-video bg-slate-200 relative overflow-hidden">
        {scene.imageUrl ? (
          <img 
            src={scene.imageUrl} 
            alt={scene.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 flex-col">
            <i className="fas fa-image text-3xl mb-2 opacity-50"></i>
            <span className="text-xs font-medium uppercase tracking-widest">Generating Image...</span>
          </div>
        )}
        <div className="absolute top-3 left-3 bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md">
          {scene.id}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-orange-600 transition-colors">
          {scene.title}
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed italic">
          "{scene.description}"
        </p>
      </div>
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
        <button 
          onClick={() => {
            if (scene.imageUrl) {
                const link = document.createElement('a');
                link.href = scene.imageUrl;
                link.download = `storyboard-scene-${scene.id}.png`;
                link.click();
            }
          }}
          className="text-orange-600 hover:text-orange-700 text-sm font-semibold flex items-center"
          disabled={!scene.imageUrl}
        >
          <i className="fas fa-download mr-1"></i> Download
        </button>
      </div>
    </div>
  );
};

export default StoryboardCard;