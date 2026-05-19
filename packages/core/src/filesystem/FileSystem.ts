import Dexie, { Table } from 'dexie';
import { FileNode, ROOT_ID } from './FileNode';

export class FileSystemDB extends Dexie {
  files!: Table<FileNode>;

  constructor() {
    super('WebLinuxOSFileSystem');
    this.version(1).stores({
      files: 'id, name, type, parentId',
    });
  }
}

export const db = new FileSystemDB();

export const pathToId = (path: string): string => {
  if (path === '/') return ROOT_ID;
  return path.replace(/\//g, '_').slice(1);
};

export const idToPath = (id: string): string => {
  if (id === ROOT_ID) return '/';
  return '/' + id.replace(/_/g, '/');
};

export const getParentPath = (path: string): string => {
  if (path === '/') return '/';
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return parts.length === 0 ? '/' : '/' + parts.join('/');
};

export const joinPath = (...paths: string[]): string => {
  return '/' + paths.map((p) => p.replace(/^\/|\/$/g, '')).filter(Boolean).join('/');
};

export const normalizePath = (path: string): string => {
  const parts = path.split('/').filter(Boolean);
  const result: string[] = [];
  for (const part of parts) {
    if (part === '..') {
      result.pop();
    } else if (part !== '.') {
      result.push(part);
    }
  }
  return result.length === 0 ? '/' : '/' + result.join('/');
};
