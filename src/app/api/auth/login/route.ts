import { NextRequest, NextResponse } from 'next/server';
import config from '../../../../../config.js';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate credentials against config
    if (username !== config.auth.username || password !== config.auth.password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if GitHub credentials are configured
    if (!config.github.personalAccessToken || config.github.personalAccessToken === 'your_github_personal_access_token_here') {
      return NextResponse.json(
        { error: 'GitHub Personal Access Token not configured. Please update config.js' },
        { status: 500 }
      );
    }

    // Return user data
    return NextResponse.json({
      success: true,
      username: config.auth.username,
      github_username: config.github.username,
      github_token: config.github.personalAccessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

