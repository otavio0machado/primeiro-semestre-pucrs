import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function parseEnvFile(content) {
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

async function loadLocalEnv(appRoot) {
  const envPath = path.join(appRoot, ".env.local");
  const content = await fs.readFile(envPath, "utf8");
  return parseEnvFile(content);
}

async function runStep(label, operation, summary) {
  try {
    const response = await operation();
    summary.push({ label, status: "ok", details: response?.count ?? "executado" });
  } catch (error) {
    summary.push({
      label,
      status: "erro",
      details: error instanceof Error ? error.message : "erro desconhecido",
    });
  }
}

async function resetPublicSchema(client, summary) {
  const deleteById = (table) =>
    client.from(table).delete().not("id", "is", null);

  await runStep("public.notes", () => deleteById("notes"), summary);
  await runStep("public.flashcards", () => deleteById("flashcards"), summary);
  await runStep("public.oral_questions", () => deleteById("oral_questions"), summary);
  await runStep("public.study_sessions", () => deleteById("study_sessions"), summary);
  await runStep("public.attempts", () => deleteById("attempts"), summary);
  await runStep("public.error_occurrences", () => deleteById("error_occurrences"), summary);
  await runStep("public.jarvis_messages", () => deleteById("jarvis_messages"), summary);
  await runStep("public.jarvis_conversations", () => deleteById("jarvis_conversations"), summary);
  await runStep("public.ai_usage_logs", () => deleteById("ai_usage_logs"), summary);
  await runStep(
    "public.exercises(ai_generated)",
    () => client.from("exercises").delete().eq("ai_generated", true),
    summary,
  );
  await runStep(
    "public.topics(reset mastery)",
    () =>
      client
        .from("topics")
        .update({
          mastery: "none",
          score: 0,
          exercises_attempted: 0,
          error_count: 0,
          updated_at: new Date().toISOString(),
        })
        .not("id", "is", null),
    summary,
  );
  await runStep(
    "public.assessments(reset scores)",
    () =>
      client
        .from("assessments")
        .update({ score: null, status: "upcoming" })
        .not("id", "is", null),
    summary,
  );
}

async function resetStudySchema(client, summary) {
  const scoped = client.schema("study");
  const deleteById = (table) =>
    scoped.from(table).delete().not("id", "is", null);

  await runStep("study.notes", () => deleteById("notes"), summary);
  await runStep("study.flashcards", () => deleteById("flashcards"), summary);
  await runStep("study.study_sessions", () => deleteById("study_sessions"), summary);
  await runStep("study.attempts", () => deleteById("attempts"), summary);
  await runStep("study.errors", () => deleteById("errors"), summary);
  await runStep("study.mastery", () => deleteById("mastery"), summary);
  await runStep("study.mastery_snapshots", () => deleteById("mastery_snapshots"), summary);
  await runStep("study.exam_campaigns", () => deleteById("exam_campaigns"), summary);
  await runStep("study.simulations", () => deleteById("simulations"), summary);
  await runStep("study.reviews", () => deleteById("reviews"), summary);
  await runStep("study.spaced_repetition", () => deleteById("spaced_repetition"), summary);
}

async function main() {
  const appRoot = process.cwd();
  const localEnv = await loadLocalEnv(appRoot);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Credenciais do Supabase ausentes em .env.local");
  }

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const summary = [];
  await resetPublicSchema(client, summary);
  await resetStudySchema(client, summary);

  console.table(summary);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
