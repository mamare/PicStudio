/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

type GenerationMode = 'text' | 'image';

interface GeneratePanelProps {
  onGenerate: (prompt: string, mode: GenerationMode) => void;
  isLoading: boolean;
  isImageLoaded: boolean;
  t: (key: string) => string;
}

const GeneratePanel: React.FC<GeneratePanelProps> = ({ onGenerate, isLoading, isImageLoaded, t }) => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<GenerationMode>('text');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, mode);
    }
  };
  
  const placeholder = mode === 'text'
    ? t('generatePlaceholderText')
    : (isImageLoaded ? t('generatePlaceholderImage') : t('generatePlaceholderImageDisabled'));

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-300">{t('generateTitle')}</h3>
      
      {/* Mode Switcher */}
      <div className="p-1 bg-gray-900/50 rounded-lg grid grid-cols-2 gap-1 max-w-sm mx-auto">
        <button
          onClick={() => setMode('text')}
          title={t('generateModeTextTooltip')}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${mode === 'text' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:bg-white/10'}`}
        >
          {t('generateModeText')}
        </button>
        <button
          onClick={() => setMode('image')}
          disabled={!isImageLoaded}
          title={t(isImageLoaded ? 'generateModeImageTooltip' : 'generateModeImageDisabledTooltip')}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${mode === 'image' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:bg-white/10'}`}
        >
          {t('generateModeImage')}
        </button>
      </div>

      <form onSubmit={handleGenerate} className="flex flex-col gap-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          title={placeholder}
          rows={3}
          className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
          disabled={isLoading || (mode === 'image' && !isImageLoaded)}
        />

        <button
          type="submit"
          title={t('generateButtonTooltip')}
          className="w-full bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-indigo-800 disabled:to-indigo-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
          disabled={isLoading || !prompt.trim() || (mode === 'image' && !isImageLoaded)}
        >
          {t('generateButton')}
        </button>
      </form>
    </div>
  );
};

export default GeneratePanel;
