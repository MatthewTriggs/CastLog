import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

const SPECIES_EMOJI: Record<string, string> = {
  Yellowfish: '🐟', Snoek: '🦈', Bass: '🎣', Trout: '🐠',
  Tigerfish: '🐡', Carp: '🐟', Kob: '🌊', Other: '⚓',
};

const SPOTS = [
  { emoji: '💧', name: 'Vaal Dam', province: 'Gauteng', species: 'Yellowfish, Carp, Bass', rating: 4.8, lat: -26.9231, lng: 28.1234 },
  { emoji: '🌊', name: 'Mossel Bay', province: 'Western Cape', species: 'Snoek, Kob, Yellowtail', rating: 4.9, lat: -34.1815, lng: 22.1442 },
  { emoji: '🏔️', name: 'Dullstroom', province: 'Mpumalanga', species: 'Rainbow Trout, Brown Trout', rating: 4.7, lat: -25.4167, lng: 30.1167 },
  { emoji: '⚓', name: 'Hartbeespoort', province: 'North West', species: 'Bass, Carp, Catfish', rating: 4.5, lat: -25.7469, lng: 27.8753 },
];

const TABS = ['Map', 'Spots'];

// Lazy load map only on native
const MapView = Platform.OS !== 'web' ? require('react-native-maps').default : null;
const Marker = Platform.OS !== 'web' ? require('react-native-maps').Marker : null;
const Callout = Platform.OS !== 'web' ? require('react-native-maps').Callout : null;

export default function Explore() {
  const [activeTab, setActiveTab] = useState('Map');
  const [catches, setCatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCatches(); }, []);

  async function loadCatches() {
    const { data, error } = await supabase
      .from('catches')
      .select('*, profiles(username)')
      .not('location', 'is', null)
      .order('created_at', { ascending: false });
    if (!error && data) setCatches(data);
    setLoading(false);
  }

  function renderMap() {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webMap}>
          <Text style={styles.webMapEmoji}>🗺️</Text>
          <Text style={styles.webMapText}>Map view available on the mobile app!</Text>
          <Text style={styles.webMapSub}>Download Expo Go and scan the QR code to see catches on the map.</Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator color="#e8a830" size="large" />
        </View>
      );
    }

    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: -28.4793,
            longitude: 24.6727,
            latitudeDelta: 12,
            longitudeDelta: 12,
          }}
          mapType="hybrid">
          {SPOTS.map((spot, i) => (
            <Marker
              key={`spot-${i}`}
              coordinate={{ latitude: spot.lat, longitude: spot.lng }}
              pinColor="#e8a830">
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{spot.emoji} {spot.name}</Text>
                  <Text style={styles.calloutSub}>{spot.species}</Text>
                  <Text style={styles.calloutRating}>⭐ {spot.rating}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
          {catches.map((c, i) => (
            <Marker
              key={`catch-${i}`}
              coordinate={{
                latitude: -28.4793 + (Math.random() - 0.5) * 8,
                longitude: 24.6727 + (Math.random() - 0.5) * 8,
              }}
              title={`${SPECIES_EMOJI[c.species] || '🎣'} ${c.species}`}
              description={`${c.weight_kg ? c.weight_kg + 'kg' : ''} • ${c.location || ''} • @${c.profiles?.username || 'Angler'}`}
            />
          ))}
        </MapView>
        <View style={styles.mapLegend}>
          <Text style={styles.legendText}>🟡 Top Spots   📍 Catches</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Discover catches & top spots</Text>
      </View>

      <View style={styles.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'Map' ? '🗺️ Map' : '📍 Spots'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Map' ? renderMap() : (
        <ScrollView>
          <View style={styles.spotsList}>
            {SPOTS.map((spot, i) => (
              <TouchableOpacity key={i} style={styles.spotCard}>
                <Text style={styles.spotEmoji}>{spot.emoji}</Text>
                <View style={styles.spotInfo}>
                  <Text style={styles.spotName}>{spot.name}</Text>
                  <Text style={styles.spotProvince}>{spot.province}</Text>
                  <Text style={styles.spotSpecies}>{spot.species}</Text>
                </View>
                <View style={styles.spotRating}>
                  <Text style={styles.spotRatingText}>⭐ {spot.rating}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b14' },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 32, fontWeight: '900', color: '#fafaf8', letterSpacing: 2 },
  subtitle: { fontSize: 13, color: '#8a9490', marginTop: 4 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  tab: { flex: 1, backgroundColor: '#1a2e22', borderWidth: 1, borderColor: '#2a3d33', borderRadius: 12, padding: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#e8a830', borderColor: '#e8a830' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#8a9490' },
  tabTextActive: { color: '#0d1b14' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  webMap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  webMapEmoji: { fontSize: 64 },
  webMapText: { fontSize: 18, fontWeight: '700', color: '#fafaf8', marginTop: 16, textAlign: 'center' },
  webMapSub: { fontSize: 13, color: '#8a9490', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  mapContainer: { flex: 1, position: 'relative' },
  map: { width: Dimensions.get('window').width, flex: 1 },
  mapLegend: { position: 'absolute', bottom: 16, left: 16, backgroundColor: 'rgba(13,27,20,0.9)', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#2d5a40' },
  legendText: { color: '#b8ddc8', fontSize: 11, fontWeight: '600' },
  callout: { padding: 8, minWidth: 160 },
  calloutTitle: { fontSize: 14, fontWeight: '700', color: '#0d1b14', marginBottom: 2 },
  calloutSub: { fontSize: 11, color: '#444', marginBottom: 2 },
  calloutRating: { fontSize: 12, fontWeight: '700' },
  spotsList: { padding: 20, gap: 10 },
  spotCard: { backgroundColor: '#131f18', borderWidth: 1, borderColor: '#1e3028', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  spotEmoji: { fontSize: 32 },
  spotInfo: { flex: 1 },
  spotName: { fontSize: 15, fontWeight: '700', color: '#fafaf8' },
  spotProvince: { fontSize: 11, color: '#4a8b63', marginTop: 2 },
  spotSpecies: { fontSize: 11, color: '#8a9490', marginTop: 4 },
  spotRating: { backgroundColor: '#1a2e22', borderRadius: 8, padding: 6 },
  spotRatingText: { fontSize: 12, fontWeight: '700', color: '#e8a830' },
});
