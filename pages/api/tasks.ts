// pages/api/tasks.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabaseServer";

type Task = {
  title: string;
  start?: string;   // YYYY-MM-DD
  end?: string;
  started?: boolean;
  done?: boolean;
  progress?: number;
  row_index?: number; // 表示順固定用
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // 並び順は row_index → start → title の優先順位で固定
      const { data, error } = await supabaseAdmin
        .from("tasks")
        .select("*")
        .order("row_index", { ascending: true, nullsFirst: false })
        .order("start", { ascending: true, nullsFirst: false })
        .order("title", { ascending: true });

      if (error) throw error;

      const payload = (data || []).map((r: any) => ({
        title: r.title,
        start: r.start || "",
        end: r.end || "",
        started: !!r.started,
        done: !!r.done,
        progress: r.progress ?? 0,
        row_index: r.row_index ?? null,
      }));

      return res.status(200).json(payload);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const arrRaw: Task[] = Array.isArray(body) ? body : [];

      // 軽い正規化（titleのtrim、空文字は除外）
      const arr: Task[] = arrRaw
        .map((t) => ({ ...t, title: (t.title ?? "").trim() }))
        .filter((t) => t.title.length > 0);

      // 既存タイトル一覧を取得（完全同期のため）
      const { data: existing, error: exErr } = await supabaseAdmin.from("tasks").select("title");
      if (exErr) throw exErr;
      const existingTitles = new Set((existing || []).map((x: any) => x.title));

      // upsert（row_index 未指定は配列順で採番）
      if (arr.length) {
        const upsertPayload = arr.map((t, i) => ({
          title: t.title,
          start: t.start || null,
          end: t.end || null,
          started: !!t.started,
          done: !!t.done,
          progress: t.progress ?? 0,
          row_index: typeof t.row_index === "number" ? t.row_index : i + 1,
          updated_at: new Date().toISOString(),
        }));

        const { error: upsertError } = await supabaseAdmin
          .from("tasks")
          .upsert(upsertPayload, { onConflict: "title" }); // title に UNIQUE 制約前提

        if (upsertError) throw upsertError;
      }

      // 送られてこなかったタイトルは削除（完全同期）
      const incomingTitles = new Set(arr.map((t) => t.title));
      const toDelete = [...existingTitles].filter((t) => !incomingTitles.has(t));
      if (toDelete.length) {
        const { error: delErr } = await supabaseAdmin
          .from("tasks")
          .delete()
          .in("title", toDelete);
        if (delErr) throw delErr;
      }

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).end();
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Internal Server Error" });
  }
}
