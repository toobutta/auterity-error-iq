import React, { useState, useEffect } from 'react';
import { githubIntegrationService, GitHubRepository } from '../../services/github/GitHubIntegrationService';
import { RepositoryList } from './RepositoryList';
import { WorkflowMonitor } from './WorkflowMonitor';
import { DeploymentStatus } from './DeploymentStatus';
import { RepositoryConnector } from './RepositoryConnector';

interface GitHubDashboardProps {
  onRepositorySelect?: (repo: GitHubRepository) => void;
  onWorkflowTrigger?: (workflowId: number) => void;
}

export const GitHubDashboard: React.FC<GitHubDashboardProps> = ({
  onRepositorySelect,
  onWorkflowTrigger
}) => {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'repositories' | 'workflows' | 'deployments' | 'connect'>('repositories');
  const [selectedRepository, setSelectedRepository] = useState<GitHubRepository | null>(null);

  useEffect(() => {
    loadGitHubData();
    setupEventListeners();
  }, []);

  const loadGitHubData = async () => {
    try {
      setIsLoading(true);

      // Load repositories
      const repos = await githubIntegrationService.getUserRepositories({
        type: 'owner',
        sort: 'updated',
        per_page: 50
      });
      setRepositories(repos);

      // If we have repositories, load workflows for the first one
      if (repos.length > 0) {
        const repo = repos[0];
        setSelectedRepository(repo);

        const wf = await githubIntegrationService.getWorkflows(repo.owner.login, repo.name);
        setWorkflows(wf);

        const runs = await githubIntegrationService.getWorkflowRuns(repo.owner.login, repo.name);
        setDeployments(runs);
      }
    } catch (error) {
      console.error('Failed to load GitHub data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupEventListeners = () => {
    // Listen for webhook events
    githubIntegrationService.on('push', handlePushEvent);
    githubIntegrationService.on('pull_request_update', handlePullRequestEvent);
    githubIntegrationService.on('release_published', handleReleaseEvent);
  };

  const handlePushEvent = (payload: any) => {
    console.log('Push event received:', payload);
    // Refresh workflows and deployments
    if (selectedRepository) {
      loadWorkflowsAndDeployments(selectedRepository);
    }
  };

  const handlePullRequestEvent = (payload: any) => {
    console.log('Pull request event received:', payload);
    // Could trigger notifications or workflow updates
  };

  const handleReleaseEvent = (payload: any) => {
    console.log('Release event received:', payload);
    // Could trigger deployment workflows
  };

  const loadWorkflowsAndDeployments = async (repo: GitHubRepository) => {
    try {
      const [wf, runs] = await Promise.all([
        githubIntegrationService.getWorkflows(repo.owner.login, repo.name),
        githubIntegrationService.getWorkflowRuns(repo.owner.login, repo.name)
      ]);
      setWorkflows(wf);
      setDeployments(runs);
    } catch (error) {
      console.error('Failed to load workflows and deployments:', error);
    }
  };

  const handleRepositorySelect = (repo: GitHubRepository) => {
    setSelectedRepository(repo);
    loadWorkflowsAndDeployments(repo);
    onRepositorySelect?.(repo);
  };

  const handleWorkflowTrigger = async (workflowId: number) => {
    if (!selectedRepository) return;

    try {
      await githubIntegrationService.triggerWorkflow(
        selectedRepository.owner.login,
        selectedRepository.name,
        workflowId
      );
      onWorkflowTrigger?.(workflowId);

      // Refresh deployments after triggering workflow
      const runs = await githubIntegrationService.getWorkflowRuns(
        selectedRepository.owner.login,
        selectedRepository.name
      );
      setDeployments(runs);
    } catch (error) {
      console.error('Failed to trigger workflow:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="github-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading GitHub integration...</p>
      </div>
    );
  }

  return (
    <div className="github-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <svg className="github-icon" viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub Integration
          </h1>
          <div className="rate-limit-indicator">
            <span className="rate-limit-text">API Rate Limit: Good</span>
          </div>
        </div>

        <div className="dashboard-actions">
          <button
            className={`tab-button ${activeTab === 'repositories' ? 'active' : ''}`}
            onClick={() => setActiveTab('repositories')}
          >
            Repositories
          </button>
          <button
            className={`tab-button ${activeTab === 'workflows' ? 'active' : ''}`}
            onClick={() => setActiveTab('workflows')}
          >
            Workflows
          </button>
          <button
            className={`tab-button ${activeTab === 'deployments' ? 'active' : ''}`}
            onClick={() => setActiveTab('deployments')}
          >
            Deployments
          </button>
          <button
            className={`tab-button ${activeTab === 'connect' ? 'active' : ''}`}
            onClick={() => setActiveTab('connect')}
          >
            Connect
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === 'repositories' && (
          <RepositoryList
            repositories={repositories}
            selectedRepository={selectedRepository}
            onRepositorySelect={handleRepositorySelect}
          />
        )}

        {activeTab === 'workflows' && (
          <WorkflowMonitor
            workflows={workflows}
            repository={selectedRepository}
            onWorkflowTrigger={handleWorkflowTrigger}
          />
        )}

        {activeTab === 'deployments' && (
          <DeploymentStatus
            deployments={deployments}
            repository={selectedRepository}
          />
        )}

        {activeTab === 'connect' && (
          <RepositoryConnector
            onRepositoryConnected={handleRepositorySelect}
          />
        )}
      </div>
    </div>
  );
};
