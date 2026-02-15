'use client';

import dynamic from 'next/dynamic';
import { FC } from 'react';

interface IProps {
  code: string;
}

// Loading placeholder component
const LoadingPlaceholder = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-full"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
);

// Dynamically import MDXContent with SSR disabled to avoid React 19 compatibility issues
const MDXContent = dynamic(() => import('@/components/mdx-content'), {
  ssr: false,
  loading: LoadingPlaceholder,
});

const MDXContentWrapper: FC<IProps> = ({ code }) => {
  return <MDXContent code={code} />;
};

export default MDXContentWrapper;
