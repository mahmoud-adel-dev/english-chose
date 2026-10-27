import {
  IAiProviderAdapter,
  AiCompletionRequest,
  AiCompletionResponse,
  SttTranscriptionRequest,
  SttTranscriptionResponse,
  ProviderConnectionTestResult,
} from "../types";

export class MockAiProviderAdapter implements IAiProviderAdapter {
  readonly providerId = "mock-provider";

  async generateCompletion(
    model: string,
    req: AiCompletionRequest
  ): Promise<AiCompletionResponse> {
    const startTime = Date.now();

    const promptLower = (req.userPrompt + " " + req.systemPrompt).toLowerCase();

    // Check if the request is an Answer Evaluation request
    if (promptLower.includes("evaluat") || promptLower.includes("answer")) {
      const evaluationResult = {
        isMeaningAccurate: true,
        correctedSentence: "I went to the store yesterday to buy some groceries.",
        scores: {
          grammar: 85,
          vocabulary: 80,
          overall: 82,
          fluency: 85,
        },
        explanationMarkdown:
          "Great effort! You used the correct past tense for the main verb. To sound more natural, make sure to include the preposition before the noun.",
        identifiedErrors: [
          {
            category: "GRAMMAR",
            wrongSnippet: "I go to store",
            correctSnippet: "I went to the store",
            explanation: "In English, use the past simple 'went' when referring to finished past time like 'yesterday'.",
          },
        ],
        retryEligible: true,
        isPassed: true,
      };

      return {
        content: JSON.stringify(evaluationResult),
        parsedJson: evaluationResult,
        promptTokens: 120,
        completionTokens: 85,
        latencyMs: Date.now() - startTime + 10,
        modelIdentifier: model,
      };
    }

    // Default question generation mock
    const questionResult = {
      orderIndex: 1,
      questionType: "CONVERSATION_PROMPT",
      promptText: "Describe what you usually do on your favorite day of the week.",
      pedagogicalGoal: "Practice present simple frequency adverbs and daily routine vocabulary",
      contextHint: "Mention words like 'always', 'usually', 'sometimes'.",
      difficultyScore: 1.2,
    };

    return {
      content: JSON.stringify(questionResult),
      parsedJson: questionResult,
      promptTokens: 80,
      completionTokens: 60,
      latencyMs: Date.now() - startTime + 5,
      modelIdentifier: model,
    };
  }

  async transcribeAudio(
    model: string,
    req: SttTranscriptionRequest
  ): Promise<SttTranscriptionResponse> {
    return {
      transcript: "I go to store yesterday and buy apple.",
      confidence: 0.94,
      durationSec: 3.5,
      latencyMs: 12,
    };
  }

  async testConnection(): Promise<ProviderConnectionTestResult> {
    return {
      ok: true,
      latencyMs: 1,
    };
  }
}
