// ============================================================
// ERROR TAXONOMY — Modelo completo de diagnóstico de erros
// Taxonomia hierárquica: Categoria → Subcategoria → Padrão
// ============================================================

import type { MasteryLevel } from "./mock";

// ── Enums ──

export type ErrorCategory =
  | "conceptual"    // Não entende o conceito
  | "algebraic"     // Erro de manipulação algébrica/aritmética
  | "logical"       // Falha de raciocínio lógico
  | "interpretation" // Não entendeu o enunciado/contexto
  | "formalization"; // Não consegue traduzir para linguagem formal

export type CalcSubcategory =
  | "dominio"       // Domínio, imagem, restrições
  | "limite"        // Limites, continuidade
  | "derivada";     // Derivadas, taxas, otimização

export type DiscretaSubcategory =
  | "logica"        // Proposições, conectivos, tabelas-verdade
  | "quantificadores" // ∀, ∃, negação de quantificadores
  | "inducao"       // Princípio de indução, caso base, passo
  | "relacoes";     // Relações, equivalência, ordem

export type Subcategory = CalcSubcategory | DiscretaSubcategory;

export type Severity = "low" | "medium" | "high" | "critical";

// ── Modelo principal ──

export interface ErrorPattern {
  id: string;
  /** Categoria principal */
  category: ErrorCategory;
  /** Subcategoria por disciplina */
  subcategory: Subcategory;
  /** Disciplina */
  disciplineId: "calculo-1" | "mat-discreta";
  /** Nome curto do padrão */
  name: string;
  /** Descrição detalhada */
  description: string;
  /** Exemplo concreto do erro */
  example: {
    exercise: string;
    wrongAnswer: string;
    correctAnswer: string;
    studentReasoning: string;
  };
  /** Causa raiz do erro */
  rootCause: string;
  /** Impacto na aprendizagem */
  severity: Severity;
  /** Tópicos associados (IDs de exam-data topics) */
  relatedTopicIds: string[];
  /** Pré-requisitos faltantes que causam o erro */
  missingPrerequisites: string[];
  /** Recomendações ordenadas por prioridade */
  recommendations: Recommendation[];
}

export interface Recommendation {
  type: "review-topic" | "practice" | "watch-video" | "read-material" | "do-exercises" | "seek-tutor";
  label: string;
  /** Descrição do que fazer */
  description: string;
  /** Tópico associado (se aplicável) */
  topicId?: string;
  /** Prioridade 1=alta */
  priority: 1 | 2 | 3;
  /** Tempo estimado em minutos */
  estimatedMinutes: number;
}

// ── Registro de ocorrência de erro do aluno ──

export interface ErrorOccurrence {
  id: string;
  /** Referência ao padrão de erro */
  patternId: string;
  /** Data da ocorrência */
  date: string;
  /** Exercício onde ocorreu */
  exerciseStatement: string;
  /** Resposta do aluno */
  studentAnswer: string;
  /** Resposta correta */
  correctAnswer: string;
  /** Tópico do exercício */
  topicId: string;
  topicName: string;
  disciplineId: string;
  /** Classificação (manual ou por IA) */
  classifiedBy: "ai" | "manual" | "system";
  /** Confiança da classificação 0-1 */
  confidence: number;
  /** Explicação da IA */
  aiExplanation?: string;
  /** Se o aluno já revisou este erro */
  reviewed: boolean;
  /** Se o aluno corrigiu o padrão */
  resolved: boolean;
}

// ── Diagnóstico agregado ──

export interface DiagnosticSummary {
  disciplineId: string;
  disciplineName: string;
  /** Total de erros registrados */
  totalErrors: number;
  /** Distribuição por categoria */
  byCategory: Record<ErrorCategory, number>;
  /** Distribuição por subcategoria */
  bySubcategory: Record<string, number>;
  /** Distribuição por severidade */
  bySeverity: Record<Severity, number>;
  /** Padrões mais frequentes (top 5) */
  topPatterns: { patternId: string; count: number; lastDate: string }[];
  /** Tendência: melhorando, estável, piorando */
  trend: "improving" | "stable" | "worsening";
  /** Score de saúde 0-100 */
  healthScore: number;
}

// ============================================================
// TAXONOMIA COMPLETA — Padrões de erro catalogados
// ============================================================

export const errorPatterns: ErrorPattern[] = [
  // ── CÁLCULO I — Conceitual ──
  {
    id: "calc-concept-domain-restriction",
    category: "conceptual",
    subcategory: "dominio",
    disciplineId: "calculo-1",
    name: "Ignora restrição de domínio",
    description: "Aluno calcula a expressão sem verificar onde ela é válida. Ignora denominadores zero, radicandos negativos, ou argumentos de logaritmo.",
    example: {
      exercise: "Determine o domínio de f(x) = √(x-2) / (x-5)",
      wrongAnswer: "x ≥ 2",
      correctAnswer: "x ≥ 2 e x ≠ 5, ou [2,5) ∪ (5,+∞)",
      studentReasoning: "Só olhou a raiz e esqueceu o denominador",
    },
    rootCause: "Falta de hábito de verificar TODAS as restrições simultâneas. O aluno trata cada componente isoladamente.",
    severity: "high",
    relatedTopicIds: ["calc1-t01", "calc1-t02", "calc1-t04"],
    missingPrerequisites: ["Domínio de funções racionais", "Interseção de condições"],
    recommendations: [
      { type: "review-topic", label: "Revisar domínio de funções compostas", description: "Estude como combinar restrições de domínio quando há raiz + fração + log na mesma expressão.", topicId: "calc1-t02", priority: 1, estimatedMinutes: 20 },
      { type: "practice", label: "Lista de domínios com múltiplas restrições", description: "Faça 10 exercícios de domínio onde f(x) tem pelo menos 2 restrições diferentes.", topicId: "calc1-t02", priority: 1, estimatedMinutes: 30 },
      { type: "do-exercises", label: "Criar checklist pessoal", description: "Monte uma lista: 1) denominador ≠ 0, 2) radicando ≥ 0, 3) argumento de log > 0. Use em todo exercício.", priority: 2, estimatedMinutes: 10 },
    ],
  },
  {
    id: "calc-concept-composition-domain",
    category: "conceptual",
    subcategory: "dominio",
    disciplineId: "calculo-1",
    name: "Domínio de composição = domínio de g",
    description: "Aluno assume que Dom(f∘g) = Dom(g), ignorando que Im(g) ⊆ Dom(f) é necessário.",
    example: {
      exercise: "Se f(x) = √x e g(x) = x² - 4, qual o domínio de f∘g?",
      wrongAnswer: "ℝ (todo x, porque g é polinômio)",
      correctAnswer: "(-∞, -2] ∪ [2, +∞) (onde g(x) ≥ 0)",
      studentReasoning: "g é polinômio, logo tem domínio ℝ. Esqueceu de verificar se g(x) cai no domínio de f.",
    },
    rootCause: "Não internalizou que composição encadeia restrições. Trata f∘g como se fosse apenas g.",
    severity: "high",
    relatedTopicIds: ["calc1-t04", "calc1-t01"],
    missingPrerequisites: ["Conceito de imagem", "Composição como encadeamento"],
    recommendations: [
      { type: "review-topic", label: "Rever composição de funções", description: "Foque em como a imagem de g precisa estar contida no domínio de f.", topicId: "calc1-t04", priority: 1, estimatedMinutes: 25 },
      { type: "practice", label: "Exercícios de Dom(f∘g) com raízes e logs", description: "Pratique com composições que forçam restrições no output intermediário.", topicId: "calc1-t04", priority: 1, estimatedMinutes: 30 },
    ],
  },
  {
    id: "calc-concept-limit-substitution",
    category: "conceptual",
    subcategory: "limite",
    disciplineId: "calculo-1",
    name: "Limite = substituir e pronto",
    description: "Aluno sempre tenta calcular limite substituindo diretamente, sem verificar se é uma indeterminação.",
    example: {
      exercise: "Calcule lim(x→0) sen(x)/x",
      wrongAnswer: "0/0, logo não existe",
      correctAnswer: "1 (limite fundamental)",
      studentReasoning: "Substituiu x=0, obteve 0/0, concluiu que o limite não existe.",
    },
    rootCause: "Confunde indeterminação com inexistência. Não conhece técnicas para resolver 0/0 e ∞/∞.",
    severity: "critical",
    relatedTopicIds: ["calc1-t08", "calc1-t09"],
    missingPrerequisites: ["Tipos de indeterminação", "Limites fundamentais"],
    recommendations: [
      { type: "review-topic", label: "Estudar indeterminações", description: "Aprenda a reconhecer 0/0, ∞/∞, 0·∞, ∞-∞, 0⁰, 1^∞, ∞⁰ como formas que exigem técnica.", topicId: "calc1-t08", priority: 1, estimatedMinutes: 30 },
      { type: "practice", label: "Resolver 15 limites com indeterminação", description: "Foque em limites que dão 0/0 e exigem fatoração, racionalização, ou limites notáveis.", topicId: "calc1-t09", priority: 1, estimatedMinutes: 45 },
      { type: "read-material", label: "Decorar limites fundamentais", description: "sen(x)/x→1, (1+1/x)^x→e, (eˣ-1)/x→1, ln(1+x)/x→1.", priority: 2, estimatedMinutes: 15 },
    ],
  },
  {
    id: "calc-concept-limit-infinity-sqrt",
    category: "conceptual",
    subcategory: "limite",
    disciplineId: "calculo-1",
    name: "Simplificação incorreta em limites no infinito com raízes",
    description: "Ao calcular lim(x→∞) √(x²+ax) - x, o aluno simplifica √(x²) = x e obtém 0, sem usar racionalização.",
    example: {
      exercise: "Calcule lim(x→∞) (√(x²+x) - x)",
      wrongAnswer: "0",
      correctAnswer: "1/2",
      studentReasoning: "√(x²+x) ≈ √x² = x, logo x - x = 0",
    },
    rootCause: "Não reconhece que ∞-∞ é indeterminação. Desconhece técnica de multiplicar pelo conjugado.",
    severity: "high",
    relatedTopicIds: ["calc1-t10", "calc1-t09"],
    missingPrerequisites: ["Racionalização", "Indeterminação ∞-∞"],
    recommendations: [
      { type: "review-topic", label: "Técnica de racionalização", description: "Multiplique por (√(x²+x)+x)/(√(x²+x)+x) para eliminar a indeterminação.", topicId: "calc1-t10", priority: 1, estimatedMinutes: 20 },
      { type: "practice", label: "Limites com √ no infinito", description: "Faça 8 exercícios do tipo √(ax²+bx+c) - dx com x→∞.", topicId: "calc1-t10", priority: 1, estimatedMinutes: 35 },
    ],
  },

  // ── CÁLCULO I — Algébrico ──
  {
    id: "calc-alg-sign-error",
    category: "algebraic",
    subcategory: "limite",
    disciplineId: "calculo-1",
    name: "Erro de sinal em fatoração",
    description: "Aluno erra sinais ao fatorar, distribuir negativo, ou simplificar frações.",
    example: {
      exercise: "Fatore x² - 5x + 6",
      wrongAnswer: "(x-2)(x+3)",
      correctAnswer: "(x-2)(x-3)",
      studentReasoning: "Esqueceu que (-2)×(-3) = +6, não (-2)×(+3) = -6",
    },
    rootCause: "Descuido com regra de sinais na fatoração. Falta de verificação por substituição.",
    severity: "medium",
    relatedTopicIds: ["calc1-t03", "calc1-t09"],
    missingPrerequisites: [],
    recommendations: [
      { type: "practice", label: "Fatoração com verificação", description: "Fatore E depois substitua um valor para conferir. Ex: se x=0, dá 6? (0-2)(0-3)=6 ✓", priority: 1, estimatedMinutes: 20 },
    ],
  },
  {
    id: "calc-alg-distribute-root",
    category: "algebraic",
    subcategory: "dominio",
    disciplineId: "calculo-1",
    name: "Distribui raiz sobre soma: √(a+b) = √a + √b",
    description: "Aluno aplica distributiva da raiz quadrada sobre adição, que é falso.",
    example: {
      exercise: "Simplifique √(x²+9)",
      wrongAnswer: "x + 3",
      correctAnswer: "√(x²+9) (não simplifica)",
      studentReasoning: "Tratou √ como função linear",
    },
    rootCause: "Generalização incorreta: √(ab) = √a·√b é válido, mas √(a+b) ≠ √a+√b.",
    severity: "high",
    relatedTopicIds: ["calc1-t01", "calc1-t05"],
    missingPrerequisites: ["Propriedades de radicais"],
    recommendations: [
      { type: "review-topic", label: "Propriedades de radicais", description: "Revise: √(ab) = √a·√b é válido. √(a+b) NÃO se distribui. Teste com números: √(9+16) = √25 = 5 ≠ 3+4 = 7.", topicId: "calc1-t01", priority: 1, estimatedMinutes: 15 },
      { type: "practice", label: "Simplificações algébricas", description: "10 exercícios de simplificação onde a 'tentação' é distribuir raiz ou expoente sobre soma.", priority: 1, estimatedMinutes: 25 },
    ],
  },

  // ── CÁLCULO I — Interpretação ──
  {
    id: "calc-interp-graph-limit",
    category: "interpretation",
    subcategory: "limite",
    disciplineId: "calculo-1",
    name: "Confunde valor da função com limite",
    description: "Ao analisar gráfico, o aluno lê f(a) em vez de lim(x→a) f(x). Não distingue limite lateral de valor pontual.",
    example: {
      exercise: "Pelo gráfico, determine lim(x→2) f(x)",
      wrongAnswer: "f(2) = 3 (leu o ponto marcado)",
      correctAnswer: "lim(x→2) f(x) = 5 (para onde a curva 'tende')",
      studentReasoning: "Olhou o ponto no gráfico em x=2 em vez da tendência das curvas",
    },
    rootCause: "Não internalizou que limite é sobre tendência/aproximação, não valor pontual.",
    severity: "critical",
    relatedTopicIds: ["calc1-t08"],
    missingPrerequisites: ["Definição intuitiva de limite"],
    recommendations: [
      { type: "review-topic", label: "Definição intuitiva de limite", description: "Limite = 'para onde f(x) vai quando x se APROXIMA de a'. Não importa o valor em x=a.", topicId: "calc1-t08", priority: 1, estimatedMinutes: 20 },
      { type: "practice", label: "Limites por gráfico", description: "Faça 10 exercícios de leitura de limites em gráficos com descontinuidades.", priority: 1, estimatedMinutes: 25 },
    ],
  },

  // ── MAT. DISCRETA — Conceitual ──
  {
    id: "md-concept-biconditional",
    category: "conceptual",
    subcategory: "logica",
    disciplineId: "mat-discreta",
    name: "Confunde condicional (→) com bicondicional (↔)",
    description: "Aluno trata → como se fosse ↔, ou não entende que p→q é V quando p é F.",
    example: {
      exercise: "Monte a tabela-verdade de p → q",
      wrongAnswer: "F→V é F",
      correctAnswer: "F→V é V (condicional só é F quando antecedente V e consequente F)",
      studentReasoning: "Achou que → funciona como ↔, exigindo mesmo valor",
    },
    rootCause: "Não entendeu a semântica da implicação material: p→q é falso APENAS quando p=V e q=F.",
    severity: "critical",
    relatedTopicIds: ["md-t03", "md-t02"],
    missingPrerequisites: ["Definição formal de implicação"],
    recommendations: [
      { type: "review-topic", label: "Condicional vs bicondicional", description: "p→q: só F quando V→F. p↔q: V quando ambos iguais (V,V ou F,F). Decore: 'promessa só é quebrada se eu prometo (V) e não cumpro (F)'.", topicId: "md-t03", priority: 1, estimatedMinutes: 15 },
      { type: "practice", label: "Tabelas-verdade com →, ↔, e negações", description: "Monte 5 tabelas com expressões que misturam → e ↔.", topicId: "md-t02", priority: 1, estimatedMinutes: 30 },
    ],
  },
  {
    id: "md-concept-demorgan-quantifier",
    category: "conceptual",
    subcategory: "quantificadores",
    disciplineId: "mat-discreta",
    name: "Negação incorreta de quantificador",
    description: "Aluno nega ∀ como ∀¬ em vez de ∃¬, ou nega ∃ como ∃¬ em vez de ∀¬.",
    example: {
      exercise: "Negue: ∀x ∈ ℕ, x² ≥ x",
      wrongAnswer: "∀x ∈ ℕ, x² < x",
      correctAnswer: "∃x ∈ ℕ tal que x² < x",
      studentReasoning: "Negou o predicado mas manteve o quantificador",
    },
    rootCause: "Não aprendeu a regra de De Morgan generalizada: ¬∀ = ∃¬ e ¬∃ = ∀¬.",
    severity: "high",
    relatedTopicIds: ["md-t04", "md-t03"],
    missingPrerequisites: ["De Morgan para quantificadores"],
    recommendations: [
      { type: "review-topic", label: "Negação de quantificadores", description: "Regra: ¬(∀x, P(x)) = ∃x, ¬P(x) e ¬(∃x, P(x)) = ∀x, ¬P(x). O quantificador troca, o predicado nega.", topicId: "md-t04", priority: 1, estimatedMinutes: 20 },
      { type: "practice", label: "Negar proposições quantificadas", description: "Negue 10 proposições com quantificadores aninhados.", topicId: "md-t04", priority: 1, estimatedMinutes: 25 },
    ],
  },

  // ── MAT. DISCRETA — Lógico ──
  {
    id: "md-logical-induction-base",
    category: "logical",
    subcategory: "inducao",
    disciplineId: "mat-discreta",
    name: "Indução sem caso base",
    description: "Aluno faz o passo indutivo mas esquece (ou trivializa) o caso base.",
    example: {
      exercise: "Prove por indução que 1+2+...+n = n(n+1)/2",
      wrongAnswer: "Assumo P(k) verdadeiro... [passo correto]... logo P(k+1). ∎",
      correctAnswer: "Caso base: n=1, 1 = 1·2/2 = 1 ✓. Passo: assumo P(k)... logo P(k+1). ∎",
      studentReasoning: "Pulou direto pro passo indutivo",
    },
    rootCause: "Não entende que indução é um dominó: sem derrubar a primeira peça (caso base), o passo não faz nada.",
    severity: "high",
    relatedTopicIds: ["md-t12"],
    missingPrerequisites: ["Princípio de indução finita"],
    recommendations: [
      { type: "review-topic", label: "Estrutura da indução", description: "Indução = 3 partes: (1) caso base, (2) hipótese indutiva, (3) passo. Sem o (1), a prova não vale nada.", topicId: "md-t12", priority: 1, estimatedMinutes: 15 },
      { type: "practice", label: "Provas por indução completas", description: "Faça 5 provas por indução marcando explicitamente 'CASO BASE' e 'PASSO INDUTIVO'.", topicId: "md-t12", priority: 1, estimatedMinutes: 40 },
    ],
  },
  {
    id: "md-logical-converse-error",
    category: "logical",
    subcategory: "logica",
    disciplineId: "mat-discreta",
    name: "Afirmação do consequente",
    description: "Aluno conclui p a partir de p→q e q, que é falácia lógica.",
    example: {
      exercise: "Se chove, então a rua fica molhada. A rua está molhada. O que se conclui?",
      wrongAnswer: "Está chovendo",
      correctAnswer: "Nada — pode ter sido a mangueira. Afirmar o consequente é falácia.",
      studentReasoning: "Inverteu a direção da implicação",
    },
    rootCause: "Confunde p→q com q→p. Não distingue condicional da conversa.",
    severity: "medium",
    relatedTopicIds: ["md-t03"],
    missingPrerequisites: ["Falácias formais", "Contrapositiva"],
    recommendations: [
      { type: "review-topic", label: "Condicional, conversa e contrapositiva", description: "p→q ≡ ¬q→¬p (contrapositiva). MAS p→q ≢ q→p (conversa). Modus Ponens: p→q, p ⊢ q. Modus Tollens: p→q, ¬q ⊢ ¬p.", topicId: "md-t03", priority: 1, estimatedMinutes: 20 },
      { type: "practice", label: "Identificar falácias", description: "Em 10 argumentos, identifique quais são válidos e quais cometem falácia do consequente ou da negação.", topicId: "md-t03", priority: 2, estimatedMinutes: 25 },
    ],
  },

  // ── MAT. DISCRETA — Formalização ──
  {
    id: "md-formal-natural-to-logic",
    category: "formalization",
    subcategory: "logica",
    disciplineId: "mat-discreta",
    name: "Não consegue formalizar frase em linguagem natural",
    description: "Aluno não traduz corretamente 'se... então', 'todo', 'existe', 'a menos que' para símbolos lógicos.",
    example: {
      exercise: "Formalize: 'Todo número par maior que 2 é composto'",
      wrongAnswer: "∀x(par(x) ∧ composto(x))",
      correctAnswer: "∀x((par(x) ∧ x > 2) → composto(x))",
      studentReasoning: "Usou ∧ em vez de → dentro do ∀, afirmando que todo x é par E composto",
    },
    rootCause: "Não sabe que ∀x(P(x) → Q(x)) é a forma correta de 'todo P é Q', não ∀x(P(x) ∧ Q(x)).",
    severity: "critical",
    relatedTopicIds: ["md-t03", "md-t04"],
    missingPrerequisites: ["Tradução natural→formal", "∀ com → vs ∧"],
    recommendations: [
      { type: "review-topic", label: "Formalização de proposições", description: "Regra: 'Todo A é B' = ∀x(A(x) → B(x)), NÃO ∀x(A(x) ∧ B(x)). 'Existe A que é B' = ∃x(A(x) ∧ B(x)).", topicId: "md-t04", priority: 1, estimatedMinutes: 25 },
      { type: "practice", label: "Traduzir 15 frases para lógica", description: "Pratique traduzindo frases do cotidiano e de matemática para fórmulas lógicas.", topicId: "md-t04", priority: 1, estimatedMinutes: 35 },
    ],
  },
  {
    id: "md-formal-set-builder",
    category: "formalization",
    subcategory: "relacoes",
    disciplineId: "mat-discreta",
    name: "Notação de conjunto por compreensão incorreta",
    description: "Aluno erra a construção {x ∈ A | P(x)}, misturando condição e universo.",
    example: {
      exercise: "Escreva o conjunto dos naturais ímpares menores que 10",
      wrongAnswer: "{x | x < 10 ∧ ímpar(x)}",
      correctAnswer: "{x ∈ ℕ | x < 10 ∧ x é ímpar} = {1, 3, 5, 7, 9}",
      studentReasoning: "Esqueceu de especificar o universo (x ∈ ℕ)",
    },
    rootCause: "Não fixa que a notação exige universo explícito antes da barra.",
    severity: "medium",
    relatedTopicIds: ["md-t01", "md-t02"],
    missingPrerequisites: ["Notação de conjuntos"],
    recommendations: [
      { type: "review-topic", label: "Notação de conjuntos", description: "Sempre: {variável ∈ UNIVERSO | condição}. O universo (ℕ, ℤ, ℝ) vem antes da barra.", topicId: "md-t01", priority: 1, estimatedMinutes: 15 },
      { type: "practice", label: "Converter entre extensão e compreensão", description: "Dado {2,4,6,8,...}, escreva em compreensão. E vice-versa.", topicId: "md-t01", priority: 2, estimatedMinutes: 20 },
    ],
  },

  // ── MAT. DISCRETA — Algébrico ──
  {
    id: "md-alg-demorgan-set",
    category: "algebraic",
    subcategory: "relacoes",
    disciplineId: "mat-discreta",
    name: "Erro na aplicação de De Morgan para conjuntos",
    description: "Aluno erra complemento de união/interseção: (A∪B)ᶜ ≠ Aᶜ ∪ Bᶜ.",
    example: {
      exercise: "Simplifique (A ∪ B)ᶜ",
      wrongAnswer: "Aᶜ ∪ Bᶜ",
      correctAnswer: "Aᶜ ∩ Bᶜ (De Morgan: complemento troca ∪ por ∩)",
      studentReasoning: "Distribuiu complemento sem trocar a operação",
    },
    rootCause: "Sabe que precisa complementar, mas esquece de trocar ∪↔∩.",
    severity: "medium",
    relatedTopicIds: ["md-t02"],
    missingPrerequisites: ["Leis de De Morgan para conjuntos"],
    recommendations: [
      { type: "review-topic", label: "Leis de De Morgan", description: "(A∪B)ᶜ = Aᶜ∩Bᶜ e (A∩B)ᶜ = Aᶜ∪Bᶜ. Mesma lógica: ¬(p∨q) = ¬p∧¬q.", topicId: "md-t02", priority: 1, estimatedMinutes: 15 },
      { type: "practice", label: "Simplificações com De Morgan", description: "10 expressões de conjuntos para simplificar usando De Morgan + verificar com diagramas de Venn.", topicId: "md-t02", priority: 1, estimatedMinutes: 25 },
    ],
  },

  // ── MAT. DISCRETA — Interpretação ──
  {
    id: "md-interp-quantifier-scope",
    category: "interpretation",
    subcategory: "quantificadores",
    disciplineId: "mat-discreta",
    name: "Não identifica escopo do quantificador",
    description: "Em ∀x(P(x) → ∃y Q(x,y)), o aluno não vê que y pode depender de x.",
    example: {
      exercise: "Interprete: ∀x ∈ ℝ, ∃y ∈ ℝ tal que x + y = 0",
      wrongAnswer: "Existe um y fixo que soma zero com qualquer x",
      correctAnswer: "Para cada x, existe um y (que pode ser diferente para cada x) tal que x+y=0. Neste caso, y = -x.",
      studentReasoning: "Inverteu a ordem de dependência dos quantificadores",
    },
    rootCause: "Não entende que a ordem ∀∃ vs ∃∀ muda completamente o significado.",
    severity: "high",
    relatedTopicIds: ["md-t04"],
    missingPrerequisites: ["Escopo e ordem de quantificadores"],
    recommendations: [
      { type: "review-topic", label: "Ordem de quantificadores", description: "∀x∃y: para cada x, acho um y (y depende de x). ∃y∀x: existe um y fixo que funciona para todo x. São MUITO diferentes.", topicId: "md-t04", priority: 1, estimatedMinutes: 20 },
      { type: "practice", label: "Trocar ordem e comparar significado", description: "Pegue 5 proposições ∀∃ e reescreva como ∃∀. Diga se o significado mudou e se ainda é verdadeira.", topicId: "md-t04", priority: 1, estimatedMinutes: 30 },
    ],
  },
];

// ── Mock: ocorrências do aluno ──

export const mockOccurrences: ErrorOccurrence[] = [
  {
    id: "occ-1", patternId: "calc-concept-domain-restriction", date: "2026-03-25",
    exerciseStatement: "Determine Dom(f) onde f(x) = ln(x-1) / √(4-x)", studentAnswer: "x > 1",
    correctAnswer: "(1, 4)", topicId: "calc1-t02", topicName: "Domínio, imagem e gráfico",
    disciplineId: "calculo-1", classifiedBy: "ai", confidence: 0.92,
    aiExplanation: "O aluno verificou ln(x-1) → x>1 mas ignorou √(4-x) → x<4 e denominador ≠ 0 → x≠4.",
    reviewed: false, resolved: false,
  },
  {
    id: "occ-2", patternId: "calc-concept-limit-substitution", date: "2026-03-24",
    exerciseStatement: "Calcule lim(x→0) (eˣ-1)/x", studentAnswer: "0/0 = indefinido",
    correctAnswer: "1", topicId: "calc1-t09", topicName: "Cálculo de limites",
    disciplineId: "calculo-1", classifiedBy: "ai", confidence: 0.95,
    aiExplanation: "O aluno substituiu x=0 e concluiu que 0/0 significa que o limite não existe. É um limite fundamental que vale 1.",
    reviewed: true, resolved: false,
  },
  {
    id: "occ-3", patternId: "md-concept-biconditional", date: "2026-03-24",
    exerciseStatement: "Qual o valor de F → V?", studentAnswer: "F",
    correctAnswer: "V", topicId: "md-t03", topicName: "Lógica proposicional",
    disciplineId: "mat-discreta", classifiedBy: "ai", confidence: 0.98,
    aiExplanation: "Aluno tratou → como ↔. Na condicional, F→V = V.",
    reviewed: true, resolved: true,
  },
  {
    id: "occ-4", patternId: "md-concept-demorgan-quantifier", date: "2026-03-23",
    exerciseStatement: "Negue: ∀n ∈ ℕ, n² ≥ 0", studentAnswer: "∀n ∈ ℕ, n² < 0",
    correctAnswer: "∃n ∈ ℕ tal que n² < 0", topicId: "md-t04", topicName: "Quantificadores",
    disciplineId: "mat-discreta", classifiedBy: "ai", confidence: 0.91,
    aiExplanation: "Negou o predicado mas manteve ∀. Correto: ¬∀ = ∃¬.",
    reviewed: false, resolved: false,
  },
  {
    id: "occ-5", patternId: "calc-alg-sign-error", date: "2026-03-22",
    exerciseStatement: "Fatore x² - 7x + 12", studentAnswer: "(x-3)(x+4)",
    correctAnswer: "(x-3)(x-4)", topicId: "calc1-t03", topicName: "Função afim e quadrática",
    disciplineId: "calculo-1", classifiedBy: "ai", confidence: 0.88,
    aiExplanation: "(-3)×(+4) = -12, não +12. Os dois fatores devem ser negativos: (-3)×(-4) = +12.",
    reviewed: false, resolved: false,
  },
  {
    id: "occ-6", patternId: "md-formal-natural-to-logic", date: "2026-03-22",
    exerciseStatement: "Formalize: 'Todo primo maior que 2 é ímpar'", studentAnswer: "∀x(primo(x) ∧ ímpar(x))",
    correctAnswer: "∀x((primo(x) ∧ x > 2) → ímpar(x))", topicId: "md-t04", topicName: "Quantificadores",
    disciplineId: "mat-discreta", classifiedBy: "ai", confidence: 0.93,
    aiExplanation: "Usou ∧ onde deveria usar →. 'Todo A é B' se formaliza como ∀x(A(x) → B(x)).",
    reviewed: false, resolved: false,
  },
  {
    id: "occ-7", patternId: "calc-alg-distribute-root", date: "2026-03-21",
    exerciseStatement: "Simplifique √(x²+16)", studentAnswer: "x + 4",
    correctAnswer: "√(x²+16) (irredutível)", topicId: "calc1-t01", topicName: "Conceito de função",
    disciplineId: "calculo-1", classifiedBy: "ai", confidence: 0.97,
    aiExplanation: "Distribuiu raiz sobre soma: √(a+b) ≠ √a + √b. Teste: √(9+16) = √25 = 5 ≠ 3+4 = 7.",
    reviewed: true, resolved: true,
  },
  {
    id: "occ-8", patternId: "md-logical-converse-error", date: "2026-03-20",
    exerciseStatement: "p→q é V e q é V. O que se conclui sobre p?", studentAnswer: "p é V",
    correctAnswer: "Nada — falácia da afirmação do consequente.", topicId: "md-t03", topicName: "Lógica proposicional",
    disciplineId: "mat-discreta", classifiedBy: "ai", confidence: 0.85,
    aiExplanation: "De p→q e q, não se pode concluir p. Isso é a falácia do consequente.",
    reviewed: false, resolved: false,
  },
];
