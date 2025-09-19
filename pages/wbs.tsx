// pages/wbs.tsx
import Head from "next/head";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

type Task = {
  title: string;
  start?: string;   // YYYY-MM-DD
  end?: string;     // YYYY-MM-DD
  started?: boolean;
  done?: boolean;
  progress?: number; // 0/50/100（簡易ルール）
};

// 入力ゆれを YYYY-MM-DD に正規化（できない場合はそのまま返す）
const normalizeDateInput = (raw: string) => {
  if (!raw) return "";
  let s = raw.trim();
  s = s.replace(/[./]/g, "-"); // 2025/9/3, 2025.9.3 → 2025-9-3
  // 1桁月日を0埋め
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const y = m[1];
    const mo = m[2].padStart(2, "0");
    const d = m[3].padStart(2, "0");
    return `${y}-${mo}-${d}`;
  }
  // 既に YYYY-MM-DD 形式ならそのまま
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return s; // 判別不能はそのまま（判定側で無視）
};

// 厳密に YYYY-MM-DD のときのみ Dayjs を返す（判別不能は null）
const ymd = (s?: string) =>
  s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? dayjs(s).startOf("day") : null;

// 進捗の簡易ルール：未開始0 / 開始50 / 完了100
const calcProgress = (t: Task) => (t.done ? 100 : t.started ? 50 : 0);

// ✅ 開始判定（未来日は必ず未開始。YYYY-MM-DD 以外は開始判定に使わない）
const isStarted = (t: Task) => {
  if (t.done) return true;

  const startD = ymd(t.start);
  const today = dayjs().startOf("day");

  // 開始日が未来なら、手動フラグがあっても未開始に固定
  if (startD && startD.isAfter(today)) return false;

  // ここまで来たら「手動開始」か「開始日が今日以前」のどちらかで開始扱い
  if (t.started) return true;
  if (startD && !startD.isAfter(today)) return true;

  return false;
};

// 期間が週にかぶるか
const overlaps = (start?: string, end?: string, wkStart?: dayjs.Dayjs, wkEnd?: dayjs.Dayjs) => {
  if (!start && !end) return false;
  const sD = ymd(start) ?? dayjs("1900-01-01");
  const eD = ymd(end) ?? dayjs("2999-12-31");
  return sD.isBefore(wkEnd!) && eD.isAfter(wkStart!);
};

function WbsPageInner() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 起動時：APIから取得。空ならExcelからタスク名だけ取り込み→APIに初期保存
  useEffect(() => {
    (async () => {
      try {
        const apiRes = await fetch("/api/tasks");
        if (!apiRes.ok) throw new Error("タスクデータの取得に失敗しました");
        let data: Task[] = await apiRes.json();

        if (!Array.isArray(data) || data.length === 0) {
          const xlsRes = await fetch("/docs/WBS.xlsx");
          if (!xlsRes.ok) throw new Error("WBS.xlsx にアクセスできませんでした");
          const ab = await xlsRes.arrayBuffer();
          const wb = XLSX.read(ab, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

          if (!json.length) throw new Error("WBSのシートにデータがありません");

          const headers = Object.keys(json[0]);
          const hTitle =
            headers.find((h) =>
              ["タスク", "タスク名", "項目", "task", "title", "subject"].some((k) =>
                h.toLowerCase().includes(k.toLowerCase())
              )
            ) || headers[0];

          const seeded: Task[] = json
            .map((r) => String(r[hTitle] ?? "").trim())
            .filter((t) => t !== "")
            .map<Task>((title) => ({ title, started: false, done: false, progress: 0 }));

          await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(seeded),
          });
          data = seeded;
        }

        // 表示用に正規化（開始判定は厳密に）
        const normalized = data.map((t) => ({
          ...t,
          start: t.start ? normalizeDateInput(t.start) : "",
          end: t.end ? normalizeDateInput(t.end) : "",
          started: isStarted(t),
          done: !!t.done,
          progress: t.progress ?? calcProgress(t),
        }));

        setTasks(normalized);
        setLoading(false);
      } catch (e: any) {
        setError(e?.message || "読み込み中にエラーが発生しました");
        setLoading(false);
      }
    })();
  }, []);

  // 共有保存
  const saveTasks = async (next: Task[]) => {
    setTasks(next);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
  };

  const patchTask = (idx: number, patch: Partial<Task>) => {
    const next = tasks.map((t, i) => {
      if (i !== idx) return t;
      let updated = { ...t, ...patch };

      // 入力ゆれを補正
      if (patch.start !== undefined) updated.start = normalizeDateInput(patch.start || "");
      if (patch.end !== undefined) updated.end = normalizeDateInput(patch.end || "");

      // 完了トグル時：完了→未完了に戻したら end を空に、未完了→完了なら end を補完
      if (patch.done !== undefined) {
        if (patch.done && !t.done && !updated.end) {
          updated.end = dayjs().format("YYYY-MM-DD");
        }
        if (!patch.done && t.done) {
          updated.end = "";
        }
      }

      // 開始トグル時：停止（started=false）なら start をリセット
      if (patch.started !== undefined) {
        if (patch.started && !t.started && !updated.start) {
          updated.start = dayjs().format("YYYY-MM-DD");
        }
        if (!patch.started && t.started) {
          updated.start = "";
        }
      }

      // started を再計算（未来日は必ず false / 非対応形式は無視）
      updated.started = isStarted(updated);

      // 進捗再計算
      updated.progress = calcProgress(updated);

      return updated;
    });
    saveTasks(next);
  };

  // 集計
  const summary = useMemo(() => {
    if (tasks.length === 0) return { avg: 0, total: 0, started: 0, finished: 0 };
    const total = tasks.length;
    const started = tasks.filter((t) => isStarted(t)).length;
    const finished = tasks.filter((t) => t.done).length;
    const avg = Math.round(tasks.reduce((acc, t) => acc + (t.progress ?? calcProgress(t)), 0) / total);
    return { avg, total, started, finished };
  }, [tasks]);

  // 今週/来週
  const now = dayjs();
  const thisWeekStart = now.startOf("week");
  const thisWeekEnd = now.endOf("week");
  const nextWeekStart = now.add(1, "week").startOf("week");
  const nextWeekEnd = now.add(1, "week").endOf("week");

  const tasksThisWeek = tasks.filter((t) => overlaps(t.start, t.end, thisWeekStart, thisWeekEnd));
  const tasksNextWeek = tasks.filter((t) => overlaps(t.start, t.end, nextWeekStart, nextWeekEnd));

  return (
    <>
      <Head>
        <title>WBSガントチャート</title>
      </Head>
      <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h1>📊 WBSガントチャート</h1>
        <p>Excel からタスク名を自動取り込みし、ここで期間・開始・完了を手入力します。入力はサーバーに保存され、チームで共有されます。</p>

        <a
          href="/docs/WBS.xlsx"
          download
          style={{ display: "inline-block", background: "#2563eb", color: "#fff", padding: "8px 12px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}
        >
          ⬇️ WBS.xlsx
        </a>

        <hr style={{ margin: "16px 0" }} />

        {loading && <p>読み込み中...</p>}
        {error && <p style={{ color: "crimson" }}>エラー：{error}</p>}

        {!loading && !error && (
          <>
            {/* 概況カード */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, margin: "16px 0" }}>
              <Card title="平均進捗"><Big>{summary.avg}%</Big></Card>
              <Card title="タスク総数"><Big>{summary.total}</Big></Card>
              <Card title="開始済み"><Big>{summary.started}</Big></Card>
              <Card title="完了済み"><Big>{summary.finished}</Big></Card>
            </div>

            {/* 今週/来週 */}
            <section style={{ marginTop: 8 }}>
              <h2>🗓 今週（{thisWeekStart.format("YYYY/MM/DD")} - {thisWeekEnd.format("YYYY/MM/DD")}）</h2>
              {tasksThisWeek.length === 0 ? (
                <p style={{ color: "#6b7280" }}>該当タスクはありません。</p>
              ) : (
                <ul>
                  {tasksThisWeek.map((t, i) => (
                    <li key={i}>
                      {t.title}（{t.start || "—"} → {t.end || "—"}）
                      {t.done ? " ✅" : isStarted(t) ? " ▶︎" : ""}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section style={{ marginTop: 16 }}>
              <h2>🗓 来週（{nextWeekStart.format("YYYY/MM/DD")} - {nextWeekEnd.format("YYYY/MM/DD")}）</h2>
              {tasksNextWeek.length === 0 ? (
                <p style={{ color: "#6b7280" }}>該当タスクはありません。</p>
              ) : (
                <ul>
                  {tasksNextWeek.map((t, i) => (
                    <li key={i}>
                      {t.title}（{t.start || "—"} → {t.end || "—"}）
                      {t.done ? " ✅" : isStarted(t) ? " ▶︎" : ""}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* 編集UI（手入力＆開始トグル/停止・リセット対応） */}
            <h2 style={{ marginTop: 32 }}>📝 タスク一覧（期間入力・開始/停止・完了の手動更新）</h2>
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              {tasks.map((t, i) => (
                <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ fontWeight: 700, flex: 1 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>進捗: <strong>{t.progress ?? 0}%</strong></div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
                    <label>
                      開始
                      <input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={t.start || ""}
                        onChange={(e) => patchTask(i, { start: e.target.value })}
                        style={{ marginLeft: 6, padding: "4px 6px", border: "1px solid #d1d5db", borderRadius: 6, color: "#111827", background: "#fff" }}
                      />
                    </label>
                    <span>→</span>
                    <label>
                      終了
                      <input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={t.end || ""}
                        onChange={(e) => patchTask(i, { end: e.target.value })}
                        style={{ marginLeft: 6, padding: "4px 6px", border: "1px solid #d1d5db", borderRadius: 6, color: "#111827", background: "#fff" }}
                      />
                    </label>

                    {/* 開始/停止トグル（停止時は開始日もリセット） */}
                    <button
                      onClick={() =>
                        patchTask(
                          i,
                          isStarted(t)
                            ? { started: false, start: "" } // 停止＝解除＆開始日リセット
                            : { started: true, start: t.start || dayjs().format("YYYY-MM-DD") }
                        )
                      }
                      style={{
                        marginLeft: "auto",
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        background: isStarted(t) ? "#fee2e2" : "#dbeafe",
                        fontWeight: 600,
                      }}
                      title={isStarted(t) ? "開始を解除して開始日をリセットします" : "開始日に今日をセット（未入力なら）し、開始状態にします"}
                    >
                      {isStarted(t) ? "⏹ 停止" : "▶︎ 開始"}
                    </button>

                    {/* 完了トグル（未入力なら終了日に今日を補完／解除時は空に） */}
                    <button
                      onClick={() =>
                        patchTask(i, { done: !t.done, end: t.done ? "" : t.end || dayjs().format("YYYY-MM-DD") })
                      }
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        background: t.done ? "#dcfce7" : "#f9fafb",
                        fontWeight: 600,
                      }}
                      title="完了状態を切り替えます。未入力の終了日は今日が入ります。"
                    >
                      {t.done ? "✅ 完了" : "完了にする"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}

function Card(props: { title?: string; children: any }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      {props.title && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{props.title}</div>}
      <div>{props.children}</div>
    </div>
  );
}
function Big(props: { children: any }) {
  return <div style={{ fontSize: 28, fontWeight: 700, color: "#111827" }}>{props.children}</div>;
}

export default dynamic(() => Promise.resolve(WbsPageInner), { ssr: false });
