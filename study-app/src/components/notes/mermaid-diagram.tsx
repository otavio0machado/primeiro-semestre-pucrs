"use client";

import mermaid from "mermaid";
import { AlertCircle, Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { normalizeMermaidChart } from "@/lib/notes/mermaid";

let initialized = false;

interface SvgDimensions {
  width: number;
  height: number;
}

function ensureMermaid() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "dark",
    suppressErrorRendering: true,
  });
  initialized = true;
}

function parseSvgDimension(value: string | null) {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function extractSvgDimensions(svgMarkup: string): SvgDimensions | null {
  if (typeof window === "undefined") return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgMarkup, "image/svg+xml");
  const svg = doc.querySelector("svg");

  if (!svg) return null;

  const viewBox = svg.getAttribute("viewBox");
  if (viewBox) {
    const [, , width, height] = viewBox.split(/\s+/).map(Number);
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return { width, height };
    }
  }

  const width = parseSvgDimension(svg.getAttribute("width"));
  const height = parseSvgDimension(svg.getAttribute("height"));

  if (width && height) {
    return { width, height };
  }

  return null;
}

export function MermaidDiagram({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, "");
  const renderId = useMemo(() => `mermaid-${id}`, [id]);
  const normalizedChart = useMemo(() => normalizeMermaidChart(chart), [chart]);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [availableHeight, setAvailableHeight] = useState(520);
  const [containerWidth, setContainerWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dimensions = useMemo(() => (svg ? extractSvgDimensions(svg) : null), [svg]);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        ensureMermaid();
        const { svg: rendered } = await mermaid.render(renderId, normalizedChart);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (renderError) {
        if (!cancelled) {
          setSvg(null);
          setError(
            renderError instanceof Error
              ? renderError.message
              : "Não foi possível renderizar o gráfico Mermaid.",
          );
        }
      }
    }

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [normalizedChart, renderId]);

  useEffect(() => {
    function updateAvailableHeight() {
      setAvailableHeight(Math.round(Math.min(window.innerHeight * 0.62, 760)));
    }

    updateAvailableHeight();
    window.addEventListener("resize", updateAvailableHeight);
    return () => window.removeEventListener("resize", updateAvailableHeight);
  }, []);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fitScale = useMemo(() => {
    if (!dimensions || !containerWidth) return 1;

    return Math.min(Math.max((containerWidth - 32) / dimensions.width, 0.35), 3);
  }, [containerWidth, dimensions]);

  const scale = useMemo(
    () => Math.min(Math.max(fitScale * zoomLevel, 0.18), 4),
    [fitScale, zoomLevel],
  );

  const viewportHeight = useMemo(() => {
    if (!dimensions) {
      return 320;
    }

    const fittedHeight = dimensions.height * Math.min(scale, 1) + 32;
    return Math.round(Math.max(280, Math.min(fittedHeight, availableHeight)));
  }, [availableHeight, dimensions, scale]);

  if (error) {
    return (
      <div className="rounded-xl border border-accent-danger/30 bg-accent-danger/5 p-4">
        <div className="flex items-start gap-2 text-accent-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Falha ao renderizar o gráfico</p>
              <p className="text-xs whitespace-pre-wrap opacity-80">{error}</p>
            <pre className="overflow-x-auto rounded-lg bg-bg-primary p-3 text-xs text-fg-secondary">
              {normalizedChart}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-default bg-bg-primary">
      <div className="flex items-center justify-between border-b border-border-default px-3 py-2">
        <p className="text-xs font-medium uppercase tracking-widest text-fg-muted">Gráfico</p>
        <div className="flex items-center gap-1">
          <ControlButton onClick={() => setZoomLevel((value) => Math.max(0.45, value / 1.15))}>
            <Minus className="h-3 w-3" />
          </ControlButton>
          <ControlButton onClick={() => setZoomLevel(1)}>
            <RotateCcw className="h-3 w-3" />
          </ControlButton>
          <ControlButton onClick={() => setZoomLevel((value) => Math.min(3.2, value * 1.15))}>
            <Plus className="h-3 w-3" />
          </ControlButton>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="overflow-auto p-4"
        style={{ height: `${viewportHeight}px` }}
      >
        <div
          className="flex min-h-full min-w-full items-start justify-center"
        >
          <div
            className="origin-top-left transition-transform"
            style={{ transform: `scale(${scale})`, width: "max-content" }}
            dangerouslySetInnerHTML={{ __html: svg ?? "" }}
          />
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-md border border-border-default bg-bg-secondary p-1.5 text-fg-secondary transition-colors hover:bg-bg-tertiary hover:text-fg-primary"
      type="button"
    >
      {children}
    </button>
  );
}
