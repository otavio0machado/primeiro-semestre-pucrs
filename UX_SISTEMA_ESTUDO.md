# UX Design — Sistema Cognitivo de Estudo Pessoal

> Documento de experiência do usuário: design tokens, component library,
> wireframes, hierarquia visual, microcopy.
> Stack visual: Tailwind CSS v4 + shadcn/ui + Geist Font.

---

## 1. FILOSOFIA DE DESIGN

### 1.1 Princípios fundamentais

O sistema não é um app de produtividade genérico. É um **instrumento de
pensamento** — como um caderno de laboratório digital. Cada pixel existe para
reduzir carga cognitiva e amplificar a percepção do próprio conhecimento.

```
PRINCÍPIO               MANIFESTAÇÃO
─────────────────────────────────────────────────────────────────
Intelectual              Tipografia editorial. Dados em primeiro plano.
                         Sem decoração gratuita. O conteúdo É o design.

Sofisticado              Paleta restrita. Animações contidas (150ms ease-out).
                         Espaçamento generoso. Silêncio visual deliberado.

Preciso                  Números com monospace. Porcentagens com 1 decimal.
                         Datas relativas ("em 3 dias") + absolutas no hover.
                         Zero ambiguidade — cada métrica tem tooltip com definição.

Funcional                Density-first. Informação acionável acima da dobra.
                         Teclado-first (atalhos globais). Zero cliques inúteis.
─────────────────────────────────────────────────────────────────
```

### 1.2 Anti-padrões (o que este sistema NUNCA faz)

```
✗ Cards coloridos com ícones cartoon
✗ Gráficos de pizza (imprecisos — sempre usar barras)
✗ Animações de confetti ou gamificação infantil
✗ Linguagem motivacional genérica ("Você consegue!")
✗ Dashboards com métricas de vaidade sem ação
✗ Bordas arredondadas excessivas (max radius-md)
✗ Sombras pesadas (elevação sutil, max shadow-sm)
```

### 1.3 Tom de voz (microcopy)

```
VOZ                      EXEMPLO
─────────────────────────────────────────────────────────────────
Direta, sem floreio      "3 tópicos abaixo de 40%" (não "Ei! Alguns tópicos
                          precisam de atenção!")
Técnica mas acessível    "Derivada — regra da cadeia" (não "Assunto difícil")
Temporal e precisa       "P1 Cálculo em 14 dias · 4 tópicos com gaps"
Acionável                "Revisar agora" / "Praticar 5 exercícios"
Respeitosa               Trata o usuário como adulto, nunca condescendente
─────────────────────────────────────────────────────────────────
```

---

## 2. DESIGN TOKENS

### 2.1 Paleta de cores

Sistema escuro-primeiro. Inspiração: editores de código, terminais, papers
acadêmicos. Cores semânticas para mastery — NÃO decorativas.

```
TOKEN                    LIGHT                    DARK (padrão)
─────────────────────────────────────────────────────────────────
--bg-primary             #FFFFFF                  #09090B    (zinc-950)
--bg-secondary           #F4F4F5                  #18181B    (zinc-900)
--bg-tertiary            #E4E4E7                  #27272A    (zinc-800)
--bg-surface             #FFFFFF                  #1C1C1F    (between 900/800)

--fg-primary             #09090B                  #FAFAFA    (zinc-50)
--fg-secondary           #52525B                  #A1A1AA    (zinc-400)
--fg-tertiary            #A1A1AA                  #71717A    (zinc-500)
--fg-muted               #D4D4D8                  #3F3F46    (zinc-700)

--border-default         #E4E4E7                  #27272A    (zinc-800)
--border-subtle          #F4F4F5                  #1F1F23
--border-focus           #3B82F6                  #3B82F6    (blue-500)
─────────────────────────────────────────────────────────────────
```

**Cores semânticas (mastery):**

```
TOKEN                    HEX          USO
─────────────────────────────────────────────────────────────────
--mastery-none           #3F3F46      Nunca estudou (zinc-700)
--mastery-exposed        #EAB308      Viu o conteúdo (yellow-500)
--mastery-developing     #F97316      Resolve com ajuda (orange-500)
--mastery-proficient     #3B82F6      Resolve sozinho (blue-500)
--mastery-mastered       #10B981      Domina (emerald-500)
─────────────────────────────────────────────────────────────────
```

**Cores funcionais:**

```
TOKEN                    HEX          USO
─────────────────────────────────────────────────────────────────
--accent-primary         #3B82F6      Ações primárias, links, foco
--accent-danger          #EF4444      Erros, prazos críticos
--accent-warning         #F59E0B      Atenção, prazos próximos
--accent-success         #10B981      Concluído, correto
--accent-info            #6366F1      Informativo, dicas da IA
─────────────────────────────────────────────────────────────────
```

### 2.2 Tipografia

Font stack: **Geist Sans** (interface) + **Geist Mono** (dados numéricos, código).

```
TOKEN               FONT             SIZE    WEIGHT   LINE-H   TRACKING   USO
──────────────────────────────────────────────────────────────────────────────────
--text-display      Geist Sans       30px    600      36px     -0.02em    Título de página
--text-title        Geist Sans       20px    600      28px     -0.015em   Título de seção
--text-heading      Geist Sans       16px    600      24px     -0.01em    Heading de card
--text-body         Geist Sans       14px    400      22px      0         Texto principal
--text-body-medium  Geist Sans       14px    500      22px      0         Labels, emphasis
--text-small        Geist Sans       13px    400      18px      0         Captions
--text-caption      Geist Sans       12px    400      16px      0.01em    Metadados, tooltips
--text-overline     Geist Sans       11px    600      14px      0.06em    Categorias (UPPERCASE)

--text-mono-data    Geist Mono       14px    500      22px      0         Números, scores
--text-mono-small   Geist Mono       12px    400      16px      0         Datas, IDs
──────────────────────────────────────────────────────────────────────────────────
```

### 2.3 Espaçamento

Base de 4px. Grid de 8px. Containers com máximo de 1280px.

```
TOKEN          VALUE    USO
──────────────────────────────────────────────────────────────────
--space-0      0px      Reset
--space-1      4px      Gap mínimo entre ícone e label
--space-2      8px      Padding interno de badges, chips
--space-3      12px     Gap entre itens em lista compacta
--space-4      16px     Padding de cards, gap de grid
--space-5      20px     Separação entre seções menores
--space-6      24px     Padding de containers
--space-8      32px     Gap entre seções
--space-10     40px     Margem entre blocos maiores
--space-12     48px     Padding de página lateral
--space-16     64px     Header height
──────────────────────────────────────────────────────────────────
```

### 2.4 Elevação e bordas

Filosofia: **bordas > sombras**. Elevação mínima.

```
TOKEN                    VALUE
──────────────────────────────────────────────────────────────────
--radius-sm              4px          Badges, chips, inputs
--radius-md              6px          Cards, dropdowns
--radius-lg              8px          Modals, panels
--radius-full            9999px       Avatars, toggles

--shadow-xs              0 1px 2px rgba(0,0,0,0.05)
--shadow-sm              0 1px 3px rgba(0,0,0,0.10)
--shadow-dropdown        0 4px 12px rgba(0,0,0,0.15)

--border-width           1px
──────────────────────────────────────────────────────────────────
```

### 2.5 Animações

Contidas e funcionais. Jamais decorativas.

```
TOKEN                    VALUE                    USO
──────────────────────────────────────────────────────────────────
--duration-fast          100ms                    Hover states
--duration-normal        150ms                    Transitions gerais
--duration-slow          250ms                    Expansão de painéis
--duration-graph         400ms                    Animações do grafo

--easing-default         cubic-bezier(0.25, 0.1, 0.25, 1)
--easing-spring          cubic-bezier(0.34, 1.56, 0.64, 1)      Grafo nodes
──────────────────────────────────────────────────────────────────
```

### 2.6 Breakpoints

```
TOKEN          VALUE      LAYOUT
──────────────────────────────────────────────────────────────────
--bp-sm        640px      Coluna única, sidebar recolhida
--bp-md        768px      Sidebar visível, grid 2 colunas
--bp-lg        1024px     Layout principal, grid 3 colunas
--bp-xl        1280px     Max-width do container
──────────────────────────────────────────────────────────────────
```

---

## 3. COMPONENT LIBRARY

### 3.1 Átomos

```
COMPONENTE           VARIANTES                          NOTAS
──────────────────────────────────────────────────────────────────────────
Badge                mastery (5 cores) | status |       Sempre com borda
                     outline | count                    sutil, nunca sólido
                                                        vibrante

MasteryDot           none | exposed | developing |      Círculo 8px com cor
                     proficient | mastered              semântica. Tooltip
                                                        com label + score

ScoreDisplay         inline | block                     Geist Mono. Score
                                                        0.0–1.0 com 1 decimal.
                                                        Cor muda por faixa

ProgressBar          thin (2px) | normal (4px) |        Nunca arredondado.
                     segmented                          Segmented para bloom
                                                        levels

IconButton           ghost | subtle | outline            32×32px touch target
                                                        mínimo. Tooltip obrigatório

Kbd                  —                                   Atalho de teclado.
                                                        Border + bg-tertiary

Timestamp            relative | absolute | countdown     "em 14 dias" (hover:
                                                        "16/04/2026, quarta")

Chip                 removable | static                  Para tags, filtros

LaTeXBlock           inline | block                      KaTeX rendering
──────────────────────────────────────────────────────────────────────────
```

### 3.2 Moléculas

```
COMPONENTE            COMPOSIÇÃO                          NOTAS
──────────────────────────────────────────────────────────────────────────
TopicRow              MasteryDot + nome + ScoreDisplay     Linha compacta.
                      + ProgressBar + Timestamp            Clicável → tela Tópico.
                                                           Hover: bg-secondary

MetricCard            Overline + valor (mono) +            SEM ícone decorativo.
                      variação + spark miniatura           O número É o visual.
                                                           Max 120px largura

ExamCountdown         Nome prova + Timestamp               Borda left colorida
                      (countdown) + Badge (dias) +         por urgência:
                      topic coverage bar                   >14d zinc, 7-14 yellow,
                                                           <7 orange, <3 red

ReviewItem            TopicRow simplificado +              Na fila de revisão.
                      reason badge + ação "Revisar"        Swipe-right em mobile

ExerciseCard          Enunciado (LaTeX) + difficulty       Expandível. Estado:
                      dots (1-5) + source badge +          não tentado | correto |
                      tags                                 incorreto

FlashcardFace         front | back + LaTeX support +      Flip animation 250ms.
                      status badge + ease indicator        Sem sombra excessiva

NoteEntry             Kind icon + título + preview +       Compact. Pin indicator
                      tags + timestamp                     no topo. LaTeX inline

SessionSummary        Kind badge + duration (mono) +      Resumo pós-sessão.
                      accuracy % + topics covered          Gerado pela IA
──────────────────────────────────────────────────────────────────────────
```

### 3.3 Organismos

```
COMPONENTE                COMPOSIÇÃO                       NOTAS
──────────────────────────────────────────────────────────────────────────
Sidebar                   Logo + nav items + course          Fixa à esquerda.
                          selector + kbd hints               240px. Recolhível
                                                             para 64px (ícones)

CommandPalette            Input + result groups +            ⌘K. Busca global:
                          kbd shortcuts + recent             tópicos, exercícios,
                                                             notas, comandos

MasteryHeatmap            Grid de tópicos com cor            Cada célula = tópico.
                          por mastery level. Tooltip          Hover: score + level.
                          com detalhes                       Click → tela Tópico

ConceptGraph              Nós (MasteryDot ampliado) +       Canvas interativo.
                          arestas tipadas + zoom/pan +       Force-directed layout.
                          minimap + filtros                  Cores = mastery

TopicDetailPanel          Cabeçalho + subtopics list +      Panel lateral ou
                          microcompetencies table +          página inteira.
                          related exercises + notes          Tabs verticais

ExerciseWorkspace         ExerciseCard expandido +          Split view: enunciado
                          input area + hint drawer +         à esquerda, resposta
                          AI feedback panel + timer          à direita. LaTeX input

CalendarGrid              Month view + day cells com        Células com dots de
                          event indicators + sidebar         cor: aula (zinc),
                          detail                            prova (red), estudo (blue)

GradeSimulator            Input fields P1-P3-MT +           Cálculo reativo.
                          computed G1 + G2 target +          Slider ou input.
                          visual threshold bar               Threshold line em 6.0
──────────────────────────────────────────────────────────────────────────
```

### 3.4 Layout Shell

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Sidebar 240px]  │  [Main Content — max 1280px, centered]           │
│                  │                                                    │
│  ┌─ Logo ──┐    │  ┌─ Page Header ────────────────────────────────┐ │
│  │ cogni.  │    │  │ Title (display)     [Actions]     [⌘K]      │ │
│  └─────────┘    │  └──────────────────────────────────────────────┘ │
│                  │                                                    │
│  DISCIPLINAS     │  ┌─ Content Area ──────────────────────────────┐ │
│  ● Cálculo I     │  │                                              │ │
│  ● Mat. Discreta │  │  (varia por tela — ver seções 4–10)        │ │
│                  │  │                                              │ │
│  NAVEGAÇÃO       │  │                                              │ │
│  □ Dashboard     │  │                                              │ │
│  □ Exercícios    │  │                                              │ │
│  □ Calendário    │  │                                              │ │
│  □ Notas         │  │                                              │ │
│  □ Mapa          │  │                                              │ │
│                  │  └──────────────────────────────────────────────┘ │
│  ───────────     │                                                    │
│  ⌘K Buscar       │                                                    │
│  ? Atalhos       │                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

**Atalhos globais:**

```
TECLA        AÇÃO
──────────────────────────────────
⌘K           Command palette
⌘1-7         Navegar para tela 1-7
⌘B           Toggle sidebar
⌘.           Iniciar sessão de estudo
Esc          Fechar modal/panel
?            Mostrar atalhos
──────────────────────────────────
```

---

## 4. TELA 1 — DASHBOARD

### 4.1 Propósito

Responder em 3 segundos: **"O que eu deveria estudar agora?"**
Não é um painel de métricas. É um **briefing operacional**.

### 4.2 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ DASHBOARD                                            26 mar 2026│
│                                                                  │
│ ┌─ PRÓXIMAS AVALIAÇÕES ─────────────────────────────────────┐   │
│ │                                                            │   │
│ │  ▌P1 Cálculo I              14 dias    ▌P1 Mat. Discreta  │   │
│ │  ▌16 abr · 4 tópicos                   ▌08 abr · 5 tops  │   │
│ │  ▌████████░░░░ 62% coberto             ▌██████░░░░ 48%    │   │
│ │  ▌2 tópicos abaixo de 40%             ▌3 tópicos < 40%   │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ AÇÃO RECOMENDADA ────────────────────────────────────────┐   │
│ │                                                            │   │
│ │  Seus 2 maiores gaps para P1 de Cálculo:                  │   │
│ │                                                            │   │
│ │  1. Limites laterais e no infinito      score 0.22        │   │
│ │     → 8 exercícios disponíveis         [Praticar agora]   │   │
│ │                                                            │   │
│ │  2. Continuidade e Teorema do Valor     score 0.31        │   │
│ │     Intermediário                                          │   │
│ │     → Pré-requisito: Limites laterais  [Ver tópico]       │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ MASTERY ─────────────────┐  ┌─ REVISÕES PENDENTES ───────┐  │
│ │                            │  │                             │  │
│ │  CÁLCULO I                 │  │  Hoje · 3 revisões          │  │
│ │  ░░░░░░░░░░░░░░░░░░░░░░░ │  │                             │  │
│ │  Funções       ████▓░ .68 │  │  ● Funções compostas  .41  │  │
│ │  Limites       ██▓░░░ .35 │  │    "spaced_rep · 3ª vez"   │  │
│ │  Continuidade  ██░░░░ .31 │  │                             │  │
│ │  Derivadas     ░░░░░░ .00 │  │  ● Limites laterais   .22  │  │
│ │                            │  │    "error_pattern · 4 erros │  │
│ │  MAT. DISCRETA             │  │     procedurais"           │  │
│ │  ░░░░░░░░░░░░░░░░░░░░░░░ │  │                             │  │
│ │  Lógica        █████▓ .72 │  │  ● Tabelas-verdade    .55  │  │
│ │  Conjuntos     ████░░ .58 │  │    "pre_exam · P1 em 13d"  │  │
│ │  Relações      ███░░░ .44 │  │                             │  │
│ │  Funções MD    █░░░░░ .18 │  │  [Iniciar sessão de revisão]│  │
│ │                            │  │                             │  │
│ └────────────────────────────┘  └─────────────────────────────┘  │
│                                                                  │
│ ┌─ ATIVIDADE RECENTE ───────────────────────────────────────┐   │
│ │                                                            │   │
│ │  Hoje                                                      │   │
│ │  ─                                                         │   │
│ │  Nenhuma sessão ainda. [Começar a estudar]                 │   │
│ │                                                            │   │
│ │  Ontem                                                     │   │
│ │  ─                                                         │   │
│ │  14:20  exercícios · Lógica proposicional · 35min          │   │
│ │         12/15 corretos (80%) · 3 erros procedurais         │   │
│ │                                                            │   │
│ │  09:45  theory · Limites laterais · 22min                  │   │
│ │         Anotação: "Regra para limites no infinito..."      │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ SIMULAÇÃO DE NOTAS ──────────────────────────────────────┐   │
│ │                                                            │   │
│ │  Cálculo I                    Mat. Discreta                │   │
│ │  P1 [___] P2 [___] P3 [___]  P1 [___] P2 [___] P3 [___]  │   │
│ │  MT [___]                     MT [___]                     │   │
│ │  ──────────────────────       ──────────────────────       │   │
│ │  G1 projetado: —              G1 projetado: —              │   │
│ │  ───────────|─── 6.0          ───────────|─── 6.0          │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Hierarquia visual (Z-pattern reading)

```
NÍVEL    ELEMENTO                       PESO VISUAL
─────────────────────────────────────────────────────────────
1        Próximas avaliações            Posição + countdown vermelho/amarelo
2        Ação recomendada               Score baixo em mono + botão primário
3        Mastery heatmap                Cor semântica atrai o olho
4        Revisões pendentes             Lista compacta com ação
5        Atividade recente              Cinza, consultivo
6        Simulação de notas             Interativo mas secundário
─────────────────────────────────────────────────────────────
```

### 4.4 Microcopy do Dashboard

```
ELEMENTO                 COPY
──────────────────────────────────────────────────────────────────
Título                   "Dashboard" (sem "Bem-vindo" ou "Olá")
Countdown                "14 dias" / "em 3 dias" / "amanhã" / "HOJE"
Coverage                 "62% coberto · 2 tópicos abaixo de 40%"
Ação recomendada         "Seus 2 maiores gaps para P1 de Cálculo:"
Botão praticar           "Praticar agora" (não "Vamos lá!")
Sem sessões hoje         "Nenhuma sessão ainda." (factual, sem julgamento)
Sessão passada           "12/15 corretos (80%) · 3 erros procedurais"
Simulação vazia          "G1 projetado: —" (traço, não "N/A")
──────────────────────────────────────────────────────────────────
```

---

## 5. TELA 2 — DISCIPLINA

### 5.1 Propósito

Panorama completo de UMA disciplina: progresso módulo a módulo,
avaliações, cronograma, pontos fracos.

### 5.2 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Dashboard                                                     │
│                                                                  │
│ CÁLCULO I                                    4/60 créditos      │
│ 4MAT096-04 · Prof. Luiz Henrique de Campos Merschmann           │
│ 3ª e 5ª · Lab. Matemática · 60h                                 │
│                                                                  │
│ ┌─ AVALIAÇÕES ──────────────────────────────────────────────┐   │
│ │                                                            │   │
│ │  P1          P2          P3          MT        → G1       │   │
│ │  16 abr      28 mai      30 jun      média T             │   │
│ │  [___]       [___]       [___]       [___]      = ?.?     │   │
│ │                                                            │   │
│ │  ────────────────────────────────────|──── 6.0            │   │
│ │                                                            │   │
│ │  Trabalhos: T1 (—) · T2 (—) · T3 (—) · T4 (—)           │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ MÓDULOS ─────────────────────────────────────────────────┐   │
│ │                                                            │   │
│ │  01  FUNÇÕES E MODELOS              10 fev – 07 mar       │   │
│ │  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  in_progress          │   │
│ │                                                            │   │
│ │  Tópico                     Mastery   Score   Exerc.      │   │
│ │  ─────────────────────────────────────────────────────     │   │
│ │  ● Conceito de função       profic.   0.68    14/18       │   │
│ │  ● Funções essenciais       develop.  0.52     8/12       │   │
│ │  ● Funções compostas        develop.  0.41     5/10       │   │
│ │  ● Transformações           exposed   0.22     2/6        │   │
│ │                                                            │   │
│ │  Cobertura do módulo: ████████████░░░░░░░░ 58%            │   │
│ │                                                            │   │
│ │  ─────────────────────────────────────────────────────     │   │
│ │                                                            │   │
│ │  02  LIMITES E TAXAS DE VARIAÇÃO    10 mar – 11 abr       │   │
│ │  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  in_progress          │   │
│ │                                                            │   │
│ │  Tópico                     Mastery   Score   Exerc.      │   │
│ │  ─────────────────────────────────────────────────────     │   │
│ │  ● Tangente e velocidade    develop.  0.38     4/8        │   │
│ │  ● Limite de uma função     develop.  0.35     3/8        │   │
│ │  ● Limites — leis           exposed   0.28     2/6        │   │
│ │  ● Continuidade             exposed   0.31     1/4        │   │
│ │  ● Limites no infinito      none      0.00     0/0        │   │
│ │                                                            │   │
│ │  Cobertura do módulo: █████░░░░░░░░░░░░░░░ 26%            │   │
│ │                                                            │   │
│ │  ─────────────────────────────────────────────────────     │   │
│ │                                                            │   │
│ │  03  DERIVADAS                      14 abr – 30 jun       │   │
│ │  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  not_started          │   │
│ │                                                            │   │
│ │  5 tópicos · 0% coberto · Pré-req: Limites               │   │
│ │  (colapsado — expandir ao clicar)                         │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ PADRÕES DE ERRO ──────── ┐  ┌─ DOCUMENTOS ───────────────┐  │
│ │                            │  │                             │  │
│ │  procedural    ████ 12     │  │  📄 Plano de ensino  crit. │  │
│ │  conceptual    ██░░  6     │  │  📄 Limites — slides high  │  │
│ │  algebraic     █░░░  3     │  │  📄 Lista 1          high  │  │
│ │  prerequisite  █░░░  2     │  │  📄 Stewart Cap.1    med.  │  │
│ │  reading       ░░░░  1     │  │  📄 Stewart Cap.2    med.  │  │
│ │                            │  │                             │  │
│ └────────────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Microcopy da Disciplina

```
ELEMENTO                 COPY
──────────────────────────────────────────────────────────────────
Breadcrumb               "← Dashboard"
Subtítulo                "4MAT096-04 · Prof. Luiz Henrique..."
Status módulo            "in_progress" / "not_started" / "completed"
                         (termos técnicos, sem tradução infantil)
Score na tabela          "0.68" (mono, 2 decimais, sem %)
Exercícios ratio         "14/18" (tentados/disponíveis)
Módulo colapsado         "5 tópicos · 0% coberto · Pré-req: Limites"
Padrões de erro          "procedural ████ 12" (barra + contagem)
──────────────────────────────────────────────────────────────────
```

---

## 6. TELA 3 — TÓPICO

### 6.1 Propósito

Profundidade total em UM tópico: subtópicos, microcompetências com nível
Bloom, exercícios, erros, notas, documentos relacionados.

### 6.2 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Cálculo I > Limites e Taxas > Limite de uma função           │
│                                                                  │
│ LIMITE DE UMA FUNÇÃO                        score 0.35          │
│ ● developing                                                     │
│ Módulo 02 · Tópico 02 · Aulas 7, 8                             │
│                                                                  │
│ ┌─ tabs ────────────────────────────────────────────────────┐   │
│ │  [Competências]  [Exercícios]  [Erros]  [Notas]  [Docs]  │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ══ TAB: COMPETÊNCIAS ═══════════════════════════════════════    │
│                                                                  │
│ ┌─ SUBTÓPICOS ──────────────────────────────────────────────┐   │
│ │                                                            │   │
│ │  1. Limite intuitivo e formal                              │   │
│ │  2. Limites laterais                                       │   │
│ │  3. Limites que não existem                                │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ MICROCOMPETÊNCIAS ───────────────────────────────────────┐   │
│ │                                                            │   │
│ │  ID         Descrição                  Bloom  Mastery      │   │
│ │  ─────────────────────────────────────────────────────     │   │
│ │  mc-014     Calcular limites usando    B3     ● develop.   │   │
│ │             substituição direta        Aplicar  0.42       │   │
│ │             ░░░░░░░░░██████████░░░░░░░░░░░░░░             │   │
│ │                                                            │   │
│ │  mc-015     Avaliar limites laterais   B3     ● exposed    │   │
│ │             e determinar existência    Aplicar  0.22       │   │
│ │             ░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░             │   │
│ │                                                            │   │
│ │  mc-016     Identificar formas         B4     ● none       │   │
│ │             indeterminadas 0/0, ∞/∞   Analisar  0.00      │   │
│ │             ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░             │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ GRAFO LOCAL ─────────────────────────────────────────────┐   │
│ │                                                            │   │
│ │          [Conceito de função]                              │   │
│ │                │                                           │   │
│ │                ▼ prerequisite                               │   │
│ │    [Tangente e velocidade] ──prerequisite──→ [LIMITE]      │   │
│ │                                                │           │   │
│ │                                        prerequisite        │   │
│ │                                                ▼           │   │
│ │                                         [Continuidade]     │   │
│ │                                                            │   │
│ │  (nós com MasteryDot · click → navegar)                    │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ AÇÕES ───────────────────────────────────────────────────┐   │
│ │                                                            │   │
│ │  [Praticar exercícios]  [Iniciar revisão]  [Criar nota]   │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Microcopy do Tópico

```
ELEMENTO                 COPY
──────────────────────────────────────────────────────────────────
Breadcrumb               "← Cálculo I > Limites e Taxas > Limite..."
Status                   "● developing" (dot colorido + label)
Bloom label              "B3 Aplicar" / "B4 Analisar" / "B6 Criar"
Score bar                Barra fina segmentada (1 segmento por bloom)
Ação primária            "Praticar exercícios" (verbo + objeto)
Ação secundária          "Iniciar revisão" / "Criar nota"
Grafo local              Apenas vizinhos diretos (1 hop)
──────────────────────────────────────────────────────────────────
```

---

## 7. TELA 4 — MAPA CONCEITUAL

### 7.1 Propósito

Visualizar o **grafo de conhecimento** completo: dependências entre tópicos,
clusters por disciplina, mastery em cada nó.

### 7.2 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ MAPA CONCEITUAL                                                  │
│                                                                  │
│ ┌─ TOOLBAR ─────────────────────────────────────────────────┐   │
│ │  Filtro: [Todas ▾] [Todas relações ▾]  Zoom: [−][100%][+] │   │
│ │  Layout: [force ▾]  Cor: [mastery ▾]   [Resetar vista]   │   │
│ │  Mostrar: ☑ labels  ☑ edges  ☑ scores  ☐ minimap         │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ CANVAS ──────────────────────────────────────────────────┐   │
│ │                                                            │   │
│ │      CÁLCULO I                     MAT. DISCRETA           │   │
│ │    ┄┄┄┄┄┄┄┄┄┄┄┄┄┄               ┄┄┄┄┄┄┄┄┄┄┄┄┄┄          │   │
│ │                                                            │   │
│ │    (●) Conceito de ──prereq──→ (●) Tangente                │   │
│ │    função  .68                   e veloc. .38              │   │
│ │       │                             │                      │   │
│ │       │ prereq                      │ prereq               │   │
│ │       ▼                             ▼                      │   │
│ │    (●) Funções  ─────────→ (●) Limite de    ─analog─→ (◐) │   │
│ │    essenciais .52          uma função .35        Lógica    │   │
│ │       │                        │               proposic.   │   │
│ │       │                        │ prereq          .72       │   │
│ │       │                        ▼                           │   │
│ │       └──prereq──→ (●) Continuidade .31                    │   │
│ │                         │                                  │   │
│ │                         │ prereq         (●) Conjuntos     │   │
│ │                         ▼                     .58          │   │
│ │                    (○) Derivadas .00              │         │   │
│ │                                             prereq         │   │
│ │                                                  ▼         │   │
│ │                                            (●) Relações    │   │
│ │                                                 .44        │   │
│ │                                                            │   │
│ │  ┌─────────┐                                               │   │
│ │  │ minimap │  Legenda:                                     │   │
│ │  │  · · ·  │  ○ none  ◔ exposed  ◑ developing             │   │
│ │  │  · · ·  │  ◕ proficient  ● mastered                     │   │
│ │  └─────────┘  ── prereq  ┄┄ analog  ·· applies_to         │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ DETAIL PANEL (aparece ao clicar um nó) ──────────────────┐   │
│ │                                                            │   │
│ │  Limite de uma função                      score 0.35     │   │
│ │  ● developing · Módulo 02 · 3 microcompetências           │   │
│ │                                                            │   │
│ │  Depende de: Conceito de função (.68), Tangente (.38)     │   │
│ │  É pré-req de: Continuidade (.31), Derivadas (.00)        │   │
│ │                                                            │   │
│ │  [Abrir tópico]  [Praticar]                               │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Interações do grafo

```
AÇÃO                     RESULTADO
──────────────────────────────────────────────────────────────────
Hover em nó              Destaca nó + arestas diretas. Tooltip
                         com nome + score + mastery level
Click em nó              Abre detail panel na lateral
Double-click em nó       Navega para tela do Tópico
Drag nó                  Reposiciona (posição salva em concepts.x/y)
Scroll                   Zoom in/out
Click + drag canvas      Pan
Hover em aresta          Label da relação + peso
Filtro disciplina        Fade out nós da outra disciplina
Filtro relação           Esconde arestas do tipo não selecionado
──────────────────────────────────────────────────────────────────
```

### 7.4 Microcopy do Mapa

```
ELEMENTO                 COPY
──────────────────────────────────────────────────────────────────
Título                   "Mapa Conceitual" (não "Mapa Mental")
Filtro padrão            "Todas" (disciplinas) / "Todas relações"
Nó tooltip               "Limite de uma função · 0.35 · developing"
Aresta tooltip            "prerequisite · peso 0.7"
Detail: dependências     "Depende de:" / "É pré-req de:"
Nó sem mastery           ○ vazio (não "?" ou "N/A")
──────────────────────────────────────────────────────────────────
```

---

## 8. TELA 5 — EXERCÍCIOS

### 8.1 Propósito

Workspace de prática: resolver exercícios, receber feedback da IA,
acompanhar erros. Suporte completo a LaTeX.

### 8.2 Wireframe — Lista de exercícios

```
┌─────────────────────────────────────────────────────────────────┐
│ EXERCÍCIOS                                                       │
│                                                                  │
│ ┌─ FILTROS ─────────────────────────────────────────────────┐   │
│ │  Disciplina: [Todas ▾]   Tópico: [Todos ▾]               │   │
│ │  Dificuldade: [1] [2] [3] [4] [5]   Status: [Todos ▾]    │   │
│ │  Fonte: [Todas ▾]   Ordenar: [Recomendados ▾]            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ EXERCÍCIOS ──────────────────────────────────────────────┐   │
│ │                                                            │   │
│ │  ┌──────────────────────────────────────────────────────┐ │   │
│ │  │ ○  Calcule lim(x→2) (x²-4)/(x-2)                   │ │   │
│ │  │    ●●●○○  Limites — leis · Lista 1, Q3              │ │   │
│ │  │    tags: limite, fatoração, substituição              │ │   │
│ │  └──────────────────────────────────────────────────────┘ │   │
│ │                                                            │   │
│ │  ┌──────────────────────────────────────────────────────┐ │   │
│ │  │ ✓  Determine se f(x)=|x|/x é contínua em x=0       │ │   │
│ │  │    ●●○○○  Continuidade · Material aula               │ │   │
│ │  │    Última tentativa: correto · 3min · 25/03          │ │   │
│ │  └──────────────────────────────────────────────────────┘ │   │
│ │                                                            │   │
│ │  ┌──────────────────────────────────────────────────────┐ │   │
│ │  │ ✗  Prove que lim(x→0) sen(x)/x = 1 usando o        │ │   │
│ │  │    Teorema do Confronto                               │ │   │
│ │  │    ●●●●○  Limites laterais · Stewart Cap.2           │ │   │
│ │  │    Último: incorreto · erro conceptual · 25/03       │ │   │
│ │  └──────────────────────────────────────────────────────┘ │   │
│ │                                                            │   │
│ │  Mostrando 3 de 48 exercícios                              │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ ESTATÍSTICAS DA SESSÃO ──────────────────────────────────┐   │
│ │  Sessão atual: 0 tentativas · 0min · [Iniciar sessão]    │   │
│ └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Wireframe — Workspace de resolução

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Exercícios                              Sessão: 12min · 3/5   │
│                                                                  │
│ ┌─ ENUNCIADO ─────────────────┐  ┌─ RESPOSTA ──────────────┐   │
│ │                              │  │                          │   │
│ │  Exercício 3 de 5   ●●●○○  │  │  Sua resolução:          │   │
│ │  Limites — leis             │  │                          │   │
│ │  Lista 1, Q3                │  │  ┌────────────────────┐  │   │
│ │                              │  │  │                    │  │   │
│ │  Calcule:                   │  │  │  (editor com       │  │   │
│ │                              │  │  │   suporte LaTeX)   │  │   │
│ │       x² - 4                │  │  │                    │  │   │
│ │  lim  ──────                │  │  │                    │  │   │
│ │  x→2   x - 2               │  │  └────────────────────┘  │   │
│ │                              │  │                          │   │
│ │                              │  │  [Dica 0/3]  [Verificar]│   │
│ │                              │  │                          │   │
│ │                              │  │                          │   │
│ └──────────────────────────────┘  └──────────────────────────┘   │
│                                                                  │
│ ┌─ FEEDBACK DA IA (aparece após verificar) ─────────────────┐   │
│ │                                                            │   │
│ │  ✓ Correto                                                │   │
│ │                                                            │   │
│ │  Sua fatoração está correta: (x²-4) = (x-2)(x+2),       │   │
│ │  cancelando (x-2), o limite se reduz a lim(x→2)(x+2)=4.  │   │
│ │                                                            │   │
│ │  Competência atualizada:                                   │   │
│ │  mc-014 "Calcular limites usando substituição" → 0.42→0.51│   │
│ │                                                            │   │
│ │  [Próximo exercício]  [Ver resolução completa]             │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ FEEDBACK DA IA (caso de erro) ───────────────────────────┐   │
│ │                                                            │   │
│ │  ✗ Incorreto · erro procedural                            │   │
│ │                                                            │   │
│ │  Você identificou corretamente que precisa fatorar, mas   │   │
│ │  o cancelamento ficou incompleto. Observe:                 │   │
│ │                                                            │   │
│ │    (x²-4) = (x+2)(x-2), não (x+2)(x+1)                  │   │
│ │                                                            │   │
│ │  Causa raiz: erro na fórmula de diferença de quadrados.   │   │
│ │  Revisão sugerida: subtópico "Produtos notáveis"          │   │
│ │                                                            │   │
│ │  [Tentar novamente]  [Ver resolução]  [Pular]             │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 8.4 Microcopy dos Exercícios

```
ELEMENTO                 COPY
──────────────────────────────────────────────────────────────────
Status ícone             ○ não tentado · ✓ correto · ✗ incorreto
Dificuldade              ●●●○○ (dots preenchidos, não estrelas)
Fonte                    "Lista 1, Q3" / "Stewart Cap.2, Ex.15"
Dica botão               "Dica 0/3" → "Dica 1/3" (contagem visível)
Verificar                "Verificar" (não "Enviar" — não é prova)
Feedback correto         "✓ Correto" + explicação + atualização mastery
Feedback erro            "✗ Incorreto · erro procedural" + causa raiz
Mastery update           "mc-014 → 0.42→0.51" (delta visível)
Sessão header            "Sessão: 12min · 3/5" (tempo + progresso)
──────────────────────────────────────────────────────────────────
```

---

## 9. TELA 6 — CALENDÁRIO

### 9.1 Propósito

Visão temporal: aulas, provas, sessões de estudo, prazos de trabalho.
Cruzamento entre cronograma acadêmico e atividade pessoal.

### 9.2 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ CALENDÁRIO                        ◀ março 2026 ▶   [Hoje]      │
│                                                                  │
│ Mostrar: ☑ Aulas  ☑ Provas  ☑ Trabalhos  ☑ Estudo  ☑ Revisões │
│                                                                  │
│ ┌─ MARÇO 2026 ──────────────────────────────────────────────┐   │
│ │                                                            │   │
│ │  SEG     TER     QUA     QUI     SEX     SÁB     DOM     │   │
│ │  ─────  ─────   ─────  ─────   ─────   ─────   ─────     │   │
│ │                                                            │   │
│ │                                                  1         │   │
│ │                                                            │   │
│ │  2       3       4       5       6       7       8         │   │
│ │          ○ C     ·       ○ C     ·                         │   │
│ │          ○ D             ○ D                               │   │
│ │                                                            │   │
│ │  9       10      11      12      13      14      15        │   │
│ │          ○ C     ·       ○ C     ·                         │   │
│ │          ○ D             ○ D                               │   │
│ │                                                            │   │
│ │  16      17      18      19      20      21      22        │   │
│ │          ○ C     ·       ○ C     ·                         │   │
│ │          ○ D             ○ D                               │   │
│ │                                                            │   │
│ │  23      24     [25]     26      27      28      29        │   │
│ │          ○ C    hoje     ○ C     ·                         │   │
│ │          ○ D     ■       ○ D                               │   │
│ │                 estudo                                      │   │
│ │  30      31                                                │   │
│ │          ○ C                                               │   │
│ │          ○ D                                               │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Legenda: ○ aula  ■ estudo  ▲ prova  △ trabalho  ◆ revisão    │
│           C = Cálculo  D = Discreta                              │
│                                                                  │
│ ┌─ DETALHE DO DIA: 26 mar (qui) ────────────────────────────┐  │
│ │                                                            │   │
│ │  08:00  ○ Cálculo I — Aula 8                              │   │
│ │            Limite de uma função — definição formal         │   │
│ │            Tópico: calc1-t06                               │   │
│ │                                                            │   │
│ │  10:00  ○ Mat. Discreta — Aula 8                           │   │
│ │            Conjuntos — operações                           │   │
│ │            Tópico: md-t04                                  │   │
│ │                                                            │   │
│ │  Revisões sugeridas:                                       │   │
│ │  ◆ Funções compostas (spaced_rep · 3ª revisão)            │   │
│ │  ◆ Limites laterais (error_pattern)                        │   │
│ │                                                            │   │
│ │  Nenhuma sessão de estudo registrada.                      │   │
│ │  [Registrar sessão]                                        │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ PRÓXIMOS EVENTOS ────────────────────────────────────────┐   │
│ │                                                            │   │
│ │  08 abr  ▲ P1 Mat. Discreta            em 13 dias        │   │
│ │  16 abr  ▲ P1 Cálculo I                em 21 dias        │   │
│ │  18 abr  △ T2 Mat. Discreta            em 23 dias        │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Microcopy do Calendário

```
ELEMENTO                 COPY
──────────────────────────────────────────────────────────────────
Título mês               "março 2026" (minúsculo, estilo editorial)
Dia atual                Borda de destaque, não fundo colorido
Célula vazia             Nada (sem "—" ou "Sem eventos")
Detalhe sem sessão       "Nenhuma sessão de estudo registrada."
Countdown eventos        "em 13 dias" / "em 3 dias" / "amanhã"
Tipo aula                "○ Cálculo I — Aula 8"
Tipo prova               "▲ P1 Mat. Discreta"
Tipo trabalho            "△ T2 Mat. Discreta"
──────────────────────────────────────────────────────────────────
```

---

## 10. TELA 7 — NOTAS

### 10.1 Propósito

Caderno pessoal estruturado por tipo. Suporte LaTeX. Busca por tags.
Cada nota é vinculada a tópico e/ou sessão.

### 10.2 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ NOTAS                                             [+ Nova nota] │
│                                                                  │
│ ┌─ FILTROS ─────────────────────────────────────────────────┐   │
│ │  Tipo: [Todos ▾]  Tópico: [Todos ▾]  Tags: [________]    │   │
│ │  Ordenar: [Recentes ▾]  ☐ Apenas fixadas                 │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ LISTA ───────────────────┐  ┌─ NOTA ABERTA ─────────────┐  │
│ │                            │  │                             │  │
│ │  📌 Regra de L'Hôpital    │  │  formula · Limites — leis  │  │
│ │  formula · 25/03 · 📌     │  │  25 mar 2026 · 14:32       │  │
│ │                            │  │  tags: limite, regra,      │  │
│ │  ─────────────────────     │  │        indeterminação      │  │
│ │                            │  │                             │  │
│ │  Formas indeterminadas     │  │  ─────────────────────     │  │
│ │  concept · 25/03           │  │                             │  │
│ │                            │  │  Para limites da forma     │  │
│ │  ─────────────────────     │  │  0/0 ou ∞/∞:              │  │
│ │                            │  │                             │  │
│ │  Erro em fatoração de      │  │        f(x)     f'(x)     │  │
│ │  diferença de quadrados    │  │  lim  ────  =  ────       │  │
│ │  mistake · 24/03           │  │  x→a  g(x)     g'(x)     │  │
│ │                            │  │                             │  │
│ │  ─────────────────────     │  │  Condições:                │  │
│ │                            │  │  • g'(x) ≠ 0 na vizinhança│  │
│ │  Dúvida: quando usar       │  │    de a                    │  │
│ │  confronto vs. L'Hôpital   │  │  • O limite da direita     │  │
│ │  doubt · 24/03             │  │    deve existir (finito    │  │
│ │                            │  │    ou ±∞)                  │  │
│ │  ─────────────────────     │  │                             │  │
│ │                            │  │  Cuidado: NÃO é a regra   │  │
│ │  Insight: limites e        │  │  do quociente. A derivada  │  │
│ │  continuidade — conexão    │  │  é separada (f' e g').     │  │
│ │  insight · 23/03           │  │                             │  │
│ │                            │  │  [Editar]  [Fixar]         │  │
│ │                            │  │                             │  │
│ │  6 notas · 2 fixadas       │  │                             │  │
│ │                            │  │                             │  │
│ └────────────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 Microcopy das Notas

```
ELEMENTO                 COPY
──────────────────────────────────────────────────────────────────
Botão criar              "+ Nova nota" (não "Adicionar")
Tipo badge               "formula" / "concept" / "doubt" /
                         "insight" / "summary" / "mistake"
Sem notas                "Nenhuma nota. Crie uma durante o estudo."
Nota fixada              📌 no canto (ícone, não label)
Timestamp                "25 mar 2026 · 14:32"
Tags                     "tags: limite, regra, indeterminação"
Counter                  "6 notas · 2 fixadas"
──────────────────────────────────────────────────────────────────
```

---

## 11. HIERARQUIA VISUAL — REGRAS GLOBAIS

### 11.1 Níveis de ênfase

```
NÍVEL    TRATAMENTO                           EXEMPLO
─────────────────────────────────────────────────────────────────────
1        --text-display + --fg-primary         Título da página
2        --text-title + --fg-primary           Título de seção
3        --text-heading + --fg-primary         Heading de card
4        --text-body-medium + --fg-primary     Labels, campos key
5        --text-body + --fg-secondary          Texto explicativo
6        --text-small + --fg-tertiary          Metadados, captions
7        --text-caption + --fg-muted           IDs, timestamps hover
─────────────────────────────────────────────────────────────────────
```

### 11.2 Regra de contraste

```
Todo número importante usa --text-mono-data + cor semântica.
Todo timestamp usa --text-mono-small + --fg-tertiary.
Todo label de ação usa --text-body-medium + --accent-primary.
Nunca usar bold + cor + tamanho maior ao mesmo tempo (max 2 de 3).
```

### 11.3 Padrão de superfícies (Z-depth)

```
CAMADA       SUPERFÍCIE                 BORDA            SOMBRA
─────────────────────────────────────────────────────────────────────
0 (fundo)    --bg-primary               —                —
1 (cards)    --bg-surface               --border-default —
2 (elevado)  --bg-secondary             --border-default --shadow-xs
3 (dropdown) --bg-secondary             --border-default --shadow-dropdown
4 (modal)    --bg-surface               --border-default --shadow-dropdown
             + overlay 40% black
─────────────────────────────────────────────────────────────────────
```

### 11.4 Padrões de interação

```
PADRÃO               COMPORTAMENTO
─────────────────────────────────────────────────────────────────────
Hover em row          bg → --bg-secondary, transição 100ms
Hover em card         border → --border-focus, transição 100ms
Focus (teclado)       Ring 2px --accent-primary, offset 2px
Active / pressed      opacity 0.9, transição 50ms
Disabled              opacity 0.4, cursor not-allowed
Loading               Skeleton com pulse (bg-tertiary → bg-secondary)
Empty state           Ícone outline 48px (zinc-600) + texto --fg-tertiary
                      + ação primária. Centralizado.
Error state           Border --accent-danger + mensagem inline abaixo
─────────────────────────────────────────────────────────────────────
```

### 11.5 Navegação e estados de página

```
TRANSIÇÃO             ANIMAÇÃO
─────────────────────────────────────────────────────────────────────
Page enter            Fade-in 150ms + translateY(4px → 0)
Tab switch            Conteúdo fade 100ms, underline slide 200ms
Panel open            SlideIn from right 250ms ease-out
Modal open            Fade-in 150ms + scale(0.98 → 1)
Toast                 SlideIn from top-right, auto-dismiss 4s
Skeleton → content    Crossfade 200ms
─────────────────────────────────────────────────────────────────────
```

---

## 12. RESPONSIVIDADE

```
BREAKPOINT    LAYOUT
─────────────────────────────────────────────────────────────────────
< 640px       Sidebar vira bottom nav (5 ícones).
(mobile)      Cards empilhados. Grafo: pinch-to-zoom.
              Exercícios: tabs ao invés de split view.
              Calendário: lista semanal ao invés de grid mensal.

640–1024px    Sidebar recolhida (64px, ícones).
(tablet)      Grid 2 colunas no dashboard.
              Notas: lista sem preview (click abre nota).

> 1024px      Layout completo conforme wireframes.
(desktop)     Sidebar expandida. Split views. Grafo fullscreen.
─────────────────────────────────────────────────────────────────────
```

---

## 13. ACESSIBILIDADE (WCAG 2.1 AA)

```
REQUISITO                IMPLEMENTAÇÃO
─────────────────────────────────────────────────────────────────────
Contraste                Mínimo 4.5:1 para texto, 3:1 para elementos UI
                         Mastery colors verificadas contra --bg-surface

Teclado                  Tab order lógico. Todos os interativos focáveis.
                         Skip-to-content link. Roving tabindex em listas

Screen reader            aria-label em MasteryDot, ScoreDisplay.
                         role="grid" no calendário.
                         aria-live="polite" para feedback de exercícios

Motion                   @media (prefers-reduced-motion: reduce) →
                         duration: 0ms em todas as animações

Cores                    Mastery nunca comunica SÓ por cor.
                         Sempre label textual + cor (e.g., "● developing")

Touch targets            Mínimo 44×44px em mobile. 32×32px desktop
─────────────────────────────────────────────────────────────────────
```

---

## 14. MAPA DE TELAS E FLUXOS

```
                    ┌──────────┐
                    │ Dashboard │
                    └────┬─────┘
                         │
           ┌─────────────┼──────────────┐
           │             │              │
     ┌─────▼─────┐ ┌────▼────┐  ┌──────▼──────┐
     │ Disciplina │ │Calendário│  │  Exercícios  │
     └─────┬─────┘ └─────────┘  └──────┬──────┘
           │                            │
     ┌─────▼─────┐               ┌──────▼──────┐
     │  Tópico    │               │  Workspace   │
     └─────┬─────┘               │  Resolução   │
           │                     └──────────────┘
     ┌─────▼──────────┐
     │ Mapa Conceitual │
     └────────────────┘

     Notas: acessível de qualquer tela via sidebar
     Command Palette (⌘K): acesso direto a qualquer entidade
```
