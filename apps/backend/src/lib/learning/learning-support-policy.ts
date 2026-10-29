import type { CefrLevel } from "@english-coach/contracts";

export type LearningSupportAction = "TRANSLATE" | "EXPLAIN" | "MODEL_ANSWER";

export function buildLearningSupportRequest(input: {
  action: string;
  question: string;
  level: CefrLevel;
}) {
  const question = input.question.trim();
  if (!question) throw new Error("Question is required");

  const prompts: Record<LearningSupportAction, string> = {
    TRANSLATE:
      "Accurately translate the English question into clear Modern Standard Arabic. Do not answer the question or add hints.",
    EXPLAIN: `Explain in simple Arabic what this English question asks a CEFR ${input.level} learner to do. Clarify useful instructions and concepts without writing the answer.`,
    MODEL_ANSWER: `Write one concise model answer in English appropriate for CEFR ${input.level}. Label it as a model answer and do not claim it is the learner's own work.`,
  };

  if (!(input.action in prompts)) {
    throw new Error("Unsupported learning support action");
  }

  return {
    systemPrompt: prompts[input.action as LearningSupportAction],
    userPrompt: `Question: "${question}"`,
    temperature: input.action === "MODEL_ANSWER" ? 0.4 : 0.1,
  };
}
