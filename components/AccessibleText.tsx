import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { useAccessibleColors } from '@/hooks/useAccessibleColors';
import { SemanticColors } from '@/constants/color';

interface AccessibleTextProps extends TextProps {
  accessibilityLabel?: string;
  accessibilityRole?: 'header' | 'text' | 'summary' | 'label' | 'button' | 'link';
  level?: 1 | 2 | 3 | 4 | 5 | 6; // For headings
  variant?: 'primary' | 'secondary' | 'danger' | 'inverse' | 'default'; // Text color variants
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  accessibilityLabel,
  accessibilityRole = 'text',
  level,
  variant = 'default',
  style,
  ...props
}) => {
  const colors = useAccessibleColors();

  // Determine accessibility properties
  const accessibilityProps = {
    accessible: true,
    accessibilityLabel: accessibilityLabel || (typeof children === 'string' ? children : undefined),
    accessibilityRole,
    ...(level && { accessibilityLevel: level }),
  };

  // Get text color based on variant
  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return { color: colors[SemanticColors.textMain] };
      case 'secondary':
        return { color: colors[SemanticColors.textSecondary] };
      case 'danger':
        return { color: colors[SemanticColors.textDanger] };
      case 'inverse':
        return { color: colors[SemanticColors.textInverse] };
      default:
        return { color: colors[SemanticColors.textMain] };
    }
  };

  // Style based on level (if header)
  const headerStyle = level ? styles[`h${level}`] : null;
  const textColor = getTextColor();

  return (
    <Text
      {...accessibilityProps}
      style={[headerStyle, textColor, style]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 6,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600',
    marginVertical: 4,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 4,
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: '500',
    marginVertical: 2,
    lineHeight: 26,
  },
  h6: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 2,
    lineHeight: 24,
  },
});