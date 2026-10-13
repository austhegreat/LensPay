// In-memory app state. Replace with a backend (Supabase, Firebase, your API) for production.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  SEED_PHOTOS,
  SEED_TXS,
  BOUNTIES,
  WALLET_START,
  CAPTURES_START,
  SALES_START,
  EARNED_START,
  BOUNTY_FEE,
  PLATFORM_FEE,
  splitAmount,
} from './data';

const LensContext = createContext(null);

let seq = 0;
const nid = (prefix) => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`;

export function LensProvider({ children }) {
  const [wallet, setWallet] = useState(WALLET_START);
  const [captures, setCaptures] = useState(CAPTURES_START);
  const [sales, setSales] = useState(SALES_START);
  const [earned, setEarned] = useState(EARNED_START);
  const [photos, setPhotos] = useState(SEED_PHOTOS);
  const [txs, setTxs] = useState(SEED_TXS);
  const [licensed, setLicensed] = useState([]);
  const [bountySlots, setBountySlots] = useState(() =>
    Object.fromEntries(BOUNTIES.map((b) => [b.id, b.slots]))
  );
  const [pendingBountyId, setPendingBountyId] = useState(null);

  const addTx = useCallback((tx) => {
    setTxs((prev) => [{ id: nid('t'), time: 'Just now', ...tx }, ...prev]);
  }, []);

  // Stores a verified capture. Marketplace listings enter Discover. Bounty submissions
  // are bought by the brand at the reward price and credited to the wallet immediately.
  const submitCapture = useCallback(
    (draft) => {
      setCaptures((c) => c + 1);

      if (draft.bountyId) {
        const bounty = BOUNTIES.find((b) => b.id === draft.bountyId);
        const { payout, platform } = splitAmount(bounty.reward, BOUNTY_FEE);
        setWallet((w) => +(w + payout).toFixed(2));
        setEarned((e) => e + payout);
        setSales((s) => s + 1);
        setBountySlots((sl) => ({ ...sl, [bounty.id]: Math.max(0, sl[bounty.id] - 1) }));
        addTx({
          type: 'bounty',
          title: `Bounty · ${bounty.brand}`,
          party: bounty.brand,
          amount: payout,
          fee: platform,
        });
        setPendingBountyId(null);
        return { kind: 'bounty', payout, platform };
      }

      const photo = { id: nid('u'), handle: '@you', verified: true, sold: 0, ...draft };
      setPhotos((p) => [photo, ...p]);
      return { kind: 'listed', photo };
    },
    [addTx]
  );

  // Simulated license purchase. The creator receives the net share after the platform fee.
  const buyLicense = useCallback(
    ({ photo, buyer, method, amount }) => {
      const { payout } = splitAmount(amount, PLATFORM_FEE);
      setLicensed((l) => [...l, photo.id]);
      setPhotos((ps) => ps.map((p) => (p.id === photo.id ? { ...p, sold: p.sold + 1 } : p)));
      setWallet((w) => +(w + payout).toFixed(2));
      setEarned((e) => e + payout);
      setSales((s) => s + 1);
      addTx({ type: 'sale', title: photo.title, party: buyer, amount: payout, gross: amount, method });
    },
    [addTx]
  );

  // Simulated instant transfer. Returns the amount sent, or 0 if below the minimum.
  const withdraw = useCallback(
    (method) => {
      if (wallet < 1) return 0;
      const amt = wallet;
      setWallet(0);
      addTx({
        type: 'withdraw',
        title: `${method} transfer`,
        party: method === 'DuitNow' ? 'Your bank account' : 'Your e-wallet',
        amount: -amt,
      });
      return amt;
    },
    [wallet, addTx]
  );

  const value = useMemo(
    () => ({
      wallet, captures, sales, earned, photos, txs, licensed,
      bountySlots, pendingBountyId, setPendingBountyId,
      submitCapture, buyLicense, withdraw,
    }),
    [wallet, captures, sales, earned, photos, txs, licensed, bountySlots, pendingBountyId,
      submitCapture, buyLicense, withdraw]
  );

  return <LensContext.Provider value={value}>{children}</LensContext.Provider>;
}

export function useLens() {
  const ctx = useContext(LensContext);
  if (!ctx) throw new Error('useLens must be used inside LensProvider');
  return ctx;
}
