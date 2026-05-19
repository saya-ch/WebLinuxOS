import React from 'react';
import { useAppStore, AppMetadata } from '../context/store';

interface StartMenuProps {
  onLaunchApp: (app: AppMetadata) => void;
}

const appCategories = [
  { id: 'dev', name: '开发工具', icon: '💻' },
  { id: 'api', name: 'API 工具', icon: '🔌' },
  { id: 'database', name: '数据库', icon: '🗄️' },
  { id: 'frontend', name: '前端开发', icon: '🎨' },
  { id: 'productivity', name: '效率工具', icon: '⚡' },
  { id: 'security', name: '安全工具', icon: '🔒' },
  { id: 'docs', name: '文档工具', icon: '📄' },
  { id: 'system', name: '系统工具', icon: '⚙️' },
];

export const StartMenu: React.FC<StartMenuProps> = ({ onLaunchApp }) => {
  const { closeStartMenu, registeredApps } = useAppStore();
  const [activeCategory, setActiveCategory] = React.useState('dev');

  const appsByCategory = registeredApps.reduce((acc, app) => {
    if (!acc[app.category]) {
      acc[app.category] = [];
    }
    acc[app.category].push(app);
    return acc;
  }, {} as Record<string, AppMetadata[]>);

  const handleAppClick = (app: AppMetadata) => {
    onLaunchApp(app);
    closeStartMenu();
  };

  return (
    <div className="absolute bottom-12 left-2 w-80 bg-[#252526] border border-[#3c3c3c] rounded shadow-2xl flex">
      <div className="w-32 bg-[#1e1e1e] border-r border-[#3c3c3c] p-2 space-y-1">
        {appCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${activeCategory === category.id ? 'bg-[#3794ff] text-white' : 'text-[#cccccc] hover:bg-[#2d2d2d]'}`}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 p-3 overflow-y-auto max-h-[400px]">
        <h3 className="text-sm font-medium text-[#858585] mb-2">
          {appCategories.find((c) => c.id === activeCategory)?.name || '应用'}
        </h3>
        <div className="space-y-1">
          {(appsByCategory[activeCategory] || []).map((app) => (
            <button
              key={app.id}
              onClick={() => handleAppClick(app)}
              className="w-full flex items-center gap-3 px-2 py-2 rounded text-left text-[#cccccc] hover:bg-[#2d2d2d] transition-colors"
            >
              <span className="text-2xl">{app.icon}</span>
              <div>
                <div className="text-sm font-medium">{app.name}</div>
                <div className="text-xs text-[#858585]">{app.description}</div>
              </div>
            </button>
          ))}
          {(appsByCategory[activeCategory] || []).length === 0 && (
            <div className="text-sm text-[#858585] py-4">暂无应用</div>
          )}
        </div>
      </div>
    </div>
  );
};
