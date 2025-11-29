import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ActivityIndicator,
  Alert 
} from "react-native";
import * as Speech from 'expo-speech';
import { detectCurrency, checkApiHealth } from '../services/detectionApi';

const CurrencyReaderScreen = () => {
  const router = useRouter();
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

  // Check API connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Auto-detection loop
  useEffect(() => {
    if (isAutoDetecting && apiConnected) {
      // Detect every 2 seconds
      detectionIntervalRef.current = setInterval(() => {
        captureCurrency();
      }, 2000);
    } else {
      // Clear interval when stopped
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
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

        const currencyName = bestDetection.class_name;
        const confidence = (bestDetection.confidence * 100).toFixed(0);
        
        // Only speak if it's a different detection or confidence changed significantly
        const message = `${currencyName}`;
        
        if (lastDetection !== message) {
          setLastDetection(message);
          
          // Speak the result
          Speech.speak(message, {
            language: 'en',
            pitch: 1.0,
            rate: 0.85,
          });
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
        Speech.speak(errorMessage);
        
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
      Alert.alert('Error', 'API not connected. Please check connection.');
      return;
    }

    const newState = !isAutoDetecting;
    setIsAutoDetecting(newState);
    
    if (newState) {
      Speech.speak('Auto detection started');
    } else {
      Speech.speak('Auto detection stopped');
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
        <View style={styles.permissionCenterOverlay}>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestPermission}>
            <Text style={styles.permissionText}>Allow Camera for Live Feed</Text>
          </TouchableOpacity>
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
        <View style={styles.statusOverlay}>
          <View style={[styles.statusDot, { 
            backgroundColor: apiConnected ? '#4CAF50' : '#F44336' 
          }]} />
          <Text style={styles.statusText}>
            {apiConnected ? 'Connected' : 'Disconnected'}
          </Text>
          <TouchableOpacity onPress={checkConnection} style={styles.refreshButton}>
            <Text style={styles.refreshText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Detection Status Indicator */}
        {isAutoDetecting && (
          <View style={styles.detectingIndicator}>
            <ActivityIndicator size="small" color="#f4b500" />
            <Text style={styles.detectingIndicatorText}>Scanning...</Text>
          </View>
        )}

        {/* Last Detection Result - Large Display */}
        {lastDetection !== '' && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>{lastDetection}</Text>
          </View>
        )}

        {/* Auto-Detection Toggle Button */}
        <View style={styles.toggleOverlay}>
          <TouchableOpacity
            style={[
              styles.toggleButton, 
              isAutoDetecting && styles.toggleButtonActive,
              !apiConnected && styles.toggleButtonDisabled
            ]}
            onPress={toggleAutoDetection}
            disabled={!apiConnected}
          >
            <Text style={styles.toggleButtonText}>
              {isAutoDetecting ? '⏸️ STOP' : '▶️ START'} DETECTION
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Currency Reader</Text>
      </View>
      
      {/* Camera view */}
      <View style={styles.cameraContainer}>{renderCamera()}</View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => {
            setIsAutoDetecting(false);
            router.push("/features");
          }}>
          <Text style={styles.bottomButtonText}>MODES</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomButton}>
          <Text style={styles.bottomButtonText}>ENG</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default CurrencyReaderScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#020713" },
  topBar: { 
    height: 120, 
    backgroundColor: "#f4b500", 
    justifyContent: "center", 
    alignItems: "center",
    borderBottomLeftRadius: 8, 
    borderBottomRightRadius: 8 
  },
  topTitle: { fontSize: 24, fontWeight: "800", color: "#000" },

  cameraContainer: { flex: 1 },
  camera: { flex: 1 },

  permissionCenterOverlay: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "#000" 
  },
  permissionButton: { 
    paddingHorizontal: 24, 
    paddingVertical: 16, 
    borderRadius: 16, 
    borderWidth: 1,
    borderColor: "#f4b500" 
  },
  permissionText: { 
    color: "#f9fafb", 
    fontSize: 16, 
    textAlign: "center" 
  },

  // API Status Overlay
  statusOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    color: '#fff',
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
    backgroundColor: 'rgba(244, 181, 0, 0.9)',
    padding: 10,
    borderRadius: 8,
  },
  detectingIndicatorText: {
    color: '#000',
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
    backgroundColor: 'rgba(244, 181, 0, 0.95)',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  resultText: {
    color: '#000',
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
    backgroundColor: '#f4b500',
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
  toggleButtonActive: {
    backgroundColor: '#ff4444',
  },
  toggleButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  toggleButtonText: {
    color: '#000',
    fontSize: 20,
    fontWeight: '800',
  },

  bottomBar: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    paddingHorizontal: 20,
    paddingVertical: 12, 
    backgroundColor: "#020713" 
  },
  bottomButton: { 
    flex: 1, 
    backgroundColor: "#f4b500", 
    height: 80, 
    borderRadius: 18, 
    marginHorizontal: 6,
    alignItems: "center", 
    justifyContent: "center" 
  },
  bottomButtonText: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: "#000" 
  },
});