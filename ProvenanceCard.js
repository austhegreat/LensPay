import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '../theme';

// Compact UTC timestamp, avoids Intl options that Hermes handles inconsistently.
const fmtTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
};

export default function ProvenanceCard({ meta }) {
  if (!meta) return null;

  const rows = [
    ['SHA-256 seal', meta.sha],
    ['Capture device', meta.device],
    ['Captured at', fmtTime(meta.time)],
    ['Geo-stamp', meta.geo],
  ];

  return (
    <View style={s.card}>
      <View style={s.head}>
        <View style={s.lockWrap}>
          <Ionicons name="lock-closed" size={14} color={C.blue} />
        </View>
        <Text style={s.headTxt}>SEALED · HUMAN CAPTURE</Text>
        <View style={s.okPill}>
          <Ionicons name="checkmark-circle" size={12} color={C.mint} />
          <Text style={s.okTxt}>Verified</Text>
        </View>
      </View>

      {rows.map(([k, v]) => (
        <View key={k} style={s.row}>
          <Text style={s.k}>{k}</Text>
          <Text style={s.v} numberOfLines={1}>
            {v}
          </Text>
        </View>
      ))}

      <Text style={s.foot}>
        Prototype provenance. Values are generated on-device for testing, not signed C2PA manifests.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.blue,
    borderRadius: R.md, padding: 14, gap: 8,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  lockWrap: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: C.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  headTxt: { flex: 1, minWidth: 0, fontSize: 11, fontWeight: '800', color: C.blue, letterSpacing: 1 },
  okPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.mintSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pill,
  },
  okTxt: { fontSize: 11, fontWeight: '700', color: C.mint },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12,
    paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border,
  },
  k: { fontSize: 12, color: C.muted },
  v: { flexShrink: 1, fontSize: 12, fontWeight: '600', color: C.fg, fontVariant: ['tabular-nums'], textAlign: 'right' },
  foot: { fontSize: 10, color: C.muted, lineHeight: 14, marginTop: 2 },
});
