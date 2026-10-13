import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '../theme';
import { estimatePrice, PRICE_TIERS, rm } from '../data';
import { Btn, Slider } from './Ui';

// Smart Price Estimator: rarity and demand are sliders, context quality comes from the story.
export default function PriceEstimator({ remarkLen, tagCount, onUse }) {
  const [rarity, setRarity] = useState(55);
  const [demand, setDemand] = useState(60);

  const est = useMemo(
    () => estimatePrice({ rarity, demand, remarkLen, tagCount }),
    [rarity, demand, remarkLen, tagCount]
  );

  const activeKey = est.tier.startsWith('Micro') ? 'micro' : est.tier.startsWith('Commercial') ? 'commercial' : 'exclusive';
  const rangeTxt = est.max ? `${rm(est.min).replace('.00', '')} – ${rm(est.max).replace('.00', '')}` : `${rm(est.min).replace('.00', '')}+`;

  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <Ionicons name="pricetag" size={15} color={C.mint} />
        <Text style={s.headTxt}>Smart Price Estimator</Text>
      </View>

      <Slider
        label="Subject rarity"
        value={rarity}
        onChange={setRarity}
        lowLabel="Common scene"
        highLabel="Rare subject"
      />
      <Slider
        label="Commercial demand"
        value={demand}
        onChange={setDemand}
        lowLabel="Niche interest"
        highLabel="Brands want it"
      />

      <View style={s.ctxRow}>
        <Text style={s.lbl}>Context quality</Text>
        <Text style={s.ctxVal}>{est.contextQ}</Text>
      </View>
      <View style={s.bar}>
        <View style={[s.barFill, { width: `${est.contextQ}%` }]} />
      </View>
      <Text style={s.hint}>Grows with a longer story (up to 240 characters) and 2+ tags.</Text>

      <View style={s.result}>
        <Text style={s.resLbl}>Suggested tier</Text>
        <Text style={s.resTier}>{est.tier}</Text>
        <View style={s.resRow}>
          <Text style={s.resRange}>{rangeTxt}</Text>
          <Text style={s.resSug}>Suggest {rm(est.suggested)}</Text>
        </View>
      </View>

      <View style={s.tiers}>
        {PRICE_TIERS.map((t) => {
          const on = t.key === activeKey;
          return (
            <View key={t.key} style={[s.tierRow, on && s.tierOn]}>
              <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={14} color={on ? C.mint : C.muted} />
              <Text style={[s.tierName, on && { color: C.fg }]}>{t.name}</Text>
              <Text style={[s.tierRange, on && { color: C.mint }]}>{t.range}</Text>
            </View>
          );
        })}
      </View>

      <Btn label={`Use suggested ${rm(est.suggested)}`} variant="ghost" icon="sparkles" onPress={() => onUse(est.suggested)} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: R.lg, padding: 16, gap: 14,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headTxt: { fontSize: 13, fontWeight: '800', color: C.fg, letterSpacing: 0.2 },
  ctxRow: { flexDirection: 'row', justifyContent: 'space-between' },
  lbl: { fontSize: 13, fontWeight: '600', color: C.fg },
  ctxVal: { fontSize: 13, fontWeight: '800', color: C.blue, fontVariant: ['tabular-nums'] },
  bar: { height: 6, borderRadius: 3, backgroundColor: C.border, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: C.blue },
  hint: { fontSize: 11, color: C.muted, marginTop: -6 },
  result: {
    backgroundColor: C.card2, borderRadius: R.md, padding: 14, gap: 4,
    borderWidth: 1, borderColor: C.mint,
  },
  resLbl: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase' },
  resTier: { fontSize: 15, fontWeight: '800', color: C.fg },
  resRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  resRange: { fontSize: 13, color: C.muted, fontVariant: ['tabular-nums'] },
  resSug: { fontSize: 16, fontWeight: '800', color: C.mint, fontVariant: ['tabular-nums'] },
  tiers: { gap: 6 },
  tierRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: R.sm,
  },
  tierOn: { backgroundColor: C.mintSoft },
  tierName: { flex: 1, minWidth: 0, fontSize: 12, color: C.muted },
  tierRange: { fontSize: 12, fontWeight: '700', color: C.muted, fontVariant: ['tabular-nums'] },
});
