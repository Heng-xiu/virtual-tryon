import React from 'react';
import ReactDOM from 'react-dom/client';
import TryOnFlow from './TryOnFlow';
import '../popup/style.css';

// 獲取 URL 參數
const urlParams = new URLSearchParams(window.location.search);
const imageUrl = urlParams.get('imageUrl');
const pageUrl = urlParams.get('pageUrl');

console.log('Try-on page loaded with params:', { imageUrl, pageUrl });

const App = () => {
  return (
    <TryOnFlow 
      selectedImageUrl={imageUrl} 
      sourcePageUrl={pageUrl} 
    />
  );
};

const root = ReactDOM.createRoot(document.getElementById('app')!);
root.render(<App />);