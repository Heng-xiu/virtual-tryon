// Message types for communication between background, content, and popup scripts

export interface ImageElement {
  alt: string;
  title: string;
  width: number;
  height: number;
  className: string;
  id: string;
  dataset: DOMStringMap;
}

export interface ProductInfo {
  price?: string;
  title?: string;
  brand?: string;
}

export interface ImageContext {
  parentTag?: string;
  parentClass?: string;
  parentId?: string;
  siblingImages: number;
  nearbyText: string;
  productInfo: ProductInfo | null;
}

export interface ImageInfo {
  url: string;
  pageUrl: string;
  pageTitle: string;
  element: ImageElement | null;
  context: ImageContext | null;
  timestamp: number;
}

// Background script messages
export interface GetImageInfoRequest {
  type: 'GET_IMAGE_INFO';
  imageUrl: string;
  pageUrl: string;
}

export interface GetImageInfoResponse {
  success: boolean;
  imageInfo?: ImageInfo;
  error?: string;
}

// Content script messages
export interface ContentMessage {
  type: string;
  [key: string]: unknown;
}

export interface BackgroundMessage {
  type: string;
  [key: string]: unknown;
}

// Try-on parameters
export interface TryOnParams {
  imageUrl: string;
  pageUrl: string;
  pageTitle?: string;
  productInfo?: ProductInfo;
}

// OpenRouter API types
export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
      };
    }>;
  }>;
  max_tokens?: number;
  temperature?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | Array<{
        type: string;
        text?: string;
        image_url?: {
          url: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ApiError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
  status: number;
}