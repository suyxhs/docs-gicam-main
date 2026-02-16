import { getPageImage, source } from '@/lib/source';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { gitConfig } from '@/lib/layout.shared';
import { DocsActionButtons } from '@/components/docs/action-buttons';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function Page(props: PageProps) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  
  if (!page) {
    notFound();
  }

  const MDXContent = page.data.body;

  // Получаем путь к файлу из структуры source
  // В fumadocs путь можно получить из page.slugs
  const filePath = page.slugs.length > 0 
    ? `${page.slugs.join('/')}.mdx`
    : 'index.mdx';

  // Формируем URL для GitHub
  const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${filePath}`;

  return (
    <DocsPage 
      toc={page.data.toc} 
      full={page.data.full}
      tableOfContent={{
        style: 'clerk',
        enabled: true,
      }}
    >
      {/* Заголовок и описание */}
      <DocsTitle>{page.data.title}</DocsTitle>
      {page.data.description && (
        <DocsDescription>{page.data.description}</DocsDescription>
      )}
      
      {/* Кнопки действий */}
      <div className="flex flex-row items-center gap-2 border-b pb-6 mb-6">
        <DocsActionButtons 
          title={page.data.title}
          url={`${page.url}.mdx`}
          githubUrl={githubUrl}
        />
      </div>

      {/* Контент */}
      <DocsBody>
        <MDXContent
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
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

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}