import type { ChatCompletionRequest, ChatCompletionResponse, ApiError } from '../types/messages';

const STORAGE_KEYS = {
  apiKey: 'openrouter_api_key',
  baseUrl: 'openrouter_base_url',
  model: 'openrouter_model',
} as const;

const DEFAULTS = {
  baseUrl: 'https://openrouter.ai/api',
  model: 'google/gemini-2.5-flash-image-preview:free',
  timeout: 30000, // 30 seconds
} as const;

// Error message mappings for better user experience
const ERROR_MESSAGES = {
  401: 'API key is invalid or missing. Please check your OpenRouter API key.',
  403: 'Access forbidden. Your API key may not have permission for this model.',
  429: 'Rate limit exceeded. Please wait a moment and try again.',
  500: 'Server error. Please try again later.',
  502: 'Bad gateway. The service may be temporarily unavailable.',
  503: 'Service unavailable. Please try again later.',
  504: 'Request timeout. Please try again.',
} as const;

type Json = Record<string, any>;

async function getFromStorage<T = string | null>(key: string): Promise<T | null> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const result = await chrome.storage.local.get(key);
    return (result?.[key] as T) ?? null;
  }
  const val = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  return (val as unknown as T) ?? null;
}

async function setToStorage(key: string, value: string): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [key]: value });
    return;
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
  }
}

function normalizeBaseUrl(u: string): string {
  if (!u) return DEFAULTS.baseUrl;
  return u.endsWith('/') ? u.slice(0, -1) : u;
}

export async function getApiKey(): Promise<string | null> {
  return (await getFromStorage<string>(STORAGE_KEYS.apiKey)) || null;
}

export async function setApiKey(key: string): Promise<void> {
  await setToStorage(STORAGE_KEYS.apiKey, key);
}

export async function getBaseUrl(): Promise<string> {
  const stored = await getFromStorage<string>(STORAGE_KEYS.baseUrl);
  return normalizeBaseUrl(stored || DEFAULTS.baseUrl);
}

export async function setBaseUrl(url: string): Promise<void> {
  await setToStorage(STORAGE_KEYS.baseUrl, normalizeBaseUrl(url || DEFAULTS.baseUrl));
}

export async function getModel(): Promise<string> {
  const stored = await getFromStorage<string>(STORAGE_KEYS.model);
  return stored || DEFAULTS.model;
}

export async function setModel(model: string): Promise<void> {
  await setToStorage(STORAGE_KEYS.model, model || DEFAULTS.model);
}

export async function hasApiKey(): Promise<boolean> {
  const k = await getApiKey();
  return !!(k && k.trim());
}

export async function clearApiKey(): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.remove([
      STORAGE_KEYS.apiKey,
      STORAGE_KEYS.baseUrl,
      STORAGE_KEYS.model,
    ]);
    return;
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.apiKey);
    localStorage.removeItem(STORAGE_KEYS.baseUrl);
    localStorage.removeItem(STORAGE_KEYS.model);
  }
}

function getErrorMessage(status: number): string {
  const message = ERROR_MESSAGES[status as keyof typeof ERROR_MESSAGES];
  if (message) return message;
  
  if (status >= 500) return 'Server error. Please try again later.';
  if (status >= 400) return 'Request error. Please check your settings.';
  
  return `Unexpected error (${status}). Please try again.`;
}

function createAbortController(timeoutMs: number = DEFAULTS.timeout): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

function buildHeaders(apiKey: string): HeadersInit {
  const title = 'Virtual Try-On Extension';
  let referer = 'https://virtual-tryon.local';
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      referer = chrome.runtime.getURL('');
    } else if (typeof window !== 'undefined' && window.location?.origin) {
      referer = window.location.origin;
    }
  } catch (_) {}

  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': referer,
    'X-Title': title,
  } as const;
}

function joinUrl(base: string, path: string): string {
  const b = normalizeBaseUrl(base);
  return `${b}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function listModels(): Promise<Json> {
  const [apiKey, baseUrl] = await Promise.all([getApiKey(), getBaseUrl()]);
  if (!apiKey) throw new Error('Missing API Key');

  const controller = createAbortController();
  const url = joinUrl(baseUrl, '/v1/models');
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(apiKey),
      signal: controller.signal,
    });
    
    if (!res.ok) {
      const body = await safeJson(res);
      const errorMessage = body?.error?.message || getErrorMessage(res.status);
      throw new Error(errorMessage);
    }
    
    return res.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
}

function extractFromText(text: string): string | null {
  const dataUrl = text.match(/data:image\/(?:png|jpe?g|webp)[^;,]*;base64,[A-Za-z0-9+/=]+/i);
  if (dataUrl) return dataUrl[0];

  const md = text.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/i);
  if (md) return md[1];

  const url = text.match(/https?:\/\/[^\s)]+/i);
  if (url) return url[0];

  return null;
}

function extractImageFromContent(content: any): string | null {
  if (!content) return null;

  // Handle structured content (array format)
  if (Array.isArray(content)) {
    for (const part of content) {
      // Check for structured image_url objects
      if (part?.type === 'image_url' && part?.image_url?.url) {
        return part.image_url.url;
      }
      
      // Check for text content with embedded URLs
      if (part?.type === 'text' && typeof part.text === 'string') {
        const found = extractFromText(part.text);
        if (found) return found;
      }
      
      // Handle direct string parts
      if (typeof part === 'string') {
        const found = extractFromText(part);
        if (found) return found;
      }
      
      // Handle nested objects
      if (typeof part === 'object' && part !== null) {
        const nested = extractImageFromContent(part);
        if (nested) return nested;
      }
    }
  }

  // Handle object format
  if (typeof content === 'object' && content !== null) {
    // Direct image_url property
    if (content.image_url?.url) return content.image_url.url;
    
    // Check for url property directly
    if (typeof content.url === 'string') {
      const found = extractFromText(content.url);
      if (found) return found;
    }
    
    // Recursively check object properties
    for (const value of Object.values(content)) {
      const found = extractImageFromContent(value);
      if (found) return found;
    }
  }

  // Handle string content (fallback to text extraction)
  if (typeof content === 'string') {
    return extractFromText(content);
  }

  return null;
}

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch (_) {
    return null;
  }
}

export async function generateTryOn(personDataUrl: string, garmentImageUrl: string): Promise<string> {
  const [apiKey, baseUrl, model] = await Promise.all([
    getApiKey(),
    getBaseUrl(),
    getModel(),
  ]);
  
  if (!apiKey) throw new Error('Missing API Key');
  if (!personDataUrl) throw new Error('Missing person image');
  if (!garmentImageUrl) throw new Error('Missing garment image');

  const controller = createAbortController();
  const url = joinUrl(baseUrl, '/v1/chat/completions');

  const systemPrompt = [
    'You are a virtual try-on assistant.',
    'Given a person photo and a garment image, produce a single composite try-on result.',
    'Return only the image as a data URL (data:image/jpeg;base64,...) when possible.',
    'If you cannot produce a data URL, return a direct https image URL.',
    'Do not include markdown, code fences, or any extra text.',
  ].join(' ');

  const body: ChatCompletionRequest = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please generate a single try-on image and respond with only the image URL or data URL.',
          },
          { type: 'image_url', image_url: { url: personDataUrl } },
          { type: 'image_url', image_url: { url: garmentImageUrl } },
        ],
      },
    ],
    max_tokens: 4000,
    temperature: 0.7,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(apiKey),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await safeJson(res);
    if (!res.ok) {
      const errorMessage = data?.error?.message || getErrorMessage(res.status);
      throw new Error(errorMessage);
    }

    // Extract image from response with improved logic
    const choice = data?.choices?.[0];
    const content = choice?.message?.content ?? choice?.message;
    const extracted = extractImageFromContent(content);
    if (extracted) return extracted;

    // Fallback: search entire response for image URLs
    const fallbackExtracted = extractFromText(JSON.stringify(data));
    if (fallbackExtracted) return fallbackExtracted;

    throw new Error('No image found in response. Please try again.');
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
}

