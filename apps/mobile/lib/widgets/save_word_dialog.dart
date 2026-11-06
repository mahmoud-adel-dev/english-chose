import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import 'english_answer_formatter.dart';

Future<bool?> showSaveWordDialog(
  BuildContext context, {
  String initialWord = '',
  String? exampleSentence,
}) async {
  final formKey = GlobalKey<FormState>();
  final word = TextEditingController(text: initialWord);
  final translation = TextEditingController();
  final example = TextEditingController(text: exampleSentence ?? '');
  final provider = context.read<AppProvider>();

  final result = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: const Text('Save a word'),
      content: Form(
        key: formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: word,
                inputFormatters: [englishAnswerFormatter],
                decoration: const InputDecoration(labelText: 'English word'),
                validator: (value) => (value == null || value.trim().isEmpty)
                    ? 'Enter an English word'
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: translation,
                textDirection: TextDirection.rtl,
                decoration: const InputDecoration(labelText: 'Arabic meaning'),
                validator: (value) => (value == null || value.trim().isEmpty)
                    ? 'Enter the Arabic meaning'
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: example,
                inputFormatters: [englishAnswerFormatter],
                decoration: const InputDecoration(
                  labelText: 'Example sentence (optional)',
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(dialogContext, false),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () async {
            if (!formKey.currentState!.validate()) return;
            final ok = await provider.saveWord(
              word: word.text.trim(),
              translation: translation.text.trim(),
              exampleSentence: example.text.trim(),
              level: provider.profile?.currentLevel,
            );
            if (!dialogContext.mounted) return;
            if (ok) {
              Navigator.pop(dialogContext, true);
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    provider.errorMessage ?? 'Could not save this word.',
                  ),
                ),
              );
            }
          },
          child: const Text('Save'),
        ),
      ],
    ),
  );

  word.dispose();
  translation.dispose();
  example.dispose();
  return result;
}
