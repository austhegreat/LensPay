import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Modal, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R } from '../theme';
import { CAT_ICON, CAT_LABEL, rm, splitAmount } from '../data';
import { useLens } from '../store';
import { Chip, Btn } from './Ui';
import ProvenanceCard from './ProvenanceCard';

const PAY_STEPS = [
  'Connecting to payment gateway',
  'Verifying payment method',
  'Reserving license terms',
  'Unlocking clean hi-res file',
];

const METHODS = ['Stripe card', 'Apple Pay', 'DuitNow FPX'];

const LICENSES = [
  { key: 'editorial', label: 'Editorial', terms: 'Social and editorial use, 1 year', mult: 1 },
  { key: 'commercial', label: 'Commercial', terms: 'Brand and ad use, worldwide, 2 years', mult: 3 },
];

function Watermark() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={[s.wm, { top: `${i * 18}%` }]}>
          LENSPAY PREVIEW · LENSPAY PREVIEW · LENSPAY PREVIEW
        </Text>
      ))}
    </View>
  );
}

function Preview({ photo, unlocked }) {
  return (
    <View style={s.preview}>
      {photo.uri ? (
        <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <>
          <LinearGradient colors={photo.colors} style={StyleSheet.absoluteFill} />
          <View style={s.bigIcon} pointerEvents="none">
            <Ionicons name={CAT_ICON[photo.cat]} size={72} color="rgba(255,255,255,0.14)" />
          </View>
        </>
      )}
      {unlocked ? (
        <View style={s.hiRes}>
          <Ionicons name="lock-open" size={12} color={C.ink} />
          <Text style={s.hiResTxt}>HI-RES · CLEAN · UNLOCKED</Text>
        </View>
      ) : (
        <Watermark />
      )}
    </View>
  );
}

export default function PhotoDetail({ photo, onClose }) {
  const { buyLicense, licensed } = useLens();
  const insets = useSafeAreaInsets();
  const owned = licensed.includes(photo.id);

  const [license, setLicense] = useState('commercial');
  const [method, setMethod] = useState('Apple Pay');
  const [stage, setStage] = useState(owned ? 'unlocked' : 'browse'); // browse | processing | unlocked
  const [done, setDone] = useState([]);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const lic = LICENSES.find((l) => l.key === license);
  const amount = Math.round(photo.price * lic.mult);
  const creator = splitAmount(amount).payout;

  const pay = () => {
    setStage('processing');
    setDone([]);
    PAY_STEPS.forEach((_, i) => {
      timers.current.push(setTimeout(() => setDone((d) => [...d, i]), 650 * (i + 1)));
    });
    timers.current.push(
      setTimeout(() => {
        buyLicense({
          photo,
          buyer: `@buyer_${Math.floor(100 + Math.random() * 900)}`,
          method,
          amount,
        });
        setStage('unlocked');
      }, 650 * (PAY_STEPS.length + 1))
    );
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.topBar}>
          <Text style={s.topTitle} numberOfLines={1}>
            {photo.title}
          </Text>
          <TouchableOpacity onPress={onClose} style={s.close} accessibilityLabel="Close">
            <Ionicons name="close" size={20} color={C.fg} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}>
          <Preview photo={photo} unlocked={stage === 'unlocked'} />

          <View style={s.meta}>
            <Text style={s.handle}>
              {photo.handle} · {photo.location}
            </Text>
            <Text style={s.cat}>{CAT_LABEL[photo.cat]}</Text>
          </View>

          <View style={s.storyBox}>
            <Text style={s.storyLbl}>THE STORY BEHIND THE FRAME</Text>
            <Text style={s.story}>“{photo.remark}”</Text>
          </View>

          <View style={s.tags}>
            {(photo.tags || []).map((t) => (
              <View key={t} style={s.tag}>
                <Text style={s.tagTxt}>{t}</Text>
              </View>
            ))}
          </View>

          <ProvenanceCard meta={photo.meta} />

          {stage === 'unlocked' ? (
            <View style={s.unlock}>
              <View style={s.unlockHead}>
                <Ionicons name="checkmark-circle" size={22} color={C.mint} />
                <Text style={s.unlockTxt}>License active. The clean, high-resolution file is unlocked.</Text>
              </View>
              <Btn
                label="Download clean file"
                icon="download"
                variant="blue"
                onPress={() =>
                  Alert.alert('Prototype', 'In the production build this saves the original file to the buyer’s library.')
                }
              />
            </View>
          ) : (
            <>
              <Text style={s.sectionLbl}>LICENSE</Text>
              <View style={s.licRow}>
                {LICENSES.map((l) => {
                  const on = license === l.key;
                  return (
                    <TouchableOpacity
                      key={l.key}
                      disabled={stage !== 'browse'}
                      onPress={() => setLicense(l.key)}
                      activeOpacity={0.85}
                      style={[s.licCard, on && s.licOn]}
                    >
                      <Text style={[s.licName, on && { color: C.mint }]}>{l.label}</Text>
                      <Text style={s.licPrice}>{rm(Math.round(photo.price * l.mult))}</Text>
                      <Text style={s.licTerms}>{l.terms}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={s.sectionLbl}>PAY WITH</Text>
              <View style={s.methodRow}>
                {METHODS.map((m) => (
                  <Chip
                    key={m}
                    label={m}
                    icon="card"
                    active={method === m}
                    onPress={() => stage === 'browse' && setMethod(m)}
                  />
                ))}
              </View>

              <View style={s.summary}>
                <View style={s.sumRow}>
                  <Text style={s.sumK}>Total</Text>
                  <Text style={s.sumV}>{rm(amount)}</Text>
                </View>
                <View style={s.sumRow}>
                  <Text style={s.sumK}>Platform fee (15%)</Text>
                  <Text style={s.sumV}>{rm(amount - creator)}</Text>
                </View>
                <View style={s.sumRow}>
                  <Text style={s.sumK}>Creator receives</Text>
                  <Text style={[s.sumV, { color: C.mint }]}>{rm(creator)}</Text>
                </View>
              </View>

              {stage === 'processing' &&
                PAY_STEPS.map((label, i) => {
                  const ok = done.includes(i);
                  const active = i === done.length;
                  return (
                    <View key={label} style={s.step}>
                      {ok ? (
                        <Ionicons name="checkmark-circle" size={16} color={C.mint} />
                      ) : active ? (
                        <ActivityIndicator size="small" color={C.blue} />
                      ) : (
                        <Ionicons name="ellipse-outline" size={16} color={C.muted} />
                      )}
                      <Text style={[s.stepTxt, (ok || active) && { color: C.fg }]}>{label}</Text>
                    </View>
                  );
                })}

              <Btn
                label={`Buy ${lic.label} License · ${rm(amount)}`}
                icon="lock-open"
                onPress={pay}
                loading={stage === 'processing'}
              />
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.base },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  topTitle: { flex: 1, minWidth: 0, fontSize: 16, fontWeight: '700', color: C.fg },
  close: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border,
  },
  scroll: { padding: 16, gap: 16 },

  preview: {
    width: '100%', aspectRatio: 4 / 3, borderRadius: R.lg, overflow: 'hidden',
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  bigIcon: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  wm: {
    position: 'absolute', left: -40, right: -40, textAlign: 'center',
    color: 'rgba(255,255,255,0.22)', fontSize: 15, fontWeight: '800', letterSpacing: 2,
    transform: [{ rotate: '-18deg' }],
  },
  hiRes: {
    position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.mint, paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.pill,
  },
  hiResTxt: { fontSize: 10, fontWeight: '800', color: C.ink, letterSpacing: 0.8 },

  meta: { gap: 4 },
  handle: { fontSize: 13, fontWeight: '600', color: C.fg },
  cat: { fontSize: 12, color: C.muted },

  storyBox: {
    backgroundColor: C.card, borderLeftWidth: 3, borderLeftColor: C.mint,
    borderRadius: R.md, padding: 16, gap: 8,
  },
  storyLbl: { fontSize: 10, fontWeight: '800', color: C.mint, letterSpacing: 1.4 },
  story: { fontSize: 15, lineHeight: 23, color: C.fg, fontStyle: 'italic' },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: C.blueSoft, paddingHorizontal: 9, paddingVertical: 4, borderRadius: R.pill },
  tagTxt: { fontSize: 11, fontWeight: '700', color: C.blue },

  unlock: {
    backgroundColor: C.mintSoft, borderWidth: 1, borderColor: C.mint,
    borderRadius: R.lg, padding: 16, gap: 14,
  },
  unlockHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  unlockTxt: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 20, color: C.fg },

  sectionLbl: { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.4, marginTop: 4 },
  licRow: { flexDirection: 'row', gap: 10 },
  licCard: {
    flex: 1, minWidth: 0, backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: R.md, padding: 12, gap: 4,
  },
  licOn: { borderColor: C.mint, backgroundColor: C.mintSoft },
  licName: { fontSize: 14, fontWeight: '800', color: C.fg },
  licPrice: { fontSize: 18, fontWeight: '800', color: C.fg, fontVariant: ['tabular-nums'] },
  licTerms: { fontSize: 11, lineHeight: 15, color: C.muted },

  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  summary: {
    backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.border,
    padding: 14, gap: 8,
  },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sumK: { fontSize: 13, color: C.muted },
  sumV: { fontSize: 13, fontWeight: '700', color: C.fg, fontVariant: ['tabular-nums'] },

  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepTxt: { flex: 1, minWidth: 0, fontSize: 13, color: C.muted },
});
