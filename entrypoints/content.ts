export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('Virtual Try-On content script loaded on:', window.location.href);

    // 監聽來自 background script 的訊息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Content script received message:', message);

      switch (message.type) {
        case 'GET_IMAGE_INFO':
          handleImageInfoRequest(message, sendResponse);
          return true; // 保持訊息通道開啟

        default:
          console.log('Unknown message type in content script:', message.type);
      }
    });

    // 處理圖片資訊請求
    function handleImageInfoRequest(message: any, sendResponse: (response: any) => void) {
      try {
        const { imageUrl, pageUrl } = message;
        
        // 尋找對應的圖片元素
        const images = document.querySelectorAll('img');
        let targetImage: HTMLImageElement | null = null;
        
        for (const img of images) {
          if (img.src === imageUrl || img.currentSrc === imageUrl) {
            targetImage = img;
            break;
          }
        }

        // 收集圖片相關資訊
        const imageInfo = {
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

        console.log('Image info collected:', imageInfo);
        sendResponse({ success: true, imageInfo });
        
      } catch (error) {
        console.error('Error collecting image info:', error);
        sendResponse({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // 獲取圖片的上下文資訊
    function getImageContext(imgElement: HTMLImageElement | null): any {
      if (!imgElement) return null;

      try {
        const parent = imgElement.parentElement;
        const context = {
          parentTag: parent?.tagName?.toLowerCase(),
          parentClass: parent?.className,
          parentId: parent?.id,
          siblingImages: 0,
          nearbyText: '',
          productInfo: extractProductInfo(imgElement)
        };

        // 計算同層的圖片數量
        if (parent) {
          context.siblingImages = parent.querySelectorAll('img').length;
          
          // 嘗試獲取附近的文字內容
          const textNodes = getTextContent(parent, 100);
          context.nearbyText = textNodes.slice(0, 200); // 限制文字長度
        }

        return context;
      } catch (error) {
        console.error('Error getting image context:', error);
        return null;
      }
    }

    // 嘗試提取商品資訊
    function extractProductInfo(imgElement: HTMLImageElement): any {
      const productInfo: any = {};
      
      // 檢查常見的電商網站資訊
      const parent = imgElement.closest('[data-product], .product, .item, [itemtype*="Product"]');
      
      if (parent) {
        // 尋找價格資訊
        const priceElement = parent.querySelector('[class*="price"], [data-price], .price');
        if (priceElement) {
          productInfo.price = priceElement.textContent?.trim();
        }
        
        // 尋找商品名稱
        const titleElement = parent.querySelector('h1, h2, h3, [class*="title"], [class*="name"]');
        if (titleElement) {
          productInfo.title = titleElement.textContent?.trim();
        }
        
        // 尋找品牌資訊
        const brandElement = parent.querySelector('[class*="brand"], [data-brand]');
        if (brandElement) {
          productInfo.brand = brandElement.textContent?.trim();
        }
      }
      
      return Object.keys(productInfo).length > 0 ? productInfo : null;
    }

    // 獲取元素的文字內容
    function getTextContent(element: Element, maxLength: number = 100): string {
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

    // 可選：高亮顯示可試穿的圖片（未來功能）
    function highlightTryOnImages() {
      // 這個功能暫時保留，可以在未來添加圖片標記
      console.log('Image highlighting feature ready for future implementation');
    }
  },
});
