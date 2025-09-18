'use client';

// here we will define the rules how our mdx content syntax will be converted to HTML
// otherwise imported components can be used just inside MDX

import { useMDXComponent } from 'next-contentlayer/hooks';
import { FC } from 'react';
import { MDXComponents } from './mdx-components';

interface IProps {
  code: string;
}

const MDXContent: FC<IProps> = ({ code }) => {
  const Component = useMDXComponent(code);
  return <Component components={MDXComponents} />;
};

export default MDXContent;
