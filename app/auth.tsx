import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) Alert.alert('Error', error.message);
        else router.replace('/(tabs)');
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) { Alert.alert('Error', error.message); }
        else if (data.user) {
          await supabase.from('profiles').insert({ id: data.user.id, username, full_name: username });
          router.replace('/(tabs)');
        }
      }
    } catch (e) {
      Alert.alert('Connection Error', 'Could not reach the server. Please check your connection and try again.');
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>CAST<Text style={styles.logoAccent}>LOG</Text></Text>
      <Text style={styles.tagline}>Track. Share. Compete.</Text>

      <View style={styles.form}>
        <Text style={styles.formTitle}>{isLogin ? '👋 Welcome Back' : '🎣 Create Account'}</Text>

        {!isLogin && (
          <>
            <Text style={styles.label}>Username</Text>
            <TextInput style={styles.input} placeholder="e.g. RiverKing_ZA" placeholderTextColor="#8a9490" value={username} onChangeText={setUsername} autoCapitalize="none" />
          </>
        )}

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor="#8a9490" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#8a9490" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Loading...' : isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Text style={styles.switchLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b14', alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { fontSize: 52, fontWeight: '900', color: '#e8a830', letterSpacing: 4 },
  logoAccent: { color: '#7fb89a' },
  tagline: { fontSize: 14, color: '#4a8b63', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4, marginBottom: 40 },
  form: { width: '100%', backgroundColor: '#131f18', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1e3028' },
  formTitle: { fontSize: 20, fontWeight: '700', color: '#fafaf8', marginBottom: 20 },
  label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#8a9490', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0f1d15', borderWidth: 1, borderColor: '#2a3d33', borderRadius: 12, padding: 14, color: '#fafaf8', fontSize: 15 },
  btn: { backgroundColor: '#e8a830', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#0d1b14', fontWeight: '900', fontSize: 16, letterSpacing: 2 },
  switchBtn: { marginTop: 16, alignItems: 'center' },
  switchText: { color: '#8a9490', fontSize: 13 },
  switchLink: { color: '#4a8b63', fontWeight: '700' },
});