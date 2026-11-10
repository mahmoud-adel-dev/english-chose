import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/config/theme.dart';
import 'package:mobile/providers/app_provider.dart';
import 'package:mobile/screens/auth_screen.dart';
import 'package:mobile/screens/home_screen.dart';
import 'package:provider/provider.dart';
import 'calm_home_test.dart' show PreviewProvider;

// Explicit, opt-in screenshot export for reviewing the real Flutter widgets.
class PreviewAuthProvider extends AppProvider {
  @override
  Future<void> fetchGoogleAuthConfig() async {}
}

void main() {
  final output = Platform.environment['PREVIEW_OUTPUT_DIR'];
  if (output == null) return;
  testWidgets('export real home and authentication previews', (tester) async {
    final fonts = FontLoader('CoachArabic')
      ..addFont(rootBundle.load('assets/fonts/CoachArabic.ttf'));
    await fonts.load();
    await (FontLoader(
      'Roboto',
    )..addFont(rootBundle.load('assets/fonts/CoachArabic.ttf'))).load();
    await (FontLoader(
      'MaterialIcons',
    )..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'))).load();
    tester.view.physicalSize = const Size(390, 1000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    for (final auth in [false, true]) {
      final capture = GlobalKey();
      await tester.pumpWidget(
        ChangeNotifierProvider<AppProvider>.value(
          value: auth ? PreviewAuthProvider() : PreviewProvider(),
          child: RepaintBoundary(
            key: capture,
            child: MaterialApp(
              debugShowCheckedModeBanner: false,
              theme: AppTheme.lightTheme,
              home: auth
                  ? const AuthScreen()
                  : HomeScreen(
                      onStartPractice: () {},
                      onStartAssessment: () {},
                      onOpenLearn: () {},
                      onOpenWords: () {},
                    ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      final boundary =
          capture.currentContext!.findRenderObject()! as RenderRepaintBoundary;
      await tester.runAsync(() async {
        final image = await boundary.toImage(pixelRatio: 2);
        final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
        final dir = Directory(output)..createSync(recursive: true);
        await File(
          '${dir.path}/${auth ? 'app-login' : 'app-home'}.png',
        ).writeAsBytes(bytes!.buffer.asUint8List());
        image.dispose();
      });
      expect(tester.takeException(), isNull);
    }
  });
}
