import {
  IAiProviderAdapter,
  AiCompletionRequest,
  AiCompletionResponse,
  SttTranscriptionRequest,
  SttTranscriptionResponse,
  ProviderConnectionTestResult,
} from "../types";
import { getQuestionsForCefrLevel } from "../../learning/question-bank";

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
      const answerMatch = req.userPrompt.match(/Learner(?:'s)? Submitted Answer:\s*"([^"]*)"/i);
      const studentAnswer = (answerMatch ? answerMatch[1] : req.userPrompt).trim();
      const hasArabic = /[\u0600-\u06FF]/.test(studentAnswer);

      const evaluationResult = hasArabic
        ? {
            isMeaningAccurate: false,
            overallScore: 20,
            grammarScore: 15,
            vocabularyScore: 20,
            fluencyScore: 25,
            explanation:
              "تم رصد إدخال باللغة العربية. نرجو التحدث أو الكتابة باللغة الإنجليزية حصراً ليتمكن المدرب من قياس مستواك وتقديم تقييم دقيق لنطقك وقواعدك.",
            correctedSentence: "Learning English is essential for my future career and travel opportunities.",
            scores: {
              grammar: 15,
              vocabulary: 20,
              overall: 20,
              fluency: 25,
            },
            explanationMarkdown:
              "### ⚠️ تنبيه حول لغة الإجابة\n- تم رصد كلمات أو حروف عربية في الإجابة المسجلة.\n- للحصول على تقييم دقيق في سلم CEFR، يُرجى الإجابة باللغة الإنجليزية حصراً عبر الميكروفون أو لوحة المفاتيح.\n\n### 💡 جرب صياغة مثل:\n*\"I think English is important because it helps me get a better job.\"*",
            identifiedErrors: [
              {
                category: "LANGUAGE_MISMATCH",
                wrongSnippet: studentAnswer.slice(0, 30),
                correctSnippet: "English response required",
                explanation: "يرجى استخدام اللغة الإنجليزية فقط لتشخيص مهارات التحدث بدقة.",
              },
            ],
            retryEligible: true,
            isPassed: false,
          }
        : {
            isMeaningAccurate: true,
            overallScore: 82,
            grammarScore: 85,
            vocabularyScore: 80,
            fluencyScore: 82,
            explanation:
              "أحسنت! إجابتك مفهومة وواضحة، وقد استخدمت مفردات ملائمة للسياق مع ترابط جيد في الجمل.",
            correctedSentence: studentAnswer.length > 5
              ? studentAnswer
              : "I can see my laptop, my phone, and my books on the desk.",
            scores: {
              grammar: 85,
              vocabulary: 80,
              overall: 82,
              fluency: 82,
            },
            explanationMarkdown:
              "### 🌟 ما أحسنت فيه\n- صياغة الفكرة بوضوح واستخدام كلمات مناسبة للسياق.\n- تسلسل الأفكار كان سهلاً ومترابطاً.\n\n### 💡 نصائح للتطوير\n- حاول دمج أدوات الربط مثل (because, so, moreover) لتبدو الجمل أكثر تدفقاً.\n\n### 🗣️ نصيحة النطق والطلاقة\n- انتبه للوصل الصوتي بين الكلمات القصيرة (مثل and + my) لنطق أكثر سلاسة وطبيعية.",
            identifiedErrors: [],
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

    // Check if the request is for Real-Time Conversation Chat
    if (promptLower.includes("conversation") || promptLower.includes("chat partner") || promptLower.includes("coach alex")) {
      const isEvaluation = promptLower.includes("diagnostic report") || promptLower.includes("evaluate the entire conversation");

      if (isEvaluation) {
        const fullReport = {
          overallScore: 84.5,
          assessedLevel: "B1",
          grammarScore: 82.0,
          vocabularyScore: 85.0,
          fluencyScore: 88.0,
          pronunciationScore: 83.0,
          summaryArabic: "أداء محادثة متميز ومبشر! أظهرت قدرة عالية على التعبير عن أفكارك والمشاركة في حوار تفاعلي مستمر مع ترابط أفكار جيد ومفردات ملائمة للمستوى المتوسط.",
          strengthsArabic: [
            "المبادرة في الحديث واستخدام جمل مركبة ومفهومة.",
            "سرعة التجاوب والقدرة على شرح التفاصيل الشخصية بثقة.",
            "استخدام مفردات متنوعة تخدم سياق الحوار بشكل طبيعي.",
          ],
          areasForImprovementArabic: [
            "الانتباه لتوافق الأزمنة (الماضي البسيط والماضي المستمر).",
            "استخدام حروف الجر الملازمة للأفعال (prepositional verbs).",
            "تنويع أدوات الربط المعقدة مثل (although, whereas, as a result).",
          ],
          allMistakes: [
            {
              wrongSnippet: "I go to store yesterday",
              correctSnippet: "I went to the store yesterday",
              explanation: "في الإنجليزية نستخدم التصريف الثاني (went) عند التحدث عن حدث اكتمل في الماضي (yesterday).",
            },
            {
              wrongSnippet: "She don't like coffee",
              correctSnippet: "She doesn't like coffee",
              explanation: "مع الضمائر المفردة الغائبة (He/She/It) نستخدم doesn't في النفي وليس don't.",
            },
          ],
        };

        return {
          content: JSON.stringify(fullReport),
          parsedJson: fullReport,
          promptTokens: 250,
          completionTokens: 180,
          latencyMs: Date.now() - startTime + 15,
          modelIdentifier: model,
        };
      }

      // Single conversation turn reply
      const conversationReply = {
        reply: "That's a very interesting thought! Practicing spoken English every day builds massive confidence. What is your favorite hobby or activity when you want to relax after a busy day?",
        correctionTip: "💡 Coach Tip: Remember to use 'interested in' when talking about hobbies (e.g., 'I am interested in reading').",
        detectedErrors: [],
      };

      return {
        content: JSON.stringify(conversationReply),
        parsedJson: conversationReply,
        promptTokens: 150,
        completionTokens: 90,
        latencyMs: Date.now() - startTime + 10,
        modelIdentifier: model,
      };
    }

    // Default question generation mock - returns 5 tailored questions according to CEFR level
    const cefrMatch = (req.systemPrompt + " " + req.userPrompt).match(/\b(A1|A2|B1|B2|C1|C2)\b/i);
    const detectedLevel = cefrMatch ? cefrMatch[1].toUpperCase() : "A2";
    const questionResult = getQuestionsForCefrLevel(detectedLevel, 5);

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
    _model: string,
    _req: SttTranscriptionRequest
  ): Promise<SttTranscriptionResponse> {
    throw new Error("Mock AI cannot transcribe real learner audio.");
  }

  async testConnection(): Promise<ProviderConnectionTestResult> {
    return {
      ok: true,
      latencyMs: 1,
    };
  }
}
