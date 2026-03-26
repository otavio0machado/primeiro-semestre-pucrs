# Sistema Cognitivo de Estudo Pessoal — Documento de Arquitetura

> **Versão:** 1.0
> **Data:** 26 de março de 2026
> **Autor do design:** Claude (Principal Product Designer + Principal Software Architect + Learning Systems Architect + Senior Full Stack Engineer)
> **Usuário único:** Otávio — aluno de Ciência da Computação, PUCRS, 1º semestre 2026/1
> **Status:** Projeto — nenhum código escrito ainda

---

## PARTE I — VISÃO DO PRODUTO

### 1.1 O que é

Um sistema cognitivo pessoal que funciona como **central de comando acadêmica + segundo cérebro + tutor inteligente**. Não é um site de cursos. Não é uma plataforma genérica. É uma ferramenta sob medida para um único aluno, com conteúdo extraído exclusivamente dos materiais reais das duas disciplinas cursadas no semestre.

### 1.2 Para quem

Otávio, estudante com base parcial em matemática — já viu alguns tópicos no ensino médio/cursinho, mas com lacunas — cursando simultaneamente Cálculo I e Matemática Discreta na Escola Politécnica da PUCRS.

### 1.3 Problema central

O semestre avança em ritmo constante. Duas disciplinas de conteúdo denso correm em paralelo, com cronogramas independentes. O aluno precisa saber exatamente: o que estudar agora, o que está fraco, o que cai na próxima prova, quanto precisa em cada avaliação para passar — e precisa que o sistema aja sobre essas informações, não apenas as exiba.

### 1.4 Proposta de valor

O sistema conhece o conteúdo real, o cronograma real, as provas reais e o nível real do aluno. Com isso, ele faz o que nenhum app genérico consegue: recomenda a sessão de estudo ideal para *este* aluno, *neste* dia, mirando *esta* prova, atacando *estas* lacunas — e acompanha o progresso com precisão.

### 1.5 Metáfora de produto

Imagine um tutor particular que leu todas as apostilas da professora, sabe o calendário de provas de cor, entende exatamente onde o aluno trava, e toda vez que senta ao lado dele pergunta: "vamos trabalhar naquilo que vai te dar mais nota na P2?"

---

## PARTE II — ETAPA 1: MODELAGEM DO DOMÍNIO

### 2.1 Disciplinas

| Campo | Cálculo I | Matemática Discreta |
|---|---|---|
| Código | 95300 | 95303 |
| Turma | 31 | 30 |
| Créditos | 4 | 4 |
| Horário | 3ª LM + 5ª LM | 2ª LM + 4ª LM |
| Professora | Daniela Rodrigues | Karina Benato |
| Carga total | 60h (52,5h aulas + 7,5h TDE) | 60h (55,5h aulas + 4,5h TDE) |
| Fórmula G1 | (P1 + P2 + P3 + MT) / 4 | (P1 + P2 + P3 + MT) / 4 |
| Aprovação | Freq ≥ 75% E G1 ≥ 7.0, ou Freq ≥ 75% E G1 ≥ 4.0 E (G1+G2)/2 ≥ 5.0 | Idem |

### 2.2 Módulos e Tópicos

#### Cálculo I — 3 módulos, 16 tópicos, 32 microcompetências

**Módulo 1: Funções** (aulas 1–9, 03/mar–31/mar)

| # | Tópico | Aulas | Subtópicos |
|---|--------|-------|-----------|
| T01 | Conceito de Função e Representações | 1, 3 | Noção intuitiva; definição formal (domínio, contradomínio, imagem); formas de representação (algébrica, tabular, gráfica, flechas) |
| T02 | Determinação de Domínio | 3, 4 | Funções racionais (denominador ≠ 0); irracionais (radicando ≥ 0); logarítmicas (logaritmando > 0); compostas |
| T03 | Função Afim e Quadrática | 4, 5 | Função afim (coeficiente angular/linear, reta); quadrática (parábola, vértice, discriminante, raízes, concavidade) |
| T04 | Operações com Funções e Composição | 6 | Soma, diferença, produto, quociente; função composta (f∘g), domínio resultante |
| T05 | Funções Importantes e Movimentos Gráficos | 6, 7 | Potência, modular, partes; translações; reflexões e dilatações |
| T06 | Funções Trigonométricas | 8 | Seno, cosseno, tangente (período, amplitude, domínio, imagem); transformações |
| T07 | Função Inversa, Exponencial e Logarítmica | 9 | Inversibilidade e bijeção; f(x) = aˣ; f(x) = log_a(x) |

**Módulo 2: Limites e Continuidade** (aulas 14–17, 23/abr–05/mai)

| # | Tópico | Aulas | Subtópicos |
|---|--------|-------|-----------|
| T08 | Conceito de Limite e Continuidade | 14 | Noção intuitiva; limites laterais; continuidade em um ponto; tipos de descontinuidade |
| T09 | Cálculo de Limites | 15, 17 | Propriedades; substituição direta; indeterminações 0/0 (fatoração, racionalização); limites trigonométricos fundamentais |
| T10 | Limites Infinitos, no Infinito e Assíntotas | 16 | Limites infinitos (assíntotas verticais); limites no infinito (assíntotas horizontais) |

**Módulo 3: Derivadas e Aplicações** (aulas 18–29, 07/mai–18/jun)

| # | Tópico | Aulas | Subtópicos |
|---|--------|-------|-----------|
| T11 | Definição de Derivada | 18 | Derivada como limite; interpretação geométrica (reta tangente); taxa de variação |
| T12 | Regras de Derivação | 19–21 | Regras básicas (potência, produto, quociente); regra da cadeia; derivadas trig/exp/log; derivadas sucessivas |
| T13 | Regra de L'Hôpital | 25 | Formas indeterminadas 0/0 e ∞/∞; aplicação da regra |
| T14 | Análise do Comportamento de Funções | 26, 27 | Pontos críticos; crescimento/decrescimento; extremos locais; concavidade e inflexão |
| T15 | Problemas de Otimização | 28 | Modelagem de problemas; resolução via derivada (extremos absolutos) |
| T16 | Derivação Implícita | 29 | Derivar equações onde y não é explícito em função de x |

#### Matemática Discreta — 3 módulos, 12 tópicos, 29 microcompetências

**Módulo 1: Conjuntos e Lógica Proposicional** (aulas 1–8, 02/mar–25/mar)

| # | Tópico | Aulas | Subtópicos |
|---|--------|-------|-----------|
| T01 | Conceitos Básicos de Conjuntos | 2, 3 | Definição, elemento, pertinência; representação (extensão, compreensão, Venn, gráfico); conjunto vazio e universo; conjuntos numéricos (N, Z, Q, I, R); intervalos |
| T02 | Relações e Operações entre Conjuntos | 3, 4 | Inclusão (⊆) e inclusão estrita (⊂); igualdade; união, interseção, diferença; complementação e Leis de De Morgan; conjunto das partes e produto cartesiano |
| T03 | Lógica Proposicional | 5, 6 | Proposições e valores lógicos; operadores (¬, ∧, ∨, →, ↔); tabelas-verdade; tautologia/contradição/contingência; implicação e equivalência; precedência; portas lógicas |
| T04 | Quantificadores e Demonstrações | 7, 8 | Quantificador universal (∀) e existencial (∃, ∃!); negação de quantificadas; múltiplos quantificadores; demonstrações simples em conjuntos |

**Módulo 2: Relações e Funções** (aulas 13–19, 13/abr–06/mai)

| # | Tópico | Aulas | Subtópicos |
|---|--------|-------|-----------|
| T05 | Relações entre Dois Conjuntos | 13–15 | Relação como R ⊆ A×B; domínio/imagem/contradomínio; representação gráfica; operações com relações |
| T06 | Tipos de Relações | 16–18 | Reflexiva, simétrica, transitiva, antissimétrica |
| T07 | Funções como Relações | 19 | Funções parciais e totais; injetora, sobrejetora, bijetora; inversibilidade |

**Módulo 3: Ordem, Indução e Álgebra Booleana** (aulas 24–31, 25/mai–17/jun)

| # | Tópico | Aulas | Subtópicos |
|---|--------|-------|-----------|
| T08 | Relação de Equivalência | 24, 26 | Definição (reflexiva + simétrica + transitiva); classes de equivalência e partições |
| T09 | Relação de Ordem e Diagrama de Hasse | 26, 28 | Ordem parcial e total; diagrama de Hasse; elementos notáveis (máximo, mínimo, supremo, ínfimo); reticulados |
| T10 | Álgebra Booleana | 28 | Reticulado complementado e distributivo; axiomas |
| T11 | Recursão e Somatórios | 29, 30 | Definições recursivas (base + passo); notação Σ; propriedades e fórmulas clássicas |
| T12 | Indução Matemática | 31 | Princípio (base + hipótese + passo indutivo); provas de somas, desigualdades, divisibilidade |

### 2.3 Cronograma e Datas de Provas

#### Cálculo I — Avaliações

| Avaliação | Data | Aula | Conteúdo coberto |
|-----------|------|------|-----------------|
| Trabalho 1 | 09/04/2026 | 11 | Funções (Módulo 1) |
| **Prova 1** | **16/04/2026** | **13** | **Funções (T01–T07)** |
| Trabalho 2 | 21/05/2026 | 22 | Limites/início derivadas |
| **Prova 2** | **28/05/2026** | **24** | **Limites e Continuidade (T08–T10) + Definição/Regras de Derivação (T11–T12)** |
| Trabalho 3 | 23/06/2026 | 30 | Aplicações de derivadas |
| **Prova 3** | **30/06/2026** | **32** | **Todas as aplicações de derivadas (T13–T16)** |
| Prova Substitutiva | 07/07/2026 | 34 | Todo o conteúdo |
| Exame G2 | 14/07/2026 | — | Todo o conteúdo |

#### Matemática Discreta — Avaliações

| Avaliação | Data | Aula | Conteúdo coberto |
|-----------|------|------|-----------------|
| Trabalho 1 | 01/04/2026 | 10 | Conjuntos e Lógica (Módulo 1) |
| **Prova 1** | **08/04/2026** | **12** | **Conjuntos e Lógica Proposicional (T01–T04)** |
| Trabalho 2 | 13/05/2026 | 21 | Relações e Funções |
| **Prova 2** | **20/05/2026** | **23** | **Relações e Funções (T05–T07)** |
| Trabalho 3 | 03/06/2026 | 27 | Equivalência/Ordem |
| Trabalho 4 | 22/06/2026 | 32 | Recursão/Indução |
| **Prova 3** | **29/06/2026** | **34** | **Ordem, Indução e Álgebra Booleana (T08–T12)** |
| Prova Substitutiva | 06/07/2026 | 36 | Todo o conteúdo |
| Exame G2 | 13/07/2026 | — | Todo o conteúdo |

### 2.4 Documentos Indexados (Fontes Exclusivas)

| ID | Arquivo | Tipo | Disciplina | Tópicos | Exercícios? |
|----|---------|------|-----------|---------|------------|
| doc-calc1-plano | 00_Cálculo_I_...Plano_de_Ensino | plano_ensino | Cálculo I | Todos | Não |
| doc-calc1-funcoes-material | 02_Tópico_1_Funções | material_aula | Cálculo I | T01–T07 | Sim (atividades de aula) |
| doc-calc1-lista-funcoes | 01_Cálculo_I_Lista_Funções | lista_exercicios | Cálculo I | T01–T07 | Sim (15 questões + gabarito) |
| doc-calc1-livro-anton | Cálculo Vol.1 (Anton, Bivens, Davis) | livro_texto | Cálculo I | Todos | Sim |
| doc-md-plano | 95303_Mat_Discreta_Plano | plano_ensino | Mat. Discreta | Todos | Não |
| doc-md-topico1-conceitos | 01_Topico_1_Conceitos_Basicos | material_aula | Mat. Discreta | T01 | Sim |
| doc-md-exercicios-conjuntos | 02_Exercicios_Conjuntos | lista_exercicios | Mat. Discreta | T01–T02 | Sim |
| doc-md-topico2-logica | 02_Topico_2_Logica_Proposicional | material_aula | Mat. Discreta | T03–T04 | Sim |
| doc-md-topico2-exemplos-tv | 05_Topico_2_...Exemplos_Tabelas | exemplos_resolvidos | Mat. Discreta | T03 | Sim (resolvidos) |
| doc-md-topico2-linguagem | 06_Topico_2_...Transformação_Linguagem | material_aula | Mat. Discreta | T03 | Sim |
| doc-md-topico3-relacoes-operacoes | 03_Topico_3_Relações_Operações | material_aula | Mat. Discreta | T02 | Sim |
| doc-md-livro-menezes | Matemática Discreta (Menezes) | livro_texto | Mat. Discreta | Todos | Sim |

### 2.5 Rede de Relações entre Conteúdos (Knowledge Graph)

As relações entre tópicos são o que transforma uma lista de conteúdos em um mapa cognitivo navegável. O sistema modela cinco tipos de relação:

**Relações intra-disciplina (pré-requisitos):**
- Calc T01 (Conceito de Função) → T02 (Domínio) → T03 (Afim/Quadrática) → T04 (Operações) → T05 (Funções Importantes) → T06 (Trigonométricas) → T07 (Inversa/Exp/Log)
- Calc T07 → T08 (Limites) → T09 (Cálculo de Limites) → T10 (Limites Infinitos)
- Calc T09 + T10 → T11 (Definição Derivada) → T12 (Regras) → T13 (L'Hôpital) + T14 (Análise) → T15 (Otimização) + T16 (Implícita)
- MD T01 (Conjuntos) → T02 (Operações Conjuntos) → T03 (Lógica) → T04 (Quantificadores)
- MD T02 → T05 (Relações) → T06 (Tipos de Relações) → T07 (Funções como Relações)
- MD T06 → T08 (Equivalência) + T09 (Ordem) → T10 (Booleana)
- MD T01 → T11 (Recursão/Somatórios) → T12 (Indução)

**Relações cross-disciplina (analogias e co-requisitos):**
- Calc T01 (Funções) ↔ MD T07 (Funções como Relações) — *analogous_to*: ambas abordam funções, mas por perspectivas diferentes (contínuo vs. discreto)
- Calc T02 (Domínio) ↔ MD T05 (Relações entre Conjuntos) — *analogous_to*: domínio/imagem/contradomínio aparecem nos dois contextos
- Calc T07 (Inversa) ↔ MD T07 (Inversibilidade) — *analogous_to*: condições para inversibilidade
- MD T03 (Lógica) → Calc T08 (Limites) — *applies_to*: a definição formal de limite usa quantificadores
- MD T02 (Operações Conjuntos) → Calc T02 (Domínio) — *applies_to*: intervalos e operações para determinar domínios
- MD T04 (Demonstrações) → Calc T11 (Definição Derivada) — *applies_to*: raciocínio formal ajuda na compreensão de provas envolvendo limites

### 2.6 Microcompetências

O sistema modela **61 microcompetências** no total (32 de Cálculo I + 29 de Matemática Discreta), cada uma com nível de Bloom (1–6) e nível de domínio rastreado individualmente:

| Nível de Domínio | Código | Significado | Critério |
|---|---|---|---|
| none | 0 | Nunca estudou | Sem interação registrada |
| exposed | 1 | Viu o conteúdo | Leu/assistiu material, mas não praticou |
| developing | 2 | Resolve com ajuda | Acerta ≤ 50% sem dicas, ou precisa de hints |
| proficient | 3 | Resolve sozinho | Acerta > 70% consistentemente sem ajuda |
| mastered | 4 | Ensina / aplica em contextos novos | Acerta > 90% e resolve variações não-vistas |

---

## PARTE III — ETAPA 2: ARQUITETURA PEDAGÓGICA

### 3.1 Como medir domínio

O sistema usa uma abordagem de **avaliação contínua multissinal**, combinando três fontes:

**3.1.1 Diagnóstico inicial (uma vez por módulo)**
Quando o aluno acessa um módulo pela primeira vez, o sistema apresenta um quiz diagnóstico de 8–12 questões cobrindo as microcompetências do módulo. As questões são geradas pela IA a partir dos materiais da disciplina e calibradas para detectar rapidamente se o aluno está em `none`, `exposed`, `developing` ou `proficient`. O diagnóstico não dá nota — dá um mapa.

**3.1.2 Avaliação em exercícios (contínua)**
Cada exercício resolvido no sistema está vinculado a uma ou mais microcompetências. O sistema rastreia: acertou/errou, usou dica, tempo gasto, tentativas. A atualização de mastery segue um modelo de média ponderada exponencial — exercícios mais recentes pesam mais, mas acertos antigos não são esquecidos.

**Fórmula de atualização:**
```
novo_mastery_score = α × resultado_atual + (1 - α) × mastery_score_anterior
```
Onde `α = 0.3` (learning rate), `resultado_atual` é 1.0 (acerto sem dica), 0.6 (acerto com dica), 0.0 (erro). Os thresholds de nível são: `exposed < 0.25`, `developing < 0.55`, `proficient < 0.85`, `mastered ≥ 0.85`.

**3.1.3 Autoavaliação pós-sessão**
Ao final de cada sessão de estudo, o aluno indica subjetivamente (1–5 estrelas) a confiança em cada tópico trabalhado. O sistema usa isso como sinal complementar, não como fonte primária — se a confiança diverge muito do desempenho objetivo, o sistema alerta.

### 3.2 Como detectar erro

O sistema não apenas marca "errado" — ele **classifica o tipo de erro** usando a IA:

| Tipo de erro | Descrição | Ação do sistema |
|---|---|---|
| **Conceitual** | Entendeu errado o conceito (ex: confundir domínio com imagem) | Redireciona para material teórico + exercícios básicos do conceito |
| **Procedimental** | Sabe o conceito mas erra o procedimento (ex: erra sinal na derivação) | Apresenta exercício similar com passo-a-passo detalhado |
| **Algébrico/aritmético** | Conceito e procedimento corretos, mas erro de conta | Sinaliza o ponto exato do erro; não rebaixa mastery significativamente |
| **De leitura** | Não interpretou o enunciado corretamente | Reformula o enunciado e pede nova tentativa |
| **De pré-requisito** | Falta base de um tópico anterior | Identifica o pré-requisito e sugere revisão antes de continuar |

A classificação é feita pelo Claude, que recebe a resolução do aluno, o gabarito esperado, e o contexto do tópico. O prompt inclui: "analise a resolução, identifique onde o erro ocorreu, classifique o tipo, explique ao aluno de forma didática."

### 3.3 Como priorizar estudo

O motor de priorização usa um **score composto** para cada tópico, recalculado diariamente:

```
priority_score = w1 × urgency + w2 × weakness + w3 × dependency + w4 × exam_weight
```

Onde:
- **urgency** (0–1): baseada na proximidade da próxima prova que cobre este tópico. Se faltam 2 dias, urgency → 1.0. Se faltam 30 dias, urgency → 0.1. Função: `urgency = 1 - (dias_até_prova / dias_total_módulo)`, clamped [0, 1].
- **weakness** (0–1): inverso do mastery normalizado. `weakness = 1 - mastery_score`.
- **dependency** (0–1): quantos tópicos dependentes (posteriores) ainda precisam deste como pré-requisito. Tópicos fundacionais com muitos dependentes pontuam mais alto.
- **exam_weight** (0–1): peso relativo do conteúdo na prova (cada prova vale 25% do G1, mas tópicos cobrados em mais avaliações pontuam mais).

**Pesos default:** w1=0.35, w2=0.30, w3=0.20, w4=0.15

O resultado é uma **lista ordenada por priority_score** que alimenta a tela de "O que estudar agora".

### 3.4 Como organizar revisão

O sistema implementa **Spaced Repetition adaptativo** com três camadas:

**Camada 1 — Revisão pós-sessão (mesmo dia):** Ao final de cada sessão de estudo, o sistema gera 2–3 questões rápidas dos tópicos trabalhados. Isso consolida a memória de curto prazo.

**Camada 2 — Revisão espaçada (dias seguintes):** O intervalo entre revisões segue uma progressão baseada em desempenho:
- Errou na revisão → revisa amanhã
- Acertou com esforço → revisa em 2 dias
- Acertou com facilidade → intervalo × 2.5 (1→2→5→12→30 dias)

**Camada 3 — Revisão pré-prova (véspera):** 3–5 dias antes de cada prova, o sistema entra em "modo preparação" e gera um plano de revisão intensivo cobrindo todos os tópicos da prova, priorizando os de menor mastery. Inclui: simulado cronometrado, revisão de erros frequentes, checklist de competências.

### 3.5 Como preparar para prova

A preparação para prova é o ponto alto do sistema e segue um pipeline de 4 fases:

**Fase 1 — Mapeamento (D-14):** Duas semanas antes, o sistema mostra um dashboard com cada tópico da prova, o mastery atual, e uma projeção: "para atingir *proficient* em tudo, você precisa de ~X horas de estudo, distribuídas assim..."

**Fase 2 — Intensificação (D-7):** Uma semana antes, o sistema gera diariamente uma sessão personalizada focada nos tópicos com menor mastery que caem na prova. Exercícios são progressivamente mais difíceis.

**Fase 3 — Simulado (D-3):** Três dias antes, o sistema gera um simulado com questões no formato e dificuldade de prova real — baseado nos materiais e listas da disciplina. O simulado é cronometrado. Ao final, o sistema faz uma análise detalhada do desempenho por tópico.

**Fase 4 — Polimento (D-1):** Véspera da prova. O sistema apresenta apenas: resumo dos pontos-chave, fórmulas essenciais, e 5 exercícios-relâmpago nos tópicos que o aluno mais errou no simulado. Nada novo — apenas consolidação.

### 3.6 Simulador de Notas

O sistema calcula continuamente:

```
G1 = (P1 + P2 + P3 + MT) / 4
```

E responde: "Se você tirar X na P2 e Y na P3, seu G1 será Z. Para aprovar sem G2 você precisa de G1 ≥ 7.0. Para ir à G2 você precisa de G1 ≥ 4.0, e nesse caso precisa tirar pelo menos W na G2."

Isso é exibido em tempo real no dashboard e atualizado toda vez que uma nota real é inserida.

---

## PARTE IV — ETAPA 3: ARQUITETURA DO SOFTWARE

### 4.1 Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend + SSR | Next.js 15 (App Router) | Renderização híbrida, server components, API routes integradas |
| Linguagem | TypeScript strict | Segurança de tipos nas 61 microcompetências e entidades complexas |
| Estilo | Tailwind CSS v4 | Utility-first, dark mode nativo, sem overhead de design system |
| Banco de dados | Supabase (PostgreSQL) | Auth, RLS, Realtime, Storage integrados; tier gratuito generoso |
| Auth | Supabase Auth | Login simples (email/password) — sistema pessoal, 1 usuário |
| Hosting | Vercel | Deploy automático, edge functions, ótima integração com Next.js |
| IA | Anthropic Claude Opus 4.6 (`claude-opus-4-6`) | Motor central para tutoria, geração de exercícios, classificação de erros |

### 4.2 Estrutura de Pastas

```
study-system/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Grupo de rotas de autenticação
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/              # Grupo principal autenticado
│   │   │   ├── layout.tsx            # Shell com sidebar
│   │   │   ├── page.tsx              # Dashboard principal (command center)
│   │   │   ├── disciplines/
│   │   │   │   ├── page.tsx          # Visão geral das disciplinas
│   │   │   │   └── [disciplineId]/
│   │   │   │       ├── page.tsx      # Detalhe da disciplina
│   │   │   │       └── [moduleId]/
│   │   │   │           └── page.tsx  # Detalhe do módulo
│   │   │   ├── study/
│   │   │   │   ├── page.tsx          # Sessão de estudo (tutor IA)
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx      # Sessão em andamento
│   │   │   ├── exercises/
│   │   │   │   ├── page.tsx          # Banco de exercícios
│   │   │   │   └── [exerciseId]/
│   │   │   │       └── page.tsx      # Exercício individual + correção
│   │   │   ├── exams/
│   │   │   │   ├── page.tsx          # Calendário de provas + preparação
│   │   │   │   └── [examId]/
│   │   │   │       ├── page.tsx      # Preparação para prova específica
│   │   │   │       └── simulate/
│   │   │   │           └── page.tsx  # Simulado
│   │   │   ├── knowledge/
│   │   │   │   └── page.tsx          # Grafo de conhecimento visual
│   │   │   ├── grades/
│   │   │   │   └── page.tsx          # Simulador de notas + histórico
│   │   │   └── review/
│   │   │       └── page.tsx          # Fila de revisão espaçada
│   │   ├── api/                      # Route handlers
│   │   │   ├── ai/
│   │   │   │   ├── tutor/route.ts    # Endpoint de tutoria (streaming)
│   │   │   │   ├── exercise/route.ts # Geração de exercícios
│   │   │   │   ├── correct/route.ts  # Correção + classificação de erros
│   │   │   │   └── diagnose/route.ts # Quiz diagnóstico
│   │   │   ├── mastery/route.ts      # Atualização de mastery
│   │   │   ├── priority/route.ts     # Recálculo de prioridades
│   │   │   └── grades/route.ts       # Simulação de notas
│   │   └── layout.tsx                # Root layout
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── client.ts             # Anthropic SDK client
│   │   │   ├── prompts/
│   │   │   │   ├── tutor.ts          # System prompt do tutor
│   │   │   │   ├── exercise-gen.ts   # Prompt de geração de exercícios
│   │   │   │   ├── correction.ts     # Prompt de correção
│   │   │   │   └── diagnostic.ts     # Prompt de diagnóstico
│   │   │   └── context-builder.ts    # Monta contexto (tópico + materiais) p/ IA
│   │   ├── mastery/
│   │   │   ├── engine.ts             # Motor de cálculo de mastery
│   │   │   ├── priority.ts           # Motor de priorização
│   │   │   └── spaced-rep.ts         # Algoritmo de repetição espaçada
│   │   ├── grades/
│   │   │   └── simulator.ts          # Simulador G1/G2
│   │   ├── supabase/
│   │   │   ├── client.ts             # Supabase browser client
│   │   │   ├── server.ts             # Supabase server client
│   │   │   └── middleware.ts         # Auth middleware
│   │   └── utils/
│   │       ├── dates.ts              # Cálculos de datas (dias até prova, etc.)
│   │       └── types.ts              # Domain types (baseado no schema existente)
│   ├── components/
│   │   ├── ui/                       # Componentes primitivos (shadcn/ui)
│   │   ├── dashboard/
│   │   │   ├── command-center.tsx     # Widget principal com recomendação
│   │   │   ├── mastery-radar.tsx      # Radar chart de competências
│   │   │   ├── upcoming-exams.tsx     # Próximas provas com countdown
│   │   │   └── grade-simulator.tsx    # Mini simulador inline
│   │   ├── study/
│   │   │   ├── tutor-chat.tsx         # Interface de chat com o tutor
│   │   │   ├── exercise-card.tsx      # Card de exercício
│   │   │   ├── solution-input.tsx     # Input de resolução (texto/LaTeX)
│   │   │   └── correction-panel.tsx   # Painel de correção detalhada
│   │   ├── knowledge/
│   │   │   └── knowledge-graph.tsx    # Visualização do grafo (D3 ou similar)
│   │   └── shared/
│   │       ├── mastery-badge.tsx      # Badge visual de nível de domínio
│   │       ├── topic-card.tsx         # Card de tópico com indicadores
│   │       └── progress-ring.tsx      # Anel de progresso
│   ├── hooks/
│   │   ├── use-mastery.ts            # Hook para dados de mastery
│   │   ├── use-priority.ts           # Hook para lista priorizada
│   │   └── use-study-session.ts      # Hook para sessão de estudo ativa
│   └── data/
│       ├── seeds/                    # JSONs de seed (os que já existem)
│       │   ├── disciplines.json
│       │   ├── modules.json
│       │   └── topics.json
│       └── documents/                # Referência aos materiais (metadados)
│           └── index.json
├── supabase/
│   ├── migrations/                   # SQL migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_seed_disciplines.sql
│   │   └── 003_seed_content.sql
│   └── config.toml
├── public/
│   └── materials/                    # PDFs dos materiais (static)
├── .env.local                        # ANTHROPIC_API_KEY, SUPABASE_URL, etc.
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 4.3 Modelo de Dados (Supabase/PostgreSQL)

```sql
-- ENUMS
CREATE TYPE mastery_level AS ENUM ('none', 'exposed', 'developing', 'proficient', 'mastered');
CREATE TYPE assessment_type AS ENUM ('prova', 'trabalho', 'ps', 'g2');
CREATE TYPE edge_relation AS ENUM ('prerequisite', 'corequisite', 'applies_to', 'generalizes', 'analogous_to');
CREATE TYPE error_type AS ENUM ('conceptual', 'procedural', 'algebraic', 'reading', 'prerequisite');
CREATE TYPE session_type AS ENUM ('theory', 'exercises', 'review', 'exam_prep', 'diagnostic');

-- DISCIPLINAS
CREATE TABLE disciplines (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  semester TEXT NOT NULL,
  schedule TEXT NOT NULL,
  professor TEXT NOT NULL,
  professor_email TEXT,
  total_hours INTEGER NOT NULL,
  ementa TEXT,
  grading_formula TEXT NOT NULL,
  approval_criteria TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- MÓDULOS
CREATE TABLE modules (
  id TEXT PRIMARY KEY,
  discipline_id TEXT REFERENCES disciplines(id),
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'not_started'
);

-- TÓPICOS
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  module_id TEXT REFERENCES modules(id),
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  class_numbers INTEGER[],
  document_refs TEXT[]
);

-- SUBTÓPICOS
CREATE TABLE subtopics (
  id TEXT PRIMARY KEY,
  topic_id TEXT REFERENCES topics(id),
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  description TEXT
);

-- MICROCOMPETÊNCIAS
CREATE TABLE microcompetencies (
  id TEXT PRIMARY KEY,
  topic_id TEXT REFERENCES topics(id),
  description TEXT NOT NULL,
  bloom_level INTEGER NOT NULL CHECK (bloom_level BETWEEN 1 AND 6),
  mastery_level mastery_level DEFAULT 'none',
  mastery_score FLOAT DEFAULT 0.0,
  last_assessed_at TIMESTAMPTZ,
  assessment_count INTEGER DEFAULT 0
);

-- AVALIAÇÕES (provas e trabalhos)
CREATE TABLE assessments (
  id TEXT PRIMARY KEY,
  discipline_id TEXT REFERENCES disciplines(id),
  type assessment_type NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  class_number INTEGER,
  weight FLOAT DEFAULT 1.0,
  content_topic_ids TEXT[],
  is_cumulative BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'upcoming',
  score FLOAT CHECK (score >= 0 AND score <= 10)
);

-- CRONOGRAMA DE AULAS
CREATE TABLE class_sessions (
  id SERIAL PRIMARY KEY,
  discipline_id TEXT REFERENCES disciplines(id),
  class_number INTEGER NOT NULL,
  date DATE NOT NULL,
  day_time TEXT NOT NULL,
  content TEXT,
  is_holiday BOOLEAN DEFAULT FALSE,
  is_assessment BOOLEAN DEFAULT FALSE,
  assessment_id TEXT REFERENCES assessments(id),
  topic_ids TEXT[]
);

-- GRAFO DE CONHECIMENTO
CREATE TABLE concept_nodes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  discipline_id TEXT REFERENCES disciplines(id),
  topic_id TEXT REFERENCES topics(id),
  description TEXT,
  mastery mastery_level DEFAULT 'none'
);

CREATE TABLE concept_edges (
  id SERIAL PRIMARY KEY,
  source TEXT REFERENCES concept_nodes(id),
  target TEXT REFERENCES concept_nodes(id),
  relation edge_relation NOT NULL,
  weight FLOAT DEFAULT 0.5,
  description TEXT,
  UNIQUE(source, target, relation)
);

-- SESSÕES DE ESTUDO
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  type session_type NOT NULL,
  topic_ids TEXT[],
  exercises_attempted INTEGER DEFAULT 0,
  exercises_correct INTEGER DEFAULT 0,
  confidence_rating INTEGER CHECK (confidence_rating BETWEEN 1 AND 5),
  notes TEXT
);

-- EXERCÍCIOS
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT REFERENCES topics(id),
  microcompetency_ids TEXT[],
  statement TEXT NOT NULL,
  expected_answer TEXT,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  source TEXT,  -- 'material', 'list', 'ai_generated'
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TENTATIVAS DE EXERCÍCIO
CREATE TABLE exercise_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id),
  session_id UUID REFERENCES study_sessions(id),
  student_answer TEXT,
  is_correct BOOLEAN,
  used_hint BOOLEAN DEFAULT FALSE,
  hint_count INTEGER DEFAULT 0,
  error_type error_type,
  error_explanation TEXT,
  ai_feedback TEXT,
  time_spent_seconds INTEGER,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

-- FILA DE REVISÃO ESPAÇADA
CREATE TABLE review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microcompetency_id TEXT REFERENCES microcompetencies(id),
  next_review_date DATE NOT NULL,
  interval_days INTEGER DEFAULT 1,
  ease_factor FLOAT DEFAULT 2.5,
  consecutive_correct INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- HISTÓRICO DE MASTERY (para visualizar evolução)
CREATE TABLE mastery_history (
  id SERIAL PRIMARY KEY,
  microcompetency_id TEXT REFERENCES microcompetencies(id),
  mastery_level mastery_level NOT NULL,
  mastery_score FLOAT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- ÍNDICES
CREATE INDEX idx_microcompetencies_topic ON microcompetencies(topic_id);
CREATE INDEX idx_exercises_topic ON exercises(topic_id);
CREATE INDEX idx_attempts_session ON exercise_attempts(session_id);
CREATE INDEX idx_attempts_exercise ON exercise_attempts(exercise_id);
CREATE INDEX idx_review_queue_date ON review_queue(next_review_date);
CREATE INDEX idx_class_sessions_date ON class_sessions(date);
CREATE INDEX idx_assessments_date ON assessments(date);
CREATE INDEX idx_mastery_history_mc ON mastery_history(microcompetency_id);

-- RLS (Row Level Security) — simplificado pois é sistema single-user
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;
-- Políticas serão: authenticated user has full access
```

### 4.4 Integração com IA (Anthropic Claude)

O Claude Opus 4.6 é o motor central do sistema. A integração segue uma arquitetura de **prompts especializados** por função:

#### 4.4.1 Tutor Conversacional
- **Modelo:** `claude-opus-4-6`
- **Streaming:** Sim (via Vercel AI SDK + `@anthropic-ai/sdk`)
- **System prompt** inclui: o tópico atual, os subtópicos, as microcompetências do aluno, o nível de mastery atual, os materiais relevantes (trechos dos PDFs), e instruções pedagógicas
- **Contexto dinâmico:** o `context-builder.ts` monta o contexto consultando o banco para saber o que o aluno já domina, onde errou, e o que está estudando

#### 4.4.2 Gerador de Exercícios
- **Input:** tópico, dificuldade desejada, microcompetência alvo, exercícios já feitos (para evitar repetição)
- **Output estruturado:** JSON com `statement`, `expected_answer`, `hints[]`, `solution_steps[]`
- **Restrição crítica:** o prompt instrui o Claude a gerar exercícios baseados exclusivamente nos padrões e tipos presentes nos materiais fornecidos (listas, apostilas, livro-texto)

#### 4.4.3 Corretor Inteligente
- **Input:** exercício + resolução do aluno + resposta esperada
- **Output estruturado:** JSON com `is_correct`, `error_type`, `error_location`, `explanation`, `mastery_impact`
- O corretor recebe instruções para ser didático, apontar exatamente onde o erro ocorreu, e classificar o tipo

#### 4.4.4 Diagnosticador
- **Input:** módulo + mastery atual de cada microcompetência
- **Output:** quiz de 8–12 questões calibradas, cobrindo o espectro de dificuldade
- Após o aluno responder, gera um relatório de gaps

#### 4.4.5 Custos estimados
Com o Claude Opus 4.6 e uso pessoal:
- Sessão de estudo média (30 min): ~5–10 chamadas à API → ~$0.30–0.60
- Uso diário moderado (1h): ~$1–2/dia
- Uso mensal: ~$30–60
- Possibilidade de usar Claude Sonnet 4.6 para tarefas menos complexas (correção rápida) e reservar Opus para tutoria profunda, reduzindo custos em ~60%

### 4.5 Módulos do Sistema

| Módulo | Responsabilidade | Componentes-chave |
|--------|-----------------|-------------------|
| **Command Center** | Dashboard principal; recomendação "o que estudar agora"; visão geral do semestre | `command-center.tsx`, `priority.ts` |
| **Discipline Browser** | Navegação por disciplinas → módulos → tópicos; visualização de mastery por nível | Rotas `/disciplines/[id]/[moduleId]` |
| **Study Engine** | Sessões de estudo com tutor IA; exercícios interativos; correção em tempo real | `tutor-chat.tsx`, rotas `/api/ai/*` |
| **Exercise Bank** | Exercícios extraídos dos materiais + gerados pela IA; filtro por tópico/dificuldade | `exercise-card.tsx`, `exercises/` |
| **Exam Prep** | Calendário de provas; pipeline de preparação (4 fases); simulados | Rotas `/exams/[id]/simulate` |
| **Knowledge Graph** | Visualização interativa do grafo de conceitos e relações | `knowledge-graph.tsx` (D3.js) |
| **Grade Simulator** | Cálculo de G1/G2; cenários "what-if"; metas por prova | `simulator.ts`, `grade-simulator.tsx` |
| **Spaced Review** | Fila de revisão espaçada; cards de revisão rápida | `spaced-rep.ts`, rota `/review` |
| **Mastery Tracker** | Motor de cálculo de domínio; histórico; evolução temporal | `engine.ts`, `mastery-history` |

### 4.6 Fluxos Principais

#### Fluxo 1: "O que estudar agora" (entrada no sistema)
```
1. Usuário abre o sistema
2. Dashboard carrega:
   a. Próximas provas (com countdown)
   b. Tópicos priorizados (via priority engine)
   c. Itens pendentes na fila de revisão
   d. Mastery geral por disciplina (radar)
3. Sistema exibe: "Recomendação: estudar [Tópico X] de [Disciplina Y]
   porque a P2 é em 5 dias e seu domínio está em 'developing'"
4. Usuário clica → inicia sessão de estudo
```

#### Fluxo 2: Sessão de estudo com tutor
```
1. Sessão inicia com contexto carregado (tópico, mastery, materiais)
2. Tutor IA apresenta o conteúdo de forma adaptada ao nível do aluno
3. Intercala teoria com exercícios:
   a. Exercício apresentado
   b. Aluno resolve (input texto/LaTeX)
   c. Sistema envia para corretor IA
   d. Feedback detalhado retornado
   e. Mastery atualizado
4. A cada 3–4 exercícios, tutor avalia se deve:
   - Avançar para subtópico seguinte
   - Aprofundar no mesmo (se erros persistem)
   - Revisar pré-requisito (se erro de pré-requisito detectado)
5. Sessão encerra → autoavaliação → mastery snapshot salvo
```

#### Fluxo 3: Preparação para prova
```
1. Usuário acessa /exams/[examId]
2. Sistema mostra: tópicos da prova + mastery de cada um
3. Gera plano de estudo: "Você tem X dias. Recomendo:
   - Dia 1: Revisão de T08 (mastery: developing)
   - Dia 2: Exercícios intensivos T09
   - Dia 3: Simulado completo
   - Dia 4: Revisão dos erros do simulado"
4. Usuário segue o plano (ou ajusta)
5. No dia D-3: simulado gerado pela IA (formato prova)
6. No dia D-1: revisão final focada nos gaps do simulado
```

#### Fluxo 4: Correção inteligente de exercício
```
1. Exercício exibido na tela
2. Aluno digita resolução (suporte a notação matemática)
3. POST /api/ai/correct com {exercise, student_answer, context}
4. Claude analisa:
   a. Compara com resposta esperada
   b. Identifica ponto de divergência
   c. Classifica tipo de erro
   d. Gera explicação didática
5. Retorna JSON estruturado
6. Frontend exibe:
   - ✓ Correto / ✗ Incorreto
   - Tipo de erro (badge colorido)
   - Explicação passo a passo
   - Sugestão de próximo passo
7. Mastery atualizado no banco
```

---

## PARTE V — ETAPA 4: VISÃO FINAL CONSOLIDADA

### 5.1 Funcionalidades Completas

| # | Funcionalidade | Prioridade | Descrição |
|---|---------------|-----------|-----------|
| F01 | Dashboard Command Center | P0 | Tela principal com recomendação personalizada, próximas provas, mastery geral |
| F02 | Navegação por disciplinas | P0 | Drill-down: disciplina → módulo → tópico → subtópico |
| F03 | Sessão de estudo com tutor IA | P0 | Chat com Claude contextualizado por tópico e nível |
| F04 | Exercícios interativos | P0 | Resolver e corrigir exercícios com feedback detalhado |
| F05 | Correção inteligente | P0 | Classificação de erros + explicação didática |
| F06 | Mastery tracking | P0 | Rastreamento contínuo de 61 microcompetências |
| F07 | Simulador de notas | P0 | Cálculo G1/G2 com cenários what-if |
| F08 | Calendário de provas | P1 | Próximas provas com countdown e conteúdo coberto |
| F09 | Preparação para prova | P1 | Pipeline de 4 fases (mapeamento → simulado → polimento) |
| F10 | Simulados | P1 | Provas simuladas geradas pela IA, cronometradas |
| F11 | Revisão espaçada | P1 | Fila de revisão com algoritmo adaptativo |
| F12 | Diagnóstico inicial | P1 | Quiz diagnóstico por módulo |
| F13 | Grafo de conhecimento | P2 | Visualização interativa das relações entre conceitos |
| F14 | Histórico de mastery | P2 | Gráficos de evolução temporal |
| F15 | Geração de exercícios | P2 | IA gera exercícios novos baseados nos materiais |
| F16 | Input LaTeX | P2 | Suporte a notação matemática na resolução |

### 5.2 Decisões Técnicas

| Decisão | Escolha | Alternativa descartada | Razão |
|---------|---------|----------------------|-------|
| Framework | Next.js App Router | Pages Router | Server Components reduzem JS no cliente; streaming nativo para IA |
| Banco | Supabase (hosted PostgreSQL) | SQLite local / Prisma + PlanetScale | Supabase oferece Auth + Realtime + Storage integrados; tier free suficiente |
| IA | Anthropic Claude via API | OpenAI GPT / Ollama local | Exigência do briefing; Claude Opus é superior em raciocínio matemático |
| Streaming IA | Vercel AI SDK (`ai` package) | Implementação manual de SSE | SDK resolve streaming, parsing, retries, typing |
| LaTeX rendering | KaTeX | MathJax | KaTeX é 10x mais rápido; suficiente para Cálculo I |
| Grafo visual | D3.js (force-directed) | vis.js / Cytoscape.js | D3 dá controle total; ~28 nós e ~40 arestas é leve |
| Styling | Tailwind + shadcn/ui | Material UI / Chakra | Tailwind é mais leve; shadcn oferece componentes acessíveis sem overhead |
| Estado local | React Server Components + SWR para cache | Redux / Zustand | RSC elimina necessidade de store global; SWR cuida de cache/revalidação |
| Deploy | Vercel (hobby tier) | AWS / Fly.io | Zero-config para Next.js; tier gratuito suficiente para 1 usuário |

### 5.3 Decisões Pedagógicas

| Decisão | Escolha | Razão |
|---------|---------|-------|
| Modelo de mastery | Score contínuo (0.0–1.0) com thresholds para níveis discretos | Permite tracking granular enquanto mostra ao aluno categorias claras |
| Taxonomia de Bloom | Embutida nas microcompetências (níveis 1–6) | Guia a geração de exercícios por complexidade; evita testar só memorização |
| Classificação de erros | 5 tipos (conceitual, procedimental, algébrico, leitura, pré-requisito) | Cada tipo requer ação diferente do sistema; maximiza eficiência do estudo |
| Priorização | Score composto (urgência × fraqueza × dependência × peso) | Balanceia "o que está fraco" com "o que vai cair na prova logo" |
| Revisão espaçada | SM-2 simplificado com adaptações | Algoritmo comprovado; intervalos adaptativos ao desempenho individual |
| Prep de prova | Pipeline de 4 fases (D-14 a D-1) | Cada fase tem objetivo cognitivo distinto: mapeamento → prática → simulação → consolidação |
| Conteúdo da IA | Restrito aos materiais fornecidos | Evita alucinações; garante alinhamento com o que a professora cobra |
| Feedback | Imediato e didático, com classificação de erro | Ciclo rápido de feedback é o fator #1 de aprendizagem eficaz |

### 5.4 Decisões de UX

| Decisão | Escolha | Razão |
|---------|---------|-------|
| Arquitetura de informação | Dashboard → Disciplina → Módulo → Tópico (hierarquia clara) | Espelha a organização mental do aluno; fácil saber "onde estou" |
| CTA principal | "O que estudar agora" é a ação #1 da tela principal | Elimina a paralisia de decisão; o aluno abre e já sabe o que fazer |
| Cor por disciplina | Cálculo I = azul; Matemática Discreta = roxo | Distinção visual imediata em qualquer lugar do sistema |
| Mastery visual | Badge com cor progressiva (cinza → amarelo → verde → azul) | Feedback visual rápido sem necessidade de ler números |
| Countdown de provas | Cards com dias restantes em destaque | Senso de urgência calibrado; evita surpresas |
| Dark mode | Padrão (com toggle para light) | Sessões de estudo longas; conforto visual |
| Mobile-first? | Desktop-first com responsividade | Estudo ativo (exercícios, LaTeX) é melhor em tela grande; mobile para revisão rápida |
| Chat do tutor | Painel lateral (40% da tela), com exercício no painel principal | Tutor e exercício visíveis simultaneamente; não precisa alternar telas |

### 5.5 Entidades do Sistema (resumo)

```
Discipline (2)
  └── Module (6)
       └── Topic (28)
            ├── Subtopic (~65)
            ├── Microcompetency (61)
            └── Exercise (∞, gerados por IA)

Assessment (14: 6 provas + 6-7 trabalhos + PS + G2)
ClassSession (~70: ~35 por disciplina)
ConceptNode (28, 1:1 com Topic)
ConceptEdge (~40 relações)
StudySession (criadas a cada sessão)
ExerciseAttempt (1:N com Exercise)
ReviewQueue (1:1 com Microcompetency)
MasteryHistory (log temporal)
GradeSimulation (calculado, não persistido)
```

### 5.6 Roadmap de Implementação Sugerido

| Fase | Escopo | Estimativa |
|------|--------|-----------|
| **Fase 1 — Fundação** | Setup Next.js + Supabase + schema + seed data + auth + layout shell | 2–3 dias |
| **Fase 2 — Core** | Dashboard + navegação disciplinas + mastery engine + simulador notas | 3–4 dias |
| **Fase 3 — IA** | Integração Claude + tutor chat + gerador exercícios + corretor | 4–5 dias |
| **Fase 4 — Study Flow** | Sessões de estudo + exercícios interativos + revisão espaçada | 3–4 dias |
| **Fase 5 — Exam Prep** | Pipeline de preparação + simulados + diagnóstico | 3–4 dias |
| **Fase 6 — Polish** | Grafo de conhecimento + histórico mastery + dark mode + mobile | 2–3 dias |

Total estimado: **17–23 dias** de desenvolvimento focado.

### 5.7 Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Custo da API Claude Opus | Alto uso pode custar > $60/mês | Usar Sonnet para tarefas simples (correção); Opus só para tutoria/geração |
| IA gerar conteúdo fora dos materiais | Desalinhamento com a prova real | Prompts com restrição explícita + contexto dos materiais no system prompt |
| Complexidade do input LaTeX | Frustração ao digitar fórmulas | Oferecer input simplificado (botões de símbolos) + KaTeX preview em tempo real |
| Mastery score impreciso no início | Recomendações iniciais fracas | Diagnóstico inicial obrigatório antes de confiar no motor de priorização |
| Mudança no cronograma da professora | Datas de prova podem mudar | Interface para editar datas; seed data atualizável sem rebuild |

---

## APÊNDICE A — Materiais Fonte (Inventário Completo)

Todos os materiais abaixo foram extraídos dos arquivos fornecidos e constituem a **única fonte de conteúdo** do sistema:

1. `00_Cálculo_I_Turma_31_Plano_de_Ensino_2026_1.pdf` — Plano de ensino completo com cronograma de 35 aulas
2. `02_Tópico_1_Funções.pdf` — Notas de aula: funções (definição, domínio, tipos, gráficos, transformações)
3. `01_Cálculo_I_Lista_Funções_2022_2.pdf` — Lista de 15 exercícios sobre funções com gabarito completo
4. `Cálculo - Volume 1 (Anton, Bivens, Davis)` — Livro-texto principal de Cálculo I
5. `95303_Matemática_Discreta_Turma_30_Plano_de_Ensino_2026.1.pdf` — Plano de ensino com cronograma de 37 aulas
6. `01_Topico_1_Conceitos_Basicos.pdf` — Teoria dos conjuntos (definições, representações, conjuntos numéricos)
7. `02_Exercicios_Conjuntos_Intervalos_Operações.pdf` — Exercícios de conjuntos e intervalos
8. `02_Topico_2_Logica_Proposicional.pdf` — Lógica proposicional (proposições, conectivos, tabelas-verdade)
9. `05_Topico_2_Exemplos_Resolvidos_Tabelas_Verdade.pdf` — Exemplos resolvidos de tabelas-verdade
10. `06_Topico_2_Logica_Proposicional_Transformação_Linguagem.pdf` — Tradução linguagem natural ↔ lógica
11. `03_Topico_3_Relações_Operações_entre_Conjuntos.pdf` — Inclusão, igualdade, operações (∪, ∩, −, complemento)
12. `Matemática Discreta para Computação e Informática (Menezes)` — Livro-texto principal de Mat. Discreta

---

## APÊNDICE B — Dados Pré-existentes (system-data/)

O repositório já contém dados estruturados que devem ser reutilizados como seed:

- `system-data/schemas/domain.ts` — Types TypeScript completos (Discipline, Module, Topic, Subtopic, Microcompetency, Assessment, ClassSession, ConceptNode, ConceptEdge, StudySession, GradeSimulation)
- `system-data/seeds/disciplines.json` — 2 disciplinas com metadados completos
- `system-data/seeds/modules.json` — 6 módulos com datas e referências a avaliações
- `system-data/seeds/topics.json` — 28 tópicos com subtópicos, microcompetências e referências a documentos

Esses dados foram extraídos diretamente dos planos de ensino e validados. O schema SQL do Apêndice C reflete essa estrutura.

---

*Documento gerado como base para implementação. Nenhum código foi escrito. Próximo passo: iniciar Fase 1 — Fundação.*
