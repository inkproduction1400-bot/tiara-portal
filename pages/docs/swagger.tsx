// pages/docs/swagger.tsx
import Head from "next/head";
import Script from "next/script";

declare global {
  interface Window {
    SwaggerUIBundle: any;
    SwaggerUIStandalonePreset: any;
  }
}

export default function SwaggerUIPage() {
  return (
    <>
      <Head>
        <title>OpenAPI (Swagger UI)</title>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"
        />
      </Head>

      <div id="swagger-ui" />

      {/* 1) ライブラリ読込 */}
      <Script
        src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"
        strategy="afterInteractive"
        // 2) 読み込み完了後に初期化（/openapi.yaml を読む）
        onLoad={() => {
          window.SwaggerUIBundle({
            url: "/openapi.yaml",
            dom_id: "#swagger-ui",
            presets: [
              window.SwaggerUIBundle.presets.apis,
              window.SwaggerUIStandalonePreset,
            ],
            layout: "BaseLayout",
          });
        }}
      />
    </>
  );
}
