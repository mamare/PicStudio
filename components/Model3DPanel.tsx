/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { CubeIcon } from './icons';

interface Model3DPanelProps {
  onGenerate: () => void;
  onReset: () => void;
  isLoading: boolean;
  modelContent: string | null;
  t: (key: string) => string;
}

const Model3DPanel: React.FC<Model3DPanelProps> = ({ onGenerate, onReset, isLoading, modelContent, t }) => {
    
    const handleDownload = () => {
        if (!modelContent) return;
        const blob = new Blob([modelContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'model.obj';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (modelContent) {
        return (
             <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
                <CubeIcon className="w-12 h-12 text-green-400" />
                <h3 className="text-xl font-semibold text-center text-gray-200">{t('model3dSuccessTitle')}</h3>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                        onClick={handleDownload}
                        title={t('model3dDownloadTooltip')}
                        className="w-full sm:w-auto bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base"
                    >
                        {t('model3dDownloadButton')}
                    </button>
                    <button
                        onClick={onReset}
                        className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                         {t('model3dStartOver')}
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-center text-gray-300">{t('model3dTitle')}</h3>
            <p className="text-sm text-center text-gray-400 -mt-2">{t('model3dSubtitle')}</p>
            <button
                onClick={onGenerate}
                disabled={isLoading}
                title={t('model3dButtonTooltip')}
                className="w-full max-w-xs mx-auto bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-indigo-800 disabled:to-indigo-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            >
                {t('model3dButton')}
            </button>
        </div>
    );
};

export default Model3DPanel;
