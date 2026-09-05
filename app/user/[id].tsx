import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

const SPECIES_EMOJI: Record<string, string> = {
  Yellowfish: '🐟', Snoek: '🦈', Bass: '🎣', Trout: '🐠',
  Tigerfish: '🐡', Carp: '🐟', Kob: '🌊', Other: '⚓',
};

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [catches, setCatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [followCount, setFollowCount] = useState(0);

  useEffect(() => { loadProfile(); }, [id]);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', id)
        .single();
      setFollowing(!!followData);
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (profileData) setProfile(profileData);

    const { data: catchData } = await supabase
      .from('catches')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });
    if (catchData) setCatches(catchData);

    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', id);
    setFollowCount(count || 0);

    setLoading(false);
  }

  async function toggleFollow() {
    if (following) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', id);
      setFollowing(false);
      setFollowCount(prev => prev - 1);
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: id });
      setFollowing(true);
      setFollowCount(prev => prev + 1);
    }
  }

  const totalWeight = catches.reduce((sum, c) => sum + (c.weight_kg || 0), 0);
  const species = [...new Set(catches.map(c => c.species))];
  const biggestCatch = catches.reduce((max, c) => (c.weight_kg || 0) > (max.weight_kg || 0) ? c : max, {} as any);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#e8a830" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{profile?.username || 'Angler'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView>
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🎣</Text>
            </View>
          </View>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{profile?.username || 'Angler'}</Text>
            </View>
            {currentUserId !== id && (
              <TouchableOpacity
                onPress={toggleFollow}
                style={[styles.followBtn, following && styles.followingBtn]}>
                <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
                  {following ? 'Following' : '+ Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{catches.length}</Text>
              <Text style={styles.statLabel}>Catches</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{species.length}</Text>
              <Text style={styles.statLabel}>Species</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{totalWeight.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Total kg</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{followCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>
        </View>

        {/* Catch Grid */}
        {catches.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎣</Text>
            <Text style={styles.emptyText}>No catches yet!</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {catches.map((c, i) => (
              c.photo_url ? (
                <Image key={i} source={{ uri: c.photo_url }} style={styles.gridPhoto} />
              ) : (
                <View key={i} style={[styles.gridItem, { backgroundColor: '#0a2a1a' }]}>
                  <Text style={styles.gridEmoji}>{SPECIES_EMOJI[c.species] || '🎣'}</Text>
                  <Text style={styles.gridWeight}>{c.weight_kg ? `${c.weight_kg} kg` : c.species}</Text>
                </View>
              )
            ))}
          </View>
        )}

        {/* Personal Bests */}
        {catches.length > 0 && (
          <View style={styles.pbSection}>
            <Text style={styles.pbTitle}>🏆 Personal Bests</Text>
            {species.map((sp, i) => {
              const best = catches.filter(c => c.species === sp).reduce((max, c) => (c.weight_kg || 0) > (max.weight_kg || 0) ? c : max, {} as any);
              return best.weight_kg ? (
                <View key={i} style={styles.pbRow}>
                  <Text style={styles.pbFish}>{SPECIES_EMOJI[sp] || '🎣'} {sp}</Text>
                  <Text style={styles.pbVal}>{best.weight_kg.toFixed(2)} kg</Text>
                </View>
              ) : null;
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b14' },
  loader: { flex: 1, backgroundColor: '#0d1b14', alignItems: 'center', justifyContent: 'center' },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a2e22' },
  backBtn: { color: '#4a8b63', fontSize: 16, width: 60 },
  navTitle: { fontSize: 16, fontWeight: '700', color: '#fafaf8' },
  hero: { height: 120, backgroundColor: '#0a2a1a', position: 'relative' },
  avatarWrap: { position: 'absolute', bottom: -36, left: 20 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#1a3528', borderWidth: 4, borderColor: '#0d1b14', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 36 },
  info: { paddingTop: 48, paddingHorizontal: 20, paddingBottom: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 18, fontWeight: '700', color: '#fafaf8' },
  followBtn: { backgroundColor: '#1a2e22', borderWidth: 1, borderColor: '#2d5a40', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  followingBtn: { backgroundColor: 'transparent', borderColor: '#4a8b63' },
  followBtnText: { color: '#e8a830', fontSize: 13, fontWeight: '700' },
  followingBtnText: { color: '#4a8b63' },
  statsRow: { flexDirection: 'row', marginTop: 16, backgroundColor: '#131f18', borderRadius: 14, borderWidth: 1, borderColor: '#1e3028', overflow: 'hidden' },
  stat: { flex: 1, padding: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#1e3028' },
  statVal: { fontSize: 22, fontWeight: '900', color: '#e8a830' },
  statLabel: { fontSize: 10, color: '#8a9490', textTransform: 'uppercase', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '33.33%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#0d1b14' },
  gridPhoto: { width: '33.33%', aspectRatio: 1, borderWidth: 1, borderColor: '#0d1b14' },
  gridEmoji: { fontSize: 32 },
  gridWeight: { fontSize: 10, color: '#7fb89a', marginTop: 4 },
  emptyState: { padding: 60, alignItems: 'center' },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: '#8a9490', marginTop: 12, fontSize: 14 },
  pbSection: { margin: 16, backgroundColor: '#131f18', borderWidth: 1, borderColor: '#1e3028', borderRadius: 14, padding: 16 },
  pbTitle: { fontSize: 14, fontWeight: '700', color: '#fafaf8', marginBottom: 12 },
  pbRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e3028' },
  pbFish: { color: '#8a9490', fontSize: 13 },
  pbVal: { color: '#e8a830', fontSize: 13, fontWeight: '700' },
});