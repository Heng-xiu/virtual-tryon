const STORAGE_KEYS = {
  apiKey: 'openrouter_api_key',
  baseUrl: 'openrouter_base_url',
  model: 'openrouter_model',
} as const;

const DEFAULTS = {
  baseUrl: 'https://openrouter.ai/api',
  model: 'google/gemini-2.5-flash-image-preview:free',
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
  if (!apiKey) throw new Error('缺少 API Key');

  const url = joinUrl(baseUrl, '/v1/models');
  const res = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(apiKey),
  });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error?.message || `列出模型失敗: ${res.status}`);
  }
  return res.json();
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

  if (typeof content === 'string') {
    return extractFromText(content);
  }

  if (Array.isArray(content)) {
    for (const part of content) {
      if (part?.type === 'image_url' && part?.image_url?.url) return part.image_url.url;
      if (part?.type === 'text' && typeof part.text === 'string') {
        const found = extractFromText(part.text);
        if (found) return found;
      }
      if (typeof part === 'string') {
        const found = extractFromText(part);
        if (found) return found;
      }
    }
  }

  if (typeof content === 'object') {
    if (content?.image_url?.url) return content.image_url.url;
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
  if (!apiKey) throw new Error('缺少 API Key');
  if (!personDataUrl) throw new Error('缺少人物圖片');
  if (!garmentImageUrl) throw new Error('缺少服裝圖片');

  const url = joinUrl(baseUrl, '/v1/chat/completions');

  const systemPrompt = [
    'You are a virtual try-on assistant.',
    'Given a person photo and a garment image, produce a single composite try-on result.',
    'Return only the image as a data URL (data:image/jpeg;base64,...) when possible.',
    'If you cannot produce a data URL, return a direct https image URL.',
    'Do not include markdown, code fences, or any extra text.',
  ].join(' ');

  const body = {
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
    stream: false,
  } as const;

  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify(body),
  });

  const data = await safeJson(res);
  if (!res.ok) {
    const msg = data?.error?.message || `生成失敗: ${res.status}`;
    throw new Error(msg);
  }

  const choice = data?.choices?.[0];
  const content = choice?.message?.content ?? choice?.message;
  const extracted = extractImageFromContent(content);
  if (extracted) return extracted;

  const alt = extractFromText(JSON.stringify(data));
  if (alt) return alt;

  throw new Error('回應中找不到圖片或資料網址');
}

