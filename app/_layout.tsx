import { Stack, router } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/auth');
      }
    });
  }, []);

  return (
    <>
      <Head>
        <title>CastLog</title>
      </Head>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}