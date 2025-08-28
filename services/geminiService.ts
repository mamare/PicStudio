/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string // e.g., "edit", "filter", "adjustment"
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Received image data (${mimeType}) for ${context}`);
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check for other reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation for ${context} stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image for the ${context}. ` + 
        (textFeedback 
            ? `The model responded with text: "${textFeedback}"`
            : "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.");

    console.error(`Model response did not contain an image part for ${context}.`, { response });
    throw new Error(errorMessage);
};

const handleTextApiResponse = (
    response: GenerateContentResponse,
    context: string
): string => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    const text = response.text?.trim();
    if (text) {
        console.log(`Received text data for ${context}`);
        // Basic validation for OBJ format
        if (text.startsWith('v ') || text.startsWith('#')) {
            return text;
        }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Text generation for ${context} stopped unexpectedly. Reason: ${finishReason}.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const errorMessage = `The AI model did not return valid text content for the ${context}. ` +
        `This can happen due to safety filters or if the request is too complex.`;
    
    console.error(`Model response did not contain expected text part for ${context}.`, { response });
    throw new Error(errorMessage);
};


/**
 * Generates an edited image using generative AI based on a text prompt and a specific point.
 * @param originalImage The original image file.
 * @param userPrompt The text prompt describing the desired edit.
 * @param hotspot The {x, y} coordinates on the image to focus the edit.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateEditedImage = async (
    originalImage: File,
    userPrompt: string,
    hotspot: { x: number, y: number }
): Promise<string> => {
    console.log('Starting generative edit at:', hotspot);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, localized edit on the provided image based on the user's request.
User Request: "${userPrompt}"
Edit Location: Focus on the area around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}).

Editing Guidelines:
- The edit must be realistic and blend seamlessly with the surrounding area.
- The rest of the image (outside the immediate edit area) must remain identical to the original.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model.', response);

    return handleApiResponse(response, 'edit');
};

/**
 * Generates an image with a filter applied using generative AI.
 * @param originalImage The original image file.
 * @param filterPrompt The text prompt describing the desired filter.
 * @returns A promise that resolves to the data URL of the filtered image.
 */
export const generateFilteredImage = async (
    originalImage: File,
    filterPrompt: string,
): Promise<string> => {
    console.log(`Starting filter generation: ${filterPrompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to apply a stylistic filter to the entire image based on the user's request. Do not change the composition or content, only apply the style.
Filter Request: "${filterPrompt}"

Safety & Ethics Policy:
- Filters may subtly shift colors, but you MUST ensure they do not alter a person's fundamental race or ethnicity.
- YOU MUST REFUSE any request that explicitly asks to change a person's race (e.g., 'apply a filter to make me look Chinese').

Output: Return ONLY the final filtered image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and filter prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for filter.', response);
    
    return handleApiResponse(response, 'filter');
};

/**
 * Generates an image with a global adjustment applied using generative AI.
 * @param originalImage The original image file.
 * @param adjustmentPrompt The text prompt describing the desired adjustment.
 * @returns A promise that resolves to the data URL of the adjusted image.
 */
export const generateAdjustedImage = async (
    originalImage: File,
    adjustmentPrompt: string,
): Promise<string> => {
    console.log(`Starting global adjustment generation: ${adjustmentPrompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, global adjustment to the entire image based on the user's request.
User Request: "${adjustmentPrompt}"

Editing Guidelines:
- The adjustment must be applied across the entire image.
- The result must be photorealistic.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final adjusted image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and adjustment prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for adjustment.', response);
    
    return handleApiResponse(response, 'adjustment');
};

/**
 * Removes the background from an image using generative AI.
 * @param originalImage The original image file.
 * @returns A promise that resolves to the data URL of the image with a transparent background.
 */
export const generateRemovedBackground = async (
    originalImage: File,
): Promise<string> => {
    console.log(`Starting background removal`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editing AI. Your task is to precisely remove the background from the provided image.
Instructions:
- The main subject(s) must be perfectly masked and preserved with clean edges.
- The background should be made fully transparent (alpha channel).
- The output must be a PNG image with transparency.

Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image to the model for background removal...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for background removal.', response);
    
    return handleApiResponse(response, 'background-removal');
};

/**
 * Upscales an image using generative AI.
 * @param originalImage The original image file.
 * @returns A promise that resolves to the data URL of the upscaled image.
 */
export const generateUpscaledImage = async (
    originalImage: File,
): Promise<string> => {
    console.log(`Starting image upscaling`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert AI image upscaler. Your task is to increase the resolution of the provided image, enhancing details and clarity.
Instructions:
- Increase the image resolution significantly (e.g., 2x or 4x).
- Enhance fine details and textures naturally.
- Avoid creating artificial-looking textures or artifacts.
- The result must be photorealistic and true to the original composition.

Output: Return ONLY the final upscaled image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image to the model for upscaling...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for upscaling.', response);
    
    return handleApiResponse(response, 'upscaling');
};

/**
 * Generates an image from a text prompt.
 * @param prompt The text prompt describing the desired image.
 * @returns A promise that resolves to the data URL of the generated image.
 */
export const generateImageFromText = async (
    prompt: string,
): Promise<string> => {
    console.log(`Starting text-to-image generation: ${prompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
        },
    });
    console.log('Received response from model for text-to-image.', response);

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    }

    throw new Error('The AI model did not return an image. This could be due to safety filters or an issue with the prompt.');
};

/**
 * Generates a new image based on an existing image and a text prompt.
 * @param originalImage The original image file to use as a base.
 * @param prompt The text prompt describing the desired transformation.
 * @returns A promise that resolves to the data URL of the new image.
 */
export const generateImageFromImage = async (
    originalImage: File,
    prompt: string,
): Promise<string> => {
    console.log(`Starting image-to-image generation: ${prompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const originalImagePart = await fileToPart(originalImage);
    const textPrompt = `You are an expert AI artist. Your task is to completely reimagine the provided image based on the user's request. Use the original image as a loose reference for composition, but create a new artistic interpretation.
User Request: "${prompt}"

Output: Return ONLY the final generated image. Do not return text.`;
    const textPart = { text: textPrompt };

    console.log('Sending image and prompt to the model for image-to-image...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for image-to-image.', response);
    
    return handleApiResponse(response, 'image-to-image');
};

/**
 * Applies the style of one image to the content of another.
 * @param contentImage The image providing the content.
 * @param styleImage The image providing the artistic style.
 * @returns A promise that resolves to the data URL of the style-transferred image.
 */
export const generateStyleTransfer = async (
    contentImage: File,
    styleImage: File,
): Promise<string> => {
    console.log(`Starting style transfer`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const contentImagePart = await fileToPart(contentImage);
    const styleImagePart = await fileToPart(styleImage);
    
    const prompt = `You are an expert AI artist specializing in style transfer. Your task is to apply the artistic style of the second image (the style reference) to the content and composition of the first image (the content reference).

Instructions:
- Preserve the main subjects and structure from the first image.
- Recreate it using the colors, textures, brushstrokes, and overall aesthetic of the second image.
- The result should be a seamless artistic fusion.

Output: Return ONLY the final generated image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending content image, style image, and prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [contentImagePart, styleImagePart, textPart] },
    });
    console.log('Received response from model for style transfer.', response);
    
    return handleApiResponse(response, 'style-transfer');
};

/**
 * Generates a 3D model (in OBJ format) from an image.
 * @param originalImage The image to convert.
 * @returns A promise that resolves to the string content of the .obj file.
 */
export const generate3DModelFromImage = async (
    originalImage: File,
): Promise<string> => {
    console.log(`Starting image-to-3d-model generation`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const originalImagePart = await fileToPart(originalImage);
    
    const prompt = `You are an expert 3D modeling AI. Your task is to analyze the provided 2D image and generate a corresponding 3D model in the Wavefront OBJ (.obj) file format.

Instructions:
- Interpret the main subject of the image and create a plausible 3D mesh for it.
- The output MUST be only the raw text content of a valid .obj file.
- The model should be suitable for 3D printing.
- Do not include any explanations, comments (unless part of the OBJ format), or any text other than the OBJ file content itself. Start the response directly with 'v' for vertices or '#' for comments.

Output: Return ONLY the raw text for the .obj file.`;
    const textPart = { text: prompt };

    console.log('Sending image to the model for 3D model generation...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Use a strong model for this complex task
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for 3D model.', response);
    
    return handleTextApiResponse(response, '3d-model');
};
