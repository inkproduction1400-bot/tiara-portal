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
        {/* Swagger UI CSS */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"
        />
      </Head>

      <div id="swagger-ui" />

      {/* 1) Swagger JS (bundle → preset の順) */}
      <Script
        src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"
        strategy="afterInteractive"
      />

      {/* 2) 両オブジェクトが読み込まれてから初期化 */}
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
        docExpansion: "list",              // エンドポイントを展開表示
        defaultModelsExpandDepth: 1,       // ★ Models (Schemas) セクションを表示
        defaultModelExpandDepth: 1,        // ★ 各モデル内のプロパティを1階層展開
        defaultModelRendering: "model",    // ★ Exampleではなく型表示を優先
        showExtensions: true,              // 拡張情報も表示
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
