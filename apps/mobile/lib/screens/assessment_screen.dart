import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/app_provider.dart';
import '../widgets/level_badge.dart';

class AssessmentScreen extends StatefulWidget {
  final VoidCallback onFinish;

  const AssessmentScreen({super.key, required this.onFinish});

  @override
  State<AssessmentScreen> createState() => _AssessmentScreenState();
}

class _AssessmentScreenState extends State<AssessmentScreen> {
  final _answerController = TextEditingController();

  @override
  void dispose() {
    _answerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final item = provider.currentAssessmentItem;
    final result = provider.lastAssessmentResult;

    return Scaffold(
      appBar: AppBar(
        title: const Text('CEFR Placement Test'),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: _buildBody(provider, item, result),
          ),
        ),
      ),
    );
  }

  Widget _buildBody(AppProvider provider, dynamic item, dynamic result) {
    if (result != null) {
      return _buildResultView(provider, result);
    }

    if (item == null) {
      return _buildIntroView(provider);
    }

    return _buildQuestionView(provider, item);
  }

  Widget _buildIntroView(AppProvider provider) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.accentColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.psychology_rounded,
                size: 56,
                color: AppTheme.accentColor,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Diagnostic CEFR Assessment',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Take a 6-question adaptive assessment to accurately diagnose your Common European Framework of Reference (CEFR) English level (A1 to C2).',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: LevelBadge(level: lvl, fontSize: 11),
                );
              }).toList(),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: provider.isLoading ? null : () => provider.startAssessment(),
              icon: provider.isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.play_arrow_rounded),
              label: Text(provider.isLoading ? 'Preparing Test...' : 'Start Placement Test'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuestionView(AppProvider provider, dynamic item) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Question ${item.itemNumber} of ${item.totalItems}',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: Color(0xFF334155),
              ),
            ),
            LevelBadge(level: item.targetLevel),
          ],
        ),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: item.itemNumber / item.totalItems,
            backgroundColor: const Color(0xFFE2E8F0),
            valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
            minHeight: 8,
          ),
        ),
        const SizedBox(height: 24),

        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Prompt:',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  item.promptText,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Your Answer:',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _answerController,
                  maxLines: 5,
                  decoration: const InputDecoration(
                    hintText: 'Answer in full sentences to demonstrate your range...',
                  ),
                ),
                const SizedBox(height: 20),
                Align(
                  alignment: Alignment.centerRight,
                  child: ElevatedButton.icon(
                    onPressed: provider.isLoading ? null : () => _submit(provider),
                    icon: provider.isLoading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.arrow_forward_rounded),
                    label: Text(provider.isLoading ? 'Submitting...' : 'Next Question'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _submit(AppProvider provider) async {
    final text = _answerController.text.trim();
    if (text.isEmpty) return;
    final success = await provider.submitAssessmentAnswer(text);
    if (success) {
      _answerController.clear();
    }
  }

  Widget _buildResultView(AppProvider provider, dynamic result) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          children: [
            const Text(
              '🎉 Assessment Complete!',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.getLevelColor(result.assessedLevel).withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Text(
                result.assessedLevel,
                style: TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.getLevelColor(result.assessedLevel),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Assessed CEFR Level: ${result.assessedLevel}',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF334155),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Overall Score: ${result.overallScore.toStringAsFixed(1)} / 100',
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Text(
                result.studyPlanSummary,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF475569),
                  height: 1.5,
                ),
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: widget.onFinish,
              icon: const Icon(Icons.home_rounded),
              label: const Text('Back to Home Dashboard'),
            ),
          ],
        ),
      ),
    );
  }
}

