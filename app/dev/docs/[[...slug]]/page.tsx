// app/dev/docs/[[...slug]]/page.tsx
import type { Metadata } from 'next';
import { loadDoc, getAllDocSlugs } from '@/lib/mdx';

type SlugParams = { slug?: string[] };

export async function generateStaticParams() {
  const slugs = await getAllDocSlugs();
  // { slug: string[] } の配列を返す
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<SlugParams> }
): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = raw?.length ? raw : ['index'];
  try {
    const { frontmatter } = await loadDoc(slug);
    const titleFromMd = (frontmatter as any)?.title as string | undefined;
    return { title: titleFromMd ?? `Docs: ${slug.join('/')}` };
  } catch {
    return { title: 'Docs (Not found)' };
  }
}

export default async function Page(
  { params }: { params: Promise<SlugParams> }
) {
  const { slug: raw } = await params;
  const slug = raw?.length ? raw : ['index'];
  const { content } = await loadDoc(slug);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 prose prose-zinc">
      {content}
    </main>
  );
}
