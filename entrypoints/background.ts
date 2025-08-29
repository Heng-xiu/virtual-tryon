import { CONTEXT_MENU_ID, ALLOWED_SHOPPING_SITES } from '../constants';
import { logger } from '../utils/logger';
import type { GetImageInfoRequest, BackgroundMessage } from '../types/messages';

// Window configuration constants
const TRYON_WINDOW_CONFIG = {
  width: 800,
  height: 600,
  left: 100,
  top: 100,
  type: 'popup' as const,
};

// Error messages
const ERRORS = {
  CONTENT_SCRIPT_NOT_INJECTED: 'Content script not available on this page',
  FAILED_TO_OPEN_WINDOW: 'Failed to open try-on window',
  INVALID_TAB: 'Invalid tab information',
  COMMUNICATION_FAILED: 'Failed to communicate with content script',
} as const;

export default defineBackground(() => {
  logger.background.info('Virtual Try-On Extension loaded', { id: browser.runtime.id });

  // Create context menu
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: '🪄 Virtual Try-On',
      contexts: ['image'],
      documentUrlPatterns: ALLOWED_SHOPPING_SITES
    });
    logger.background.info('Context menu created');
  });

  // Handle context menu click
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === CONTEXT_MENU_ID && info.srcUrl && tab?.id) {
      logger.background.info('Virtual try-on clicked for image', { imageUrl: info.srcUrl, tabId: tab.id });
      
      try {
        await handleTryOnRequest(info.srcUrl, tab);
      } catch (error) {
        logger.background.error('Failed to handle try-on request', error);
        // Fallback: open window without additional context
        await openTryOnWindow({ imageUrl: info.srcUrl, pageUrl: tab.url });
      }
    }
  });

  /**
   * Handle try-on request by gathering image context and opening window
   */
  async function handleTryOnRequest(imageUrl: string, tab: chrome.tabs.Tab): Promise<void> {
    if (!tab.id) {
      throw new Error(ERRORS.INVALID_TAB);
    }

    let imageInfo = null;

    try {
      // Try to get detailed image info from content script
      const message: GetImageInfoRequest = {
        type: 'GET_IMAGE_INFO',
        imageUrl,
        pageUrl: tab.url || ''
      };

      const response = await chrome.tabs.sendMessage(tab.id, message);
      
      if (response?.success) {
        imageInfo = response.imageInfo;
        logger.background.debug('Got image info from content script', imageInfo);
      } else {
        logger.background.warn('Content script returned error', response);
      }
    } catch (error) {
      // Content script not available or failed - this is expected on some pages
      logger.background.debug('Content script communication failed', error);
    }

    // Open try-on window with available information
    await openTryOnWindow({
      imageUrl,
      pageUrl: tab.url,
      imageInfo
    });
  }

  /**
   * Open try-on window with given parameters
   */
  async function openTryOnWindow(params: {
    imageUrl: string;
    pageUrl?: string;
    imageInfo?: any;
  }): Promise<void> {
    try {
      const tryonUrl = chrome.runtime.getURL('tryon.html');
      const urlParams = new URLSearchParams({
        imageUrl: params.imageUrl,
        ...(params.pageUrl && { pageUrl: params.pageUrl }),
        ...(params.imageInfo && { imageInfo: JSON.stringify(params.imageInfo) })
      });

      const window = await chrome.windows.create({
        url: `${tryonUrl}?${urlParams.toString()}`,
        ...TRYON_WINDOW_CONFIG
      });
      
      logger.background.info('Try-on window created', { windowId: window.id });
    } catch (error) {
      logger.background.error('Failed to create try-on window', error);
      throw new Error(ERRORS.FAILED_TO_OPEN_WINDOW);
    }
  }

  // Listen for messages from other parts of the extension
  chrome.runtime.onMessage.addListener((message: BackgroundMessage, sender, sendResponse) => {
    logger.background.debug('Background received message', { type: message.type, sender: sender.id });
    
    switch (message.type) {
      case 'CLOSE_TRYON_WINDOW':
        handleCloseWindow(message, sendResponse);
        break;
        
      case 'GET_STORAGE_DATA':
        handleGetStorageData(sendResponse);
        return true; // Keep message channel open
        
      default:
        logger.background.warn('Unknown message type received', { type: message.type });
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  });

  /**
   * Handle window close request
   */
  function handleCloseWindow(message: any, sendResponse: (response: any) => void): void {
    if (message.windowId) {
      chrome.windows.remove(message.windowId)
        .then(() => {
          logger.background.info('Window closed', { windowId: message.windowId });
          sendResponse({ success: true });
        })
        .catch((error) => {
          logger.background.error('Failed to close window', { windowId: message.windowId, error });
          sendResponse({ success: false, error: 'Failed to close window' });
        });
    } else {
      logger.background.warn('Close window request without windowId');
      sendResponse({ success: false, error: 'Missing windowId' });
    }
  }

  /**
   * Handle storage data request
   */
  function handleGetStorageData(sendResponse: (response: any) => void): void {
    chrome.storage.local.get(null)
      .then(data => {
        logger.background.debug('Storage data retrieved', { keys: Object.keys(data) });
        sendResponse({ success: true, data });
      })
      .catch(error => {
        logger.background.error('Failed to get storage data', error);
        sendResponse({ success: false, error: 'Failed to retrieve storage data' });
      });
  }
});
