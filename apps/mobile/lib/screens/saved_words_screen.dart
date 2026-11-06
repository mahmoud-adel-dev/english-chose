import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/app_provider.dart';
import '../widgets/save_word_dialog.dart';

class SavedWordsScreen extends StatefulWidget {
  const SavedWordsScreen({super.key});

  @override
  State<SavedWordsScreen> createState() => _SavedWordsScreenState();
}

class _SavedWordsScreenState extends State<SavedWordsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().fetchSavedWords();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Saved Words'),
        actions: [
          IconButton(
            tooltip: 'Add word',
            onPressed: () => _showAddDialog(context),
            icon: const Icon(Icons.add_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: provider.fetchSavedWords,
        child: provider.savedWords.isEmpty
            ? ListView(
                children: const [
                  SizedBox(height: 140),
                  Icon(
                    Icons.bookmark_border_rounded,
                    size: 64,
                    color: Color(0xFF94A3B8),
                  ),
                  SizedBox(height: 16),
                  Center(child: Text('No saved words yet.')),
                ],
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: provider.savedWords.length,
                separatorBuilder: (context, index) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final item = provider.savedWords[index];
                  return Card(
                    child: ListTile(
                      leading: const CircleAvatar(
                        backgroundColor: Color(0xFFEFF6FF),
                        child: Icon(
                          Icons.menu_book_rounded,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                      title: Text(
                        item['word']?.toString() ?? '',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item['translation']?.toString() ?? ''),
                          if ((item['exampleSentence']?.toString() ?? '')
                              .isNotEmpty)
                            Text(
                              item['exampleSentence'].toString(),
                              style: const TextStyle(color: Color(0xFF64748B)),
                            ),
                        ],
                      ),
                      trailing: IconButton(
                        tooltip: 'Delete',
                        onPressed: () =>
                            provider.deleteSavedWord(item['id'].toString()),
                        icon: const Icon(
                          Icons.delete_outline_rounded,
                          color: AppTheme.errorColor,
                        ),
                      ),
                    ),
                  );
                },
              ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddDialog(context),
        icon: const Icon(Icons.add),
        label: const Text('Add Word'),
      ),
    );
  }

  Future<void> _showAddDialog(BuildContext context) async {
    await showSaveWordDialog(context);
  }
}
