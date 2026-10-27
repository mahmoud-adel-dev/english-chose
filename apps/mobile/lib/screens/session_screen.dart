import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../models/session.dart';
import '../providers/app_provider.dart';

class SessionScreen extends StatefulWidget {
  const SessionScreen({super.key});

  @override
  State<SessionScreen> createState() => _SessionScreenState();
}

class _SessionScreenState extends State<SessionScreen> {
  final _answerController = TextEditingController();
  int _currentQuestionIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().fetchCurrentSession();
    });
  }

  @override
  void dispose() {
    _answerController.dispose();
    super.dispose();
  }

  String _formatQuestionType(String type) {
    switch (type) {
      case 'OPEN_SPEECH':
        return '🎤 Open Speech';
      case 'SENTENCE_REPETITION':
        return '🔁 Sentence Repetition';
      case 'READING_ALOUD':
        return '📖 Reading Aloud';
      case 'PICTURE_DESCRIPTION':
        return '🖼️ Picture Description';
      case 'CONVERSATION_PROMPT':
        return '💬 Conversation';
      case 'GRAMMAR_REPAIR':
        return '🔧 Grammar Repair';
      default:
        return '✍️ Exercise';
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final session = provider.currentSession;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Daily Practice'),
        actions: [
          if (session != null && session.status == 'ACTIVE')
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Text(
                  'Q ${_currentQuestionIndex + 1} / ${session.questions.length}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryColor,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: _buildContent(provider, session),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(AppProvider provider, DailySessionModel? session) {
    if (provider.isLoading && session == null) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(40),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (session == null || session.status != 'ACTIVE') {
      return _buildNoActiveSession(provider);
    }

    if (session.questions.isEmpty) {
      return _buildNoActiveSession(provider);
    }

    final question = session.questions[_currentQuestionIndex.clamp(0, session.questions.length - 1)];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Progress Bar
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: (_currentQuestionIndex + 1) / session.questions.length,
            backgroundColor: const Color(0xFFE2E8F0),
            valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
            minHeight: 8,
          ),
        ),
        const SizedBox(height: 24),

        // Question Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _formatQuestionType(question.questionType),
                        style: const TextStyle(
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    Text(
                      'Difficulty: ${question.difficultyScore.toStringAsFixed(1)}',
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  question.promptText,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                    height: 1.4,
                  ),
                ),
                if (question.contextHint != null && question.contextHint!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.lightbulb_outline, size: 18, color: AppTheme.warningColor),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Hint: ${question.contextHint}',
                            style: const TextStyle(
                              color: Color(0xFF475569),
                              fontSize: 13,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),

        // Answer Input Field
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Your Response:',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: Color(0xFF334155),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _answerController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    hintText: 'Type your answer here in English...',
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: provider.isLoading ? null : () => _submit(provider, question.id),
                  icon: provider.isLoading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.send_rounded),
                  label: Text(provider.isLoading ? 'Evaluating with AI...' : 'Submit Answer'),
                ),
              ],
            ),
          ),
        ),

        // Latest AI Evaluation Result Display
        if (provider.lastEvaluation != null) ...[
          const SizedBox(height: 20),
          _buildEvaluationFeedback(provider, session),
        ],
      ],
    );
  }

  void _submit(AppProvider provider, String questionId) async {
    final text = _answerController.text.trim();
    if (text.isEmpty) return;

    final success = await provider.submitAnswer(questionId, text);
    if (success) {
      _answerController.clear();
    }
  }

  Widget _buildEvaluationFeedback(AppProvider provider, DailySessionModel session) {
    final eval = provider.lastEvaluation!;
    final isLast = _currentQuestionIndex >= session.questions.length - 1;

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: eval.isPassed ? AppTheme.successColor : AppTheme.warningColor,
          width: 1.5,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  eval.isPassed ? Icons.check_circle_rounded : Icons.info_outline_rounded,
                  color: eval.isPassed ? AppTheme.successColor : AppTheme.warningColor,
                  size: 28,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    eval.isPassed ? 'Great Job!' : 'Keep Practicing!',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: eval.isPassed ? AppTheme.successColor : AppTheme.warningColor,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Score: ${eval.overallScore.toStringAsFixed(0)}%',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'Polished Expression:',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.all(12),
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                eval.correctedSentence,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0F172A),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              eval.explanationMarkdown,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF475569),
                height: 1.4,
              ),
            ),
            if (eval.identifiedErrors.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 8),
              ...eval.identifiedErrors.map((err) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.close, color: AppTheme.errorColor, size: 16),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '"${err.wrongSnippet}" → "${err.correctSnippet}": ${err.explanation}',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
                          ),
                        ),
                      ],
                    ),
                  )),
            ],
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton.icon(
                onPressed: () {
                  if (isLast) {
                    // Refresh session state to show completed screen
                    provider.fetchCurrentSession();
                  } else {
                    setState(() {
                      _currentQuestionIndex++;
                    });
                  }
                },
                icon: Icon(isLast ? Icons.check_circle : Icons.arrow_forward_rounded),
                label: Text(isLast ? 'Finish Session' : 'Next Question'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoActiveSession(AppProvider provider) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(36),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.menu_book_rounded,
                size: 56,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Start Today\'s Daily Training',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Receive 5 AI-curated English exercises tailored to your current CEFR level with instant grammar and fluency diagnostics.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
                height: 1.5,
              ),
            ),
            const SizedBox(height: 28),
            ElevatedButton.icon(
              onPressed: provider.isLoading ? null : () => provider.startSession(),
              icon: provider.isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.rocket_launch_rounded),
              label: Text(provider.isLoading ? 'Generating Exercises...' : 'Start Session Now'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

