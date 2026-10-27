import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/app_provider.dart';
import 'ai_providers_tab.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().fetchAdminData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(
              Icons.admin_panel_settings_rounded,
              color: AppTheme.primaryColor,
            ),
            SizedBox(width: 8),
            Flexible(
              child: Text('AI Governance', overflow: TextOverflow.ellipsis),
            ),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: const Color(0xFF64748B),
          indicatorColor: AppTheme.primaryColor,
          tabs: const [
            Tab(
              icon: Icon(Icons.analytics_outlined),
              text: 'Costs & Analytics',
            ),
            Tab(icon: Icon(Icons.smart_toy_outlined), text: 'AI Models'),
            Tab(icon: Icon(Icons.alt_route_rounded), text: 'Task Routings'),
            Tab(icon: Icon(Icons.people_outline_rounded), text: 'Users'),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh Data',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => provider.fetchAdminData(),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: provider.isAdminLoading && provider.adminAnalytics == null
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildAnalyticsTab(provider),
                _buildModelsTab(provider),
                _buildRoutingsTab(provider),
                _buildUsersTab(provider),
              ],
            ),
    );
  }

  // --- TAB 1: COSTS & ANALYTICS ---
  Widget _buildAnalyticsTab(AppProvider provider) {
    final analytics = provider.adminAnalytics;
    if (analytics == null) {
      return const Center(child: Text('No analytics data available.'));
    }

    final summary = analytics['summary'] ?? {};
    final recentLogs = (analytics['recentLogs'] as List<dynamic>?) ?? [];
    final modelBreakdown =
        (analytics['modelBreakdown'] as List<dynamic>?) ?? [];
    final taskBreakdown = (analytics['taskBreakdown'] as List<dynamic>?) ?? [];

    final double totalCost =
        (summary['totalCostUsd'] as num?)?.toDouble() ?? 0.0;
    final int totalRequests = (summary['totalRequests'] as num?)?.toInt() ?? 0;
    final int totalTokens = (summary['totalTokens'] as num?)?.toInt() ?? 0;
    final int avgLatency = (summary['avgLatencyMs'] as num?)?.toInt() ?? 0;
    final int errors = (summary['errorCount'] as num?)?.toInt() ?? 0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final bool isMobile = constraints.maxWidth < 700;

        return SingleChildScrollView(
          padding: EdgeInsets.all(isMobile ? 12 : 24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1000),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Responsive KPI Cards
                  if (isMobile)
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                      childAspectRatio: 1.45,
                      children: [
                        _buildKpiCard(
                          'Total API Cost',
                          '\$${totalCost.toStringAsFixed(4)}',
                          'USD estimated',
                          Icons.attach_money_rounded,
                          const Color(0xFF059669),
                        ),
                        _buildKpiCard(
                          'Invocations',
                          '$totalRequests',
                          'API calls',
                          Icons.bolt_rounded,
                          AppTheme.primaryColor,
                        ),
                        _buildKpiCard(
                          'Tokens',
                          '$totalTokens',
                          'In + Out',
                          Icons.token_rounded,
                          const Color(0xFF2563EB),
                        ),
                        _buildKpiCard(
                          'Avg Latency',
                          '${avgLatency}ms',
                          'Speed',
                          Icons.speed_rounded,
                          const Color(0xFFD97706),
                        ),
                        _buildKpiCard(
                          'Failed Calls',
                          '$errors',
                          'Status >= 400',
                          Icons.error_outline_rounded,
                          AppTheme.errorColor,
                        ),
                      ],
                    )
                  else
                    Row(
                      children: [
                        Expanded(
                          child: _buildKpiCard(
                            'Total API Cost',
                            '\$${totalCost.toStringAsFixed(4)}',
                            'USD estimated',
                            Icons.attach_money_rounded,
                            const Color(0xFF059669),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildKpiCard(
                            'Invocations',
                            '$totalRequests',
                            'Total calls',
                            Icons.bolt_rounded,
                            AppTheme.primaryColor,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildKpiCard(
                            'Tokens',
                            '$totalTokens',
                            'In + Out',
                            Icons.token_rounded,
                            const Color(0xFF2563EB),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildKpiCard(
                            'Avg Latency',
                            '${avgLatency}ms',
                            'Speed',
                            Icons.speed_rounded,
                            const Color(0xFFD97706),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildKpiCard(
                            'Errors',
                            '$errors',
                            'Failed',
                            Icons.error_outline_rounded,
                            AppTheme.errorColor,
                          ),
                        ),
                      ],
                    ),
                  const SizedBox(height: 20),

                  // Responsive Breakdowns (Row on Desktop, Column on Mobile)
                  if (isMobile) ...[
                    _buildModelBreakdownCard(modelBreakdown),
                    const SizedBox(height: 16),
                    _buildTaskBreakdownCard(taskBreakdown),
                  ] else ...[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: _buildModelBreakdownCard(modelBreakdown),
                        ),
                        const SizedBox(width: 16),
                        Expanded(child: _buildTaskBreakdownCard(taskBreakdown)),
                      ],
                    ),
                  ],
                  const SizedBox(height: 20),

                  // Recent Invocations Log Table
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Live AI Usage Logs',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              Text(
                                '${recentLogs.length} logs',
                                style: const TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (recentLogs.isEmpty)
                            const Padding(
                              padding: EdgeInsets.all(20),
                              child: Center(
                                child: Text('No AI calls logged yet.'),
                              ),
                            )
                          else
                            ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: recentLogs.length,
                              separatorBuilder: (_, _) =>
                                  const Divider(height: 1),
                              itemBuilder: (context, index) {
                                final log = recentLogs[index];
                                final bool isSuccess =
                                    (log['statusCode'] as int? ?? 500) < 400;
                                final bool isFallback =
                                    log['isFallback'] == true;

                                return Padding(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 8,
                                  ),
                                  child: Row(
                                    children: [
                                      // Status Badge
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 6,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: isFallback
                                              ? AppTheme.warningColor
                                                    .withValues(alpha: 0.15)
                                              : isSuccess
                                              ? AppTheme.successColor
                                                    .withValues(alpha: 0.15)
                                              : AppTheme.errorColor.withValues(
                                                  alpha: 0.15,
                                                ),
                                          borderRadius: BorderRadius.circular(
                                            4,
                                          ),
                                        ),
                                        child: Text(
                                          isFallback
                                              ? 'FALLBACK'
                                              : '${log['statusCode']}',
                                          style: TextStyle(
                                            color: isFallback
                                                ? AppTheme.warningColor
                                                : isSuccess
                                                ? AppTheme.successColor
                                                : AppTheme.errorColor,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      // Task & Model
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              log['taskType'] ?? '',
                                              style: const TextStyle(
                                                fontWeight: FontWeight.w700,
                                                fontSize: 12,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            Text(
                                              '${log['model']}',
                                              style: const TextStyle(
                                                color: Color(0xFF64748B),
                                                fontSize: 11,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      // Tokens & Latency
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.end,
                                        children: [
                                          Text(
                                            '${(log['promptTokens'] ?? 0) + (log['completionTokens'] ?? 0)} tok',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w600,
                                              fontSize: 11,
                                            ),
                                          ),
                                          Text(
                                            '${log['durationMs']}ms',
                                            style: const TextStyle(
                                              color: Color(0xFF94A3B8),
                                              fontSize: 10,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildModelBreakdownCard(List<dynamic> modelBreakdown) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'By AI Model',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            const SizedBox(height: 12),
            if (modelBreakdown.isEmpty)
              const Text('No model data.')
            else
              ...modelBreakdown.map((m) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          m['name'] ?? '',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        '${m['requests']} calls',
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '\$${((m['costUsd'] as num?)?.toDouble() ?? 0).toStringAsFixed(4)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  Widget _buildTaskBreakdownCard(List<dynamic> taskBreakdown) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'By Task Type',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            const SizedBox(height: 12),
            if (taskBreakdown.isEmpty)
              const Text('No task data.')
            else
              ...taskBreakdown.map((t) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          t['taskType'] ?? '',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        '${t['requests']} calls',
                        style: const TextStyle(
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  Widget _buildKpiCard(
    String title,
    String value,
    String subtitle,
    IconData icon,
    Color color,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Icon(icon, color: color, size: 16),
              ],
            ),
            const SizedBox(height: 4),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(
                value,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: color,
                ),
              ),
            ),
            Text(
              subtitle,
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // --- TAB 2: AI MODELS & PROVIDERS ---
  Widget _buildModelsTab(AppProvider provider) {
    return AiProvidersTab(
      catalog: provider.adminProviderCatalog,
      providers: provider.adminProviders,
      isLoading: provider.isAdminLoading,
      onSaveProvider: provider.saveAndTestProvider,
      onTestProvider: provider.testAdminProvider,
      onRefreshQuota: provider.refreshAdminProviderQuota,
      onDiscoverModels: provider.discoverAdminProviderModels,
      onImportModels: provider.importAdminProviderModels,
    );
  }

  // Kept temporarily as a reference while the new provider workspace replaces it.
  // ignore: unused_element
  Widget _buildLegacyModelsTab(AppProvider provider) {
    final providers = provider.adminProviders;
    final models = provider.adminModels;

    return LayoutBuilder(
      builder: (context, constraints) {
        final bool isMobile = constraints.maxWidth < 650;

        return SingleChildScrollView(
          padding: EdgeInsets.all(isMobile ? 12 : 24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1000),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Flexible(
                        child: Text(
                          'AI Providers & Models',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      ElevatedButton.icon(
                        onPressed: () => _showAddModelDialog(context, provider),
                        icon: const Icon(Icons.add_rounded, size: 18),
                        label: const Text('Add Model'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Providers list
                  ...providers.map((p) {
                    final providerModels = models
                        .where((m) => m['providerId'] == p['id'])
                        .toList();
                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryColor.withValues(
                                      alpha: 0.1,
                                    ),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(
                                    Icons.hub_rounded,
                                    color: AppTheme.primaryColor,
                                    size: 18,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        p['name'] ?? '',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 15,
                                        ),
                                      ),
                                      Text(
                                        '${p['identifier']}',
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
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppTheme.successColor.withValues(
                                      alpha: 0.15,
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    p['status'] ?? 'ACTIVE',
                                    style: const TextStyle(
                                      color: AppTheme.successColor,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            const Divider(height: 1),
                            const SizedBox(height: 8),

                            if (providerModels.isEmpty)
                              const Text(
                                'No models configured.',
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontSize: 12,
                                ),
                              )
                            else
                              ...providerModels.map((m) {
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: const Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              m['displayName'] ?? '',
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 13,
                                              ),
                                            ),
                                            Text(
                                              '${m['modelIdentifier']} • ${(m['contextWindow'] as num? ?? 0) ~/ 1000}k tok',
                                              style: const TextStyle(
                                                color: Color(0xFF64748B),
                                                fontSize: 11,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Icon(
                                        m['isActive'] == true
                                            ? Icons.check_circle
                                            : Icons.pause_circle_outline,
                                        color: m['isActive'] == true
                                            ? AppTheme.successColor
                                            : Colors.grey,
                                        size: 18,
                                      ),
                                    ],
                                  ),
                                );
                              }),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _showAddModelDialog(BuildContext context, AppProvider provider) {
    final providers = provider.adminProviders;
    if (providers.isEmpty) return;

    String selectedProviderId = providers[0]['id'];
    final idController = TextEditingController();
    final nameController = TextEditingController();
    final contextController = TextEditingController(text: '128000');
    final inCostController = TextEditingController(text: '0.0015');
    final outCostController = TextEditingController(text: '0.006');

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setDialogState) {
            return AlertDialog(
              title: const Text('Add New AI Model'),
              content: SingleChildScrollView(
                child: SizedBox(
                  width: 400,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      DropdownButtonFormField<String>(
                        initialValue: selectedProviderId,
                        decoration: const InputDecoration(
                          labelText: 'Provider',
                        ),
                        items: providers.map<DropdownMenuItem<String>>((p) {
                          return DropdownMenuItem(
                            value: p['id'].toString(),
                            child: Text(p['name'] ?? ''),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setDialogState(() => selectedProviderId = val);
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: idController,
                        decoration: const InputDecoration(
                          labelText: 'Model Identifier (e.g. gpt-4o)',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: nameController,
                        decoration: const InputDecoration(
                          labelText: 'Display Name (e.g. GPT-4o Omni)',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: contextController,
                        decoration: const InputDecoration(
                          labelText: 'Context Window (Tokens)',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: inCostController,
                              decoration: const InputDecoration(
                                labelText: 'Cost/1k In (\$)',
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextField(
                              controller: outCostController,
                              decoration: const InputDecoration(
                                labelText: 'Cost/1k Out (\$)',
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (idController.text.trim().isEmpty ||
                        nameController.text.trim().isEmpty) {
                      return;
                    }
                    await provider.createModel(
                      providerId: selectedProviderId,
                      modelIdentifier: idController.text.trim(),
                      displayName: nameController.text.trim(),
                      contextWindow: int.tryParse(contextController.text),
                      costPerInput1k: double.tryParse(inCostController.text),
                      costPerOutput1k: double.tryParse(outCostController.text),
                    );
                    if (ctx.mounted) Navigator.pop(ctx);
                  },
                  child: const Text('Add Model'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  // --- TAB 3: TASK ROUTINGS ---
  Widget _buildRoutingsTab(AppProvider provider) {
    final routings = provider.adminRoutings;
    final models = provider.adminModels;

    return LayoutBuilder(
      builder: (context, constraints) {
        final bool isMobile = constraints.maxWidth < 650;

        return SingleChildScrollView(
          padding: EdgeInsets.all(isMobile ? 12 : 24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1000),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'AI Task Dispatch & Dynamic Fallbacks',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Configure primary and fallback models per educational task.',
                    style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
                  ),
                  const SizedBox(height: 16),

                  ...routings.map((r) {
                    return _RoutingCard(
                      routing: r,
                      allModels: models,
                      isMobile: isMobile,
                      onSave: (updatedData) async {
                        await provider.updateRouting(
                          id: r['id'],
                          primaryModelId: updatedData['primaryModelId'],
                          fallbackModelId: updatedData['fallbackModelId'],
                          temperature: updatedData['temperature'],
                          systemPromptTpl: updatedData['systemPromptTpl'],
                        );
                      },
                    );
                  }),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // --- TAB 4: USERS ---
  Widget _buildUsersTab(AppProvider provider) {
    final users = provider.adminUsers;

    return LayoutBuilder(
      builder: (context, constraints) {
        final bool isMobile = constraints.maxWidth < 650;

        return SingleChildScrollView(
          padding: EdgeInsets.all(isMobile ? 12 : 24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1000),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Registered Users',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          Text(
                            '${users.length} Users',
                            style: const TextStyle(
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: users.length,
                        separatorBuilder: (_, _) => const Divider(),
                        itemBuilder: (context, index) {
                          final u = users[index];
                          final profile = u['profile'];
                          final bool isSuper = u['role'] == 'SUPER_ADMIN';

                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: CircleAvatar(
                              backgroundColor: isSuper
                                  ? AppTheme.primaryColor
                                  : const Color(0xFFE2E8F0),
                              foregroundColor: isSuper
                                  ? Colors.white
                                  : const Color(0xFF0F172A),
                              child: Text(
                                (u['name'] ?? 'U')[0].toUpperCase(),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            title: Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    u['name'] ?? '',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isSuper
                                        ? AppTheme.primaryColor.withValues(
                                            alpha: 0.1,
                                          )
                                        : const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    u['role'] ?? 'STUDENT',
                                    style: TextStyle(
                                      color: isSuper
                                          ? AppTheme.primaryColor
                                          : const Color(0xFF64748B),
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            subtitle: Text(
                              u['email'] ?? '',
                              style: const TextStyle(fontSize: 11),
                            ),
                            trailing: profile != null
                                ? Text(
                                    '${profile['currentLevel']} • 🔥${profile['dailyStreak']}d',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  )
                                : null,
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

// Sub-widget for editing single Routing
class _RoutingCard extends StatefulWidget {
  final dynamic routing;
  final List<dynamic> allModels;
  final bool isMobile;
  final Function(Map<String, dynamic>) onSave;

  const _RoutingCard({
    required this.routing,
    required this.allModels,
    required this.isMobile,
    required this.onSave,
  });

  @override
  State<_RoutingCard> createState() => _RoutingCardState();
}

class _RoutingCardState extends State<_RoutingCard> {
  late String _primaryModelId;
  String? _fallbackModelId;
  late double _temperature;
  late TextEditingController _promptController;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _primaryModelId = widget.routing['primaryModelId'] ?? '';
    _fallbackModelId = widget.routing['fallbackModelId'];
    _temperature = (widget.routing['temperature'] as num?)?.toDouble() ?? 0.3;
    _promptController = TextEditingController(
      text: widget.routing['systemPromptTpl'] ?? '',
    );
  }

  @override
  void dispose() {
    _promptController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    widget.routing['taskType'] ?? '',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _isSaving
                      ? null
                      : () async {
                          setState(() => _isSaving = true);
                          await widget.onSave({
                            'primaryModelId': _primaryModelId,
                            'fallbackModelId': _fallbackModelId,
                            'temperature': _temperature,
                            'systemPromptTpl': _promptController.text,
                          });
                          setState(() => _isSaving = false);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Routing updated successfully!'),
                              ),
                            );
                          }
                        },
                  icon: _isSaving
                      ? const SizedBox(
                          width: 12,
                          height: 12,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.save_rounded, size: 16),
                  label: Text(_isSaving ? '...' : 'Save'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 12),

            // Dropdowns (Column on Mobile, Row on Desktop)
            if (widget.isMobile) ...[
              DropdownButtonFormField<String>(
                initialValue:
                    widget.allModels.any((m) => m['id'] == _primaryModelId)
                    ? _primaryModelId
                    : null,
                decoration: const InputDecoration(labelText: 'Primary Model'),
                items: widget.allModels.map<DropdownMenuItem<String>>((m) {
                  return DropdownMenuItem(
                    value: m['id'].toString(),
                    child: Text(
                      m['displayName'] ?? '',
                      overflow: TextOverflow.ellipsis,
                    ),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _primaryModelId = val);
                },
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String?>(
                initialValue:
                    widget.allModels.any((m) => m['id'] == _fallbackModelId)
                    ? _fallbackModelId
                    : null,
                decoration: const InputDecoration(labelText: 'Fallback Model'),
                items: [
                  const DropdownMenuItem<String?>(
                    value: null,
                    child: Text('None (No Fallback)'),
                  ),
                  ...widget.allModels.map<DropdownMenuItem<String?>>((m) {
                    return DropdownMenuItem(
                      value: m['id'].toString(),
                      child: Text(
                        m['displayName'] ?? '',
                        overflow: TextOverflow.ellipsis,
                      ),
                    );
                  }),
                ],
                onChanged: (val) {
                  setState(() => _fallbackModelId = val);
                },
              ),
            ] else ...[
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue:
                          widget.allModels.any(
                            (m) => m['id'] == _primaryModelId,
                          )
                          ? _primaryModelId
                          : null,
                      decoration: const InputDecoration(
                        labelText: 'Primary Model',
                      ),
                      items: widget.allModels.map<DropdownMenuItem<String>>((
                        m,
                      ) {
                        return DropdownMenuItem(
                          value: m['id'].toString(),
                          child: Text(m['displayName'] ?? ''),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _primaryModelId = val);
                      },
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: DropdownButtonFormField<String?>(
                      initialValue:
                          widget.allModels.any(
                            (m) => m['id'] == _fallbackModelId,
                          )
                          ? _fallbackModelId
                          : null,
                      decoration: const InputDecoration(
                        labelText: 'Fallback Model',
                      ),
                      items: [
                        const DropdownMenuItem<String?>(
                          value: null,
                          child: Text('None (No Fallback)'),
                        ),
                        ...widget.allModels.map<DropdownMenuItem<String?>>((m) {
                          return DropdownMenuItem(
                            value: m['id'].toString(),
                            child: Text(m['displayName'] ?? ''),
                          );
                        }),
                      ],
                      onChanged: (val) {
                        setState(() => _fallbackModelId = val);
                      },
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 12),

            // Temperature Slider
            Row(
              children: [
                Text(
                  'Temp: ${_temperature.toStringAsFixed(1)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
                Expanded(
                  child: Slider(
                    value: _temperature,
                    min: 0.0,
                    max: 1.0,
                    divisions: 10,
                    label: _temperature.toStringAsFixed(1),
                    onChanged: (val) => setState(() => _temperature = val),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Prompt Template
            TextField(
              controller: _promptController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'System Prompt Template',
                hintText: 'Enter AI instructions...',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
