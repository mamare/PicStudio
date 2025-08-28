/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

import { generateEditedImage, generateFilteredImage, generateAdjustedImage, generateRemovedBackground, generateUpscaledImage, generateImageFromText, generateImageFromImage, generateStyleTransfer, generate3DModelFromImage } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import TransformPanel from './components/CropPanel';
import GeneratePanel from './components/GeneratePanel';
import StylePanel from './components/StylePanel';
import Model3DPanel from './components/Model3DPanel';
import { UndoIcon, RedoIcon, EyeIcon } from './components/icons';
import StartScreen from './components/StartScreen';

// --- INTERNATIONALIZATION (i18n) ---
const translations = {
    'en': {
        appName: "Pixshop",
        toggleLanguageTooltip: "Mudar para Português",
        // Start Screen
        startScreenTitle: "AI-Powered Photo Editing,",
        startScreenTitleHighlight: "Simplified",
        startScreenSubtitle: "Retouch photos, apply creative filters, or make professional adjustments using simple text prompts. No complex tools needed.",
        uploadButton: "Upload an Image",
        uploadTooltip: "Select an image from your device",
        dragAndDrop: "or drag and drop a file",
        featureRetouchingTitle: "Precise Retouching",
        featureRetouchingDescription: "Click any point on your image to remove blemishes, change colors, or add elements with pinpoint accuracy.",
        featureFiltersTitle: "Creative Filters",
        featureFiltersDescription: "Transform photos with artistic styles. From vintage looks to futuristic glows, find or create the perfect filter.",
        featureAdjustmentsTitle: "Pro Adjustments",
        featureAdjustmentsDescription: "Enhance lighting, blur backgrounds, or change the mood. Get studio-quality results without complex tools.",
        // Main App
        errorTitle: "An Error Occurred",
        tryAgainButton: "Try Again",
        loadingMessage: "AI is working its magic...",
        // Tabs
        tabRetouch: "Retouch",
        tabTransform: "Transform",
        tabAdjust: "Adjust",
        tabFilters: "Filters",
        tabUpscale: "Upscale",
        tabBackground: "Background",
        tabGenerate: "Generate",
        tabStyle: "Style",
        tabModel3D: "3D Model",
        // Retouch Panel
        retouchInstructionFaces: "Click a face or any area on the image for a precise edit.",
        retouchInstructionClick: "Click an area on the image to make a precise edit.",
        retouchInstructionDescribe: "Great! Now describe your localized edit below.",
        retouchPlaceholder: "e.g., 'change my shirt color to blue'",
        retouchPlaceholderNoHotspot: "First click a point on the image",
        generateButton: "Generate",
        // Transform Panel
        transformTitle: "Transform Image",
        cropTitle: "Crop",
        cropInstruction: "Click and drag on the image to select a crop area.",
        aspectRatioLabel: "Aspect Ratio:",
        aspectFreeTooltip: "Set freeform aspect ratio",
        aspect1to1Tooltip: "Set 1:1 aspect ratio",
        aspect16to9Tooltip: "Set 16:9 aspect ratio",
        applyCropButton: "Apply Crop",
        applyCropTooltip: "Apply the selected crop to the image",
        rotateTitle: "Rotate",
        rotateCCWTooltip: "Rotate 90 degrees counter-clockwise",
        rotateCWTooltip: "Rotate 90 degrees clockwise",
        // Adjustment Panel
        adjTitle: "Apply a Professional Adjustment",
        adjBlurBackground: "Blur Background",
        adjBlurBackgroundPrompt: "Apply a realistic depth-of-field effect, making the background blurry while keeping the main subject in sharp focus.",
        adjEnhanceDetails: "Enhance Details",
        adjEnhanceDetailsPrompt: "Slightly enhance the sharpness and details of the image without making it look unnatural.",
        adjWarmerLighting: "Warmer Lighting",
        adjWarmerLightingPrompt: "Adjust the color temperature to give the image warmer, golden-hour style lighting.",
        adjStudioLight: "Studio Light",
        adjStudioLightPrompt: "Add dramatic, professional studio lighting to the main subject.",
        adjCustomPlaceholder: "Or describe an adjustment (e.g., 'change background to a forest')",
        applyAdjustmentButton: "Apply Adjustment",
        applyAdjustmentTooltip: "Apply the selected or custom adjustment",
        // Filter Panel
        filterTitle: "Apply a Filter",
        filterSynthwave: "Synthwave",
        filterSynthwavePrompt: "Apply a vibrant 80s synthwave aesthetic with neon magenta and cyan glows, and subtle scan lines.",
        filterAnime: "Anime",
        filterAnimePrompt: "Give the image a vibrant Japanese anime style, with bold outlines, cel-shading, and saturated colors.",
        filterLomo: "Lomo",
        filterLomoPrompt: "Apply a Lomography-style cross-processing film effect with high-contrast, oversaturated colors, and dark vignetting.",
        filterGlitch: "Glitch",
        filterGlitchPrompt: "Transform the image into a futuristic holographic projection with digital glitch effects and chromatic aberration.",
        filterCustomPlaceholder: "Or describe a custom filter (e.g., '80s synthwave glow')",
        applyFilterButton: "Apply Filter",
        applyFilterTooltip: "Apply the selected or custom filter",
        // Upscale Panel
        upscaleTitle: "Upscale Image",
        upscaleButton: "Increase Resolution",
        upscaleTooltip: "Use AI to increase image resolution and enhance details",
        // Background Panel
        backgroundTitle: "Background Remover",
        backgroundButton: "Remove Background",
        backgroundTooltip: "Use AI to remove the background and make it transparent",
        // Generate Panel
        generateTitle: "Generate Image with AI",
        generateModeText: "From Text",
        generateModeImage: "From Image",
        generateModeTextTooltip: "Generate a new image from a text prompt",
        generateModeImageTooltip: "Generate a new image based on the current one",
        generateModeImageDisabledTooltip: "Upload an image first to use this mode",
        generatePlaceholderText: "e.g., 'A cinematic photo of a raccoon in a library'",
        generatePlaceholderImage: "e.g., '...in the style of a watercolor painting'",
        generatePlaceholderImageDisabled: "Upload an image to enable Image-to-Image",
        generateButtonTooltip: "Generate a new image",
        // Style Panel
        styleTitle: "AI Style Transfer",
        styleSubtitle: "Apply the artistic style from a reference image to your photo.",
        styleUploadInstruction: "Upload Style Image",
        stylePreviewAlt: "Style reference preview",
        styleUploadTooltip: "Click or drag to upload the style reference image",
        applyStyleButton: "Apply Style",
        applyStyleTooltip: "Transfer the style to your image",
        // 3D Model Panel
        model3dTitle: "Generate 3D Model from Image",
        model3dSubtitle: "Use AI to create a 3D model (.obj) from your photo, ready for 3D printing.",
        model3dButton: "Generate 3D Model",
        model3dButtonTooltip: "Start the AI generation process",
        model3dSuccessTitle: "Model Generated Successfully!",
        model3dDownloadButton: "Download .obj File",
        model3dDownloadTooltip: "Save the 3D model to your device",
        model3dStartOver: "Start Over",
        // Controls
        undoButton: "Undo",
        undoTooltip: "Undo last action",
        redoButton: "Redo",
        redoTooltip: "Redo last action",
        compareButton: "Compare",
        compareTooltip: "Toggle side-by-side comparison with the original image",
        resetButton: "Reset",
        resetTooltip: "Revert all changes and go back to the original image",
        uploadNewButton: "Upload New",
        uploadNewTooltip: "Start over with a new image",
        downloadButton: "Download Image",
        downloadTooltip: "Save the final image to your device",
        // Modals
        confirmTitle: "Confirm Action",
        confirmUndoMessage: "Are you sure you want to undo the last action?",
        confirmRedoMessage: "Are you sure you want to redo the last action?",
        cancelButton: "Cancel",
        confirmButton: "Confirm",
    },
    'pt-br': {
        appName: "Pixshop",
        toggleLanguageTooltip: "Switch to English",
        startScreenTitle: "Edição de Fotos com IA,",
        startScreenTitleHighlight: "Simplificada",
        startScreenSubtitle: "Retoque fotos, aplique filtros criativos ou faça ajustes profissionais usando simples comandos de texto. Sem ferramentas complexas.",
        uploadButton: "Carregar Imagem",
        uploadTooltip: "Selecione uma imagem do seu dispositivo",
        dragAndDrop: "ou arraste e solte um arquivo",
        featureRetouchingTitle: "Retoque Preciso",
        featureRetouchingDescription: "Clique em qualquer ponto da sua imagem para remover manchas, mudar cores ou adicionar elementos com precisão.",
        featureFiltersTitle: "Filtros Criativos",
        featureFiltersDescription: "Transforme fotos com estilos artísticos. De visuais vintage a brilhos futuristas, encontre ou crie o filtro perfeito.",
        featureAdjustmentsTitle: "Ajustes Profissionais",
        featureAdjustmentsDescription: "Melhore a iluminação, desfoque fundos ou mude a atmosfera. Obtenha resultados de estúdio sem ferramentas complexas.",
        errorTitle: "Ocorreu um Erro",
        tryAgainButton: "Tentar Novamente",
        loadingMessage: "A IA está fazendo sua mágica...",
        tabRetouch: "Retocar",
        tabTransform: "Transformar",
        tabAdjust: "Ajustar",
        tabFilters: "Filtros",
        tabUpscale: "Melhorar",
        tabBackground: "Fundo",
        tabGenerate: "Gerar",
        tabStyle: "Estilo",
        tabModel3D: "Modelo 3D",
        retouchInstructionFaces: "Clique em um rosto ou em qualquer área da imagem para uma edição precisa.",
        retouchInstructionClick: "Clique em uma área da imagem para fazer uma edição precisa.",
        retouchInstructionDescribe: "Ótimo! Agora descreva sua edição localizada abaixo.",
        retouchPlaceholder: "ex: 'mude a cor da minha camisa para azul'",
        retouchPlaceholderNoHotspot: "Primeiro clique em um ponto na imagem",
        generateButton: "Gerar",
        transformTitle: "Transformar Imagem",
        cropTitle: "Cortar",
        cropInstruction: "Clique e arraste na imagem para selecionar uma área de corte.",
        aspectRatioLabel: "Proporção:",
        aspectFreeTooltip: "Definir proporção livre",
        aspect1to1Tooltip: "Definir proporção 1:1",
        aspect16to9Tooltip: "Definir proporção 16:9",
        applyCropButton: "Aplicar Corte",
        applyCropTooltip: "Aplica o corte selecionado na imagem",
        rotateTitle: "Girar",
        rotateCCWTooltip: "Girar 90 graus no sentido anti-horário",
        rotateCWTooltip: "Girar 90 graus no sentido horário",
        adjTitle: "Aplicar um Ajuste Profissional",
        adjBlurBackground: "Desfocar Fundo",
        adjBlurBackgroundPrompt: "Aplica um efeito de profundidade de campo realista, desfocando o fundo enquanto mantém o objeto principal em foco nítido.",
        adjEnhanceDetails: "Melhorar Detalhes",
        adjEnhanceDetailsPrompt: "Aumenta levemente a nitidez e os detalhes da imagem sem parecer artificial.",
        adjWarmerLighting: "Luz Quente",
        adjWarmerLightingPrompt: "Ajusta a temperatura da cor para dar à imagem uma iluminação mais quente, estilo 'golden hour'.",
        adjStudioLight: "Luz de Estúdio",
        adjStudioLightPrompt: "Adiciona uma iluminação de estúdio dramática e profissional ao objeto principal.",
        adjCustomPlaceholder: "Ou descreva um ajuste (ex: 'mudar fundo para uma floresta')",
        applyAdjustmentButton: "Aplicar Ajuste",
        applyAdjustmentTooltip: "Aplica o ajuste selecionado ou personalizado",
        filterTitle: "Aplicar um Filtro",
        filterSynthwave: "Synthwave",
        filterSynthwavePrompt: "Aplica uma estética vibrante synthwave dos anos 80 com brilhos neon magenta e ciano, e linhas de varredura sutis.",
        filterAnime: "Anime",
        filterAnimePrompt: "Dá à imagem um estilo vibrante de anime japonês, com contornos ousados, cel-shading e cores saturadas.",
        filterLomo: "Lomo",
        filterLomoPrompt: "Aplica um efeito de filme de processamento cruzado estilo Lomography com alto contraste, cores supersaturadas e vinheta escura.",
        filterGlitch: "Glitch",
        filterGlitchPrompt: "Transforma a imagem em uma projeção holográfrica futurista com efeitos de glitch digital e aberração cromática.",
        filterCustomPlaceholder: "Ou descreva um filtro personalizado (ex: 'brilho synthwave anos 80')",
        applyFilterButton: "Aplicar Filtro",
        applyFilterTooltip: "Aplica o filtro selecionado ou personalizado",
        upscaleTitle: "Melhorar Imagem",
        upscaleButton: "Aumentar Resolução",
        upscaleTooltip: "Usa IA para aumentar a resolução da imagem e melhorar detalhes",
        backgroundTitle: "Removedor de Fundo",
        backgroundButton: "Remover Fundo",
        backgroundTooltip: "Usa IA para remover o fundo e torná-lo transparente",
        generateTitle: "Gerar Imagem com IA",
        generateModeText: "A partir de Texto",
        generateModeImage: "A partir de Imagem",
        generateModeTextTooltip: "Gera uma nova imagem a partir de um comando de texto",
        generateModeImageTooltip: "Gera uma nova imagem baseada na imagem atual",
        generateModeImageDisabledTooltip: "Carregue uma imagem para usar este modo",
        generatePlaceholderText: "ex: 'Uma foto cinemática de um guaxinim em uma biblioteca'",
        generatePlaceholderImage: "ex: '...no estilo de uma pintura em aquarela'",
        generatePlaceholderImageDisabled: "Carregue uma imagem para habilitar Imagem-para-Imagem",
        generateButtonTooltip: "Gerar uma nova imagem",
        styleTitle: "Transferência de Estilo com IA",
        styleSubtitle: "Aplique o estilo artístico de uma imagem de referência à sua foto.",
        styleUploadInstruction: "Carregar Imagem de Estilo",
        stylePreviewAlt: "Pré-visualização da referência de estilo",
        styleUploadTooltip: "Clique ou arraste para carregar a imagem de referência de estilo",
        applyStyleButton: "Aplicar Estilo",
        applyStyleTooltip: "Transfere o estilo para a sua imagem",
        model3dTitle: "Gerar Modelo 3D a partir de Imagem",
        model3dSubtitle: "Use IA para criar um modelo 3D (.obj) da sua foto, pronto para impressão 3D.",
        model3dButton: "Gerar Modelo 3D",
        model3dButtonTooltip: "Inicia o processo de geração por IA",
        model3dSuccessTitle: "Modelo Gerado com Sucesso!",
        model3dDownloadButton: "Baixar Arquivo .obj",
        model3dDownloadTooltip: "Salva o modelo 3D no seu dispositivo",
        model3dStartOver: "Começar de Novo",
        undoButton: "Desfazer",
        undoTooltip: "Desfaz a última ação",
        redoButton: "Refazer",
        redoTooltip: "Refaz a última ação",
        compareButton: "Comparar",
        compareTooltip: "Alterna a comparação lado a lado com a imagem original",
        resetButton: "Resetar",
        resetTooltip: "Reverte todas as alterações e volta para a imagem original",
        uploadNewButton: "Nova Imagem",
        uploadNewTooltip: "Começa do zero com uma nova imagem",
        downloadButton: "Baixar Imagem",
        downloadTooltip: "Salva a imagem final no seu dispositivo",
        confirmTitle: "Confirmar Ação",
        confirmUndoMessage: "Tem certeza de que deseja desfazer a última ação?",
        confirmRedoMessage: "Tem certeza de que deseja refazer a última ação?",
        cancelButton: "Cancelar",
        confirmButton: "Confirmar",
    }
};

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

// Helper to convert File to a Data URL
const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};


type Tab = 'retouch' | 'adjust' | 'filters' | 'transform' | 'upscale' | 'background' | 'generate' | 'style' | 'model3d';
type ConfirmationAction = {
    message: string;
    onConfirm: () => void;
};

// Extend the Window interface to include the experimental FaceDetector
declare global {
    interface Window {
        FaceDetector?: any;
    }
}
interface DetectedFace {
    boundingBox: { x: number; y: number; width: number; height: number; };
}

// --- NEW PANELS ---
const UpscalePanel: React.FC<{ onApply: () => void; isLoading: boolean; t: (key: string) => string; }> = ({ onApply, isLoading, t }) => (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-center text-gray-300">{t('upscaleTitle')}</h3>
        <button
            onClick={onApply}
            disabled={isLoading}
            title={t('upscaleTooltip')}
            className="w-full max-w-xs mx-auto bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-indigo-800 disabled:to-indigo-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
        >
            {t('upscaleButton')}
        </button>
    </div>
);

const BackgroundPanel: React.FC<{ onApply: () => void; isLoading: boolean; t: (key: string) => string; }> = ({ onApply, isLoading, t }) => (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-center text-gray-300">{t('backgroundTitle')}</h3>
        <button
            onClick={onApply}
            disabled={isLoading}
            title={t('backgroundTooltip')}
            className="w-full max-w-xs mx-auto bg-gradient-to-br from-teal-600 to-cyan-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-cyan-800 disabled:to-cyan-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
        >
            {t('backgroundButton')}
        </button>
    </div>
);


const App: React.FC = () => {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  const [hoverHotspot, setHoverHotspot] = useState<{ x: number, y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [confirmationAction, setConfirmationAction] = useState<ConfirmationAction | null>(null);
  const [styleImage, setStyleImage] = useState<File | null>(null);
  const [model3dContent, setModel3dContent] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const zoomPanPinchRef = useRef<ReactZoomPanPinchRef>(null);

  const [language, setLanguage] = useState<'en' | 'pt-br'>('pt-br');
  const t = useCallback((key: string) => translations[language][key] || key, [language]);

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Auto-save to localStorage
  useEffect(() => {
    const saveState = async () => {
      if (history.length > 0) {
        try {
          const filesToSave = history.map(file => fileToDataURL(file).then(dataUrl => ({ name: file.name, type: file.type, dataUrl })));
          const serializableHistory = await Promise.all(filesToSave);
          const session = { history: serializableHistory, index: historyIndex };
          localStorage.setItem('pixshopSession', JSON.stringify(session));
        } catch (e) {
            console.error("Failed to save session:", e);
        }
      } else {
        localStorage.removeItem('pixshopSession');
      }
    };
    saveState();
  }, [history, historyIndex]);

  // Load from localStorage on mount
  useEffect(() => {
    const loadState = () => {
        try {
            const savedSessionJSON = localStorage.getItem('pixshopSession');
            if (savedSessionJSON) {
                const savedSession = JSON.parse(savedSessionJSON);
                if (savedSession.history && typeof savedSession.index === 'number') {
                    const loadedFiles = savedSession.history.map((item: any) => dataURLtoFile(item.dataUrl, item.name));
                    setHistory(loadedFiles);
                    setHistoryIndex(savedSession.index);
                    if (loadedFiles.length > 0) {
                        setActiveTab('retouch');
                    }
                }
            }
        } catch (e) {
            console.error("Failed to load session:", e);
            localStorage.removeItem('pixshopSession');
        }
    };
    loadState();
  }, []);

  // Effect to create and revoke object URLs safely for the current image
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);
  
  // Effect to create and revoke object URLs safely for the original image
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);

  // Effect for Face Detection
  useEffect(() => {
    if (!currentImageUrl || !imgRef.current) {
        setFaces([]);
        return;
    }
    if ('FaceDetector' in window) {
        const faceDetector = new window.FaceDetector();
        faceDetector.detect(imgRef.current)
            .then((detectedFaces: DetectedFace[]) => {
                setFaces(detectedFaces);
            })
            .catch((err: Error) => {
                console.error("Face detection failed:", err);
            });
    } else {
        console.log("FaceDetector API not supported in this browser.");
    }
  }, [currentImageUrl]);


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Reset transient states after an action
    setCrop(undefined);
    setCompletedCrop(undefined);
    zoomPanPinchRef.current?.resetTransform();
  }, [history, historyIndex]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
    setEditHotspot(null);
    setDisplayHotspot(null);
    setActiveTab('retouch');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setIsCompareMode(false);
    setStyleImage(null);
    setModel3dContent(null);
  }, []);

  const handleGenericAIAction = useCallback(async (action: (image: File, prompt?: string) => Promise<string>, actionName: string, prompt?: string) => {
    if (!currentImage) {
        setError('No image loaded.');
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const resultImageUrl = await action(currentImage, prompt);
        const newImageFile = dataURLtoFile(resultImageUrl, `${actionName}-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to perform ${actionName}. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleGenerate = useCallback(async () => {
    if (!currentImage) {
      setError('No image loaded to edit.');
      return;
    }
    if (!prompt.trim()) {
        setError('Please enter a description for your edit.');
        return;
    }
    if (!editHotspot) {
        setError('Please click on the image to select an area to edit.');
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const editedImageUrl = await generateEditedImage(currentImage, prompt, editHotspot);
        const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        setEditHotspot(null);
        setDisplayHotspot(null);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate the image. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, prompt, editHotspot, addImageToHistory]);
  
  const handleApplyFilter = (filterPrompt: string) => handleGenericAIAction(
      (image, p) => generateFilteredImage(image, p!), 'filter', filterPrompt
  );
  
  const handleApplyAdjustment = (adjustmentPrompt: string) => handleGenericAIAction(
      (image, p) => generateAdjustedImage(image, p!), 'adjustment', adjustmentPrompt
  );

  const handleRemoveBackground = () => handleGenericAIAction(generateRemovedBackground, 'background-removal');
  const handleUpscale = () => handleGenericAIAction(generateUpscaledImage, 'upscale');
  
  const handleGenerateImage = useCallback(async (prompt: string, mode: 'text' | 'image') => {
    setIsLoading(true);
    setError(null);
    try {
        if (mode === 'text') {
            const resultImageUrl = await generateImageFromText(prompt);
            const newImageFile = dataURLtoFile(resultImageUrl, `generated-${Date.now()}.png`);
            handleImageUpload(newImageFile);
        } else {
            // This is 'image' mode, which falls under generic actions that add to history
            await handleGenericAIAction(generateImageFromImage, 'image-generation', prompt);
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate image. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [handleImageUpload, handleGenericAIAction]);

  const handleApplyStyle = useCallback(async () => {
    if (!currentImage) {
        setError('No content image loaded.');
        return;
    }
    if (!styleImage) {
        setError('Please upload a style image.');
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const resultImageUrl = await generateStyleTransfer(currentImage, styleImage);
        const newImageFile = dataURLtoFile(resultImageUrl, `styled-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply style. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, styleImage, addImageToHistory]);

  const handleGenerate3DModel = useCallback(async () => {
    if (!currentImage) {
        setError('No image loaded to generate a model from.');
        return;
    }
    setIsLoading(true);
    setError(null);
    setModel3dContent(null);
    try {
        const objContent = await generate3DModelFromImage(currentImage);
        setModel3dContent(objContent);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate 3D model. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage]);

  const handleApplyCrop = useCallback(() => {
    if (!completedCrop || !imgRef.current) {
        setError('Please select an area to crop.');
        return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        setError('Could not process the crop.');
        return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );
    
    const croppedImageUrl = canvas.toDataURL('image/png');
    const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
    addImageToHistory(newImageFile);

  }, [completedCrop, addImageToHistory]);
  
  const handleRotate = useCallback(async (degrees: number) => {
    if (!currentImage) return;

    setIsLoading(true);
    const image = new Image();
    image.src = URL.createObjectURL(currentImage);
    await new Promise(resolve => image.onload = resolve);
    URL.revokeObjectURL(image.src);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if(!ctx) {
      setError('Could not process rotation.');
      setIsLoading(false);
      return;
    }
    
    const radians = degrees * Math.PI / 180;
    const sin = Math.sin(radians);
    const cos = Math.cos(radians);
    const newWidth = Math.abs(image.width * cos) + Math.abs(image.height * sin);
    const newHeight = Math.abs(image.height * cos) + Math.abs(image.width * sin);

    canvas.width = newWidth;
    canvas.height = newHeight;
    
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(radians);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    
    const rotatedImageUrl = canvas.toDataURL('image/png');
    const newImageFile = dataURLtoFile(rotatedImageUrl, `rotated-${Date.now()}.png`);
    addImageToHistory(newImageFile);
    setIsLoading(false);
  }, [currentImage, addImageToHistory]);


  const handleUndo = useCallback(() => {
    if (canUndo) {
        setConfirmationAction({
            message: t('confirmUndoMessage'),
            onConfirm: () => {
                setHistoryIndex(historyIndex - 1);
                setEditHotspot(null);
                setDisplayHotspot(null);
                setConfirmationAction(null);
            },
        });
    }
  }, [canUndo, historyIndex, t]);
  
  const handleRedo = useCallback(() => {
    if (canRedo) {
        setConfirmationAction({
            message: t('confirmRedoMessage'),
            onConfirm: () => {
                setHistoryIndex(historyIndex + 1);
                setEditHotspot(null);
                setDisplayHotspot(null);
                setConfirmationAction(null);
            },
        });
    }
  }, [canRedo, historyIndex, t]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [history]);

  const handleUploadNew = useCallback(() => {
      setHistory([]);
      setHistoryIndex(-1);
      setError(null);
      setPrompt('');
      setEditHotspot(null);
      setDisplayHotspot(null);
      setActiveTab('generate');
      setStyleImage(null);
      setModel3dContent(null);
      localStorage.removeItem('pixshopSession');
  }, []);

  const handleDownload = useCallback(() => {
      if (currentImage) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(currentImage);
          link.download = `edited-${currentImage.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
      }
  }, [currentImage]);
  
  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const setHotspot = (img: HTMLImageElement, offsetX: number, offsetY: number) => {
    setDisplayHotspot({ x: offsetX, y: offsetY });

    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    const scaleX = naturalWidth / clientWidth;
    const scaleY = naturalHeight / clientHeight;

    const originalX = Math.round(offsetX * scaleX);
    const originalY = Math.round(offsetY * scaleY);

    setEditHotspot({ x: originalX, y: originalY });
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTab !== 'retouch') return;
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setHotspot(img, offsetX, offsetY);
  };
  
  const handleFaceClick = (face: DetectedFace, e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activeTab !== 'retouch' || !imgRef.current) return;
    
    const img = imgRef.current;
    const scaleX = img.clientWidth / img.naturalWidth;
    const scaleY = img.clientHeight / img.naturalHeight;
    
    const centerX = face.boundingBox.x + face.boundingBox.width / 2;
    const centerY = face.boundingBox.y + face.boundingBox.height / 2;
    
    setHotspot(img, centerX * scaleX, centerY * scaleY);
  };
  
  const handleMouseMoveOnImage = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTab !== 'retouch') {
        if(hoverHotspot) setHoverHotspot(null);
        return;
    }
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    setHoverHotspot({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };


  const renderContent = () => {
    if (error) {
       return (
           <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-red-300">{t('errorTitle')}</h2>
            <p className="text-md text-red-400">{error}</p>
            <button
                onClick={() => setError(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
              >
                {t('tryAgainButton')}
            </button>
          </div>
        );
    }
    
    if (!currentImageUrl) {
      return (
        <div className="w-full flex flex-col items-center gap-8">
            <StartScreen onFileSelect={handleFileSelect} t={t}/>
            <div className="w-full max-w-5xl"><div className="w-full h-px bg-gray-600/50 my-4"></div></div>
            <div className="w-full max-w-5xl">
                <GeneratePanel onGenerate={handleGenerateImage} isLoading={isLoading} isImageLoaded={!!currentImage} t={t} />
            </div>
        </div>
      );
    }

    const imageDisplay = (
        <div 
          className="relative w-full h-full flex items-center justify-center cursor-pointer"
          onMouseMove={handleMouseMoveOnImage}
          onMouseLeave={() => setHoverHotspot(null)}
        >
            <TransformWrapper
                ref={zoomPanPinchRef}
                disabled={activeTab === 'transform' || isCompareMode}
                minScale={0.5}
                maxScale={8}
            >
                <TransformComponent contentClass="w-full h-full flex items-center justify-center" contentStyle={{ cursor: activeTab === 'retouch' ? 'none' : 'grab' }}>
                    <img
                        ref={imgRef}
                        src={currentImageUrl}
                        alt="Current"
                        onClick={handleImageClick}
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                        style={{ maxHeight: '60vh' }}
                    />
                    {imgRef.current && faces.map((face, index) => {
                        const { naturalWidth, naturalHeight, clientWidth, clientHeight } = imgRef.current;
                        const scaleX = clientWidth / naturalWidth;
                        const scaleY = clientHeight / naturalHeight;
                        const box = face.boundingBox;
                        return (
                            <div
                                key={index}
                                className="absolute border-2 border-blue-400 rounded-md hover:bg-blue-400/30 transition-colors"
                                style={{
                                    left: `${box.x * scaleX}px`,
                                    top: `${box.y * scaleY}px`,
                                    width: `${box.width * scaleX}px`,
                                    height: `${box.height * scaleY}px`,
                                }}
                                onClick={(e) => handleFaceClick(face, e)}
                                title={t('retouchInstructionFaces')}
                            />
                        );
                    })}
                </TransformComponent>
            </TransformWrapper>
             {displayHotspot && !isLoading && activeTab === 'retouch' && (
                <div 
                    className="absolute rounded-full w-6 h-6 bg-blue-500/50 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}
                >
                    <div className="absolute inset-0 rounded-full w-6 h-6 animate-ping bg-blue-400"></div>
                </div>
            )}
            {hoverHotspot && activeTab === 'retouch' && (
              <div 
                className="absolute w-8 h-8 pointer-events-none -translate-x-1/2 -translate-y-1/2 z-20"
                style={{ left: `${hoverHotspot.x}px`, top: `${hoverHotspot.y}px` }}
              >
                  <div className="absolute top-1/2 left-0 w-full h-px bg-white/70"></div>
                  <div className="absolute left-1/2 top-0 w-px h-full bg-white/70"></div>
              </div>
            )}
        </div>
    );
    
    const comparisonSlider = originalImageUrl && currentImageUrl && (
        <ReactCompareSlider
            itemOne={<ReactCompareSliderImage src={originalImageUrl} alt="Original" />}
            itemTwo={<ReactCompareSliderImage src={currentImageUrl} alt="Edited" />}
            className="w-full max-h-[60vh] rounded-xl overflow-hidden shadow-2xl"
        />
    );

    const cropView = currentImageUrl && (
         <ReactCrop 
            crop={crop} 
            onChange={c => setCrop(c)} 
            onComplete={c => setCompletedCrop(c)}
            aspect={aspect}
            className="max-h-[60vh]"
          >
            <img 
                ref={imgRef}
                src={currentImageUrl} 
                alt="Crop this image"
                className="w-full h-auto object-contain max-h-[60vh] rounded-xl"
            />
          </ReactCrop>
    );

    const TABS: { id: Tab; label: string }[] = [
      { id: 'generate', label: t('tabGenerate') },
      { id: 'style', label: t('tabStyle') },
      { id: 'retouch', label: t('tabRetouch') },
      { id: 'transform', label: t('tabTransform') },
      { id: 'adjust', label: t('tabAdjust') },
      { id: 'filters', label: t('tabFilters') },
      { id: 'upscale', label: t('tabUpscale') },
      { id: 'background', label: t('tabBackground') },
      { id: 'model3d', label: t('tabModel3D') },
    ];


    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative w-full min-h-[300px] flex items-center justify-center bg-black/20 rounded-xl">
            {isLoading && (
                <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                    <Spinner />
                    <p className="text-gray-300">{t('loadingMessage')}</p>
                </div>
            )}
            
            {activeTab === 'transform' ? cropView : (isCompareMode ? comparisonSlider : imageDisplay)}
        </div>
        
        <div className="w-full bg-gray-800/80 border border-gray-700/80 rounded-lg p-2 grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 items-center justify-center gap-2 backdrop-blur-sm">
            {TABS.map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full capitalize font-semibold py-3 px-2 rounded-md transition-all duration-200 text-sm md:text-base ${
                        activeTab === tab.id
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/40' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
        
        <div className="w-full">
            {activeTab === 'retouch' && (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-md text-gray-400">
                        {faces.length > 0 && t('retouchInstructionFaces')}
                        {faces.length === 0 && (editHotspot ? t('retouchInstructionDescribe') : t('retouchInstructionClick'))}
                    </p>
                    <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="w-full flex items-center gap-2">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={editHotspot ? t('retouchPlaceholder') : t('retouchPlaceholderNoHotspot')}
                            className="flex-grow bg-gray-800 border border-gray-700 text-gray-200 rounded-lg p-5 text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isLoading || !editHotspot}
                        />
                        <button 
                            type="submit"
                            title={t('generateButton')}
                            className="bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-5 px-8 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                            disabled={isLoading || !prompt.trim() || !editHotspot}
                        >
                            {t('generateButton')}
                        </button>
                    </form>
                </div>
            )}
            {activeTab === 'transform' && <TransformPanel onApplyCrop={handleApplyCrop} onSetAspect={setAspect} onRotate={handleRotate} isLoading={isLoading} isCropping={!!completedCrop?.width && completedCrop.width > 0} t={t} />}
            {activeTab === 'adjust' && <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} isLoading={isLoading} t={t} />}
            {activeTab === 'filters' && <FilterPanel onApplyFilter={handleApplyFilter} isLoading={isLoading} t={t} />}
            {activeTab === 'upscale' && <UpscalePanel onApply={handleUpscale} isLoading={isLoading} t={t} />}
            {activeTab === 'background' && <BackgroundPanel onApply={handleRemoveBackground} isLoading={isLoading} t={t} />}
            {activeTab === 'generate' && <GeneratePanel onGenerate={handleGenerateImage} isLoading={isLoading} isImageLoaded={!!currentImage} t={t} />}
            {activeTab === 'style' && <StylePanel onApplyStyle={handleApplyStyle} onSetStyleImage={setStyleImage} isLoading={isLoading} isStyleImageSet={!!styleImage} t={t} />}
            {activeTab === 'model3d' && <Model3DPanel onGenerate={handleGenerate3DModel} modelContent={model3dContent} isLoading={isLoading} t={t} onReset={() => setModel3dContent(null)} />}
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button 
                onClick={handleUndo}
                disabled={!canUndo}
                className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5"
                aria-label={t('undoTooltip')}
                title={t('undoTooltip')}
            >
                <UndoIcon className="w-5 h-5 mr-2" />
                {t('undoButton')}
            </button>
            <button 
                onClick={handleRedo}
                disabled={!canRedo}
                className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5"
                aria-label={t('redoTooltip')}
                title={t('redoTooltip')}
            >
                <RedoIcon className="w-5 h-5 mr-2" />
                {t('redoButton')}
            </button>
            
            <div className="h-6 w-px bg-gray-600 mx-1 hidden sm:block"></div>

            {canUndo && (
              <button 
                  onClick={() => setIsCompareMode(!isCompareMode)}
                  className={`flex items-center justify-center text-center border font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out active:scale-95 text-base ${isCompareMode ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white/10 border-white/20 text-gray-200 hover:bg-white/20 hover:border-white/30'}`}
                  aria-label={t('compareTooltip')}
                  title={t('compareTooltip')}
              >
                  <EyeIcon className="w-5 h-5 mr-2" />
                  {t('compareButton')}
              </button>
            )}

            <button 
                onClick={handleReset}
                disabled={!canUndo}
                className="text-center bg-transparent border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/10 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-transparent"
                title={t('resetTooltip')}
              >
                {t('resetButton')}
            </button>
            <button 
                onClick={handleUploadNew}
                className="text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base"
                title={t('uploadNewTooltip')}
            >
                {t('uploadNewButton')}
            </button>

            <button 
                onClick={handleDownload}
                className="flex-grow sm:flex-grow-0 ml-auto bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-5 rounded-md transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base"
                title={t('downloadTooltip')}
            >
                {t('downloadButton')}
            </button>
        </div>
        {confirmationAction && (
             <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in backdrop-blur-sm" onClick={() => setConfirmationAction(null)}>
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-2xl max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-xl font-bold text-white mb-4">{t('confirmTitle')}</h3>
                    <p className="text-gray-300 mb-6">{confirmationAction.message}</p>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setConfirmationAction(null)} 
                            className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                            {t('cancelButton')}
                        </button>
                        <button 
                            onClick={confirmationAction.onConfirm} 
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                            {t('confirmButton')}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header language={language} setLanguage={setLanguage} t={t} />
      <main className={`flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-8 flex justify-center ${currentImage ? 'items-start' : 'items-center'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
