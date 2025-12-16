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
import * as Speech from 'expo-speech';
import { detectCurrency, checkApiHealth } from '../services/detectionApi';
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { AccessibleText } from "@/components/AccessibleText";
import { AccessibleButton } from "@/components/AccessibleButton";

const CurrencyReaderScreen = () => {
  const router = useRouter();
  const { speak, hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastDetection, setLastDetection] = useState<string>('');
  const [apiConnected, setApiConnected] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const detectionIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission, requestPermission]);

  // Check API connection on mount and announce screen
  useEffect(() => {
    speak?.("Currency Reader Screen. Use camera to detect currency notes.", true);
    checkConnection();
  }, []);

  // Auto-detection loop
  useEffect(() => {
    if (isAutoDetecting && apiConnected) {
      speak?.("Currency scanning started", true);
      // Detect every 2 seconds
      detectionIntervalRef.current = setInterval(() => {
        captureCurrency();
      }, 2000);
    } else {
      // Clear interval when stopped
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
        if (isAutoDetecting) {
          speak?.("Currency scanning stopped", true);
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

  const captureCurrency = async () => {
    if (!cameraRef.current || isDetecting) return;

    if (!apiConnected) {
      return;
    }

    setIsDetecting(true);
    
    try {
      // Take photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });

      if (!photo || !photo.uri) {
        throw new Error('Failed to capture photo');
      }

      console.log('Photo captured, sending to API...');

      // Send to detection API
      const result = await detectCurrency(photo.uri, 0.5);

      // Process detections
      if (result.detections && result.detections.length > 0) {
        // Get the detection with highest confidence
        const bestDetection = result.detections.reduce((prev: any, current: any) => 
          (prev.confidence > current.confidence) ? prev : current
        );

        const currencyName = bestDetection.class;
        const confidence = (bestDetection.confidence * 100).toFixed(0);
        
        // Only speak if it's a different detection or confidence changed significantly
        const message = `${currencyName}`;
        
        if (lastDetection !== message) {
          setLastDetection(message);
          hapticFeedback?.('success');
          // Speak the result
          speak?.(message, true);
        }

        console.log('Detection:', message, confidence + '%');
      } else {
        // Only update if previously had a detection
        if (lastDetection !== '') {
          setLastDetection('');
        }
      }

    } catch (error) {
      console.error('Detection error:', error);
      // Don't show alerts during auto-detection to avoid spam
      if (!isAutoDetecting) {
        const errorMessage = 'Detection failed. Please try again.';
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
      speak?.('Currency scanning started', true);
    } else {
      speak?.('Currency scanning stopped', true);
      setLastDetection('');
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
            accessibilityLabel="Allow camera access for currency detection"
            accessibilityHint="Grant camera permission to detect currency notes"
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

        {/* Detection Status Indicator */}
        {isAutoDetecting && (
          <View style={[styles.detectingIndicator, { backgroundColor: colors.warning }]}>
            <ActivityIndicator size="small" color={colors.textInverse} />
            <AccessibleText
              style={[styles.detectingIndicatorText, { color: colors.textInverse }]}
              accessibilityRole="text"
              accessibilityLabel="Scanning for currency notes"
            >
              Scanning...
            </AccessibleText>
          </View>
        )}

        {/* Last Detection Result - Large Display */}
        {lastDetection !== '' && (
          <View style={[styles.resultContainer, { backgroundColor: colors.warning }]}>
            <AccessibleText
              style={[styles.resultText, { color: colors.textInverse }]}
              accessibilityRole="text"
              accessibilityLabel={`Detected currency: ${lastDetection}`}
            >
              {lastDetection}
            </AccessibleText>
          </View>
        )}

        {/* Auto-Detection Toggle Button */}
        <View style={styles.toggleOverlay}>
          <AccessibleButton
            title={`${isAutoDetecting ? 'Stop' : 'Start'} Detection`}
            onPress={toggleAutoDetection}
            disabled={!apiConnected}
            accessibilityLabel={`${isAutoDetecting ? 'Stop' : 'Start'} currency detection`}
            accessibilityHint={apiConnected
              ? `Tap to ${isAutoDetecting ? 'stop' : 'start'} automatic currency detection`
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
          Currency Reader
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

export default CurrencyReaderScreen;

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
    top: '40%',
    left: 30,
    right: 30,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 32,
    textAlign: 'center',
    fontWeight: '800',
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