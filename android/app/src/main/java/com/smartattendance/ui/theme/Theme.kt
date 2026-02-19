package com.smartattendance.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val LightColorScheme = lightColorScheme(
    primary = Indigo600,
    onPrimary = Gray50,
    primaryContainer = Indigo100,
    onPrimaryContainer = Indigo600,
    secondary = Emerald600,
    onSecondary = Gray50,
    secondaryContainer = Emerald300,
    onSecondaryContainer = Emerald600,
    tertiary = HolidayPurple,
    background = Gray50,
    onBackground = Gray900,
    surface = Gray50,
    onSurface = Gray900,
    surfaceVariant = Gray100,
    onSurfaceVariant = Gray600,
    error = AbsentRed,
    onError = Gray50,
    outline = Gray300,
    outlineVariant = Gray200,
)

private val DarkColorScheme = darkColorScheme(
    primary = Indigo300,
    onPrimary = Gray900,
    primaryContainer = Indigo600,
    onPrimaryContainer = Indigo100,
    secondary = Emerald300,
    onSecondary = Gray900,
    secondaryContainer = Emerald600,
    onSecondaryContainer = Emerald300,
    tertiary = HolidayPurple,
    background = DarkSurface,
    onBackground = Gray50,
    surface = DarkSurface,
    onSurface = Gray50,
    surfaceVariant = DarkSurfaceVariant,
    onSurfaceVariant = Gray300,
    error = AbsentRed,
    onError = Gray900,
    outline = Gray600,
    outlineVariant = Gray700,
)

@Composable
fun SmartAttendanceTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
