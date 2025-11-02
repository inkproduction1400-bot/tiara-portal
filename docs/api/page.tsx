'use client';

import { useEffect, useRef } from 'react';

export default function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // すでに読み込み済みなら初期化だけ
    const boot = () => {
      // @ts-ignore - Redoc global from CDN
      const Redoc = (window as any).Redoc;
      if (!Redoc || !containerRef.current) return;

      Redoc.init(
        '/openapi.yaml',
        {
          theme: {
            colors: { primary: { main: '#0ea5e9' } },
            sidebar: { backgroundColor: '#0b1220' },
          },
          hideDownloadButton: false,
          expandResponses: '200,201',
          requiredPropsFirst: true,
          onlyRequiredInSamples: true,
        },
        containerRef.current
      );
    };

    // CDN スクリプトが未ロードなら動的に追加
    const existed = document.querySelector<HTMLScriptElement>(
      'script[data-redoc-cdn]'
    );
    if (existed) {
      if ((window as any).Redoc) boot();
      else existed.addEventListener('load', boot, { once: true });
      return;
    }

    const s = document.createElement('script');
    s.src =
      'https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js';
    s.async = true;
    s.defer = true;
    s.setAttribute('data-redoc-cdn', '1');
    s.onload = boot;
    document.body.appendChild(s);
  }, []);

  return (
    <div style={{ height: '100%', minHeight: '100vh' }}>
      <div
        ref={containerRef}
        id="redoc-container"
        style={{ height: '100vh' }}
      />
    </div>
  );
}
