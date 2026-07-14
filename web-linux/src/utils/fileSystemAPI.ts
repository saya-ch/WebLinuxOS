/**
 * 真实文件系统访问工具
 * 支持File System Access API实现本地文件读写
 */

export interface FileMetadata {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: Date;
  isDirectory: boolean;
}

export interface FileOperationResult {
  success: boolean;
  data?: string | ArrayBuffer | FileMetadata | FileMetadata[];
  error?: string;
}

/**
 * 文件系统管理器类
 * 提供真实的文件系统访问能力
 */
export class RealFileSystem {
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private fileHandles: Map<string, FileSystemFileHandle> = new Map();
  private supportedMimeTypes: Set<string> = new Set([
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'application/json',
    'text/markdown',
    'text/csv',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
    'application/pdf'
  ]);

  /**
   * 检查浏览器是否支持File System Access API
   */
  static isSupported(): boolean {
    return 'showDirectoryPicker' in window && 'showOpenFilePicker' in window;
  }

  /**
   * 请求目录访问权限
   */
  async requestDirectory(): Promise<boolean> {
    if (!RealFileSystem.isSupported()) {
      console.warn('File System Access API not supported');
      return false;
    }

    try {
      this.directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      return true;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('用户取消了目录选择');
      } else {
        console.error('目录访问被拒绝:', error);
      }
      return false;
    }
  }

  /**
   * 打开单个文件
   */
  async openFile(options?: {
    multiple?: boolean;
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }): Promise<FileOperationResult> {
    if (!RealFileSystem.isSupported()) {
      return { success: false, error: 'File System Access API not supported' };
    }

    try {
      const filePickerOptions = {
        multiple: options?.multiple ?? false,
        types: options?.types ?? [
          {
            description: '文本文件',
            accept: {
              'text/plain': ['.txt', '.md', '.json', '.js', '.ts', '.jsx', '.tsx', '.css', '.html'],
            },
          },
        ],
      };

      const handles = await (window as any).showOpenFilePicker(filePickerOptions);
      
      if (options?.multiple) {
        const files: FileMetadata[] = [];
        for (const handle of handles) {
          const file = await handle.getFile();
          files.push({
            name: file.name,
            path: handle.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified),
            isDirectory: false
          });
          this.fileHandles.set(handle.name, handle);
        }
        return { success: true, data: files };
      } else {
        const handle = handles[0];
        const file = await handle.getFile();
        this.fileHandles.set(handle.name, handle);
        return {
          success: true,
          data: {
            name: file.name,
            path: handle.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified),
            isDirectory: false
          }
        };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 读取文件内容
   */
  async readFile(handleOrName: FileSystemFileHandle | string): Promise<FileOperationResult> {
    try {
      const handle = typeof handleOrName === 'string' 
        ? this.fileHandles.get(handleOrName) 
        : handleOrName;
      
      if (!handle) {
        return { success: false, error: 'File handle not found' };
      }

      const file = await handle.getFile();
      const isText = this.isTextFile(file.type) || this.isTextFileName(file.name);
      
      const content = isText 
        ? await file.text() 
        : await file.arrayBuffer();

      return { success: true, data: content };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 保存文件
   */
  async saveFile(
    content: string | ArrayBuffer | Blob,
    options?: {
      suggestedName?: string;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }
  ): Promise<FileOperationResult> {
    if (!RealFileSystem.isSupported()) {
      // 降级方案：使用传统下载方式
      return this.downloadFile(content, options?.suggestedName || 'untitled.txt');
    }

    try {
      const saveOptions = {
        suggestedName: options?.suggestedName || 'untitled.txt',
        types: options?.types ?? [
          {
            description: '文本文件',
            accept: {
              'text/plain': ['.txt'],
            },
          },
        ],
      };

      const handle = await (window as any).showSaveFilePicker(saveOptions);
      const writable = await handle.createWritable();
      
      const blob = content instanceof Blob 
        ? content 
        : typeof content === 'string' 
          ? new Blob([content], { type: 'text/plain' })
          : new Blob([content]);

      await writable.write(blob);
      await writable.close();

      this.fileHandles.set(handle.name, handle);

      return {
        success: true,
        data: {
          name: handle.name,
          path: handle.name,
          size: blob.size,
          type: blob.type,
          lastModified: new Date(),
          isDirectory: false
        }
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, error: '用户取消了保存操作' };
      }
      // 如果File System API失败，使用降级方案
      return this.downloadFile(content, options?.suggestedName || 'untitled.txt');
    }
  }

  /**
   * 下载文件（降级方案）
   */
  private downloadFile(content: string | ArrayBuffer | Blob, filename: string): FileOperationResult {
    try {
      const blob = content instanceof Blob
        ? content
        : typeof content === 'string'
          ? new Blob([content], { type: 'text/plain' })
          : new Blob([content]);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 列出目录内容
   */
  async listDirectory(): Promise<FileOperationResult> {
    if (!this.directoryHandle) {
      return { success: false, error: 'No directory selected' };
    }

    try {
      const entries: FileMetadata[] = [];
      
      for await (const entry of (this.directoryHandle as any).values()) {
        entries.push({
          name: entry.name,
          path: entry.name,
          size: 0,
          type: entry.kind === 'directory' ? 'directory' : 'file',
          lastModified: new Date(),
          isDirectory: entry.kind === 'directory'
        });
      }

      return { success: true, data: entries };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 创建新文件
   */
  async createFile(
    name: string,
    content: string | ArrayBuffer = ''
  ): Promise<FileOperationResult> {
    if (!this.directoryHandle) {
      return { success: false, error: 'No directory selected' };
    }

    try {
      const fileHandle = await this.directoryHandle.getFileHandle(name, { create: true });
      const writable = await fileHandle.createWritable();
      
      const blob = typeof content === 'string'
        ? new Blob([content], { type: 'text/plain' })
        : new Blob([content]);

      await writable.write(blob);
      await writable.close();

      this.fileHandles.set(name, fileHandle);

      return {
        success: true,
        data: {
          name,
          path: name,
          size: blob.size,
          type: 'file',
          lastModified: new Date(),
          isDirectory: false
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 判断是否为文本文件（根据MIME类型）
   */
  private isTextFile(mimeType: string): boolean {
    return mimeType.startsWith('text/') || 
           mimeType === 'application/json' ||
           mimeType === 'application/javascript' ||
           this.supportedMimeTypes.has(mimeType);
  }

  /**
   * 判断是否为文本文件（根据文件名）
   */
  private isTextFileName(filename: string): boolean {
    const textExtensions = [
      '.txt', '.md', '.json', '.js', '.ts', '.jsx', '.tsx',
      '.css', '.html', '.xml', '.yml', '.yaml', '.csv',
      '.py', '.rb', '.java', '.c', '.cpp', '.h', '.hpp',
      '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat',
      '.conf', '.ini', '.cfg', '.env', '.gitignore', '.dockerignore'
    ];
    
    return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.directoryHandle = null;
    this.fileHandles.clear();
  }
}

// 单例实例
export const realFileSystem = new RealFileSystem();

// 扩展Window接口声明
declare global {
  interface Window {
    showDirectoryPicker?: (options?: { mode?: string }) => Promise<FileSystemDirectoryHandle>;
    showOpenFilePicker?: (options?: {
      multiple?: boolean;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle>;
  }
}