import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '../theme';
import { CATEGORIES, CAT_ICON, rm } from '../data';
import { useLens } from '../store';
import { Header, Chip, Btn } from '../components/Ui';
import PhotoDetail from '../components/PhotoDetail';

// Strip punctuation so "McDonalds" matches "McDonald's" and "#Automotive" matches "automotive"
const norm = (x) => x.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

export default function MarketScreen() {
  const { photos, licensed } = useLens();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [selected, setSelected] = useState(null);

  const results = useMemo(() => {
    const words = norm(query).split(' ').filter(Boolean);
    return photos.filter((p) => {
      if (cat !== 'all' && p.cat !== cat) return false;
      if (words.length === 0) return true;
      const haystack = norm([p.title, p.remark, p.location, p.handle, ...(p.tags || [])].join(' '));
      return words.every((w) => haystack.includes(w));
    });
  }, [photos, query, cat]);

  return (
    <View style={s.root}>
      <View style={s.top}>
        <Header eyebrow="Discover" title="Authentic marketplace" />

        <View style={s.search}>
          <Ionicons name="search" size={18} color={C.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder='Try "BMW", "McDonalds", "flood"'
            placeholderTextColor={C.muted}
            style={s.input}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Search verified photos"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={C.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pills}>
          {CATEGORIES.map((c) => (
            <Chip key={c.key} label={c.label} active={cat === c.key} onPress={() => setCat(c.key)} />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={results}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={s.col}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={s.count}>
            {results.length} verified {results.length === 1 ? 'photo' : 'photos'}
            {query ? ` for “${query}”` : ''}
          </Text>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="search-outline" size={36} color={C.muted} />
            <Text style={s.emptyTxt}>No verified photos match that search yet.</Text>
            <Btn
              label="Clear filters"
              variant="ghost"
              onPress={() => {
                setQuery('');
                setCat('all');
              }}
            />
          </View>
        }
        renderItem={({ item }) => (
          <PhotoCard photo={item} owned={licensed.includes(item.id)} onPress={() => setSelected(item)} />
        )}
      />

      {selected ? <PhotoDetail key={selected.id} photo={selected} onClose={() => setSelected(null)} /> : null}
    </View>
  );
}

function PhotoCard({ photo, owned, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={s.card} accessibilityRole="button">
      <View style={s.thumb}>
        {photo.uri ? (
          <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient colors={photo.colors} style={StyleSheet.absoluteFill} />
        )}
        <View style={s.thumbIcon} pointerEvents="none">
          <Ionicons name={CAT_ICON[photo.cat] || 'image'} size={34} color="rgba(255,255,255,0.2)" />
        </View>
        <View style={s.verified}>
          <Ionicons name="shield-checkmark" size={11} color={C.blue} />
          <Text style={s.verifiedTxt}>VERIFIED</Text>
        </View>
        {owned ? (
          <View style={s.licensed}>
            <Text style={s.licensedTxt}>LICENSED</Text>
          </View>
        ) : null}
      </View>

      <View style={s.body}>
        <Text style={s.title} numberOfLines={2}>
          {photo.title}
        </Text>
        <Text style={s.meta} numberOfLines={1}>
          {photo.handle} · {photo.location}
        </Text>
        <View style={s.foot}>
          <Text style={s.price}>{rm(photo.price)}</Text>
          <Text style={s.sold}>{photo.sold} sold</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  top: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, gap: 12 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 10,
  },
  input: { flex: 1, minWidth: 0, fontSize: 15, color: C.fg, padding: 0 },
  pills: { gap: 8, paddingVertical: 2 },

  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  col: { gap: 12 },
  count: { fontSize: 12, color: C.muted, marginBottom: 12, fontVariant: ['tabular-nums'] },

  card: {
    flex: 1, minWidth: 0, backgroundColor: C.card, borderRadius: R.lg,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 12,
  },
  thumb: { width: '100%', aspectRatio: 4 / 5, backgroundColor: C.card2 },
  thumbIcon: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  verified: {
    position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(11,15,23,0.8)', borderWidth: 1, borderColor: C.blue,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: R.sm,
  },
  verifiedTxt: { fontSize: 8, fontWeight: '800', color: C.blue, letterSpacing: 0.6 },
  licensed: {
    position: 'absolute', top: 8, right: 8, backgroundColor: C.mint,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: R.sm,
  },
  licensedTxt: { fontSize: 8, fontWeight: '800', color: C.ink, letterSpacing: 0.6 },

  body: { padding: 10, gap: 3 },
  title: { fontSize: 13, fontWeight: '700', color: C.fg, lineHeight: 17 },
  meta: { fontSize: 11, color: C.muted },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  price: { fontSize: 13, fontWeight: '800', color: C.mint, fontVariant: ['tabular-nums'] },
  sold: { fontSize: 11, color: C.muted },

  empty: { alignItems: 'center', gap: 12, padding: 32 },
  emptyTxt: { fontSize: 14, color: C.muted, textAlign: 'center' },
});
