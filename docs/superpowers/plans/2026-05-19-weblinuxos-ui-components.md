# WebLinuxOS UI 组件库实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**目标：** 创建共享 UI 组件库，包含 20+ 可复用组件

**架构：** 原子化设计，从 Button、Input 等基础组件到 Modal、Tree 等复杂组件

**技术栈：** React 18 + TypeScript + Tailwind CSS + CSS Variables

---

## 1. 项目结构

```
packages/ui/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                       # 统一导出
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Tabs/
│   │   ├── Tree/
│   │   ├── Dropdown/
│   │   ├── ContextMenu/
│   │   ├── Tooltip/
│   │   ├── Toast/
│   │   ├── SplitPane/
│   │   ├── Icon/
│   │   ├── Card/
│   │   ├── Badge/
│   │   ├── Select/
│   │   ├── Checkbox/
│   │   ├── Radio/
│   │   ├── Switch/
│   │   ├── Slider/
│   │   ├── Progress/
│   │   └── Spinner/
│   ├── styles/
│   │   └── globals.css               # CSS 变量和全局样式
│   └── types/
│       └── index.ts                  # 共享类型定义
```

---

## 2. 基础设置

### Task 0.1: 创建 packages/ui 项目配置

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "@weblinuxos/ui",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'WebLinuxOSUI',
      formats: ['es'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'lucide-react'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
```

---

## 3. 全局样式

### Task 0.2: 创建全局样式和 CSS 变量

**Files:**
- Create: `packages/ui/src/styles/globals.css`

- [ ] **Step 1: 创建 globals.css**

```css
:root {
  /* Background Colors */
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --bg-tertiary: #2d2d2d;
  --bg-hover: #3c3c3c;
  --bg-active: #094771;

  /* Accent Colors */
  --accent-primary: #007acc;
  --accent-secondary: #3794ff;
  --accent-tertiary: #4da6ff;

  /* Text Colors */
  --text-primary: #cccccc;
  --text-secondary: #858585;
  --text-disabled: #5a5a5a;
  --text-inverse: #ffffff;

  /* Border Colors */
  --border-color: #3c3c3c;
  --border-light: #454545;
  --border-focus: #007acc;

  /* Semantic Colors */
  --color-success: #4ec9b0;
  --color-warning: #dcdcaa;
  --color-error: #f14c4c;
  --color-info: #3794ff;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.5);

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-8: 48px;

  /* Border Radius */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;

  /* Font Sizes */
  --font-xs: 11px;
  --font-sm: 12px;
  --font-base: 13px;
  --font-lg: 14px;
  --font-xl: 16px;

  /* Line Heights */
  --leading-tight: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 350ms ease;

  /* Z-Index Scale */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
  --z-toast: 800;
}

/* Global Resets */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: var(--font-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: var(--leading-normal);
  overflow: hidden;
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: var(--radius-sm);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border-light);
}

/* Selection */
::selection {
  background-color: var(--accent-primary);
  color: var(--text-inverse);
}

/* Focus Ring */
:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}
```

---

## 4. Button 组件

### Task 1: 创建 Button 组件

**Files:**
- Create: `packages/ui/src/components/Button/Button.tsx`
- Create: `packages/ui/src/components/Button/index.ts`

- [ ] **Step 1: 创建 Button.tsx**

```tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium rounded transition-all duration-150
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: `
      bg-[var(--accent-primary)] text-white
      hover:bg-[var(--accent-secondary)]
      focus-visible:ring-[var(--accent-primary)]
    `,
    secondary: `
      bg-[var(--bg-tertiary)] text-[var(--text-primary)]
      border border-[var(--border-color)]
      hover:bg-[var(--bg-hover)] hover:border-[var(--border-light)]
      focus-visible:ring-[var(--border-color)]
    `,
    ghost: `
      bg-transparent text-[var(--text-primary)]
      hover:bg-[var(--bg-hover)]
      focus-visible:ring-[var(--border-color)]
    `,
    danger: `
      bg-[var(--color-error)] text-white
      hover:opacity-90
      focus-visible:ring-[var(--color-error)]
    `,
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="shrink-0">{icon}</span>
      )}
    </button>
  );
};

export default Button;
```

- [ ] **Step 2: 创建 index.ts**

```typescript
export { default as Button } from './Button';
export type { ButtonProps } from './Button';
```

---

## 5. Input 组件

### Task 2: 创建 Input 和 Textarea 组件

**Files:**
- Create: `packages/ui/src/components/Input/Input.tsx`
- Create: `packages/ui/src/components/Input/index.ts`
- Create: `packages/ui/src/components/Textarea/Textarea.tsx`
- Create: `packages/ui/src/components/Textarea/index.ts`

- [ ] **Step 1: 创建 Input.tsx**

```tsx
import React from 'react';
import { Search } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      variant = 'default',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseStyles = `
      w-full px-3 py-1.5 rounded
      text-[var(--text-primary)] text-sm
      placeholder:text-[var(--text-secondary)]
      border transition-colors duration-150
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variants = {
      default: `
        bg-[var(--bg-primary)]
        border-[var(--border-color)]
        focus:border-[var(--border-focus)] focus:ring-[var(--border-focus)]/30
      `,
      filled: `
        bg-[var(--bg-tertiary)]
        border-transparent
        focus:border-[var(--border-focus)] focus:ring-[var(--border-focus)]/30
      `,
    };

    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-[var(--text-secondary)]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              ${baseStyles}
              ${variants[variant]}
              ${leftIcon ? 'pl-9' : ''}
              ${rightIcon ? 'pr-9' : ''}
              ${error ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/30' : ''}
            `}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-[var(--text-secondary)]">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <span className="text-xs text-[var(--color-error)]">{error}</span>
        )}
        {hint && !error && (
          <span className="text-xs text-[var(--text-secondary)]">{hint}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
```

- [ ] **Step 2: 创建 Textarea.tsx**

```tsx
import React from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full px-3 py-2 rounded
            text-[var(--text-primary)] text-sm
            placeholder:text-[var(--text-secondary)]
            bg-[var(--bg-primary)]
            border border-[var(--border-color)]
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-offset-0
            focus:border-[var(--border-focus)] focus:ring-[var(--border-focus)]/30
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none
            ${error ? 'border-[var(--color-error)] focus:border-[var(--color-error)]' : ''}
          `}
          {...props}
        />
        {error && (
          <span className="text-xs text-[var(--color-error)]">{error}</span>
        )}
        {hint && !error && (
          <span className="text-xs text-[var(--text-secondary)]">{hint}</span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
```

---

## 6. Modal 组件

### Task 3: 创建 Modal 组件

**Files:**
- Create: `packages/ui/src/components/Modal/Modal.tsx`
- Create: `packages/ui/src/components/Modal/index.ts`

- [ ] **Step 1: 创建 Modal.tsx**

```tsx
import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  footer,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center p-4"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div className="fixed inset-0 bg-black/60" />
      <div
        className={`
          relative bg-[var(--bg-secondary)] rounded-lg shadow-lg
          flex flex-col
          ${sizes[size]}
          w-full max-h-[85vh]
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
            {title && (
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="
                  p-1 rounded text-[var(--text-secondary)]
                  hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]
                  transition-colors
                "
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-auto px-4 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border-color)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
```

---

## 7. Tabs 组件

### Task 4: 创建 Tabs 组件

**Files:**
- Create: `packages/ui/src/components/Tabs/Tabs.tsx`
- Create: `packages/ui/src/components/Tabs/index.ts`

- [ ] **Step 1: 创建 Tabs.tsx**

```tsx
import React, { useState, createContext, useContext } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

export interface TabsProps {
  defaultTab: string;
  children: React.ReactNode;
  onChange?: (tabId: string) => void;
  className?: string;
}

export interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export interface TabProps {
  id: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabPanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  defaultTab,
  children,
  onChange,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    onChange?.(id);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={`flex flex-col ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabList: React.FC<TabListProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`
        flex border-b border-[var(--border-color)]
        bg-[var(--bg-tertiary)]
        ${className}
      `}
      role="tablist"
    >
      {children}
    </div>
  );
};

const Tab: React.FC<TabProps> = ({ id, children, icon, disabled = false }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === id;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setActiveTab(id)}
      className={`
        flex items-center gap-2 px-4 py-2 text-sm font-medium
        border-b-2 transition-colors duration-150
        ${
          isActive
            ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
            : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

const TabPanel: React.FC<TabPanelProps> = ({ id, children, className = '' }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within Tabs');

  if (context.activeTab !== id) return null;

  return (
    <div
      role="tabpanel"
      className={`flex-1 overflow-auto p-4 ${className}`}
    >
      {children}
    </div>
  );
};

Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

export default Tabs;
```

---

## 8. Tree 组件

### Task 5: 创建 Tree 组件（用于文件树）

**Files:**
- Create: `packages/ui/src/components/Tree/Tree.tsx`
- Create: `packages/ui/src/components/Tree/index.ts`

- [ ] **Step 1: 创建 Tree.tsx**

```tsx
import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react';

export interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  icon?: React.ReactNode;
  onClick?: (node: TreeNode) => void;
  onContextMenu?: (e: React.MouseEvent, node: TreeNode) => void;
}

export interface TreeProps {
  nodes: TreeNode[];
  selectedId?: string;
  onSelect?: (node: TreeNode) => void;
  defaultExpanded?: string[];
  className?: string;
}

interface TreeNodeItemProps {
  node: TreeNode;
  level: number;
  selectedId?: string;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect?: (node: TreeNode) => void;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  level,
  selectedId,
  expandedIds,
  onToggle,
  onSelect,
}) => {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.type === 'folder' && node.children && node.children.length > 0;

  const handleClick = useCallback(() => {
    if (node.type === 'folder') {
      onToggle(node.id);
    }
    onSelect?.(node);
  }, [node, onToggle, onSelect]);

  return (
    <div>
      <div
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        className={`
          flex items-center gap-1 py-1 pr-2 cursor-pointer rounded
          text-sm select-none transition-colors duration-100
          ${isSelected ? 'bg-[var(--bg-active)] text-[var(--text-inverse)]' : 'hover:bg-[var(--bg-hover)]'}
        `}
      >
        {node.type === 'folder' ? (
          <>
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown size={14} className="shrink-0" />
              ) : (
                <ChevronRight size={14} className="shrink-0" />
              )
            ) : (
              <span className="w-[14px]" />
            )}
            {isExpanded ? (
              <Folder size={14} className="shrink-0 text-[var(--accent-primary)]" />
            ) : (
              <Folder size={14} className="shrink-0 text-[var(--accent-primary)]" />
            )}
          </>
        ) : (
          <>
            <span className="w-[14px]" />
            {node.icon || <File size={14} className="shrink-0 text-[var(--text-secondary)]" />}
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Tree: React.FC<TreeProps> = ({
  nodes,
  selectedId,
  onSelect,
  defaultExpanded = [],
  className = '',
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(defaultExpanded)
  );

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div className={`py-1 ${className}`}>
      {nodes.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          level={0}
          selectedId={selectedId}
          expandedIds={expandedIds}
          onToggle={handleToggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

export default Tree;
```

---

## 9. Toast 组件

### Task 6: 创建 Toast 通知组件

**Files:**
- Create: `packages/ui/src/components/Toast/Toast.tsx`
- Create: `packages/ui/src/components/Toast/index.ts`
- Create: `packages/ui/src/components/Toast/useToast.ts`

- [ ] **Step 1: 创建 useToast.ts**

```tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 3000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {createPortal(<ToastContainer toasts={toasts} onRemove={removeToast} />, document.body)}
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{
  toasts: Toast[];
  onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[var(--z-toast)] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: Toast;
  onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const colors = {
    success: 'border-[var(--color-success)] text-[var(--color-success)]',
    error: 'border-[var(--color-error)] text-[var(--color-error)]',
    warning: 'border-[var(--color-warning)] text-[var(--color-warning)]',
    info: 'border-[var(--accent-primary)] text-[var(--accent-primary)]',
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 min-w-[300px] max-w-[400px]
        bg-[var(--bg-secondary)] border-l-4 rounded shadow-lg
        ${colors[toast.type]}
      `}
    >
      <span className="text-lg">{icons[toast.type]}</span>
      <span className="flex-1 text-sm text-[var(--text-primary)]">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ✕
      </button>
    </div>
  );
};
```

---

## 10. 其他组件（简化实现）

### Task 7: 创建剩余组件

**Files:**
- Create: `packages/ui/src/components/Dropdown/`
- Create: `packages/ui/src/components/ContextMenu/`
- Create: `packages/ui/src/components/Tooltip/`
- Create: `packages/ui/src/components/SplitPane/`
- Create: `packages/ui/src/components/Icon/`
- Create: `packages/ui/src/components/Card/`
- Create: `packages/ui/src/components/Badge/`
- Create: `packages/ui/src/components/Select/`

- [ ] **Step 1: 创建 Icon 组件库导出**

```tsx
import React from 'react';
import * as Icons from 'lucide-react';

export interface IconProps {
  name: keyof typeof Icons;
  size?: number;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 16, className = '' }) => {
  const IconComponent = Icons[name] as React.FC<{ size: number; className?: string }>;
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return <IconComponent size={size} className={className} />;
};

export default Icon;

export const iconNames = Object.keys(Icons).filter(
  (name) => typeof Icons[name as keyof typeof Icons] === 'object'
);
```

- [ ] **Step 2: 创建 Card 组件**

```tsx
import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  padding = 'md',
}) => {
  const paddingSizes = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={`bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] ${className}`}>
      {title && (
        <div className="px-4 py-2 border-b border-[var(--border-color)]">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">{title}</h3>
        </div>
      )}
      <div className={paddingSizes[padding]}>{children}</div>
    </div>
  );
};

export default Card;
```

- [ ] **Step 3: 创建 Badge 组件**

```tsx
import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}) => {
  const variants = {
    default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
    success: 'bg-[var(--color-success)]/20 text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]',
    error: 'bg-[var(--color-error)]/20 text-[var(--color-error)]',
    info: 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
```

---

## 11. 统一导出

### Task 8: 创建统一导出文件

**Files:**
- Create: `packages/ui/src/types/index.ts`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: 创建 types/index.ts**

```typescript
export * from './components/Button';
export * from './components/Input';
export * from './components/Textarea';
export * from './components/Modal';
export * from './components/Tabs';
export * from './components/Tree';
export * from './components/Toast';
export * from './components/Icon';
export * from './components/Card';
export * from './components/Badge';
```

- [ ] **Step 2: 创建 index.ts**

```typescript
// Components
export { default as Button } from './components/Button';
export { default as Input } from './components/Input';
export { default as Textarea } from './components/Textarea';
export { default as Modal } from './components/Modal';
export { default as Tabs } from './components/Tabs';
export { default as Tree } from './components/Tree';
export { ToastProvider, useToast } from './components/Toast';
export { default as Icon } from './components/Icon';
export { default as Card } from './components/Card';
export { default as Badge } from './components/Badge';

// Styles
import './styles/globals.css';
```

---

## 验收标准

- [ ] 所有组件可在 Storybook 中预览
- [ ] 组件支持 CSS 变量主题定制
- [ ] 组件支持键盘导航
- [ ] 组件 TypeScript 类型完整
- [ ] 组件有基本的使用示例

---

**文档状态：** ✅ UI 组件库实施计划完成
