/**
 * GitHub Integration Service
 * Provides seamless integration with GitHub repositories, PRs, and workflows
 */

import { Octokit } from '@octokit/rest';

export interface GitHubRepository {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  description: string | null;
  defaultBranch: string;
  url: string;
  cloneUrl: string;
  language: string | null;
  updatedAt: Date;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  merged: boolean;
  mergeable: boolean | null;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
  user: {
    login: string;
    avatarUrl: string;
  };
  createdAt: Date;
  updatedAt: Date;
  url: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: Date;
  };
  committer: {
    name: string;
    email: string;
    date: Date;
  };
  files: GitHubFileChange[];
  url: string;
}

export interface GitHubFileChange {
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
}

export interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  headBranch: string;
  headSha: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | null;
  createdAt: Date;
  updatedAt: Date;
  url: string;
}

export class GitHubIntegrationService {
  private octokit: Octokit;
  private connectedRepos: Map<string, GitHubRepository> = new Map();

  constructor() {
    const token = process.env.REACT_APP_GITHUB_TOKEN;
    if (!token) {
      console.warn('GitHub token not found. Some features may not work.');
    }

    this.octokit = new Octokit({
      auth: token
    });
  }

  // Repository Management
  async connectRepository(owner: string, repo: string): Promise<GitHubRepository> {
    try {
      const { data } = await this.octokit.repos.get({ owner, repo });

      const repository: GitHubRepository = {
        id: data.id.toString(),
        name: data.name,
        fullName: data.full_name,
        owner: data.owner.login,
        private: data.private,
        description: data.description,
        defaultBranch: data.default_branch,
        url: data.html_url,
        cloneUrl: data.clone_url || data.ssh_url || '',
        language: data.language,
        updatedAt: new Date(data.updated_at)
      };

      this.connectedRepos.set(repository.id, repository);
      return repository;
    } catch (error: any) {
      throw new Error(`Failed to connect to repository: ${error.message}`);
    }
  }

  async getUserRepositories(): Promise<GitHubRepository[]> {
    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100
      });

      return data.map(repo => ({
        id: repo.id.toString(),
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        private: repo.private,
        description: repo.description,
        defaultBranch: repo.default_branch,
        url: repo.html_url,
        cloneUrl: repo.clone_url || repo.ssh_url || '',
        language: repo.language,
        updatedAt: new Date(repo.updated_at)
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch repositories: ${error.message}`);
    }
  }

  async getRepositoryContents(
    owner: string,
    repo: string,
    path: string = '',
    ref?: string
  ): Promise<any[]> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref
      });

      return Array.isArray(data) ? data.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        url: item.html_url,
        downloadUrl: item.download_url,
        sha: item.sha
      })) : [];
    } catch (error: any) {
      throw new Error(`Failed to get repository contents: ${error.message}`);
    }
  }

  // Pull Request Management
  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    body: string
  ): Promise<GitHubPullRequest> {
    try {
      const { data } = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        head,
        base,
        body
      });

      return {
        id: data.id,
        number: data.number,
        title: data.title,
        body: data.body,
        state: data.state as 'open' | 'closed',
        merged: data.merged || false,
        mergeable: data.mergeable,
        head: {
          ref: data.head.ref,
          sha: data.head.sha
        },
        base: {
          ref: data.base.ref
        },
        user: {
          login: data.user?.login || '',
          avatarUrl: data.user?.avatar_url || ''
        },
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        url: data.html_url
      };
    } catch (error: any) {
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
  }

  async getPullRequests(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<GitHubPullRequest[]> {
    try {
      const { data } = await this.octokit.pulls.list({
        owner,
        repo,
        state,
        per_page: 50
      });

      return data.map(pr => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.state as 'open' | 'closed',
        merged: pr.merged || false,
        mergeable: pr.mergeable,
        head: {
          ref: pr.head.ref,
          sha: pr.head.sha
        },
        base: {
          ref: pr.base.ref
        },
        user: {
          login: pr.user?.login || '',
          avatarUrl: pr.user?.avatar_url || ''
        },
        createdAt: new Date(pr.created_at),
        updatedAt: new Date(pr.updated_at),
        url: pr.html_url
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch pull requests: ${error.message}`);
    }
  }

  // Commit and Branch Management
  async getCommits(
    owner: string,
    repo: string,
    branch?: string,
    since?: Date
  ): Promise<GitHubCommit[]> {
    try {
      const { data } = await this.octokit.repos.listCommits({
        owner,
        repo,
        sha: branch,
        since: since?.toISOString(),
        per_page: 50
      });

      return data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author?.name || '',
          email: commit.commit.author?.email || '',
          date: new Date(commit.commit.author?.date || '')
        },
        committer: {
          name: commit.commit.committer?.name || '',
          email: commit.commit.committer?.email || '',
          date: new Date(commit.commit.committer?.date || '')
        },
        files: commit.files?.map(file => ({
          filename: file.filename,
          status: file.status as 'added' | 'removed' | 'modified' | 'renamed',
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes
        })) || [],
        url: commit.html_url
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch commits: ${error.message}`);
    }
  }

  async getBranches(owner: string, repo: string): Promise<string[]> {
    try {
      const { data } = await this.octokit.repos.listBranches({
        owner,
        repo,
        per_page: 100
      });

      return data.map(branch => branch.name);
    } catch (error: any) {
      throw new Error(`Failed to fetch branches: ${error.message}`);
    }
  }

  // Workflow and CI/CD Integration
  async getWorkflows(owner: string, repo: string): Promise<GitHubWorkflow[]> {
    try {
      const { data } = await this.octokit.actions.listRepoWorkflows({
        owner,
        repo,
        per_page: 100
      });

      return data.workflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        path: workflow.path,
        state: workflow.state as 'active' | 'inactive',
        createdAt: new Date(workflow.created_at),
        updatedAt: new Date(workflow.updated_at)
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch workflows: ${error.message}`);
    }
  }

  async getWorkflowRuns(
    owner: string,
    repo: string,
    workflowId?: number
  ): Promise<GitHubWorkflowRun[]> {
    try {
      const { data } = await this.octokit.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflowId,
        per_page: 50
      });

      return data.workflow_runs.map(run => ({
        id: run.id,
        name: run.name || '',
        headBranch: run.head_branch,
        headSha: run.head_sha,
        status: run.status as 'queued' | 'in_progress' | 'completed',
        conclusion: run.conclusion as 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | null,
        createdAt: new Date(run.created_at),
        updatedAt: new Date(run.updated_at),
        url: run.html_url
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch workflow runs: ${error.message}`);
    }
  }

  // File Operations
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch?: string
  ): Promise<any> {
    try {
      // Get the current file (if it exists) to get the SHA
      let sha: string | undefined;
      try {
        const { data: existingFile } = await this.octokit.repos.getContent({
          owner,
          repo,
          path,
          ref: branch
        });
        sha = Array.isArray(existingFile) ? undefined : existingFile.sha;
      } catch (error) {
        // File doesn't exist, sha remains undefined
      }

      const { data } = await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: btoa(content), // Convert to base64
        sha,
        branch
      });

      return data;
    } catch (error: any) {
      throw new Error(`Failed to create/update file: ${error.message}`);
    }
  }

  // Utility Methods
  isConfigured(): boolean {
    return Boolean(process.env.REACT_APP_GITHUB_TOKEN);
  }

  getConnectedRepositories(): GitHubRepository[] {
    return Array.from(this.connectedRepos.values());
  }

  disconnectRepository(repoId: string): void {
    this.connectedRepos.delete(repoId);
  }
}
