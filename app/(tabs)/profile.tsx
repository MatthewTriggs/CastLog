import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

const SPECIES_EMOJI: Record<string, string> = {
  Yellowfish: '🐟', Snoek: '🦈', Bass: '🎣', Trout: '🐠',
  Tigerfish: '🐡', Carp: '🐟', Kob: '🌊', Other: '⚓',
};

const TABS = ['Catches', 'Stats'];

export default function Profile() {
  const [activeTab, setActiveTab] = useState('Catches');
  const [catches, setCatches] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingUsername, setSavingUsername] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setEmail(user.email || '');
    setUserId(user.id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (profile?.username) setUsername(profile.username);
    else setUsername(user.email?.split('@')[0] || 'Angler');

    const { data } = await supabase
      .from('catches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setCatches(data);
    setLoading(false);
  }

  async function saveUsername() {
    if (!newUsername.trim()) return;
    setSavingUsername(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername.trim() })
      .eq('id', userId);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setUsername(newUsername.trim());
      setEditingUsername(false);
    }
    setSavingUsername(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/auth');
  }

  const totalWeight = catches.reduce((sum, c) => sum + (c.weight_kg || 0), 0);
  const avgWeight = catches.length ? totalWeight / catches.length : 0;
  const biggestCatch = catches.reduce((max, c) => (c.weight_kg || 0) > (max.weight_kg || 0) ? c : max, {});
  const species = [...new Set(catches.map(c => c.species))];
  const favSpot = catches.length ? Object.entries(
    catches.reduce((acc: Record<string, number>, c) => {
      if (c.location) acc[c.location] = (acc[c.location] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1])[0]?.[0] : 'None yet';

  const pbs = species.map(sp => {
    const best = catches.filter(c => c.species === sp).reduce((max, c) => (c.weight_kg || 0) > (max.weight_kg || 0) ? c : max, {});
    return { species: sp, weight: best.weight_kg };
  }).filter(p => p.weight).sort((a, b) => b.weight - a.weight);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#e8a830" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🎣</Text>
            </View>
          </View>
        </View>

        <View style={styles.info}>
          {editingUsername ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.usernameInput}
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder="Enter username..."
                placeholderTextColor="#4a8b63"
                autoFocus
                maxLength={20}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={saveUsername} disabled={savingUsername}>
                <Text style={styles.saveBtnText}>{savingUsername ? '...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingUsername(false)}>
                <Text style={styles.cancelBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { setNewUsername(username); setEditingUsername(true); }} style={styles.nameRow}>
              <Text style={styles.name}>{username}</Text>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.handle}>{email}</Text>

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
              <Text style={styles.statVal}>{biggestCatch.weight_kg?.toFixed(1) || '–'}</Text>
              <Text style={styles.statLabel}>Best kg</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabsRow}>
          {TABS.map(t => (
            <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'Catches' && (
          catches.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎣</Text>
              <Text style={styles.emptyText}>No catches yet — get fishing!</Text>
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
          )
        )}

        {activeTab === 'Stats' && (
          <View style={styles.statsDetail}>
            <View style={styles.statsCard}>
              <Text style={styles.statsCardTitle}>🏆 Personal Bests</Text>
              {pbs.length === 0 ? (
                <Text style={styles.pbFish}>No catches yet!</Text>
              ) : pbs.map((p, i) => (
                <View key={i} style={styles.pbRow}>
                  <Text style={styles.pbFish}>{SPECIES_EMOJI[p.species] || '🎣'} {p.species}</Text>
                  <Text style={styles.pbVal}>{p.weight.toFixed(2)} kg</Text>
                </View>
              ))}
            </View>
            <View style={styles.statsCard}>
              <Text style={styles.statsCardTitle}>📊 Overall Stats</Text>
              <View style={styles.pbRow}><Text style={styles.pbFish}>Total Catches</Text><Text style={styles.pbVal}>{catches.length}</Text></View>
              <View style={styles.pbRow}><Text style={styles.pbFish}>Total Weight</Text><Text style={styles.pbVal}>{totalWeight.toFixed(1)} kg</Text></View>
              <View style={styles.pbRow}><Text style={styles.pbFish}>Avg Catch Weight</Text><Text style={styles.pbVal}>{avgWeight.toFixed(2)} kg</Text></View>
              <View style={styles.pbRow}><Text style={styles.pbFish}>Species Caught</Text><Text style={styles.pbVal}>{species.length}</Text></View>
              <View style={styles.pbRow}><Text style={styles.pbFish}>Favourite Spot</Text><Text style={styles.pbVal}>{favSpot}</Text></View>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b14' },
  loader: { flex: 1, backgroundColor: '#0d1b14', alignItems: 'center', justifyContent: 'center' },
  hero: { height: 140, backgroundColor: '#0a2a1a', position: 'relative' },
  avatarWrap: { position: 'absolute', bottom: -36, left: 20 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#1a3528', borderWidth: 4, borderColor: '#0d1b14', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 36 },
  info: { paddingTop: 48, paddingHorizontal: 20, paddingBottom: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 18, fontWeight: '700', color: '#fafaf8' },
  editIcon: { fontSize: 14 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  usernameInput: { flex: 1, backgroundColor: '#1a2e22', borderWidth: 1, borderColor: '#2d5a40', borderRadius: 10, padding: 8, color: '#fafaf8', fontSize: 16, fontWeight: '700' },
  saveBtn: { backgroundColor: '#e8a830', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  saveBtnText: { color: '#0d1b14', fontWeight: '700', fontSize: 13 },
  cancelBtn: { padding: 8 },
  cancelBtnText: { color: '#8a9490', fontSize: 16 },
  handle: { fontSize: 13, color: '#4a8b63', marginTop: 2 },
  statsRow: { flexDirection: 'row', marginTop: 16, backgroundColor: '#131f18', borderRadius: 14, borderWidth: 1, borderColor: '#1e3028', overflow: 'hidden' },
  stat: { flex: 1, padding: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#1e3028' },
  statVal: { fontSize: 22, fontWeight: '900', color: '#e8a830' },
  statLabel: { fontSize: 10, color: '#8a9490', textTransform: 'uppercase', marginTop: 2 },
  tabsRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1a2e22' },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#e8a830' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#8a9490', textTransform: 'uppercase', letterSpacing: 0.5 },
  tabTextActive: { color: '#e8a830' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '33.33%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#0d1b14' },
  gridPhoto: { width: '33.33%', aspectRatio: 1, borderWidth: 1, borderColor: '#0d1b14' },
  gridEmoji: { fontSize: 32 },
  gridWeight: { fontSize: 10, color: '#7fb89a', marginTop: 4 },
  statsDetail: { padding: 16, gap: 12 },
  statsCard: { backgroundColor: '#131f18', borderWidth: 1, borderColor: '#1e3028', borderRadius: 14, padding: 16 },
  statsCardTitle: { fontSize: 14, fontWeight: '700', color: '#fafaf8', marginBottom: 12 },
  pbRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e3028' },
  pbFish: { color: '#8a9490', fontSize: 13 },
  pbVal: { color: '#e8a830', fontSize: 13, fontWeight: '700' },
  emptyState: { padding: 60, alignItems: 'center' },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: '#8a9490', marginTop: 12, fontSize: 14 },
  signOutBtn: { margin: 20, backgroundColor: '#1a2e22', borderWidth: 1, borderColor: '#2d5a40', borderRadius: 14, padding: 16, alignItems: 'center' },
  signOutText: { color: '#e8a830', fontWeight: '700', fontSize: 14 },
});
