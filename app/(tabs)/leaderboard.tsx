import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

const SPECIES = ['All Species', 'Yellowfish', 'Snoek', 'Bass', 'Trout', 'Tigerfish', 'Carp', 'Kob'];

const SPECIES_EMOJI: Record<string, string> = {
  Yellowfish: '🐟', Snoek: '🦈', Bass: '🎣', Trout: '🐠',
  Tigerfish: '🐡', Carp: '🐟', Kob: '🌊', Other: '⚓',
};

export default function Leaderboard() {
  const [activeSpecies, setActiveSpecies] = useState('All Species');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, [activeSpecies]);

  async function loadLeaderboard() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    let query = supabase
      .from('catches')
      .select('*, profiles(username)')
      .not('weight_kg', 'is', null)
      .order('weight_kg', { ascending: false })
      .limit(20);

    if (activeSpecies !== 'All Species') {
      query = query.eq('species', activeSpecies);
    }

    const { data, error } = await query;
    if (!error && data) setEntries(data);
    setLoading(false);
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Biggest catches — real data 🔥</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {SPECIES.map(s => (
          <TouchableOpacity key={s} onPress={() => setActiveSpecies(s)} style={[styles.tab, activeSpecies === s && styles.tabActive]}>
            <Text style={[styles.tabText, activeSpecies === s && styles.tabTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#e8a830" size="large" />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎣</Text>
          <Text style={styles.emptyText}>No catches logged yet for {activeSpecies}!</Text>
          <Text style={styles.emptySubtext}>Be the first to log one.</Text>
        </View>
      ) : (
        <ScrollView>
          {/* Podium */}
          {top3.length >= 3 && (
            <View style={styles.podium}>
              <View style={styles.podiumItem}>
                <Text style={styles.podiumEmoji}>{SPECIES_EMOJI[top3[1]?.species] || '🎣'}</Text>
                <View style={[styles.podiumBlock, styles.podiumSecond]}><Text style={styles.podiumNum}>2</Text></View>
                <Text style={styles.podiumName}>{top3[1]?.profiles?.username || 'Angler'}</Text>
                <Text style={styles.podiumSize}>{top3[1]?.weight_kg} kg</Text>
              </View>
              <View style={styles.podiumItem}>
                <Text style={styles.crown}>👑</Text>
                <Text style={[styles.podiumEmoji, { fontSize: 40 }]}>{SPECIES_EMOJI[top3[0]?.species] || '🎣'}</Text>
                <View style={[styles.podiumBlock, styles.podiumFirst]}><Text style={styles.podiumNum}>1</Text></View>
                <Text style={styles.podiumName}>{top3[0]?.profiles?.username || 'Angler'}</Text>
                <Text style={styles.podiumSize}>{top3[0]?.weight_kg} kg</Text>
              </View>
              <View style={styles.podiumItem}>
                <Text style={styles.podiumEmoji}>{SPECIES_EMOJI[top3[2]?.species] || '🎣'}</Text>
                <View style={[styles.podiumBlock, styles.podiumThird]}><Text style={styles.podiumNum}>3</Text></View>
                <Text style={styles.podiumName}>{top3[2]?.profiles?.username || 'Angler'}</Text>
                <Text style={styles.podiumSize}>{top3[2]?.weight_kg} kg</Text>
              </View>
            </View>
          )}

          {/* Full list */}
          <View style={styles.list}>
            {entries.map((item, i) => {
              const isYou = item.user_id === currentUserId;
              return (
                <View key={item.id} style={[styles.row, isYou && styles.rowYou]}>
                  <Text style={[styles.rank, isYou && styles.rankYou]}>{i + 1}</Text>
                  <Text style={styles.rowEmoji}>{SPECIES_EMOJI[item.species] || '🎣'}</Text>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{item.profiles?.username || 'Angler'}{isYou ? ' 👈' : ''}</Text>
                    <Text style={styles.rowDetail}>{item.species} • {item.location || 'Unknown'}</Text>
                  </View>
                  <View>
                    <Text style={styles.rowWeight}>{item.weight_kg}</Text>
                    <Text style={styles.rowUnit}>kg</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b14' },
  header: { padding: 20, paddingBottom: 0 },
  title: { fontSize: 32, fontWeight: '900', color: '#fafaf8', letterSpacing: 2 },
  subtitle: { fontSize: 13, color: '#8a9490', marginTop: 4 },
  tabsRow: { marginVertical: 16, flexGrow: 0 },
  tab: { backgroundColor: '#1a2e22', borderWidth: 1, borderColor: '#2a3d33', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  tabActive: { backgroundColor: '#e8a830', borderColor: '#e8a830' },
  tabText: { fontSize: 12, fontWeight: '500', color: '#8a9490' },
  tabTextActive: { color: '#0d1b14', fontWeight: '700' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 56 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#fafaf8', marginTop: 16, textAlign: 'center' },
  emptySubtext: { fontSize: 13, color: '#8a9490', marginTop: 8 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 12, padding: 20, backgroundColor: '#0f2018' },
  podiumItem: { alignItems: 'center', gap: 6 },
  podiumEmoji: { fontSize: 30 },
  crown: { fontSize: 20 },
  podiumBlock: { borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  podiumFirst: { width: 80, height: 70, backgroundColor: '#e8a830' },
  podiumSecond: { width: 66, height: 50, backgroundColor: '#3d4d44' },
  podiumThird: { width: 60, height: 36, backgroundColor: '#8b4a1f' },
  podiumNum: { fontSize: 22, fontWeight: '900', color: '#0d1b14' },
  podiumName: { fontSize: 11, color: '#b8ddc8', fontWeight: '600', textAlign: 'center', maxWidth: 80 },
  podiumSize: { fontSize: 11, color: '#7fb89a' },
  list: { padding: 20, gap: 8 },
  row: { backgroundColor: '#131f18', borderWidth: 1, borderColor: '#1e3028', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowYou: { borderColor: '#4a8b63', backgroundColor: '#0f2018' },
  rank: { fontSize: 20, fontWeight: '900', color: '#8a9490', width: 28, textAlign: 'center' },
  rankYou: { color: '#4a8b63' },
  rowEmoji: { fontSize: 24 },
  rowInfo: { flex: 1 },
  rowName: { color: '#fafaf8', fontWeight: '600', fontSize: 14 },
  rowDetail: { color: '#8a9490', fontSize: 11, marginTop: 1 },
  rowWeight: { fontSize: 22, fontWeight: '900', color: '#e8a830', textAlign: 'right' },
  rowUnit: { fontSize: 10, color: '#8a9490', textAlign: 'right' },
});