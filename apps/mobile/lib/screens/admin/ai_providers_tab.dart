import 'package:flutter/material.dart';

typedef SaveProviderCallback =
    Future<bool> Function({
      required String identifier,
      required String apiKey,
      String? managementKey,
      String? baseUrl,
    });
typedef ProviderActionCallback = Future<bool> Function(String providerId);
typedef DiscoverModelsCallback =
    Future<List<dynamic>> Function(String providerId);
typedef ImportModelsCallback =
    Future<bool> Function(String providerId, List<String> modelIdentifiers);

class AiProvidersTab extends StatefulWidget {
  final List<dynamic> catalog;
  final List<dynamic> providers;
  final bool isLoading;
  final SaveProviderCallback onSaveProvider;
  final ProviderActionCallback onTestProvider;
  final ProviderActionCallback onRefreshQuota;
  final DiscoverModelsCallback onDiscoverModels;
  final ImportModelsCallback onImportModels;

  const AiProvidersTab({
    super.key,
    required this.catalog,
    required this.providers,
    required this.onSaveProvider,
    required this.onTestProvider,
    required this.onRefreshQuota,
    required this.onDiscoverModels,
    required this.onImportModels,
    this.isLoading = false,
  });

  @override
  State<AiProvidersTab> createState() => _AiProvidersTabState();
}

class _AiProvidersTabState extends State<AiProvidersTab> {
  String? _busyProviderId;

  Map<String, dynamic> _map(dynamic value) =>
      Map<String, dynamic>.from(value as Map);

  Color _healthColor(String health) {
    switch (health) {
      case 'ACTIVE':
        return const Color(0xFF059669);
      case 'ACTIVE_LIMITED':
      case 'RATE_LIMITED':
        return const Color(0xFFD97706);
      case 'UNTESTED':
        return const Color(0xFF64748B);
      default:
        return const Color(0xFFDC2626);
    }
  }

  Future<void> _run(String id, Future<bool> Function() action) async {
    setState(() => _busyProviderId = id);
    final ok = await action();
    if (!mounted) return;
    setState(() => _busyProviderId = null);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          ok ? 'Provider data updated.' : 'The provider operation failed.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 700;
        return SingleChildScrollView(
          padding: EdgeInsets.all(compact ? 12 : 24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'AI Providers & Models',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 20,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Provider-reported quota, credential health, and accessible models.',
                              style: TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton.icon(
                        onPressed: widget.isLoading ? null : _openAddProvider,
                        icon: const Icon(Icons.add_rounded, size: 18),
                        label: const Text('Add Provider'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (widget.providers.isEmpty)
                    _emptyState()
                  else
                    ...widget.providers.map(
                      (raw) => _providerCard(_map(raw), compact),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _emptyState() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE2E8F0)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Column(
        children: [
          Icon(Icons.key_rounded, size: 42, color: Color(0xFF6366F1)),
          SizedBox(height: 12),
          Text(
            'No AI provider is configured yet.',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 4),
          Text('Add a provider, save its key, then test and discover models.'),
        ],
      ),
    );
  }

  Widget _providerCard(Map<String, dynamic> provider, bool compact) {
    final id = '${provider['id']}';
    final health = '${provider['credentialHealth'] ?? 'UNTESTED'}';
    final color = _healthColor(health);
    final quota = provider['quota'] is Map
        ? _map(provider['quota'])
        : <String, dynamic>{};
    final metrics = (quota['metrics'] as List<dynamic>?) ?? const [];
    final credentials = provider['credentials'] is Map
        ? _map(provider['credentials'])
        : <String, dynamic>{};
    final inference = credentials['inference'] is Map
        ? _map(credentials['inference'])
        : <String, dynamic>{};
    final isBusy = _busyProviderId == id;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: EdgeInsets.all(compact ? 14 : 18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(9),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4F46E5).withValues(alpha: .1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.hub_rounded,
                    color: Color(0xFF4F46E5),
                    size: 21,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${provider['name'] ?? ''}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        '${provider['identifier']} • ${inference['mask'] ?? 'No key'}',
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: .12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    health,
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                    ),
                  ),
                ),
              ],
            ),
            if (provider['credentialReason'] != null) ...[
              const SizedBox(height: 10),
              Text(
                '${provider['credentialReason']}',
                style: TextStyle(color: color, fontSize: 12),
              ),
            ],
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _infoChip(
                  Icons.speed_rounded,
                  provider['lastTestLatencyMs'] == null
                      ? 'Not tested'
                      : '${provider['lastTestLatencyMs']} ms',
                ),
                _infoChip(
                  Icons.auto_awesome_rounded,
                  '${provider['discoveredModelCount'] ?? 0} discovered models',
                ),
                _infoChip(
                  Icons.layers_rounded,
                  '${(provider['models'] as List<dynamic>?)?.length ?? 0} imported models',
                ),
                if (quota['scope'] != null)
                  _infoChip(
                    Icons.account_tree_outlined,
                    '${quota['scope']} quota',
                  ),
              ],
            ),
            const SizedBox(height: 12),
            _quotaPanel(quota, metrics),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ElevatedButton.icon(
                  onPressed: isBusy
                      ? null
                      : () => _run(id, () => widget.onTestProvider(id)),
                  icon: isBusy
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.health_and_safety_outlined, size: 17),
                  label: const Text('Test & Discover'),
                ),
                OutlinedButton.icon(
                  onPressed: isBusy
                      ? null
                      : () => _run(id, () => widget.onRefreshQuota(id)),
                  icon: const Icon(Icons.refresh_rounded, size: 17),
                  label: const Text('Refresh Quota'),
                ),
                OutlinedButton.icon(
                  onPressed: isBusy ? null : () => _openModels(provider),
                  icon: const Icon(Icons.view_list_outlined, size: 17),
                  label: const Text('Models'),
                ),
                TextButton.icon(
                  onPressed: isBusy
                      ? null
                      : () => _openConfigureProvider(provider: provider),
                  icon: const Icon(Icons.key_outlined, size: 17),
                  label: const Text('Replace Key'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _quotaPanel(Map<String, dynamic> quota, List<dynamic> metrics) {
    final availability = '${quota['availability'] ?? 'NOT_FETCHED'}';
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.data_usage_rounded,
                size: 17,
                color: Color(0xFF4F46E5),
              ),
              const SizedBox(width: 6),
              const Text(
                'Provider quota',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
              ),
              const Spacer(),
              Text(
                availability,
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 10),
              ),
            ],
          ),
          if (metrics.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: metrics.map((raw) {
                final metric = _map(raw);
                final value = (metric['value'] as num?)?.toDouble() ?? 0;
                final unit = '${metric['unit'] ?? ''}';
                final formatted = unit == 'USD'
                    ? '\$${value.toStringAsFixed(2)}'
                    : value.toStringAsFixed(value % 1 == 0 ? 0 : 2);
                return Text(
                  '${metric['label']}: $formatted',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                );
              }).toList(),
            ),
          ] else ...[
            const SizedBox(height: 6),
            Text(
              '${quota['note'] ?? 'No provider quota has been fetched yet.'}',
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
            ),
          ],
          if (quota['resetPolicy'] != null) ...[
            const SizedBox(height: 6),
            Text(
              'Resets: ${quota['resetPolicy']}',
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 10),
            ),
          ],
        ],
      ),
    );
  }

  Widget _infoChip(IconData icon, String label) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
    decoration: BoxDecoration(
      color: const Color(0xFFF1F5F9),
      borderRadius: BorderRadius.circular(8),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: const Color(0xFF64748B)),
        const SizedBox(width: 5),
        Text(label, style: const TextStyle(fontSize: 11)),
      ],
    ),
  );

  void _openAddProvider() {
    final available = widget.catalog
        .map(_map)
        .where((item) => item['configured'] != true)
        .toList();
    if (available.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('All available providers are already configured.'),
        ),
      );
      return;
    }
    _openConfigureProvider(catalogOptions: available);
  }

  Future<void> _openConfigureProvider({
    Map<String, dynamic>? provider,
    List<Map<String, dynamic>>? catalogOptions,
  }) async {
    final options = catalogOptions ?? widget.catalog.map(_map).toList();
    var selectedIdentifier =
        provider?['identifier']?.toString() ??
        options.first['identifier'].toString();
    final apiKeyController = TextEditingController();
    final managementController = TextEditingController();
    final baseUrlController = TextEditingController(
      text: provider?['baseUrl']?.toString() ?? '',
    );
    var obscureApi = true;
    var obscureManagement = true;
    var saving = false;

    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) {
          final definition = options.firstWhere(
            (item) => item['identifier'] == selectedIdentifier,
            orElse: () => {
              'identifier': selectedIdentifier,
              'name': provider?['name'] ?? selectedIdentifier,
            },
          );
          final editing = provider != null;
          return AlertDialog(
            title: Text(
              editing ? 'Replace Provider Credential' : 'Add AI Provider',
            ),
            content: SingleChildScrollView(
              child: SizedBox(
                width: 460,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<String>(
                      initialValue: selectedIdentifier,
                      decoration: const InputDecoration(labelText: 'Provider'),
                      items: options
                          .map(
                            (item) => DropdownMenuItem<String>(
                              value: '${item['identifier']}',
                              child: Text('${item['name']}'),
                            ),
                          )
                          .toList(),
                      onChanged: editing
                          ? null
                          : (value) {
                              if (value != null) {
                                setDialogState(
                                  () => selectedIdentifier = value,
                                );
                              }
                            },
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: apiKeyController,
                      obscureText: obscureApi,
                      autocorrect: false,
                      enableSuggestions: false,
                      decoration: InputDecoration(
                        labelText: editing
                            ? 'New API key (leave empty to keep saved key)'
                            : 'API key',
                        prefixIcon: const Icon(Icons.key_rounded),
                        suffixIcon: IconButton(
                          onPressed: () =>
                              setDialogState(() => obscureApi = !obscureApi),
                          icon: Icon(
                            obscureApi
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                          ),
                        ),
                      ),
                    ),
                    if (definition['supportsManagementKey'] == true) ...[
                      const SizedBox(height: 14),
                      TextField(
                        controller: managementController,
                        obscureText: obscureManagement,
                        autocorrect: false,
                        enableSuggestions: false,
                        decoration: InputDecoration(
                          labelText: 'Management key (optional)',
                          helperText:
                              'Used only when the provider requires it for usage or credits.',
                          suffixIcon: IconButton(
                            onPressed: () => setDialogState(
                              () => obscureManagement = !obscureManagement,
                            ),
                            icon: Icon(
                              obscureManagement
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                            ),
                          ),
                        ),
                      ),
                    ],
                    if (selectedIdentifier == 'custom-openai-compatible') ...[
                      const SizedBox(height: 14),
                      TextField(
                        controller: baseUrlController,
                        decoration: const InputDecoration(
                          labelText: 'HTTPS base URL',
                          hintText: 'https://example.com/v1',
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: saving ? null : () => Navigator.pop(dialogContext),
                child: const Text('Cancel'),
              ),
              ElevatedButton.icon(
                onPressed: saving
                    ? null
                    : () async {
                        if (!editing && apiKeyController.text.trim().isEmpty) {
                          return;
                        }
                        setDialogState(() => saving = true);
                        final ok = await widget.onSaveProvider(
                          identifier: selectedIdentifier,
                          apiKey: apiKeyController.text.trim(),
                          managementKey:
                              managementController.text.trim().isEmpty
                              ? null
                              : managementController.text.trim(),
                          baseUrl: baseUrlController.text.trim().isEmpty
                              ? null
                              : baseUrlController.text.trim(),
                        );
                        if (dialogContext.mounted && ok) {
                          Navigator.pop(dialogContext);
                        }
                        if (dialogContext.mounted && !ok) {
                          setDialogState(() => saving = false);
                        }
                      },
                icon: saving
                    ? const SizedBox(
                        width: 15,
                        height: 15,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.save_outlined, size: 17),
                label: const Text('Save & Test'),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _openModels(Map<String, dynamic> provider) async {
    var models = List<dynamic>.from(
      provider['discoveredModels'] as List<dynamic>? ?? const [],
    );
    final selected = <String>{};
    var loading = false;

    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text('${provider['name']} Models'),
          content: SizedBox(
            width: 620,
            height: 430,
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${models.length} models returned by the provider',
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: loading
                          ? null
                          : () async {
                              setDialogState(() => loading = true);
                              models = await widget.onDiscoverModels(
                                '${provider['id']}',
                              );
                              if (dialogContext.mounted) {
                                setDialogState(() => loading = false);
                              }
                            },
                      icon: const Icon(Icons.sync_rounded, size: 17),
                      label: const Text('Sync'),
                    ),
                  ],
                ),
                const Divider(),
                Expanded(
                  child: loading
                      ? const Center(child: CircularProgressIndicator())
                      : models.isEmpty
                      ? const Center(
                          child: Text(
                            'Run model discovery to see accessible models.',
                          ),
                        )
                      : ListView.builder(
                          itemCount: models.length,
                          itemBuilder: (context, index) {
                            final model = _map(models[index]);
                            final id = '${model['id']}';
                            return CheckboxListTile(
                              value: selected.contains(id),
                              onChanged: (value) => setDialogState(() {
                                value == true
                                    ? selected.add(id)
                                    : selected.remove(id);
                              }),
                              title: Text('${model['displayName'] ?? id}'),
                              subtitle: Text(
                                '$id • ${model['contextWindow'] ?? 0} tokens',
                              ),
                              dense: true,
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Close'),
            ),
            ElevatedButton.icon(
              onPressed: selected.isEmpty
                  ? null
                  : () async {
                      final ok = await widget.onImportModels(
                        '${provider['id']}',
                        selected.toList(),
                      );
                      if (dialogContext.mounted && ok) {
                        Navigator.pop(dialogContext);
                      }
                    },
              icon: const Icon(Icons.download_done_rounded, size: 17),
              label: Text('Import ${selected.length}'),
            ),
          ],
        ),
      ),
    );
  }
}
