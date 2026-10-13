import React, { useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, PanResponder, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '../theme';

export function Header({ eyebrow, title, sub }) {
  return (
    <View style={s.header}>
      {eyebrow ? <Text style={s.eyebrow}>{eyebrow}</Text> : null}
      <Text style={s.title}>{title}</Text>
      {sub ? <Text style={s.sub}>{sub}</Text> : null}
    </View>
  );
}

export function Chip({ label, active, onPress, icon }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[s.chip, active && s.chipOn]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
    >
      {icon ? <Ionicons name={icon} size={13} color={active ? C.mint : C.muted} /> : null}
      <Text style={[s.chipTxt, active && { color: C.mint }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Btn({ label, onPress, variant = 'primary', icon, disabled, loading }) {
  const bg = variant === 'primary' ? C.mint : variant === 'blue' ? C.blue : C.card2;
  const fg = variant === 'ghost' ? C.fg : C.ink;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        s.btn,
        { backgroundColor: bg },
        variant === 'ghost' && { borderWidth: 1, borderColor: C.border },
        disabled && { opacity: 0.4 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={17} color={fg} /> : null}
          <Text style={[s.btnTxt, { color: fg }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function Stat({ label, value, accent, style }) {
  return (
    <View style={[s.stat, style]}>
      <Text style={s.statLbl}>{label}</Text>
      <Text style={[s.statVal, accent && { color: C.mint }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const clamp = (v) => Math.max(0, Math.min(100, v));

// Drag slider (0-100) built on PanResponder so no extra native dependency is needed.
export function Slider({ label, value, onChange, lowLabel, highLabel }) {
  const widthRef = useRef(1);
  const startRef = useRef(value);
  const valueRef = useRef(value);
  const cbRef = useRef(onChange);
  valueRef.current = value;
  cbRef.current = onChange;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        // Only claim horizontal drags so the surrounding ScrollView can still scroll vertically
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: () => {
          startRef.current = valueRef.current;
        },
        onPanResponderMove: (_, g) => {
          const next = startRef.current + (g.dx / widthRef.current) * 100;
          cbRef.current(Math.round(clamp(next)));
        },
      }),
    []
  );

  return (
    <View style={s.slider}>
      <View style={s.sliderHead}>
        <Text style={s.lbl}>{label}</Text>
        <Text style={s.sliderVal}>{Math.round(value)}</Text>
      </View>
      <View
        style={s.trackHit}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
        }}
        {...pan.panHandlers}
      >
        <View style={s.trackBg} />
        <View style={[s.trackFill, { width: `${value}%` }]} />
        <View style={[s.thumb, { left: `${value}%` }]} />
      </View>
      <View style={s.sliderEnds}>
        <Text style={s.hint}>{lowLabel}</Text>
        <Text style={s.hint}>{highLabel}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { gap: 4 },
  eyebrow: { fontSize: 10, fontWeight: '700', color: C.mint, letterSpacing: 1.8, textTransform: 'uppercase' },
  title: { fontSize: 20, fontWeight: '800', color: C.fg, letterSpacing: -0.3 },
  sub: { fontSize: 13, color: C.muted, lineHeight: 19, marginTop: 2 },

  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: R.pill,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  chipOn: { borderColor: C.mint, backgroundColor: C.mintSoft },
  chipTxt: { fontSize: 12, fontWeight: '600', color: C.muted },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 18, borderRadius: R.md, minHeight: 50,
  },
  btnTxt: { fontSize: 15, fontWeight: '700' },

  stat: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: R.md, padding: 14, gap: 4, flex: 1,
  },
  statLbl: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase' },
  statVal: { fontSize: 22, fontWeight: '800', color: C.fg, fontVariant: ['tabular-nums'] },

  slider: { gap: 6 },
  sliderHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lbl: { fontSize: 13, fontWeight: '600', color: C.fg },
  sliderVal: { fontSize: 13, fontWeight: '800', color: C.mint, fontVariant: ['tabular-nums'] },
  trackHit: { height: 36, justifyContent: 'center' },
  trackBg: { position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3, backgroundColor: C.border },
  trackFill: { position: 'absolute', left: 0, height: 6, borderRadius: 3, backgroundColor: C.mint },
  thumb: {
    position: 'absolute', top: 7, width: 22, height: 22, borderRadius: 11,
    marginLeft: -11, backgroundColor: C.mint, borderWidth: 3, borderColor: C.base,
  },
  sliderEnds: { flexDirection: 'row', justifyContent: 'space-between' },
  hint: { fontSize: 11, color: C.muted },
});
