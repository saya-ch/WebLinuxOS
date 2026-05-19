import { useState, useEffect, useCallback } from 'react';
import { db, pathToId, idToPath, getParentPath, joinPath, normalizePath } from './FileSystem';
import { FileNode, ROOT_ID } from './FileNode';

export const useFileSystem = () => {
  const [currentPath, setCurrentPath] = useState('/');
  const [nodes, setNodes] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshNodes = useCallback(async () => {
    const currentId = pathToId(currentPath);
    const children = await db.files.where('parentId').equals(currentId).toArray();
    setNodes(children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    }));
    setLoading(false);
  }, [currentPath]);

  useEffect(() => {
    refreshNodes();
  }, [refreshNodes]);

  const getNode = useCallback(async (path: string): Promise<FileNode | undefined> => {
    const id = pathToId(path);
    return await db.files.get(id);
  }, []);

  const getChildren = useCallback(async (path: string): Promise<FileNode[]> => {
    const id = pathToId(path);
    const children = await db.files.where('parentId').equals(id).toArray();
    return children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, []);

  const createDirectory = useCallback(async (path: string): Promise<void> => {
    const normalized = normalizePath(path);
    const id = pathToId(normalized);
    const parentPath = getParentPath(normalized);
    const parentId = pathToId(parentPath);
    const name = normalized.split('/').filter(Boolean).pop() || '';

    const now = Date.now();
    const node: FileNode = {
      id,
      name,
      type: 'directory',
      parentId,
      createdAt: now,
      updatedAt: now,
      permissions: 'rwxr-xr-x',
      owner: 'user',
      size: 0,
    };

    await db.files.put(node);
    if (normalizePath(currentPath) === parentPath) {
      await refreshNodes();
    }
  }, [currentPath, refreshNodes]);

  const createFile = useCallback(async (path: string, content: string = ''): Promise<void> => {
    const normalized = normalizePath(path);
    const id = pathToId(normalized);
    const parentPath = getParentPath(normalized);
    const parentId = pathToId(parentPath);
    const name = normalized.split('/').filter(Boolean).pop() || '';

    const now = Date.now();
    const node: FileNode = {
      id,
      name,
      type: 'file',
      content,
      parentId,
      createdAt: now,
      updatedAt: now,
      permissions: 'rw-r--r--',
      owner: 'user',
      size: content.length,
    };

    await db.files.put(node);
    if (normalizePath(currentPath) === parentPath) {
      await refreshNodes();
    }
  }, [currentPath, refreshNodes]);

  const writeFile = useCallback(async (path: string, content: string): Promise<void> => {
    const normalized = normalizePath(path);
    const id = pathToId(normalized);
    const node = await db.files.get(id);
    if (node && node.type === 'file') {
      await db.files.put({
        ...node,
        content,
        updatedAt: Date.now(),
        size: content.length,
      });
    }
  }, []);

  const readFile = useCallback(async (path: string): Promise<string | undefined> => {
    const normalized = normalizePath(path);
    const id = pathToId(normalized);
    const node = await db.files.get(id);
    return node?.content;
  }, []);

  const deleteNode = useCallback(async (path: string): Promise<void> => {
    const normalized = normalizePath(path);
    const id = pathToId(normalized);
    
    const deleteRecursive = async (nodeId: string) => {
      const children = await db.files.where('parentId').equals(nodeId).toArray();
      for (const child of children) {
        await deleteRecursive(child.id);
      }
      await db.files.delete(nodeId);
    };

    await deleteRecursive(id);
    await refreshNodes();
  }, [refreshNodes]);

  const changeDirectory = useCallback((path: string) => {
    const normalized = normalizePath(joinPath(currentPath, path));
    setCurrentPath(normalized);
  }, [currentPath]);

  const pathExists = useCallback(async (path: string): Promise<boolean> => {
    const normalized = normalizePath(path);
    const id = pathToId(normalized);
    const node = await db.files.get(id);
    return node !== undefined;
  }, []);

  return {
    currentPath,
    nodes,
    loading,
    changeDirectory,
    getNode,
    getChildren,
    createDirectory,
    createFile,
    writeFile,
    readFile,
    deleteNode,
    pathExists,
    refreshNodes,
  };
};
