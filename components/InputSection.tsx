import React, { useState } from 'react';

interface InputSectionProps {
  onProcess: (text: string, files: File[]) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onProcess, isLoading }) => {
  const [text, setText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text && selectedFiles.length === 0) return;
    onProcess(text, selectedFiles);
  };

  return (
    <section className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
        <i className="fas fa-magic text-orange-500 mr-2"></i>
        Import Content
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Story Text, Textbooks, etc
          </label>
          <textarea
            className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none text-slate-600"
            placeholder="Paste text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Upload Pages or Images (Optional)
          </label>
          <div className="flex items-center justify-center w-full">
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isLoading ? 'bg-slate-100 border-slate-300' : 'bg-slate-50 border-slate-300 hover:bg-orange-50 hover:border-orange-400'}`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <i className={`fas fa-cloud-upload-alt text-2xl mb-3 ${isLoading ? 'text-slate-400' : 'text-slate-500'}`}></i>
                <p className="mb-2 text-sm text-slate-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-400">PNG, JPG or JPEG (Max 4 images)</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                multiple 
                accept="image/*" 
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </label>
          </div>
          {selectedFiles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedFiles.map((f, i) => (
                <span key={i} className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded flex items-center">
                  <i className="fas fa-image mr-1"></i> {f.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || (!text && selectedFiles.length === 0)}
          className={`w-full py-3 px-4 rounded-lg font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center space-x-2 ${
            isLoading || (!text && selectedFiles.length === 0)
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {isLoading ? (
            <>
              <i className="fas fa-circle-notch fa-spin"></i>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <i className="fas fa-paint-brush"></i>
              <span>Generate Images</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
};

export default InputSection;