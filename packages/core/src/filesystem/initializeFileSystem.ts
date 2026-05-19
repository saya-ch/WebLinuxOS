import { db, pathToId } from './FileSystem';
import { FileNode, ROOT_ID } from './FileNode';

export const initializeFileSystem = async (): Promise<void> => {
  const now = Date.now();

  const rootExists = await db.files.get(ROOT_ID);
  if (rootExists) {
    return;
  }

  const initialNodes: FileNode[] = [
    {
      id: ROOT_ID,
      name: '/',
      type: 'directory',
      parentId: null,
      createdAt: now,
      updatedAt: now,
      permissions: 'rwxr-xr-x',
      owner: 'root',
      size: 0,
    },
    {
      id: 'home',
      name: 'home',
      type: 'directory',
      parentId: ROOT_ID,
      createdAt: now,
      updatedAt: now,
      permissions: 'rwxr-xr-x',
      owner: 'root',
      size: 0,
    },
    {
      id: 'home_user',
      name: 'user',
      type: 'directory',
      parentId: 'home',
      createdAt: now,
      updatedAt: now,
      permissions: 'rwxr-xr-x',
      owner: 'user',
      size: 0,
    },
    {
      id: 'home_user_projects',
      name: 'projects',
      type: 'directory',
      parentId: 'home_user',
      createdAt: now,
      updatedAt: now,
      permissions: 'rwxr-xr-x',
      owner: 'user',
      size: 0,
    },
    {
      id: 'home_user_documents',
      name: 'documents',
      type: 'directory',
      parentId: 'home_user',
      createdAt: now,
      updatedAt: now,
      permissions: 'rwxr-xr-x',
      owner: 'user',
      size: 0,
    },
    {
      id: 'home_user_notes',
      name: 'notes',
      type: 'directory',
      parentId: 'home_user',
      createdAt: now,
      updatedAt: now,
      permissions: 'rwxr-xr-x',
      owner: 'user',
      size: 0,
    },
    {
      id: 'tmp',
      name: 'tmp',
      type: 'directory',
      parentId: ROOT_ID,
      createdAt: now,
      updatedAt: now,
      permissions: 'rwxrwxrwx',
      owner: 'root',
      size: 0,
    },
    {
      id: 'usr',
      name: 'usr',
      type: 'directory',
      parentId: ROOT_ID,
      createdAt: now,
      updatedAt: now,
      permissions: 'rwxr-xr-x',
      owner: 'root',
      size: 0,
    },
    {
      id: 'usr_local',
      name: 'local',
      type: 'directory',
      parentId: 'usr',
      createdAt: now,
      updatedAt: now,
      permissions: 'rwxr-xr-x',
      owner: 'root',
      size: 0,
    },
    {
      id: 'home_user_README_md',
      name: 'README.md',
      type: 'file',
      content: '# Welcome to WebLinuxOS\n\nThis is a web-based Linux-like operating system.\n\n## Features\n\n- File system\n- Terminal emulator\n- Window manager\n- And more!\n',
      parentId: 'home_user',
      createdAt: now,
      updatedAt: now,
      permissions: 'rw-r--r--',
      owner: 'user',
      size: 0,
    },
    {
      id: 'home_user_projects_hello_world_js',
      name: 'hello-world.js',
      type: 'file',
      content: 'console.log("Hello, WebLinuxOS!");\n',
      parentId: 'home_user_projects',
      createdAt: now,
      updatedAt: now,
      permissions: 'rw-r--r--',
      owner: 'user',
      size: 0,
    },
  ];

  for (const node of initialNodes) {
    if (node.type === 'file') {
      node.size = (node.content || '').length;
    }
  }

  await db.files.bulkPut(initialNodes);
};
