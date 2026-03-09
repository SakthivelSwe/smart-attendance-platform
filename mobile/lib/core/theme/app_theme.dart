import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Colors mapped from frontend/src/styles.css

  // Light Theme Colors
  static const Color lightBgPrimary = Color(0xFFF8FAFC); // Slate 50
  static const Color lightBgSecondary = Color(0xFFFFFFFF);
  static const Color lightTextPrimary = Color(0xFF0F172A); // Slate 900
  static const Color lightTextSecondary = Color(0xFF475569); // Slate 600
  static const Color lightBorder = Color(0xFFE2E8F0); // Slate 200
  static const Color lightCardBg = Color(0xFFFFFFFF);

  // Dark Theme Colors
  static const Color darkBgPrimary = Color(0xFF0F172A); // Slate 900
  static const Color darkBgSecondary = Color(0xFF1E293B); // Slate 800
  static const Color darkTextPrimary = Color(0xFFF8FAFC);
  static const Color darkTextSecondary = Color(0xFF94A3B8);
  static const Color darkBorder = Color(0xFF334155);
  static const Color darkCardBg = Color(0xFF1E293B);

  // Primary Brand Color (Fallback from Tailwind default blue)
  static const Color primaryBlue = Color(0xFF2563EB); // Blue 600

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: primaryBlue,
        background: lightBgPrimary,
        surface: lightCardBg,
        onBackground: lightTextPrimary,
        onSurface: lightTextPrimary,
        outline: lightBorder,
      ),
      scaffoldBackgroundColor: lightBgPrimary,
      textTheme: GoogleFonts.outfitTextTheme().apply(
        bodyColor: lightTextPrimary,
        displayColor: lightTextPrimary,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: lightBgSecondary,
        foregroundColor: lightTextPrimary,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: lightTextSecondary),
        titleTextStyle: GoogleFonts.outfit(
          color: lightTextPrimary,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: lightCardBg,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: lightBorder),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: GoogleFonts.outfit(
            fontWeight: FontWeight.w500,
            fontSize: 16,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.transparent,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: lightBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: lightBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryBlue),
        ),
        labelStyle: GoogleFonts.outfit(color: lightTextSecondary),
        hintStyle: GoogleFonts.outfit(color: lightTextSecondary),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: const ColorScheme.dark(
        primary: primaryBlue,
        background: darkBgPrimary,
        surface: darkCardBg,
        onBackground: darkTextPrimary,
        onSurface: darkTextPrimary,
        outline: darkBorder,
      ),
      scaffoldBackgroundColor: darkBgPrimary,
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).apply(
        bodyColor: darkTextPrimary,
        displayColor: darkTextPrimary,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: darkBgSecondary,
        foregroundColor: darkTextPrimary,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: darkTextSecondary),
        titleTextStyle: GoogleFonts.outfit(
          color: darkTextPrimary,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: darkCardBg,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: darkBorder),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: GoogleFonts.outfit(
            fontWeight: FontWeight.w500,
            fontSize: 16,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.transparent,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryBlue),
        ),
        labelStyle: GoogleFonts.outfit(color: darkTextSecondary),
        hintStyle: GoogleFonts.outfit(color: darkTextSecondary),
      ),
    );
  }
}
