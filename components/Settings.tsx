import React, { useEffect, useState } from 'react';
import { listModels, getApiKey, setApiKey, getBaseUrl, setBaseUrl, getModel, setModel, clearApiKey } from '../utils/openrouter';
import { photoStorage } from '../utils/storage';

export default function Settings() {
  const [apiKey, setApiKeyState] = useState('');
  const [masked, setMasked] = useState<boolean>(true);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; msg?: string }>({ type: 'idle' });
  const [baseUrl, setBaseUrlState] = useState('');
  const [model, setModelState] = useState('');
  const [loading, setLoading] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ used: 0, quota: 0, percentage: 0 });
  const [clearingData, setClearingData] = useState(false);

  useEffect(() => {
    (async () => {
      const [k, u, m, usage] = await Promise.all([
        getApiKey(), 
        getBaseUrl(), 
        getModel(),
        photoStorage.getStorageUsage()
      ]);
      setApiKeyState(k || '');
      setBaseUrlState(u);
      setModelState(m);
      setStorageUsage(usage);
    })();
  }, []);

  const handleSave = async () => {
    try {
      setStatus({ type: 'idle' });
      if (!apiKey.trim()) {
        setStatus({ type: 'error', msg: 'Please enter API Key' });
        return;
      }
      await Promise.all([setApiKey(apiKey.trim()), setBaseUrl(baseUrl.trim()), setModel(model.trim())]);
      setStatus({ type: 'success', msg: 'Settings saved' });
      setTimeout(() => setStatus({ type: 'idle' }), 3000);
    } catch (e) {
      setStatus({ type: 'error', msg: 'Save failed. Please try again.' });
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setStatus({ type: 'idle' });
    try {
      const data = await listModels();
      const count = Array.isArray(data?.data) ? data.data.length : (data?.models?.length || 0);
      setStatus({ type: 'success', msg: `Connected successfully. Models: ${count}` });
    } catch (e: any) {
      setStatus({ type: 'error', msg: `Connection failed: ${e?.message || 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('Clear all photos and API key? This cannot be undone.')) {
      return;
    }

    setClearingData(true);
    setStatus({ type: 'idle' });
    
    try {
      await Promise.all([
        photoStorage.clearAllPhotos(),
        clearApiKey()
      ]);
      
      // Reset local state
      setApiKeyState('');
      setBaseUrlState('https://openrouter.ai/api');
      setModelState('google/gemini-2.5-flash-image-preview:free');
      setStorageUsage({ used: 0, quota: storageUsage.quota, percentage: 0 });
      
      setStatus({ type: 'success', msg: 'All data cleared' });
      setTimeout(() => setStatus({ type: 'idle' }), 3000);
    } catch (e: any) {
      setStatus({ type: 'error', msg: `Failed to clear data: ${e?.message || 'Unknown error'}` });
    } finally {
      setClearingData(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">OpenRouter Settings (BYO Key)</h2>
        <p className="text-sm text-gray-600 mt-1">Your key is stored locally in extension storage.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">API Key</label>
          <div className="mt-1 flex gap-2">
            <input
              type={masked ? 'password' : 'text'}
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
              placeholder="sk-or-v1-..."
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setMasked((m) => !m)}
              className="px-3 py-2 border rounded-md text-sm bg-gray-50 hover:bg-gray-100"
            >
              {masked ? 'Show' : 'Hide'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrlState(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Default: https://openrouter.ai/api</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Model ID</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModelState(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: google/gemini-2.5-flash-image-preview (or add :free). Multimodal supports image_url.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Settings
          </button>
          <button
            onClick={handleTest}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {status.type !== 'idle' && (
          <div
            className={`p-3 rounded-md text-sm ${
              status.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {status.msg}
          </div>
        )}

        <div className="border-t pt-4 mt-6">
          <h3 className="text-md font-medium text-gray-900 mb-3">Storage & Privacy</h3>
          
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Storage used</span>
                <span className="text-sm text-gray-600">
                  {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.quota)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    storageUsage.percentage > 80 
                      ? 'bg-red-500' 
                      : storageUsage.percentage > 60 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {storageUsage.percentage}% used
              </p>
            </div>

            <button
              onClick={handleClearAllData}
              disabled={clearingData}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Clear all photos and API key"
            >
              {clearingData ? 'Clearing...' : 'Clear All Photos & Key'}
            </button>
            
            <p className="text-xs text-gray-500">
              This will clear all uploaded photos and API settings, freeing up local storage space.
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Tip: If you encounter 429 (Too Many Requests), try using a non-free model, reduce request frequency, or try again later.
        </div>
      </div>
    </div>
  );
}
