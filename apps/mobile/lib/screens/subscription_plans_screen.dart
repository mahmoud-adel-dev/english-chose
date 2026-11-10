import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/theme.dart';
import '../providers/app_provider.dart';

class SubscriptionPlansScreen extends StatefulWidget {
  const SubscriptionPlansScreen({super.key});

  @override
  State<SubscriptionPlansScreen> createState() =>
      _SubscriptionPlansScreenState();
}

class _SubscriptionPlansScreenState extends State<SubscriptionPlansScreen> {
  bool _isAnnual = false;
  String? _subscribingTier;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().fetchSubscriptionPlans();
      context.read<AppProvider>().fetchQuota();
    });
  }

  Future<void> _handleSubscribe(String tierName) async {
    final provider = context.read<AppProvider>();
    setState(() => _subscribingTier = tierName);

    final success = await provider.subscribeToPlan(
      tierName,
      billingCycle: _isAnnual ? 'YEARLY' : 'MONTHLY',
    );

    setState(() => _subscribingTier = null);

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFF027A48),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'تم تفعيل باقة $tierName بنجاح! استمتع برحلة التعلم 🚀',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      );
      Navigator.of(context).pop();
    } else if (provider.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFFD92D20),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          content: Text(provider.errorMessage!),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final activeTier = provider.activeTierName;
    final trialDays = provider.trialDaysRemaining;
    final isTrialExpired = provider.isTrialExpired;
    final isSubscribed = provider.isSubscribed;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text(
          'خطط وباقات الاشتراك',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 820),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildHeaderStatus(
                  activeTier: activeTier,
                  trialDays: trialDays,
                  isTrialExpired: isTrialExpired,
                  isSubscribed: isSubscribed,
                ),
                const SizedBox(height: 24),
                _buildBillingToggle(),
                const SizedBox(height: 28),
                _buildPlansList(provider, activeTier),
                const SizedBox(height: 32),
                _buildGuarantees(),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderStatus({
    required String activeTier,
    required int trialDays,
    required bool isTrialExpired,
    required bool isSubscribed,
  }) {
    if (isSubscribed) {
      return Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFFECFDF3),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFA6F4C5)),
        ),
        child: Row(
          children: [
            const Icon(Icons.verified_rounded, color: Color(0xFF027A48), size: 28),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'أنت مشترك حالياً في باقة $activeTier',
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                      color: Color(0xFF027A48),
                    ),
                  ),
                  const SizedBox(height: 3),
                  const Text(
                    'يمكنك الترقية أو التجديد في أي وقت للحصول على حدود أعلى.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF05603A)),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    if (isTrialExpired) {
      return Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF3F2),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFFECACA)),
        ),
        child: const Row(
          children: [
            Icon(Icons.hourglass_disabled_rounded,
                color: Color(0xFFD92D20), size: 28),
            SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'انتهت فترة التجربة المجانية (6 أيام)',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                      color: Color(0xFFB42318),
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'اختر باقتك المفضلة الآن لمتابعة التدريب والمحادثة والتقييم بالذكاء الاصطناعي.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF912018)),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF8FF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFB2DDFF)),
      ),
      child: Row(
        children: [
          const Icon(Icons.timer_outlined, color: Color(0xFF175CD3), size: 28),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'أنت في التجربة المجانية (باقي $trialDays أيام)',
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                    color: Color(0xFF175CD3),
                  ),
                ),
                const SizedBox(height: 3),
                const Text(
                  'التجربة متاحة لمدة 6 أيام. اشترك الآن للاستمرار دون أي انقطاع.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF1849A9)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBillingToggle() {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderColor),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A101828),
              blurRadius: 10,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _toggleItem(
              title: 'شهري',
              subtitle: 'مرونة كاملة',
              selected: !_isAnnual,
              onTap: () => setState(() => _isAnnual = false),
            ),
            _toggleItem(
              title: 'سنوي',
              subtitle: 'خصم حتى 30%',
              badge: 'وفر أكثر',
              selected: _isAnnual,
              onTap: () => setState(() => _isAnnual = true),
            ),
          ],
        ),
      ),
    );
  }

  Widget _toggleItem({
    required String title,
    required String subtitle,
    String? badge,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primaryColor : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    color: selected ? Colors.white : AppTheme.inkColor,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 9,
                    color: selected
                        ? const Color(0xD9FFFFFF)
                        : AppTheme.mutedColor,
                  ),
                ),
              ],
            ),
            if (badge != null) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                decoration: BoxDecoration(
                  color: selected
                      ? const Color(0x40FFFFFF)
                      : const Color(0xFFFEF08A),
                  borderRadius: BorderRadius.circular(5),
                ),
                child: Text(
                  badge,
                  style: TextStyle(
                    fontSize: 8.5,
                    fontWeight: FontWeight.w700,
                    color: selected ? Colors.white : const Color(0xFF854D0E),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPlansList(AppProvider provider, String activeTier) {
    final paidTiers = [
      {
        'name': 'BASIC',
        'title': 'الباقة الأساسية',
        'monthly': 300,
        'yearly': 2880,
        'discount': '20%',
        'questions': 25,
        'sessions': 3,
        'audioMin': 15,
        'attempts': 3,
        'badge': 'الأساسية',
        'isPopular': false,
        'description': 'مثالية للمبتدئين والاستخدام اليومي الخفيف وبناء القواعد',
      },
      {
        'name': 'PRO',
        'title': 'الباقة الاحترافية',
        'monthly': 500,
        'yearly': 4500,
        'discount': '25%',
        'questions': 60,
        'sessions': 6,
        'audioMin': 30,
        'attempts': 5,
        'badge': 'الأكثر اختياراً ⭐',
        'isPopular': true,
        'description':
            'الخيار الأفضل للتقدم السريع والممارسة اليومية والمحادثة الصوتية الحية',
      },
      {
        'name': 'PREMIUM',
        'title': 'الباقة المميزة',
        'monthly': 750,
        'yearly': 6300,
        'discount': '30%',
        'questions': 150,
        'sessions': 15,
        'audioMin': 60,
        'attempts': 10,
        'badge': 'VIP بلا حدود',
        'isPopular': false,
        'description': 'للمحترفين والطلاب الراغبين في طلاقة كاملة بدون أي عوائق',
      },
    ];

    return Column(
      children: paidTiers.map((tier) {
        final name = tier['name'] as String;
        final isCurrent = activeTier == name;
        final isPopular = tier['isPopular'] as bool;
        final monthlyPrice = tier['monthly'] as int;
        final yearlyPrice = tier['yearly'] as int;
        final displayPrice = _isAnnual ? yearlyPrice : monthlyPrice;
        final period = _isAnnual ? 'سنوياً' : 'شهرياً';
        final monthlyEquiv = _isAnnual ? (yearlyPrice ~/ 12) : monthlyPrice;

        return Container(
          margin: const EdgeInsets.only(bottom: 20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: isPopular
                  ? AppTheme.primaryColor
                  : (isCurrent
                      ? const Color(0xFF12B76A)
                      : AppTheme.borderColor),
              width: isPopular ? 2.2 : 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: isPopular
                    ? const Color(0x144F46E5)
                    : const Color(0x0A101828),
                blurRadius: isPopular ? 20 : 10,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (isPopular)
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  decoration: const BoxDecoration(
                    color: AppTheme.primaryColor,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(19),
                      topRight: Radius.circular(19),
                    ),
                  ),
                  child: const Text(
                    '⭐ الخيار الأكثر شعبية وطلباً بين المتعلمين ⭐',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: .3,
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.all(22),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            tier['title'] as String,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.inkColor,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: isPopular
                                ? AppTheme.lavenderColor
                                : const Color(0xFFF2F4F7),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            tier['badge'] as String,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: isPopular
                                  ? AppTheme.primaryColor
                                  : const Color(0xFF475467),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      tier['description'] as String,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF667085),
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 18),
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 6,
                      children: [
                        Text(
                          '$displayPrice EGP',
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.inkColor,
                          ),
                        ),
                        Text(
                          '/ $period',
                          style: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF98A2B3),
                          ),
                        ),
                      ],
                    ),
                    if (_isAnnual) ...[
                      const SizedBox(height: 5),
                      Text(
                        'يعادل $monthlyEquiv ج/شهر (خصم ${tier['discount']})',
                        style: const TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF027A48),
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                    const Divider(height: 1),
                    const SizedBox(height: 16),
                    _featureRow(
                      '${tier['questions']} سؤال وتصحيح ذكي يومياً بالـ AI',
                    ),
                    _featureRow(
                      '${tier['sessions']} جلسات تدريبية كاملة ومكثفة يومياً',
                    ),
                    _featureRow(
                      '${tier['audioMin']} دقيقة تحليل صوت ونطق دقيق يومياً',
                    ),
                    _featureRow(
                      '${tier['attempts']} محاولات إعادة تقييم لكل سؤال',
                    ),
                    _featureRow('تحليل CEFR فوري وتصحيح باللغة العربية'),
                    _featureRow('محادثة حية غير محدودة مع رفيق التحدث الذكي'),
                    const SizedBox(height: 22),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: (_subscribingTier != null || isCurrent)
                            ? null
                            : () => _handleSubscribe(name),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isPopular
                              ? AppTheme.primaryColor
                              : (isCurrent
                                  ? const Color(0xFF12B76A)
                                  : AppTheme.inkColor),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _subscribingTier == name
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.2,
                                  color: Colors.white,
                                ),
                              )
                            : Text(
                                isCurrent ? 'باقتك الحالية ✓' : 'اشترك الآن ←',
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _featureRow(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 9),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.check_circle_rounded,
            color: Color(0xFF12B76A),
            size: 17,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF344054),
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGuarantees() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEAECF0)),
      ),
      child: const Column(
        children: [
          Row(
            children: [
              Icon(Icons.lock_outline_rounded,
                  size: 18, color: Color(0xFF667085)),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'ضمان الشفافية والأمان الكامل',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: Color(0xFF344054),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 6),
          Text(
            'جميع الاشتراكات تدعم التفعيل المباشر، ويمكنك الترقية في أي وقت للاستفادة من مميزات أعلى فوراً.',
            style: TextStyle(fontSize: 11, color: Color(0xFF667085)),
          ),
        ],
      ),
    );
  }
}
