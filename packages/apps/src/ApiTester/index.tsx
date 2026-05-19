import React, { useState } from 'react';
import { Input, Button, Textarea, Tabs, TabsContent, TabsList, TabsTrigger } from '@weblinuxos/ui';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export const ApiTester = () => {
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
  const [headers, setHeaders] = useState('{}');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const sendRequest = async () => {
    setLoading(true);
    setResponse('');
    setStatus('');
    
    try {
      const parsedHeaders = JSON.parse(headers);
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...parsedHeaders,
        },
        body: method !== 'GET' && method !== 'DELETE' ? body : undefined,
      });
      
      setStatus(`Status: ${response.status} ${response.statusText}`);
      const data = await response.text();
      
      try {
        const json = JSON.parse(data);
        setResponse(JSON.stringify(json, null, 2));
      } catch {
        setResponse(data);
      }
    } catch (error) {
      setResponse(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900 text-zinc-100 p-4">
      <div className="flex gap-2 mb-4">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as HttpMethod)}
          className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL"
          className="flex-1"
        />
        <Button onClick={sendRequest} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </div>
      
      {status && <div className="mb-2 text-sm text-zinc-400">{status}</div>}
      
      <Tabs defaultValue="body" className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="response">Response</TabsTrigger>
        </TabsList>
        <TabsContent value="body" className="flex-1 overflow-hidden mt-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder='{"key": "value"}'
            className="h-full resize-none font-mono text-sm"
          />
        </TabsContent>
        <TabsContent value="headers" className="flex-1 overflow-hidden mt-2">
          <Textarea
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
            placeholder='{"Authorization": "Bearer token"}'
            className="h-full resize-none font-mono text-sm"
          />
        </TabsContent>
        <TabsContent value="response" className="flex-1 overflow-hidden mt-2">
          <Textarea
            value={response}
            readOnly
            className="h-full resize-none font-mono text-sm bg-zinc-800"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const ApiTesterMetadata = {
  id: 'api-tester',
  name: 'API Tester',
  icon: 'Send',
  description: 'Test HTTP requests and APIs',
  category: 'Development',
};