import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TodayScreen() {
  const router = useRouter();

  // Pour le moment on mocke la présence d'une séance
  const hasSession = true;
  const sessionId = "session-123";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Aujourd'hui</Text>
        <Text style={styles.subtitle}>Lundi, 24 Mai</Text>
      </View>

      <View style={styles.content}>
        {hasSession ? (
          <View style={styles.sessionCard}>
            <Text style={styles.cardTitle}>Séance du jour</Text>
            <Text style={styles.cardDesc}>Upper Body Power • 5 Exercices</Text>
            
            <Pressable 
              style={({ pressed }) => [
                styles.startBtn,
                pressed && styles.startBtnPressed
              ]}
              onPress={() => router.push(`/session/${sessionId}`)}
            >
              <Text style={styles.startBtnText}>DÉMARRER LA SESSION</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Jour de repos.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 16,
    color: '#71717a',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  sessionCard: {
    backgroundColor: '#09090b',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 32,
  },
  startBtn: {
    backgroundColor: '#2563eb',
    width: '100%',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  startBtnPressed: {
    backgroundColor: '#1d4ed8',
    transform: [{ scale: 0.98 }],
  },
  startBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 18,
    fontWeight: '600',
  }
});
