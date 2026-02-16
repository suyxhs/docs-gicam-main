import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { gitConfig } from '@/lib/layout.shared';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: 'Gicam Dock',
        githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
      }}
      links={[
        {
          text: 'Документация',
          url: '/docs',
          active: 'nested-url',
        },
        {
          text: 'Админ',
          url: '/admin',
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}