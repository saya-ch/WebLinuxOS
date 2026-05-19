import React, { useState } from 'react';
import { Textarea, Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@weblinuxos/ui';
import { Database } from 'lucide-react';

interface TableData {
  id: number;
  name: string;
  email: string;
  role: string;
}

const mockData: TableData[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor' },
];

export const DatabaseClient = () => {
  const [query, setQuery] = useState('SELECT * FROM users');
  const [results, setResults] = useState<TableData[]>(mockData);
  const [message, setMessage] = useState('');

  const executeQuery = () => {
    setMessage('Query executed successfully');
    setResults(mockData);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900 text-zinc-100 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Database size={20} />
        <h2 className="text-lg font-semibold">Database Client</h2>
      </div>
      
      <Tabs defaultValue="query" className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="query">Query Editor</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
        </TabsList>
        
        <TabsContent value="query" className="flex-1 flex flex-col overflow-hidden mt-4 gap-4">
          <div className="flex-1 flex flex-col">
            <label className="text-xs text-zinc-400 mb-1">SQL Query</label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 resize-none font-mono text-sm"
            />
          </div>
          
          <div className="flex justify-end">
            <Button onClick={executeQuery}>Execute</Button>
          </div>
          
          {message && <div className="text-sm text-green-400">{message}</div>}
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800 sticky top-0">
                <tr>
                  <th className="text-left p-2 border border-zinc-700">id</th>
                  <th className="text-left p-2 border border-zinc-700">name</th>
                  <th className="text-left p-2 border border-zinc-700">email</th>
                  <th className="text-left p-2 border border-zinc-700">role</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-800">
                    <td className="p-2 border border-zinc-700">{row.id}</td>
                    <td className="p-2 border border-zinc-700">{row.name}</td>
                    <td className="p-2 border border-zinc-700">{row.email}</td>
                    <td className="p-2 border border-zinc-700">{row.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        
        <TabsContent value="tables" className="flex-1 overflow-auto mt-4">
          <div className="space-y-2">
            <div className="p-3 bg-zinc-800 rounded-md border border-zinc-700">
              <h3 className="font-medium">users</h3>
              <p className="text-xs text-zinc-400 mt-1">3 records</p>
            </div>
            <div className="p-3 bg-zinc-800 rounded-md border border-zinc-700">
              <h3 className="font-medium">posts</h3>
              <p className="text-xs text-zinc-400 mt-1">12 records</p>
            </div>
            <div className="p-3 bg-zinc-800 rounded-md border border-zinc-700">
              <h3 className="font-medium">comments</h3>
              <p className="text-xs text-zinc-400 mt-1">45 records</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const DatabaseClientMetadata = {
  id: 'database-client',
  name: 'Database Client',
  icon: 'Database',
  description: 'SQL database client for querying and managing data',
  category: 'Development',
};