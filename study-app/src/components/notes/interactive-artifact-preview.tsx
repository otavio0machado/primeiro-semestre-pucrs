"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { InteractiveBlockFrame } from "@/lib/notes/renderable-blocks";

const RESIZE_EVENT = "cogni:interactive-resize";

function clampHeight(value: number) {
  return Math.min(1200, Math.max(420, Math.round(value)));
}

function injectIntoHead(documentHtml: string, injection: string) {
  if (/<head[^>]*>/i.test(documentHtml)) {
    return documentHtml.replace(/<head[^>]*>/i, (match) => `${match}${injection}`);
  }

  if (/<html[^>]*>/i.test(documentHtml)) {
    return documentHtml.replace(/<html[^>]*>/i, (match) => `${match}<head>${injection}</head>`);
  }

  return `<!doctype html><html><head>${injection}</head><body>${documentHtml}</body></html>`;
}

function injectIntoBody(documentHtml: string, injection: string) {
  if (/<\/body>/i.test(documentHtml)) {
    return documentHtml.replace(/<\/body>/i, `${injection}</body>`);
  }

  if (/<html[^>]*>/i.test(documentHtml)) {
    return documentHtml.replace(/<\/html>/i, `<body>${injection}</body></html>`);
  }

  return `<!doctype html><html><body>${documentHtml}${injection}</body></html>`;
}

function normalizeHtmlDocument(rawHtml: string, title: string) {
  const trimmed = rawHtml.trim();
  if (/<html[\s>]/i.test(trimmed)) {
    return trimmed;
  }

  if (/<body[\s>]/i.test(trimmed)) {
    return `<!doctype html><html>${trimmed}</html>`;
  }

  return `<!doctype html><html><head><title>${title}</title></head><body>${trimmed}</body></html>`;
}

function buildSrcDoc({
  html,
  channelId,
  title,
}: {
  html: string;
  channelId: string;
  title: string;
}) {
  const documentHtml = normalizeHtmlDocument(html, title);
  const headInjection = `
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data:; media-src data: blob:;" />
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; background: #09090b; color: #f5f7fb; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      button, input, select, textarea { font: inherit; }
    </style>
  `;

  const resizeScript = `
    <script>
      (function () {
        const channelId = ${JSON.stringify(channelId)};
        const eventType = ${JSON.stringify(RESIZE_EVENT)};

        function publishSize() {
          const doc = document.documentElement;
          const body = document.body;
          const height = Math.max(
            doc ? doc.scrollHeight : 0,
            doc ? doc.offsetHeight : 0,
            doc ? doc.clientHeight : 0,
            body ? body.scrollHeight : 0,
            body ? body.offsetHeight : 0,
            body ? body.clientHeight : 0
          );

          window.parent.postMessage({ type: eventType, channelId, height }, "*");
        }

        window.addEventListener("load", publishSize);
        window.addEventListener("resize", publishSize);

        if (typeof ResizeObserver !== "undefined") {
          const observer = new ResizeObserver(function () {
            publishSize();
          });

          observer.observe(document.documentElement);
          if (document.body) observer.observe(document.body);
        }

        setTimeout(publishSize, 60);
        setTimeout(publishSize, 240);
        setTimeout(publishSize, 800);
      })();
    </script>
  `;

  const withHead = injectIntoHead(documentHtml, headInjection);
  return injectIntoBody(withHead, resizeScript);
}

export function InteractiveArtifactPreview({
  html,
  frame,
  title,
  preferredHeight,
}: {
  html: string;
  frame: InteractiveBlockFrame;
  title: string;
  preferredHeight: number;
}) {
  const channelId = useId().replace(/:/g, "");
  const [contentHeight, setContentHeight] = useState(() => clampHeight(preferredHeight));

  useEffect(() => {
    setContentHeight(clampHeight(preferredHeight));
  }, [preferredHeight]);

  useEffect(() => {
    if (frame === "phone") return;

    function handleMessage(event: MessageEvent) {
      const data = event.data as
        | { type?: string; channelId?: string; height?: number }
        | undefined;

      if (!data || data.type !== RESIZE_EVENT || data.channelId !== channelId) {
        return;
      }

      if (typeof data.height === "number" && Number.isFinite(data.height)) {
        setContentHeight(clampHeight(data.height + 8));
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [channelId, frame]);

  const srcDoc = useMemo(
    () => buildSrcDoc({ html, channelId, title }),
    [channelId, html, title],
  );

  const iframeHeight =
    frame === "phone"
      ? clampHeight(preferredHeight)
      : contentHeight;

  const iframe = (
    <iframe
      title={title}
      sandbox="allow-scripts"
      loading="lazy"
      referrerPolicy="no-referrer"
      srcDoc={srcDoc}
      className="w-full border-0 bg-transparent"
      style={{ height: `${iframeHeight}px` }}
    />
  );

  if (frame === "phone") {
    return (
      <div className="mx-auto w-full max-w-[420px]">
        <div className="rounded-[40px] border border-white/10 bg-[#111216] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="mx-auto mb-3 h-1.5 w-24 rounded-full bg-white/10" />
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black">
            {iframe}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-primary">
      {iframe}
    </div>
  );
}
