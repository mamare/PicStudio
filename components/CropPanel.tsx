/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { RotateCcwIcon, RotateCwIcon } from './icons';

interface TransformPanelProps {
  onApplyCrop: () => void;
  onSetAspect: (aspect: number | undefined) => void;
  onRotate: (degrees: number) => void;
  isLoading: boolean;
  isCropping: boolean;
  t: (key: string) => string;
}

type AspectRatio = 'free' | '1:1' | '16:9';

const TransformPanel: React.FC<TransformPanelProps> = ({ onApplyCrop, onSetAspect, onRotate, isLoading, isCropping, t }) => {
  const [activeAspect, setActiveAspect] = useState<AspectRatio>('free');
  
  const handleAspectChange = (aspect: AspectRatio, value: number | undefined) => {
    setActiveAspect(aspect);
    onSetAspect(value);
  }

  const aspects: { name: AspectRatio, value: number | undefined, title: string }[] = [
    { name: 'free', value: undefined, title: t('aspectFreeTooltip') },
    { name: '1:1', value: 1 / 1, title: t('aspect1to1Tooltip') },
    { name: '16:9', value: 16 / 9, title: t('aspect16to9Tooltip') },
  ];

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-gray-300">{t('transformTitle')}</h3>
      
      <div className="w-full space-y-4">
        {/* Cropping Section */}
        <div>
          <p className="text-sm font-medium text-center text-gray-400 mb-2">{t('cropTitle')}</p>
          <p className="text-sm text-gray-400 text-center -mt-2 mb-2">{t('cropInstruction')}</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-medium text-gray-400">{t('aspectRatioLabel')}</span>
            {aspects.map(({ name, value, title }) => (
              <button
                key={name}
                onClick={() => handleAspectChange(name, value)}
                disabled={isLoading}
                title={title}
                className={`px-4 py-2 rounded-md text-base font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                  activeAspect === name 
                  ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' 
                  : 'bg-white/10 hover:bg-white/20 text-gray-200'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          <button
            onClick={onApplyCrop}
            disabled={isLoading || !isCropping}
            title={t('applyCropTooltip')}
            className="w-full max-w-xs mx-auto mt-3 bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-green-800 disabled:to-green-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
          >
            {t('applyCropButton')}
          </button>
        </div>

        <div className="w-full h-px bg-gray-600/50"></div>

        {/* Rotation Section */}
        <div>
          <p className="text-sm font-medium text-center text-gray-400 mb-2">{t('rotateTitle')}</p>
          <div className="flex justify-center gap-2">
            <button 
              onClick={() => onRotate(-90)} 
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-3 rounded-md text-base font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 bg-white/10 hover:bg-white/20 text-gray-200"
              aria-label={t('rotateCCWTooltip')}
              title={t('rotateCCWTooltip')}
            >
              <RotateCcwIcon className="w-5 h-5" />
              -90°
            </button>
            <button 
              onClick={() => onRotate(90)} 
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-3 rounded-md text-base font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 bg-white/10 hover:bg-white/20 text-gray-200"
              aria-label={t('rotateCWTooltip')}
              title={t('rotateCWTooltip')}
            >
              <RotateCwIcon className="w-5 h-5" />
              +90°
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransformPanel;
