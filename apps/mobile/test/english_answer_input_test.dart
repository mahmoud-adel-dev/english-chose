import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/widgets/english_answer_formatter.dart';

void main() {
  test('removes Arabic characters from typed assessment answers', () {
    final result = englishAnswerFormatter.formatEditUpdate(
      const TextEditingValue(text: 'I like '),
      const TextEditingValue(text: 'I like كرة القدم'),
    );

    expect(result.text, 'I like  ');
  });

  test('keeps normal English punctuation and contractions', () {
    const value = TextEditingValue(text: "I don't know, but I'll try!");
    expect(
      englishAnswerFormatter.formatEditUpdate(TextEditingValue.empty, value),
      value,
    );
  });
}
