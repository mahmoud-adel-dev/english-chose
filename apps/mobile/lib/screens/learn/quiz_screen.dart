import 'dart:async';
import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../models/learn.dart';

class QuizScreen extends StatefulWidget {
  final QuizModel quiz;

  const QuizScreen({super.key, required this.quiz});

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  int _currentIndex = 0;
  final Map<int, int> _userAnswers = {}; // questionIndex -> selectedOptionIndex
  bool _showExplanation = false;
  bool _quizFinished = false;

  Timer? _timer;
  int _elapsedSeconds = 0;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      setState(() {
        _elapsedSeconds++;
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatTime(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  void _selectOption(int optionIndex) {
    if (_showExplanation) return;
    setState(() {
      _userAnswers[_currentIndex] = optionIndex;
      _showExplanation = true;
    });
  }

  void _nextQuestion() {
    if (_currentIndex < widget.quiz.questions.length - 1) {
      setState(() {
        _currentIndex++;
        _showExplanation = _userAnswers.containsKey(_currentIndex);
      });
    } else {
      _finishQuiz();
    }
  }

  void _previousQuestion() {
    if (_currentIndex > 0) {
      setState(() {
        _currentIndex--;
        _showExplanation = _userAnswers.containsKey(_currentIndex);
      });
    }
  }

  void _finishQuiz() {
    _timer?.cancel();
    setState(() {
      _quizFinished = true;
    });
  }

  int get _correctCount {
    int count = 0;
    for (int i = 0; i < widget.quiz.questions.length; i++) {
      if (_userAnswers[i] == widget.quiz.questions[i].correctIndex) {
        count++;
      }
    }
    return count;
  }

  @override
  Widget build(BuildContext context) {
    if (_quizFinished) {
      return _buildResultsScreen();
    }

    final question = widget.quiz.questions[_currentIndex];
    final totalQuestions = widget.quiz.questions.length;
    final selectedOption = _userAnswers[_currentIndex];
    final progress = (_currentIndex + 1) / totalQuestions;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Live Exam (${_currentIndex + 1}/$totalQuestions)',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: const Color(0xFF1E293B),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFEEF2F6),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.timer_outlined, size: 16, color: Color(0xFF475569)),
                const SizedBox(width: 4),
                Text(
                  _formatTime(_elapsedSeconds),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: Color(0xFF1E293B),
                  ),
                ),
              ],
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: const Color(0xFFE2E8F0),
            valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
          ),
          child: Row(
            children: [
              if (_currentIndex > 0) ...[
                Expanded(
                  child: OutlinedButton(
                    onPressed: _previousQuestion,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Previous'),
                  ),
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: ElevatedButton(
                  onPressed: selectedOption != null ? _nextQuestion : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: Text(
                    _currentIndex == totalQuestions - 1 ? 'Finish Exam' : 'Next Question',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 900),
            child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Question Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'QUESTION ${_currentIndex + 1} OF $totalQuestions',
                        style: const TextStyle(
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          letterSpacing: 0.5,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          question.level,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF475569),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    question.prompt,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0F172A),
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 4 Option Choices
            ...List.generate(question.options.length, (optIdx) {
              final optionText = question.options[optIdx];
              final isSelected = selectedOption == optIdx;
              final isCorrect = question.correctIndex == optIdx;

              Color borderColor = const Color(0xFFE2E8F0);
              Color bgColor = Colors.white;
              Color textColor = const Color(0xFF1E293B);
              IconData? icon;

              if (_showExplanation) {
                if (isCorrect) {
                  borderColor = Colors.green;
                  bgColor = const Color(0xFFF0FDF4);
                  textColor = const Color(0xFF166534);
                  icon = Icons.check_circle;
                } else if (isSelected) {
                  borderColor = Colors.red;
                  bgColor = const Color(0xFFFEF2F2);
                  textColor = const Color(0xFF991B1B);
                  icon = Icons.cancel;
                }
              } else if (isSelected) {
                borderColor = AppTheme.primaryColor;
                bgColor = AppTheme.primaryColor.withValues(alpha: 0.05);
              }

              final letters = ['A', 'B', 'C', 'D'];

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                child: InkWell(
                  onTap: () => _selectOption(optIdx),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: bgColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderColor, width: isSelected || (_showExplanation && isCorrect) ? 2 : 1),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: isSelected
                                ? (_showExplanation
                                    ? (isCorrect ? Colors.green : Colors.red)
                                    : AppTheme.primaryColor)
                                : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            letters[optIdx],
                            style: TextStyle(
                              color: isSelected ? Colors.white : const Color(0xFF475569),
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            optionText,
                            style: TextStyle(
                              fontSize: 15,
                              color: textColor,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                            ),
                          ),
                        ),
                        if (icon != null) ...[
                          const SizedBox(width: 8),
                          Icon(icon, color: isCorrect ? Colors.green : Colors.red, size: 20),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            }),

            if (_showExplanation) ...[
              const SizedBox(height: 12),
              _buildArabicGrammarCoach(question),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFBBF7D0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.lightbulb_outline, color: Color(0xFF15803D), size: 18),
                        SizedBox(width: 6),
                        Text(
                          'English Explanation / التوضيح الإنجليزي',
                          style: TextStyle(
                            color: Color(0xFF15803D),
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      question.explanation,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF166534),
                        height: 1.45,
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
      ),
    );
  }

  Widget _buildArabicGrammarCoach(QuizQuestionModel question) {
    final examples = question.grammarExamples;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFF5F3FF), Color(0xFFEFF6FF)],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFDDD6FE)),
      ),
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(9),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(11),
                  ),
                  child: const Icon(Icons.auto_stories_rounded, color: AppTheme.primaryColor),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    question.grammarTitleArabic,
                    style: const TextStyle(
                      color: Color(0xFF312E81),
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const Text('شرح فوري', style: TextStyle(color: Color(0xFF6366F1), fontSize: 11, fontWeight: FontWeight.w700)),
              ],
            ),
            const SizedBox(height: 13),
            Text(
              question.explanationArabic.isNotEmpty
                  ? question.explanationArabic
                  : 'راجع الفاعل والزمن وتركيب الجملة. بعد الأفعال المساعدة مثل do وdoes وdid نستخدم الفعل في المصدر، أما التصريف الثالث فيأتي في الأزمنة التامة والمبني للمجهول.',
              textAlign: TextAlign.right,
              style: const TextStyle(fontSize: 14, height: 1.75, color: Color(0xFF334155)),
            ),
            if (question.verbFormsArabic.isNotEmpty) ...[
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.85),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('تصريفات مهمة', style: TextStyle(fontSize: 12, color: Color(0xFF6366F1), fontWeight: FontWeight.w800)),
                    const SizedBox(height: 6),
                    Directionality(
                      textDirection: TextDirection.ltr,
                      child: SelectableText(
                        question.verbFormsArabic,
                        textAlign: TextAlign.left,
                        style: const TextStyle(fontSize: 13, height: 1.55, color: Color(0xFF1E293B), fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (examples.isNotEmpty) ...[
              const SizedBox(height: 14),
              const Text('أمثلة تطبيقية', style: TextStyle(fontSize: 12, color: Color(0xFF6366F1), fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              ...examples.map((example) => Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(11),
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.82), borderRadius: BorderRadius.circular(11)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Directionality(
                      textDirection: TextDirection.ltr,
                      child: Text(example.english, textAlign: TextAlign.left, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
                    ),
                    const SizedBox(height: 4),
                    Text(example.arabic, textAlign: TextAlign.right, style: const TextStyle(fontSize: 12, height: 1.55, color: Color(0xFF64748B))),
                  ],
                ),
              )),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildResultsScreen() {
    final total = widget.quiz.questions.length;
    final correct = _correctCount;
    final percentage = (correct / total * 100).round();

    Color scoreColor = Colors.green;
    String gradeTitle = 'Mastery Achieved! 🎉';
    String gradeArabic = 'أداء متميز واستيعاب تام للقواعد';

    if (percentage < 60) {
      scoreColor = Colors.orange;
      gradeTitle = 'Keep Practicing! 💪';
      gradeArabic = 'تحتاج إلى مراجعة بعض النقاط والقواعد';
    } else if (percentage < 85) {
      scoreColor = AppTheme.primaryColor;
      gradeTitle = 'Great Job! 👏';
      gradeArabic = 'مستوى جيد جداً وقريب من الإتقان التام';
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Exam Summary & Review', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: const Color(0xFF1E293B),
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 900),
            child: Column(
              children: [
            // Score Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: scoreColor.withValues(alpha: 0.1),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '$percentage%',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: scoreColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    gradeTitle,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    gradeArabic,
                    style: const TextStyle(fontSize: 14, color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildSummaryStat('Correct', '$correct / $total', Colors.green),
                      const SizedBox(width: 24),
                      _buildSummaryStat('Incorrect', '${total - correct}', Colors.red),
                      const SizedBox(width: 24),
                      _buildSummaryStat('Time', _formatTime(_elapsedSeconds), const Color(0xFF1E293B)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Back to Hub'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _currentIndex = 0;
                        _userAnswers.clear();
                        _showExplanation = false;
                        _quizFinished = false;
                        _elapsedSeconds = 0;
                      });
                      _startTimer();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Retake Test'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Full 50-Question Review Header
            const Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Complete 50-Question Review',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 12),

            // All 50 Questions Detailed Review
            ...List.generate(total, (qIdx) {
              final q = widget.quiz.questions[qIdx];
              final userChoice = _userAnswers[qIdx];
              final isCorrect = userChoice == q.correctIndex;

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isCorrect ? const Color(0xFFBBF7D0) : const Color(0xFFFECACA),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          isCorrect ? Icons.check_circle : Icons.cancel,
                          color: isCorrect ? Colors.green : Colors.red,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Q${qIdx + 1}: ${q.prompt}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (userChoice != null && !isCorrect)
                      Text(
                        'Your Answer: ${q.options[userChoice]}',
                        style: const TextStyle(color: Colors.red, fontSize: 13),
                      ),
                    Text(
                      'Correct Answer: ${q.options[q.correctIndex]}',
                      style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      q.explanation,
                      style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                    ),
                    if (q.explanationArabic.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Directionality(
                        textDirection: TextDirection.rtl,
                        child: Text(
                          q.explanationArabic,
                          textAlign: TextAlign.right,
                          style: const TextStyle(color: Color(0xFF334155), fontSize: 12, height: 1.6),
                        ),
                      ),
                    ],
                    if (q.verbFormsArabic.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Directionality(
                        textDirection: TextDirection.ltr,
                        child: Text(
                          q.verbFormsArabic,
                          style: const TextStyle(color: AppTheme.primaryColor, fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ],
                ),
              );
            }),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
        ),
      ],
    );
  }
}
