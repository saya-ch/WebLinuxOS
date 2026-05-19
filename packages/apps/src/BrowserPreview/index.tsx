import React, { useState } from 'react';
import { Input, Button } from '@weblinuxos/ui';
import { RefreshCw } from 'lucide-react';

export const BrowserPreview = () => {
  const [url, setUrl] = useState('https://example.com');
  const [currentUrl, setCurrentUrl] = useState(url);

  const navigate = () => {
    setCurrentUrl(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      navigate();
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700 bg-zinc-800">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter URL"
          className="flex-1"
        />
        <Button onClick={navigate} size="sm">
          Go
        </Button>
        <Button onClick={() => setCurrentUrl(url)} size="sm" variant="secondary">
          <RefreshCw size={16} />
        </Button>
      </div>
      <div className="flex-1 bg-white">
        <iframe
          src={currentUrl}
          className="w-full h-full border-0"
          title="Browser Preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </div>
  );
};

export const BrowserPreviewMetadata = {
  id: 'browser-preview',
  name: 'Browser Preview',
  icon: 'Globe',
  description: 'Preview web pages in a sandboxed browser',
  category: 'Internet',
};