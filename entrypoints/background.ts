export default defineBackground(() => {
  console.log('Virtual Try-On Extension loaded!', { id: browser.runtime.id });

  // 創建右鍵選單
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'virtual-tryon',
      title: '🪄 虛擬試穿',
      contexts: ['image'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });
    console.log('Context menu created');
  });

  // 處理右鍵選單點擊
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'virtual-tryon' && info.srcUrl && tab?.id) {
      console.log('Virtual try-on clicked for image:', info.srcUrl);
      
      try {
        // 發送訊息給 content script 獲取更詳細的圖片資訊
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'GET_IMAGE_INFO',
          imageUrl: info.srcUrl,
          pageUrl: tab.url
        });

        // 開啟虛擬試穿頁面
        const tryonUrl = chrome.runtime.getURL('tryon.html');
        const window = await chrome.windows.create({
          url: `${tryonUrl}?imageUrl=${encodeURIComponent(info.srcUrl)}&pageUrl=${encodeURIComponent(tab.url || '')}`,
          type: 'popup',
          width: 800,
          height: 600,
          left: 100,
          top: 100
        });
        
        console.log('Try-on window created:', window.id);
      } catch (error) {
        console.error('Error handling try-on request:', error);
        
        // 如果 content script 通訊失敗，直接開啟頁面
        const tryonUrl = chrome.runtime.getURL('tryon.html');
        await chrome.windows.create({
          url: `${tryonUrl}?imageUrl=${encodeURIComponent(info.srcUrl)}`,
          type: 'popup',
          width: 800,
          height: 600,
          left: 100,
          top: 100
        });
      }
    }
  });

  // 監聽來自其他部分的訊息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    switch (message.type) {
      case 'CLOSE_TRYON_WINDOW':
        // 關閉試穿視窗
        if (message.windowId) {
          chrome.windows.remove(message.windowId);
        }
        break;
        
      case 'GET_STORAGE_DATA':
        // 獲取儲存資料
        chrome.storage.local.get(null).then(data => {
          sendResponse({ success: true, data });
        });
        return true; // 保持訊息通道開啟
        
      default:
        console.log('Unknown message type:', message.type);
    }
  });
});
