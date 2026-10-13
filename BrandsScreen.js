import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '../theme';
import { BOUNTIES, BOUNTY_FEE, rm, splitAmount } from '../data';
import { useLens } from '../store';
import { Header, Btn, Stat } from '../components/Ui';

export default function BrandsScreen({ navigate }) {
  const { bountySlots, txs, setPendingBountyId } = useLens();

  const openCount = BOUNTIES.filter((b) => bountySlots[b.id] > 0).length;
  const paidOut = txs.filter((t) => t.type === 'bounty').reduce((sum, t) => sum + t.amount, 0);
  const recent = txs.filter((t) => t.type === 'bounty').slice(0, 4);

  const fulfil = (bounty) => {
    setPendingBountyId(bounty.id);
    if (navigate) navigate(0);
  };

  return (
    <ScrollView contentContainerStyle={s.scroll}>
      <Header eyebrow="Brand Pulse" title="Brand Intel & Real Customer Feedback" />

      <View style={s.banner}>
        <Ionicons name="shield-checkmark" size={20} color={C.blue} />
        <Text style={s.bannerTxt}>
          Brands are drowning in bot reviews and AI-rendered food shots. They pay real people for unfiltered,
          timestamped photos of what customers actually received.
        </Text>
      </View>

      <View style={s.statRow}>
        <Stat label="Open bounties" value={String(openCount)} />
        <Stat label="Paid to you" value={rm(paidOut)} accent />
        <Stat label="Brand fee" value={`${Math.round(BOUNTY_FEE * 100)}%`} />
      </View>

      <Text style={s.section}>ACTIVE BOUNTIES</Text>

      {BOUNTIES.map((b) => {
        const left = bountySlots[b.id];
        const open = left > 0;
        const payout = splitAmount(b.reward, BOUNTY_FEE).payout;
        return (
          <View key={b.id} style={s.card}>
            <View style={s.cardTop}>
              <Text style={s.brand} numberOfLines={1}>
                {b.brand}
              </Text>
              <Text style={s.reward}>{rm(b.reward)}</Text>
            </View>
            <Text style={s.perPhoto}>per verified photo · you receive {rm(payout)}</Text>
            <Text style={s.brief}>{b.brief}</Text>
            <View style={s.metaRow}>
              <View style={s.metaPill}>
                <Ionicons name="layers-outline" size={12} color={open ? C.mint : C.rose} />
                <Text style={[s.metaTxt, { color: open ? C.mint : C.rose }]}>
                  {open ? `${left} slots left` : 'Fully claimed'}
                </Text>
              </View>
              <View style={s.metaPill}>
                <Ionicons name="time-outline" size={12} color={C.muted} />
                <Text style={s.metaTxt}>{b.deadline}</Text>
              </View>
            </View>
            <Btn
              label={open ? 'Fulfil bounty' : 'Fully claimed'}
              icon="camera"
              disabled={!open}
              onPress={() => fulfil(b)}
            />
          </View>
        );
      })}

      <Text style={s.section}>HOW A BOUNTY PAYS</Text>
      <View style={s.howCard}>
        <Text style={s.howTxt}>
          The brand buys your verified photo at the reward price. LensPay keeps a {Math.round(BOUNTY_FEE * 100)}%
          facilitation fee, and the balance lands in your wallet as soon as the purchase clears. Bounty photos stay
          private to the brand and are not shown in Discover.
        </Text>
      </View>

      <Text style={s.section}>RECENT BRAND PURCHASES</Text>
      {recent.length === 0 ? (
        <Text style={s.empty}>No bounty payouts yet. Fulfil a bounty to see it here.</Text>
      ) : (
        recent.map((t) => (
          <View key={t.id} style={s.txRow}>
            <View style={s.txIcon}>
              <Ionicons name="briefcase" size={16} color={C.blue} />
            </View>
            <View style={s.txMeta}>
              <Text style={s.txTitle} numberOfLines={1}>
                {t.party}
              </Text>
              <Text style={s.txSub}>{t.time}</Text>
            </View>
            <Text style={s.txAmt}>+{rm(t.amount)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },

  banner: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: C.blueSoft, borderWidth: 1, borderColor: C.blue,
    borderRadius: R.lg, padding: 14,
  },
  bannerTxt: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 19, color: C.fg },

  statRow: { flexDirection: 'row', gap: 10 },
  section: { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.4, marginTop: 4 },

  card: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: R.lg, padding: 16, gap: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  brand: { flex: 1, minWidth: 0, fontSize: 16, fontWeight: '800', color: C.fg },
  reward: { fontSize: 18, fontWeight: '800', color: C.mint, fontVariant: ['tabular-nums'] },
  perPhoto: { fontSize: 12, color: C.muted, marginTop: -6 },
  brief: { fontSize: 14, lineHeight: 21, color: C.fg },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.card2, paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.pill,
  },
  metaTxt: { fontSize: 12, fontWeight: '600', color: C.muted },

  howCard: { backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, padding: 16 },
  howTxt: { fontSize: 14, lineHeight: 22, color: C.muted },

  empty: { fontSize: 13, color: C.muted },
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: 12,
  },
  txIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  txMeta: { flex: 1, minWidth: 0, gap: 2 },
  txTitle: { fontSize: 14, fontWeight: '700', color: C.fg },
  txSub: { fontSize: 12, color: C.muted },
  txAmt: { fontSize: 14, fontWeight: '800', color: C.mint, fontVariant: ['tabular-nums'] },
});
