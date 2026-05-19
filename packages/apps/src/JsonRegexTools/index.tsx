import React, { useState } from 'react';
import { Textarea, Tabs, TabsContent, TabsList, TabsTrigger, Button, Input } from '@weblinuxos/ui';

export const JsonRegexTools = () => {
  const [jsonInput, setJsonInput] = useState(`{
  "name": "WebLinuxOS",
  "version": "1.0.0",
  "features": ["code editor", "terminal", "file manager"]
}`);
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState('');
  
  const [regexPattern, setRegexPattern] = useState('');
  const [regexFlags, setRegexFlags] = useState('gi');
  const [testString, setTestString] = useState('Hello World! Hello again!');
  const [regexMatches, setRegexMatches] = useState<string[]>([]);

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, 2));
      setJsonError('');
    } catch (e) {
      setJsonError(`Invalid JSON: ${(e as Error).message}`);
      setJsonOutput('');
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed));
      setJsonError('');
    } catch (e) {
      setJsonError(`Invalid JSON: ${(e as Error).message}`);
      setJsonOutput('');
    }
  };

  const testRegex = () => {
    try {
      const regex = new RegExp(regexPattern, regexFlags);
      const matches = [...testString.matchAll(regex)].map(m => m[0]);
      setRegexMatches(matches);
    } catch (e) {
      setRegexMatches([`Invalid regex: ${(e as Error).message}`]);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900 text-zinc-100">
      <Tabs defaultValue="json" className="flex-1 flex flex-col">
        <TabsList className="border-b border-zinc-700 px-2">
          <TabsTrigger value="json">JSON Tools</TabsTrigger>
          <TabsTrigger value="regex">Regex Tester</TabsTrigger>
        </TabsList>
        
        <TabsContent value="json" className="flex-1 flex flex-col overflow-hidden p-4">
          <div className="flex gap-2 mb-4">
            <Button onClick={formatJson}>Format</Button>
            <Button onClick={minifyJson} variant="secondary">Minify</Button>
          </div>
          {jsonError && <div className="text-red-400 mb-2">{jsonError}</div>}
          <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
            <div className="flex flex-col">
              <label className="text-xs text-zinc-400 mb-1">Input</label>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="flex-1 resize-none font-mono text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-zinc-400 mb-1">Output</label>
              <Textarea
                value={jsonOutput}
                readOnly
                className="flex-1 resize-none font-mono text-sm bg-zinc-800"
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="regex" className="flex-1 flex flex-col overflow-hidden p-4">
          <div className="flex gap-2 mb-4 items-end">
            <div className="flex-1">
              <label className="text-xs text-zinc-400 mb-1 block">Pattern</label>
              <Input
                value={regexPattern}
                onChange={(e) => setRegexPattern(e.target.value)}
                placeholder="Enter regex pattern"
              />
            </div>
            <div className="w-24">
              <label className="text-xs text-zinc-400 mb-1 block">Flags</label>
              <Input
                value={regexFlags}
                onChange={(e) => setRegexFlags(e.target.value)}
                placeholder="gi"
              />
            </div>
            <Button onClick={testRegex}>Test</Button>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
            <div className="flex flex-col">
              <label className="text-xs text-zinc-400 mb-1">Test String</label>
              <Textarea
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                className="flex-1 resize-none"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-zinc-400 mb-1">Matches ({regexMatches.length})</label>
              <div className="flex-1 bg-zinc-800 rounded-md p-4 overflow-auto">
                {regexMatches.length === 0 ? (
                  <span className="text-zinc-500">No matches</span>
                ) : (
                  <ul className="space-y-1">
                    {regexMatches.map((match, i) => (
                      <li key={i} className="text-green-400 font-mono">
                        "{match}"
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const JsonRegexToolsMetadata = {
  id: 'json-regex-tools',
  name: 'JSON/Regex Tools',
  icon: 'Wrench',
  description: 'Format JSON, validate, and test regular expressions',
  category: 'Development',
};