import 'package:flutter/material.dart';

class AssessmentLevelSelector extends StatefulWidget {
  final String initialLevel;
  final Future<void> Function(String level) onConfirm;
  final bool isLoading;

  const AssessmentLevelSelector({
    super.key,
    required this.initialLevel,
    required this.onConfirm,
    this.isLoading = false,
  });

  @override
  State<AssessmentLevelSelector> createState() =>
      _AssessmentLevelSelectorState();
}

class _AssessmentLevelSelectorState extends State<AssessmentLevelSelector> {
  static const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  late String selectedLevel;

  @override
  void initState() {
    super.initState();
    selectedLevel = levels.contains(widget.initialLevel)
        ? widget.initialLevel
        : 'A1';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Choose my starting level',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 8),
        const Text(
          'Choose this if you already know your level. Your progress will be measured from this point.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Color(0xFF64748B), height: 1.4),
        ),
        const SizedBox(height: 16),
        Wrap(
          alignment: WrapAlignment.center,
          spacing: 8,
          runSpacing: 8,
          children: levels
              .map(
                (level) => ChoiceChip(
                  label: Text(level),
                  selected: selectedLevel == level,
                  onSelected: widget.isLoading
                      ? null
                      : (_) => setState(() => selectedLevel = level),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 16),
        OutlinedButton(
          onPressed: widget.isLoading
              ? null
              : () => widget.onConfirm(selectedLevel),
          child: Text(
            widget.isLoading ? 'Saving...' : 'Start from $selectedLevel',
          ),
        ),
      ],
    );
  }
}
