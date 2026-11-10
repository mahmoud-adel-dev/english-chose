import 'package:flutter/material.dart';
import '../config/theme.dart';
import 'coach_illustration.dart';

class LearningBanner extends StatelessWidget {
  final String title;
  final String subtitle;
  const LearningBanner({
    super.key,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      gradient: AppTheme.softGradient,
      borderRadius: BorderRadius.circular(22),
      border: Border.all(color: AppTheme.borderColor),
    ),
    child: LayoutBuilder(
      builder: (context, constraints) {
        final showArt = constraints.maxWidth >= 270;
        return Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.inkColor,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.mutedColor,
                      height: 1.8,
                    ),
                  ),
                ],
              ),
            ),
            if (showArt) ...[
              const SizedBox(width: 8),
              const CoachIllustration(size: 105),
            ],
          ],
        );
      },
    ),
  );
}
