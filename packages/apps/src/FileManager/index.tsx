import React, { useState } from 'react';
import { Tree, TreeItem, Button } from '@weblinuxos/ui';
import { Folder, File, Plus, Trash2 } from 'lucide-react';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

const initialFiles: FileNode[] = [
  {
    id: '1',
    name: 'home',
    type: 'folder',
    children: [
      { id: '2', name: 'Documents', type: 'folder', children: [
        { id: '3', name: 'readme.md', type: 'file' },
        { id: '4', name: 'notes.txt', type: 'file' }
      ]},
      { id: '5', name: 'Downloads', type: 'folder' },
      { id: '6', name: 'Pictures', type: 'folder' },
      { id: '7', name: 'Projects', type: 'folder', children: [
        { id: '8', name: 'web-app', type: 'folder', children: [
          { id: '9', name: 'index.html', type: 'file' },
          { id: '10', name: 'style.css', type: 'file' }
        ]}
      ]}
    ]
  }
];

const buildTreeItems = (nodes: FileNode[]): TreeItem[] => {
  return nodes.map(node => ({
    id: node.id,
    label: node.name,
    icon: node.type === 'folder' ? <Folder size={16} /> : <File size={16} />,
    children: node.children ? buildTreeItems(node.children) : undefined,
  }));
};

export const FileManager = () => {
  const [files, setFiles] = useState<FileNode[]>(initialFiles);
  const [selectedId, setSelectedId] = useState<string>('1');

  return (
    <div className="h-full flex flex-col bg-zinc-900 text-zinc-100">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 bg-zinc-800">
        <span className="text-sm font-medium">File Manager</span>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary">
            <Plus size={16} className="mr-1" /> New
          </Button>
          <Button size="sm" variant="secondary">
            <Trash2 size={16} className="mr-1" /> Delete
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <Tree
          items={buildTreeItems(files)}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  );
};

export const FileManagerMetadata = {
  id: 'file-manager',
  name: 'File Manager',
  icon: 'Folder',
  description: 'Manage files and folders in WebLinuxOS',
  category: 'System',
};