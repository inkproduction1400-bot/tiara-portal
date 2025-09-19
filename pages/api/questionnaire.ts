// /pages/api/questionnaire.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabaseServer"

type QA = {
  question_key: string;
  question_text: string;
  answer?: string;
  author?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // 全Q&A取得（更新順）
      const { data, error } = await supabaseAdmin
        .from("questionnaire_answers")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json(data ?? []);
    }

    if (req.method === "POST") {
      // 配列でも単体でも受け取れるように
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const payload: QA[] = Array.isArray(body) ? body : [body];

      // onConflict=question_key で upsert（上書き）
      const { error } = await supabaseAdmin
        .from("questionnaire_answers")
        .upsert(
          payload.map((q) => ({
            question_key: q.question_key,
            question_text: q.question_text,
            answer: q.answer ?? "",
            author: q.author ?? "",
            updated_at: new Date().toISOString(),
          })),
          { onConflict: "question_key" }
        );

      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).end("Method Not Allowed");
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message ?? "Internal Server Error" });
  }
}
