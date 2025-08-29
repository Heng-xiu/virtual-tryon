import type { ImageContext, ProductInfo } from '../types/messages';

/**
 * Get context information for an image element
 */
export function getImageContext(imgElement: HTMLImageElement | null): ImageContext | null {
  if (!imgElement) return null;

  try {
    const parent = imgElement.parentElement;
    const context: ImageContext = {
      parentTag: parent?.tagName?.toLowerCase(),
      parentClass: parent?.className,
      parentId: parent?.id,
      siblingImages: 0,
      nearbyText: '',
      productInfo: extractProductInfo(imgElement)
    };

    // Count sibling images
    if (parent) {
      context.siblingImages = parent.querySelectorAll('img').length;
      
      // Get nearby text content
      const textNodes = getTextContent(parent, 100);
      context.nearbyText = textNodes.slice(0, 200); // Limit text length
    }

    return context;
  } catch (error) {
    console.error('Error getting image context:', error);
    return null;
  }
}

/**
 * Extract product information from the image's container
 */
export function extractProductInfo(imgElement: HTMLImageElement): ProductInfo | null {
  const productInfo: ProductInfo = {};
  
  // Check common e-commerce site information
  const parent = imgElement.closest('[data-product], .product, .item, [itemtype*="Product"]');
  
  if (parent) {
    // Find price information
    const priceElement = parent.querySelector('[class*="price"], [data-price], .price');
    if (priceElement) {
      productInfo.price = priceElement.textContent?.trim();
    }
    
    // Find product name
    const titleElement = parent.querySelector('h1, h2, h3, [class*="title"], [class*="name"]');
    if (titleElement) {
      productInfo.title = titleElement.textContent?.trim();
    }
    
    // Find brand information
    const brandElement = parent.querySelector('[class*="brand"], [data-brand]');
    if (brandElement) {
      productInfo.brand = brandElement.textContent?.trim();
    }
  }
  
  return Object.keys(productInfo).length > 0 ? productInfo : null;
}

/**
 * Get text content from an element with length limit
 */
export function getTextContent(element: Element, maxLength: number = 100): string {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  let text = '';
  let node;
  
  while (node = walker.nextNode()) {
    const nodeText = node.textContent?.trim();
    if (nodeText && nodeText.length > 0) {
      text += nodeText + ' ';
      if (text.length > maxLength) break;
    }
  }
  
  return text.trim();
}

/**
 * Find image elements with performance optimization
 * Limits DOM scanning to prevent performance issues
 */
export function findImageElement(imageUrl: string, maxElements: number = 1000): HTMLImageElement | null {
  const images = document.querySelectorAll('img');
  let count = 0;
  
  for (const img of images) {
    if (count >= maxElements) {
      console.warn('Image search stopped due to performance limit');
      break;
    }
    
    if (img.src === imageUrl || img.currentSrc === imageUrl) {
      return img as HTMLImageElement;
    }
    
    count++;
  }
  
  return null;
}