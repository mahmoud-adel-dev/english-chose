import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../widgets/english_answer_formatter.dart';
import '../widgets/savable_text.dart';
import '../widgets/save_word_dialog.dart';
import '../widgets/quota_limit_notice.dart';
import '../models/session.dart';
import '../providers/app_provider.dart';
import '../services/session_progress_store.dart';
import '../services/session_resume_policy.dart';
import '../services/tts_service.dart';
import '../services/stt_service.dart';
import 'logs_screen.dart';

class SessionScreen extends StatefulWidget {
  const SessionScreen({super.key});

  @override
  State<SessionScreen> createState() => _SessionScreenState();
}

class _SessionScreenState extends State<SessionScreen>
    with TickerProviderStateMixin {
  final _answerController = TextEditingController();
  final TtsService _tts = TtsService();
  final SttService _stt = SttService();
  final SessionProgressStore _progressStore = SessionProgressStore();

  int _currentQuestionIndex = 0;
  bool _isTtsSpeaking = false;
  bool _isRestoringDraft = false;

  Future<void> _saveSelectedWord(String word, String sourceText) async {
    await showSaveWordDialog(
      context,
      initialWord: word,
      exampleSentence: sourceText,
    );
  }

  bool _isSttListening = false;
  String _liveTranscript = '';
  double _soundLevel = 0.0;
  bool _showTextInput = false; // Toggle between mic and keyboard
  bool _autoPlayTts = true;
  String? _activeSupportAction; // 'TRANSLATE' | 'EXPLAIN' | 'MODEL_ANSWER'

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
    _answerController.addListener(_persistCurrentDraft);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _restoreSessionProgress();
    });
  }

  Future<void> _restoreSessionProgress() async {
    final provider = context.read<AppProvider>();
    await Future.wait([provider.fetchCurrentSession(), provider.fetchQuota()]);
    if (!mounted) return;

    final session = provider.currentSession;
    if (session == null || session.questions.isEmpty) return;

    final resumeIndex = findResumeQuestionIndex(
      session.questions.map((question) => question.attemptsUsed).toList(),
    );
    await _showQuestion(session, resumeIndex);
  }

  Future<void> _showQuestion(DailySessionModel session, int index) async {
    if (index < 0 || index >= session.questions.length) return;

    final question = session.questions[index];
    final draft = await _progressStore.loadDraft(session.id, question.id) ?? '';
    if (!mounted) return;

    _isRestoringDraft = true;
    setState(() {
      _currentQuestionIndex = index;
      _activeSupportAction = null;
      _liveTranscript = draft;
      _answerController.text = draft;
      _answerController.selection = TextSelection.collapsed(
        offset: draft.length,
      );
    });
    _isRestoringDraft = false;
  }

  void _persistCurrentDraft() {
    if (_isRestoringDraft || !mounted) return;

    final session = context.read<AppProvider>().currentSession;
    if (session == null ||
        _currentQuestionIndex < 0 ||
        _currentQuestionIndex >= session.questions.length) {
      return;
    }

    final question = session.questions[_currentQuestionIndex];
    unawaited(
      _progressStore.saveDraft(session.id, question.id, _answerController.text),
    );
  }

  Future<void> _initAudioServices() async {
    // Initialize TTS
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

    // Initialize STT
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
    _answerController.removeListener(_persistCurrentDraft);
    _answerController.dispose();
    _tts.dispose();
    _stt.dispose();
    _micPulseController.dispose();
    _speakerPulseController.dispose();
    super.dispose();
  }

  String _formatQuestionType(String type) {
    switch (type) {
      case 'OPEN_SPEECH':
        return '🎤 Open Speech';
      case 'SENTENCE_REPETITION':
        return '🔁 Repeat After Me';
      case 'READING_ALOUD':
        return '📖 Read Aloud';
      case 'PICTURE_DESCRIPTION':
        return '🖼️ Describe';
      case 'CONVERSATION_PROMPT':
        return '💬 Conversation';
      case 'GRAMMAR_REPAIR':
        return '🔧 Fix the Grammar';
      default:
        return '✍️ Exercise';
    }
  }

  String _getQuestionInstruction(String type) {
    switch (type) {
      case 'OPEN_SPEECH':
        return 'Listen to the question, then speak your answer clearly.';
      case 'SENTENCE_REPETITION':
        return 'Listen carefully, then repeat the sentence exactly.';
      case 'READING_ALOUD':
        return 'Read the text aloud with clear pronunciation.';
      case 'PICTURE_DESCRIPTION':
        return 'Describe what you see using complete sentences.';
      case 'CONVERSATION_PROMPT':
        return 'Listen and respond naturally as in a conversation.';
      case 'GRAMMAR_REPAIR':
        return 'Find and fix the grammar mistake in the sentence.';
      default:
        return 'Answer the question below.';
    }
  }

  bool _isAudioQuestion(String type) {
    return type != 'GRAMMAR_REPAIR';
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
              padding: const EdgeInsets.only(right: 8),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Q ${_currentQuestionIndex + 1} / ${session.questions.length}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ),
          if (provider.isAdmin)
            IconButton(
              tooltip: 'Diagnostic Logs',
              icon: const Icon(Icons.receipt_long_rounded),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => LocalLogsScreen(isAdmin: provider.isAdmin),
                  ),
                );
              },
            ),
          // Auto-play TTS toggle
          IconButton(
            tooltip: _autoPlayTts ? 'Auto-read ON' : 'Auto-read OFF',
            icon: Icon(
              _autoPlayTts ? Icons.volume_up_rounded : Icons.volume_off_rounded,
              color: _autoPlayTts
                  ? AppTheme.primaryColor
                  : const Color(0xFF94A3B8),
            ),
            onPressed: () {
              setState(() => _autoPlayTts = !_autoPlayTts);
            },
          ),
          const SizedBox(width: 4),
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
    // Show completed session summary view if available
    if (provider.lastSessionSummary != null) {
      return _buildSessionCompletedView(provider, provider.lastSessionSummary!);
    }

    // Show error if any
    if (provider.errorMessage != null && session == null) {
      return _buildErrorState(provider);
    }

    if (provider.isLoading && session == null) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(40),
          child: Column(
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text(
                'Generating your personalized exercises...',
                style: TextStyle(color: Color(0xFF64748B), fontSize: 14),
              ),
            ],
          ),
        ),
      );
    }

    if (session == null || session.status != 'ACTIVE') {
      return _buildNoActiveSession(provider);
    }

    if (session.questions.isEmpty) {
      return _buildNoActiveSession(provider);
    }

    final question =
        session.questions[_currentQuestionIndex.clamp(
          0,
          session.questions.length - 1,
        )];

    // Auto-play TTS when question changes
    if (_autoPlayTts && !_isTtsSpeaking && !_isSttListening) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _speakQuestion(question);
      });
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Progress Bar
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: (_currentQuestionIndex + 1) / session.questions.length,
            backgroundColor: const Color(0xFFE2E8F0),
            valueColor: const AlwaysStoppedAnimation<Color>(
              AppTheme.primaryColor,
            ),
            minHeight: 8,
          ),
        ),
        const SizedBox(height: 24),

        // Question Card with Audio & Learning Support
        _buildQuestionCard(question, session, provider),
        const SizedBox(height: 20),

        // Audio Input Section
        _buildAudioInputSection(provider, question),

        // Latest AI Evaluation Result Display
        if (provider.lastEvaluation != null) ...[
          const SizedBox(height: 20),
          _buildEvaluationFeedback(provider, session),
        ],
      ],
    );
  }

  Widget _buildQuestionCard(
    SessionQuestionModel question,
    DailySessionModel session,
    AppProvider provider,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Question type + difficulty row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.08),
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
            const SizedBox(height: 12),

            // Instruction text
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.accentColor.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    _isAudioQuestion(question.questionType)
                        ? Icons.headset_mic_rounded
                        : Icons.edit_rounded,
                    size: 16,
                    color: AppTheme.accentColor,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _getQuestionInstruction(question.questionType),
                      style: TextStyle(
                        color: AppTheme.accentColor.withValues(alpha: 0.9),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Question text
            SavableText(
              question.promptText,
              onSaveWord: (word) =>
                  _saveSelectedWord(word, question.promptText),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0F172A),
                height: 1.4,
              ),
            ),

            // Context hint
            if (question.contextHint != null &&
                question.contextHint!.isNotEmpty) ...[
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
                    const Icon(
                      Icons.lightbulb_outline,
                      size: 18,
                      color: AppTheme.warningColor,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: SavableText(
                        'Hint: ${question.contextHint}',
                        onSaveWord: (word) =>
                            _saveSelectedWord(word, question.contextHint!),
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

            const SizedBox(height: 16),

            // 🔊 Listen Button Row
            Row(
              children: [
                // Play normal speed
                _buildTtsButton(
                  icon: _isTtsSpeaking
                      ? Icons.stop_circle_rounded
                      : Icons.volume_up_rounded,
                  label: _isTtsSpeaking ? 'Stop' : 'Listen',
                  onPressed: () {
                    if (_isTtsSpeaking) {
                      _tts.stop();
                    } else {
                      _speakQuestion(question);
                    }
                  },
                  isActive: _isTtsSpeaking,
                ),
                const SizedBox(width: 8),
                // Play slow speed
                _buildTtsButton(
                  icon: Icons.slow_motion_video_rounded,
                  label: 'Slow',
                  onPressed: () {
                    _tts.speakAtSpeed(question.promptText, 0.25);
                  },
                  isActive: false,
                ),
              ],
            ),

            // On-demand Learning Support (Translate, Explain, Model Answer)
            _buildLearningSupportSection(provider, session, question),
          ],
        ),
      ),
    );
  }

  Widget _buildLearningSupportSection(
    AppProvider provider,
    DailySessionModel session,
    SessionQuestionModel question,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 16),
        const Divider(height: 1, color: Color(0xFFE2E8F0)),
        const SizedBox(height: 12),
        Row(
          children: [
            const Icon(
              Icons.school_rounded,
              size: 16,
              color: AppTheme.primaryColor,
            ),
            const SizedBox(width: 6),
            const Text(
              'Learning Support:',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 12,
                color: Color(0xFF64748B),
              ),
            ),
            const Spacer(),
            if (provider.learningSupportContent != null)
              GestureDetector(
                onTap: () {
                  setState(() => _activeSupportAction = null);
                  provider.clearLearningSupport();
                },
                child: const Row(
                  children: [
                    Icon(
                      Icons.close_rounded,
                      size: 14,
                      color: Color(0xFF94A3B8),
                    ),
                    SizedBox(width: 2),
                    Text(
                      'Dismiss',
                      style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _buildSupportChip(
              action: 'TRANSLATE',
              label: 'Translate',
              icon: Icons.g_translate_rounded,
              provider: provider,
              session: session,
              question: question,
            ),
            _buildSupportChip(
              action: 'EXPLAIN',
              label: 'Explain',
              icon: Icons.psychology_outlined,
              provider: provider,
              session: session,
              question: question,
            ),
            _buildSupportChip(
              action: 'MODEL_ANSWER',
              label: 'Model Answer',
              icon: Icons.lightbulb_outline_rounded,
              provider: provider,
              session: session,
              question: question,
            ),
          ],
        ),
        if (provider.isLoading && _activeSupportAction != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                const SizedBox(width: 10),
                Text(
                  _activeSupportAction == 'TRANSLATE'
                      ? 'Translating question...'
                      : (_activeSupportAction == 'EXPLAIN'
                            ? 'Generating explanation...'
                            : 'Writing model answer...'),
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
        ] else if (provider.learningSupportContent != null &&
            _activeSupportAction != null) ...[
          const SizedBox(height: 12),
          _buildSupportContentCard(provider, _activeSupportAction!),
        ],
      ],
    );
  }

  Widget _buildSupportContentCard(AppProvider provider, String action) {
    final isModelAnswer = action == 'MODEL_ANSWER';
    final isTranslate = action == 'TRANSLATE';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isModelAnswer
            ? const Color(0xFFFFFBEB)
            : const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isModelAnswer
              ? const Color(0xFFFDE68A)
              : const Color(0xFFBBF7D0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isModelAnswer
                    ? Icons.menu_book_rounded
                    : (isTranslate
                          ? Icons.translate_rounded
                          : Icons.psychology_rounded),
                size: 16,
                color: isModelAnswer
                    ? const Color(0xFFB45309)
                    : const Color(0xFF15803D),
              ),
              const SizedBox(width: 6),
              Text(
                isModelAnswer
                    ? 'Model Answer (For Reference Only)'
                    : (isTranslate
                          ? 'Arabic Translation'
                          : 'Teacher Explanation'),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                  color: isModelAnswer
                      ? const Color(0xFF92400E)
                      : const Color(0xFF166534),
                ),
              ),
              const Spacer(),
              if (isModelAnswer)
                IconButton(
                  tooltip: 'Listen to model answer',
                  icon: const Icon(Icons.volume_up_rounded, size: 18),
                  color: const Color(0xFFB45309),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: () {
                    _tts.speak(provider.learningSupportContent!);
                  },
                ),
            ],
          ),
          if (isModelAnswer) ...[
            const SizedBox(height: 4),
            const Text(
              '⚠️ Study this example, then craft and speak your own answer below.',
              style: TextStyle(
                fontSize: 11,
                fontStyle: FontStyle.italic,
                color: Color(0xFFB45309),
              ),
            ),
          ],
          const SizedBox(height: 8),
          SavableText(
            provider.learningSupportContent!,
            onSaveWord: (word) =>
                _saveSelectedWord(word, provider.learningSupportContent!),
            textDirection: isTranslate ? TextDirection.rtl : TextDirection.ltr,
            style: TextStyle(
              fontSize: 13,
              height: 1.4,
              color: isModelAnswer
                  ? const Color(0xFF78350F)
                  : const Color(0xFF14532D),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSupportChip({
    required String action,
    required String label,
    required IconData icon,
    required AppProvider provider,
    required DailySessionModel session,
    required SessionQuestionModel question,
  }) {
    final isSelected =
        _activeSupportAction == action &&
        provider.learningSupportContent != null;
    return ActionChip(
      avatar: Icon(
        icon,
        size: 14,
        color: isSelected ? Colors.white : AppTheme.primaryColor,
      ),
      label: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: isSelected ? Colors.white : const Color(0xFF334155),
        ),
      ),
      backgroundColor: isSelected
          ? AppTheme.primaryColor
          : const Color(0xFFF1F5F9),
      side: BorderSide(
        color: isSelected ? AppTheme.primaryColor : const Color(0xFFCBD5E1),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      onPressed: provider.isLoading
          ? null
          : () async {
              if (isSelected) {
                setState(() => _activeSupportAction = null);
                provider.clearLearningSupport();
                return;
              }
              setState(() => _activeSupportAction = action);
              final success = await provider.requestLearningSupport(
                action: action,
                question: question.promptText,
                level: session.targetLevel,
              );
              if (!success && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      provider.errorMessage ??
                          'Learning support is currently unavailable.',
                    ),
                    backgroundColor: AppTheme.errorColor,
                  ),
                );
              }
            },
    );
  }

  Widget _buildTtsButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
    required bool isActive,
  }) {
    return AnimatedBuilder(
      animation: _speakerPulseController,
      builder: (context, child) {
        return OutlinedButton.icon(
          onPressed: onPressed,
          icon: Icon(
            icon,
            size: 18,
            color: isActive ? Colors.white : AppTheme.primaryColor,
          ),
          label: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isActive ? Colors.white : AppTheme.primaryColor,
            ),
          ),
          style: OutlinedButton.styleFrom(
            backgroundColor: isActive
                ? AppTheme.primaryColor.withValues(
                    alpha: 0.7 + (_speakerPulseController.value * 0.3),
                  )
                : Colors.transparent,
            side: BorderSide(
              color: AppTheme.primaryColor.withValues(alpha: 0.4),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
          ),
        );
      },
    );
  }

  Widget _buildAudioInputSection(
    AppProvider provider,
    SessionQuestionModel question,
  ) {
    final isAudio = _isAudioQuestion(question.questionType);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Input mode toggle (only for audio questions)
            if (isAudio) ...[
              Row(
                children: [
                  const Text(
                    'Your Response:',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: Color(0xFF334155),
                    ),
                  ),
                  const Spacer(),
                  // Toggle mic / keyboard
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
                      if (!value.first) {
                        // Switching to mic — stop any TTS
                        _tts.stop();
                      }
                    },
                    style: ButtonStyle(
                      visualDensity: VisualDensity.compact,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ] else ...[
              const Text(
                'Your Response:',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  color: Color(0xFF334155),
                ),
              ),
              const SizedBox(height: 10),
            ],

            // Microphone Input (default for audio questions)
            if (isAudio && !_showTextInput) ...[
              _buildMicrophoneInput(provider, question),
            ] else ...[
              // Text Input (for GRAMMAR_REPAIR or manual toggle)
              _buildTextInput(provider, question),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildMicrophoneInput(
    AppProvider provider,
    SessionQuestionModel question,
  ) {
    return Column(
      children: [
        // Live transcript display
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
                        'Listening — take your time...',
                        style: TextStyle(
                          color: AppTheme.primaryColor,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ] else ...[
                      const Icon(
                        Icons.text_snippet_outlined,
                        size: 14,
                        color: Color(0xFF94A3B8),
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'Your speech:',
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
                      ? 'Start speaking...'
                      : _liveTranscript,
                  style: TextStyle(
                    fontSize: 16,
                    color: _liveTranscript.isEmpty
                        ? const Color(0xFFCBD5E1)
                        : const Color(0xFF0F172A),
                    fontWeight: FontWeight.w500,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Microphone Button
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
                  width: 80,
                  height: 80,
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
                        blurRadius: _isSttListening ? 20 : 10,
                        spreadRadius: _isSttListening ? 4 : 0,
                      ),
                    ],
                  ),
                  child: Icon(
                    _isSttListening ? Icons.stop_rounded : Icons.mic_rounded,
                    color: Colors.white,
                    size: 36,
                  ),
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 12),
        Text(
          _isSttListening
              ? 'Tap to stop • pauses up to 12 seconds • maximum 5 minutes'
              : (_liveTranscript.isEmpty
                    ? 'Tap to start speaking'
                    : 'Tap again to continue your answer'),
          style: const TextStyle(
            color: Color(0xFF64748B),
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 16),

        // Submit button (visible when there's a transcript)
        if (_liveTranscript.isNotEmpty && !_isSttListening) ...[
          Row(
            children: [
              // Re-record button
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    setState(() {
                      _liveTranscript = '';
                      _answerController.clear();
                    });
                    _toggleMicrophone();
                  },
                  icon: const Icon(Icons.refresh_rounded, size: 18),
                  label: const Text('Re-record'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: Color(0xFFCBD5E1)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Submit button
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  onPressed: provider.isLoading
                      ? null
                      : () => _submit(provider, question.id),
                  icon: provider.isLoading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.send_rounded),
                  label: Text(
                    provider.isLoading ? 'Evaluating...' : 'Submit Answer',
                  ),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildSoundLevelIndicator() {
    // Normalize sound level (usually -2 to 10)
    final normalized = ((_soundLevel + 2) / 12).clamp(0.0, 1.0);
    return SizedBox(
      width: 40,
      height: 14,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: List.generate(5, (i) {
          final threshold = (i + 1) / 5;
          return Container(
            width: 4,
            height: normalized >= threshold ? 14 : 6,
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

  Widget _buildTextInput(AppProvider provider, SessionQuestionModel question) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: _answerController,
          maxLines: 4,
          inputFormatters: [englishAnswerFormatter],
          decoration: const InputDecoration(
            hintText: 'Type your answer here in English...',
            helperText:
                'English letters only. Arabic letters are not accepted.',
          ),
        ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: provider.isLoading
              ? null
              : () => _submit(provider, question.id),
          icon: provider.isLoading
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Icon(Icons.send_rounded),
          label: Text(
            provider.isLoading ? 'Evaluating with AI...' : 'Submit Answer',
          ),
        ),
      ],
    );
  }

  Future<void> _toggleMicrophone() async {
    // Stop TTS if playing
    if (_isTtsSpeaking) {
      await _tts.stop();
    }

    if (_isSttListening) {
      final transcript = await _stt.stopListening();
      setState(() {
        _liveTranscript = transcript;
        _answerController.text = transcript;
      });
    } else {
      final started = await _stt.startListening(
        existingTranscript: _answerController.text,
      );
      if (!started && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.mic_off, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _stt.lastError ??
                        'Could not access microphone. Please check permissions.',
                  ),
                ),
              ],
            ),
            backgroundColor: AppTheme.errorColor,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  void _speakQuestion(SessionQuestionModel question) {
    if (_isSttListening) return; // Don't speak while listening
    _tts.speak(question.promptText);
  }

  void _submit(AppProvider provider, String questionId) async {
    final text = _answerController.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.white, size: 20),
              SizedBox(width: 8),
              Text('Please speak or type your answer first.'),
            ],
          ),
          backgroundColor: AppTheme.warningColor,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final sessionId = provider.currentSession?.id;
    final success = await provider.submitAnswer(questionId, text);
    if (success) {
      if (sessionId != null) {
        await _progressStore.clearDraft(sessionId, questionId);
      }
      _answerController.clear();
      setState(() => _liveTranscript = '');

      // Read the corrected sentence aloud for learning
      if (provider.lastEvaluation != null && _autoPlayTts) {
        await Future.delayed(const Duration(milliseconds: 500));
        _tts.speak(provider.lastEvaluation!.correctedSentence);
      }
    } else if (mounted) {
      // Show error to user
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  provider.errorMessage ??
                      'Failed to submit answer. Try again.',
                ),
              ),
            ],
          ),
          backgroundColor: AppTheme.errorColor,
          behavior: SnackBarBehavior.floating,
          action: SnackBarAction(
            label: 'Retry',
            textColor: Colors.white,
            onPressed: () => _submit(provider, questionId),
          ),
        ),
      );
    }
  }

  Widget _buildEvaluationFeedback(
    AppProvider provider,
    DailySessionModel session,
  ) {
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
            // Header
            Row(
              children: [
                Icon(
                  eval.isPassed
                      ? Icons.check_circle_rounded
                      : Icons.info_outline_rounded,
                  color: eval.isPassed
                      ? AppTheme.successColor
                      : AppTheme.warningColor,
                  size: 28,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    eval.isPassed ? 'Great Job! 🎉' : 'Keep Practicing! 💪',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: eval.isPassed
                          ? AppTheme.successColor
                          : AppTheme.warningColor,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
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

            // Score Breakdown (with pronunciation & fluency)
            _buildScoreBreakdown(eval),
            const SizedBox(height: 16),

            // Corrected sentence with listen button
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
              child: Row(
                children: [
                  Expanded(
                    child: SavableText(
                      eval.correctedSentence,
                      onSaveWord: (word) =>
                          _saveSelectedWord(word, eval.correctedSentence),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Listen to corrected version
                  IconButton(
                    icon: Icon(
                      _isTtsSpeaking
                          ? Icons.stop_circle
                          : Icons.volume_up_rounded,
                      color: AppTheme.primaryColor,
                      size: 22,
                    ),
                    onPressed: () {
                      if (_isTtsSpeaking) {
                        _tts.stop();
                      } else {
                        _tts.speak(eval.correctedSentence);
                      }
                    },
                    tooltip: 'Listen to correct pronunciation',
                    constraints: const BoxConstraints(),
                    padding: const EdgeInsets.all(4),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Explanation
            SavableText(
              eval.explanationMarkdown,
              onSaveWord: (word) =>
                  _saveSelectedWord(word, eval.explanationMarkdown),
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF475569),
                height: 1.4,
              ),
            ),

            // Identified Errors
            if (eval.identifiedErrors.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 8),
              ...eval.identifiedErrors.map(
                (err) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.close,
                        color: AppTheme.errorColor,
                        size: 16,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: SavableText(
                          '"${err.wrongSnippet}" → "${err.correctSnippet}": ${err.explanation}',
                          onSaveWord: (word) => _saveSelectedWord(
                            word,
                            '${err.correctSnippet}. ${err.explanation}',
                          ),
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF475569),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 16),

            // Next / Finish Button
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton.icon(
                onPressed: provider.isLoading
                    ? null
                    : () async {
                        _tts.stop();
                        provider.clearLearningSupport();
                        if (isLast) {
                          setState(() {
                            _activeSupportAction = null;
                            _currentQuestionIndex = 0;
                            _liveTranscript = '';
                            _answerController.clear();
                          });
                          await provider.finishSession();
                        } else {
                          final session = provider.currentSession;
                          if (session != null) {
                            await _showQuestion(
                              session,
                              _currentQuestionIndex + 1,
                            );
                          }
                          // Clear last evaluation for fresh view
                          provider.clearError();
                        }
                      },
                icon: Icon(
                  isLast
                      ? Icons.check_circle_rounded
                      : Icons.arrow_forward_rounded,
                ),
                label: Text(isLast ? 'Finish Session' : 'Next Question'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScoreBreakdown(dynamic eval) {
    return Row(
      children: [
        _buildScoreChip('Grammar', eval.grammarScore, Icons.spellcheck),
        const SizedBox(width: 6),
        _buildScoreChip('Vocab', eval.vocabularyScore, Icons.menu_book),
        const SizedBox(width: 6),
        _buildScoreChip('Fluency', eval.fluencyScore, Icons.record_voice_over),
        const SizedBox(width: 6),
        _buildScoreChip('Pronun.', eval.pronunciationScore, Icons.hearing),
      ],
    );
  }

  Widget _buildScoreChip(String label, double score, IconData icon) {
    final color = score >= 80
        ? AppTheme.successColor
        : score >= 50
        ? AppTheme.warningColor
        : AppTheme.errorColor;

    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 4),
            Text(
              '${score.toStringAsFixed(0)}%',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSessionCompletedView(
    AppProvider provider,
    Map<String, dynamic> summary,
  ) {
    final avgScore = (summary['averageScore'] as num?)?.toDouble() ?? 80.0;
    final grammarScore =
        (summary['grammarScore'] as num?)?.toDouble() ?? avgScore;
    final vocabScore =
        (summary['vocabularyScore'] as num?)?.toDouble() ?? avgScore;
    final fluencyScore =
        (summary['fluencyScore'] as num?)?.toDouble() ?? avgScore;
    final streak = provider.profile?.dailyStreak ?? 1;

    final scoreColor = avgScore >= 80
        ? AppTheme.successColor
        : (avgScore >= 60 ? AppTheme.primaryColor : AppTheme.warningColor);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Celebratory icon
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.successColor.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle_outline_rounded,
                size: 56,
                color: AppTheme.successColor,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              '🎉 Session Complete!',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Outstanding effort! You completed all 5 spoken exercises today with personalized AI feedback.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),

            // Average Score Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: scoreColor.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: scoreColor.withValues(alpha: 0.2)),
              ),
              child: Column(
                children: [
                  Text(
                    'Overall Session Score',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: scoreColor,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${avgScore.round()}%',
                    style: TextStyle(
                      fontSize: 42,
                      fontWeight: FontWeight.w900,
                      color: scoreColor,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildSummaryMetric(
                        'Grammar',
                        '${grammarScore.round()}%',
                        Icons.spellcheck,
                      ),
                      _buildSummaryMetric(
                        'Vocabulary',
                        '${vocabScore.round()}%',
                        Icons.menu_book,
                      ),
                      _buildSummaryMetric(
                        'Fluency',
                        '${fluencyScore.round()}%',
                        Icons.record_voice_over,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Streak card
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('🔥', style: TextStyle(fontSize: 20)),
                  const SizedBox(width: 8),
                  Text(
                    'Daily Streak: $streak Day${streak > 1 ? 's' : ''}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Color(0xFFB45309),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      provider.clearSessionSummary();
                    },
                    child: const Text('Back to Home'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: provider.isLoading
                        ? null
                        : () async {
                            provider.clearSessionSummary();
                            await provider.startSession();
                          },
                    child: const Text('Practice Again'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryMetric(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, size: 18, color: const Color(0xFF64748B)),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
            color: Color(0xFF0F172A),
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
        ),
      ],
    );
  }

  Widget _buildErrorState(AppProvider provider) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(36),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Color(0xFFFEE2E2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.error_outline_rounded,
                size: 48,
                color: AppTheme.errorColor,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Something went wrong',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              provider.errorMessage ?? 'Could not connect to server.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                provider.clearError();
                provider.startSession();
              },
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoActiveSession(AppProvider provider) {
    final sessionsRemaining =
        (provider.quota?['dailySessionsRemaining'] as num?)?.toInt();
    final quotaExhausted = sessionsRemaining != null && sessionsRemaining <= 0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(36),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Audio-themed icon
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.headset_mic_rounded,
                size: 56,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Start Today\'s Training',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Practice listening and speaking with 5 AI-curated exercises.\nSpeak your answers and get instant pronunciation feedback!',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
                height: 1.5,
              ),
            ),
            const SizedBox(height: 12),

            // Feature badges
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildFeatureBadge(Icons.volume_up, 'Listen'),
                _buildFeatureBadge(Icons.mic, 'Speak'),
                _buildFeatureBadge(Icons.auto_awesome, 'AI Feedback'),
                _buildFeatureBadge(Icons.trending_up, 'Track Progress'),
              ],
            ),
            const SizedBox(height: 28),

            if (quotaExhausted) ...[
              QuotaLimitNotice(
                resetsAtUtc: provider.quota?['resetsAtUtc']?.toString(),
                onExpired: provider.fetchQuota,
              ),
              const SizedBox(height: 18),
            ],

            // Start button with error handling
            ElevatedButton.icon(
              onPressed: provider.isLoading || quotaExhausted
                  ? null
                  : () async {
                      final success = await provider.startSession();
                      final nowExhausted =
                          ((provider.quota?['dailySessionsRemaining'] as num?)
                                  ?.toInt() ??
                              1) <=
                          0;
                      if (!success && mounted && !nowExhausted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Row(
                              children: [
                                const Icon(
                                  Icons.error_outline,
                                  color: Colors.white,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    provider.errorMessage ??
                                        'Failed to start session. Check your connection.',
                                  ),
                                ),
                              ],
                            ),
                            backgroundColor: AppTheme.errorColor,
                            behavior: SnackBarBehavior.floating,
                            duration: const Duration(seconds: 5),
                            action: SnackBarAction(
                              label: 'Retry',
                              textColor: Colors.white,
                              onPressed: () => provider.startSession(),
                            ),
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
                  : const Icon(Icons.rocket_launch_rounded),
              label: Text(
                provider.isLoading
                    ? 'Generating Exercises...'
                    : quotaExhausted
                    ? 'Daily Limit Reached'
                    : 'Start Session Now',
              ),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 16,
                ),
              ),
            ),

            // Error message display
            if (provider.errorMessage != null && !provider.isLoading) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.warning_amber_rounded,
                      size: 18,
                      color: AppTheme.errorColor,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        provider.errorMessage!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF991B1B),
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => provider.clearError(),
                      child: const Icon(
                        Icons.close,
                        size: 16,
                        color: Color(0xFF991B1B),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureBadge(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppTheme.primaryColor.withValues(alpha: 0.15),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppTheme.primaryColor),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }
}
