import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/conversation.dart';
import '../../providers/app_provider.dart';
import '../../services/stt_service.dart';
import '../../services/tts_service.dart';
import '../../widgets/level_badge.dart';
import '../../widgets/savable_text.dart';
import '../../widgets/save_word_dialog.dart';

class ConversationCoachScreen extends StatefulWidget {
  final VoidCallback onBackToHome;

  const ConversationCoachScreen({super.key, required this.onBackToHome});

  @override
  State<ConversationCoachScreen> createState() => _ConversationCoachScreenState();
}

class _ConversationCoachScreenState extends State<ConversationCoachScreen>
    with TickerProviderStateMixin {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  final TtsService _tts = TtsService();
  final SttService _stt = SttService();

  bool _isTtsSpeaking = false;
  bool _isSttListening = false;
  String _liveTranscript = '';
  double _soundLevel = 0.0;
  bool _isVoiceMode = true;
  bool _autoPlayAudio = true;

  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _initAudio();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadConversation();
    });
  }

  Future<void> _initAudio() async {
    await _tts.initialize();
    _tts.onStart = () {
      if (mounted) setState(() => _isTtsSpeaking = true);
    };
    _tts.onComplete = () {
      if (mounted) setState(() => _isTtsSpeaking = false);
    };
    _tts.onError = () {
      if (mounted) setState(() => _isTtsSpeaking = false);
    };

    await _stt.initialize();
    _stt.onResult = (text) {
      if (mounted) {
        setState(() {
          _liveTranscript = text;
          _textController.text = text;
        });
      }
    };
    _stt.onSoundLevel = (level) {
      if (mounted) setState(() => _soundLevel = level);
    };
    _stt.onListeningStarted = () {
      if (mounted) {
        setState(() => _isSttListening = true);
        _pulseController.repeat(reverse: true);
      }
    };
    _stt.onListeningStopped = () {
      if (mounted) {
        setState(() => _isSttListening = false);
        _pulseController.stop();
        _pulseController.reset();
      }
    };
  }

  Future<void> _loadConversation() async {
    final provider = context.read<AppProvider>();
    if (provider.currentConversation == null) {
      final targetLevel = provider.profile?.targetLevel ?? 'B1';
      await provider.startOrResumeConversation(targetLevel: targetLevel);
    }
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    _pulseController.dispose();
    _tts.dispose();
    _stt.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    _textController.clear();
    setState(() => _liveTranscript = '');
    _tts.stop();
    HapticFeedback.lightImpact();

    final provider = context.read<AppProvider>();
    final success = await provider.sendConversationMessage(text);
    _scrollToBottom();

    if (success && _autoPlayAudio) {
      final session = provider.currentConversation;
      if (session != null && session.messages.isNotEmpty) {
        final lastMsg = session.messages.last;
        if (lastMsg.role == 'assistant') {
          _tts.speak(lastMsg.content);
        }
      }
    }
  }

  Future<void> _toggleListening() async {
    if (_isSttListening) {
      await _stt.stopListening();
      if (_textController.text.trim().isNotEmpty) {
        await _sendMessage();
      }
    } else {
      _tts.stop();
      setState(() {
        _liveTranscript = '';
        _textController.clear();
      });
      HapticFeedback.mediumImpact();
      final started = await _stt.startListening();
      if (!started && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_stt.lastError ?? 'Could not start microphone.'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  Future<void> _saveSelectedWord(String word, String contextSentence) async {
    await showSaveWordDialog(
      context,
      initialWord: word,
      exampleSentence: contextSentence,
    );
  }

  Future<void> _finishConversation() async {
    final provider = context.read<AppProvider>();
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('إنهاء المحادثة والتقييم 🏆'),
        content: const Text(
          'هل تريد إنهاء جلسة المحادثة الحالية والحصول على تقرير تشخيصي شامل لمستواك وأخطائك؟',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('متابعة الحديث'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
            child: const Text('إنهاء وتقييم'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      _tts.stop();
      HapticFeedback.heavyImpact();
      await provider.finishConversationSession();
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final session = provider.currentConversation;
    final report = provider.lastConversationReport;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                  'Coach Alex 🤖',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(width: 8),
                if (session != null)
                  LevelBadge(
                    level: session.targetLevel,
                    fontSize: 11,
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  ),
              ],
            ),
            const Text(
              'Real-Time Conversational Practice & Self-Development',
              style: TextStyle(fontSize: 10.5, color: Color(0xFF64748B)),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: _autoPlayAudio ? 'Auto-play Audio (ON)' : 'Auto-play Audio (OFF)',
            icon: Icon(
              _autoPlayAudio
                  ? (_isTtsSpeaking ? Icons.volume_up_rounded : Icons.volume_down_rounded)
                  : Icons.volume_off_rounded,
              color: _autoPlayAudio ? AppTheme.primaryColor : Colors.grey,
            ),
            onPressed: () {
              if (_isTtsSpeaking) {
                _tts.stop();
              }
              setState(() => _autoPlayAudio = !_autoPlayAudio);
            },
          ),
          if (session != null && session.status == 'ACTIVE' && report == null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
              child: ElevatedButton.icon(
                onPressed: provider.isConversationLoading ? null : _finishConversation,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                icon: const Icon(Icons.flag_rounded, size: 16),
                label: const Text('إنهاء وتقييم 🏆', style: TextStyle(fontSize: 12)),
              ),
            ),
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: report != null
              ? _buildReportView(report, provider)
              : session == null && provider.isConversationLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _buildChatInterface(session, provider),
        ),
      ),
    );
  }

  // ===========================================================================
  // CHAT INTERFACE
  // ===========================================================================
  Widget _buildChatInterface(ConversationSessionModel? session, AppProvider provider) {
    final messages = session?.messages ?? [];

    return Column(
      children: [
        // Messages List
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            itemCount: messages.length + (provider.isConversationSending ? 1 : 0),
            itemBuilder: (context, index) {
              if (index >= messages.length) {
                return _buildTypingIndicator();
              }
              final msg = messages[index];
              return _buildMessageBubble(msg);
            },
          ),
        ),

        // Live Speech Recognition Preview Bar
        if (_isSttListening)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: const Color(0xFFFEF3C7),
            child: Row(
              children: [
                const Icon(Icons.mic, color: Color(0xFFD97706), size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _liveTranscript.isEmpty ? 'Listening... Speak in English' : _liveTranscript,
                    style: const TextStyle(
                      color: Color(0xFF92400E),
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),

        // Input & Controls
        _buildBottomInputBar(provider),
      ],
    );
  }

  Widget _buildMessageBubble(ConversationMessageModel msg) {
    final isUser = msg.role == 'user';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!isUser) ...[
                CircleAvatar(
                  radius: 16,
                  backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.15),
                  child: const Text('🤖', style: TextStyle(fontSize: 16)),
                ),
                const SizedBox(width: 8),
              ],
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isUser ? AppTheme.primaryColor : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isUser ? 16 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 16),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SavableText(
                        msg.content,
                        onSaveWord: (w) => _saveSelectedWord(w, msg.content),
                        style: TextStyle(
                          fontSize: 14.5,
                          height: 1.4,
                          color: isUser ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                      if (!isUser) ...[
                        const SizedBox(height: 6),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.volume_up_rounded, size: 18),
                              color: AppTheme.primaryColor,
                              constraints: const BoxConstraints(),
                              padding: const EdgeInsets.only(right: 8),
                              tooltip: 'Listen to pronunciation',
                              onPressed: () => _tts.speak(msg.content),
                            ),
                            IconButton(
                              icon: const Icon(Icons.slow_motion_video_rounded, size: 16),
                              color: const Color(0xFF64748B),
                              constraints: const BoxConstraints(),
                              padding: EdgeInsets.zero,
                              tooltip: 'Listen slowly (0.5x)',
                              onPressed: () => _tts.speakAtSpeed(msg.content, 0.25),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              if (isUser) ...[
                const SizedBox(width: 8),
                CircleAvatar(
                  radius: 16,
                  backgroundColor: const Color(0xFFE2E8F0),
                  child: const Icon(Icons.person, size: 18, color: Color(0xFF475569)),
                ),
              ],
            ],
          ),

          // Instant Coach Correction Tip
          if (msg.correctionTip != null && msg.correctionTip!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Container(
              margin: EdgeInsets.only(
                left: isUser ? 40 : 40,
                right: isUser ? 40 : 10,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Row(
                children: [
                  const Text('💡', style: TextStyle(fontSize: 14)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      msg.correctionTip!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF92400E),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.15),
            child: const Text('🤖', style: TextStyle(fontSize: 16)),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                SizedBox(width: 8),
                Text(
                  'Coach Alex is thinking...',
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomInputBar(AppProvider provider) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: Column(
        children: [
          // Mode Toggle
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SegmentedButton<bool>(
                segments: const [
                  ButtonSegment<bool>(
                    value: true,
                    icon: Icon(Icons.mic_rounded, size: 16),
                    label: Text('Voice Mode (صوت)'),
                  ),
                  ButtonSegment<bool>(
                    value: false,
                    icon: Icon(Icons.keyboard_rounded, size: 16),
                    label: Text('Text Mode (كتابة)'),
                  ),
                ],
                selected: {_isVoiceMode},
                onSelectionChanged: (val) {
                  setState(() => _isVoiceMode = val.first);
                  if (_isSttListening) _stt.stopListening();
                },
                style: ButtonStyle(
                  visualDensity: VisualDensity.compact,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          if (_isVoiceMode)
            // Voice Input UI
            Column(
              children: [
                GestureDetector(
                  onTap: _toggleListening,
                  child: AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, child) {
                      final scale = _isSttListening
                          ? 1.0 + (_pulseController.value * 0.1) + (_soundLevel.clamp(0.0, 1.0) * 0.1)
                          : 1.0;
                      return Transform.scale(
                        scale: scale,
                        child: Container(
                          width: 68,
                          height: 68,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _isSttListening ? const Color(0xFFEF4444) : AppTheme.primaryColor,
                            boxShadow: [
                              BoxShadow(
                                color: (_isSttListening ? const Color(0xFFEF4444) : AppTheme.primaryColor)
                                    .withValues(alpha: 0.3),
                                blurRadius: 16,
                                spreadRadius: _isSttListening ? 6 : 2,
                              ),
                            ],
                          ),
                          child: Icon(
                            _isSttListening ? Icons.stop_rounded : Icons.mic_rounded,
                            color: Colors.white,
                            size: 32,
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _isSttListening
                      ? 'Listening... Tap to finish & send'
                      : 'Tap mic and speak English to Coach Alex',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
              ],
            )
          else
            // Keyboard Text Input UI
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _sendMessage(),
                    decoration: InputDecoration(
                      hintText: 'Type your English message to Alex...',
                      hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  icon: const Icon(Icons.send_rounded, size: 20),
                  style: IconButton.styleFrom(backgroundColor: AppTheme.primaryColor),
                  onPressed: provider.isConversationSending ? null : _sendMessage,
                ),
              ],
            ),
        ],
      ),
    );
  }

  // ===========================================================================
  // REPORT VIEW
  // ===========================================================================
  Widget _buildReportView(ConversationEvaluationReportModel report, AppProvider provider) {
    final levelColor = AppTheme.getLevelColor(report.assessedLevel);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Text(
                '🏆 تقرير أداء المحادثة والتقييم الشامل',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 4),
              const Text(
                'Comprehensive CEFR Conversation Diagnostic Report',
                style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 20),

              // Level Circle
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: levelColor.withValues(alpha: 0.12),
                  border: Border.all(color: levelColor.withValues(alpha: 0.3), width: 2),
                ),
                child: Text(
                  report.assessedLevel,
                  style: TextStyle(fontSize: 44, fontWeight: FontWeight.w900, color: levelColor),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'المستوى المحقق في المحادثة: Level ${report.assessedLevel}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
              ),
              Text(
                'الدرجة الكلية: ${report.overallScore.toStringAsFixed(1)} / 100',
                style: const TextStyle(fontSize: 13, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 20),

              // Metric Chips
              Row(
                children: [
                  _buildMetricChip('القواعد\nGrammar', report.grammarScore),
                  const SizedBox(width: 6),
                  _buildMetricChip('المفردات\nVocab', report.vocabularyScore),
                  const SizedBox(width: 6),
                  _buildMetricChip('الطلاقة\nFluency', report.fluencyScore),
                  const SizedBox(width: 6),
                  _buildMetricChip('النطق\nPronun.', report.pronunciationScore),
                ],
              ),
              const SizedBox(height: 20),

              // Summary
              Container(
                padding: const EdgeInsets.all(14),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '📝 خلاصة تقييم الأداء:',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1E293B)),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      report.summaryArabic,
                      style: const TextStyle(fontSize: 13, color: Color(0xFF334155), height: 1.5),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Strengths
              if (report.strengthsArabic.isNotEmpty) ...[
                _buildBulletList('🌟 نقاط القوة التي أظهرتها في المحادثة:', report.strengthsArabic, const Color(0xFF059669)),
                const SizedBox(height: 16),
              ],

              // Improvements
              if (report.areasForImprovementArabic.isNotEmpty) ...[
                _buildBulletList('💡 نصائح عملية للتطوير والارتقاء بالمستوى:', report.areasForImprovementArabic, const Color(0xFF2563EB)),
                const SizedBox(height: 16),
              ],

              // Mistakes Log
              if (report.allMistakes.isNotEmpty) ...[
                Align(
                  alignment: Alignment.centerRight,
                  child: Text(
                    '🔍 سجل التصويبات والأخطاء (${report.allMistakes.length}):',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1E293B)),
                  ),
                ),
                const SizedBox(height: 8),
                ...report.allMistakes.map((m) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFFECACA)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.close, color: AppTheme.errorColor, size: 16),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                '"${m.wrongSnippet}" → "${m.correctSnippet}"',
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF991B1B),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          m.explanation,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF7F1D1D)),
                        ),
                      ],
                    ),
                  );
                }),
                const SizedBox(height: 20),
              ],

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        provider.clearConversationReport();
                        provider.startOrResumeConversation();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      icon: const Icon(Icons.restart_alt_rounded, size: 18),
                      label: const Text('محادثة جديدة 🚀'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: widget.onBackToHome,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      icon: const Icon(Icons.home_rounded, size: 18),
                      label: const Text('الرئيسية 🏠'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricChip(String label, double score) {
    final color = score >= 80
        ? AppTheme.successColor
        : score >= 60
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
            Text(
              '${score.toStringAsFixed(0)}%',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: color),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 9.5, color: Color(0xFF64748B), height: 1.1),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBulletList(String title, List<String> items, Color dotColor) {
    return Container(
      padding: const EdgeInsets.all(14),
      width: double.infinity,
      decoration: BoxDecoration(
        color: dotColor.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: dotColor.withValues(alpha: 0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: dotColor)),
          const SizedBox(height: 6),
          ...items.map(
            (it) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('• ', style: TextStyle(color: dotColor, fontWeight: FontWeight.bold, fontSize: 14)),
                  Expanded(
                    child: Text(it, style: const TextStyle(fontSize: 12.5, color: Color(0xFF334155), height: 1.4)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
