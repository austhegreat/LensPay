import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '../theme';
import { BOUNTY_FEE, PLATFORM_FEE, rm } from '../data';
import { useLens } from '../store';
import { Header, Chip, Btn, Stat } from '../components/Ui';

const TYPE_META = {
  sale: { icon: 'ribbon', tint: C.mintSoft, color: C.mint },
  bounty: { icon: 'briefcase', tint: C.blueSoft, color: C.blue },
  withdraw: { icon: 'arrow-up-circle', tint: C.card2, color: C.muted },
};

const METHODS = ['DuitNow', 'e-Wallet'];

export default function WalletScreen() {
  const { wallet, captures, sales, earned, txs, withdraw } = useLens();
  const [method, setMethod] = useState('DuitNow');

  const onWithdraw = () => {
    const sent = withdraw(method);
    if (!sent) {
      Alert.alert('Minimum withdrawal', 'Your balance must be at least RM 1.00 to transfer.');
      return;
    }
    Alert.alert('Transfer sent', `${rm(sent)} is on its way via ${method}. This is a simulated transfer.`);
  };

  return (
    <ScrollView contentContainerStyle={s.scroll}>
      <Header eyebrow="Creator Wallet" title="Earnings & payouts" />

      <LinearGradient colors={['rgba(16,185,129,0.22)', 'rgba(16,185,129,0.04)']} style={s.balance}>
        <Text style={s.balLbl}>AVAILABLE BALANCE</Text>
        <Text style={s.balVal}>
          <Text style={s.balCur}>RM </Text>
          {wallet.toFixed(2)}
        </Text>
        <Text style={s.balSub}>Instant transfer, no waiting period</Text>

        <Text style={s.railLbl}>PAYOUT RAIL</Text>
        <View style={s.railRow}>
          {METHODS.map((m) => (
            <Chip key={m} label={m} icon={m === 'DuitNow' ? 'flash' : 'wallet'} active={method === m} onPress={() => setMethod(m)} />
          ))}
        </View>

        <Btn label="Withdraw Balance" icon="flash" onPress={onWithdraw} disabled={wallet < 1} />
      </LinearGradient>

      <View style={s.grid}>
        <Stat label="Verified captures" value={String(captures)} style={s.half} />
        <Stat label="Licenses sold" value={String(sales)} style={s.half} />
        <Stat label="Total earned" value={rm(earned)} accent style={s.half} />
        <Stat label="Fees" value={`${Math.round(PLATFORM_FEE * 100)}% · ${Math.round(BOUNTY_FEE * 100)}%`} style={s.half} />
      </View>

      <Text style={s.section}>TRANSACTION HISTORY</Text>

      {txs.length === 0 ? (
        <Text style={s.empty}>No transactions yet. Capture and list a photo to start earning.</Text>
      ) : (
        txs.map((tx) => {
          const meta = TYPE_META[tx.type] || TYPE_META.sale;
          const isOut = tx.amount < 0;
          return (
            <View key={tx.id} style={s.row}>
              <View style={[s.icon, { backgroundColor: meta.tint }]}>
                <Ionicons name={meta.icon} size={17} color={meta.color} />
              </View>
              <View style={s.rowMeta}>
                <Text style={s.rowTitle} numberOfLines={1}>
                  {tx.title}
                </Text>
                <Text style={s.rowSub} numberOfLines={1}>
                  {tx.time} · {tx.type === 'withdraw' ? `To ${tx.party}` : `From ${tx.party}`}
                </Text>
              </View>
              <Text style={[s.amt, isOut && { color: C.rose }]}>
                {isOut ? '-' : '+'}
                {rm(Math.abs(tx.amount))}
              </Text>
            </View>
          );
        })
      )}

      <TouchableOpacity onPress={() => Alert.alert('Statements', 'Export is available in the production build.')} style={s.export}>
        <Ionicons name="document-text-outline" size={14} color={C.muted} />
        <Text style={s.exportTxt}>Export statement</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },

  balance: {
    borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(16,185,129,0.35)',
    padding: 18, gap: 8,
  },
  balLbl: { fontSize: 10, fontWeight: '800', color: C.mint, letterSpacing: 1.4 },
  balVal: { fontSize: 40, fontWeight: '800', color: C.fg, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  balCur: { fontSize: 18, fontWeight: '600', color: C.mint },
  balSub: { fontSize: 12, color: C.muted, marginBottom: 6 },
  railLbl: { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.4, marginTop: 4 },
  railRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  half: { flexBasis: '47%', flexGrow: 1 },

  section: { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.4, marginTop: 4 },
  empty: { fontSize: 13, color: C.muted },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: 12,
  },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowMeta: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: C.fg },
  rowSub: { fontSize: 12, color: C.muted },
  amt: { fontSize: 14, fontWeight: '800', color: C.mint, fontVariant: ['tabular-nums'] },

  export: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  exportTxt: { fontSize: 12, color: C.muted, fontWeight: '600' },
});
