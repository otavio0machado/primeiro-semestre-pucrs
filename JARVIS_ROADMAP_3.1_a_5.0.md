# JARVIS — Roadmap de Implementação: 3.1 → 5.0

> *"O 3.0 transformou o chatbot em copiloto. O caminho até o 5.0 transforma o copiloto numa plataforma de inteligência educacional."*

> **Data:** 27 de março de 2026
> **Contexto:** Documento de evolução progressiva do Jarvis, partindo das 6 ideias fundamentais do 3.0 (Omnipresença, Mission Mode, Consciência Situacional, Forgetting Curve, Simulados, Grafo Vivo) e construindo camadas cada vez mais profundas de inteligência.

---

## Mapa Geral — A Jornada

```
JARVIS 3.0        JARVIS 3.1        JARVIS 3.2        JARVIS 3.5        JARVIS 4.0        JARVIS 5.0
──────────────────────────────────────────────────────────────────────────────────────────────────────────
Copiloto          Copiloto          Copiloto que      Plataforma        Segundo Cérebro   Learning OS
que responde      que sente         pensa sobre       Aberta            Autônomo          Ecossistema
com contexto      múltiplos canais  o próprio pensar  Multi-usuário     que Evolui        que Transcende
                  de entrada                          + Extensível      Sozinho           a Faculdade
──────────────────────────────────────────────────────────────────────────────────────────────────────────
Fundação:         + Multimodal      + Meta-cognição   + Auth + RLS      + Agente autônomo  + Learning OS
6 ideias core     + Quick Capture   + Cross-discipline+ Onboarding      + Auto-evolução    + Social Learning
                  + Peer Teaching   + Adaptive Flow   + Plugin system   + Transfer learn.  + Real-world bridge
                  + Self-Analytics  + Predictive      + Mobile PWA      + KG evolution     + Career intelligence
                                     Engine                             + Meta-otimização  + Open Knowledge
```

---

## JARVIS 3.1 — O Copiloto Sensorial

> **Tema central:** Expandir os canais de entrada e saída. O 3.0 só entende texto digitado. O 3.1 entende foto, voz, rabisco, e captura rápida. Também começa a devolver insight sobre o próprio aluno.

**Pré-requisito:** Ideias 1 (Omnipresença) e 2 (Mission Mode) do 3.0 implementadas.
**Estimativa:** 4–6 semanas após 3.0 estável.

---

### 3.1.1 — Multimodalidade: Jarvis que Vê

**O problema que resolve:** Estudo real acontece no papel. Exercícios feitos à mão, anotações no caderno, fórmulas no quadro branco da aula. Nada disso entra no sistema hoje. O aluno tem que transcrever manualmente — e ninguém faz isso.

**Como funciona:**

O aluno tira foto de um exercício resolvido à mão. O Jarvis:

1. Reconhece a escrita (Claude Vision — já suporta LaTeX manuscrito)
2. Interpreta a resolução passo a passo
3. Identifica onde o erro aconteceu (se houver)
4. Classifica o erro na taxonomia existente (`error_occurrences`)
5. Atualiza mastery do tópico
6. Gera exercício similar para consolidação

```
Você: [foto de exercício de limite no caderno]

Jarvis: "Li seu exercício. Você calculou lim(x→2) (x²-4)/(x-2).

Passo 1: Fatorou x²-4 como (x-2)(x+2) ✅
Passo 2: Simplificou (x-2) ✅
Passo 3: Substituiu x=2... você escreveu 2+2=2 ✗

Erro aritmético na substituição final. Resultado correto: 4.
Esse tipo de erro (processual — aritmética) aconteceu 3 vezes
nas últimas 2 semanas. Registrado.

Quer que eu gere 3 exercícios de limites focados em
substituição cuidadosa?"
```

**Cenários adicionais:**

- Foto do quadro branco da aula → Jarvis extrai conteúdo e cria nota no vault automaticamente
- Foto de uma página do livro/apostila → Jarvis gera flashcards dos conceitos-chave
- Screenshot de um gráfico → Jarvis identifica a função e cria exercícios sobre ela

**Implementação técnica:**

```typescript
// src/app/api/ai/vision/route.ts
export async function POST(req: Request) {
  const { image, context, pageContext } = await req.json();

  const analysis = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: image }
        },
        {
          type: 'text',
          text: buildVisionPrompt(context, pageContext)
          // Prompt inclui: taxonomia de erros, mastery atual do tópico,
          // formato esperado de resposta (JSON estruturado + texto)
        }
      ]
    }]
  });

  // Pipeline pós-análise:
  // 1. Parse da resposta estruturada
  // 2. Se erro detectado → classifyAndSave()
  // 3. Se conteúdo novo → createNote() ou createFlashcards()
  // 4. updateTopicMastery() baseado na análise
  // 5. Retorna resposta conversacional + ações executadas
}
```

**Componente de UI:**

```typescript
// src/components/jarvis/image-input.tsx
// Botão de câmera no painel do Jarvis (ao lado do input de texto)
// - Mobile: abre câmera nativa
// - Desktop: drag & drop ou clipboard (Cmd+V)
// - Preview da imagem antes de enviar
// - Indicador de processamento ("Analisando sua resolução...")
```

**Tabela nova:**

```sql
CREATE TABLE vision_analyses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,           -- Supabase Storage
  analysis_type text NOT NULL,       -- 'exercise_check', 'board_capture', 'book_extract'
  extracted_content jsonb,           -- conteúdo reconhecido (LaTeX, texto, etc.)
  errors_found jsonb,               -- erros identificados (se aplicável)
  actions_taken text[],             -- ['error_logged', 'note_created', 'flashcards_generated']
  topic_id text REFERENCES topics(id),
  created_at timestamptz DEFAULT now()
);
```

---

### 3.1.2 — Quick Capture: Entrada de 5 Segundos

**O problema que resolve:** Você está na aula, o professor menciona algo importante, não dá tempo de abrir o app inteiro. Ou você acabou de sair de uma sessão de estudo e quer registrar rapidamente o que fez. Hoje, registrar uma sessão exige navegar até a página certa, preencher campos, salvar. São 60 segundos que viram barreira.

**Como funciona:**

Um modo mínimo de entrada — texto livre, sem formulários — que o Jarvis processa assincronamente.

```
Quick Capture (acessível via ⌘K ou botão flutuante):

Você digita: "estudei limites 40min, errei exercício de
             indeterminação 0/0 por fatoração"

Jarvis processa em background:
✓ Sessão de estudo criada (40min, Cálculo I, Cálculo de Limites)
✓ Erro registrado (tipo: processual, tópico: Cálculo de Limites,
   subtipo: fatoração)
✓ Mastery atualizado
✓ Flashcard de fatoração agendado para revisão amanhã
```

**Mais exemplos de captura:**

```
"p1 de discreta mudou pra 22/04"
→ Assessment atualizado, plano de estudo recalculado, notificação

"professor falou que continuidade NÃO cai na p1"
→ Tópico removido do assessment, readiness recalculado

"entendi composição de funções finalmente, f∘g é aplicar g primeiro
 depois f"
→ Nota rápida criada, mastery bump em composição

"amanhã não vou poder estudar"
→ Plano de estudo redistribui a carga para os dias seguintes
```

**Implementação técnica:**

```typescript
// src/lib/services/quick-capture.ts
interface CaptureResult {
  intent: 'log_session' | 'log_error' | 'update_assessment' |
          'create_note' | 'schedule_change' | 'mastery_update';
  entities: {
    discipline?: string;
    topic?: string;
    duration_min?: number;
    error_type?: string;
    date?: string;
    content?: string;
  };
  actions_executed: string[];
  confirmation_message: string;
}

async function processCapture(rawText: string): Promise<CaptureResult> {
  // 1. Claude extrai intenção + entidades do texto livre
  // 2. Mapeia entidades para IDs reais no banco (fuzzy match)
  // 3. Executa ações via services existentes
  // 4. Retorna confirmação concisa
}
```

**UI:** Command palette estilo Raycast/Spotlight. `⌘K` abre overlay mínimo com input de texto + sugestões de autocompletar baseadas em contexto recente. Sem formulários, sem dropdowns, sem campos obrigatórios.

---

### 3.1.3 — Peer Teaching Mode: Ensinar para Aprender

**O problema que resolve:** Exercícios testam reconhecimento de padrão — você vê a pergunta, aplica a técnica. Mas a Técnica Feynman mostra que a compreensão verdadeira só aparece quando você tenta explicar. Nenhum app de estudo testa isso.

**Como funciona:**

O Jarvis inverte os papéis — ele faz de aluno e você faz de professor.

```
Jarvis: "Desafio Feynman: explique Composição de Funções
como se eu fosse um aluno do ensino médio que sabe
o que é função mas nunca viu composição."

Você: "Composição é quando você pega o resultado de uma função
e coloca como entrada de outra. Tipo, se f(x) = x² e
g(x) = x+1, então f(g(x)) é pegar x+1 e elevar ao quadrado.
Então f(g(2)) = f(3) = 9."

Jarvis: "Avaliação da sua explicação:

✅ Analogia intuitiva ('pegar resultado e colocar como entrada')
✅ Exemplo concreto com valores numéricos
✅ Ordem correta (g primeiro, depois f)

⚠️ Faltou:
- Mencionar que a ordem importa (f∘g ≠ g∘f em geral)
- Domínio da composição (nem sempre é possível compor)

Compreensão estimada: 72% — você sabe operar mas não
domina as restrições. Mastery ajustado.

Quer tentar explicar por que f∘g ≠ g∘f?"
```

**Níveis de desafio:**

| Nível | Público-alvo simulado | O que testa |
|-------|----------------------|-------------|
| 1 | "Explique para uma criança de 10 anos" | Intuição fundamental |
| 2 | "Explique para um aluno do ensino médio" | Conceito + exemplo |
| 3 | "Explique para um colega de turma" | Precisão técnica |
| 4 | "Convença um professor cético" | Rigor + casos-limite |

**Implementação técnica:**

```typescript
// Nova tool no orchestrator
{
  name: 'feynman_challenge',
  description: 'Gera um desafio de ensino para um tópico específico',
  parameters: {
    topic_id: 'string',
    difficulty_level: '1-4',
  },
  execute: async ({ topic_id, difficulty_level }) => {
    const topic = await getTopic(topic_id);
    const mastery = await getTopicMastery(topic_id);
    const commonErrors = await getErrorsByTopic(topic_id);

    // Claude gera o desafio calibrado
    // Após resposta do aluno, Claude avalia em dimensões:
    // - Precisão conceitual (0-100)
    // - Clareza da explicação (0-100)
    // - Completude (conceitos mencionados vs. esperados)
    // - Erros conceituais detectados
    // Resultado atualiza mastery com peso diferente de exercícios
  }
}
```

**Nova tabela:**

```sql
CREATE TABLE feynman_challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id text REFERENCES topics(id),
  difficulty_level integer CHECK (difficulty_level >= 1 AND difficulty_level <= 4),
  challenge_prompt text NOT NULL,
  student_response text,
  ai_evaluation jsonb,
  -- { precision: 0-100, clarity: 0-100, completeness: 0-100,
  --   missing_concepts: [], misconceptions: [], mastery_delta: float }
  created_at timestamptz DEFAULT now()
);
```

---

### 3.1.4 — Self-Analytics: Jarvis como Coach de Meta-Aprendizagem

**O problema que resolve:** O Jarvis 3.0 te ajuda a estudar conteúdo. Mas não te ensina *como você aprende*. Cada pessoa tem padrões — horários de pico, modalidades preferidas, durações ótimas de sessão, tipos de exercício que consolidam melhor. Os dados existem (tabelas `study_sessions`, `attempts`, `error_occurrences`) mas ninguém os analisa para extrair perfil cognitivo.

**Como funciona:**

O Jarvis analisa seu histórico de estudo e gera um "Perfil de Aprendizagem" que evolui com o tempo.

```
Jarvis: "Relatório semanal de meta-aprendizagem (17-23/mar):

📊 Seu Perfil Cognitivo:

Horário ótimo: manhã (acertos 78% vs. 51% à noite)
Duração ideal de sessão: 35-45 min (após 45 min, acertos
  caem 30% em média)
Modalidade que mais consolida para você: exercícios práticos
  (retenção +40% vs. apenas leitura de notas)
Padrão de erro dominante: processual (68% dos erros) —
  você entende o conceito mas erra na execução

💡 Recomendações baseadas nos seus dados:

1. Mova sessões de Cálculo para a manhã (seu desempenho
   em conteúdo numérico é 2x melhor antes do almoço)
2. Adicione pausa de 5 min a cada 35 min — seus dados
   mostram queda abrupta de performance no minuto 38
3. Para erros processuais: pratique mais exercícios
   step-by-step em vez de teoria. Seus dados confirmam
   que você aprende fazendo, não lendo."
```

**Métricas rastreadas:**

```typescript
interface LearnerProfile {
  // Temporal
  peak_hours: { hour: number; avg_accuracy: number }[];
  optimal_session_length_min: number;
  fatigue_onset_min: number;              // quando accuracy começa a cair

  // Modalidade
  modality_effectiveness: {
    exercises: number;    // retenção após 7 dias
    flashcards: number;
    note_reading: number;
    feynman: number;      // (novo no 3.1)
    simulation: number;
  };

  // Padrões de erro
  error_distribution: {
    conceptual: number;
    procedural: number;
    arithmetic: number;
    interpretation: number;
  };
  error_trend: 'improving' | 'stable' | 'worsening';

  // Disciplina
  discipline_affinity: {
    discipline_id: string;
    ease_score: number;    // tempo médio para subir de mastery level
  }[];

  // Consistência
  study_streak_days: number;
  avg_sessions_per_week: number;
  retention_vs_frequency: number;  // correlação entre frequência e retenção
}
```

**Implementação:** Supabase Edge Function semanal que puxa todos os dados de estudo, envia para Claude com prompt analítico, gera o perfil + relatório. Armazena em nova tabela `learner_profile_snapshots` para rastrear evolução ao longo do semestre.

---

## JARVIS 3.2 — O Copiloto que Pensa Sobre o Pensar

> **Tema central:** Inteligência cruzada entre disciplinas, dificuldade adaptativa em tempo real, e predição de performance. O Jarvis não só reage aos dados — ele antecipa o futuro.

**Pré-requisito:** 3.1 estável + Ideias 3 (Consciência Situacional), 4 (Forgetting Curve) e 6 (Grafo Vivo) do 3.0 implementadas.
**Estimativa:** 4–6 semanas após 3.1.

---

### 3.2.1 — Cross-Discipline Intelligence: Pontes entre Matérias

**O problema que resolve:** Cálculo I e Matemática Discreta são tratadas como universos separados. Mas na realidade se cruzam: lógica proposicional aparece em provas por indução, conjuntos aparecem em domínio de funções, notação formal é compartilhada. Nenhum sistema de estudo explora essas conexões.

**Como funciona:**

O knowledge graph ganha arestas *entre* disciplinas, não só dentro delas. O Jarvis detecta e explora essas pontes.

```
Jarvis: "Conexão detectada: você acabou de estudar
Conjuntos em Discreta. O tópico 'Domínio de Funções'
em Cálculo usa a mesma linguagem de conjuntos.

Sua retenção de Conjuntos está em 82%. Se você fizer
2 exercícios de domínio agora, consolida os dois
tópicos simultaneamente — efeito 2-por-1.

Quer que eu gere exercícios que usem notação de
conjuntos para definir domínios?"
```

**Pontes identificáveis entre Cálculo I e Matemática Discreta:**

| Cálculo I | Matemática Discreta | Ponte |
|-----------|--------------------|-|
| Domínio e imagem | Conjuntos e operações | Domínio como subconjunto de ℝ, imagem como contradomínio |
| Função injetora/sobrejetora | Funções em conjuntos finitos | Mesma definição, contextos diferentes |
| Indeterminação 0/0 | Lógica proposicional | "Se denominador = 0 ENTÃO..." — raciocínio condicional |
| Prova de limites (ε-δ) | Quantificadores | "∀ε>0, ∃δ>0" — mesma estrutura lógica |
| Continuidade | Demonstração direta | Provar continuidade é demonstração com definição |

**Implementação técnica:**

```sql
-- Novas arestas cross-discipline no knowledge graph
INSERT INTO kg_edges (source_id, target_id, relation, metadata)
VALUES
  ('discreta-conjuntos', 'calculo-dominio', 'enables_understanding',
   '{"bridge_type": "shared_language", "strength": 0.8}'),
  ('discreta-quantificadores', 'calculo-epsilon-delta', 'enables_understanding',
   '{"bridge_type": "structural_equivalence", "strength": 0.9}');

-- Flag no edge para distinguir intra vs. cross discipline
ALTER TABLE kg_edges ADD COLUMN is_cross_discipline boolean DEFAULT false;
```

```typescript
// src/lib/services/cross-discipline.ts
function findBridgeOpportunities(
  currentTopic: Topic,
  allTopicsWithMastery: TopicWithMastery[]
): BridgeOpportunity[] {
  // 1. Encontra cross-edges do tópico atual
  // 2. Filtra por tópicos com mastery recente (para efeito 2-por-1)
  // 3. Ranqueia por: recência × relevância × decay_risk
  // 4. Retorna oportunidades com exercícios sugeridos
}
```

---

### 3.2.2 — Adaptive Flow Engine: Dificuldade em Tempo Real

**O problema que resolve:** O 3.0 gera exercícios com dificuldade estática baseada no mastery. Mas *dentro de uma sessão*, a dificuldade deveria flutuar dinamicamente. Se o aluno acerta 3 seguidos, a próxima questão deve subir. Se erra 2, deve descer e mudar o ângulo de abordagem. O objetivo é manter o aluno na "zona de flow" — nem entediado (muito fácil) nem frustrado (muito difícil).

**Como funciona:**

```
Sessão de exercícios de Limites:

Q1 (dificuldade 3/10): lim(x→1) 3x+2 = ?
→ Acertou em 15s ✅

Q2 (dificuldade 5/10): lim(x→0) sin(x)/x = ?
→ Acertou em 45s ✅ (subiu dificuldade)

Q3 (dificuldade 7/10): lim(x→∞) (3x²+1)/(x²-2) = ?
→ Acertou em 90s ✅ (subiu de novo)

Q4 (dificuldade 8/10): lim(x→0) (1-cos(x))/x² = ?
→ Errou ✗ (Jarvis detecta: erro conceitual, não sabia
  a identidade trigonométrica)

Q5 (dificuldade 6/10): mesmo conceito, ângulo diferente
→ lim(x→0) (tan(x)-sin(x))/x³ = ? com dica visual

Q6 (dificuldade 7/10): volta a subir se acertou Q5
```

**O algoritmo de calibração:**

```typescript
interface FlowState {
  current_difficulty: number;        // 1-10
  consecutive_correct: number;
  consecutive_wrong: number;
  avg_time_per_question: number;
  frustration_signal: boolean;       // tempo > 3x média = frustração
  boredom_signal: boolean;           // tempo < 0.3x média = muito fácil
  topic_angle_history: string[];     // evita repetir mesmo ângulo
}

function calibrateNext(state: FlowState): NextQuestion {
  if (state.consecutive_correct >= 2 && !state.frustration_signal) {
    // Subir dificuldade, novo ângulo
    return { difficulty: state.current_difficulty + 1.5, new_angle: true };
  }
  if (state.consecutive_wrong >= 2 || state.frustration_signal) {
    // Descer dificuldade, mesmo conceito mas abordagem diferente
    return { difficulty: state.current_difficulty - 2, same_concept: true, hint: true };
  }
  if (state.boredom_signal) {
    // Salto de dificuldade para re-engajar
    return { difficulty: state.current_difficulty + 3, challenge_mode: true };
  }
  // Manter nível, variar ângulo
  return { difficulty: state.current_difficulty, new_angle: true };
}
```

**Métricas de sessão que alimentam o Self-Analytics (3.1.4):**

- Tempo na zona de flow (dificuldade ≈ habilidade) vs. fora
- Ponto de fadiga (quando acertos começam a cair consistentemente)
- "Difficulty ceiling" do aluno por tópico (dificuldade máxima antes de erros consistentes)

---

### 3.2.3 — Predictive Engine: Jarvis que Vê o Futuro

**O problema que resolve:** O 3.0 mostra readiness score — uma foto do presente. Mas não projeta: "se você continuar nesse ritmo, qual será sua nota?". O aluno não sabe se está no caminho certo até a prova chegar.

**Como funciona:**

O Jarvis constrói um modelo preditivo baseado em: velocidade de progressão do mastery, padrão de retenção (forgetting curve), histórico de simulados, e tempo restante até a prova.

```
Jarvis: "Projeção para P1 de Cálculo (13/04 — 17 dias):

Cenário atual (mantendo ritmo atual):
  Nota estimada: 6.8 ± 0.9
  Probabilidade de passar (≥7.0): 42%

Cenário intensivo (+30min/dia em limites):
  Nota estimada: 7.8 ± 0.7
  Probabilidade de passar: 78%

Cenário ótimo (seguindo plano do Jarvis 100%):
  Nota estimada: 8.5 ± 0.5
  Probabilidade de passar: 95%

O fator decisivo é Cálculo de Limites — cada ponto
de mastery nesse tópico vale ~0.4 pontos na nota final
(é o tópico com maior peso × maior gap)."
```

**O modelo preditivo:**

```typescript
interface PredictionModel {
  // Inputs
  current_mastery_by_topic: Map<string, MasteryLevel>;
  mastery_velocity: Map<string, number>;     // pontos de mastery/dia
  retention_curves: Map<string, RetentionCurve>;
  assessment_topic_weights: Map<string, number>;
  days_remaining: number;
  avg_study_hours_per_day: number;

  // Outputs
  predicted_score: { mean: number; std: number };
  pass_probability: number;
  critical_topics: { topic_id: string; marginal_value: number }[];
  // marginal_value = quantos pontos na nota cada hora investida rende
  scenarios: Scenario[];
}

function projectScore(model: PredictionModel): Prediction {
  // Para cada tópico:
  //   1. Projeta mastery no dia da prova (velocity × days + decay)
  //   2. Converte mastery → expected_score_contribution (baseado em peso)
  //   3. Soma contribuições = nota estimada
  //   4. Monte Carlo com variância para intervalo de confiança
  //   5. Cenários = variações nos inputs (mais horas, foco diferente)
}
```

**Visualização:** Gráfico de trajetória na página da prova. Eixo X = dias, Eixo Y = readiness/nota estimada. Linha sólida = projeção atual. Linhas tracejadas = cenários alternativos. O aluno vê literalmente o impacto de cada hora de estudo.

---

### 3.2.4 — Contextual Memory: Jarvis que Lembra de Tudo

**O problema que resolve:** Cada conversa com o Jarvis começa do zero em termos de diálogo. Ele sabe os dados (mastery, erros, etc.), mas não lembra que "ontem você disse que tava confuso com a regra da cadeia" ou "semana passada você pediu explicação sobre epsilon-delta e entendeu quando eu usei a analogia do alvo de dardos".

**Como funciona:**

O Jarvis mantém uma memória episódica das interações significativas — não toda conversa, mas momentos de insight, confusão, preferência pedagógica, e compromissos.

```
Jarvis: "Na terça você me pediu pra explicar regra da cadeia
e a analogia que funcionou foi a de 'cebola — descasca camada
por camada'. Hoje você errou um exercício de cadeia. Quer que
eu retome a partir da analogia da cebola?"
```

```
Jarvis: "Você mencionou na segunda que quarta não ia poder
estudar. Redistribuí a carga: hoje tem 20 min extras de
Limites pra compensar."
```

**Implementação técnica:**

```sql
CREATE TABLE jarvis_episodic_memory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_type text NOT NULL,
  -- 'insight_moment'     (aluno entendeu algo, + a analogia que funcionou)
  -- 'confusion_point'    (aluno expressou confusão, + o tópico)
  -- 'pedagogical_pref'   (aluno prefere X tipo de explicação)
  -- 'commitment'         (aluno disse que vai/não vai fazer algo)
  -- 'emotional_state'    (aluno expressou frustração, confiança, etc.)
  summary text NOT NULL,
  topic_id text REFERENCES topics(id),
  conversation_id uuid,
  relevance_decay real DEFAULT 1.0,    -- decresce com tempo, 0 = esquecido
  created_at timestamptz DEFAULT now()
);
```

O system prompt do Jarvis inclui as N memórias mais relevantes (por recência × relevância × tópico atual). Isso dá personalidade e continuidade — o Jarvis sente como um tutor que te conhece, não como um chatbot stateless.

---

## JARVIS 3.5 — A Plataforma Aberta

> **Tema central:** O salto de "app pessoal do Otávio" para "plataforma que qualquer estudante pode usar". Multi-user, onboarding inteligente, extensível, mobile-first.

**Pré-requisito:** 3.2 completo. Infraestrutura de auth e RLS conforme PLANO_SISTEMA_USUARIO.md.
**Estimativa:** 6–10 semanas. É a maior mudança de arquitetura.

---

### 3.5.1 — Multi-User + Auth + Row Level Security

Implementação completa do PLANO_SISTEMA_USUARIO.md:

- Supabase Auth (email + Google OAuth)
- `user_id` em todas as tabelas + RLS policies
- Isolamento total de dados entre usuários
- Cada aluno tem seu próprio universo: disciplinas, tópicos, mastery, erros, sessões, flashcards, notas, knowledge graph

**Impacto arquitetural:**

Toda query, todo service, toda API route precisa de `userId`. O service layer (`src/lib/services/*`) já está preparado — basta adicionar o parâmetro e filtrar. Mas é um refactor que toca cada arquivo.

```typescript
// Antes (3.0-3.2):
const notes = await getNotes();

// Depois (3.5):
const { data: { user } } = await supabase.auth.getUser();
const notes = await getNotes(user.id);
// + RLS garante que mesmo se o código errar, dados não vazam
```

---

### 3.5.2 — Onboarding Inteligente: Jarvis Constrói o Universo

**O problema que resolve:** Hoje o app já vem com Cálculo I e Discreta pré-carregados. Para outros alunos, isso é inútil. O onboarding precisa construir o universo acadêmico do zero a partir dos documentos reais do aluno.

**O fluxo:**

```
Novo aluno se registra → Intro do Jarvis → Setup acadêmico →

Jarvis: "Me passa os materiais das suas disciplinas —
plano de ensino, cronograma de aulas, lista de provas.
Pode ser foto, PDF, ou colar o texto."

[aluno faz upload do plano de ensino]

Jarvis: "Analisei o plano de ensino de Álgebra Linear.
Identifiquei:
- 4 módulos, 12 tópicos, 28 subtópicos
- 3 provas + 1 trabalho
- Pré-requisitos sugeridos pelo conteúdo

Confirma se está correto? [preview da estrutura]"

[aluno confirma]

Jarvis cria automaticamente:
✓ Disciplina no banco
✓ Módulos e tópicos
✓ Assessments com datas e pesos
✓ Knowledge graph inicial (baseado nas dependências do conteúdo)
✓ Mastery zerado para todos os tópicos
✓ Plano de estudo inicial

"Seu universo de Álgebra Linear está pronto.
Quer começar a estudar o primeiro tópico?"
```

**Pipeline técnico:**

```
Upload (PDF/imagem/texto)
  → Extração (Claude Vision / text)
  → Parsing estruturado (JSON: módulos, tópicos, datas, pesos)
  → Validação humana (aluno confirma ou corrige)
  → Bootstrap (cria entidades em todas as tabelas)
  → KG generation (Claude infere dependências entre tópicos)
```

---

### 3.5.3 — Plugin System: Extensibilidade

**O problema que resolve:** Cada disciplina tem necessidades diferentes. Cálculo precisa de gráficos de funções. Programação precisa de um editor de código. Física precisa de simulações. O app não pode ter tudo embutido — precisa ser extensível.

**Arquitetura de plugins:**

```typescript
interface JarvisPlugin {
  id: string;
  name: string;
  description: string;
  discipline_types: string[];     // ['math', 'programming', 'physics']

  // Componentes de UI que o plugin injeta
  components: {
    exercise_renderer?: React.ComponentType;    // como mostrar exercícios
    answer_input?: React.ComponentType;         // como capturar respostas
    visualization?: React.ComponentType;        // widgets extras na página
  };

  // Tools que o plugin adiciona ao Jarvis
  tools: JarvisTool[];

  // Hooks no ciclo de vida
  hooks: {
    onExerciseGenerated?: (exercise: Exercise) => Exercise;
    onAnswerSubmitted?: (answer: Answer) => AnalysisResult;
    onTopicOpened?: (topic: Topic) => SidebarContent;
  };
}
```

**Plugins iniciais:**

| Plugin | Função |
|--------|--------|
| `math-renderer` | Renderiza LaTeX, gráficos de funções (Desmos embed), step-by-step visual |
| `code-runner` | Editor Monaco + execução sandbox para disciplinas de programação |
| `proof-assistant` | Interface de prova passo-a-passo para Lógica/Discreta |
| `formula-sheet` | Folha de fórmulas contextual por tópico |

---

### 3.5.4 — Mobile PWA: Estudo em Qualquer Lugar

**O problema que resolve:** Estudo não acontece só no computador. Na fila do RU, no ônibus, entre aulas. O app precisa funcionar no celular — não como app nativo (complexidade desnecessária), mas como PWA com offline support.

**O que funciona offline:**

- Flashcards (sync quando reconectar)
- Notas (leitura)
- Quick Capture (fila de processamento)
- Timer de sessão de estudo

**O que precisa de conexão:**

- Geração de exercícios (requer Claude)
- Chat com Jarvis
- Simulados
- Sync de dados

**Implementação:** Service Worker + IndexedDB para cache local. Sync queue para Quick Captures feitos offline.

---

### 3.5.5 — Dashboard Reimaginado: Mission Control

Com todos os dados das versões 3.0-3.2, o dashboard vira uma Mission Control real:

```
┌─────────────────────────────────────────────────────────────┐
│ MISSION CONTROL                           27 mar 2026 · 8h │
│                                                             │
│ ┌─── BRIEFING DO DIA ──────────────────────────────────┐   │
│ │ "Bom dia, Otávio. P1 de Cálculo em 17 dias.         │   │
│ │  Readiness: 42%. Foco hoje: Cálculo de Limites.      │   │
│ │  Sessão recomendada: 40min teoria + 20min exercícios."│   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─── PROJEÇÃO ────┐  ┌─── REVISÃO URGENTE ──────────┐    │
│ │ P1 Cálculo      │  │ 🃏 5 flashcards vencidos      │    │
│ │ ████████░░ 6.8  │  │ 📝 Nota Conjuntos (ret. 45%) │    │
│ │ Meta: 7.0  ▲42% │  │ 🏋️ 2 exercícios composição   │    │
│ │                  │  │                               │    │
│ │ P1 Discreta     │  │ [INICIAR REVISÃO — 15 min]    │    │
│ │ ██████░░░░ 5.4  │  └───────────────────────────────┘    │
│ │ Meta: 7.0  ▲31% │                                       │
│ └──────────────────┘  ┌─── ALERTAS ──────────────────┐    │
│                        │ ⚠️ Retenção em Limites caindo │    │
│ ┌─── STREAK ──────┐  │ ⚠️ Nenhuma sessão há 2 dias   │    │
│ │ 🔥 5 dias        │  │ 💡 Ponte: Conjuntos ↔ Domínio │    │
│ │ Ret. média: 72%  │  └───────────────────────────────┘    │
│ └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## JARVIS 4.0 — O Segundo Cérebro Autônomo

> **Tema central:** O Jarvis deixa de ser um copiloto que precisa de input humano e se torna um agente autônomo que mantém o sistema de estudo vivo mesmo sem o aluno abrir o app. Ele aprende a aprender. Ele se auto-melhora. Ele gera conhecimento novo.

**Pré-requisito:** 3.5 completo e estável, com dados suficientes de múltiplos usuários.
**Estimativa:** 8–12 semanas. É a versão mais ambiciosa e a mais experimental.

---

### 4.0.1 — Agente Autônomo: Jarvis que Age Sozinho

**O problema que resolve:** Mesmo com a Consciência Situacional do 3.0, o Jarvis só *alerta* — o aluno precisa agir. O 4.0 permite que o Jarvis *aja autonomamente* dentro de limites configurados pelo aluno.

**Níveis de autonomia (configuráveis):**

```
Nível 1 — Observador (padrão):
  Jarvis alerta, o aluno decide e executa.
  (Equivalente ao 3.0)

Nível 2 — Conselheiro:
  Jarvis sugere ações específicas. O aluno aprova com um tap.
  "Gerei 5 flashcards de limites. [Aprovar] [Editar] [Descartar]"

Nível 3 — Copiloto:
  Jarvis executa ações de baixo risco automaticamente e avisa.
  Ações de alto risco pedem aprovação.
  Auto: gerar flashcards, reagendar sessões, criar notas de revisão
  Pede aprovação: alterar mastery, deletar conteúdo, mudar plano

Nível 4 — Piloto Automático:
  Jarvis mantém o sistema inteiro funcionando autonomamente.
  Gera conteúdo, ajusta planos, reage a padrões, evolui o KG.
  O aluno só estuda — o Jarvis cuida de todo o resto.
```

**Exemplo do Nível 4 em ação (sem o aluno abrir o app):**

```
[Domingo, 2h — cron noturno]

Jarvis autonomamente:
1. Analisa forgetting curves de todos os tópicos
2. Detecta que 3 tópicos vão cruzar o threshold de retenção amanhã
3. Gera flashcards de revisão para esses tópicos
4. Recalcula plano da semana baseado no progresso atual
5. Identifica que P2 de Discreta mudou de data (detectado via
   integração com calendário acadêmico, se disponível)
6. Reajusta todo o cronograma
7. Gera briefing para quando o aluno abrir o app segunda de manhã

[Segunda, 8h — aluno abre o app]

Jarvis: "Fiz algumas coisas durante o fim de semana:
✓ 9 flashcards novos gerados (3 tópicos em risco de esquecimento)
✓ Plano da semana recalculado (P2 de Discreta antecipou 3 dias)
✓ 2 exercícios de reforço prontos para Regra da Cadeia
✓ Nota-resumo 'Quick Review: Derivadas' criada no vault

Tudo pronto pra começar. Sessão de hoje: 35 min de Derivadas."
```

**Implementação técnica:**

```typescript
// src/lib/agents/autonomous-agent.ts

interface AutonomyConfig {
  level: 1 | 2 | 3 | 4;
  auto_actions: {
    generate_flashcards: boolean;
    adjust_schedule: boolean;
    create_review_notes: boolean;
    update_mastery: boolean;
    modify_kg: boolean;
    generate_exercises: boolean;
  };
  notification_preferences: {
    channel: 'in_app' | 'email' | 'push';
    frequency: 'immediate' | 'daily_digest' | 'weekly';
  };
}

// Supabase Edge Function — roda em cron
async function autonomousCycle(userId: string, config: AutonomyConfig) {
  const context = await buildFullStudentContext(userId);
  const actions = await planActions(context, config);

  for (const action of actions) {
    if (requiresApproval(action, config)) {
      await queueForApproval(action);
    } else {
      await executeAction(action);
      await logAction(action);  // transparência total
    }
  }

  await generateBriefing(userId, actions);
}
```

---

### 4.0.2 — Transfer Learning entre Semestres

**O problema que resolve:** No fim do semestre, o aluno começa tudo do zero no próximo. Mas ele não é a mesma pessoa — ele tem um perfil cognitivo construído, padrões de erro identificados, preferências pedagógicas calibradas. Jogar isso fora é desperdício.

**Como funciona:**

Quando o novo semestre começa, o Jarvis faz um "transfer":

```
Jarvis: "Novo semestre! Trouxe do semestre anterior:

📊 Seu perfil cognitivo:
  - Horário ótimo: manhã (dados de 47 sessões)
  - Sessão ideal: 38 min (mediana das suas 10 melhores sessões)
  - Modalidade que mais funciona: exercícios práticos
  - Tipo de erro dominante: processual (mas melhorou 34%)

🧠 Transferências de conhecimento:
  - Cálculo I → Cálculo II: mastery de Derivadas transferido,
    base para Integrais
  - Mat. Discreta → Algoritmos: Grafos e Lógica transferidos
  - Analogias que funcionaram: salvas e reutilizáveis

⚙️ Calibrações mantidas:
  - Forgetting curve personalizada (seus parâmetros FSRS)
  - Adaptive difficulty calibration
  - Preferências de explicação

Quer manter as mesmas configurações de autonomia (Nível 3)?"
```

**Implementação:**

```sql
CREATE TABLE semester_transfer (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  from_semester text NOT NULL,
  to_semester text NOT NULL,
  cognitive_profile jsonb NOT NULL,     -- perfil completo do learner
  transferred_mastery jsonb,            -- tópicos que persistem
  fsrs_parameters jsonb,               -- curva personalizada
  pedagogical_preferences jsonb,       -- analogias, modalidades
  created_at timestamptz DEFAULT now()
);
```

---

### 4.0.3 — Geração Autônoma de Currículo: Jarvis Cria o Knowledge Graph

**O problema que resolve:** No 3.5, o onboarding cria o KG a partir do plano de ensino — mas é um KG básico. No 4.0, o Jarvis *enriquece continuamente* o knowledge graph baseado no que o aluno estuda, nas perguntas que faz, e nos erros que comete.

**Como funciona:**

```
[Aluno estuda Regra da Cadeia, erra exercício porque não
lembrou de Derivada da Exponencial]

Jarvis detecta: não existe aresta no KG entre "Regra da Cadeia"
e "Derivada da Exponencial". Mas os dados mostram dependência.

Jarvis autonomamente:
1. Cria edge: Derivada da Exponencial → Regra da Cadeia
   (relation: 'prerequisite', source: 'inferred_from_errors')
2. Recalcula learning paths que passam por Regra da Cadeia
3. Identifica que outros alunos (multi-user) também erram
   nessa transição → confirma a aresta com confiança alta
```

**KG Evolution Engine:**

```typescript
interface KgEvolution {
  // Fontes de novas arestas
  sources: {
    error_patterns: ErrorCorrelation[];     // erros que co-ocorrem
    study_sequences: StudyPathAnalysis[];   // o que alunos estudam junto
    question_patterns: QuestionFlow[];      // perguntas que levam a outras
    cross_user_signals: AggregateSignal[];  // padrões entre usuários
  };

  // Pipeline
  pipeline: {
    detect: () => CandidateEdge[];          // detecta possíveis arestas
    validate: (edge: CandidateEdge) => ConfidenceScore;  // valida com dados
    propose: (edge: ValidatedEdge) => void;  // propõe ao sistema
    integrate: (edge: ApprovedEdge) => void;  // integra ao KG
  };

  // O KG literalmente evolui com o uso
}
```

---

### 4.0.4 — Jarvis Ensina Jarvis: Meta-Otimização Pedagógica

**O problema que resolve:** As explicações e exercícios do Jarvis são gerados pelo Claude com prompts estáticos. Mas com dados suficientes, o sistema pode aprender *quais tipos de prompt geram melhor aprendizagem*. O Jarvis otimiza a si mesmo.

**Como funciona:**

```
O Jarvis mantém um registro:
- Explicação A (analogia visual) para Tópico X → aluno entendeu
  (mastery subiu, exercícios posteriores corretos)
- Explicação B (formal/matemática) para Tópico X → aluno não entendeu
  (mastery estável, erros persistiram)

Conclusão: para ESTE aluno, analogias visuais funcionam melhor
para tópicos abstratos. Ajustar system prompt.

Com múltiplos alunos:
- Explicação A funciona para 73% dos alunos com perfil "visual"
- Explicação B funciona para 81% dos alunos com perfil "formal"

→ Jarvis aprende a segmentar e personalizar automaticamente
```

**Implementação:**

```sql
CREATE TABLE pedagogical_experiments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_type text NOT NULL,     -- 'explanation_style', 'exercise_format',
                                     -- 'difficulty_curve', 'review_timing'
  variant_a jsonb NOT NULL,          -- parâmetros da variante A
  variant_b jsonb NOT NULL,          -- parâmetros da variante B
  metric text NOT NULL,              -- 'mastery_delta', 'retention_7d', 'time_to_mastery'
  results jsonb,                     -- resultados observados
  winner text,                       -- 'a', 'b', 'inconclusive'
  confidence real,                   -- p-value
  applied_to_prompt boolean DEFAULT false,  -- se já foi integrado ao system prompt
  created_at timestamptz DEFAULT now()
);
```

A/B testing automatizado em explicações, exercícios, timings de revisão. O Jarvis literalmente roda experimentos pedagógicos e aplica os resultados. É machine learning sobre o processo de ensino.

---

### 4.0.5 — Modo Professor: Jarvis para Docentes

**O problema que resolve:** O Jarvis conhece profundamente os padrões de erro dos alunos. Esses dados são valiosos para professores — se agregados e anonimizados. "72% da turma erra composição de funções por inverter a ordem" é informação que muda como o professor ensina.

**Dashboard do professor:**

```
┌─────────────────────────────────────────────────────────────┐
│ PAINEL DOCENTE — Cálculo I (Turma 31)                       │
│                                                             │
│ 📊 Saúde da turma:                                         │
│ ████████████████░░░░ 62% readiness médio para P1            │
│                                                             │
│ 🔴 Tópicos mais problemáticos:                              │
│ 1. Cálculo de limites — 78% da turma abaixo de 'proficient'│
│ 2. Composição de funções — erro mais comum: ordem invertida │
│ 3. Epsilon-delta — 91% nunca tentou exercício               │
│                                                             │
│ 💡 Sugestão: dedicar aula extra a indeterminações 0/0       │
│    (63% dos erros em limites são nessa categoria)            │
│                                                             │
│ 📈 Evolução pós-P1:                                        │
│ [gráfico de mastery médio da turma ao longo do semestre]    │
└─────────────────────────────────────────────────────────────┘
```

**Privacidade:** Dados individuais nunca são expostos ao professor. Tudo é agregado (mínimo 5 alunos por métrica). O aluno opta-in explicitamente.

---

## JARVIS 5.0 — O Learning OS

> **Tema central:** O Jarvis deixa de ser um app de estudo e se torna um **sistema operacional de aprendizagem** — uma camada de inteligência que permeia toda a vida acadêmica e profissional do aluno. Não é mais sobre passar em provas. É sobre construir competência real e conectá-la com o mundo.

**Pré-requisito:** 4.0 maduro com base de usuários ativa e dados pedagógicos robustos.
**Estimativa:** 10–16 semanas. É a transformação de produto em plataforma.

---

### 5.0.1 — Social Learning Network: Inteligência Coletiva

**O problema que resolve:** Até o 4.0, estudar é uma atividade solitária dentro do Jarvis. Mas aprendizagem é fundamentalmente social — grupos de estudo, monitoria, dúvidas compartilhadas, explicações entre colegas. O 5.0 conecta cérebros.

**Como funciona:**

Não é uma rede social genérica. É uma rede de aprendizagem onde cada conexão é mediada pelo knowledge graph e pelos dados de mastery. O Jarvis sabe exatamente quem pode ajudar quem.

```
Jarvis: "Você está travado em Epsilon-Delta há 3 dias.
Encontrei 2 colegas que podem ajudar:

👤 Ana (Turma 31) — dominou Epsilon-Delta semana passada.
   A explicação que funcionou pra ela: analogia com intervalo
   de tolerância em engenharia. Compatibilidade pedagógica: 87%.

👤 Pedro (Turma 30) — teve o MESMO erro que você
   (confundir ε com δ) e superou. Pode contar o que fez.
   Compatibilidade: 79%.

Quer que eu abra uma sessão de estudo colaborativa?"
```

**Matchmaking inteligente:**

O Jarvis não conecta pessoas aleatoriamente. Ele calcula compatibilidade baseada em:

```typescript
interface StudyMatchScore {
  // Complementaridade de conhecimento
  knowledge_complementarity: number;
  // Ana sabe o que Otávio não sabe, e vice-versa

  // Similaridade de perfil cognitivo
  cognitive_similarity: number;
  // Se ambos aprendem melhor com exemplos visuais, vão se entender

  // Histórico de erros compartilhados
  shared_error_patterns: number;
  // Quem superou o mesmo erro é o melhor professor

  // Compatibilidade de horários
  schedule_overlap: number;

  // Rating de interações anteriores (se houver)
  past_interaction_quality: number;
}
```

**Modos de colaboração:**

| Modo | Descrição | Mediação do Jarvis |
|------|-----------|-------------------|
| **Study Buddy** | Dois alunos estudam o mesmo tópico juntos | Jarvis gera exercícios pareados, cada um resolve e explica pro outro |
| **Teach-to-Learn** | Aluno forte explica para aluno fraco | Jarvis avalia a explicação (Feynman mode) e dá crédito de mastery ao "professor" |
| **Error Swap** | Alunos trocam seus erros mais comuns | Jarvis monta exercícios baseados nos erros do outro — perspectiva nova |
| **Simulation Duel** | Dois alunos fazem o mesmo simulado simultaneamente | Ranking + análise comparativa pós-simulado |
| **Knowledge Merge** | Alunos combinam suas notas sobre um tópico | Jarvis sintetiza as duas perspectivas numa nota mais completa |

**O aluno que ensina também aprende:**

```
[Ana explica Epsilon-Delta para Otávio via Teach-to-Learn]

Jarvis para Ana: "Sua explicação cobriu 85% dos conceitos-chave.
Faltou mencionar que δ depende de ε (e não o contrário).
Seu mastery em Epsilon-Delta subiu de 82% para 88% — ensinar
consolidou seu conhecimento."

Jarvis para Otávio: "Entendeu a explicação? Vou fazer
3 perguntas para verificar."
```

**Implementação técnica:**

```sql
CREATE TABLE study_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a uuid REFERENCES auth.users(id),
  user_b uuid REFERENCES auth.users(id),
  connection_type text NOT NULL,     -- 'study_buddy', 'mentor_mentee', 'peer'
  compatibility_score real,
  topics_in_common text[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE collaborative_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_type text NOT NULL,        -- 'teach_to_learn', 'study_buddy', 'simulation_duel', etc.
  participants uuid[] NOT NULL,
  topic_id text REFERENCES topics(id),
  jarvis_mediation jsonb,            -- intervenções e avaliações do Jarvis
  outcomes jsonb,                    -- mastery deltas para cada participante
  quality_rating real,               -- rating mútuo
  created_at timestamptz DEFAULT now()
);

-- Leaderboard ético: baseado em contribuição, não competição
CREATE TABLE community_contribution (
  user_id uuid REFERENCES auth.users(id) PRIMARY KEY,
  explanations_given integer DEFAULT 0,
  explanations_quality_avg real DEFAULT 0,
  peers_helped integer DEFAULT 0,
  knowledge_shared_topics text[],
  contribution_score real DEFAULT 0   -- calculado por fórmula ponderada
);
```

**Anti-padrão importante:** Isso NÃO é gamificação competitiva. O leaderboard mede *contribuição*, não *nota*. Quem mais ajuda os outros sobe no ranking — não quem tira a maior nota. Isso incentiva o comportamento certo.

---

### 5.0.2 — Real-World Bridge: Do Acadêmico ao Profissional

**O problema que resolve:** O Jarvis até o 4.0 vive dentro do universo acadêmico — provas, notas, exercícios. Mas o aluno de CC está aprendendo pra construir coisas reais. Não existe ponte entre "dominar Grafos em Discreta" e "usar Grafos pra resolver um problema real de engenharia de software".

**Como funciona:**

O Jarvis conecta cada tópico acadêmico com aplicações reais no campo do aluno.

```
[Otávio domina Grafos em Matemática Discreta]

Jarvis: "Você dominou Grafos. Esse conhecimento tem
aplicação direta em:

💻 Shortest Path em redes — algoritmo de Dijkstra
   (base de GPS, roteamento de rede)
💻 Dependency resolution — como o npm resolve pacotes
   (é literalmente topological sort no DAG)
💻 Social network analysis — como o Instagram sugere
   quem seguir (grafos + BFS)

Mini-projeto sugerido: implementar um resolver de
dependências simples em TypeScript que recebe um
package.json e retorna a ordem de instalação.

Tempo estimado: 2h. Usa grafos + topological sort.
Quer começar?"
```

**Modos de ponte:**

```
1. CONTEXT LINK
   Após dominar tópico acadêmico, Jarvis mostra onde ele
   aparece no mundo real com exemplos do campo do aluno.

2. MINI-PROJECT
   Projeto prático de 1-4h que aplica o conceito acadêmico
   num cenário de engenharia de software real.

3. INTERVIEW PREP
   "Esse conceito aparece em entrevistas técnicas. Aqui está
   um problema estilo LeetCode que usa exatamente isso."

4. PAPER CONNECTION
   "Esse conceito é base do paper 'PageRank: Bringing Order
   to the Web' (1998). Quer um resumo de 5 minutos?"

5. TOOL CONNECTION
   "O PostgreSQL usa B-Trees (que você estudou em Estrutura
   de Dados) para indexação. Quer entender como?"
```

**Implementação técnica:**

```sql
CREATE TABLE real_world_bridges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id text REFERENCES topics(id),
  bridge_type text NOT NULL,          -- 'application', 'mini_project', 'interview',
                                      -- 'paper', 'tool'
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL,           -- 'beginner', 'intermediate', 'advanced'
  estimated_hours real,
  field text NOT NULL,                -- 'software_engineering', 'data_science', etc.
  prerequisites text[],               -- tópicos que o aluno precisa dominar
  resources jsonb,                    -- links, papers, repositórios
  created_at timestamptz DEFAULT now()
);

-- Gerado dinamicamente pelo Claude baseado no perfil do aluno
-- e enriquecido com dados de múltiplos alunos ao longo do tempo
```

```typescript
// src/lib/services/real-world-bridge.ts
async function generateBridges(
  topic: Topic,
  studentProfile: LearnerProfile,
  field: string  // do perfil do aluno (CC, Eng. Elétrica, etc.)
): Promise<RealWorldBridge[]> {
  // Claude gera pontes personalizadas:
  // - Baseado no campo do aluno
  // - Calibrado pelo mastery atual
  // - Conectado com tópicos futuros do currículo
  // - Referenciando ferramentas e tecnologias reais
}
```

---

### 5.0.3 — Career Intelligence: Jarvis como Conselheiro de Carreira

**O problema que resolve:** O aluno de CC faz escolhas de carreira ao longo do curso — estágio, área de especialização, projetos pessoais, tecnologias para aprender. Essas escolhas são feitas quase que às cegas. O Jarvis tem dados sobre as competências do aluno e pode cruzar com dados do mercado.

**Como funciona:**

```
Jarvis: "Análise de perfil de competências (fim do 1º semestre):

🧮 Competências acadêmicas fortes:
   - Lógica e raciocínio formal (mastery 89%)
   - Pensamento algorítmico (mastery 82%)
   - Resolução de problemas matemáticos (mastery 76%)

💻 Afinidades detectadas pelos seus dados:
   - Você rende mais em problemas que envolvem otimização
   - Seus melhores momentos foram resolvendo problemas
     de grafos e estruturas discretas
   - Seu perfil cognitivo favorece pensamento sistemático

📊 Áreas de CS que se alinham com seu perfil:
   1. Backend Engineering / Systems — alta compatibilidade
      (lógica + algoritmos + pensamento sistemático)
   2. Data Engineering — média-alta compatibilidade
      (matemática + otimização)
   3. Competitive Programming — alta compatibilidade
      (velocidade + resolução de problemas)

🎯 Sugestão para o próximo semestre:
   - Disciplinas: Estrutura de Dados (essencial) +
     Programação Orientada a Objetos (base)
   - Projeto pessoal: contribuir para um projeto open-source
     que use grafos (ex: Neo4j, NetworkX)
   - Preparação: começar LeetCode Easy em julho
     (você já tem a base matemática)"
```

**O Jarvis cruza:**

```typescript
interface CareerIntelligence {
  // Dados internos do aluno
  academic_strengths: CompetencyScore[];
  cognitive_profile: LearnerProfile;
  interest_signals: InterestSignal[];     // tópicos onde o aluno gasta mais tempo voluntariamente
  mini_project_performance: ProjectResult[];

  // Dados externos (atualizados periodicamente)
  market_demand: MarketData[];            // vagas, salários, tendências por área
  curriculum_map: CurriculumPath[];       // disciplinas futuras e como se conectam
  alumni_paths: AlumniCareerPath[];       // trajetórias de ex-alunos (anonimizadas)

  // Outputs
  career_alignment: CareerMatch[];
  recommended_next_semester: CourseRecommendation[];
  skill_gaps_for_target: SkillGap[];
  project_suggestions: ProjectSuggestion[];
}
```

**Implementação:**

```sql
CREATE TABLE career_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  competency_scores jsonb NOT NULL,       -- atualizado a cada mudança de mastery
  interest_signals jsonb,                 -- inferido do comportamento
  career_interests text[],               -- declarado pelo aluno
  target_roles text[],                   -- ex: ['backend_engineer', 'data_engineer']
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE career_recommendations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  recommendation_type text NOT NULL,      -- 'course', 'project', 'skill', 'role', 'internship'
  title text NOT NULL,
  reasoning text NOT NULL,                -- por que essa recomendação
  confidence real,
  data_sources text[],                    -- quais dados fundamentam
  is_acted_on boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

---

### 5.0.4 — Open Knowledge Protocol: Conhecimento que Transcende o App

**O problema que resolve:** Todo o conhecimento gerado dentro do Jarvis — notas, flashcards, knowledge graphs, explicações que funcionaram — está preso dentro do app. Se o aluno trocar de ferramenta, perde tudo. E o conhecimento coletivo gerado por milhares de alunos estudando os mesmos tópicos morre dentro do banco de dados.

**Como funciona:**

O Jarvis implementa um protocolo aberto de exportação/importação de conhecimento.

**Para o aluno individual:**

```
Jarvis: "Exportar seu conhecimento:

📦 Export completo (Obsidian-compatible):
   - 47 notas em Markdown com frontmatter
   - 156 flashcards em formato Anki (.apkg)
   - Knowledge graph em formato .json (importável no Obsidian Graph)
   - Perfil cognitivo em .json (portável para outros sistemas)

📦 Export seletivo:
   - Apenas Cálculo I
   - Apenas flashcards vencidos
   - Apenas o knowledge graph

Seus dados são seus. Sempre."
```

**Para a comunidade (opt-in):**

```
Jarvis: "Contribuir para o Knowledge Commons:

Você pode compartilhar (anonimamente):
✓ Suas melhores notas sobre Limites (rated 4.8/5 por peers)
✓ O knowledge graph de Cálculo I (verificado por 12 alunos)
✓ Seus flashcards de Composição de Funções (retenção média 91%)

Em troca, você acessa:
✓ O knowledge graph coletivo de Álgebra Linear
  (construído por 340 alunos de 15 universidades)
✓ As 10 melhores explicações de Epsilon-Delta
  (ranqueadas por eficácia medida, não por likes)
✓ Flashcard decks curados pela comunidade

Contribuir? [Sim, anonimamente] [Escolher o que compartilhar] [Não]"
```

**O diferencial:** O ranking de conteúdo não é por popularidade — é por **eficácia medida**. Uma explicação que fez o mastery subir em 80% dos alunos que a leram é melhor que uma com 1000 likes. O Jarvis tem os dados para medir isso.

**Implementação técnica:**

```typescript
// Open Knowledge Protocol
interface KnowledgeExport {
  format: 'obsidian' | 'anki' | 'json' | 'markdown';
  scope: 'full' | 'discipline' | 'topic' | 'custom';
  includes: {
    notes: boolean;
    flashcards: boolean;
    knowledge_graph: boolean;
    cognitive_profile: boolean;
    study_history: boolean;       // anonimizado se compartilhado
  };
  privacy: 'private' | 'anonymous_community' | 'public';
}

// Knowledge Commons — conteúdo da comunidade
interface KnowledgeCommons {
  // Conteúdo ranqueado por eficácia, não popularidade
  ranking_algorithm: {
    primary: 'mastery_delta_after_consumption';  // quanto o mastery subiu
    secondary: 'retention_7d_after_consumption'; // quanto reteve após 7 dias
    tertiary: 'peer_rating';                     // rating de qualidade
    anti_signal: 'time_spent';                   // tempo gasto ≠ qualidade
  };
}
```

```sql
CREATE TABLE knowledge_commons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type text NOT NULL,            -- 'note', 'flashcard_deck', 'knowledge_graph',
                                         -- 'explanation', 'exercise_set'
  topic_canonical text NOT NULL,         -- tópico normalizado (ex: 'calculus.limits.epsilon_delta')
  content jsonb NOT NULL,
  contributor_id uuid,                   -- null se anônimo
  university text,                       -- metadata opcional
  effectiveness_score real,              -- calculado por medições reais
  consumption_count integer DEFAULT 0,
  mastery_delta_avg real,                -- média de melhora de mastery dos consumidores
  retention_7d_avg real,                 -- retenção média 7 dias após consumo
  created_at timestamptz DEFAULT now()
);

-- Garante que métricas de eficácia são calculadas, não self-reported
CREATE TABLE knowledge_consumption_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  commons_item_id uuid REFERENCES knowledge_commons(id),
  consumer_id uuid REFERENCES auth.users(id),
  mastery_before real,
  mastery_after real,                    -- medido 24h depois
  retention_7d real,                     -- medido 7 dias depois
  consumer_rating integer,              -- 1-5
  created_at timestamptz DEFAULT now()
);
```

---

### 5.0.5 — Learning OS: Integrações que Fazem o Jarvis Onipresente

**O problema que resolve:** O aluno vive em múltiplos ambientes — VS Code pra programar, Google Calendar pra horários, Notion/Obsidian pra notas pessoais, WhatsApp pra grupos de estudo, o portal da universidade pra notas oficiais. O Jarvis vive numa aba do browser. Para ser um verdadeiro OS de aprendizagem, ele precisa estar em todos esses contextos.

**Integrações:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    JARVIS LEARNING OS                            │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ VS Code  │  │ Calendar │  │ Obsidian │  │ WhatsApp │       │
│  │ Extension│  │  Sync    │  │  Plugin  │  │   Bot    │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │              │             │
│       └──────────────┴──────┬───────┴──────────────┘             │
│                             │                                    │
│                    ┌────────▼────────┐                           │
│                    │   JARVIS CORE   │                           │
│                    │   (API Layer)   │                           │
│                    └────────┬────────┘                           │
│                             │                                    │
│       ┌──────────────┬──────┴───────┬──────────────┐            │
│  ┌────▼─────┐  ┌─────▼────┐  ┌─────▼────┐  ┌──────▼─────┐     │
│  │ Browser  │  │  Chrome  │  │  Mobile  │  │  CLI Tool  │     │
│  │Extension │  │  Tab     │  │  PWA     │  │  (terminal)│     │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

**VS Code Extension — Jarvis para Programação:**

```
[Otávio está programando em Python, escrevendo um sort]

Jarvis (sidebar do VS Code): "Vejo que você está implementando
um bubble sort. Esse algoritmo tem complexidade O(n²).

Isso conecta com o tópico 'Complexidade' que você vai ver
em Algoritmos no 2º semestre. Quer uma prévia de 2 minutos
sobre Big-O enquanto o conceito está fresco?"

[Otávio erra um off-by-one error]

Jarvis: "Off-by-one em loop. Registrei como erro processual.
Esse padrão apareceu 3x nas últimas 2 semanas. Dica: sempre
verifique se o range inclui ou exclui o último elemento."
```

**Google Calendar Sync:**

```typescript
// Bidirecional:
// Jarvis → Calendar: sessões de estudo planejadas aparecem no calendar
// Calendar → Jarvis: mudanças de horário recalculam o plano

interface CalendarSync {
  study_sessions_to_calendar: boolean;     // sessões planejadas → eventos
  exam_dates_to_calendar: boolean;         // provas → eventos com alertas
  calendar_to_jarvis: boolean;             // compromissos → Jarvis ajusta plano
  busy_time_detection: boolean;            // detecta horários ocupados automaticamente
}
```

**WhatsApp Bot (ou Telegram):**

```
[Grupo de estudo no WhatsApp]

Colega: "alguém sabe resolver aquele exercício 3 da lista de limites?"

Jarvis Bot: "O exercício 3 pede lim(x→0) (1-cos(x))/x².
Dica sem spoiler: use a identidade 1-cos(x) = 2sin²(x/2).
Quer a resolução completa? Responde 'sim'."

[Mensagem direta para o Jarvis Bot]

Otávio: "estudei 30min de derivadas"

Jarvis: "Registrado ✓ Sessão de 30min salva.
Quer fazer 3 exercícios rápidos pra consolidar?"
```

**CLI Tool — Jarvis no Terminal:**

```bash
$ jarvis status
┌─────────────────────────────────────┐
│ P1 Cálculo: 15 dias · Readiness 48%│
│ P1 Discreta: 19 dias · Readiness 61%│
│ Flashcards vencidos: 7              │
│ Streak: 5 dias 🔥                   │
└─────────────────────────────────────┘

$ jarvis study limits --time 30
Starting study session: Cálculo de Limites (30 min)
Exercise 1/6: lim(x→3) (x²-9)/(x-3) = ?
> 6
✅ Correct (12s)
Exercise 2/6: ...

$ jarvis capture "errei derivada de ln(x), confundi com 1/x²"
Captured ✓ Error logged: Derivadas (processual — fórmula incorreta)
```

**Implementação — API Layer:**

```typescript
// src/app/api/v1/ — API pública RESTful

// Endpoints para integrações externas:
// POST /api/v1/capture          — Quick Capture universal
// GET  /api/v1/status           — Status do aluno
// GET  /api/v1/today            — Briefing do dia
// POST /api/v1/session          — Registrar sessão de estudo
// GET  /api/v1/flashcards/due   — Flashcards vencidos
// POST /api/v1/flashcards/review — Registrar revisão
// GET  /api/v1/exercises        — Próximos exercícios recomendados
// POST /api/v1/exercises/submit — Submeter resposta
// GET  /api/v1/graph            — Knowledge graph (JSON)
// GET  /api/v1/export           — Export completo

// Autenticação: API key por usuário
// Rate limiting: 100 req/min
// Webhooks: notificações para integrações
```

---

### 5.0.6 — Institutional Intelligence: Jarvis para Universidades

**O problema que resolve:** O Modo Professor do 4.0 é individual. O 5.0 escala isso para a instituição inteira. A universidade pode ter um painel de inteligência educacional que mostra padrões sistêmicos — não para vigiar alunos, mas para melhorar o ensino.

**Dashboard institucional:**

```
PUCRS — Escola Politécnica — Painel de Inteligência Educacional

📊 Semestre 2026/1 — Visão Geral

Disciplinas com maior taxa de retenção abaixo do esperado:
1. Cálculo I (Turmas 30-33) — 43% dos alunos abaixo de readiness 50%
   Tópico crítico: Epsilon-Delta (89% dos alunos não tentam exercícios)
   Recomendação: material complementar visual + mais exercícios guiados

2. Física I (Turmas 20-22) — 38% abaixo de readiness 50%
   Tópico crítico: Leis de Newton em 2D
   Recomendação: simulações interativas + exercícios contextualizados

Padrão cross-disciplina detectado:
  Alunos que cursam Cálculo I + Física I simultaneamente
  e dominam Funções em Cálculo rendem 34% melhor em
  Cinemática em Física. Sugestão: sincronizar cronogramas.

Evasão — sinais precoces detectados em 12 alunos:
  - Sem login há 14+ dias
  - Readiness < 30% em todas as disciplinas
  - Padrão de queda consistente nas últimas 4 semanas
  [Encaminhar para coordenação acadêmica]
```

**Ética e privacidade:**

```typescript
interface InstitutionalPolicy {
  // REGRAS INVIOLÁVEIS
  individual_data_visible: false;              // NUNCA dados individuais
  minimum_aggregation_group: 10;               // mínimo 10 alunos por métrica
  student_opt_in_required: true;               // aluno escolhe participar
  evasion_alerts_require_consent: true;        // aluno autoriza alerta
  data_used_for: 'improving_teaching_only';    // nunca para punição
  retention_period_months: 24;                 // dados expiram
  right_to_withdraw: 'immediate';             // aluno pode sair a qualquer momento
}
```

---

### 5.0.7 — Jarvis Research Mode: Do Estudo à Produção de Conhecimento

**O problema que resolve:** Até o 4.0, o Jarvis ajuda a *consumir* conhecimento. Mas na universidade, especialmente a partir do 3º-4º semestre, o aluno começa a *produzir* conhecimento — trabalhos de conclusão, artigos, projetos de pesquisa. O Jarvis pode ser o copiloto de pesquisa.

**Como funciona:**

```
[Otávio no 4º semestre, começando IC em Grafos]

Jarvis: "Modo Pesquisa ativado para: 'Algoritmos de
Detecção de Comunidades em Grafos Dinâmicos'

📚 Literature Review assistido:
   Encontrei 23 papers relevantes (2020-2026).
   Organizei em 3 clusters temáticos:
   1. Métodos espectrais (8 papers)
   2. Label propagation (9 papers)
   3. Deep learning em grafos (6 papers)

   Cada cluster tem um resumo de 1 página +
   knowledge graph dos conceitos-chave +
   gaps identificados na literatura.

🔬 Seu knowledge graph pessoal de Grafos (construído
   desde o 1º semestre) já cobre 60% dos pré-requisitos.
   Gaps para cobrir: Autovalores (Álgebra Linear) e
   Graph Neural Networks.

📝 Template de artigo configurado com:
   - Normas ABNT/ACM (configurável)
   - Bibliografia auto-gerenciada
   - Citações inline assistidas"
```

**Research Pipeline:**

```typescript
interface ResearchMode {
  // Fase 1: Exploração
  literature_search: {
    sources: ['arxiv', 'semantic_scholar', 'google_scholar'];
    auto_summarize: boolean;
    cluster_by_theme: boolean;
    identify_gaps: boolean;
    connect_to_personal_kg: boolean;  // ponte com o KG do aluno
  };

  // Fase 2: Organização
  knowledge_management: {
    annotation_system: boolean;       // anotar papers com highlights
    concept_extraction: boolean;      // extrair conceitos → KG de pesquisa
    citation_graph: boolean;          // visualizar quem cita quem
    reading_queue: boolean;           // priorizado por relevância
  };

  // Fase 3: Produção
  writing_assistant: {
    outline_generation: boolean;
    section_drafting: boolean;
    citation_management: boolean;     // BibTeX auto-gerado
    consistency_check: boolean;       // verifica coerência do argumento
    formatting: 'abnt' | 'acm' | 'ieee' | 'custom';
  };

  // Fase 4: Revisão
  peer_review_simulation: {
    simulate_reviewer: boolean;       // Claude simula reviewer crítico
    check_methodology: boolean;
    verify_claims: boolean;
    suggest_improvements: boolean;
  };
}
```

---

## Cronograma Consolidado

```
              MAR    ABR    MAI    JUN    JUL    AGO    SET    OUT    NOV
              ├──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
JARVIS 3.0    ██████ ←── 6 ideias core
                     │
JARVIS 3.1           ████████
                     │ Multimodal + Quick Capture
                     │ Peer Teaching + Self-Analytics
                     │          │
JARVIS 3.2                     ████████
                               │ Cross-discipline + Adaptive Flow
                               │ Predictive Engine + Memory
                               │          │
JARVIS 3.5                                ██████████████
                                          │ Multi-user + Auth + RLS
                                          │ Onboarding + Plugins + PWA
                                          │                │
JARVIS 4.0                                                 ██████████████
                                                           │ Agente autônomo
                                                           │ Transfer + KG evolution
                                                           │ Meta-otimização + Prof.
                                                           │              │
JARVIS 5.0                                                                ██████████████ →→
                                                                          │ Social Learning
                                                                          │ Real-World Bridge
                                                                          │ Career Intelligence
                                                                          │ Open Knowledge
                                                                          │ Learning OS
                                                                          │ Institutional
                                                                          │ Research Mode
```

---

## Princípios de Evolução

Cada versão segue quatro regras:

**1. Dados das versões anteriores alimentam as seguintes.** O Self-Analytics do 3.1 depende dos dados da Forgetting Curve do 3.0. A Predictive Engine do 3.2 depende dos dados do Self-Analytics. O Transfer Learning do 4.0 depende de tudo que veio antes. O Social Learning do 5.0 multiplica o valor de tudo que cada aluno construiu individualmente. Nada é descartado — tudo acumula.

**2. Complexidade interna, simplicidade externa.** Cada versão adiciona camadas de inteligência por baixo, mas a interface do aluno fica mais simples, não mais complexa. O Nível 4 de autonomia do 4.0 significa que o aluno faz *menos* — o Jarvis faz mais. O Learning OS do 5.0 significa que o aluno nem precisa abrir o app — o Jarvis está onde ele está.

**3. O aluno sempre tem controle.** De autonomia Nível 1 a Nível 4, cada passo é opt-in. O aluno pode reverter qualquer ação autônoma. No 5.0, dados compartilhados são sempre opt-in e anonimizáveis. Transparência total — o Jarvis sempre explica o que fez e por quê.

**4. Conhecimento é do aluno, não da plataforma.** O Open Knowledge Protocol do 5.0 garante que tudo que o aluno construiu é exportável, portável, e nunca fica preso. Se o aluno sair, leva tudo. Se ficar, contribui com a comunidade e recebe de volta.

---

## A Progressão Filosófica

```
3.0  →  O Jarvis sabe o que você está fazendo.
3.1  →  O Jarvis sente o que você está fazendo (por qualquer canal).
3.2  →  O Jarvis pensa sobre como você pensa.
3.5  →  O Jarvis funciona para qualquer pessoa.
4.0  →  O Jarvis age sozinho enquanto você dorme.
5.0  →  O Jarvis conecta seu conhecimento com o mundo.
```

*"O 3.0 é o copiloto. O 4.0 é o segundo cérebro. O 5.0 é o sistema nervoso de uma comunidade inteira de aprendizagem."*

— Roadmap Jarvis 3.1→5.0, 27 de março de 2026
