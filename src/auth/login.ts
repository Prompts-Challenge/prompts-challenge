import { Octokit } from '@octokit/rest';

export interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export async function handleGithubCallback() {
  try {
    // 从 URL 获取授权码
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (!code) {
      throw new Error('No code provided');
    }

    // 通过 GitHub OAuth 获取 token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: 'Ov23li5FzXmDStLNLIkY',
        code,
      }),
    });

    const { access_token } = await tokenResponse.json();

    // 使用 token 创建 Octokit 实例
    const octokit = new Octokit({ auth: access_token });
    
    // 获取用户信息
    const { data: userData } = await octokit.users.getAuthenticated();

    // 保存用户信息到 localStorage
    const user: GithubUser = {
      id: userData.id,
      login: userData.login,
      name: userData.name,
      email: userData.email,
      avatar_url: userData.avatar_url,
    };
    
    localStorage.setItem('github_user', JSON.stringify(user));
    localStorage.setItem('github_token', access_token);

    return user;
  } catch (error) {
    console.error('GitHub登录失败:', error);
    throw error;
  }
}

// 发起 GitHub 登录
export function redirectToGithub() {
  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.append('client_id', 'Ov23li5FzXmDStLNLIkY');
  githubAuthUrl.searchParams.append('scope', 'read:user user:email');
  
  // 添加当前页面 URL 作为 state，用于登录后返回
  githubAuthUrl.searchParams.append('state', window.location.pathname);
  
  window.location.href = githubAuthUrl.toString();
}

// 检查用户是否已登录
export function isGithubLoggedIn(): boolean {
  return localStorage.getItem('github_token') !== null;
}

// 获取当前登录用户信息
export function getCurrentUser(): GithubUser | null {
  const userStr = localStorage.getItem('github_user');
  return userStr ? JSON.parse(userStr) : null;
}

// 登出
export function logout() {
  localStorage.removeItem('github_user');
  localStorage.removeItem('github_token');
  window.location.href = '/';
}