import 'package:flutter/material.dart';

/// Local first-party vector artwork rendered to PNG; no network or animation.
class CoachIllustration extends StatelessWidget {
  final double size;
  const CoachIllustration({super.key, this.size = 160});

  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: Image.asset(
      'assets/illustrations/coach.png',
      width: size,
      height: size * 480 / 540,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.high,
    ),
  );
}
