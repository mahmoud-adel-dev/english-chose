import 'package:flutter/material.dart';

class AppTheme {
  static const Color primaryColor = Color(0xFF5864D9);
  static const Color primaryLight = Color(0xFF858CE7);
  static const Color accentColor = Color(0xFF8B72DF);
  static const Color inkColor = Color(0xFF252B4A);
  static const Color mutedColor = Color(0xFF73788E);
  static const Color lavenderColor = Color(0xFFF0EDFB);
  static const Color blueWashColor = Color(0xFFECF2FC);
  static const Color borderColor = Color(0xFFE9EAF4);
  static const LinearGradient softGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFEEF1FD), Color(0xFFF1EDFC)],
  );
  static const Color successColor = Color(0xFF10B981); // Emerald
  static const Color warningColor = Color(0xFFF59E0B); // Amber
  static const Color errorColor = Color(0xFFEF4444); // Rose
  static const Color backgroundColor = Color(0xFFFCFCFF);
  static const Color surfaceColor = Colors.white;

  static Color getLevelColor(String level) {
    switch (level.toUpperCase()) {
      case 'A1':
        return const Color(0xFF10B981);
      case 'A2':
        return const Color(0xFF059669);
      case 'B1':
        return const Color(0xFF0284C7);
      case 'B2':
        return const Color(0xFF2563EB);
      case 'C1':
        return const Color(0xFF7C3AED);
      case 'C2':
        return const Color(0xFF9333EA);
      default:
        return primaryColor;
    }
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      splashFactory: InkSparkle.splashFactory,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        primary: primaryColor,
        secondary: accentColor,
        surface: surfaceColor,
        error: errorColor,
      ),
      scaffoldBackgroundColor: backgroundColor,
      fontFamily: 'CoachArabic',
      textTheme: const TextTheme(
        bodyLarge: TextStyle(color: inkColor, fontSize: 15, height: 1.6),
        bodyMedium: TextStyle(color: inkColor, fontSize: 13, height: 1.6),
        bodySmall: TextStyle(color: mutedColor, fontSize: 11, height: 1.6),
      ),
      dividerTheme: const DividerThemeData(color: borderColor, thickness: 1),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: primaryColor,
        linearTrackColor: lavenderColor,
        borderRadius: BorderRadius.all(Radius.circular(20)),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: lavenderColor,
        elevation: 0,
        labelTextStyle: WidgetStateProperty.all(
          const TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: surfaceColor,
        foregroundColor: Color(0xFF0F172A),
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: 'CoachArabic',
          color: Color(0xFF0F172A),
          fontSize: 20,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        color: surfaceColor,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(22),
          side: const BorderSide(color: borderColor, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
          ),
          textStyle: const TextStyle(
            fontFamily: 'CoachArabic',
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
      ),
    );
  }
}
