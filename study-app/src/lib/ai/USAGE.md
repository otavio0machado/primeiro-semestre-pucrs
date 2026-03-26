# AI Integration — Guia de Uso e Estratégia de Custo

## Setup

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

Nunca commitar a chave. O `.env.local` já está no `.gitignore`.

---

## Endpoints

| Endpoint                     | Método | Descrição                          |
|------------------------------|--------|------------------------------------|
| `/api/ai/explain`            | POST   | Explica um tópico adaptado         |
| `/api/ai/tutor`              | POST   | Tutoria socrática (chat)           |
| `/api/ai/classify-error`     | POST   | Classifica erro do aluno           |
| `/api/ai/flashcards`         | POST   | Gera flashcards                    |
| `/api/ai/notes`              | POST   | Gera notas de estudo               |
| `/api/ai/exam-plan`          | POST   | Plano de estudo para prova         |
| `/api/ai/summarize`          | POST   | Resume documento                   |
| `/api/ai/exercises`          | POST   | Gera exercícios adaptativos        |

---

## Exemplos de Uso (fetch client-side)

### Explicar tópico

```ts
const res = await fetch("/api/ai/explain", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    topicName: "Limites no infinito",
    courseName: "Cálculo I",
    masteryLevel: "exposed",
    prerequisites: ["Conceito de função", "Funções essenciais"],
    focus: "intuição geométrica"
  })
});
const { data, meta } = await res.json();
// data.explanation, data.analogies, data.nextTopics
// meta.usage.estimatedCostUSD
```

### Tutor (chat)

```ts
const res = await fetch("/api/ai/tutor", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    topicName: "Lógica proposicional",
    courseName: "Mat. Discreta",
    masteryLevel: "developing",
    history: [
      { role: "user", content: "Não entendo a diferença entre → e ↔" },
      { role: "assistant", content: "Boa pergunta! Pense assim..." }
    ],
    message: "Mas por que p→q é verdadeiro quando p é falso?"
  })
});
```

### Classificar erro

```ts
const res = await fetch("/api/ai/classify-error", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    exerciseStatement: "Calcule lim(x→∞) (√(x²+x) - x)",
    correctAnswer: "1/2",
    studentAnswer: "0",
    topicName: "Limites no infinito",
    courseName: "Cálculo I"
  })
});
// data.errorClass = "procedural"
// data.likelyReasoning = "Aluno fez √(x²+x) ≈ √x² = x, logo x - x = 0..."
```

### Gerar exercícios

```ts
const res = await fetch("/api/ai/exercises", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    topicName: "Tabelas-verdade",
    courseName: "Mat. Discreta",
    masteryLevel: "developing",
    count: 3,
    types: ["multiple-choice", "computation"],
    targetErrors: ["procedural"]
  })
});
```

### Plano de prova

```ts
const res = await fetch("/api/ai/exam-plan", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    examName: "P1 Cálculo I",
    courseName: "Cálculo I",
    examDate: "2026-04-16",
    hoursPerDay: 3,
    topics: [
      { name: "Conceito de função", mastery: "proficient", score: 0.68 },
      { name: "Limites no infinito", mastery: "none", score: 0.0 },
      { name: "Continuidade", mastery: "exposed", score: 0.31 }
    ],
    errorPatterns: [
      { class: "procedural", count: 12 },
      { class: "conceptual", count: 6 }
    ]
  })
});
```

---

## Estratégia de Custo

### Pricing por modelo (por 1M tokens)

| Modelo            | Input    | Output   |
|-------------------|----------|----------|
| claude-opus-4-6   | $15.00   | $75.00   |
| claude-sonnet-4-6 | $3.00    | $15.00   |
| claude-haiku-4-5  | $0.80    | $4.00    |

### Custo estimado por operação (Opus)

| Serviço            | Input tokens | Output tokens | Custo/chamada |
|--------------------|-------------|---------------|---------------|
| explainTopic       | ~800        | ~1500         | ~$0.12        |
| tutor (por turno)  | ~1200       | ~600          | ~$0.06        |
| classifyError      | ~600        | ~400          | ~$0.04        |
| generateFlashcards | ~700        | ~1000         | ~$0.09        |
| generateNotes      | ~2000       | ~1500         | ~$0.14        |
| generateExamPlan   | ~800        | ~2000         | ~$0.16        |
| summarizeDocument  | ~3000       | ~1200         | ~$0.13        |
| generateExercises  | ~700        | ~2000         | ~$0.16        |

### Cenário: uso diário típico de um aluno

- 2 explicações: ~$0.24
- 10 turnos de tutor: ~$0.60
- 5 classificações de erro: ~$0.20
- 1 lote de flashcards: ~$0.09
- 1 geração de notas: ~$0.14
- 1 plano de prova (semanal/30): ~$0.005/dia
- **Total diário: ~$1.30 com Opus**

### Como reduzir custos

1. **Usar Sonnet para tarefas menos críticas** (5x mais barato):
   - `classifyError` e `generateFlashcards` com `{ model: "claude-sonnet-4-6" }`
   - Reduz diário para ~$0.40

2. **Caching de respostas** (implementar com Supabase):
   - `explainTopic` para o mesmo tópico+nível = cache 24h
   - `generateFlashcards` idem
   - Reduz ~50% de chamadas repetidas

3. **Truncar input**:
   - `summarizeDocument`: já limita a 12k chars
   - `tutor`: já limita a últimas 10 mensagens

4. **Batch processing**:
   - Gerar exercícios em lotes maiores (5-10) por chamada
   - Gerar flashcards em lotes maiores (10-15) por chamada

5. **Rate limiting no client**:
   - Debounce de 2s no tutor
   - Max 50 chamadas AI/hora/usuário

### Modelo recomendado por serviço

| Serviço            | Recomendado     | Motivo                                |
|--------------------|-----------------|---------------------------------------|
| explainTopic       | opus            | Qualidade da explicação é crítica     |
| tutor              | opus            | Raciocínio socrático exige profundidade |
| classifyError      | sonnet          | Classificação estruturada, sonnet dá conta |
| generateFlashcards | sonnet          | Geração templática, sonnet suficiente |
| generateNotes      | sonnet          | Extração, não criação                 |
| generateExamPlan   | opus            | Planejamento complexo com priorização |
| summarizeDocument  | sonnet          | Sumarização é ponto forte do Sonnet   |
| generateExercises  | opus            | Exercícios precisam de criatividade e precisão |

Com mix de modelos: **custo diário ~$0.50/aluno**.
