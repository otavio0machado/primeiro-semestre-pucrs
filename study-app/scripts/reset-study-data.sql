begin;

delete from public.notes;
delete from public.flashcards;
delete from public.oral_questions;
delete from public.study_sessions;
delete from public.attempts;
delete from public.error_occurrences;
delete from public.jarvis_messages;
delete from public.jarvis_conversations;
delete from public.ai_usage_logs;
delete from public.exercises where ai_generated = true;

update public.topics
set mastery = 'none',
    score = 0,
    exercises_attempted = 0,
    error_count = 0,
    updated_at = now();

update public.assessments
set score = null,
    status = 'upcoming';

do $$
begin
  delete from study.notes;
  delete from study.flashcards;
  delete from study.study_sessions;
  delete from study.attempts;
  delete from study.errors;
  delete from study.mastery;
  delete from study.mastery_snapshots;
  delete from study.exam_campaigns;
  delete from study.simulations;
  delete from study.reviews;
  delete from study.spaced_repetition;
exception
  when undefined_table or invalid_schema_name then
    null;
end $$;

commit;
