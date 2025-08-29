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
        setStatus({ type: 'error', msg: '請輸入 API Key' });
        return;
      }
      await Promise.all([setApiKey(apiKey.trim()), setBaseUrl(baseUrl.trim()), setModel(model.trim())]);
      setStatus({ type: 'success', msg: '已儲存設定' });
      setTimeout(() => setStatus({ type: 'idle' }), 3000);
    } catch (e) {
      setStatus({ type: 'error', msg: '儲存失敗，請再試一次' });
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setStatus({ type: 'idle' });
    try {
      const data = await listModels();
      const count = Array.isArray(data?.data) ? data.data.length : (data?.models?.length || 0);
      setStatus({ type: 'success', msg: `連線成功，模型數：${count}` });
    } catch (e: any) {
      setStatus({ type: 'error', msg: `連線失敗：${e?.message || '未知錯誤'}` });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('確定要清除所有照片和 API 金鑰嗎？此操作無法復原。')) {
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
      
      setStatus({ type: 'success', msg: '已清除所有資料' });
      setTimeout(() => setStatus({ type: 'idle' }), 3000);
    } catch (e: any) {
      setStatus({ type: 'error', msg: `清除失敗：${e?.message || '未知錯誤'}` });
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
        <h2 className="text-lg font-semibold text-gray-900">OpenRouter 設定（BYO Key）</h2>
        <p className="text-sm text-gray-600 mt-1">你的金鑰只會儲存在本機的擴充儲存中。</p>
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
              {masked ? '顯示' : '隱藏'}
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
          <p className="text-xs text-gray-500 mt-1">預設： https://openrouter.ai/api</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">模型 ID</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModelState(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            範例：google/gemini-2.5-flash-image-preview（或加 :free）。多模態可吃 image_url。
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            儲存設定
          </button>
          <button
            onClick={handleTest}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? '測試中…' : '測試連線'}
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
          <h3 className="text-md font-medium text-gray-900 mb-3">儲存空間與隱私</h3>
          
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">已使用空間</span>
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
                {storageUsage.percentage}% 已使用
              </p>
            </div>

            <button
              onClick={handleClearAllData}
              disabled={clearingData}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="清除所有照片和 API 金鑰"
            >
              {clearingData ? '清除中...' : '清除所有照片與金鑰'}
            </button>
            
            <p className="text-xs text-gray-500">
              此操作會清除所有已上傳的照片和 API 設定，釋放本機儲存空間。
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          小提醒：若遇到 429（Too Many Requests），可改用非免費模型、降低請求次數，或稍後再試。
        </div>
      </div>
    </div>
  );
}
