/**
 * Git Panel Component
 * Provides Git operations and repository management within the IDE
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GitHubIntegrationService, GitHubRepository, GitHubCommit, GitHubPullRequest } from '../../services/githubIntegration';

interface GitPanelProps {
  repository?: GitHubRepository | null;
  onRepositoryConnect?: (owner: string, repo: string) => void;
  onCommit?: (message: string) => void;
  onPush?: () => void;
  onPull?: () => void;
  className?: string;
}

interface GitStatus {
  modified: string[];
  staged: string[];
  untracked: string[];
  deleted: string[];
}

export const GitPanel: React.FC<GitPanelProps> = ({
  repository,
  onRepositoryConnect,
  onCommit,
  onPush,
  onPull,
  className = ''
}) => {
  const [currentRepo, setCurrentRepo] = useState<GitHubRepository | null>(repository || null);
  const [gitStatus, setGitStatus] = useState<GitStatus>({
    modified: [],
    staged: [],
    untracked: [],
    deleted: []
  });
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'changes' | 'history' | 'branches' | 'prs'>('changes');

  const [githubService] = useState(() => new GitHubIntegrationService());

  // Load repository data when repository changes
  useEffect(() => {
    if (repository) {
      setCurrentRepo(repository);
      loadRepositoryData(repository);
    }
  }, [repository]);

  const loadRepositoryData = useCallback(async (repo: GitHubRepository) => {
    setIsLoading(true);
    try {
      // Load branches
      const repoBranches = await githubService.getBranches(repo.owner, repo.name);
      setBranches(repoBranches);

      // Load recent commits
      const recentCommits = await githubService.getCommits(repo.owner, repo.name);
      setCommits(recentCommits);

      // Load pull requests
      const prs = await githubService.getPullRequests(repo.owner, repo.name);
      setPullRequests(prs);

      // Mock git status (in real implementation, this would come from git)
      setGitStatus({
        modified: ['src/components/App.tsx', 'src/styles/main.css'],
        staged: ['package.json'],
        untracked: ['src/new-feature.tsx'],
        deleted: []
      });
    } catch (error) {
      console.error('Failed to load repository data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [githubService]);

  const handleConnectRepository = useCallback(async () => {
    const owner = prompt('Enter repository owner:');
    const repo = prompt('Enter repository name:');

    if (owner && repo) {
      try {
        const repository = await githubService.connectRepository(owner, repo);
        setCurrentRepo(repository);
        onRepositoryConnect?.(owner, repo);
        loadRepositoryData(repository);
      } catch (error) {
        alert('Failed to connect to repository: ' + (error as Error).message);
      }
    }
  }, [githubService, onRepositoryConnect, loadRepositoryData]);

  const handleCommit = useCallback(async () => {
    if (!commitMessage.trim()) {
      alert('Please enter a commit message');
      return;
    }

    try {
      await onCommit?.(commitMessage);
      setCommitMessage('');
      // Refresh repository data
      if (currentRepo) {
        loadRepositoryData(currentRepo);
      }
    } catch (error) {
      alert('Failed to commit changes: ' + (error as Error).message);
    }
  }, [commitMessage, onCommit, currentRepo, loadRepositoryData]);

  const handlePush = useCallback(async () => {
    try {
      await onPush?.();
      alert('Changes pushed successfully!');
      if (currentRepo) {
        loadRepositoryData(currentRepo);
      }
    } catch (error) {
      alert('Failed to push changes: ' + (error as Error).message);
    }
  }, [onPush, currentRepo, loadRepositoryData]);

  const handlePull = useCallback(async () => {
    try {
      await onPull?.();
      alert('Changes pulled successfully!');
      if (currentRepo) {
        loadRepositoryData(currentRepo);
      }
    } catch (error) {
      alert('Failed to pull changes: ' + (error as Error).message);
    }
  }, [onPull, currentRepo, loadRepositoryData]);

  const renderChangesTab = () => (
    <div className="git-changes">
      <div className="changes-sections space-y-4">
        {/* Staged Changes */}
        {gitStatus.staged.length > 0 && (
          <div className="changes-section">
            <h4 className="section-title text-green-400 font-medium mb-2">
              ✅ Staged Changes ({gitStatus.staged.length})
            </h4>
            <div className="file-list space-y-1">
              {gitStatus.staged.map((file, index) => (
                <div key={index} className="file-item flex items-center justify-between p-2 bg-gray-700 rounded">
                  <span className="file-name text-sm">{file}</span>
                  <button className="unstaged-btn text-xs text-red-400 hover:text-red-300">
                    Unstage
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modified Files */}
        {gitStatus.modified.length > 0 && (
          <div className="changes-section">
            <h4 className="section-title text-yellow-400 font-medium mb-2">
              📝 Modified ({gitStatus.modified.length})
            </h4>
            <div className="file-list space-y-1">
              {gitStatus.modified.map((file, index) => (
                <div key={index} className="file-item flex items-center justify-between p-2 bg-gray-700 rounded">
                  <span className="file-name text-sm">{file}</span>
                  <button className="stage-btn text-xs text-green-400 hover:text-green-300">
                    Stage
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Untracked Files */}
        {gitStatus.untracked.length > 0 && (
          <div className="changes-section">
            <h4 className="section-title text-blue-400 font-medium mb-2">
              ➕ Untracked ({gitStatus.untracked.length})
            </h4>
            <div className="file-list space-y-1">
              {gitStatus.untracked.map((file, index) => (
                <div key={index} className="file-item flex items-center justify-between p-2 bg-gray-700 rounded">
                  <span className="file-name text-sm">{file}</span>
                  <button className="add-btn text-xs text-blue-400 hover:text-blue-300">
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commit Section */}
        {(gitStatus.staged.length > 0 || gitStatus.modified.length > 0) && (
          <div className="commit-section p-3 bg-gray-700 rounded">
            <h4 className="text-sm font-medium mb-2">📝 Commit Changes</h4>
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Enter commit message..."
              className="commit-input w-full p-2 text-sm bg-gray-600 border border-gray-500 rounded resize-none focus:outline-none focus:border-blue-500"
              rows={3}
            />
            <div className="commit-actions flex justify-between mt-2">
              <button
                onClick={handleCommit}
                disabled={!commitMessage.trim()}
                className="commit-btn bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
              >
                Commit
              </button>
              <div className="sync-actions flex space-x-2">
                <button
                  onClick={handlePull}
                  className="pull-btn bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                >
                  Pull
                </button>
                <button
                  onClick={handlePush}
                  className="push-btn bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
                >
                  Push
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="git-history">
      <div className="commits-list space-y-2">
        {commits.slice(0, 10).map((commit) => (
          <div key={commit.sha} className="commit-item p-3 bg-gray-700 rounded">
            <div className="commit-header flex items-center justify-between mb-2">
              <div className="commit-hash text-xs text-gray-400 font-mono">
                {commit.sha.substring(0, 7)}
              </div>
              <div className="commit-date text-xs text-gray-500">
                {new Date(commit.date).toLocaleDateString()}
              </div>
            </div>
            <div className="commit-message text-sm mb-2">
              {commit.message}
            </div>
            <div className="commit-author text-xs text-gray-400">
              by {commit.author.name}
            </div>
            {commit.files.length > 0 && (
              <div className="commit-files mt-2">
                <div className="files-count text-xs text-gray-500 mb-1">
                  {commit.files.length} file{commit.files.length !== 1 ? 's' : ''} changed
                </div>
                <div className="files-list flex flex-wrap gap-1">
                  {commit.files.slice(0, 3).map((file, index) => (
                    <span key={index} className="file-tag text-xs bg-gray-600 px-2 py-1 rounded">
                      {file.filename}
                    </span>
                  ))}
                  {commit.files.length > 3 && (
                    <span className="file-tag text-xs bg-gray-600 px-2 py-1 rounded">
                      +{commit.files.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderBranchesTab = () => (
    <div className="git-branches">
      <div className="current-branch mb-4">
        <h4 className="text-sm font-medium mb-2">Current Branch</h4>
        <div className="branch-item flex items-center justify-between p-2 bg-blue-600 rounded">
          <span className="branch-name">{currentBranch}</span>
          <span className="branch-status text-xs">Up to date</span>
        </div>
      </div>

      <div className="branches-list">
        <h4 className="text-sm font-medium mb-2">All Branches</h4>
        <div className="branches space-y-1">
          {branches.map((branch, index) => (
            <div
              key={index}
              className={`branch-item flex items-center justify-between p-2 rounded cursor-pointer ${
                branch === currentBranch ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => setCurrentBranch(branch)}
            >
              <span className="branch-name text-sm">{branch}</span>
              {branch === currentBranch && <span className="current-indicator">✓</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="branch-actions mt-4">
        <button className="create-branch-btn w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm">
          + Create New Branch
        </button>
      </div>
    </div>
  );

  const renderPRsTab = () => (
    <div className="git-prs">
      <div className="prs-list space-y-2">
        {pullRequests.slice(0, 10).map((pr) => (
          <div key={pr.id} className="pr-item p-3 bg-gray-700 rounded">
            <div className="pr-header flex items-center justify-between mb-2">
              <div className="pr-title text-sm font-medium">#{pr.number} {pr.title}</div>
              <div className={`pr-status px-2 py-1 rounded text-xs ${
                pr.state === 'open' ? 'bg-green-600' : 'bg-gray-600'
              }`}>
                {pr.state}
              </div>
            </div>
            <div className="pr-meta flex items-center space-x-4 text-xs text-gray-400 mb-2">
              <span>by {pr.user.login}</span>
              <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="pr-body text-sm text-gray-300">
              {pr.body?.substring(0, 100)}...
            </div>
          </div>
        ))}
      </div>

      <div className="pr-actions mt-4">
        <button className="create-pr-btn w-full bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm">
          + Create Pull Request
        </button>
      </div>
    </div>
  );

  if (!currentRepo) {
    return (
      <div className={`git-panel-no-repo bg-gray-800 text-white ${className}`}>
        <div className="no-repo-content flex flex-col items-center justify-center p-8">
          <div className="no-repo-icon text-4xl mb-4">🔗</div>
          <h3 className="text-lg font-medium mb-2">No Repository Connected</h3>
          <p className="text-gray-400 text-center mb-4">
            Connect to a GitHub repository to use Git features
          </p>
          <button
            onClick={handleConnectRepository}
            className="connect-btn bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Connect Repository
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`git-panel bg-gray-800 text-white ${className}`}>
      {/* Header */}
      <div className="git-header p-3 border-b border-gray-700">
        <div className="repo-info flex items-center justify-between mb-2">
          <div className="repo-details">
            <div className="repo-name text-sm font-medium">{currentRepo.fullName}</div>
            <div className="repo-branch text-xs text-gray-400">on {currentBranch}</div>
          </div>
          <div className="repo-status">
            <div className="status-indicator w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="git-tabs flex space-x-1">
          {[
            { id: 'changes', label: 'Changes', icon: '📝' },
            { id: 'history', label: 'History', icon: '📚' },
            { id: 'branches', label: 'Branches', icon: '🌿' },
            { id: 'prs', label: 'PRs', icon: '🔄' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`tab-btn flex items-center space-x-1 px-3 py-1 rounded text-xs ${
                activeTab === tab.id ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="git-content flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="loading flex items-center justify-center p-8">
            <div className="loading-spinner animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="ml-2 text-sm">Loading...</span>
          </div>
        ) : (
          <>
            {activeTab === 'changes' && renderChangesTab()}
            {activeTab === 'history' && renderHistoryTab()}
            {activeTab === 'branches' && renderBranchesTab()}
            {activeTab === 'prs' && renderPRsTab()}
          </>
        )}
      </div>
    </div>
  );
};
