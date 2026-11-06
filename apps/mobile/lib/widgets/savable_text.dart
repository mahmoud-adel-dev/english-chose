import 'package:flutter/material.dart';

String? normalizeSelectedWord(String value) {
  final normalized = value
      .trim()
      .replaceFirst(RegExp(r'^[^A-Za-z]+'), '')
      .replaceFirst(RegExp(r'[^A-Za-z]+$'), '')
      .toLowerCase();
  return RegExp(r"^[a-z]+(?:[-'][a-z]+)*$").hasMatch(normalized)
      ? normalized
      : null;
}

class SavableText extends StatelessWidget {
  final String data;
  final TextStyle? style;
  final TextAlign? textAlign;
  final TextDirection? textDirection;
  final Future<void> Function(String word) onSaveWord;

  const SavableText(
    this.data, {
    super.key,
    required this.onSaveWord,
    this.style,
    this.textAlign,
    this.textDirection,
  });

  @override
  Widget build(BuildContext context) {
    return SelectableText(
      data,
      style: style,
      textAlign: textAlign,
      textDirection: textDirection,
      contextMenuBuilder: (context, editableTextState) {
        final value = editableTextState.textEditingValue;
        final selectedText = value.selection.isValid
            ? value.selection.textInside(value.text)
            : '';
        final selectedWord = normalizeSelectedWord(selectedText);
        final items = [...editableTextState.contextMenuButtonItems];

        if (selectedWord != null) {
          items.add(
            ContextMenuButtonItem(
              label: 'Save word',
              onPressed: () {
                editableTextState.hideToolbar();
                onSaveWord(selectedWord);
              },
            ),
          );
        }

        return AdaptiveTextSelectionToolbar.buttonItems(
          anchors: editableTextState.contextMenuAnchors,
          buttonItems: items,
        );
      },
    );
  }
}
