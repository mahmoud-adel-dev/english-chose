import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import 'english_answer_formatter.dart';

Future<bool?> showSaveWordDialog(
  BuildContext context, {
  String initialWord = '',
  String? exampleSentence,
}) {
  final provider = context.read<AppProvider>();
  return showDialog<bool>(
    context: context,
    builder: (_) => _SaveWordDialog(
      provider: provider,
      initialWord: initialWord,
      exampleSentence: exampleSentence,
    ),
  );
}

class _SaveWordDialog extends StatefulWidget {
  final AppProvider provider;
  final String initialWord;
  final String? exampleSentence;

  const _SaveWordDialog({
    required this.provider,
    required this.initialWord,
    this.exampleSentence,
  });

  @override
  State<_SaveWordDialog> createState() => _SaveWordDialogState();
}

class _SaveWordDialogState extends State<_SaveWordDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _word;
  late final TextEditingController _translation;
  late final TextEditingController _example;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _word = TextEditingController(text: widget.initialWord);
    _translation = TextEditingController();
    _example = TextEditingController(text: widget.exampleSentence ?? '');
  }

  @override
  void dispose() {
    _word.dispose();
    _translation.dispose();
    _example.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_isSaving || !_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);
    final ok = await widget.provider.saveWord(
      word: _word.text.trim(),
      translation: _translation.text.trim(),
      exampleSentence: _example.text.trim(),
      level: widget.provider.profile?.currentLevel,
    );
    if (!mounted) return;
    if (ok) {
      Navigator.pop(context, true);
      return;
    }
    setState(() => _isSaving = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          widget.provider.errorMessage ?? 'Could not save this word.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Save a word'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _word,
                inputFormatters: [englishAnswerFormatter],
                decoration: const InputDecoration(labelText: 'English word'),
                validator: (value) => (value == null || value.trim().isEmpty)
                    ? 'Enter an English word'
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _translation,
                textDirection: TextDirection.rtl,
                decoration: const InputDecoration(labelText: 'Arabic meaning'),
                validator: (value) => (value == null || value.trim().isEmpty)
                    ? 'Enter the Arabic meaning'
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _example,
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
          onPressed: _isSaving ? null : () => Navigator.pop(context, false),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _isSaving ? null : _save,
          child: _isSaving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Save'),
        ),
      ],
    );
  }
}
