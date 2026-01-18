// import { CameraView, useCameraPermissions } from "expo-camera";
// import { useRouter } from "expo-router";
// import React, { useEffect } from "react";
// import { StyleSheet, TouchableOpacity, View } from "react-native";
// import { useAccessibility } from "@/contexts/AccessibilityContext";
// import { useAccessibleColors } from "@/hooks/useAccessibleColors";
// import { AccessibleText } from "@/components/AccessibleText";
// import { AccessibleButton } from "@/components/AccessibleButton";

// const ColorIdentificationScreen = () => {
//   const router = useRouter();
//   const { speak, hapticFeedback } = useAccessibility();
//   const colors = useAccessibleColors();
//   const [permission, requestPermission] = useCameraPermissions();

//   // Announce screen on mount
//   useEffect(() => {
//     speak?.("Color Identification Screen. Use camera to identify colors.", true);
//     if (!permission) requestPermission();
//   }, [permission, requestPermission]);

//   const renderCamera = () => {
//     //if permission is still loading
//     if (!permission) {
//       return <View />;
//     }
//     //if permission is not granted show button for permission
//     if (!permission.granted) {
//       return (
//         <View style={[styles.permissionCenterOverlay, { backgroundColor: colors.background }]}>
//           <AccessibleButton
//             title="Allow Camera for Live Feed"
//             onPress={requestPermission}
//             accessibilityLabel="Allow camera access for color identification"
//             accessibilityHint="Grant camera permission to identify colors in your surroundings"
//             style={styles.permissionButton}
//           />
//         </View>
//       );
//     }

//     return (
//       <View style={{ flex: 1, position: "relative" }}>
//         <CameraView style={styles.camera} facing="back" />
//       </View>

//     );
//   };

//   return (
//     <View style={[styles.root, { backgroundColor: colors.background }]}>
//       <View style={[styles.topBar, { backgroundColor: colors.primary }]}>
//         <AccessibleText
//           style={[styles.topTitle, { color: colors.textInverse }]}
//           accessibilityRole="header"
//           level={1}
//         >
//           Color Identification
//         </AccessibleText>
//       </View>
//       {/*put whwtever camera returns*/}
//       <View style={styles.cameraContainer}>{renderCamera()}</View>

//       <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
//         <AccessibleButton
//           title="Modes"
//           onPress={() => {
//             hapticFeedback?.('light');
//             speak?.('Navigating to modes selection', true);
//             router.push("/features");
//           }}
//           accessibilityLabel="Navigate to modes selection screen"
//           accessibilityHint="Switch between different V-EYE features"
//           style={styles.bottomButton}
//         />

//         <AccessibleButton
//           title="ENG"
//           onPress={() => {
//             hapticFeedback?.('light');
//             speak?.('Language is English', true);
//           }}
//           accessibilityLabel="Current language: English"
//           accessibilityHint="Application language indicator"
//           style={styles.bottomButton}
//         />
//       </View>
//     </View>
//   );
// }
// export default ColorIdentificationScreen
// const styles = StyleSheet.create({
//   root: {flex: 1},
//   topBar: {height: 120, justifyContent: "center", alignItems: "center",
//     borderBottomLeftRadius: 8, borderBottomRightRadius: 8,},
//   topTitle: {fontSize: 24, fontWeight: "800"},

//   cameraContainer: {flex: 1,},
//   camera: {flex:1,},

//   permissionCenterOverlay: {flex: 1, alignItems: "center", justifyContent: "center"},
//   permissionButton: {paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, borderWidth: 1},

//   bottomBar: {flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20,
//     paddingVertical: 12,},
//   bottomButton: {flex: 1, height: 80, borderRadius: 18, marginHorizontal: 6,
//     alignItems: "center", justifyContent: "center"},


// }
// );

import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert
} from "react-native";
import { detectColor, checkApiHealth } from '../services/detectionApi';
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { AccessibleText } from "@/components/AccessibleText";
import { AccessibleButton } from "@/components/AccessibleButton";

const ColorIdentificationScreen = () => {
  const router = useRouter();
  const { speak, hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedColor, setDetectedColor] = useState<string>('');
  const [colorHex, setColorHex] = useState<string>('');
  const [apiConnected, setApiConnected] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const detectionIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission, requestPermission]);

  // Check API connection on mount and announce screen
  useEffect(() => {
    speak?.("Color Identification Screen. Use camera to identify colors.", true);
    checkConnection();
  }, []);

  // Auto-detection loop
  useEffect(() => {
    if (isAutoDetecting && apiConnected) {
      speak?.("Color scanning started", true);
      // Detect every 2 seconds
      detectionIntervalRef.current = setInterval(() => {
        captureColor();
      }, 2000);
    } else {
      // Clear interval when stopped
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
        if (isAutoDetecting) {
          speak?.("Color scanning stopped", true);
        }
      }
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isAutoDetecting, apiConnected]);

  const checkConnection = async () => {
    const isConnected = await checkApiHealth();
    setApiConnected(isConnected);
    if (!isConnected) {
      Alert.alert(
        'API Not Connected',
        'Cannot connect to detection server. Make sure:\n' +
        '1. FastAPI server is running\n' +
        '2. Both devices are on same WiFi\n' +
        '3. IP address is correct in detectionApi.js'
      );
    }
  };

  const captureColor = async () => {
    if (!cameraRef.current || isDetecting) return;

    if (!apiConnected) {
      return;
    }

    setIsDetecting(true);
    
    try {
      // Take photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: false,
        exif: false,
        shutterSound: false
      });

      if (!photo || !photo.uri) {
        throw new Error('Failed to capture photo');
      }

      console.log('Photo captured, sending to API...');

      // Send to detection API
      const result = await detectColor(photo.uri);

      // Process detection
      if (result.success && result.data) {
        const colorData = result.data;
        const colorName = colorData.name;
        const hex = colorData.hex;
        
        // Only speak if it's a different color
        const message = `The color is ${colorName}`;
        
        if (detectedColor !== colorName) {
          setDetectedColor(colorName);
          setColorHex(hex);
          hapticFeedback?.('success');
          // Speak the result
          speak?.(message, true);
        }

        console.log('Detection:', colorName, hex);
      } else {
        // Only update if previously had a detection
        if (detectedColor !== '') {
          setDetectedColor('');
          setColorHex('');
        }
      }

    } catch (error) {
      console.error('Detection error:', error);
      // Don't show alerts during auto-detection to avoid spam
      if (!isAutoDetecting) {
        const errorMessage = 'Color detection failed. Please try again.';
        speak?.(errorMessage, true);
        hapticFeedback?.('error');

        Alert.alert(
          'Detection Failed',
          error instanceof Error ? error.message : 'Unknown error occurred'
        );
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const toggleAutoDetection = () => {
    if (!apiConnected) {
      speak?.('API not connected. Please check connection.', true);
      hapticFeedback?.('error');
      Alert.alert('Error', 'API not connected. Please check connection.');
      return;
    }

    const newState = !isAutoDetecting;
    setIsAutoDetecting(newState);
    hapticFeedback?.('medium');

    if (newState) {
      speak?.('Color scanning started', true);
    } else {
      speak?.('Color scanning stopped', true);
      setDetectedColor('');
      setColorHex('');
    }
  };

  const renderCamera = () => {
    // If permission is still loading
    if (!permission) {
      return <View />;
    }
    
    // If permission is not granted show button for permission
    if (!permission.granted) {
      return (
        <View style={[styles.permissionCenterOverlay, { backgroundColor: colors.background }]}>
          <AccessibleButton
            title="Allow Camera for Live Feed"
            onPress={requestPermission}
            accessibilityLabel="Allow camera access for color identification"
            accessibilityHint="Grant camera permission to identify colors in your surroundings"
            style={styles.permissionButton}
          />
        </View>
      );
    }

    return (
      <View style={{ flex: 1, position: "relative" }}>
        <CameraView 
          style={styles.camera} 
          facing="back"
          ref={cameraRef}
        />

        {/* API Status Indicator */}
        <View style={[styles.statusOverlay, { backgroundColor: colors.card }]}>
          <View style={[styles.statusDot, {
            backgroundColor: apiConnected ? colors.success : colors.danger
          }]}
          accessible={true}
          accessibilityLabel={`Connection status: ${apiConnected ? 'Connected' : 'Disconnected'}`}
          />
          <AccessibleText
            style={[styles.statusText, { color: colors.text }]}
            accessibilityRole="text"
          >
            {apiConnected ? 'Connected' : 'Disconnected'}
          </AccessibleText>
          <TouchableOpacity
            onPress={checkConnection}
            style={styles.refreshButton}
            accessible={true}
            accessibilityLabel="Refresh connection status"
            accessibilityHint="Check API connection status"
            accessibilityRole="button"
          >
            <AccessibleText style={styles.refreshText}>🔄</AccessibleText>
          </TouchableOpacity>
        </View>

        {/* Center crosshair for targeting */}
        <View style={styles.crosshairContainer}>
          <View style={styles.crosshair}>
            <View style={styles.crosshairLine} />
            <View style={[styles.crosshairLine, styles.crosshairLineVertical]} />
          </View>
        </View>

        {/* Detection Status Indicator */}
        {isAutoDetecting && (
          <View style={[styles.detectingIndicator, { backgroundColor: colors.warning }]}>
            <ActivityIndicator size="small" color={colors.textInverse} />
            <AccessibleText
              style={[styles.detectingIndicatorText, { color: colors.textInverse }]}
              accessibilityRole="text"
              accessibilityLabel="Scanning for colors"
            >
              Scanning...
            </AccessibleText>
          </View>
        )}

        {/* Color Detection Result - Large Display */}
        {detectedColor !== '' && (
          <View style={[styles.resultContainer, { backgroundColor: 'rgba(0, 0, 0, 0.85)' }]}>
            {/* Color Swatch */}
            <View 
              style={[
                styles.colorSwatch, 
                { backgroundColor: colorHex || '#000' }
              ]}
              accessible={true}
              accessibilityLabel={`Color sample: ${detectedColor}`}
            />
            {/* Color Name */}
            <AccessibleText
              style={[styles.resultText, { color: '#FFFFFF' }]}
              accessibilityRole="text"
              accessibilityLabel={`Detected color: ${detectedColor}`}
            >
              {detectedColor.toUpperCase()}
            </AccessibleText>
            {/* Color Hex Code */}
            <AccessibleText
              style={[styles.hexText, { color: '#CCCCCC' }]}
              accessibilityRole="text"
            >
              {colorHex}
            </AccessibleText>
          </View>
        )}

        {/* Auto-Detection Toggle Button */}
        <View style={styles.toggleOverlay}>
          <AccessibleButton
            title={`${isAutoDetecting ? 'Stop' : 'Start'} Detection`}
            onPress={toggleAutoDetection}
            disabled={!apiConnected}
            accessibilityLabel={`${isAutoDetecting ? 'Stop' : 'Start'} color detection`}
            accessibilityHint={apiConnected
              ? `Tap to ${isAutoDetecting ? 'stop' : 'start'} automatic color detection`
              : 'API not connected. Cannot start detection'
            }
            style={[
              styles.toggleButton,
              isAutoDetecting && { backgroundColor: colors.danger },
              !apiConnected && { backgroundColor: colors.disabled },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { backgroundColor: colors.primary }]}>
        <AccessibleText
          style={[styles.topTitle, { color: colors.textInverse }]}
          accessibilityRole="header"
          level={1}
        >
          Color Identification
        </AccessibleText>
      </View>

      {/* Camera view */}
      <View style={styles.cameraContainer}>{renderCamera()}</View>

      <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
        <AccessibleButton
          title="Modes"
          onPress={() => {
            setIsAutoDetecting(false);
            hapticFeedback?.('light');
            speak?.('Navigating to modes selection', true);
            router.push("/features");
          }}
          accessibilityLabel="Navigate to modes selection screen"
          accessibilityHint="Switch between different V-EYE features"
          style={styles.bottomButton}
        />

        <AccessibleButton
          title="ENG"
          onPress={() => {
            hapticFeedback?.('light');
            speak?.('Language is English', true);
          }}
          accessibilityLabel="Current language: English"
          accessibilityHint="Application language indicator"
          style={styles.bottomButton}
        />
      </View>
    </View>
  );
}

export default ColorIdentificationScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8
  },
  topTitle: { fontSize: 24, fontWeight: "800" },

  cameraContainer: { flex: 1 },
  camera: { flex: 1 },

  permissionCenterOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },

  // API Status Overlay
  statusOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    flex: 1,
  },
  refreshButton: {
    padding: 5,
  },
  refreshText: {
    fontSize: 18,
  },

  // Crosshair for targeting
  crosshairContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshair: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairLine: {
    position: 'absolute',
    width: 80,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  crosshairLineVertical: {
    width: 2,
    height: 80,
  },

  // Detection Status Indicator
  detectingIndicator: {
    position: 'absolute',
    top: 70,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
  },
  detectingIndicatorText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
  },

  // Detection Result - Large and Centered
  resultContainer: {
    position: 'absolute',
    top: '35%',
    left: 30,
    right: 30,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  colorSwatch: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  resultText: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: '800',
    marginBottom: 8,
  },
  hexText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Toggle Button
  toggleOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toggleButton: {
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 30,
    minWidth: 280,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },

  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bottomButton: {
    flex: 1,
    height: 80,
    borderRadius: 18,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center"
  },
});