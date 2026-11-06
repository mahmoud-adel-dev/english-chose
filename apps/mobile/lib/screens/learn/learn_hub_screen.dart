import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/learn.dart';
import '../../providers/app_provider.dart';
import '../../services/tts_service.dart';
import 'grammar_lesson_screen.dart';
import 'quiz_screen.dart';

class LearnHubScreen extends StatefulWidget {
  const LearnHubScreen({super.key});

  @override
  State<LearnHubScreen> createState() => _LearnHubScreenState();
}

class _LearnHubScreenState extends State<LearnHubScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TtsService _tts = TtsService();
  String _selectedLevel = 'ALL';
  String _examTargetLevel = 'B1';

  final List<String> _levels = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(_onTabChanged);

    // Lazy load: only load Tab 0 (Grammar) initially if not already cached
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().fetchGrammarTopicsIfNeeded();
    });
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) {
      final index = _tabController.index;
      final provider = context.read<AppProvider>();
      if (index == 0) {
        provider.fetchGrammarTopicsIfNeeded();
      } else if (index == 2 || index == 3) {
        // Load tips lazily only when user visits pronunciation or listening tab
        provider.fetchLearningTipsIfNeeded();
      }
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    _tts.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'Learning & Skills Hub / قسم التعلم',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: const Color(0xFF1E293B),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: const Color(0xFF64748B),
          indicatorColor: AppTheme.primaryColor,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(icon: Icon(Icons.menu_book_rounded, size: 20), text: 'القواعد (Grammar)'),
            Tab(icon: Icon(Icons.quiz_rounded, size: 20), text: 'اختبار 50 سؤال (Exam)'),
            Tab(icon: Icon(Icons.record_voice_over_rounded, size: 20), text: 'قوة النطق (Pronunciation)'),
            Tab(icon: Icon(Icons.headphones_rounded, size: 20), text: 'قوة الاستماع (Listening)'),
          ],
        ),
      ),
      body: provider.isLearnLoading && provider.grammarTopics.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildGrammarTab(provider),
                _buildQuizExamTab(provider),
                _buildPronunciationTab(provider),
                _buildListeningTab(provider),
              ],
            ),
    );
  }

  // ==========================================
  // TAB 1: GRAMMAR LESSONS
  // ==========================================
  Widget _buildGrammarTab(AppProvider provider) {
    final filteredTopics = _selectedLevel == 'ALL'
        ? provider.grammarTopics
        : provider.grammarTopics.where((t) => t.level == _selectedLevel).toList();

    return Column(
      children: [
        // Level Filter Chips
        Container(
          height: 52,
          padding: const EdgeInsets.symmetric(vertical: 8),
          color: Colors.white,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _levels.length,
            separatorBuilder: (context, index) => const SizedBox(width: 8),
            itemBuilder: (context, idx) {
              final lvl = _levels[idx];
              final isSelected = _selectedLevel == lvl;
              return ChoiceChip(
                label: Text(lvl == 'ALL' ? 'All Levels' : 'Level $lvl'),
                selected: isSelected,
                selectedColor: AppTheme.primaryColor.withValues(alpha: 0.15),
                backgroundColor: const Color(0xFFF1F5F9),
                labelStyle: TextStyle(
                  color: isSelected ? AppTheme.primaryColor : const Color(0xFF475569),
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  fontSize: 12,
                ),
                onSelected: (selected) {
                  if (selected) {
                    setState(() => _selectedLevel = lvl);
                  }
                },
              );
            },
          ),
        ),
        const Divider(height: 1, color: Color(0xFFE2E8F0)),

        // Topics List
        Expanded(
          child: filteredTopics.isEmpty
              ? const Center(
                  child: Text('No grammar topics found for this level.'),
                )
              : RefreshIndicator(
                  onRefresh: () => provider.fetchGrammarTopicsIfNeeded(force: true),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredTopics.length,
                    itemBuilder: (context, idx) {
                      final topic = filteredTopics[idx];
                      return _buildTopicCard(topic);
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildTopicCard(GrammarTopicModel topic) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'CEFR ${topic.level}',
                    style: const TextStyle(
                      color: AppTheme.primaryColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    topic.titleArabic,
                    textAlign: TextAlign.end,
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              topic.title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              topic.summary,
              style: const TextStyle(fontSize: 13, color: Color(0xFF475569), height: 1.3),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => GrammarLessonScreen(topic: topic),
                        ),
                      );
                    },
                    icon: const Icon(Icons.menu_book, size: 16),
                    label: const Text('شرح الدرس'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      final provider = context.read<AppProvider>();
                      final quiz = await provider.fetch50QuestionQuiz(topicId: topic.id);
                      if (quiz != null && mounted) {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => QuizScreen(quiz: quiz),
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.bolt, size: 16),
                    label: const Text('اختبار 50 سؤال'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // TAB 2: 50-QUESTION LIVE TEST
  // ==========================================
  Widget _buildQuizExamTab(AppProvider provider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Hero Exam Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.flash_on_rounded, color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'اختبار الـ 50 سؤال الحي',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                          Text(
                            '50-Question Live Mastery Exam',
                            style: TextStyle(color: Color(0xFFDBEAFE), fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  'اختبر مستواك بدقة من خلال 50 سؤال متعدد الخيارات (MCQ) تم إعدادها وفقاً لمعايير الإطار الأوروبي CEFR لتثبيت القواعد والنطق.',
                  style: TextStyle(color: Colors.white, fontSize: 13, height: 1.5),
                ),
                const SizedBox(height: 16),
                const Row(
                  children: [
                    Icon(Icons.check_circle_outline, color: Colors.white70, size: 16),
                    SizedBox(width: 6),
                    Text('50 سؤال متعدد الخيارات', style: TextStyle(color: Colors.white, fontSize: 12)),
                    SizedBox(width: 16),
                    Icon(Icons.timer_outlined, color: Colors.white70, size: 16),
                    SizedBox(width: 6),
                    Text('توقيت حي وتقييم فوري', style: TextStyle(color: Colors.white, fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          const Text(
            'اختر المستوى المطلوب اختباره:',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
          const SizedBox(height: 12),

          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) {
              final isSelected = _examTargetLevel == lvl;
              return ChoiceChip(
                label: Text('Level $lvl'),
                selected: isSelected,
                selectedColor: AppTheme.primaryColor,
                backgroundColor: Colors.white,
                labelStyle: TextStyle(
                  color: isSelected ? Colors.white : const Color(0xFF1E293B),
                  fontWeight: FontWeight.bold,
                ),
                onSelected: (selected) {
                  if (selected) {
                    setState(() => _examTargetLevel = lvl);
                  }
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () async {
                final quiz = await provider.fetch50QuestionQuiz(level: _examTargetLevel);
                if (quiz != null && mounted) {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => QuizScreen(quiz: quiz),
                    ),
                  );
                }
              },
              icon: const Icon(Icons.play_arrow_rounded, size: 24),
              label: Text(
                'ابدأ اختبار 50 سؤال لمستوى ($_examTargetLevel)',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 3: PRONUNCIATION MASTER TIPS
  // ==========================================
  Widget _buildPronunciationTab(AppProvider provider) {
    final pronTips = provider.learningTips.where((t) => t.category == 'PRONUNCIATION').toList();

    return RefreshIndicator(
      onRefresh: () => provider.fetchLearningTipsIfNeeded(force: true),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: pronTips.length,
        itemBuilder: (context, idx) {
          final tip = pronTips[idx];
          return _buildTipCard(tip);
        },
      ),
    );
  }

  // ==========================================
  // TAB 4: LISTENING MASTER TIPS
  // ==========================================
  Widget _buildListeningTab(AppProvider provider) {
    final listTips = provider.learningTips.where((t) => t.category == 'LISTENING').toList();

    return RefreshIndicator(
      onRefresh: () => provider.fetchLearningTipsIfNeeded(force: true),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: listTips.length,
        itemBuilder: (context, idx) {
          final tip = listTips[idx];
          return _buildTipCard(tip);
        },
      ),
    );
  }

  Widget _buildTipCard(LearningTipModel tip) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    tip.badge,
                    style: const TextStyle(
                      color: Color(0xFF2563EB),
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    tip.titleArabic,
                    textAlign: TextAlign.end,
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              tip.title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              tip.summary,
              style: const TextStyle(fontSize: 13, color: Color(0xFF475569), height: 1.3),
            ),
            const SizedBox(height: 4),
            Text(
              tip.summaryArabic,
              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), height: 1.3),
            ),

            // Drills with native TTS Audio
            if (tip.drills.isNotEmpty) ...[
              const Divider(height: 24),
              const Text(
                'تدريبات صوتية ناطقة (Interactive Audio Drills):',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1E293B)),
              ),
              const SizedBox(height: 10),
              ...tip.drills.map(
                (drill) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.volume_up_rounded, color: AppTheme.primaryColor),
                        onPressed: () => _tts.speak(drill.text),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              drill.text,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                color: Color(0xFF1E293B),
                              ),
                            ),
                            Text(
                              drill.phoneticIpa,
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF2563EB),
                                fontFamily: 'monospace',
                              ),
                            ),
                            Text(
                              drill.arabicTip,
                              style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
