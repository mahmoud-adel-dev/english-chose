import 'package:flutter/material.dart';

typedef SaveQuotaTier = Future<bool> Function(Map<String, dynamic> value);
typedef UpdateQuotaTier =
    Future<bool> Function(String id, Map<String, dynamic> value);

class QuotaPackagesTab extends StatelessWidget {
  final List<dynamic> tiers;
  final SaveQuotaTier onCreate;
  final UpdateQuotaTier onUpdate;

  const QuotaPackagesTab({
    super.key,
    required this.tiers,
    required this.onCreate,
    required this.onUpdate,
  });

  Future<void> _openEditor(
    BuildContext context, [
    Map<String, dynamic>? tier,
  ]) async {
    final formKey = GlobalKey<FormState>();
    final name = TextEditingController(text: tier?['name']?.toString() ?? '');
    final questions = TextEditingController(
      text: tier?['maxDailyQuestions']?.toString() ?? '15',
    );
    final sessions = TextEditingController(
      text: tier?['maxDailySessions']?.toString() ?? '2',
    );
    final audio = TextEditingController(
      text: tier?['maxAudioMinutesDay']?.toString() ?? '10',
    );
    final attempts = TextEditingController(
      text: tier?['maxAttemptsPerItem']?.toString() ?? '3',
    );
    final requests = TextEditingController(
      text: tier?['requestsPerMinute']?.toString() ?? '20',
    );
    var active = tier?['isActive'] != false;
    var saving = false;

    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(tier == null ? 'Create Package' : 'Edit Package'),
          content: SizedBox(
            width: 480,
            child: SingleChildScrollView(
              child: Form(
                key: formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: name,
                      enabled: tier?['name'] != 'FREE',
                      decoration: const InputDecoration(
                        labelText: 'Package name',
                      ),
                      validator: (value) =>
                          value == null || value.trim().isEmpty
                          ? 'Package name is required'
                          : null,
                    ),
                    const SizedBox(height: 12),
                    _WholeNumberField(
                      controller: questions,
                      label: 'Daily questions',
                    ),
                    const SizedBox(height: 12),
                    _WholeNumberField(
                      controller: sessions,
                      label: 'Daily sessions',
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: audio,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      decoration: const InputDecoration(
                        labelText: 'Audio minutes / day',
                      ),
                      validator: (value) {
                        final parsed = double.tryParse(value ?? '');
                        return parsed == null || !parsed.isFinite || parsed < 0
                            ? 'Enter zero or a positive number'
                            : null;
                      },
                    ),
                    const SizedBox(height: 12),
                    _WholeNumberField(
                      controller: attempts,
                      label: 'Attempts / question',
                      minimum: 1,
                    ),
                    const SizedBox(height: 12),
                    _WholeNumberField(
                      controller: requests,
                      label: 'Requests / minute',
                      minimum: 1,
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Active package'),
                      value: active,
                      onChanged: (value) =>
                          setDialogState(() => active = value),
                    ),
                  ],
                ),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: saving ? null : () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: saving
                  ? null
                  : () async {
                      if (!formKey.currentState!.validate()) return;
                      setDialogState(() => saving = true);
                      final value = <String, dynamic>{
                        'name': name.text.trim(),
                        'maxDailyQuestions': int.parse(questions.text),
                        'maxDailySessions': int.parse(sessions.text),
                        'maxAudioMinutesDay': double.parse(audio.text),
                        'maxAttemptsPerItem': int.parse(attempts.text),
                        'requestsPerMinute': int.parse(requests.text),
                        'isActive': active,
                      };
                      final success = tier == null
                          ? await onCreate(value)
                          : await onUpdate(tier['id'].toString(), value);
                      if (success && dialogContext.mounted) {
                        Navigator.pop(dialogContext);
                      } else if (dialogContext.mounted) {
                        setDialogState(() => saving = false);
                      }
                    },
              child: Text(saving ? 'Saving...' : 'Save Package'),
            ),
          ],
        ),
      ),
    );

    name.dispose();
    questions.dispose();
    sessions.dispose();
    audio.dispose();
    attempts.dispose();
    requests.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 900),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Quota Packages',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  FilledButton.icon(
                    onPressed: () => _openEditor(context),
                    icon: const Icon(Icons.add_rounded),
                    label: const Text('New Package'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (tiers.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Text('No packages configured.'),
                  ),
                )
              else
                ...tiers.map((raw) {
                  final tier = Map<String, dynamic>.from(raw as Map);
                  final users =
                      (tier['_count']?['users'] as num?)?.toInt() ?? 0;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      leading: Icon(
                        tier['isActive'] == true
                            ? Icons.verified_rounded
                            : Icons.pause_circle_outline_rounded,
                      ),
                      title: Text(
                        tier['name']?.toString() ?? '',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Text(
                        '${tier['maxDailySessions']} sessions • '
                        '${tier['maxDailyQuestions']} questions • '
                        '${tier['maxAudioMinutesDay']} audio min • $users users',
                      ),
                      trailing: IconButton(
                        tooltip: 'Edit package',
                        icon: const Icon(Icons.edit_rounded),
                        onPressed: () => _openEditor(context, tier),
                      ),
                    ),
                  );
                }),
            ],
          ),
        ),
      ),
    );
  }
}

class _WholeNumberField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final int minimum;

  const _WholeNumberField({
    required this.controller,
    required this.label,
    this.minimum = 0,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(labelText: label),
      validator: (value) {
        final parsed = int.tryParse(value ?? '');
        if (parsed == null || parsed < minimum) {
          return minimum == 0
              ? 'Enter zero or a positive whole number'
              : 'Enter a whole number of at least $minimum';
        }
        return null;
      },
    );
  }
}

class UserQuotaTierSelector extends StatefulWidget {
  final List<dynamic> tiers;
  final String? value;
  final Future<bool> Function(String tierId) onChanged;

  const UserQuotaTierSelector({
    super.key,
    required this.tiers,
    required this.value,
    required this.onChanged,
  });

  @override
  State<UserQuotaTierSelector> createState() => _UserQuotaTierSelectorState();
}

class _UserQuotaTierSelectorState extends State<UserQuotaTierSelector> {
  String? _value;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _value = widget.value;
  }

  @override
  Widget build(BuildContext context) {
    final available = widget.tiers.where((raw) {
      final tier = raw as Map;
      return tier['isActive'] == true || tier['id'] == _value;
    }).toList();

    return DropdownButtonFormField<String>(
      initialValue: available.any((tier) => tier['id'] == _value)
          ? _value
          : null,
      decoration: const InputDecoration(labelText: 'Package', isDense: true),
      items: available
          .map(
            (tier) => DropdownMenuItem<String>(
              value: tier['id'].toString(),
              child: Text(tier['name'].toString()),
            ),
          )
          .toList(),
      onChanged: _saving
          ? null
          : (value) async {
              if (value == null) return;
              setState(() => _saving = true);
              final success = await widget.onChanged(value);
              if (mounted) {
                setState(() {
                  if (success) _value = value;
                  _saving = false;
                });
              }
            },
    );
  }
}
