import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FISH = [
  {
    emoji: '🐟', name: 'Largemouth Yellowfish', sci: 'Labeobarbus kimberleyensis',
    desc: "SA's premier freshwater sport fish. Found in Orange & Vaal river systems.",
    tags: ['Freshwater', 'Game Fish'],
    baits: [
      { icon: '🪝', name: 'Dry Fly', tip: 'Caddis, Hoppers — fast water' },
      { icon: '🌽', name: 'Maize', tip: 'Size 4–6 hook, free-line' },
      { icon: '🪱', name: 'Earthworm', tip: 'Best after rain / floods' },
      { icon: '🎣', name: 'Nymphs', tip: 'Czech nymphing in runs' },
    ],
    seasons: ['Summer', 'Autumn', 'Spring'],
    record: '15.3 kg', recordLen: '94 cm',
    tip: 'Fish deeper pools in the heat of the day. Dawn and dusk are prime feeding windows. Use fluorocarbon leader minimum 12lb.',
  },
  {
    emoji: '🦈', name: 'Snoek', sci: 'Thyrsites atun',
    desc: "Fast, aggressive pelagic fish. Cape Town's iconic winter catch.",
    tags: ['Saltwater', 'Game Fish'],
    baits: [
      { icon: '🎣', name: 'Jig', tip: 'Silver 60–100g, fast retrieve' },
      { icon: '🐟', name: 'Pilchard', tip: 'Fresh or frozen, whole' },
      { icon: '🦑', name: 'Squid', tip: 'Strip bait on single hook' },
      { icon: '🪝', name: 'Spoon', tip: 'Chrome finish, trolling' },
    ],
    seasons: ['Winter', 'Autumn'],
    record: '8.2 kg', recordLen: '120 cm',
    tip: 'Snoek run in schools — when you find one, you find hundreds. Use a wire trace to prevent bite-offs.',
  },
  {
    emoji: '🐡', name: 'Tigerfish', sci: 'Hydrocynus vittatus',
    desc: "Africa's most ferocious freshwater predator. Zambezi & Limpopo.",
    tags: ['Freshwater', 'Game Fish'],
    baits: [
      { icon: '🎣', name: 'Spinner', tip: 'Mepps #3–5, silver blade' },
      { icon: '🐛', name: 'Live bait', tip: 'Small bream, free-lined' },
      { icon: '🪝', name: 'Streamer', tip: 'Large flashy patterns' },
      { icon: '🎯', name: 'Rapala', tip: 'Jointed floating minnow' },
    ],
    seasons: ['Summer', 'Spring'],
    record: '15.0 kg', recordLen: '100 cm',
    tip: 'Steel wire trace is essential — Tigerfish teeth will cut through anything else instantly.',
  },
  {
    emoji: '🐠', name: 'Rainbow Trout', sci: 'Oncorhynchus mykiss',
    desc: 'Introduced cold-water species. Thrives in Mpumalanga & KZN highlands.',
    tags: ['Freshwater', 'Fly Fishing'],
    baits: [
      { icon: '🪝', name: 'Dry Fly', tip: 'Adams, Elk Hair Caddis' },
      { icon: '🪱', name: 'Worm', tip: 'Natural or PowerBait' },
      { icon: '🎣', name: 'Nymph', tip: 'Hare\'s Ear, Pheasant Tail' },
      { icon: '🥄', name: 'Spoon', tip: 'Gold or rainbow finish' },
    ],
    seasons: ['Summer', 'Autumn', 'Spring'],
    record: '8.9 kg', recordLen: '85 cm',
    tip: 'Trout are easily spooked — approach the water slowly and cast upstream. Early morning is best.',
  },
];

const SEASONS = ['Summer', 'Autumn', 'Winter', 'Spring'];

export default function Wiki() {
  const [selected, setSelected] = useState<number | null>(null);

  if (selected !== null) {
    const fish = FISH[selected];
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSelected(null)}>
          <Text style={styles.backText}>← Back to Wiki</Text>
        </TouchableOpacity>
        <ScrollView style={styles.detail}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailEmoji}>{fish.emoji}</Text>
            <View>
              <Text style={styles.detailName}>{fish.name}</Text>
              <Text style={styles.detailSci}>{fish.sci}</Text>
              <View style={styles.tagsRow}>
                {fish.tags.map(t => <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>)}
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>🪝 Best Baits & Lures</Text>
          <View style={styles.baitGrid}>
            {fish.baits.map(b => (
              <View key={b.name} style={styles.baitCard}>
                <Text style={styles.baitIcon}>{b.icon}</Text>
                <View>
                  <Text style={styles.baitName}>{b.name}</Text>
                  <Text style={styles.baitTip}>{b.tip}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>📅 Peak Seasons</Text>
          <View style={styles.seasonRow}>
            {SEASONS.map(s => (
              <View key={s} style={[styles.seasonChip, fish.seasons.includes(s) ? styles.seasonActive : styles.seasonInactive]}>
                <Text style={[styles.seasonText, !fish.seasons.includes(s) && styles.seasonTextInactive]}>{s}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>📊 Records</Text>
          <View style={styles.recordRow}>
            <View style={styles.recordCard}><Text style={styles.recordVal}>{fish.record}</Text><Text style={styles.recordLabel}>Record Weight</Text></View>
            <View style={styles.recordCard}><Text style={styles.recordVal}>{fish.recordLen}</Text><Text style={styles.recordLabel}>Record Length</Text></View>
          </View>

          <Text style={styles.sectionTitle}>💬 Pro Tip</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>{fish.tip}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fish Wiki</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {FISH.map((fish, i) => (
          <TouchableOpacity key={fish.name} style={styles.card} onPress={() => setSelected(i)}>
            <View style={styles.fishIcon}><Text style={styles.fishIconEmoji}>{fish.emoji}</Text></View>
            <View style={styles.cardInfo}>
              <Text style={styles.fishName}>{fish.name}</Text>
              <Text style={styles.fishSci}>{fish.sci}</Text>
              <Text style={styles.fishDesc}>{fish.desc}</Text>
              <View style={styles.tagsRow}>
                {fish.tags.map(t => <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>)}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b14' },
  header: { padding: 20, paddingBottom: 12 },
  title: { fontSize: 32, fontWeight: '900', color: '#fafaf8', letterSpacing: 2 },
  card: { backgroundColor: '#131f18', borderWidth: 1, borderColor: '#1e3028', borderRadius: 16, padding: 14, flexDirection: 'row', gap: 14 },
  fishIcon: { width: 64, height: 64, backgroundColor: '#0a2a1a', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fishIconEmoji: { fontSize: 36 },
  cardInfo: { flex: 1 },
  fishName: { fontSize: 15, fontWeight: '700', color: '#fafaf8' },
  fishSci: { fontSize: 11, color: '#8a9490', fontStyle: 'italic', marginTop: 1 },
  fishDesc: { fontSize: 12, color: '#7fb89a', marginTop: 6, lineHeight: 18 },
  tagsRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  tag: { backgroundColor: '#1a2e22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 10, color: '#4a8b63', fontWeight: '500' },
  backBtn: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#4a8b63', fontSize: 14, fontWeight: '600' },
  detail: { paddingHorizontal: 20 },
  detailHeader: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 16 },
  detailEmoji: { fontSize: 60 },
  detailName: { fontSize: 20, fontWeight: '700', color: '#fafaf8' },
  detailSci: { fontSize: 13, color: '#8a9490', fontStyle: 'italic', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#7fb89a', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  baitGrid: { gap: 8 },
  baitCard: { backgroundColor: '#1a2e22', borderWidth: 1, borderColor: '#2a3d33', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  baitIcon: { fontSize: 24 },
  baitName: { fontSize: 13, fontWeight: '600', color: '#b8ddc8' },
  baitTip: { fontSize: 11, color: '#8a9490', marginTop: 1 },
  seasonRow: { flexDirection: 'row', gap: 8 },
  seasonChip: { flex: 1, padding: 8, borderRadius: 8, alignItems: 'center' },
  seasonActive: { backgroundColor: '#2d5a40' },
  seasonInactive: { backgroundColor: '#131f18' },
  seasonText: { fontSize: 11, fontWeight: '700', color: '#b8ddc8', textTransform: 'uppercase' },
  seasonTextInactive: { color: '#8a9490' },
  recordRow: { flexDirection: 'row', gap: 8 },
  recordCard: { flex: 1, backgroundColor: '#131f18', borderWidth: 1, borderColor: '#1e3028', borderRadius: 12, padding: 14, alignItems: 'center' },
  recordVal: { fontSize: 22, fontWeight: '900', color: '#e8a830' },
  recordLabel: { fontSize: 10, color: '#8a9490', textTransform: 'uppercase', marginTop: 2 },
  tipCard: { backgroundColor: '#131f18', borderLeftWidth: 3, borderLeftColor: '#e8a830', borderRadius: 8, padding: 14, marginBottom: 40 },
  tipText: { fontSize: 13, color: '#e8ede9', lineHeight: 20 },
});