import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '../theme';
import {
  SCENES,
  CATEGORIES,
  CAT_TAGS,
  CAT_ICON,
  BOUNTIES,
  PLATFORM_FEE,
  BOUNTY_FEE,
  rm,
  splitAmount,
} from '../data';
import { useLens } from '../store';
import { Header, Chip, Btn } from '../components/Ui';
import ProvenanceCard from '../components/ProvenanceCard';
import PriceEstimator from '../components/PriceEstimator';

const VERIFY_STEPS = [
  'Checking C2PA content credentials',
  'Analysing sensor noise pattern',
  'Scanning for digital screen moiré',
  'Validating EXIF metadata integrity',
  'Cross-checking device fingerprint',
  'Sealing SHA-256 provenance hash',
];

const REMARK_MIN = 40;
const REMARK_MAX = 280;
const LIVE_SEED = { title: '', cat: 'street', location: 'Kuala Lumpur, MY', remark: '', tags: [] };

// Mock hardware provenance. Expo Go cannot read signed C2PA manifests, so this is generated locally.
function makeProvenance() {
  const hex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return {
    sha: `0x${hex.slice(0, 4)}...${hex.slice(-4)}`,
    device: Platform.OS === 'ios' ? 'iPhone 15 Pro Max' : 'Pixel 8 Pro',
    time: new Date().toISOString(),
    geo: '3.1390° N, 101.6869° E',
  };
}

function suggestTags(cat, remark) {
  const base = CAT_TAGS[cat] || ['#Unfiltered'];
  const extra = /no ai|untouched|unedited|unstaged|raw|no filter/i.test(remark) ? ['#NoAI'] : [];
  return [...new Set([...base, ...extra])];
}

function Corners() {
  const pos = [
    { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2 },
    { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2 },
    { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2 },
    { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2 },
  ];
  return pos.map((p, i) => <View key={i} pointerEvents="none" style={[s.corner, p]} />);
}

function CapturePreview({ captured, height = 220 }) {
  return (
    <View style={[s.previewBox, { height }]}>
      {captured.uri ? (
        <Image source={{ uri: captured.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <>
          <LinearGradient colors={captured.scene.colors} style={StyleSheet.absoluteFill} />
          <View style={s.previewIcon} pointerEvents="none">
            <Ionicons name={captured.scene.icon} size={56} color="rgba(255,255,255,0.16)" />
          </View>
        </>
      )}
    </View>
  );
}

export default function CaptureScreen() {
  const { pendingBountyId, setPendingBountyId } = useLens();
  const bounty = BOUNTIES.find((b) => b.id === pendingBountyId) || null;

  const [permission, requestPermission] = useCameraPermissions();
  const [wantLive, setWantLive] = useState(true);
  const [camFailed, setCamFailed] = useState(false);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [stage, setStage] = useState('viewfinder'); // viewfinder | verifying | story | done
  const [captured, setCaptured] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState(null);

  const flash = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const camRef = useRef(null);
  const busy = useRef(false);

  const canLive = Platform.OS !== 'web' && !!permission?.granted && !camFailed;
  const live = wantLive && canLive;
  const scene = SCENES[sceneIdx];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Steps run one after another; the last tick hands off to the story form.
  useEffect(() => {
    if (stage !== 'verifying') return undefined;
    setStepIdx(0);
    const timers = VERIFY_STEPS.map((_, i) => setTimeout(() => setStepIdx(i + 1), 650 * (i + 1)));
    timers.push(setTimeout(() => setStage('story'), 650 * VERIFY_STEPS.length + 500));
    return () => timers.forEach(clearTimeout);
  }, [stage]);

  const pickLive = async () => {
    if (Platform.OS === 'web') {
      setWantLive(false);
      return;
    }
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        setWantLive(false);
        return;
      }
    }
    setCamFailed(false);
    setWantLive(true);
  };

  const flashShutter = () => {
    flash.setValue(0.85);
    Animated.timing(flash, { toValue: 0, duration: 280, useNativeDriver: true }).start();
  };

  const takePhoto = async () => {
    if (busy.current) return;
    busy.current = true;
    flashShutter();

    let uri = null;
    if (live && camRef.current) {
      try {
        const photo = await camRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
        uri = photo?.uri ?? null;
      } catch (e) {
        uri = null;
      }
      if (!uri) {
        busy.current = false;
        Alert.alert('Capture failed', 'Try the shutter again, or switch to a simulated scene.');
        return;
      }
    }

    setCaptured({
      uri,
      scene,
      seed: live ? LIVE_SEED : scene.seed,
      meta: makeProvenance(),
    });
    setStage('verifying');
    busy.current = false;
  };

  const reset = () => {
    setCaptured(null);
    setResult(null);
    setStage('viewfinder');
  };

  if (stage === 'verifying' && captured) {
    return (
      <ScrollView contentContainerStyle={s.scroll}>
        <Header eyebrow="Step 2 · Verify" title="Cryptographic checks" sub="Running on-device provenance tests." />
        <CapturePreview captured={captured} height={180} />
        <View style={s.steps}>
          {VERIFY_STEPS.map((label, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <View
                key={label}
                style={[
                  s.step,
                  done && { borderColor: 'rgba(16,185,129,0.45)' },
                  active && { borderColor: C.blue },
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark-circle" size={18} color={C.mint} />
                ) : active ? (
                  <ActivityIndicator size="small" color={C.blue} />
                ) : (
                  <Ionicons name="ellipse-outline" size={18} color={C.muted} />
                )}
                <Text style={[s.stepTxt, (done || active) && { color: C.fg }]}>{label}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  if (stage === 'story' && captured) {
    return (
      <StoryForm
        captured={captured}
        bounty={bounty}
        onRetake={reset}
        onDone={(res) => {
          setResult(res);
          setPendingBountyId(null);
          setStage('done');
        }}
      />
    );
  }

  if (stage === 'done') {
    const isBounty = result?.kind === 'bounty';
    return (
      <View style={s.doneWrap}>
        <View style={s.doneIcon}>
          <Ionicons name={isBounty ? 'briefcase' : 'checkmark'} size={36} color={C.ink} />
        </View>
        <Text style={s.doneTitle}>
          {isBounty ? `Bounty paid · ${rm(result.payout)}` : 'Verified and listed'}
        </Text>
        <Text style={s.doneSub}>
          {isBounty
            ? `Brand purchase confirmed. A ${Math.round(BOUNTY_FEE * 100)}% facilitation fee (${rm(result.platform)}) was deducted, and the balance is in your wallet.`
            : 'Your photo is live in Discover with its provenance seal attached.'}
        </Text>
        <Btn label="Capture another" icon="camera" onPress={reset} />
      </View>
    );
  }

  // Viewfinder
  return (
    <ScrollView contentContainerStyle={s.scroll}>
      <Header
        eyebrow="Step 1 · Capture"
        title="Take a real photo"
        sub="Unedited, on-the-ground and timestamped. AI renders and screenshots are rejected."
      />

      {bounty ? (
        <View style={s.bountyTag}>
          <Ionicons name="briefcase" size={16} color={C.blue} />
          <Text style={s.bountyTxt} numberOfLines={2}>
            {bounty.brand} · RM {bounty.reward} per verified photo
          </Text>
          <TouchableOpacity onPress={() => setPendingBountyId(null)} accessibilityLabel="Remove bounty">
            <Ionicons name="close" size={18} color={C.muted} />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={s.modeRow}>
        <Chip label="Live camera" icon="camera" active={live} onPress={pickLive} />
        <Chip label="Simulated scene" icon="image" active={!live} onPress={() => setWantLive(false)} />
      </View>

      <View style={s.frame}>
        {live ? (
          <CameraView
            ref={camRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            onMountError={() => setCamFailed(true)}
          />
        ) : (
          <LinearGradient colors={scene.colors} style={StyleSheet.absoluteFill}>
            <View style={s.sceneCenter} pointerEvents="none">
              <Ionicons name={scene.icon} size={72} color="rgba(255,255,255,0.18)" />
              <Text style={s.sceneLbl}>{scene.label}</Text>
            </View>
          </LinearGradient>
        )}

        <Corners />
        <Animated.View pointerEvents="none" style={[s.crosshair, { transform: [{ scale: pulse }] }]} />
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: flash }]}
        />
        <View style={s.hud} pointerEvents="none">
          <Text style={s.hudTxt}>{live ? 'LIVE' : 'SIMULATED'} · 4032×3024</Text>
          <Text style={s.hudTxt}>ISO 800 · f/1.8</Text>
        </View>
      </View>

      {!live ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.sceneRow}>
          {SCENES.map((sc, i) => (
            <Chip key={sc.key} label={sc.label} icon={sc.icon} active={sceneIdx === i} onPress={() => setSceneIdx(i)} />
          ))}
        </ScrollView>
      ) : null}

      {Platform.OS === 'web' ? (
        <Text style={s.note}>Live camera runs in Expo Go on your phone. This preview uses simulated scenes.</Text>
      ) : null}
      {camFailed ? (
        <Text style={s.note}>The live camera could not start on this device. Using simulated scenes.</Text>
      ) : null}

      {Platform.OS !== 'web' && permission && !permission.granted ? (
        <View style={s.permCard}>
          <Text style={s.permTxt}>
            {permission.canAskAgain === false
              ? 'Camera access is off. Enable it in iOS Settings or Android app permissions, or test with simulated scenes.'
              : 'Allow camera access to shoot live. Simulated scenes work without it.'}
          </Text>
          {permission.canAskAgain !== false ? (
            <Btn label="Grant Camera Permission" icon="camera" variant="blue" onPress={requestPermission} />
          ) : null}
        </View>
      ) : null}

      {permission === null && Platform.OS !== 'web' ? (
        <View style={s.loadingRow}>
          <ActivityIndicator color={C.mint} />
          <Text style={s.note}>Checking camera access…</Text>
        </View>
      ) : null}

      <View style={s.shutterWrap}>
        <TouchableOpacity onPress={takePhoto} activeOpacity={0.8} style={s.shutterOuter} accessibilityLabel="Capture photo">
          <View style={s.shutterInner} />
        </TouchableOpacity>
        <Text style={s.shutterLbl}>{live ? 'Shoot' : `Shoot · ${scene.label}`}</Text>
      </View>
    </ScrollView>
  );
}

function StoryForm({ captured, bounty, onRetake, onDone }) {
  const { submitCapture } = useLens();
  const seed = captured.seed;

  const [title, setTitle] = useState(seed.title);
  const [cat, setCat] = useState(seed.cat);
  const [location, setLocation] = useState(seed.location);
  const [remark, setRemark] = useState(seed.remark);
  const [tags, setTags] = useState(() => (seed.tags?.length ? seed.tags : suggestTags(seed.cat, seed.remark).slice(0, 3)));
  const [price, setPrice] = useState('');
  const [toBounty, setToBounty] = useState(!!bounty);
  const [error, setError] = useState('');

  const bountyMode = !!bounty && toBounty;
  const suggestions = useMemo(() => suggestTags(cat, remark), [cat, remark]);
  const remarkLen = remark.trim().length;
  const priceNum = parseFloat(price) || 0;
  const split = splitAmount(priceNum, PLATFORM_FEE);

  const pickCat = (key) => {
    setCat(key);
    setTags(suggestTags(key, remark).slice(0, 3));
  };

  const toggleTag = (t) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const publish = () => {
    setError('');
    if (!title.trim()) {
      setError('Add a title for this photo.');
      return;
    }
    if (remarkLen < REMARK_MIN) {
      setError(`Add at least ${REMARK_MIN} characters of context. Buyers pay for the story.`);
      return;
    }

    const base = {
      title: title.trim(),
      cat,
      location: location.trim() || 'Kuala Lumpur, MY',
      remark: remark.trim(),
      tags,
      meta: captured.meta,
      uri: captured.uri,
      colors: captured.scene.colors,
      icon: CAT_ICON[cat],
    };

    if (bountyMode) {
      onDone(submitCapture({ ...base, bountyId: bounty.id, price: bounty.reward }));
      return;
    }

    if (priceNum < 5) {
      setError('Set a listing price of at least RM 5.');
      return;
    }
    onDone(submitCapture({ ...base, price: priceNum }));
  };

  return (
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <Header eyebrow="Step 3 · Context" title="Tell the story" sub="Verified photos need a story. This is what separates a real capture from a stock image." />

      <CapturePreview captured={captured} height={190} />
      <ProvenanceCard meta={captured.meta} />

      {bounty ? (
        <View style={s.block}>
          <Text style={s.lbl}>BRAND BOUNTY</Text>
          <View style={s.bountyCard}>
            <Text style={s.bountyBrand}>{bounty.brand}</Text>
            <Text style={s.bountyBrief}>{bounty.brief}</Text>
          </View>
          <View style={s.modeRow}>
            <Chip label="Submit to bounty" icon="briefcase" active={toBounty} onPress={() => setToBounty(true)} />
            <Chip label="List for sale instead" icon="pricetag" active={!toBounty} onPress={() => setToBounty(false)} />
          </View>
        </View>
      ) : null}

      <View style={s.block}>
        <Text style={s.lbl}>WHAT IS UNIQUE ABOUT THIS SHOT?</Text>
        <TextInput
          value={remark}
          onChangeText={setRemark}
          maxLength={REMARK_MAX}
          multiline
          placeholder="Tell the story behind the frame. Where, when, what you noticed."
          placeholderTextColor={C.muted}
          style={[s.input, s.area]}
        />
        <Text style={[s.counter, remarkLen < REMARK_MIN && { color: C.amber }]}>
          {remarkLen}/{REMARK_MAX} · minimum {REMARK_MIN}
        </Text>
      </View>

      <View style={s.block}>
        <Text style={s.lbl}>SMART TAGS</Text>
        <View style={s.modeRow}>
          {suggestions.map((t) => (
            <Chip key={t} label={t} active={tags.includes(t)} onPress={() => toggleTag(t)} />
          ))}
        </View>
      </View>

      <View style={s.block}>
        <Text style={s.lbl}>TITLE</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Golden hour at Petronas Towers"
          placeholderTextColor={C.muted}
          style={s.input}
        />
      </View>

      <View style={s.block}>
        <Text style={s.lbl}>CATEGORY</Text>
        <View style={s.modeRow}>
          {CATEGORIES.filter((c) => c.key !== 'all').map((c) => (
            <Chip key={c.key} label={c.label} active={cat === c.key} onPress={() => pickCat(c.key)} />
          ))}
        </View>
      </View>

      <View style={s.block}>
        <Text style={s.lbl}>LOCATION</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Where was this taken?"
          placeholderTextColor={C.muted}
          style={s.input}
        />
      </View>

      {!bountyMode ? (
        <>
          <PriceEstimator remarkLen={remarkLen} tagCount={tags.length} onUse={(v) => setPrice(String(v))} />

          <View style={s.block}>
            <Text style={s.lbl}>LISTING PRICE (MYR)</Text>
            <View style={s.priceWrap}>
              <Text style={s.rmPre}>RM</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={C.muted}
                style={[s.input, { paddingLeft: 48, fontVariant: ['tabular-nums'] }]}
              />
            </View>
          </View>

          <View style={s.breakdown}>
            <View style={s.bRow}>
              <Text style={s.bK}>Listing price</Text>
              <Text style={s.bV}>{rm(split.gross)}</Text>
            </View>
            <View style={s.bRow}>
              <Text style={s.bK}>Platform fee ({Math.round(PLATFORM_FEE * 100)}%)</Text>
              <Text style={s.bV}>-{rm(split.platform)}</Text>
            </View>
            <View style={[s.bRow, s.bTotal]}>
              <Text style={s.bK}>Your payout</Text>
              <Text style={[s.bV, { color: C.mint, fontSize: 17 }]}>{rm(split.payout)}</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={s.breakdown}>
          <View style={s.bRow}>
            <Text style={s.bK}>Brand reward</Text>
            <Text style={s.bV}>{rm(bounty.reward)}</Text>
          </View>
          <View style={s.bRow}>
            <Text style={s.bK}>Facilitation fee ({Math.round(BOUNTY_FEE * 100)}%)</Text>
            <Text style={s.bV}>-{rm(splitAmount(bounty.reward, BOUNTY_FEE).platform)}</Text>
          </View>
          <View style={[s.bRow, s.bTotal]}>
            <Text style={s.bK}>Credited to wallet now</Text>
            <Text style={[s.bV, { color: C.mint, fontSize: 17 }]}>{rm(splitAmount(bounty.reward, BOUNTY_FEE).payout)}</Text>
          </View>
        </View>
      )}

      {error ? <Text style={s.error}>{error}</Text> : null}

      <Btn
        label={bountyMode ? 'Submit to bounty' : 'List on Discover'}
        icon={bountyMode ? 'briefcase' : 'rocket'}
        onPress={publish}
      />
      <Btn label="Retake photo" variant="ghost" icon="refresh" onPress={onRetake} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },

  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sceneRow: { gap: 8, paddingVertical: 2 },

  frame: {
    width: '100%', aspectRatio: 3 / 4, borderRadius: R.lg, overflow: 'hidden',
    backgroundColor: '#000', borderWidth: 1, borderColor: C.border,
  },
  sceneCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 12 },
  sceneLbl: {
    fontSize: 13, fontWeight: '700', color: C.fg, backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: R.pill, overflow: 'hidden',
  },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: C.mint },
  crosshair: {
    position: 'absolute', top: '50%', left: '50%', width: 44, height: 44, marginLeft: -22, marginTop: -22,
    borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(16,185,129,0.7)',
  },
  hud: { position: 'absolute', bottom: 12, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' },
  hudTxt: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.6 },

  bountyTag: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.blueSoft, borderWidth: 1, borderColor: C.blue,
    borderRadius: R.md, padding: 12,
  },
  bountyTxt: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: '700', color: C.fg },

  note: { fontSize: 12, color: C.muted, lineHeight: 17 },
  permCard: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    padding: 14, gap: 12,
  },
  permTxt: { fontSize: 13, lineHeight: 19, color: C.fg },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  shutterWrap: { alignItems: 'center', gap: 8, marginTop: 4 },
  shutterOuter: {
    width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: C.fg,
    alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.mint },
  shutterLbl: { fontSize: 12, fontWeight: '600', color: C.muted },

  previewBox: { width: '100%', borderRadius: R.lg, overflow: 'hidden', backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  previewIcon: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },

  steps: { gap: 8 },
  step: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.border,
  },
  stepTxt: { flex: 1, minWidth: 0, fontSize: 13, color: C.muted },

  doneWrap: { flex: 1, padding: 24, gap: 14, alignItems: 'center', justifyContent: 'center' },
  doneIcon: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: C.mint,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  doneTitle: { fontSize: 20, fontWeight: '800', color: C.fg, textAlign: 'center' },
  doneSub: { fontSize: 14, lineHeight: 21, color: C.muted, textAlign: 'center', marginBottom: 10 },

  block: { gap: 8 },
  lbl: { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.4 },
  input: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.fg,
  },
  area: { minHeight: 110, textAlignVertical: 'top', lineHeight: 21 },
  counter: { fontSize: 11, color: C.muted, textAlign: 'right', fontVariant: ['tabular-nums'] },
  priceWrap: { position: 'relative' },
  rmPre: { position: 'absolute', left: 14, top: 13, zIndex: 1, fontSize: 14, fontWeight: '800', color: C.mint },

  bountyCard: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.blue, borderRadius: R.md, padding: 14, gap: 6,
  },
  bountyBrand: { fontSize: 14, fontWeight: '800', color: C.fg },
  bountyBrief: { fontSize: 13, lineHeight: 19, color: C.muted },

  breakdown: { backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.border, padding: 14, gap: 8 },
  bRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bTotal: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, paddingTop: 10, marginTop: 2 },
  bK: { fontSize: 13, color: C.muted, flexShrink: 1 },
  bV: { fontSize: 13, fontWeight: '700', color: C.fg, fontVariant: ['tabular-nums'] },

  error: { fontSize: 13, color: C.rose, lineHeight: 19 },
});
