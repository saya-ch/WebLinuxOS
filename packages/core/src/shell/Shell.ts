import { db, pathToId, getParentPath, joinPath, normalizePath } from '../filesystem/FileSystem';
import { FileNode, ROOT_ID } from '../filesystem/FileNode';

export interface ShellOutput {
  type: 'output' | 'error' | 'info';
  content: string;
}

export interface ShellState {
  currentPath: string;
  history: string[];
  historyIndex: number;
}

export class Shell {
  private state: ShellState;

  constructor() {
    this.state = {
      currentPath: '/home/user',
      history: [],
      historyIndex: -1,
    };
  }

  getCurrentPath(): string {
    return this.state.currentPath;
  }

  addToHistory(command: string): void {
    this.state.history.push(command);
    this.state.historyIndex = this.state.history.length;
  }

  getPreviousHistory(): string | null {
    if (this.state.historyIndex > 0) {
      this.state.historyIndex--;
      return this.state.history[this.state.historyIndex];
    }
    return null;
  }

  getNextHistory(): string | null {
    if (this.state.historyIndex < this.state.history.length - 1) {
      this.state.historyIndex++;
      return this.state.history[this.state.historyIndex];
    }
    this.state.historyIndex = this.state.history.length;
    return null;
  }

  async executeCommand(input: string): Promise<ShellOutput[]> {
    const outputs: ShellOutput[] = [];
    const trimmed = input.trim();
    
    if (!trimmed) {
      return outputs;
    }

    this.addToHistory(trimmed);
    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      switch (command) {
        case 'pwd':
          outputs.push(...await this.cmdPwd());
          break;
        case 'ls':
          outputs.push(...await this.cmdLs(args));
          break;
        case 'cd':
          outputs.push(...await this.cmdCd(args));
          break;
        case 'mkdir':
          outputs.push(...await this.cmdMkdir(args));
          break;
        case 'echo':
          outputs.push(...await this.cmdEcho(args));
          break;
        case 'cat':
          outputs.push(...await this.cmdCat(args));
          break;
        case 'touch':
          outputs.push(...await this.cmdTouch(args));
          break;
        case 'rm':
          outputs.push(...await this.cmdRm(args));
          break;
        case 'clear':
          outputs.push({ type: 'info', content: '__CLEAR__' });
          break;
        case 'help':
          outputs.push(...this.cmdHelp());
          break;
        case 'whoami':
          outputs.push({ type: 'output', content: 'user' });
          break;
        case 'date':
          outputs.push({ type: 'output', content: new Date().toString() });
          break;
        default:
          outputs.push({ type: 'error', content: `Command not found: ${command}` });
      }
    } catch (error) {
      outputs.push({ type: 'error', content: String(error) });
    }

    return outputs;
  }

  private async cmdPwd(): Promise<ShellOutput[]> {
    return [{ type: 'output', content: this.state.currentPath }];
  }

  private async cmdLs(args: string[]): Promise<ShellOutput[]> {
    const targetPath = args.length > 0 ? normalizePath(joinPath(this.state.currentPath, args[0])) : this.state.currentPath;
    const targetId = pathToId(targetPath);
    
    const targetNode = await db.files.get(targetId);
    if (!targetNode) {
      return [{ type: 'error', content: `ls: cannot access '${args[0]}': No such file or directory` }];
    }

    if (targetNode.type === 'file') {
      return [{ type: 'output', content: targetNode.name }];
    }

    const children = await db.files.where('parentId').equals(targetId).toArray();
    const sorted = children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al');
    const longFormat = args.includes('-l') || args.includes('-la') || args.includes('-al');

    let output = '';
    if (longFormat) {
      for (const node of sorted) {
        if (!showHidden && node.name.startsWith('.')) continue;
        const type = node.type === 'directory' ? 'd' : '-';
        const date = new Date(node.updatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        output += `${type}${node.permissions} 1 ${node.owner} ${node.owner} ${node.size.toString().padStart(8)} ${date} ${node.name}\n`;
      }
    } else {
      const names = sorted
        .filter((node) => showHidden || !node.name.startsWith('.'))
        .map((node) => node.type === 'directory' ? `\x1b[34m${node.name}\x1b[0m` : node.name);
      output = names.join('  ');
    }

    return output ? [{ type: 'output', content: output }] : [];
  }

  private async cmdCd(args: string[]): Promise<ShellOutput[]> {
    const targetPath = args.length === 0 ? '/home/user' : normalizePath(joinPath(this.state.currentPath, args[0]));
    const targetId = pathToId(targetPath);
    
    const targetNode = await db.files.get(targetId);
    if (!targetNode) {
      return [{ type: 'error', content: `cd: ${args[0]}: No such file or directory` }];
    }
    if (targetNode.type !== 'directory') {
      return [{ type: 'error', content: `cd: ${args[0]}: Not a directory` }];
    }

    this.state.currentPath = targetPath;
    return [];
  }

  private async cmdMkdir(args: string[]): Promise<ShellOutput[]> {
    if (args.length === 0) {
      return [{ type: 'error', content: 'mkdir: missing operand' }];
    }

    const outputs: ShellOutput[] = [];
    for (const path of args) {
      const targetPath = normalizePath(joinPath(this.state.currentPath, path));
      const targetId = pathToId(targetPath);
      
      const exists = await db.files.get(targetId);
      if (exists) {
        outputs.push({ type: 'error', content: `mkdir: cannot create directory '${path}': File exists` });
        continue;
      }

      const parentPath = getParentPath(targetPath);
      const parentId = pathToId(parentPath);
      const name = targetPath.split('/').filter(Boolean).pop() || '';
      const now = Date.now();

      const node: FileNode = {
        id: targetId,
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
    }

    return outputs;
  }

  private async cmdEcho(args: string[]): Promise<ShellOutput[]> {
    return [{ type: 'output', content: args.join(' ') }];
  }

  private async cmdCat(args: string[]): Promise<ShellOutput[]> {
    if (args.length === 0) {
      return [{ type: 'error', content: 'cat: missing operand' }];
    }

    const outputs: ShellOutput[] = [];
    for (const path of args) {
      const targetPath = normalizePath(joinPath(this.state.currentPath, path));
      const targetId = pathToId(targetPath);
      
      const node = await db.files.get(targetId);
      if (!node) {
        outputs.push({ type: 'error', content: `cat: ${path}: No such file or directory` });
        continue;
      }
      if (node.type === 'directory') {
        outputs.push({ type: 'error', content: `cat: ${path}: Is a directory` });
        continue;
      }

      outputs.push({ type: 'output', content: node.content || '' });
    }

    return outputs;
  }

  private async cmdTouch(args: string[]): Promise<ShellOutput[]> {
    if (args.length === 0) {
      return [{ type: 'error', content: 'touch: missing operand' }];
    }

    const outputs: ShellOutput[] = [];
    for (const path of args) {
      const targetPath = normalizePath(joinPath(this.state.currentPath, path));
      const targetId = pathToId(targetPath);
      
      const existing = await db.files.get(targetId);
      if (existing) {
        await db.files.put({ ...existing, updatedAt: Date.now() });
        continue;
      }

      const parentPath = getParentPath(targetPath);
      const parentId = pathToId(parentPath);
      const name = targetPath.split('/').filter(Boolean).pop() || '';
      const now = Date.now();

      const node: FileNode = {
        id: targetId,
        name,
        type: 'file',
        content: '',
        parentId,
        createdAt: now,
        updatedAt: now,
        permissions: 'rw-r--r--',
        owner: 'user',
        size: 0,
      };

      await db.files.put(node);
    }

    return outputs;
  }

  private async cmdRm(args: string[]): Promise<ShellOutput[]> {
    if (args.length === 0) {
      return [{ type: 'error', content: 'rm: missing operand' }];
    }

    const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr');
    const paths = args.filter((a) => !a.startsWith('-'));
    const outputs: ShellOutput[] = [];

    for (const path of paths) {
      const targetPath = normalizePath(joinPath(this.state.currentPath, path));
      const targetId = pathToId(targetPath);
      
      const node = await db.files.get(targetId);
      if (!node) {
        outputs.push({ type: 'error', content: `rm: ${path}: No such file or directory` });
        continue;
      }

      if (node.type === 'directory' && !recursive) {
        outputs.push({ type: 'error', content: `rm: cannot remove '${path}': Is a directory` });
        continue;
      }

      const deleteRecursive = async (nodeId: string) => {
        const children = await db.files.where('parentId').equals(nodeId).toArray();
        for (const child of children) {
          await deleteRecursive(child.id);
        }
        await db.files.delete(nodeId);
      };

      await deleteRecursive(targetId);
    }

    return outputs;
  }

  private cmdHelp(): ShellOutput[] {
    const helpText = `
Available commands:
  pwd     Print working directory
  ls      List directory contents
  cd      Change directory
  mkdir   Create directories
  touch   Create files or update timestamps
  cat     Concatenate and print files
  echo    Display a line of text
  rm      Remove files or directories
  clear   Clear the terminal
  whoami  Print current user
  date    Print current date and time
  help    Show this help information
`;
    return [{ type: 'output', content: helpText.trim() }];
  }
}
