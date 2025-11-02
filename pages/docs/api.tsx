// pages/docs/api.tsx
import Head from "next/head";
import Script from "next/script";

export default function RedocPage() {
  return (
    <>
      <Head>
        <title>API (ReDoc)</title>
      </Head>

      <div id="redoc-container" />

      <Script
        src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"
        strategy="afterInteractive"
        onLoad={() => {
          // /openapi.yaml を描画
          (window as any).Redoc.init(
            "/openapi.yaml",
            {
              hideDownloadButton: false,
              expandResponses: "200,201,4xx,5xx",
              // 必要に応じてオプション追加
            },
            document.getElementById("redoc-container")
          );
        }}
      />
    </>
  );
}
