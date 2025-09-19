import Head from "next/head";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import dayjs, { Dayjs } from "dayjs";

const headerHints = {
  title: ["タスク", "タスク名", "項目", "Task", "Title", "Subject"],
  start: ["開始", "開始日", "Start"],
  end: ["終了", "終了日", "End", "Due"],
  progress: ["進捗", "進捗率", "%", "Progress"],
  owner: ["担当", "担当者", "Owner", "Assignee"],
  status: ["状態", "ステータス", "Status"],
};

function weekRange(base: Dayjs) {
  const start = base.startOf("week"); // 月曜始まりにしたい場合は .add(1,"day")
  const end = base.endOf("week");
  return { start, end };
}
function overlapsWeek(start: Dayjs | null, end: Dayjs | null, wkStart: Dayjs, wkEnd: Dayjs) {
  if (!start && !end) return false;
  const s = start ?? dayjs("1900-01-01");
  const e = end ?? dayjs("2999-12-31");
  return s.isBefore(wkEnd) && e.isAfter(wkStart);
}
function normalizeProgress(v: any): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return Math.max(0, Math.min(100, v));
  const s = String(v).trim().replace("%", "");
  const n = Number(s);
  return isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
}
function parseDate(v: any): Dayjs | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    const iso = dayjs(new Date(Date.UTC(d.y, (d.m || 1) - 1, d.d || 1, d.H || 0, d.M || 0, d.S || 0)));
    return iso.isValid() ? iso : null;
  }
  const parsed = dayjs(v);
  return parsed.isValid() ? parsed : null;
}

/** ヘッダセルから「週の開始日」を抽出（数値/Date/文字列） */
function dateFromHeaderCellRaw(h: any): { month?: number; day?: number; year?: number } | null {
  if (typeof h === "number" && Number.isFinite(h)) {
    const d = XLSX.SSF.parse_date_code(h);
    if (d) return { year: d.y, month: d.m || 1, day: d.d || 1 };
  }
  const s = String(h ?? "").trim();
  if (!s) return null;

  // YYYY/MM/DD や YYYY-MM-DD
  const ymd = s.match(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymd) return { year: +ymd[1], month: +ymd[2], day: +ymd[3] };

  // M/D / M-D / M.D （年なし）
  const md = s.match(/(^|[^0-9])(\d{1,2})[\/\-\.](\d{1,2})([^0-9]|$)/);
  if (md) return { month: +md[2], day: +md[3] };

  // レンジ（例: 9/22-9/28）の先頭
  const range = s.match(/(\d{1,2})[\/\-\.](\d{1,2}).*?(\d{1,2})[\/\-\.](\d{1,2})/);
  if (range) return { month: +range[1], day: +range[2] };

  return null;
}

/** ヘッダ行を自動検出：日付らしきセルが一定数ある行をヘッダとみなす */
function detectHeaderRow(rows: any[][]): number {
  const MAX_SCAN = Math.min(10, rows.length);
  let bestIdx = 0;
  let bestScore = -1;
  for (let i = 0; i < MAX_SCAN; i++) {
    const row = rows[i] || [];
    let score = 0;
    for (const cell of row) if (dateFromHeaderCellRaw(cell)) score++;
    // 「タスク名」等のヒントがあれば加点
    for (const cell of row) {
      const s = String(cell || "").toLowerCase();
      if (["タスク", "タスク名", "task", "title", "項目"].some(k => s.includes(k))) score += 2;
    }
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  return bestIdx;
}

/** 年なしヘッダの年補完：左→右で月が小さくなったら年+1 */
function inflateWeekHeaders(headerRow: any[]): { i: number; date: Dayjs }[] {
  // まず「年が書いてある」最初のヘッダを拾う。無ければ今年を初期年に。
  let curYear = dayjs().year();
  for (const h of headerRow) {
    const p = dateFromHeaderCellRaw(h);
    if (p?.year) { curYear = p.year; break; }
  }

  const out: { i: number; date: Dayjs }[] = [];
  let prevMonth = 0;

  for (let i = 0; i < headerRow.length; i++) {
    const p = dateFromHeaderCellRaw(headerRow[i]);
    if (!p) continue;

    let y = p.year ?? curYear;
    let m = p.month ?? 1;
    const d = p.day ?? 1;

    // 年なしで月が小さくなった → 年繰り上げ
    if (!p.year && prevMonth && m < prevMonth) y += 1;

    const dt = dayjs(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    if (dt.isValid()) {
      out.push({ i, date: dt.startOf("day") });
      curYear = y;
      prevMonth = m;
    }
  }

  // 左→右の順に揃える
  out.sort((a, b) => a.date.valueOf() - b.date.valueOf());
  return out;
}

type Row = {
  title: string;
  start: Dayjs | null;
  end: Dayjs | null;
  progress: number;
  owner?: string;
  status?: string;
};

function ProgressInner() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/docs/WBS.xlsx");
        if (!res.ok) throw new Error("WBSファイルにアクセスできませんでした");
        const ab = await res.arrayBuffer();
        const wb = XLSX.read(ab, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];

        // 配列モードで取り出し、ヘッダ行を自動検出
        const rowsArray: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
        if (!rowsArray.length) throw new Error("WBSのシートにデータがありません");

        const headerRowIdx = detectHeaderRow(rowsArray);
        const headerRow = rowsArray[headerRowIdx] || [];
        const dataRows = rowsArray.slice(headerRowIdx + 1);

        // 意味列の位置
        const findIndex = (cands: string[]) =>
          headerRow.findIndex((h) => cands.some((k) => String(h).toLowerCase().includes(k.toLowerCase())));
        const idxTitle  = findIndex(headerHints.title);
        const idxStart  = findIndex(headerHints.start);
        const idxEnd    = findIndex(headerHints.end);
        const idxProg   = findIndex(headerHints.progress);
        const idxOwner  = findIndex(headerHints.owner);
        const idxStatus = findIndex(headerHints.status);

        if (idxTitle < 0) throw new Error("『タスク名』に相当する列が見つかりませんでした（例：タスク/項目/Task）");

        // 週マス列（年補完付き）
        const weekCols = inflateWeekHeaders(headerRow); // {i, date}
        if (weekCols.length === 0) {
          throw new Error("週のヘッダ（日付列）が検出できませんでした。例：9-22 / 9/22 / 2025-09-22");
        }

        // 行パース：●など“空でない文字”が入っている週を開始/終了として推定
        const parsed: Row[] = dataRows.map((r) => {
          const title = String(r[idxTitle] ?? "").trim();
          if (!title) return null;

          const owner  = idxOwner >= 0 ? String(r[idxOwner] ?? "") : "";
          const status = idxStatus >= 0 ? String(r[idxStatus] ?? "") : "";
          const progress = idxProg >= 0 ? normalizeProgress(r[idxProg]) : 0;

          let start = idxStart >= 0 ? parseDate(r[idxStart]) : null;
          let end   = idxEnd   >= 0 ? parseDate(r[idxEnd])   : null;

          if (!start && !end) {
            const hits = weekCols.filter(({ i }) => {
              const v = r[i];
              // 図形塗りは拾えないが、●/•/○/1 等の“文字”なら拾える
              return v !== null && v !== undefined && String(v).trim() !== "";
            });
            if (hits.length > 0) {
              start = hits[0].date.startOf("day");
              end   = hits[hits.length - 1].date.endOf("week");
            }
          }

          return { title, start, end, progress, owner, status } as Row;
        }).filter((x): x is Row => !!x);

        setRows(parsed);
        setLoading(false);
      } catch (e: any) {
        setError(e?.message || "読み込み中にエラーが発生しました");
        setLoading(false);
      }
    })();
  }, []);

  // 概況集計
  const summary = useMemo(() => {
    if (rows.length === 0) return { avg: 0, total: 0, started: 0, finished: 0 };
    const avg = Math.round(rows.reduce((acc, r) => acc + r.progress, 0) / rows.length);
    const now = dayjs();
    const started = rows.filter((r) => r.start && r.start.isBefore(now)).length;
    const finished = rows.filter((r) => r.progress >= 100 || (r.end && r.end.isBefore(now) && r.progress >= 99)).length;
    return { avg, total: rows.length, started, finished };
  }, [rows]);

  // 今週/来週
  const now = dayjs();
  const thisWeek = weekRange(now);
  const nextWeek = weekRange(now.add(1, "week"));

  const tasksThisWeek = useMemo(
    () => rows
      .filter((r) => overlapsWeek(r.start, r.end, thisWeek.start, thisWeek.end))
      .sort((a, b) => (a.start?.valueOf() || 0) - (b.start?.valueOf() || 0)),
    [rows, thisWeek.start, thisWeek.end]
  );
  const tasksNextWeek = useMemo(
    () => rows
      .filter((r) => overlapsWeek(r.start, r.end, nextWeek.start, nextWeek.end))
      .sort((a, b) => (a.start?.valueOf() || 0) - (b.start?.valueOf() || 0)),
    [rows, nextWeek.start, nextWeek.end]
  );

  return (
    <>
      <Head><title>進捗ダッシュボード</title></Head>
      <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h1>📈 進捗ダッシュボード</h1>
        <p>WBS（Excel）を読み込み、進捗の概況と「今週 / 来週」のタスクを抜粋表示します。</p>

        {loading && <p>読み込み中...</p>}
        {error && <p style={{ color: "crimson" }}>エラー：{error}</p>}

        {!loading && !error && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", margin: "16px 0" }}>
              <Card title="平均進捗"><Big>{summary.avg}%</Big></Card>
              <Card title="タスク総数"><Big>{summary.total}</Big></Card>
              <Card title="開始済み"><Big>{summary.started}</Big></Card>
              <Card title="完了済み"><Big>{summary.finished}</Big></Card>
            </div>

            <Section title={`🗓 今週 (${thisWeek.start.format("YYYY/MM/DD")} - ${thisWeek.end.format("YYYY/MM/DD")})`} tasks={tasksThisWeek} />
            <Section title={`🗓 来週 (${nextWeek.start.format("YYYY/MM/DD")} - ${nextWeek.end.format("YYYY/MM/DD")})`} tasks={tasksNextWeek} />
          </>
        )}
      </main>
    </>
  );
}

// ---- UI ----
function Card(props: { title: string; children: any }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{props.title}</div>
      <div>{props.children}</div>
    </div>
  );
}
function Big(props: { children: any }) {
  return <div style={{ fontSize: 28, fontWeight: 700, color: "#111827" }}>{props.children}</div>;
}
function Section(props: { title: string; tasks: Row[] }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ color: "#2563eb" }}>{props.title}</h2>
      {props.tasks.length === 0 ? (
        <p style={{ color: "#6b7280" }}>該当タスクはありません。</p>
      ) : (
        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
          {props.tasks.map((t, i) => <TaskItem key={i} row={t} />)}
        </div>
      )}
    </section>
  );
}
function TaskItem({ row }: { row: Row }) {
  const start = row.start?.format("MM/DD") ?? "—";
  const end = row.end?.format("MM/DD") ?? "—";
  const pct = Math.max(0, Math.min(100, Math.round(row.progress)));
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 600, color: "#111827" }}>{row.title}</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>{start} → {end}</div>
      </div>
      <div style={{ marginTop: 8, height: 10, background: "#f3f4f6", borderRadius: 999 }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: "#60a5fa" }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: "#374151" }}>
        進捗: <strong>{pct}%</strong>
        {row.owner ? <>　/ 担当: {row.owner}</> : null}
        {row.status ? <>　/ 状態: {row.status}</> : null}
      </div>
    </div>
  );
}

// xlsx をブラウザで読むため SSR 無効
function Progress() { return <ProgressInner />; }
export default dynamic(() => Promise.resolve(Progress), { ssr: false });
