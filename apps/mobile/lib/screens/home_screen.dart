import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/app_provider.dart';
import '../widgets/level_badge.dart';
import '../widgets/score_card.dart';

class HomeScreen extends StatelessWidget {
  final VoidCallback onStartPractice;
  final VoidCallback onStartAssessment;
  final VoidCallback? onOpenAdmin;

  const HomeScreen({
    super.key,
    required this.onStartPractice,
    required this.onStartAssessment,
    this.onOpenAdmin,
  });

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final user = provider.user;
    final profile = provider.profile;
    final quota = provider.quota;

    if (user == null || profile == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.school_rounded, color: AppTheme.primaryColor),
            const SizedBox(width: 8),
            const Text('English Coach'),
          ],
        ),
        actions: [
          if (provider.isAdmin && onOpenAdmin != null)
            TextButton.icon(
              onPressed: onOpenAdmin,
              icon: const Icon(Icons.admin_panel_settings_rounded, color: AppTheme.primaryColor),
              label: const Text(
                'Admin Panel',
                style: TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
              ),
            ),
          IconButton(
            tooltip: 'Sign Out',
            icon: const Icon(Icons.logout_rounded, color: Color(0xFF64748B)),
            onPressed: () => provider.logout(),
          ),
          const SizedBox(width: 8),
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
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 800),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Profile Header Banner
                  Card(
                    color: AppTheme.primaryColor,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 28,
                                backgroundColor: Colors.white,
                                child: Text(
                                  user.name.isNotEmpty ? user.name[0].toUpperCase() : 'U',
                                  style: const TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primaryColor,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Welcome back, ${user.name}!',
                                      style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      user.email,
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Colors.white.withOpacity(0.8),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // Streak
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.18),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Text('🔥', style: TextStyle(fontSize: 18)),
                                    const SizedBox(width: 6),
                                    Text(
                                      '${profile.dailyStreak} Days',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          const Divider(color: Colors.white24),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Text(
                                    'Current Level: ',
                                    style: TextStyle(color: Colors.white, fontSize: 14),
                                  ),
                                  LevelBadge(
                                    level: profile.currentLevel,
                                    fontSize: 13,
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  ),
                                ],
                              ),
                              Row(
                                children: [
                                  const Text(
                                    'Target Goal: ',
                                    style: TextStyle(color: Colors.white70, fontSize: 13),
                                  ),
                                  LevelBadge(
                                    level: profile.targetLevel,
                                    fontSize: 12,
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Quota Info Bar
                  if (quota != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildQuotaItem(
                            Icons.chat_bubble_outline_rounded,
                            '${quota['dailyQuestionsRemaining'] ?? 0} Questions left',
                          ),
                          Container(width: 1, height: 24, color: const Color(0xFFCBD5E1)),
                          _buildQuotaItem(
                            Icons.timer_outlined,
                            '${quota['dailySessionsRemaining'] ?? 0} Sessions left',
                          ),
                          Container(width: 1, height: 24, color: const Color(0xFFCBD5E1)),
                          _buildQuotaItem(
                            Icons.verified_outlined,
                            'Tier: ${quota['tierName'] ?? 'FREE'}',
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: onStartPractice,
                          icon: const Icon(Icons.play_arrow_rounded, size: 24),
                          label: const Text('Daily Practice'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryColor,
                            padding: const EdgeInsets.symmetric(vertical: 18),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: onStartAssessment,
                          icon: const Icon(Icons.assessment_outlined, size: 22),
                          label: const Text('CEFR Test'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 18),
                            side: const BorderSide(color: AppTheme.primaryColor, width: 1.5),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Skill Breakdown Scores
                  const Text(
                    'Proficiency Overview',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 14),
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final isWide = constraints.maxWidth > 500;
                      return GridView.count(
                        crossAxisCount: isWide ? 4 : 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: isWide ? 1.3 : 1.25,
                        children: [
                          ScoreCard(
                            title: 'Overall Score',
                            score: profile.overallScore,
                            icon: Icons.auto_awesome,
                            color: AppTheme.primaryColor,
                          ),
                          ScoreCard(
                            title: 'Grammar',
                            score: profile.grammarScore,
                            icon: Icons.spellcheck,
                            color: const Color(0xFF2563EB),
                          ),
                          ScoreCard(
                            title: 'Vocabulary',
                            score: profile.vocabularyScore,
                            icon: Icons.menu_book,
                            color: const Color(0xFF059669),
                          ),
                          ScoreCard(
                            title: 'Fluency',
                            score: profile.fluencyScore,
                            icon: Icons.record_voice_over,
                            color: const Color(0xFFD97706),
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 28),

                  // Weaknesses Focus
                  if (profile.recurringWeaknesses.isNotEmpty) ...[
                    const Text(
                      'Areas For Improvement',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: profile.recurringWeaknesses.map((w) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFFDE68A)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.trending_up, size: 16, color: Color(0xFFD97706)),
                              const SizedBox(width: 6),
                              Text(
                                w,
                                style: const TextStyle(
                                  color: Color(0xFF92400E),
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuotaItem(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: const Color(0xFF64748B)),
        const SizedBox(width: 6),
        Text(
          text,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Color(0xFF475569),
          ),
        ),
      ],
    );
  }
}

