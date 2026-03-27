"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { ComponentPropsWithoutRef } from "react";
import "katex/dist/katex.min.css";
import { InteractiveArtifactPreview } from "./interactive-artifact-preview";
import { MermaidDiagram } from "./mermaid-diagram";

export function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none prose-headings:text-fg-primary prose-p:text-fg-secondary prose-strong:text-fg-primary prose-code:text-accent-warning prose-pre:bg-bg-primary">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({
            className,
            children,
            inline,
            ...props
          }: ComponentPropsWithoutRef<"code"> & {
            inline?: boolean;
            node?: unknown;
          }) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match?.[1];
            const code = String(children).replace(/\n$/, "");

            if (language === "mermaid") {
              return <MermaidDiagram chart={code} />;
            }

            if (language === "interactive") {
              return (
                <InteractiveArtifactPreview
                  html={code}
                  frame="canvas"
                  title="Bloco interativo"
                  preferredHeight={720}
                />
              );
            }

            if (inline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }

            return (
              <pre className="overflow-x-auto rounded-xl border border-border-default p-4">
                <code className={className}>{children}</code>
              </pre>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-accent-primary pl-4 italic text-fg-tertiary">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table>{children}</table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
