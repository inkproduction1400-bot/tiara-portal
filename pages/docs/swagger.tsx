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
        {/* CSS はCDN経由。_app.tsxで読み込んでいる場合は重複OK（副作用なし） */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"
        />
      </Head>

      <div id="swagger-ui" />

      {/* 1) ライブラリ読込（bundle → preset の順） */}
      <Script
        src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"
        strategy="afterInteractive"
      />

      {/* 2) 初期化。両オブジェクトが揃うまでポーリングしてから実行 */}
      <Script
        id="swagger-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
(function initSwagger(){
  function tryInit() {
    var w = window;
    if (w.SwaggerUIBundle && w.SwaggerUIStandalonePreset) {
      w.SwaggerUIBundle({
        url: "/openapi.yaml",
        dom_id: "#swagger-ui",
        presets: [w.SwaggerUIBundle.presets.apis, w.SwaggerUIStandalonePreset],
        layout: "BaseLayout",
        deepLinking: true,
        docExpansion: "none",            // お好みで
        defaultModelsExpandDepth: -1     // Modelツリーを閉じる
      });
    } else {
      setTimeout(tryInit, 50);
    }
  }
  tryInit();
})();`,
        }}
      />
    </>
  );
}
