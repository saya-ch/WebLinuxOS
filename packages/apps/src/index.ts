import { registerApp } from '@weblinuxos/core';

// Import all apps
import { CodeEditor, CodeEditorMetadata } from './CodeEditor';
import { Terminal, TerminalMetadata } from './Terminal';
import { FileManager, FileManagerMetadata } from './FileManager';
import { MarkdownEditor, MarkdownEditorMetadata } from './MarkdownEditor';
import { JsonRegexTools, JsonRegexToolsMetadata } from './JsonRegexTools';
import { ApiTester, ApiTesterMetadata } from './ApiTester';
import { BrowserPreview, BrowserPreviewMetadata } from './BrowserPreview';
import { GitVisualizer, GitVisualizerMetadata } from './GitVisualizer';
import { DatabaseClient, DatabaseClientMetadata } from './DatabaseClient';

// Export all apps for use in window manager
export const apps = {
  'code-editor': CodeEditor,
  'terminal': Terminal,
  'file-manager': FileManager,
  'markdown-editor': MarkdownEditor,
  'json-regex-tools': JsonRegexTools,
  'api-tester': ApiTester,
  'browser-preview': BrowserPreview,
  'git-visualizer': GitVisualizer,
  'database-client': DatabaseClient,
};

export {
  CodeEditorMetadata,
  TerminalMetadata,
  FileManagerMetadata,
  MarkdownEditorMetadata,
  JsonRegexToolsMetadata,
  ApiTesterMetadata,
  BrowserPreviewMetadata,
  GitVisualizerMetadata,
  DatabaseClientMetadata,
};

// Function to register all apps
export const registerApps = () => {
  registerApp(CodeEditorMetadata);
  registerApp(TerminalMetadata);
  registerApp(FileManagerMetadata);
  registerApp(MarkdownEditorMetadata);
  registerApp(JsonRegexToolsMetadata);
  registerApp(ApiTesterMetadata);
  registerApp(BrowserPreviewMetadata);
  registerApp(GitVisualizerMetadata);
  registerApp(DatabaseClientMetadata);
};
