// lib/mdx.ts
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import fs from 'node:fs/promises';
import fss from 'node:fs';
import path from 'node:path';
import type { ReactNode } from 'react';

export type LoadDocResult = {
  content: ReactNode;
  frontmatter: Record<string, any>;
  absolutePath: string;
  relativePath: string;
};

const DOCS_ROOT = path.join(process.cwd(), 'content', 'docs');

function ensureArray(slug?: string[] | string): string[] {
  if (!slug) return [];
  return Array.isArray(slug) ? slug : [slug];
}

/** slug 配列から候補パスを列挙（.md / .mdx / index.md / index.mdx） */
function candidateRelPaths(slugParts: string[]): string[] {
  const joined = path.join(...slugParts);
  return [
    `${joined}.md`,
    `${joined}.mdx`,
    path.join(joined, 'index.md'),
    path.join(joined, 'index.mdx'),
  ];
}

/** 既存ファイルを最初に見つかったものとして解決（相対パスを返す） */
async function resolveExistingRel(slugParts: string[]): Promise<string> {
  for (const rel of candidateRelPaths(slugParts)) {
    const abs = path.join(DOCS_ROOT, rel);
    if (fss.existsSync(abs) && fss.statSync(abs).isFile()) {
      return rel;
    }
  }
  throw new Error(`doc not found for slug: ${JSON.stringify(slugParts)}`);
}

/** ドキュメントを読み込み、MDX を RSC で compile */
export async function loadDoc(slugInput?: string[] | string): Promise<LoadDocResult> {
  const slugParts = ensureArray(slugInput);
  const rel = await resolveExistingRel(slugParts.length ? slugParts : ['index']);
  const absolutePath = path.join(DOCS_ROOT, rel);
  const source = await fs.readFile(absolutePath, 'utf8');

  const { content, frontmatter } = await compileMDX({
    source,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]],
      },
    },
  });

  return {
    content,
    frontmatter: (frontmatter as any) ?? {},
    absolutePath,
    relativePath: rel,
  };
}

/**
 * content/docs 以下の .md / .mdx を再帰探索し、slug 配列（セグメント配列）一覧を返す
 * 例:
 *  - content/docs/index.md                        -> []
 *  - content/docs/assignments.md                  -> ['assignments']
 *  - content/docs/runbooks/local-smoke.md         -> ['runbooks','local-smoke']
 */
export async function getAllDocSlugs(): Promise<string[][]> {
  const results: string[][] = [];

  async function walk(dirAbs: string, baseSegs: string[] = []) {
    const entries = await fs.readdir(dirAbs, { withFileTypes: true });
    for (const ent of entries) {
      const abs = path.join(dirAbs, ent.name);
      if (ent.isDirectory()) {
        await walk(abs, [...baseSegs, ent.name]);
      } else if (ent.isFile()) {
        if (!/\.mdx?$/.test(ent.name)) continue;

        if (/^index\.mdx?$/.test(ent.name)) {
          // ディレクトリ直下の index は baseSegs が slug
          results.push(baseSegs);
        } else {
          const stem = ent.name.replace(/\.mdx?$/, '');
          results.push([...baseSegs, stem]);
        }
      }
    }
  }

  await walk(DOCS_ROOT);

  // 重複排除
  const seen = new Set<string>();
  return results.filter((s) => {
    const key = s.join('/');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
