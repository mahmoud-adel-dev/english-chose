import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/app_provider.dart';
import '../widgets/coach_illustration.dart';

class HomeScreen extends StatelessWidget {
  final VoidCallback onStartPractice, onStartAssessment;
  final VoidCallback? onStartConversation,
      onOpenAdmin,
      onOpenLearn,
      onOpenWords;
  const HomeScreen({
    super.key,
    required this.onStartPractice,
    required this.onStartAssessment,
    this.onStartConversation,
    this.onOpenAdmin,
    this.onOpenLearn,
    this.onOpenWords,
  });

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final user = provider.user;
    final profile = provider.profile;
    if (user == null || profile == null) {
      return const Center(child: CircularProgressIndicator());
    }
    final remaining = (provider.quota?['dailySessionsRemaining'] as num?)
        ?.toInt();
    final questionsLeft = (provider.quota?['dailyQuestionsRemaining'] as num?)
        ?.toInt();
    final tier = provider.quota?['tierName']?.toString();
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(
              Icons.auto_stories_rounded,
              color: AppTheme.primaryColor,
              size: 25,
            ),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'English Coach',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
        actions: [
          if (provider.isAdmin && onOpenAdmin != null)
            IconButton(
              tooltip: 'Admin Panel',
              icon: const Icon(Icons.admin_panel_settings_outlined),
              onPressed: onOpenAdmin,
            ),
          IconButton(
            tooltip: 'Sign Out',
            icon: const Icon(
              Icons.logout_rounded,
              color: AppTheme.mutedColor,
              size: 21,
            ),
            onPressed: provider.logout,
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await provider.refreshProfile();
          await provider.fetchQuota();
          await provider.fetchCurrentSession();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 30),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 820),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Good to see you, ${user.name.split(' ').first} ✦',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppTheme.mutedColor,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 5),
                            const Text(
                              'Make a little room to grow.',
                              style: TextStyle(
                                fontSize: 23,
                                fontWeight: FontWeight.w800,
                                height: 1.4,
                                letterSpacing: -.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.lavenderColor,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Text(
                          profile.currentLevel,
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      gradient: AppTheme.softGradient,
                      borderRadius: BorderRadius.circular(25),
                      border: Border.all(color: const Color(0xFFE5E4F6)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        LayoutBuilder(
                          builder: (context, constraints) => Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'YOUR DAILY MOMENT',
                                      style: TextStyle(
                                        fontFamily: 'Roboto',
                                        fontSize: 9,
                                        letterSpacing: 1.8,
                                        color: Color(0xFF888CB3),
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    const Text(
                                      'A little practice. A little more confidence.',
                                      style: TextStyle(
                                        fontSize: 21,
                                        fontWeight: FontWeight.w800,
                                        height: 1.5,
                                        letterSpacing: -.5,
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    const Text(
                                      'خطوة صغيرة النهارده، فرق كبير مع الوقت.',
                                      textDirection: TextDirection.rtl,
                                      style: TextStyle(
                                        fontSize: 11,
                                        height: 1.9,
                                        color: AppTheme.mutedColor,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (constraints.maxWidth > 240)
                                CoachIllustration(
                                  size: constraints.maxWidth < 430 ? 112 : 160,
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 22),
                        ElevatedButton.icon(
                          key: const Key('daily-practice'),
                          onPressed: onStartPractice,
                          icon: const Icon(Icons.play_arrow_rounded, size: 21),
                          label: const Text(
                            'Start your practice',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          remaining == null
                              ? 'Five exercises. One step forward.'
                              : '$remaining daily session${remaining == 1 ? '' : 's'} remaining · Your pace, your progress.',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 9,
                            color: Color(0xFF62677E),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (questionsLeft != null ||
                      (tier != null && tier.isNotEmpty)) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 10,
                      runSpacing: 6,
                      children: [
                        if (questionsLeft != null)
                          Chip(
                            avatar: const Icon(
                              Icons.chat_bubble_outline_rounded,
                              size: 15,
                              color: AppTheme.primaryColor,
                            ),
                            label: Text(
                              '$questionsLeft questions left',
                              style: const TextStyle(fontSize: 10),
                            ),
                          ),
                        if (tier != null && tier.isNotEmpty)
                          Chip(
                            avatar: const Icon(
                              Icons.verified_outlined,
                              size: 15,
                              color: AppTheme.accentColor,
                            ),
                            label: Text(
                              '$tier plan',
                              style: const TextStyle(fontSize: 10),
                            ),
                          ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: _Metric(
                          icon: Icons.local_fire_department_outlined,
                          label: 'Day streak',
                          value: '${profile.dailyStreak}',
                          wash: AppTheme.lavenderColor,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _Metric(
                          icon: Icons.trending_up_rounded,
                          label: 'Practice score',
                          value: '${profile.overallScore.round()}%',
                          wash: AppTheme.blueWashColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  const Text(
                    'A space for every step',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Choose what feels right for today.',
                    style: TextStyle(fontSize: 11, color: AppTheme.mutedColor),
                  ),
                  const SizedBox(height: 16),
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final cards = [
                        _JourneyCard(
                          key: const Key('level-assessment'),
                          title: 'Find your level',
                          subtitle: 'اعرف نقطة البداية المناسبة ليك',
                          detail: 'CEFR · A1–C2',
                          icon: Icons.route_outlined,
                          color: AppTheme.lavenderColor,
                          tint: AppTheme.accentColor,
                          onTap: onStartAssessment,
                        ),
                        _JourneyCard(
                          title: 'Let’s talk',
                          subtitle: 'محادثة صغيرة، وثقة أكبر',
                          detail: 'AI CONVERSATION',
                          icon: Icons.chat_bubble_outline_rounded,
                          color: AppTheme.blueWashColor,
                          tint: AppTheme.primaryColor,
                          onTap: onStartConversation,
                        ),
                        _JourneyCard(
                          key: const Key('learn-library'),
                          title: 'Learning studio',
                          subtitle: 'افهم القواعد، وجرّب بنفسك',
                          detail: 'LESSONS & QUIZZES',
                          icon: Icons.auto_stories_outlined,
                          color: const Color(0xFFF5F1FB),
                          tint: AppTheme.accentColor,
                          onTap: onOpenLearn,
                        ),
                        _JourneyCard(
                          title: 'Your word collection',
                          subtitle: 'كلمات جديدة تستاهل تحتفظ بيها',
                          detail: 'SAVED VOCABULARY',
                          icon: Icons.bookmark_border_rounded,
                          color: const Color(0xFFEEF4FB),
                          tint: const Color(0xFF7594C3),
                          onTap: onOpenWords,
                        ),
                      ];
                      if (constraints.maxWidth < 340) {
                        return Column(
                          children: [
                            for (final card in cards)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: card,
                              ),
                          ],
                        );
                      }
                      return Column(
                        children: [
                          for (var i = 0; i < cards.length; i += 2)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: IntrinsicHeight(
                                child: Row(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.stretch,
                                  children: [
                                    Expanded(child: cards[i]),
                                    const SizedBox(width: 12),
                                    Expanded(child: cards[i + 1]),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: AppTheme.borderColor),
                      borderRadius: BorderRadius.circular(22),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'Your progress, one skill at a time',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 18),
                        _Skill(
                          label: 'Grammar',
                          score: profile.grammarScore,
                          color: AppTheme.primaryColor,
                        ),
                        _Skill(
                          label: 'Vocabulary',
                          score: profile.vocabularyScore,
                          color: AppTheme.accentColor,
                        ),
                        _Skill(
                          label: 'Text fluency',
                          score: profile.fluencyScore,
                          color: const Color(0xFF83A4D5),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          'Your current level is ${profile.currentLevel}. Keep building toward ${profile.targetLevel}.',
                          style: const TextStyle(
                            fontSize: 10,
                            color: AppTheme.mutedColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (profile.recurringWeaknesses.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text(
                      'Room to grow: ${profile.recurringWeaknesses.join(' · ')}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.mutedColor,
                      ),
                    ),
                  ],
                  const SizedBox(height: 26),
                  const Text(
                    'You don’t have to be perfect. Just keep going. ✦',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 10, color: Color(0xFFA0A2B9)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final Color wash;
  const _Metric({
    required this.icon,
    required this.label,
    required this.value,
    required this.wash,
  });
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(15),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: AppTheme.borderColor),
    ),
    child: Row(
      children: [
        Container(
          padding: const EdgeInsets.all(9),
          decoration: BoxDecoration(
            color: wash,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, size: 20, color: AppTheme.primaryColor),
        ),
        const SizedBox(width: 11),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                label,
                style: const TextStyle(fontSize: 9, color: AppTheme.mutedColor),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _JourneyCard extends StatelessWidget {
  final String title, subtitle, detail;
  final IconData icon;
  final Color color, tint;
  final VoidCallback? onTap;
  const _JourneyCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.detail,
    required this.icon,
    required this.color,
    required this.tint,
    required this.onTap,
  });
  @override
  Widget build(BuildContext context) => Material(
    color: color,
    borderRadius: BorderRadius.circular(20),
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.all(19),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(9),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: .7),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: tint, size: 22),
                ),
                const Spacer(),
                Icon(
                  Icons.north_east_rounded,
                  color: tint.withValues(alpha: .6),
                  size: 17,
                ),
              ],
            ),
            const SizedBox(height: 17),
            Text(
              title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 7),
            Text(
              subtitle,
              textDirection: TextDirection.rtl,
              style: const TextStyle(
                fontSize: 10,
                height: 1.8,
                color: AppTheme.mutedColor,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              detail,
              style: TextStyle(
                fontFamily: 'Roboto',
                fontSize: 8,
                color: tint,
                letterSpacing: .8,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _Skill extends StatelessWidget {
  final String label;
  final double score;
  final Color color;
  const _Skill({required this.label, required this.score, required this.color});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: Column(
      children: [
        Row(
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 11, color: AppTheme.mutedColor),
            ),
            const Spacer(),
            Text(
              '${score.round()}%',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: (score / 100).clamp(0, 1),
            minHeight: 5,
            color: color,
            backgroundColor: AppTheme.lavenderColor,
          ),
        ),
      ],
    ),
  );
}
