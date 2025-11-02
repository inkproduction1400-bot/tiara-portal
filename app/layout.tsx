// app/dev/docs/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Docs',
    template: 'Docs | %s',
  },
  description: 'Tiara API 開発ドキュメント',
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <article className="prose prose-zinc max-w-none">
        {children}
      </article>
    </main>
  );
}
