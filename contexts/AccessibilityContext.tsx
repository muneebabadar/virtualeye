

import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

interface AccessibilityContextType {
  speak: (text: string, immediate?: boolean) => void;
  stopSpeaking: () => void;
  isScreenReaderEnabled: boolean;
  hapticFeedback: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => void;
  isSpeaking: boolean;

  // High-contrast mode
  isHighContrastEnabled: boolean;
  toggleHighContrast: () => void;

  // Language support
  language: 'en' | 'ur';
  setLanguage: (language: 'en' | 'ur') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // High-contrast state
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);

  // Language state - default to English
  const [language, setLanguageState] = useState<'en' | 'ur'>('en');

  const toggleHighContrast = () => {
    setIsHighContrastEnabled(prev => !prev);
  };

  const setLanguage = (newLanguage: 'en' | 'ur') => {
    setLanguageState(newLanguage);
  };

  // Detect screen reader
  useEffect(() => {
    const checkScreenReader = async () => {
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(screenReaderEnabled);
    };

    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    return () => subscription.remove();
  }, []);

  // TTS
  const speak = async (text: string, immediate: boolean = false) => {
    try {
      if (immediate) await Speech.stop();

      setIsSpeaking(true);

      await Speech.speak(text, {
        language: language === 'ur' ? 'ur-PK' : 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = async () => {
    try {
      await Speech.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error('Stop TTS Error:', error);
    }
  };

  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' = 'medium') => {
    switch (type) {
      case 'success':
        // Double tap for success
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 100);
        break;
      case 'error':
        // Heavy impact for errors
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'warning':
        // Medium impact for warnings
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'medium':
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        speak,
        stopSpeaking,
        isScreenReaderEnabled,
        hapticFeedback,
        isSpeaking,
        isHighContrastEnabled,
        toggleHighContrast,
        language,
        setLanguage,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
