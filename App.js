// LensPay V2 · Authentic photo marketplace
// Entry point. Paste into Expo Snack with the src/ folder (see README in the handoff).
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, StatusBar } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from './src/theme';
import { LensProvider } from './src/store';
import CaptureScreen from './src/screens/CaptureScreen';
import MarketScreen from './src/screens/MarketScreen';
import BrandsScreen from './src/screens/BrandsScreen';
import WalletScreen from './src/screens/WalletScreen';

const TABS = [
  { key: 'capture', label: 'Capture', icon: 'camera', Screen: CaptureScreen },
  { key: 'market', label: 'Discover', icon: 'search', Screen: MarketScreen },
  { key: 'brands', label: 'Brands', icon: 'briefcase', Screen: BrandsScreen },
  { key: 'wallet', label: 'Wallet', icon: 'wallet', Screen: WalletScreen },
];

// Gentle fade and lift each time the active tab changes
function Fade({ children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [opacity, lift]);

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateY: lift }] }}>
      {children}
    </Animated.View>
  );
}

function Shell() {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const active = TABS[index];
  const Screen = active.Screen;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.base} />

      <View style={styles.header}>
        <Text style={styles.logo}>
          Lens<Text style={{ color: C.mint }}>Pay</Text>
        </Text>
        <View style={styles.pill}>
          <Text style={styles.pillTxt}>AUTHENTIC ONLY</Text>
        </View>
      </View>

      <Fade key={active.key}>
        <Screen navigate={setIndex} />
      </Fade>

      <View style={[styles.tabbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {TABS.map((t, i) => {
          const on = i === index;
          return (
            <TouchableOpacity
              key={t.key}
              style={styles.tab}
              onPress={() => setIndex(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              <Ionicons name={on ? t.icon : `${t.icon}-outline`} size={22} color={on ? C.mint : C.muted} />
              <Text style={[styles.tabLbl, on && { color: C.mint }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LensProvider>
        <Shell />
      </LensProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.base },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  logo: { fontSize: 22, fontWeight: '800', color: C.fg, letterSpacing: -0.5 },
  pill: { backgroundColor: C.mint, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  pillTxt: { fontSize: 10, fontWeight: '800', color: C.ink, letterSpacing: 0.8 },
  tabbar: {
    flexDirection: 'row', backgroundColor: C.base,
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  tabLbl: { fontSize: 11, fontWeight: '600', color: C.muted },
});
