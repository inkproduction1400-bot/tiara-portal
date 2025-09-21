# Tiara System Portal (勤怠管理システム)

中洲人材派遣「ティアラネット」向けの勤怠・配車・連絡基盤。  
PWA（モバイル）＋ Web 管理を想定。**Backend MVP（安全・再現・ドキュメント）**まで整備済み。

---

## 📦 技術スタック

- **Next.js** (API Routes)
- **Supabase (Postgres)**：RLS / Migration / Studio
- **TypeScript**
- **ts-node**（seed）
- **zod**（APIバリデーション）

---

## 🔐 環境変数

`.env.local`（**コミットしない**）に以下を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=...           # Supabase プロジェクトURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...      # anon キー（フロント用）
SUPABASE_SERVICE_ROLE_KEY=...          # Service Role キー（API/seed 用・厳重管理）
