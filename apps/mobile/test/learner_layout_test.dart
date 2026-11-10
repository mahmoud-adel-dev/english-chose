import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/config/theme.dart';
import 'package:mobile/models/conversation.dart';
import 'package:mobile/providers/app_provider.dart';
import 'package:mobile/screens/assessment_screen.dart';
import 'package:mobile/screens/conversation/conversation_coach_screen.dart';
import 'package:mobile/widgets/learning_banner.dart';
import 'package:provider/provider.dart';
import 'calm_home_test.dart' show PreviewProvider;

class ChatPreviewProvider extends PreviewProvider {
  @override
  ConversationSessionModel get currentConversation =>
      ConversationSessionModel.fromJson({
        'id': 'preview-chat',
        'targetLevel': 'A2',
        'messages': [
          {
            'id': 'm1',
            'role': 'assistant',
            'content': 'What would you like to talk about today?',
          },
        ],
      });
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('flutter_tts'),
          (_) async => 1,
        );
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('plugin.csdcorp.com/speech_to_text'),
          (call) async => call.method == 'initialize' ? false : null,
        );
  });
  testWidgets('assessment introduction fits a 320px screen', (tester) async {
    tester.view.physicalSize = const Size(320, 740);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(
      ChangeNotifierProvider<AppProvider>.value(
        value: PreviewProvider(),
        child: MaterialApp(
          theme: AppTheme.lightTheme,
          home: AssessmentScreen(onFinish: () {}),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('C2'), findsWidgets);
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox());
    await tester.pump();
  });
  testWidgets('chat introduction scrolls with the messages', (tester) async {
    tester.view.physicalSize = const Size(390, 700);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(
      ChangeNotifierProvider<AppProvider>.value(
        value: ChatPreviewProvider(),
        child: MaterialApp(
          theme: AppTheme.lightTheme,
          home: ConversationCoachScreen(onBackToHome: () {}),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(
      find.ancestor(
        of: find.byType(LearningBanner),
        matching: find.byType(Scrollable),
      ),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox());
    await tester.pump();
  });
}
