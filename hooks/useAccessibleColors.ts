// import { AccessibleColors, HighContrastColors } from '@/constants/color';
// import { useAccessibility } from '@/contexts/AccessibilityContext';

// export const useAccessibleColors = () => {
//   const { isHighContrastOn } = useAccessibility();

//   return isHighContrastOn ? HighContrastColors : AccessibleColors;
// };


import { useAccessibility } from "@/contexts/AccessibilityContext";
import { AccessibleColors, HighContrastColors } from "@/constants/color";

export const useAccessibleColors = () => {
  const { isHighContrastEnabled } = useAccessibility();

  return isHighContrastEnabled ? HighContrastColors : AccessibleColors;
};
