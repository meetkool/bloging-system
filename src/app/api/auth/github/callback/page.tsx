'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { githubAPI, exchangeCodeForToken } from '@/lib/github-api';

export const dynamic = 'force-dynamic';

function GitHubCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setError(error);
        return;
      }

      if (!code) {
        setStatus('error');
        setError('No authorization code received');
        return;
      }

      try {
        const accessToken = await exchangeCodeForToken(code);
        githubAPI.setAccessToken(accessToken);
        setStatus('success');
        
        // Redirect to quick-blog page after successful authentication
        setTimeout(() => {
          router.push('/quick-blog');
        }, 2000);
      } catch (err) {
        console.error('Authentication error:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md w-full text-center">
        {status === 'loading' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authenticating...</h2>
            <p className="text-gray-600">Completing your GitHub login</p>
          </div>
        )}
        
        {status === 'success' && (
          <div>
            <div className="text-green-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600 mb-4">You&apos;ve been successfully authenticated with GitHub.</p>
            <p className="text-sm text-gray-500">Redirecting to your blog...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div>
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/quick-blog')}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Back to Blog
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GitHubCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <GitHubCallbackContent />
    </Suspense>
  );
}

