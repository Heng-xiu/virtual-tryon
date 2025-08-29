import { ALLOWED_SHOPPING_SITES } from '../constants';
import type { 
  GetImageInfoRequest, 
  GetImageInfoResponse, 
  ImageInfo, 
  ContentMessage 
} from '../types/messages';
import { getImageContext, findImageElement } from '../utils/domExtract';
import { logger } from '../utils/logger';

export default defineContentScript({
  matches: ALLOWED_SHOPPING_SITES,
  main() {
    // Early return if not on allowed sites (additional safety check)
    const currentUrl = window.location.href;
    const isAllowedSite = ALLOWED_SHOPPING_SITES.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(currentUrl);
    });
    
    if (!isAllowedSite) {
      logger.content.debug('Not on allowed site, exiting', { url: currentUrl });
      return;
    }
    
    logger.content.info('Content script loaded', { url: currentUrl });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message: ContentMessage, sender, sendResponse) => {
      logger.content.debug('Received message', { type: message.type });

      switch (message.type) {
        case 'GET_IMAGE_INFO':
          handleImageInfoRequest(message as GetImageInfoRequest, sendResponse);
          return true; // Keep message channel open

        default:
          logger.content.warn('Unknown message type', { type: message.type });
      }
    });

    // Handle image info request
    function handleImageInfoRequest(
      message: GetImageInfoRequest, 
      sendResponse: (response: GetImageInfoResponse) => void
    ) {
      try {
        const { imageUrl, pageUrl } = message;
        
        // Find corresponding image element with performance limit
        const targetImage = findImageElement(imageUrl);

        // Collect image information
        const imageInfo: ImageInfo = {
          url: imageUrl,
          pageUrl: pageUrl || window.location.href,
          pageTitle: document.title,
          element: targetImage ? {
            alt: targetImage.alt || '',
            title: targetImage.title || '',
            width: targetImage.naturalWidth || targetImage.width,
            height: targetImage.naturalHeight || targetImage.height,
            className: targetImage.className,
            id: targetImage.id,
            dataset: targetImage.dataset
          } : null,
          context: getImageContext(targetImage),
          timestamp: Date.now()
        };

        logger.content.debug('Image info collected', { 
          hasElement: !!targetImage, 
          hasContext: !!imageInfo.context 
        });
        sendResponse({ success: true, imageInfo });
        
      } catch (error) {
        logger.content.error('Error collecting image info', error);
        sendResponse({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Optional: Highlight try-on images (future feature)
    function highlightTryOnImages() {
      logger.content.debug('Image highlighting feature ready for future implementation');
    }
  },
});
