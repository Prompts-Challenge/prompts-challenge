import { Octokit } from '@octokit/rest';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from './info';

export async function handleGithubCallback() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (!code) {
      throw new Error('No code provided');
    }
    
    // Add error handling for token exchange
    const tokenResponse = await fetch(`https://github.com/login/oauth/access_token?client_id=${GITHUB_CLIENT_ID}&code=${code}&client_secret=${GITHUB_CLIENT_SECRET}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error('Failed to obtain access token: ' + JSON.stringify(tokenData));
    }

    const octokit = new Octokit({ auth: tokenData.access_token });
    
    // Verify token works by making API call
    try {
      const { data: userData } = await octokit.users.getAuthenticated();
      localStorage.setItem('github_user', JSON.stringify(userData));
      localStorage.setItem('github_token', tokenData.access_token);
      return userData;
    } catch (apiError) {
      console.error('GitHub API authentication failed:', apiError);
      throw new Error('Failed to authenticate with GitHub API');
    }
  } catch (error) {
    console.error('GitHub登录失败:', error);
    // Clear any potentially invalid tokens
    localStorage.removeItem('github_user');
    localStorage.removeItem('github_token');
    throw error;
  }
}

export function redirectToGithub() {
  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.append('client_id', GITHUB_CLIENT_ID);
  githubAuthUrl.searchParams.append('scope', 'read:user user:email public_repo');
  githubAuthUrl.searchParams.append('state', window.location.pathname);
  window.location.href = githubAuthUrl.toString();
}

export function isGithubLoggedIn(): boolean {
  return localStorage.getItem('github_token') !== null;
}

export async function getCurrentUser(): Promise<ReturnType<typeof handleGithubCallback> | null> {
  const token = localStorage.getItem('github_token');
  if (!token) {
    return null;
  }
  try {
    const octokit = new Octokit({ auth: token });
    const { data: userData } = await octokit.users.getAuthenticated();
    localStorage.setItem('github_user', JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    const userStr = localStorage.getItem('github_user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export function logout() {
  localStorage.removeItem('github_user');
  localStorage.removeItem('github_token');
  window.location.href = '/';
}