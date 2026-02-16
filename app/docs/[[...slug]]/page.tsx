import { getPageImage, source } from '@/lib/source';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { LLMCopyButton, ViewOptions } from '@/components/ai/page-actions';
import { gitConfig } from '@/lib/layout.shared';
import { ActionButtons } from '@/components/docs/action-buttons'; // 👈 Импортируем новый компонент
import { FloatingActionButton } from '@/components/docs/floating-action-button';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function Page(props: PageProps) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      {/* Заголовок с кнопками действий */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-row items-start justify-between gap-4">
          <div className="flex-1">
            <DocsTitle>{page.data.title}</DocsTitle>
            <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
          </div>
        </div>

        {/* Существующие кнопки (LLM и GitHub) */}
        <div className="flex flex-row gap-2 items-center border-b pb-6">
          <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
          <ViewOptions
            markdownUrl={`${page.url}.mdx`}
            githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
          />
        </div>
      </div>

      {/* Основной контент */}
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
      <FloatingActionButton title={page.data.title} />
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const siteUrl = process.env.NODE_ENV === 'production'
    ? 'https://your-domain.com'
    : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001');

  const imageUrl = getPageImage(page).url;
  const fullImageUrl = new URL(imageUrl, siteUrl).toString();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      type: 'article',
      url: `${siteUrl}/docs/${page.slugs.join('/')}`,
      images: [{
        url: fullImageUrl,
        width: 1200,
        height: 630,
        alt: page.data.title,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.data.title,
      description: page.data.description,
      images: [fullImageUrl],
    },
  };
}