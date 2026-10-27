import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/screens/admin/ai_providers_tab.dart';

void main() {
  testWidgets(
    'shows provider health, provider quota, and discovered model count',
    (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AiProvidersTab(
              catalog: const [
                {
                  'identifier': 'openrouter',
                  'name': 'OpenRouter',
                  'configured': true,
                  'supportsManagementKey': true,
                },
              ],
              providers: const [
                {
                  'id': 'provider-1',
                  'identifier': 'openrouter',
                  'name': 'OpenRouter',
                  'credentialHealth': 'ACTIVE',
                  'lastTestLatencyMs': 123,
                  'discoveredModelCount': 42,
                  'credentials': {
                    'inference': {'configured': true, 'mask': '••••7890'},
                  },
                  'quota': {
                    'availability': 'AVAILABLE',
                    'scope': 'API_KEY',
                    'resetPolicy': 'monthly',
                    'metrics': [
                      {
                        'key': 'remaining',
                        'label': 'Remaining',
                        'value': 74.5,
                        'unit': 'USD',
                      },
                    ],
                  },
                  'discoveredModels': [],
                  'models': [],
                },
              ],
              onSaveProvider: _save,
              onTestProvider: _action,
              onRefreshQuota: _action,
              onDiscoverModels: _discover,
              onImportModels: _import,
            ),
          ),
        ),
      );

      expect(find.text('OpenRouter'), findsOneWidget);
      expect(find.text('ACTIVE'), findsOneWidget);
      expect(find.textContaining(r'Remaining: $74.50'), findsOneWidget);
      expect(find.text('42 discovered models'), findsOneWidget);
      expect(find.text('Add Provider'), findsOneWidget);
    },
  );
}

Future<bool> _save({
  required String identifier,
  required String apiKey,
  String? managementKey,
  String? baseUrl,
}) async => true;

Future<bool> _action(String _) async => true;
Future<List<dynamic>> _discover(String _) async => [];
Future<bool> _import(String _, List<String> modelIds) async => true;
