// /pages/questionnaire.tsx
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

// セクション別の質問定義（キーは固定IDとして保存に使います）
const QUESTIONS = [
  // 1. MosP（勤怠管理）連携
  { key: "mosp_mode",     text: "勤怠データは API連携 / CSVバッチ のどちらがいいですか？", section: "1. MosP（勤怠管理）連携" },
  { key: "mosp_timing",   text: "同期のタイミング（リアルタイム / 日次バッチ）はどちらを想定しますか？", section: "1. MosP（勤怠管理）連携" },

  // 2. Chatwoot（チャット連携）
  { key: "cw_hosting",    text: "Chatwootは SaaS版を利用しますか？ それとも自前ホストしますか？", section: "2. Chatwoot（チャット連携）" },

  // 3. データ移行
  { key: "migrate_when",  text: "既存WordPress由来の登録者名簿DB（CSV / SQL）の共有時期", section: "3. データ移行" },
  { key: "shop_fields",   text: "店舗リストに追加すべき項目（年齢制限・ジャンル・NG条件など）が先に分かると嬉しいです", section: "3. データ移行" },

  // 4. UI/要件確定
  { key: "card_fields",   text: "キャストカードに表示する「テキスト4項目」と「アイコン最大5種」をご指定ください。", section: "4. UI/要件確定" },
  { key: "print_layout",  text: "印刷レイアウト（一覧/個別、縦横A4など）は事前にFIXが必要です。", section: "4. UI/要件確定" },
];

type QA = {
  question_key: string;
  question_text: string;
  answer?: string;
  author?: string;
};

export default function Questionnaire() {
  const [author, setAuthor] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // 既存の回答を読み込み
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/questionnaire");
        if (!res.ok) throw new Error("回答の取得に失敗しました");
        const data: QA[] = await res.json();

        const init: Record<string, string> = {};
        let lastAuthor = "";
        for (const row of data) {
          init[row.question_key] = row.answer ?? "";
          if (!lastAuthor && row.author) lastAuthor = row.author;
        }
        setAuthor(lastAuthor);
        setAnswers(init);
        setLoading(false);
      } catch (e: any) {
        setError(e.message || "読み込みエラー");
        setLoading(false);
      }
    })();
  }, []);

  const payload = useMemo<QA[]>(() => {
    return QUESTIONS.map((q) => ({
      question_key: q.key,
      question_text: q.text,
      answer: answers[q.key] ?? "",
      author: author || "",
    }));
  }, [answers, author]);

  const save = async () => {
    try {
      setSaving(true);
      setError(null);
      setOk(null);
      const res = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("保存に失敗しました");
      setOk("保存しました");
      setTimeout(() => setOk(null), 2000);
    } catch (e: any) {
      setError(e.message || "保存エラー");
    } finally {
      setSaving(false);
    }
  };

  // セクションごとにまとめる
  const sections = Array.from(new Set(QUESTIONS.map(q => q.section)));

  return (
    <>
      <Head>
        <title>質問票（PM確認用）</title>
      </Head>
      <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h1>📝 質問票（PM確認用）</h1>
        <p>以下の内容についてご確認・ご記入をお願いします。保存すると共有DBに反映されます。</p>

        {loading && <p>読み込み中…</p>}
        {error && <p style={{ color: "crimson" }}>エラー：{error}</p>}
        {ok && <p style={{ color: "#059669" }}>{ok}</p>}

        {!loading && !error && (
          <>
            {/* 記入者 */}
            <div style={{ margin: "12px 0" }}>
              <label style={{ fontSize: 12, color: "#6b7280" }}>記入者（PM名など任意）</label><br />
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="例）PM 田中"
                style={{ marginTop: 6, width: 320, padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8 }}
              />
            </div>

            {/* セクションごとに表示 */}
            {sections.map((sec) => (
              <section key={sec} style={{ marginTop: 24 }}>
                <h2>{sec}</h2>
                <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
                  {QUESTIONS.filter(q => q.section === sec).map((q) => (
                    <div key={q.key} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>{q.text}</div>
                      <textarea
                        value={answers[q.key] || ""}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                        placeholder="ここに回答を入力"
                        rows={3}
                        style={{ width: "100%", padding: 10, border: "1px solid #d1d5db", borderRadius: 8, resize: "vertical" }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <p style={{ marginTop: "2rem", color: "red" }}>
              ※この質問票は初期ドラフトです。回答に応じてWBSやERDを更新します。
            </p>

            <div style={{ marginTop: 16 }}>
              <button
                onClick={save}
                disabled={saving}
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #1d4ed8",
                  fontWeight: 700,
                }}
              >
                {saving ? "保存中…" : "💾 保存"}
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}
