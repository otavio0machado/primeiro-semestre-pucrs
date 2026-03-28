"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "processing" | "done" | "error";
  docType?: string;
  error?: string;
}

export default function OnboardingDocumentosPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const updateFile = useCallback(
    (id: string, updates: Partial<UploadedFile>) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    []
  );

  async function uploadAndProcess(file: File) {
    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setFiles((prev) => [
      ...prev,
      { id: tempId, name: file.name, size: file.size, status: "uploading" },
    ]);

    try {
      // Step 1: Upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", "onboarding");

      const uploadRes = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Erro no upload");
      }

      const { document } = await uploadRes.json();
      updateFile(tempId, { status: "processing" });

      // Step 2: Extract text (fast, no AI)
      const processRes = await fetch("/api/documents/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: document.id, analyze: false }),
      });

      if (processRes.ok) {
        updateFile(tempId, { status: "done", docType: "other" });

        // Step 3: AI analysis in background (non-blocking)
        fetch("/api/documents/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId: document.id, analyze: true }),
        })
          .then(async (r) => {
            if (r.ok) {
              const result = await r.json();
              if (result.analysis?.doc_type) {
                updateFile(tempId, { docType: result.analysis.doc_type });
              }
            }
          })
          .catch(() => {});
      } else {
        updateFile(tempId, { status: "done", docType: "other" });
      }
    } catch (e) {
      updateFile(tempId, {
        status: "error",
        error: (e as Error).message,
      });
    }
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    Array.from(fileList).forEach(uploadAndProcess);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  async function handleContinue() {
    setIsAdvancing(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("user_profiles")
        .update({ onboarding_step: "bootstrap" })
        .eq("id", user.id);
    }
    router.push("/onboarding/bootstrap");
  }

  const doneCount = files.filter((f) => f.status === "done").length;
  const processingCount = files.filter(
    (f) => f.status === "uploading" || f.status === "processing"
  ).length;

  const DOC_TYPE_LABELS: Record<string, string> = {
    syllabus: "Ementa",
    exercise_list: "Exercicios",
    slides: "Slides",
    textbook: "Livro",
    past_exam: "Prova",
    lecture_notes: "Notas",
    solution_key: "Gabarito",
    other: "Documento",
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-primary">
          Passo 3 de 4
        </p>
        <h1 className="text-2xl font-bold text-fg-primary">
          Envie seus materiais
        </h1>
        <p className="text-sm text-fg-secondary leading-relaxed">
          Quanto mais material voce enviar, melhor o Jarvis vai te ajudar. Planos
          de ensino, listas de exercicios, slides, livros — tudo conta.
        </p>
      </div>

      {/* Jarvis message */}
      <div className="rounded-xl border border-border-default bg-bg-surface p-4">
        <p className="text-sm text-fg-secondary italic">
          &quot;Agora preciso dos seus materiais. Quanto mais voce me enviar,
          melhor eu consigo montar seu plano de estudo. Nao se preocupe em
          organizar — eu faco isso.&quot;
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center space-y-4 transition-colors ${
          isDragging
            ? "border-accent-primary bg-accent-primary/5"
            : "border-border-default bg-bg-surface hover:border-fg-muted"
        }`}
      >
        <div className="text-4xl">📎</div>
        <p className="text-sm font-medium text-fg-primary">
          Arraste arquivos aqui ou clique para selecionar
        </p>
        <p className="text-xs text-fg-muted">
          PDF, DOCX, PPTX, HTML, PNG, JPG — ate 50MB por arquivo
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-xs text-fg-muted">
          <span className="rounded-full border border-border-default px-2 py-1">
            Planos de ensino
          </span>
          <span className="rounded-full border border-border-default px-2 py-1">
            Listas de exercicios
          </span>
          <span className="rounded-full border border-border-default px-2 py-1">
            Slides de aula
          </span>
          <span className="rounded-full border border-border-default px-2 py-1">
            Provas anteriores
          </span>
          <span className="rounded-full border border-border-default px-2 py-1">
            Livros (PDF)
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.pptx,.html,.htm,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-fg-primary">
            {doneCount} processado(s)
            {processingCount > 0 && ` · ${processingCount} em andamento`}
          </p>
          <div className="space-y-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-surface px-4 py-3"
              >
                <span className="text-lg">
                  {f.status === "done"
                    ? "✅"
                    : f.status === "error"
                    ? "❌"
                    : "⏳"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-fg-primary">{f.name}</p>
                  <p className="text-xs text-fg-muted">
                    {f.status === "uploading" && "Enviando..."}
                    {f.status === "processing" && "Processando com IA..."}
                    {f.status === "done" &&
                      `${DOC_TYPE_LABELS[f.docType || "other"]} · ${formatSize(
                        f.size
                      )}`}
                    {f.status === "error" && (f.error || "Erro")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encouragement message */}
      {files.length > 0 && files.length < 3 && (
        <div className="rounded-xl border border-accent-primary/20 bg-accent-primary/5 p-4">
          <p className="text-sm text-fg-secondary">
            Voce enviou {files.length} documento(s). Quanto mais materiais eu
            tiver, melhor posso mapear os topicos e gerar exercicios relevantes.
            Tem mais alguma coisa?
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleContinue}
          disabled={isAdvancing || processingCount > 0}
          className="flex-1 rounded-xl border border-border-default py-3 text-sm font-medium text-fg-secondary transition-colors hover:bg-bg-secondary disabled:opacity-50"
        >
          {files.length === 0 ? "Pular por agora" : ""}
          {files.length > 0 && processingCount > 0
            ? "Aguarde o processamento..."
            : ""}
          {files.length > 0 && processingCount === 0
            ? "Continuar"
            : ""}
          {files.length === 0 ? "" : ""}
        </button>
        {files.length > 0 && processingCount === 0 && (
          <button
            onClick={handleContinue}
            disabled={isAdvancing}
            className="flex-1 rounded-xl bg-accent-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-primary/90 disabled:opacity-50"
          >
            {isAdvancing ? "Avancando..." : "Pronto, processe tudo"}
          </button>
        )}
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
