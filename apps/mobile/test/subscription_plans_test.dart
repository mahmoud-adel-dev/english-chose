import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/user.dart';
import 'package:mobile/providers/app_provider.dart';
import 'package:mobile/screens/subscription_plans_screen.dart';
import 'package:provider/provider.dart';

class MockSubscriptionProvider extends AppProvider {
  final bool trialExpired;
  final String tier;

  MockSubscriptionProvider({this.trialExpired = false, this.tier = 'FREE'});

  @override
  UserModel get user => UserModel(
        id: 'test-user',
        email: 'test@example.com',
        name: 'Sara Learner',
        role: 'STUDENT',
        createdAt: '2026-11-10',
        isTrialActive: !trialExpired,
        trialDaysRemaining: trialExpired ? 0 : 4,
        isSubscribed: tier != 'FREE',
        subscriptionTier: tier,
      );

  @override
  bool get isTrialExpired => trialExpired;

  @override
  int get trialDaysRemaining => trialExpired ? 0 : 4;

  @override
  bool get isSubscribed => tier != 'FREE';

  @override
  String get activeTierName => tier;

  @override
  Future<void> fetchSubscriptionPlans() async {}

  @override
  Future<void> fetchQuota() async {}
}

void main() {
  testWidgets('SubscriptionPlansScreen renders all 3 paid plans and pricing',
      (tester) async {
    tester.view.physicalSize = const Size(400, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final provider = MockSubscriptionProvider(trialExpired: false);

    await tester.pumpWidget(
      ChangeNotifierProvider<AppProvider>.value(
        value: provider,
        child: const MaterialApp(
          home: SubscriptionPlansScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Verify header status shows trial
    expect(find.textContaining('أنت في التجربة المجانية'), findsOneWidget);
    expect(find.textContaining('باقي 4 أيام'), findsOneWidget);

    // Verify plans and prices exist
    expect(find.text('الباقة الأساسية'), findsOneWidget);
    expect(find.text('الباقة الاحترافية'), findsOneWidget);
    expect(find.text('الباقة المميزة'), findsOneWidget);

    expect(find.text('300 EGP'), findsOneWidget);
    expect(find.text('500 EGP'), findsOneWidget);
    expect(find.text('750 EGP'), findsOneWidget);

    // Verify most popular badge
    expect(find.text('الأكثر اختياراً ⭐'), findsOneWidget);

    // Switch to Annual billing
    await tester.tap(find.text('سنوي'));
    await tester.pumpAndSettle();

    expect(find.text('2880 EGP'), findsOneWidget);
    expect(find.text('4500 EGP'), findsOneWidget);
    expect(find.text('6300 EGP'), findsOneWidget);
    expect(find.textContaining('خصم 25%'), findsOneWidget);
  });

  testWidgets('SubscriptionPlansScreen displays expired trial warning',
      (tester) async {
    final provider = MockSubscriptionProvider(trialExpired: true);

    await tester.pumpWidget(
      ChangeNotifierProvider<AppProvider>.value(
        value: provider,
        child: const MaterialApp(
          home: SubscriptionPlansScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.textContaining('انتهت فترة التجربة المجانية'), findsOneWidget);
  });
}
