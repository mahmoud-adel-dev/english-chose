import 'package:flutter/material.dart';

class GoogleAuthTab extends StatefulWidget {
  final Map<String, dynamic>? configuration;
  final Future<bool> Function(Map<String, dynamic> value) onSave;

  const GoogleAuthTab({
    super.key,
    required this.configuration,
    required this.onSave,
  });

  @override
  State<GoogleAuthTab> createState() => _GoogleAuthTabState();
}

class _GoogleAuthTabState extends State<GoogleAuthTab> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _webClientId;
  late final TextEditingController _androidClientId;
  late final TextEditingController _iosClientId;
  late final TextEditingController _clientSecret;
  late final TextEditingController _apiKey;
  late bool _enabled;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final config = widget.configuration ?? const <String, dynamic>{};
    _enabled = config['enabled'] == true;
    _webClientId = TextEditingController(
      text: config['webClientId']?.toString() ?? '',
    );
    _androidClientId = TextEditingController(
      text: config['androidClientId']?.toString() ?? '',
    );
    _iosClientId = TextEditingController(
      text: config['iosClientId']?.toString() ?? '',
    );
    _clientSecret = TextEditingController();
    _apiKey = TextEditingController();
  }

  @override
  void didUpdateWidget(covariant GoogleAuthTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.configuration == null && widget.configuration != null) {
      final config = widget.configuration!;
      _enabled = config['enabled'] == true;
      _webClientId.text = config['webClientId']?.toString() ?? '';
      _androidClientId.text = config['androidClientId']?.toString() ?? '';
      _iosClientId.text = config['iosClientId']?.toString() ?? '';
    }
  }

  @override
  void dispose() {
    _webClientId.dispose();
    _androidClientId.dispose();
    _iosClientId.dispose();
    _clientSecret.dispose();
    _apiKey.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final value = <String, dynamic>{
      'enabled': _enabled,
      'webClientId': _webClientId.text.trim(),
      'androidClientId': _androidClientId.text.trim(),
      'iosClientId': _iosClientId.text.trim(),
      if (_clientSecret.text.trim().isNotEmpty)
        'clientSecret': _clientSecret.text.trim(),
      if (_apiKey.text.trim().isNotEmpty) 'apiKey': _apiKey.text.trim(),
    };
    final ok = await widget.onSave(value);
    if (!mounted) return;
    setState(() => _saving = false);
    if (ok) {
      _clientSecret.clear();
      _apiKey.clear();
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Google settings saved.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final config = widget.configuration ?? const <String, dynamic>{};
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Google Sign-In',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Enter OAuth credentials from Google Cloud. The app uses the Web client ID to request and verify ID tokens; an API key is not required for login.',
                ),
                const SizedBox(height: 16),
                SwitchListTile(
                  value: _enabled,
                  onChanged: (value) => setState(() => _enabled = value),
                  title: const Text('Enable Google login'),
                ),
                TextFormField(
                  controller: _webClientId,
                  decoration: const InputDecoration(
                    labelText: 'Web OAuth client ID (required)',
                  ),
                  validator: (value) {
                    if (!_enabled) return null;
                    if (value == null ||
                        !value.trim().endsWith('.apps.googleusercontent.com')) {
                      return 'Enter a valid Web OAuth client ID';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _androidClientId,
                  decoration: const InputDecoration(
                    labelText: 'Android OAuth client ID (reference)',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _iosClientId,
                  decoration: const InputDecoration(
                    labelText: 'iOS OAuth client ID (optional)',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _clientSecret,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Client secret (optional; leave blank to keep)',
                    helperText: config['clientSecretConfigured'] == true
                        ? 'Stored encrypted; ends in ${config['clientSecretLastFour']}'
                        : 'Not configured',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _apiKey,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Google API key (optional; not used for login)',
                    helperText: config['apiKeyConfigured'] == true
                        ? 'Stored encrypted; ends in ${config['apiKeyLastFour']}'
                        : 'Not configured',
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _saving ? null : _save,
                  child: Text(_saving ? 'Saving...' : 'Save Google settings'),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Google Cloud must also contain an Android OAuth client with this app package name and the SHA-1/SHA-256 fingerprints of every signing key.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
