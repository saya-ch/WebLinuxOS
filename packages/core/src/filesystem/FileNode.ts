export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  content?: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
  permissions: string;
  owner: string;
  size: number;
}

export interface FileSystemState {
  nodes: Map<string, FileNode>;
  currentPath: string;
}

export const ROOT_ID = 'root';
