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
        // githubUrl нужно передавать отдельно или через компонент
      }}
      links={[
        {
          text: 'Документация',
          url: '/docs',
          active: 'nested-url',
        },
        {
          text: 'Портфолио',
          url: '/portfolio',
        },
        // Ссылка на GitHub как отдельный элемент
        {
          text: 'GitHub',
          url: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
          external: true,
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}