import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/app_provider.dart';
import '../widgets/level_badge.dart';
import '../services/tts_service.dart';
import '../services/stt_service.dart';
import '../widgets/english_answer_formatter.dart';
import '../widgets/assessment_level_selector.dart';

class AssessmentScreen extends StatefulWidget {
  final VoidCallback onFinish;

  const AssessmentScreen({super.key, required this.onFinish});

  @override
  State<AssessmentScreen> createState() => _AssessmentScreenState();
}

class _AssessmentScreenState extends State<AssessmentScreen>
    with TickerProviderStateMixin {
  final _answerController = TextEditingController();
  final TtsService _tts = TtsService();
  final SttService _stt = SttService();

  bool _isTtsSpeaking = false;
  bool _isSttListening = false;
  String _liveTranscript = '';
  double _soundLevel = 0.0;
  bool _showTextInput = false;

  late AnimationController _micPulseController;
  late AnimationController _speakerPulseController;

  @override
  void initState() {
    super.initState();

    _micPulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _speakerPulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _initAudioServices();
  }

  Future<void> _initAudioServices() async {
    await _tts.initialize();
    _tts.onStart = () {
      if (mounted) setState(() => _isTtsSpeaking = true);
      _speakerPulseController.repeat(reverse: true);
    };
    _tts.onComplete = () {
      if (mounted) setState(() => _isTtsSpeaking = false);
      _speakerPulseController.stop();
      _speakerPulseController.reset();
    };
    _tts.onError = () {
      if (mounted) setState(() => _isTtsSpeaking = false);
      _speakerPulseController.stop();
    };

    await _stt.initialize();
    _stt.onResult = (text) {
      if (mounted) {
        setState(() => _liveTranscript = text);
        _answerController.text = text;
      }
    };
    _stt.onSoundLevel = (level) {
      if (mounted) setState(() => _soundLevel = level);
    };
    _stt.onListeningStarted = () {
      if (mounted) {
        setState(() => _isSttListening = true);
        _micPulseController.repeat(reverse: true);
      }
    };
    _stt.onListeningStopped = () {
      if (mounted) {
        setState(() => _isSttListening = false);
        _micPulseController.stop();
        _micPulseController.reset();
      }
    };
    _stt.onError = (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('🎤 Microphone error: $error'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    };
  }

  @override
  void dispose() {
    _answerController.dispose();
    _tts.dispose();
    _stt.dispose();
    _micPulseController.dispose();
    _speakerPulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final item = provider.currentAssessmentItem;
    final result = provider.lastAssessmentResult;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                  'تحديد المستوى',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                ),
                if (item != null) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      item.targetLevel,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            const Text(
              'CEFR Placement Test • Adaptive',
              style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
            ),
          ],
        ),
        actions: [
          if (item != null && result == null)
            Container(
              margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${item.itemNumber}/${item.totalItems}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryColor,
                  fontSize: 13,
                ),
              ),
            ),
        ],
        bottom: item != null && result == null
            ? PreferredSize(
                preferredSize: const Size.fromHeight(4),
                child: TweenAnimationBuilder<double>(
                  duration: const Duration(milliseconds: 400),
                  curve: Curves.easeInOut,
                  tween: Tween<double>(
                    begin: 0,
                    end: (item.itemNumber) / (item.totalItems <= 0 ? 6.0 : item.totalItems.toDouble()),
                  ),
                  builder: (context, value, _) {
                    return LinearProgressIndicator(
                      value: value,
                      backgroundColor: const Color(0xFFE2E8F0),
                      valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                      minHeight: 4,
                    );
                  },
                ),
              )
            : null,
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
                color: AppTheme.accentColor.withValues(alpha: 0.1),
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
              'Take a 6-question adaptive diagnostic of your English responses (grammar, vocabulary, coherence, and relevance). If you use the microphone, only the transcript is evaluated; pronunciation and listening are not scored in this test.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
                height: 1.5,
              ),
            ),
            const SizedBox(height: 20),
            // Audio badges
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildBadge(Icons.volume_up, 'Hear the Prompt'),
                _buildBadge(Icons.mic, 'Voice or Text Answer'),
                _buildBadge(Icons.auto_awesome, 'Instant Diagnosis'),
              ],
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
              onPressed: provider.isLoading
                  ? null
                  : () async {
                      final success = await provider.startAssessment();
                      if (!success && mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              provider.errorMessage ??
                                  'Failed to start placement test. Check your connection.',
                            ),
                            backgroundColor: AppTheme.errorColor,
                          ),
                        );
                      }
                    },
              icon: provider.isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.play_arrow_rounded),
              label: Text(
                provider.isLoading
                    ? 'Preparing Test...'
                    : 'Start Placement Test',
              ),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 16,
                ),
              ),
            ),
            const SizedBox(height: 28),
            const Row(
              children: [
                Expanded(child: Divider()),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Text('OR', style: TextStyle(color: Color(0xFF64748B))),
                ),
                Expanded(child: Divider()),
              ],
            ),
            const SizedBox(height: 24),
            AssessmentLevelSelector(
              initialLevel: provider.profile?.currentLevel ?? 'A1',
              isLoading: provider.isLoading,
              onConfirm: (level) async {
                final success = await provider.selectStartingLevel(level);
                if (!mounted) return;
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Starting level set to $level.')),
                  );
                  widget.onFinish();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        provider.errorMessage ?? 'Could not save the level.',
                      ),
                      backgroundColor: AppTheme.errorColor,
                    ),
                  );
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadge(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.accentColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: AppTheme.accentColor),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppTheme.accentColor,
            ),
          ),
        ],
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
            const Text(
              'Adaptive difficulty',
              style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: item.itemNumber / item.totalItems,
            backgroundColor: const Color(0xFFE2E8F0),
            valueColor: const AlwaysStoppedAnimation<Color>(
              AppTheme.primaryColor,
            ),
            minHeight: 8,
          ),
        ),
        const SizedBox(height: 24),

        // Prompt Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Prompt:',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    Row(
                      children: [
                        IconButton(
                          tooltip: 'Listen to prompt',
                          icon: Icon(
                            _isTtsSpeaking
                                ? Icons.stop_circle_rounded
                                : Icons.volume_up_rounded,
                            color: AppTheme.primaryColor,
                            size: 22,
                          ),
                          onPressed: () {
                            if (_isTtsSpeaking) {
                              _tts.stop();
                            } else {
                              _tts.speak(item.promptText);
                            }
                          },
                        ),
                        IconButton(
                          tooltip: 'Listen slowly',
                          icon: const Icon(
                            Icons.slow_motion_video_rounded,
                            color: AppTheme.primaryColor,
                            size: 20,
                          ),
                          onPressed: () {
                            _tts.speakAtSpeed(item.promptText, 0.25);
                          },
                        ),
                      ],
                    ),
                  ],
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

                // Answer Section
                Row(
                  children: [
                    const Text(
                      'Your Answer:',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    const Spacer(),
                    SegmentedButton<bool>(
                      segments: const [
                        ButtonSegment<bool>(
                          value: false,
                          icon: Icon(Icons.mic, size: 16),
                          label: Text('Speak', style: TextStyle(fontSize: 12)),
                        ),
                        ButtonSegment<bool>(
                          value: true,
                          icon: Icon(Icons.keyboard, size: 16),
                          label: Text('Type', style: TextStyle(fontSize: 12)),
                        ),
                      ],
                      selected: {_showTextInput},
                      onSelectionChanged: (value) {
                        setState(() => _showTextInput = value.first);
                        if (!value.first) _tts.stop();
                      },
                      style: ButtonStyle(
                        visualDensity: VisualDensity.compact,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                if (!_showTextInput) ...[
                  // Voice Recording UI
                  _buildVoiceInput(),
                ] else ...[
                  // Text Field
                  TextField(
                    controller: _answerController,
                    maxLines: 5,
                    inputFormatters: [englishAnswerFormatter],
                    decoration: const InputDecoration(
                      hintText: 'Answer in English using full sentences...',
                      helperText:
                          'English letters only. Arabic letters are not accepted.',
                    ),
                  ),
                ],

                const SizedBox(height: 20),
                Align(
                  alignment: Alignment.centerRight,
                  child: ElevatedButton.icon(
                    onPressed: provider.isLoading
                        ? null
                        : () => _submit(provider),
                    icon: provider.isLoading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.arrow_forward_rounded),
                    label: Text(
                      provider.isLoading ? 'Submitting...' : 'Next Question',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildVoiceInput() {
    return Column(
      children: [
        if (_liveTranscript.isNotEmpty || _isSttListening) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _isSttListening
                    ? AppTheme.primaryColor.withValues(alpha: 0.5)
                    : const Color(0xFFE2E8F0),
                width: _isSttListening ? 2 : 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (_isSttListening) ...[
                      _buildSoundLevelIndicator(),
                      const SizedBox(width: 8),
                      const Text(
                        'Listening...',
                        style: TextStyle(
                          color: AppTheme.primaryColor,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ] else ...[
                      const Icon(
                        Icons.record_voice_over,
                        size: 14,
                        color: Color(0xFF94A3B8),
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'Your spoken response:',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  _liveTranscript.isEmpty
                      ? 'Speak your answer clearly...'
                      : _liveTranscript,
                  style: TextStyle(
                    fontSize: 15,
                    color: _liveTranscript.isEmpty
                        ? const Color(0xFFCBD5E1)
                        : const Color(0xFF0F172A),
                    fontWeight: FontWeight.w500,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Mic Button
        AnimatedBuilder(
          animation: _micPulseController,
          builder: (context, child) {
            final scale = _isSttListening
                ? 1.0 + (_micPulseController.value * 0.1)
                : 1.0;
            return Transform.scale(
              scale: scale,
              child: GestureDetector(
                onTap: () => _toggleMicrophone(),
                child: Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _isSttListening
                        ? AppTheme.errorColor
                        : AppTheme.primaryColor,
                    boxShadow: [
                      BoxShadow(
                        color:
                            (_isSttListening
                                    ? AppTheme.errorColor
                                    : AppTheme.primaryColor)
                                .withValues(alpha: 0.3),
                        blurRadius: _isSttListening ? 18 : 8,
                      ),
                    ],
                  ),
                  child: Icon(
                    _isSttListening ? Icons.stop_rounded : Icons.mic_rounded,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 8),
        Text(
          _isSttListening
              ? 'Tap to stop recording'
              : 'Tap to speak your response',
          style: const TextStyle(
            color: Color(0xFF64748B),
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildSoundLevelIndicator() {
    final normalized = ((_soundLevel + 2) / 12).clamp(0.0, 1.0);
    return SizedBox(
      width: 36,
      height: 12,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: List.generate(4, (i) {
          final threshold = (i + 1) / 4;
          return Container(
            width: 3.5,
            height: normalized >= threshold ? 12 : 5,
            decoration: BoxDecoration(
              color: normalized >= threshold
                  ? AppTheme.primaryColor
                  : const Color(0xFFCBD5E1),
              borderRadius: BorderRadius.circular(2),
            ),
          );
        }),
      ),
    );
  }

  Future<void> _toggleMicrophone() async {
    if (_isTtsSpeaking) await _tts.stop();

    if (_isSttListening) {
      final transcript = await _stt.stopListening();
      setState(() {
        _liveTranscript = transcript;
        _answerController.text = transcript;
      });
    } else {
      setState(() {
        _liveTranscript = '';
        _answerController.clear();
      });

      final started = await _stt.startListening();
      if (!started && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_stt.lastError ?? 'Could not access microphone.'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  void _submit(AppProvider provider) async {
    final text = _answerController.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('يرجى التحدث أو كتابة إجابتك بالإنجليزية أولاً (Please speak or type your answer).'),
          backgroundColor: AppTheme.warningColor,
        ),
      );
      return;
    }
    _tts.stop();
    HapticFeedback.lightImpact();
    final success = await provider.submitAssessmentAnswer(text);
    if (success) {
      _answerController.clear();
      setState(() => _liveTranscript = '');

      if (provider.lastAssessmentResult != null) {
        HapticFeedback.heavyImpact();
        _tts.speak("Congratulations! Your assessment is complete.");
      } else {
        HapticFeedback.mediumImpact();
      }
    } else if (mounted && provider.errorMessage != null) {
      HapticFeedback.vibrate();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.errorMessage!),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  Widget _buildResultView(AppProvider provider, dynamic result) {
    final levelColor = AppTheme.getLevelColor(result.assessedLevel);
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: levelColor.withValues(alpha: 0.3), width: 1.5),
      ),
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          children: [
            const Text(
              '🎉 تهانينا! اكتمل اختبار تحديد المستوى',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'CEFR Placement Test Completed',
              style: TextStyle(
                fontSize: 13,
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 16),
            const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('⭐ ⭐ ⭐', style: TextStyle(fontSize: 22)),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(26),
              decoration: BoxDecoration(
                color: levelColor.withValues(alpha: 0.12),
                shape: BoxShape.circle,
                border: Border.all(color: levelColor.withValues(alpha: 0.3), width: 2),
              ),
              child: Text(
                result.assessedLevel,
                style: TextStyle(
                  fontSize: 52,
                  fontWeight: FontWeight.w900,
                  color: levelColor,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'المستوى التقديري: Level ${result.assessedLevel}',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'هذه نتيجة تشخيصية أولية وليست شهادة CEFR رسمية. الاختبار الحالي يقيس الإجابات النصية ولا يمنح درجة مستقلة للنطق أو الاستماع.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFF64748B),
                height: 1.5,
              ),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'الدرجة الكلية (Overall Score): ${result.overallScore.toStringAsFixed(1)} / 100',
                style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF475569),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Study Plan Container
            Container(
              padding: const EdgeInsets.all(18),
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.auto_stories_rounded, color: AppTheme.primaryColor, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'الخطة التعليمية المقترحة لمستواك:',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    result.studyPlanSummary,
                    style: const TextStyle(
                      fontSize: 13.5,
                      color: Color(0xFF334155),
                      height: 1.6,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  _tts.stop();
                  widget.onFinish();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.rocket_launch_rounded, size: 20),
                label: const Text(
                  'ابدأ التدريب اليومي الآن 🚀 (Start Practice)',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
