import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

const SPECIES = [
  { emoji: '🐟', name: 'Yellowfish' },
  { emoji: '🦈', name: 'Snoek' },
  { emoji: '🎣', name: 'Bass' },
  { emoji: '🐠', name: 'Trout' },
  { emoji: '🐡', name: 'Tigerfish' },
  { emoji: '🐟', name: 'Carp' },
  { emoji: '🌊', name: 'Kob' },
  { emoji: '⚓', name: 'Other' },
];

const CLOUD_NAME = 'dxup3pxpc';
const UPLOAD_PRESET = 'castlog_uploads';

export default function LogCatch() {
  const [selectedSpecies, setSelectedSpecies] = useState(0);
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [location, setLocation] = useState('');
  const [bait, setBait] = useState('');
  const [notes, setNotes] = useState('');
  const [logged, setLogged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'getting' | 'got' | 'denied'>('idle');

  useEffect(() => {
    getLocation();
  }, []);

  async function getLocation() {
    setGpsStatus('getting');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setGpsStatus('denied');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    setGpsStatus('got');
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  }

  async function uploadPhoto(uri: string): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', { uri, type: 'image/jpeg', name: 'catch.jpg' } as any);
      formData.append('upload_preset', UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      return data.secure_url;
    } catch (e) {
      return null;
    }
  }

  async function handleSubmit() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('Not logged in!'); setSaving(false); return; }

    let photo_url = null;
    if (photo) {
      photo_url = await uploadPhoto(photo);
    }

    const { error } = await supabase.from('catches').insert({
      user_id: user.id,
      species: SPECIES[selectedSpecies].name,
      weight_kg: parseFloat(weight) || null,
      length_cm: parseFloat(length) || null,
      location,
      bait,
      notes,
      photo_url,
      latitude: coords?.latitude || null,
      longitude: coords?.longitude || null,
    });

    setSaving(false);
    if (error) { alert('Error: ' + error.message); }
    else { setLogged(true); }
  }

  if (logged) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>🎣</Text>
        <Text style={styles.successTitle}>Catch Logged!</Text>
        <Text style={styles.successSub}>Your {SPECIES[selectedSpecies].name} has been saved!</Text>
        {coords && <Text style={styles.successGps}>📍 GPS saved: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}</Text>}
        <TouchableOpacity style={styles.successBtn} onPress={() => router.back()}>
          <Text style={styles.successBtnText}>BACK TO FEED</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelBtn}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎣 Log a Catch</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>

        {/* GPS Status */}
        <View style={styles.gpsBar}>
          {gpsStatus === 'getting' && <Text style={styles.gpsText}>📡 Getting your location...</Text>}
          {gpsStatus === 'got' && <Text style={styles.gpsTextGot}>✅ GPS locked — catch will be pinned on map!</Text>}
          {gpsStatus === 'denied' && <Text style={styles.gpsTextDenied}>⚠️ Location denied — catch won't appear on map</Text>}
        </View>

        <Text style={styles.label}>Select Species</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.speciesRow}>
          {SPECIES.map((s, i) => (
            <TouchableOpacity key={s.name} onPress={() => setSelectedSpecies(i)} style={[styles.speciesOption, selectedSpecies === i && styles.speciesSelected]}>
              <Text style={styles.speciesEmoji}>{s.emoji}</Text>
              <Text style={styles.speciesName}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.row2}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput style={styles.input} placeholder="e.g. 3.5" placeholderTextColor="#8a9490" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Length (cm)</Text>
            <TextInput style={styles.input} placeholder="e.g. 65" placeholderTextColor="#8a9490" keyboardType="decimal-pad" value={length} onChangeText={setLength} />
          </View>
        </View>

        <Text style={styles.label}>Location Name</Text>
        <TextInput style={styles.input} placeholder="Spot or dam name..." placeholderTextColor="#8a9490" value={location} onChangeText={setLocation} />

        <Text style={styles.label}>Bait / Lure Used</Text>
        <TextInput style={styles.input} placeholder="e.g. Size 4 fly, maize, spinner..." placeholderTextColor="#8a9490" value={bait} onChangeText={setBait} />

        <Text style={styles.label}>Photo</Text>
        <TouchableOpacity style={styles.uploadArea} onPress={pickPhoto}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.previewImage} />
          ) : (
            <>
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadText}>Tap to add photo</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput style={[styles.input, styles.textarea]} placeholder="Weather, technique, tide..." placeholderTextColor="#8a9490" multiline numberOfLines={3} value={notes} onChangeText={setNotes} />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
          <Text style={styles.submitText}>{saving ? 'SAVING...' : 'LOG THIS CATCH 🎣'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a2e22' },
  cancelBtn: { color: '#4a8b63', fontSize: 16, width: 60 },
  title: { fontSize: 20, fontWeight: '900', color: '#e8a830', letterSpacing: 1 },
  form: { padding: 20, gap: 6 },
  gpsBar: { backgroundColor: '#0f1d15', borderWidth: 1, borderColor: '#2a3d33', borderRadius: 10, padding: 10, marginBottom: 8 },
  gpsText: { color: '#8a9490', fontSize: 12 },
  gpsTextGot: { color: '#4a8b63', fontSize: 12, fontWeight: '600' },
  gpsTextDenied: { color: '#e8a830', fontSize: 12 },
  label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#8a9490', marginBottom: 6, marginTop: 10 },
  speciesRow: { gap: 8, paddingBottom: 8 },
  speciesOption: { backgroundColor: '#0f1d15', borderWidth: 1.5, borderColor: '#2a3d33', borderRadius: 10, padding: 10, alignItems: 'center', minWidth: 70 },
  speciesSelected: { borderColor: '#e8a830', backgroundColor: 'rgba(232,168,48,0.1)' },
  speciesEmoji: { fontSize: 28 },
  speciesName: { fontSize: 10, color: '#8a9490', marginTop: 4 },
  row2: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  input: { backgroundColor: '#0f1d15', borderWidth: 1, borderColor: '#2a3d33', borderRadius: 12, padding: 12, color: '#fafaf8', fontSize: 14 },
  textarea: { height: 80, textAlignVertical: 'top' },
  uploadArea: { backgroundColor: '#0f1d15', borderWidth: 2, borderColor: '#2a3d33', borderStyle: 'dashed', borderRadius: 12, height: 160, alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%', borderRadius: 12 },
  uploadIcon: { fontSize: 28 },
  uploadText: { color: '#8a9490', fontSize: 12 },
  submitBtn: { backgroundColor: '#e8a830', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  submitText: { color: '#0d1b14', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  successContainer: { flex: 1, backgroundColor: '#0d1b14', alignItems: 'center', justifyContent: 'center', padding: 40 },
  successEmoji: { fontSize: 80 },
  successTitle: { fontSize: 36, fontWeight: '900', color: '#e8a830', marginTop: 20, letterSpacing: 2 },
  successSub: { fontSize: 14, color: '#7fb89a', marginTop: 10, textAlign: 'center', lineHeight: 22 },
  successGps: { fontSize: 12, color: '#4a8b63', marginTop: 8 },
  successBtn: { backgroundColor: '#e8a830', borderRadius: 14, padding: 16, paddingHorizontal: 32, marginTop: 40 },
  successBtnText: { color: '#0d1b14', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
});
