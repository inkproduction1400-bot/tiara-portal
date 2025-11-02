// app/dev/docs/api/page.tsx
export default function ApiPage() {
    // Redocの公式ホストを iframe で利用（依存衝突を回避）
    const url = `https://redocly.github.io/redoc/?url=${encodeURIComponent('/openapi.yaml')}`;
    return (
      <main style={{ height: '100dvh' }}>
        <iframe
          src={url}
          style={{ width: '100%', height: '100%', border: 0 }}
          title="OpenAPI"
        />
      </main>
    );
  }
  