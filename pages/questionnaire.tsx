// pages/questionnaire.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

type Question   = { id: string; label: string; placeholder?: string };
type Section    = { id: string; title: string; items: Question[] };
type SchemaData = { version: string; sections: Section[] };
type AnswersData = Record<string, string>;

/** フル幅＋縦オートリサイズのテキストエリア */
function AutoTextarea({
  value,
  onChange,
  placeholder,
  minRows = 3,
  maxPx = 600,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  minRows?: number;
  maxPx?: number;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const autoresize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = parseInt(getComputedStyle(el).lineHeight || '20', 10);
    const minHeight = lineHeight * minRows + 12;
    el.style.height = Math.max(minHeight, Math.min(el.scrollHeight, maxPx)) + 'px';
  };

  useEffect(() => { autoresize(); }, [value]);
  useEffect(() => { autoresize(); }, []);

  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      onChange={(e) => { onChange(e); requestAnimationFrame(autoresize); }}
      placeholder={placeholder}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        resize: 'none',
        padding: '12px',
        border: '1px solid #d1d5db',
        borderRadius: 8,
        lineHeight: '1.6',
        fontSize: 14,
        background: '#fff',
        maxHeight: maxPx,
      }}
    />
  );
}

/** 初期スキーマ（Excel取込のフォールバック） */
const DEFAULT_SCHEMA: SchemaData = {
  version: 'v1',
  sections: [
    {
      id: '1-業務運用の確定事項',
      title: '1. 業務・運用の確定事項',
      items: [
        { id: '1-業務運用の確定事項-q1', label: '【役割と端末】', placeholder: 'キャスト/管理者（担当スタッフ）/派遣先（来年） × キャスト＝スマホ／管理者・派遣先＝PC' },
        { id: '1-業務運用の確定事項-q2', label: '【オペレーションの正】', placeholder: '登録 ⇨ 面談 ⇨ 合否 ⇨ 出勤連絡 ⇨ 当日欠勤・緊急招集 ⇨ 配置 ⇨ 日報 ⇨ 請求・請求書' },
        { id: '1-業務運用の確定事項-q3', label: '【SLA/反応速度】', placeholder: 'ダッシュボード反映までの目標（LINE連絡 → 10秒以内反映）' },
        { id: '1-業務運用の確定事項-q4', label: '【監査・履歴】', placeholder: '誰が何をいつ変えたか（監査ログの粒度）' },
      ],
    },
    {
      id: '2-画面に出す情報の最終リスト一覧詳細',
      title: '2. 画面に出す情報の最終リスト（一覧・詳細）',
      items: [
        { id: '2-画面に出す情報の最終リスト一覧詳細-q1', label: '【キャスト一覧30件/ページ固定で表示する項目の確定】', placeholder: 'モック画面提出済み（要確認）' },
        { id: '2-画面に出す情報の最終リスト一覧詳細-q2', label: '【キャストカード詳細でのみ出す項目】', placeholder: 'モック画面提出済み（要確認）' },
        { id: '2-画面に出す情報の最終リスト一覧詳細-q3', label: '【アイコンバッチ定義】', placeholder: 'バリエーション種類の確定' },
        { id: '2-画面に出す情報の最終リスト一覧詳細-q4', label: '【並び順の優先規則】', placeholder: 'デフォルトは何順？（例：評価 → 時給 → 名前）' },
      ],
    },
    {
      id: '3-絞り込み検索の仕様',
      title: '3. 絞り込み・検索の仕様',
      items: [
        { id: '3-絞り込み検索の仕様-q1', label: '【絞り込み種類】', placeholder: 'キーワード検索・担当者・時給・ジャンル・飲酒の可否' },
        { id: '3-絞り込み検索の仕様-q2', label: '【複合条件の解決順】', placeholder: 'NG除外（店舗側/キャスト側の双方） ⇨ 出勤中のみ ⇨ ソート' },
      ],
    },
    {
      id: '4-マッチングの業務ルール',
      title: '4. マッチングの業務ルール',
      items: [
        { id: '4-マッチングの業務ルール-q1', label: '【自動化の範囲】', placeholder: 'マッチングの配置確定作業は人力で良い？' },
        { id: '4-マッチングの業務ルール-q2', label: '【条件】', placeholder: '充足条件（必要人数・リクエストキーワード）と除外条件（NG店舗）' },
        { id: '4-マッチングの業務ルール-q3', label: '【配置確定の承認フロー】', placeholder: '誰がOKを出すか／差し戻し／配置確定の操作画面はDBで合っているか／キャスト詳細画面で店舗選択必須／差し戻しのフロー要確認' },
      ],
    },
    {
      id: '5-データ更新整合性',
      title: '5. データ更新・整合性',
      items: [
        { id: '5-データ更新整合性-q1', label: '【出勤・欠勤・緊急招集の通知経路】', placeholder: 'LINEのみ／メール併用なのか？' },
        { id: '5-データ更新整合性-q2', label: '【リアルタイムの定義】', placeholder: 'Pushで即時／ポーリング何秒' },
        { id: '5-データ更新整合性-q3', label: '【画像アップロード（身分証）】', placeholder: '保存先・保持期間・マスキング方針の確定' },
      ],
    },
    {
      id: '6-権限可視性rbac',
      title: '6. 権限・可視性（RBAC）',
      items: [
        { id: '6-権限可視性rbac-q1', label: '【（仮）キャスト用】', placeholder: '自分のプロフィール、シフト申請、担当へ連絡（当日欠勤・当日出勤）、既読未読、通知、出退勤連絡' },
        { id: '6-権限可視性rbac-q2', label: '【エンド用】', placeholder: 'ダッシュボード、スケジュール管理、キャスト管理、店舗管理、チャット（公式LINE）、SOS通知、申請承認、設定' },
        { id: '6-権限可視性rbac-q3', label: '【（仮）派遣先ビュー】', placeholder: '閲覧範囲（自店舗のみ）、評価入力権限' },
      ],
    },
    {
      id: '7-非機能要件',
      title: '7. 非機能要件',
      items: [
        { id: '7-非機能要件-q1', label: '【目標レスポンス（P95/P99）、同時利用者想定】', placeholder: '自由記述' },
        { id: '7-非機能要件-q2', label: '【バックアップ／リストア、個人情報保護（アクセス制御・暗号化・マスキング）】', placeholder: '自由記述' },
        { id: '7-非機能要件-q3', label: '【監視（死活・エラーレート・通知）と障害対応フロー】', placeholder: '自由記述' },
      ],
    },
    {
      id: '8-linechatwoot-運用設計',
      title: '8. LINE/Chatwoot 運用設計',
      items: [
        { id: '8-linechatwoot-運用設計-q1', label: '【公式LINEの構成（スタッフ複数紐付け）とChatwootの収容（インボックス/チーム/権限）】', placeholder: '自由記述' },
        { id: '8-linechatwoot-運用設計-q2', label: '【送受信はテキストのみ、テンプレ化する定型文（欠勤受付、緊急招集、イベント告知）】', placeholder: '自由記述' },
        { id: '8-linechatwoot-運用設計-q3', label: '【既読・未読／反応時間のKPIとダッシュボード反映】', placeholder: '自由記述' },
      ],
    },
  ],
};

const LS_SCHEMA_KEY = 'questionnaire.schema.latest';
const LS_ANS_KEY    = 'questionnaire.answers.latest';

export default function QuestionnairePage() {
  const [author, setAuthor]   = useState('');
  const [schema, setSchema]   = useState<SchemaData>(DEFAULT_SCHEMA);
  const [answers, setAnswers] = useState<AnswersData>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg]   = useState<string | null>(null);

  // 初期ロード：Supabaseの最新（無ければ localStorage → DEFAULT）
  useEffect(() => {
    (async () => {
      try {
        const s = await fetch('/api/questionnaire/schema/load').then(r => r.json()).catch(() => null);
        if (s?.ok && s?.data?.data) {
          setSchema(s.data.data as SchemaData);
          localStorage.setItem(LS_SCHEMA_KEY, JSON.stringify(s.data.data));
        } else {
          const raw = localStorage.getItem(LS_SCHEMA_KEY);
          if (raw) setSchema(JSON.parse(raw));
        }
      } catch {}
      try {
        const a = await fetch('/api/questionnaire/answers/load').then(r => r.json()).catch(() => null);
        if (a?.ok && a?.data?.data) {
          setAnswers(a.data.data as AnswersData);
          localStorage.setItem(LS_ANS_KEY, JSON.stringify(a.data.data));
        } else {
          const raw = localStorage.getItem(LS_ANS_KEY);
          if (raw) setAnswers(JSON.parse(raw));
        }
      } catch {}
    })();
  }, []);

  // スキーマ変更時：answers のキーを補完
  useEffect(() => {
    const ids = new Set(schema.sections.flatMap(sec => sec.items.map(i => i.id)));
    setAnswers(prev => {
      const next = { ...prev };
      ids.forEach(id => { if (!(id in next)) next[id] = ''; });
      return next;
    });
  }, [schema]);

  // 回答の自動保存（800ms デバウンス）
  const debRef = useRef<number | null>(null);
  useEffect(() => {
    if (debRef.current) window.clearTimeout(debRef.current);
    debRef.current = window.setTimeout(async () => {
      try {
        setSaving(true);
        const res = await fetch('/api/questionnaire/answers/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ author, data: answers }),
        });
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error || '保存に失敗しました');
        setSaveMsg('自動保存しました');
        localStorage.setItem(LS_ANS_KEY, JSON.stringify(answers));
      } catch {
        localStorage.setItem(LS_ANS_KEY, JSON.stringify(answers));
        setSaveMsg('ローカルに自動保存しました（オフライン）');
      } finally {
        setSaving(false);
        setTimeout(() => setSaveMsg(null), 1500);
      }
    }, 800);
    return () => { if (debRef.current) window.clearTimeout(debRef.current); };
  }, [answers, author]);

  const onChangeAnswer = (id: string, val: string) =>
    setAnswers(prev => ({ ...prev, [id]: val }));

  // スキーマ保存
  const saveSchema = async () => {
    try {
      setErrMsg(null);
      setSaving(true);
      const res = await fetch('/api/questionnaire/schema/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, data: schema }),
      });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error || 'スキーマ保存失敗');
      localStorage.setItem(LS_SCHEMA_KEY, JSON.stringify(schema));
      setSaveMsg('スキーマを保存しました');
    } catch (e: any) {
      setErrMsg(e?.message ?? 'スキーマ保存失敗');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 1500);
    }
  };

  // 項目追加
  const addQuestion = (secId: string) => {
    setSchema(prev => {
      const copy: SchemaData = JSON.parse(JSON.stringify(prev));
      const sec = copy.sections.find(s => s.id === secId)!;
      const newId = `${secId}-q${sec.items.length + 1}`;
      sec.items.push({ id: newId, label: `【新規項目 ${sec.items.length + 1}】` });
      return copy;
    });
  };

  return (
    <main
      style={{
        margin: '0 auto',
        maxWidth: 960,
        padding: 24,
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        color: '#111827',
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        質問票（単一ページ・常に最新／自動保存）
      </h1>
      <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 20 }}>
        Excelから取り込んだ質問を初期表示。回答は自動保存（API経由／失敗時はローカル）。
      </p>

      {/* ヘッダー操作行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <label style={{ fontSize: 13 }}>作成者（任意）</label>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="例：永井"
          style={{
            border: '1px solid #d1d5db',
            borderRadius: 6,
            padding: '6px 8px',
            width: 220,
            boxSizing: 'border-box',
          }}
        />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={editing} onChange={(e) => setEditing(e.target.checked)} />
            質問編集モード
          </label>
          <button
            onClick={saveSchema}
            disabled={!editing || saving}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: editing && !saving ? '#111827' : '#9ca3af',
              color: '#fff',
              fontWeight: 700,
              border: 'none',
              cursor: editing && !saving ? 'pointer' : 'default',
            }}
          >
            {saving ? '保存中…' : 'スキーマ保存'}
          </button>
        </div>
      </div>

      {/* セクション */}
      {schema.sections.map((sec) => (
        <section
          key={sec.id}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 20,
            background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            marginBottom: 24,
          }}
        >
          {/* タイトル行 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            {editing ? (
              <input
                value={sec.title}
                onChange={(e) =>
                  setSchema((prev) => {
                    const copy: SchemaData = JSON.parse(JSON.stringify(prev));
                    copy.sections.find((x) => x.id === sec.id)!.title = e.target.value;
                    return copy;
                  })
                }
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  padding: '8px 10px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{sec.title}</h2>
            )}
            {editing && (
              <button
                onClick={() => addQuestion(sec.id)}
                style={{
                  fontSize: 13,
                  padding: '6px 10px',
                  border: '1px solid #d1d5db',
                  background: '#f9fafb',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                項目を追加
              </button>
            )}
          </div>

          {/* 設問群 */}
          <div>
            {sec.items.map((q) => (
              <div key={q.id} style={{ marginBottom: 20 }}>
                {editing ? (
                  <input
                    value={q.label}
                    onChange={(e) =>
                      setSchema((prev) => {
                        const copy: SchemaData = JSON.parse(JSON.stringify(prev));
                        const s = copy.sections.find((x) => x.id === sec.id)!;
                        const qi = s.items.find((x) => x.id === q.id)!;
                        qi.label = e.target.value;
                        return copy;
                      })
                    }
                    style={{
                      display: 'block',
                      width: '100%',
                      boxSizing: 'border-box',
                      marginBottom: 8,
                      padding: '8px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontWeight: 700,
                    }}
                  />
                ) : (
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 8,
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#1f2937',
                    }}
                  >
                    {q.label}
                  </label>
                )}

                <AutoTextarea
                  value={answers[q.id] ?? ''}
                  onChange={(e) => onChangeAnswer(q.id, e.target.value)}
                  placeholder={q.placeholder ?? '自由記述'}
                  minRows={3}
                  maxPx={600}
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* ステータス表示 */}
      <div style={{ marginTop: 12, fontSize: 13 }}>
        {saveMsg && <span style={{ color: '#059669', marginRight: 12 }}>{saveMsg}</span>}
        {errMsg && <span style={{ color: '#dc2626' }}>{errMsg}</span>}
      </div>
    </main>
  );
}
