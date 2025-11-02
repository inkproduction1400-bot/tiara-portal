# Tiara API 開発ポータル

ここは Tiara API リポジトリの開発者向けポータルです。  
日々の開発で **「最初に開く場所」** を想定しています。

---

## 目次

- 👟 [クイックスタート](#-クイックスタート)
- 🧰 [よく使う資料](#-よく使う資料)
- 🧪 [スモークテスト（ローカル）](#-スモークテストローカル)
- 🧾 [運用ノート / ランブック](#-運用ノート--ランブック)
- 🛠 [スクリプトと Make ターゲット](#-スクリプトと-make-ターゲット)
- 🧱 [スキーマ / マイグレーション](#-スキーマ--マイグレーション)
- 🧭 [API ドキュメント（Swagger / Redoc）](#-api-ドキュメントswagger--redoc)
- 🔗 [相互リンクと公開](#-相互リンクと公開について)
- ✅ [仕上げチェックリスト](#-仕上げチェックリスト)

---

## 👟 クイックスタート

1. `.env` を準備（DB / API ポート等）
2. 管理者ロールを初期化
   ```bash
   make bootstrap
起動

bash
コードをコピーする
make up
動作確認（スモーク）

bash
コードをコピーする
make smoke
📘 詳細手順は → ローカルスモーク・ランブック に記載。

🧰 よく使う資料
🗂 Assignments 機能の仕様と確認手順 → ./assignments.md

🧪 ローカルスモーク・ランブック → ./runbooks/local-smoke.md

🧪 スモークテスト（ローカル）
最低限の健康チェックとルーティング確認：

bash
コードをコピーする
make up
make smoke
/api/v1/health が { ok: true } を返すこと

Nest のログに
Mapped {/api/v1/shops/:shopId/assignments, ...} が出力されること

SHOP/CAST 作成、割当の POST/LIST/PATCH の詳細は
ローカルスモーク・ランブック を参照。

🧾 運用ノート / ランブック
ローカル環境でのスモーク手順 → runbooks/local-smoke.md

（将来）ステージング/本番のローンチ手順 → runbooks/launch-stg.md / runbooks/launch-prod.md

（将来）障害対応メモ → runbooks/incidents.md

💡 ランブックは 「失敗を再現できるほど具体的に」 書くのが鉄則です。
使ったコマンド、環境変数、期待結果、実結果、ログ抜粋、次の分岐…まで明記。

🛠 スクリプトと Make ターゲット
スクリプト
scripts/assignments.sh
→ post / list / patch を関数化。x-user-id は自動で admin@example.com の ID を解決。

例：

bash
コードをコピーする
./scripts/assignments.sh post "$SHOP_ID" "$CAST_ID" "2025-11-01T18:00:00Z" 1
./scripts/assignments.sh list "$SHOP_ID" "2025-11-01"
./scripts/assignments.sh patch "$SHOP_ID" "$ASSIGN_ID" status=assigned priority=3 assignedTo=2025-11-01T21:00:00Z
scripts/bootstrap-role-admin.sql
→ roles の admin/staff 作成、admin@example.com の作成と admin 付与

Make ターゲット（抜粋）
bash
コードをコピーする
make build        # nest build
make up           # build + docker compose up -d
make logs         # 直近ログ
make down         # 停止
make bootstrap    # admin 付与（OWNER_DATABASE_URL 必須）
make smoke        # 最小スモーク（health / assignments ルート）
make assign-post  # アサイン作成（FROM など変数で指定）
make assign-list  # 指定日の一覧
make assign-patch # 既存アサインの更新
詳細な引数や例は → ローカルスモーク・ランブック

🧱 スキーマ / マイグレーション
Prisma スキーマ: prisma/schema.prisma

DB 変更は 必ず Prisma Migration 経由 で行い、migrate deploy を適用。

Neon（本番）では OWNER と APP の接続文字列の違いに注意（権限 & _prisma_migrations の有無）。

🧭 API ドキュメント（Swagger / Redoc）
種類	URL
開発 (Swagger)	http://localhost:4000/docs
本番 (Swagger)	https://<your-host>/api/v1/docs
Redoc (静的ビューワ)	/docs/api

Redoc は public/openapi.yaml を参照します。

/docs/api ページで OpenAPI 定義を直接ブラウザ表示できます。

Swagger をポータルから開く場合は /docs/swagger から（リバースプロキシ／埋め込み構成に応じて運用）。

🔗 相互リンクと公開について
相対リンクで統一（GitHub 上でも機能）
例：[ローカルスモーク](./runbooks/local-smoke.md)、[Assignments](./assignments.md) のように ./ から始める。

docs/assignments.md・docs/runbooks/local-smoke.md とファイル名を一致させる。

GitHub Pages で公開（任意）
GitHub の Settings → Pages で Source: GitHub Actions を選び、以下のワークフローで docs/ を静的公開：

yml
コードをコピーする
name: Publish docs to GitHub Pages
on:
  push:
    branches: [ main ]
    paths:
      - 'docs/**'
      - '.github/workflows/pages.yml'

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
これで https://<org>.github.io/<repo>/ に docs/ 直下が公開されます。
将来 MkDocs 等でナビ/検索を付ける場合は mkdocs.yml を追加。

✅ 仕上げチェックリスト
docs/index.md をこの内容で更新

docs/assignments.md / docs/runbooks/local-smoke.md が存在

README.md の先頭近くに 開発ポータル（docs/index.md） へのリンクを追加

md
コードをコピーする
👉 開発者向けポータルは **[docs/index.md](./docs/index.md)** を参照
本ポータルは、開発ナレッジの一元化 を目的に進化させていきます。
運用・ランブック・スクリプト・API仕様をここに統合していきましょう 🚀