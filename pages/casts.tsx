// pages/casts.tsx
import { useEffect, useState } from 'react';

type Cast = {
  id: string;
  name: string;
  nickname?: string;
  wage?: number;
  rating?: number;
  genre?: string[];
  drinkable?: boolean;
  owner?: string;
  active?: boolean;
};

export default function CastsPage() {
  const [list, setList] = useState<Cast[]>([]);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const url = `/api/casts?limit=50${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}`;
    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((j) => setList(j.data ?? []))
      .catch(() => {});
    return () => controller.abort();
  }, [keyword]);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <h1>キャスト一覧</h1>
      <input
        placeholder="名前で検索"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ padding: 8, margin: '12px 0', width: 280 }}
      />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">名前</th>
            <th align="left">ニックネーム</th>
            <th align="right">時給</th>
            <th align="right">評価</th>
            <th align="left">タグ</th>
            <th align="center">飲める</th>
          </tr>
        </thead>
        <tbody>
          {list.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.nickname ?? '-'}</td>
              <td align="right">{c.wage ?? '-'}</td>
              <td align="right">{c.rating ?? '-'}</td>
              <td>{(c.genre ?? []).join(', ')}</td>
              <td align="center">{c.drinkable ? '◯' : '−'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
