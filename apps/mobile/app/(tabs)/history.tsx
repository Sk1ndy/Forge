import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

export default function HistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    async function loadHistory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch last sessions
        const { data } = await supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(5);

        if (data) setSessions(data);
      }
      setLoading(false);
    }
    loadHistory();
  }, []);

  // Dummy chart data for "Bench Press" progression for demonstration
  const chartData = {
    labels: ["S1", "S2", "S3", "S4", "S5", "S6"],
    datasets: [
      {
        data: [60, 62.5, 62.5, 65, 65, 67.5],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Emerald
        strokeWidth: 2 // optional
      }
    ],
    legend: ["Progression Bench Press (KG)"] // optional
  };

  const chartConfig = {
    backgroundGradientFrom: "#09090b",
    backgroundGradientTo: "#09090b",
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    strokeWidth: 2, // optional, default 3
    barPercentage: 0.5,
    useShadowColorFromDataset: false, // optional
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#10b981"
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>MODULE SUIVI</Text>
        </View>
        <Text style={styles.title}>HISTORIQUE</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" />
        ) : (
          <>
            <View style={styles.chartContainer}>
              <Text style={styles.sectionTitle}>PROGRESSION (EXEMPLE)</Text>
              <LineChart
                data={chartData}
                width={screenWidth - 48}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16
                }}
              />
            </View>

            <View style={styles.listContainer}>
              <Text style={styles.sectionTitle}>DERNIÈRES SÉANCES</Text>
              {sessions.length === 0 ? (
                <Text style={styles.emptyText}>Aucune séance enregistrée pour le moment.</Text>
              ) : (
                sessions.map((session, index) => (
                  <View key={index} style={styles.sessionCard}>
                    <Text style={styles.sessionDate}>{new Date(session.date).toLocaleDateString('fr-FR')}</Text>
                    <Text style={styles.sessionName}>SÉANCE COMPLÉTÉE</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 4,
    marginBottom: 8,
  },
  badgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  sectionTitle: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
  listContainer: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDate: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sessionName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 14,
    fontStyle: 'italic',
  }
});
