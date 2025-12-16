import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useAccessibleColors } from '@/hooks/useAccessibleColors';
import { SemanticColors } from '@/constants/color';
import React, { ReactNode } from 'react';

import {
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    ViewStyle
} from 'react-native';

interface AccessibleButtonProps {
  children?: ReactNode;
  title?: string;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  title,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  style,
  textStyle,
  variant = 'primary',
}) => {
  const { hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();

  const handlePress = () => {
    if (disabled) return;
    hapticFeedback('medium');
    onPress();
  };

  const getVariantStyles = (variant: string) => {
    const baseStyle = styles.baseButton;

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors[SemanticColors.buttonPrimaryBg],
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors[SemanticColors.buttonSecondaryBg],
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: colors[SemanticColors.buttonDangerBg],
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors[SemanticColors.buttonPrimaryBg],
        };
    }
  };

  const getVariantTextStyles = (variant: string) => {
    switch (variant) {
      case 'primary':
        return { color: colors[SemanticColors.buttonPrimaryText] };
      case 'secondary':
        return { color: colors[SemanticColors.buttonSecondaryText] };
      case 'danger':
        return { color: colors[SemanticColors.buttonDangerText] };
      default:
        return { color: colors[SemanticColors.buttonPrimaryText] };
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        getVariantStyles(variant),
        pressed && styles.pressed,
        disabled && { backgroundColor: colors[SemanticColors.disabledBg] },
        style,
      ]}
    >
      {children ? (
        children
      ) : (
        <Text
          style={[
            styles.buttonText,
            getVariantTextStyles(variant),
            disabled && { color: colors[SemanticColors.disabledText] },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
  },
  baseButton: {
    // Background color will be set dynamically via getVariantStyles
  },
  pressed: {
    opacity: 0.8, // Slightly less aggressive than 0.7 for better visibility
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
