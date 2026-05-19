import React from 'react';
import { GitCommit, GitBranch, User } from 'lucide-react';

interface Commit {
  id: string;
  message: string;
  author: string;
  date: string;
  branch: string;
}

const mockCommits: Commit[] = [
  { id: 'a1b2c3d', message: 'Initial commit', author: 'John Doe', date: '2024-01-01', branch: 'main' },
  { id: 'b2c3d4e', message: 'Add login feature', author: 'Jane Smith', date: '2024-01-02', branch: 'main' },
  { id: 'c3d4e5f', message: 'Fix bug in authentication', author: 'John Doe', date: '2024-01-03', branch: 'main' },
  { id: 'd4e5f6g', message: 'Start feature branch', author: 'Jane Smith', date: '2024-01-03', branch: 'feature/user-profile' },
  { id: 'e5f6g7h', message: 'Add user profile UI', author: 'Jane Smith', date: '2024-01-04', branch: 'feature/user-profile' },
  { id: 'f6g7h8i', message: 'Update documentation', author: 'John Doe', date: '2024-01-05', branch: 'main' },
  { id: 'g7h8i9j', message: 'Complete user profile feature', author: 'Jane Smith', date: '2024-01-06', branch: 'feature/user-profile' },
];

export const GitVisualizer = () => {
  return (
    <div className="h-full flex flex-col bg-zinc-900 text-zinc-100 p-4 overflow-auto">
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <GitBranch size={20} />
          Git History
        </h2>
        <p className="text-sm text-zinc-400">Visual representation of commit history</p>
      </div>
      
      <div className="flex-1">
        <div className="flex gap-8">
          {/* Main branch */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4 text-blue-400">
              <GitBranch size={16} />
              <span className="font-medium">main</span>
            </div>
            <div className="space-y-6">
              {mockCommits
                .filter(c => c.branch === 'main')
                .map((commit, index) => (
                  <div key={commit.id} className="relative flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-zinc-900 z-10" />
                      {index < mockCommits.filter(c => c.branch === 'main').length - 1 && (
                        <div className="w-0.5 h-full bg-zinc-700 absolute top-4 left-[7px]" />
                      )}
                    </div>
                    <div className="flex-1 bg-zinc-800 p-3 rounded-md border border-zinc-700">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{commit.message}</span>
                        <span className="text-xs text-zinc-500 font-mono">{commit.id.slice(0, 7)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <User size={12} />
                        <span>{commit.author}</span>
                        <span>•</span>
                        <span>{commit.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          {/* Feature branch */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4 text-green-400">
              <GitBranch size={16} />
              <span className="font-medium">feature/user-profile</span>
            </div>
            <div className="space-y-6 ml-4">
              {mockCommits
                .filter(c => c.branch === 'feature/user-profile')
                .map((commit, index) => (
                  <div key={commit.id} className="relative flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-zinc-900 z-10" />
                      {index < mockCommits.filter(c => c.branch === 'feature/user-profile').length - 1 && (
                        <div className="w-0.5 h-full bg-zinc-700 absolute top-4 left-[7px]" />
                      )}
                    </div>
                    <div className="flex-1 bg-zinc-800 p-3 rounded-md border border-zinc-700">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{commit.message}</span>
                        <span className="text-xs text-zinc-500 font-mono">{commit.id.slice(0, 7)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <User size={12} />
                        <span>{commit.author}</span>
                        <span>•</span>
                        <span>{commit.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GitVisualizerMetadata = {
  id: 'git-visualizer',
  name: 'Git Visualizer',
  icon: 'GitCommit',
  description: 'Visualize git commit history and branches',
  category: 'Development',
};