import Head from "next/head";

export default function Actions() {
  return (
    <>
      <Head>
        <title>次アクション</title>
      </Head>
      <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h1>🚀 次アクション</h1>
        <p>現在の進捗を踏まえた、私の優先タスクと高橋さんとの連携事項を整理しました。</p>

        <h2>🔹 優先タスク（私）</h2>
        <ol>
          <li>
            <strong>ポータル整備</strong>  
            - ルール（仮）、質問票、WBS、ERDの各ページを整理し、高橋さんが参照できる状態にする。
          </li>
          <li>
            <strong>Prisma Schema（ERD）実装準備</strong>  
            - ER図（Mermaid）をベースに Prisma スキーマへ落とし込み開始。  
            - DBマイグレーションPoCを stg 環境で試す。
          </li>
          <li>
            <strong>PM向け質問票の提出</strong>  
            - MosP連携方式（API or バッチ）、Chatwootホスティング方法（SaaS or 自前）などを確認依頼。  
            - キャストカード4項目、アイコン5種、印刷体裁の最終決定を依頼。
          </li>
        </ol>

        <h2>🔹 PMとの連携ポイント</h2>
        <ul>
          <li>既存DB（WordPress名簿）の提供フォーマット（CSV or SQL）</li>
          <li>店舗リストの追加項目フォーマット（Excel雛形）</li>
          <li>LIFF応募フォームに必要な必須項目・同意文言のFIX</li>
          <li>テスト計画（12月中旬トライアル参加キャスト/スタッフのデータ連携）</li>
        </ul>

        <h2>🔹 今後の流れ</h2>
        <ol>
          <li>ポータルを完成させ、高橋さんに共有</li>
          <li>回答を反映 → ERD & Prisma Schema確定</li>
          <li>バックエンドAPI試作（applications / shifts / attendances）</li>
          <li>フロント側にUI（デザイナー成果物）を順次統合</li>
        </ol>

        <p style={{ marginTop: "2rem", color: "red" }}>
          ※現時点では「MosP連携方式」「Chatwootホスティング」「カード表示項目」が未確定。  
          → 回答を受けてスキーマ・APIを確定させる必要あり。
        </p>
      </main>
    </>
  );
}
