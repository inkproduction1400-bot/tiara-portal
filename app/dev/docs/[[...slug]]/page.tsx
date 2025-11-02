// app/dev/docs/[[...slug]]/page.tsx
import type { Metadata } from 'next';
import { loadDoc, getAllDocSlugs } from '@/lib/mdx';

type Props = { params: { slug?: string[] } };

// すべてのドキュメントへ SSG
export async function generateStaticParams() {
  const slugs = await getAllDocSlugs(); // string[][]
  return slugs.map((slug) => ({ slug })); // [] (index) も含む
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug?.length ? params.slug : ['index'];
  try {
    const { frontmatter } = await loadDoc(slug);
    const titleFromMd = (frontmatter as any)?.title as string | undefined;
    return { title: titleFromMd ?? `Docs: ${slug.join('/')}` };
  } catch {
    return { title: 'Docs (Not found)' };
  }
}

export default async function Page({ params }: Props) {
  const slug = params.slug?.length ? params.slug : ['index'];
  const { content } = await loadDoc(slug);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 prose prose-zinc">
      {content}
    </main>
  );
}
