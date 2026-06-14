import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

type ConnectionStatus = 'checking' | 'connected' | 'failed';

export default function LoginScreen() {
  const [status, setStatus] = useState<ConnectionStatus>('checking');

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(() => setStatus('connected'))
      .catch(() => setStatus('failed'));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parking Roommates</Text>
      <Text style={styles.subtitle}>Sign in to manage your shared parking spot</Text>

      <View style={styles.statusRow}>
        {status === 'checking' && (
          <>
            <ActivityIndicator size="small" color="#888" />
            <Text style={styles.statusChecking}>  Connecting to Supabase…</Text>
          </>
        )}
        {status === 'connected' && (
          <Text style={styles.statusOk}>Connected to Supabase</Text>
        )}
        {status === 'failed' && (
          <Text style={styles.statusFail}>Connection failed</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChecking: {
    fontSize: 14,
    color: '#888',
  },
  statusOk: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  statusFail: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
});
