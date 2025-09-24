/**
 * 🎨 THEME STORE - COLORS ONLY
 * Black, Aqua & White Color Scheme
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
}

export const theme: ThemeColors = {
  // Primary Colors - Google Pay Aqua
  primary: '#00BCD4', // Cyan-500
  primaryDark: '#00ACC1', // Cyan-600
  primaryLight: '#E0F7FA', // Cyan-50

  // Secondary Colors - Clean Whites
  secondary: '#FFFFFF',
  secondaryDark: '#F8F9FA', // Gray-50
  secondaryLight: '#F1F3F4', // Gray-100

  // Neutral Colors
  background: '#FFFFFF',
  surface: '#FAFAFA', // Gray-50
  surfaceVariant: '#F5F5F5', // Gray-100

  // Text Colors
  textPrimary: '#1A1A1A', // Near black
  textSecondary: '#5F6368', // Google Gray
  textTertiary: '#9AA0A6', // Light gray
  textInverse: '#FFFFFF',

  // Status Colors
  success: '#00BCD4', // Aqua
  warning: '#FF9800', // Orange
  error: '#F44336', // Red
  info: '#2196F3', // Blue

  // Border & Divider
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  divider: '#E8E8E8',

  // Interactive States
  hover: '#F5F5F5',
  pressed: '#EEEEEE',
  disabled: '#BDBDBD',
  disabledText: '#9E9E9E',

  // Special Effects
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.3)',
  accent: '#00ACC1', // Darker aqua
};
