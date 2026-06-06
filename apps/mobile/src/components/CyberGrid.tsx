import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import Svg, { Line, Path, Circle } from 'react-native-svg';

export function CyberGrid() {
  const monoFont = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Micrometric Vector Grid Pattern */}
      <Svg style={StyleSheet.absoluteFill} opacity={0.06}>
        {/* Horizontal micrometric increments */}
        <Line x1="0" y1="10%" x2="100%" y2="10%" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 9" />
        <Line x1="0" y1="25%" x2="100%" y2="25%" stroke="#ffffff" strokeWidth="0.5" />
        <Line x1="0" y1="40%" x2="100%" y2="40%" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2 6" />
        <Line x1="0" y1="55%" x2="100%" y2="55%" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2 6" />
        <Line x1="0" y1="70%" x2="100%" y2="70%" stroke="#ffffff" strokeWidth="0.5" />
        <Line x1="0" y1="85%" x2="100%" y2="85%" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 9" />

        {/* Vertical micrometric increments */}
        <Line x1="10%" y1="0" x2="10%" y2="100%" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 9" />
        <Line x1="25%" y1="0" x2="25%" y2="100%" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="1 15" />
        <Line x1="50%" y1="0" x2="50%" y2="100%" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="4 4" />
        <Line x1="75%" y1="0" x2="75%" y2="100%" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="1 15" />
        <Line x1="90%" y1="0" x2="90%" y2="100%" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 9" />

        {/* Tactical Crosshair / Corner Reticles */}
        {/* Top-Left Reticle */}
        <Path d="M12 24 H24 M12 24 V36" stroke="#ffffff" strokeWidth="1" fill="none" />
        <Circle cx="12" cy="24" r="1.5" fill="#ffffff" />
        
        {/* Top-Right Reticle */}
        <Path d="M715 24 H703 M715 24 V36" stroke="#ffffff" strokeWidth="1" fill="none" />
        
        {/* Bottom-Left Reticle */}
        <Path d="M12 1256 H24 M12 1256 V1244" stroke="#ffffff" strokeWidth="1" fill="none" />

        {/* Bottom-Right Reticle */}
        <Path d="M715 1256 H703 M715 1256 V1244" stroke="#ffffff" strokeWidth="1" fill="none" />
      </Svg>

      {/*Monospace telemetry tags at corners (HUD aesthetic) */}
      <View style={styles.hudOverlay}>
        <View style={styles.hudRow}>
          <Text style={[styles.hudText, { fontFamily: monoFont }]}>HUD_SYS // v4.0</Text>
          <Text style={[styles.hudText, { fontFamily: monoFont }]}>CALIBRATION: ACTIVE</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hudOverlay: {
    position: 'absolute',
    top: 45,
    bottom: 24,
    left: 16,
    right: 16,
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudRowBottom: {
    marginTop: 'auto',
    marginBottom: 50,
  },
  hudText: {
    fontSize: 7.5,
    color: '#a1a1aa',
    opacity: 0.25,
    letterSpacing: 1.5,
  },
});
