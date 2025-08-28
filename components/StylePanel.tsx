/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect } from 'react';
import { UploadIcon } from './icons';

interface StylePanelProps {
  onApplyStyle: () => void;
  onSetStyleImage: (file: File | null) => void;
  isLoading: boolean;
  isStyleImageSet: boolean;
  t: (key: string) => string;
}

const StylePanel: React.FC<StylePanelProps> = ({ onApplyStyle, onSetStyleImage, isLoading, isStyleImageSet, t }) => {
  const [stylePreview, setStylePreview] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      onSetStyleImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setStylePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onSetStyleImage]);

  useEffect(() => {
    // Clean up object URL when component unmounts or preview changes
    return () => {
      if (stylePreview) {
        URL.revokeObjectURL(stylePreview);
      }
    };
  }, [stylePreview]);

  const dropZoneContent = stylePreview ? (
    <img src={stylePreview} alt={t('stylePreviewAlt')} className="w-full h-full object-cover rounded-lg" />
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
      <UploadIcon className="w-8 h-8" />
      <span className="font-semibold text-center">{t('styleUploadInstruction')}</span>
      <span className="text-sm">{t('dragAndDrop')}</span>
    </div>
  );

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-300">{t('styleTitle')}</h3>
      <p className="text-sm text-center text-gray-400 -mt-2">{t('styleSubtitle')}</p>
      
      <div className="w-full flex flex-col md:flex-row items-center gap-4">
        {/* Drop Zone */}
        <div className="flex-1 w-full md:w-auto">
            <label
                htmlFor="style-upload"
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(false);
                    handleFileSelect(e.dataTransfer.files);
                }}
                className={`relative flex items-center justify-center w-full h-48 bg-gray-900/50 rounded-lg cursor-pointer transition-all duration-200 border-2 ${isDraggingOver ? 'border-dashed border-blue-400' : 'border-dashed border-gray-600 hover:border-gray-500'}`}
                title={t('styleUploadTooltip')}
            >
                {dropZoneContent}
            </label>
            <input id="style-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e.target.files)} />
        </div>
        
        {/* Action Button */}
        <div className="flex-1 w-full md:w-auto">
            <button
                onClick={onApplyStyle}
                disabled={isLoading || !isStyleImageSet}
                title={t('applyStyleTooltip')}
                className="w-full h-48 bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-2xl disabled:from-indigo-800 disabled:to-indigo-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            >
                {t('applyStyleButton')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default StylePanel;
