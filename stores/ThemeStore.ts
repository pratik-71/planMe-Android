/**
 * 🎨 MODERN UI THEME - Vibrant & Professional
 * Deep Purple & Cyan Gradient Theme
 * Centralized color management for consistent UI
 */

export interface ThemeColors {
  // Primary Colors
  primary: string;
  primaryDark: string;
  primaryLight: string;

  // Secondary Colors
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;

  // Neutral Colors
  background: string;
  surface: string;
  surfaceVariant: string;

  // Text Colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Status Colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Border & Divider
  border: string;
  borderLight: string;
  divider: string;

  // Interactive States
  hover: string;
  pressed: string;
  disabled: string;
  disabledText: string;

  // Special Effects
  shadow: string;
  overlay: string;
  accent: string;

  // New: Gradient Colors
  streakStart: string;
  streakEnd: string;
}

export const theme: ThemeColors = {
  // Primary Colors - Clean Cyan
  primary: '#00BCD4', // Cyan
  primaryDark: '#00ACC1', // Darker Cyan
  primaryLight: '#B2EBF2', // Light Cyan

  // Secondary Colors - Clean Whites
  secondary: '#FFFFFF', // Pure White
  secondaryDark: '#F8F9FA', // Very Light Gray
  secondaryLight: '#F5F5F5', // Light Gray

  // Neutral Colors - Clean & Professional
  background: '#FFFFFF', // Pure White
  surface: '#FAFAFA', // Very Light Gray
  surfaceVariant: '#F5F5F5', // Light Gray

  // Text Colors - Clear & Readable
  textPrimary: '#212121', // Dark Gray
  textSecondary: '#757575', // Medium Gray
  textTertiary: '#9E9E9E', // Light Gray
  textInverse: '#FFFFFF', // White

  // Status Colors - Professional
  success: '#4CAF50', // Green
  warning: '#FF9800', // Orange
  error: '#F44336', // Red
  info: '#2196F3', // Blue

  // Border & Divider - Subtle
  border: '#E0E0E0', // Light gray
  borderLight: '#F0F0F0', // Very light gray
  divider: '#E8E8E8', // Divider gray

  // Interactive States - Smooth Transitions
  hover: '#F5F5F5', // Light gray
  pressed: '#EEEEEE', // Pressed gray
  disabled: '#BDBDBD', // Disabled gray
  disabledText: '#9E9E9E', // Disabled text

  // Special Effects - Clean shadows
  shadow: 'rgba(0, 0, 0, 0.1)', // Subtle shadow
  overlay: 'rgba(0, 0, 0, 0.4)', // Dark overlay
  accent: '#00ACC1', // Darker Cyan

  // Gradient Colors - For Streak Badge only
  streakStart: '#FF6B35', // Orange
  streakEnd: '#FF8E53', // Light Orange
};
