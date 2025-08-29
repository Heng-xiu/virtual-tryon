import React, { useState, useEffect } from 'react';
import PhotoUploader from '../../components/PhotoUploader';
import { photoStorage } from '../../utils/storage';
import type { Photo } from '../../types/photo';
import { hasApiKey, generateTryOn } from '../../utils/openrouter';

interface TryOnFlowProps {
  selectedImageUrl: string | null;
  sourcePageUrl: string | null;
}

type FlowStep = 'loading' | 'no_photos' | 'upload' | 'processing' | 'result';

export default function TryOnFlow({ selectedImageUrl, sourcePageUrl }: TryOnFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('loading');
  const [defaultPhoto, setDefaultPhoto] = useState<Photo | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    initializeFlow();
  }, []);

  const initializeFlow = async () => {
    try {
      setCurrentStep('loading');
      setErrorMsg(null);

      // Check for default photo
      const photos = await photoStorage.getPhotos();
      const defaultPhotoData = photos.find(p => p.isDefault) || photos[0];
      setApiReady(await hasApiKey());

      if (defaultPhotoData) {
        setDefaultPhoto(defaultPhotoData);
        setCurrentStep('processing');
        startProcessing(defaultPhotoData);
      } else {
        setCurrentStep('no_photos');
      }
    } catch (error) {
      console.error('Error initializing try-on flow:', error);
      setCurrentStep('no_photos');
    }
  };

  const handleUploadSuccess = async (photos: Photo[]) => {
    if (photos.length > 0) {
      const newDefaultPhoto = photos.find(p => p.isDefault) || photos[0];
      setDefaultPhoto(newDefaultPhoto);
      setCurrentStep('processing');
      startProcessing(newDefaultPhoto);
    }
  };

  const startProcessing = (photoForProcessing?: Photo) => {
    setProcessingProgress(0);
    setErrorMsg(null);
    
    // Simulate processing progress
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15 + 5; // Random progress increment
      });
    }, 300);

    // Trigger actual API processing (if user has set API Key and has garment image)
    (async () => {
      try {
        const ready = await hasApiKey();
        setApiReady(ready);
        const person = (photoForProcessing || defaultPhoto);
        const garment = selectedImageUrl;
        if (!person || !garment) return;

        if (!ready) {
          // When no API Key, use demo result and wait for progress completion
          setResultImage('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=600&fit=crop&crop=face');
          return;
        }

        const url = await generateTryOn(person.dataUrl, garment);
        // Set result, wait for progress completion to switch screen
        setResultImage(url);
      } catch (e: any) {
        console.warn('Try-on API error:', e);
        setErrorMsg(e?.message || 'Generation failed. Please try again later or check your settings.');
      }
    })();
  };

  // When result image is obtained and progress is complete, switch to result page
  useEffect(() => {
    if (currentStep === 'processing' && resultImage && processingProgress >= 100) {
      setCurrentStep('result');
    }
  }, [currentStep, resultImage, processingProgress]);

  const handleRetry = () => {
    setCurrentStep('processing');
    setProcessingProgress(0);
    setResultImage(null);
    startProcessing();
  };

  const handleClose = () => {
    window.close();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'loading':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Preparing Virtual Try-On</h2>
            <p className="text-gray-600">Checking your standard photo...</p>
          </div>
        );

      case 'no_photos':
        return (
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your standard photo is needed</h2>
              <p className="text-gray-600">Please upload a standard photo to start the try-on</p>
            </div>
            
            <PhotoUploader onUploadSuccess={handleUploadSuccess} />
            
            <div className="mt-6 text-center">
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Upload Standard Photo</h2>
            <PhotoUploader onUploadSuccess={handleUploadSuccess} />
          </div>
        );

      case 'processing':
        return (
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a9 9 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI is generating the try-on</h2>
              <p className="text-gray-600 mb-6">Please wait. This may take a few seconds...</p>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(processingProgress, 100)}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-500">
                {processingProgress < 30 && 'Analyzing garment features...'}
                {processingProgress >= 30 && processingProgress < 60 && 'Matching your body shape...'}
                {processingProgress >= 60 && processingProgress < 90 && 'Generating try-on...'}
                {processingProgress >= 90 && 'Almost done...'}
              </p>

              {apiReady === false && (
                <div className="mt-4 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-3 py-2">
                  No OpenRouter API Key set. Showing a sample result. Add a key in the extension popup Settings to enable real generation.
                </div>
              )}

              {errorMsg && (
                <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {errorMsg}
                </div>
              )}

              {errorMsg && (
                <div className="mt-4">
                  <button
                    onClick={handleRetry}
                    className="w-full bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Retry Generation
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'result':
        return (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full mx-4">
            <div className="p-6 bg-blue-600">
              <h2 className="text-2xl font-bold text-white text-center">✨ Try-On Result</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Original garment image */}
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Selected Garment</h3>
                  <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={selectedImageUrl || 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=300&fit=crop'}
                      alt="Selected garment"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {sourcePageUrl && (
                    <p className="text-xs text-gray-500 truncate">
                      Source: {new URL(sourcePageUrl).hostname}
                    </p>
                  )}
                </div>
                
                {/* Try-on result */}
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Try-On Result</h3>
                  <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 relative">
                    <img
                      src={resultImage || ''}
                      alt="Try-on result"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-cyan-500 text-white text-xs rounded-full">
                        AI Generated
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200"
                >
                  🔄 Regenerate
                </button>
                
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = resultImage || '';
                    link.download = 'virtual-tryon-result.jpg';
                    link.click();
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-200 transition-all duration-200"
                >
                  💾 Save Image
                </button>
                
                <button
                  onClick={handleClose}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  ✅ Done
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {renderStep()}
    </div>
  );
}
