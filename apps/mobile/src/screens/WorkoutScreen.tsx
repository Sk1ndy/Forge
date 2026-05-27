import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';
import { StepperPad } from '../components/ui/StepperPad';
import { RpeSlider } from '../components/ui/RpeSlider';
import { SwipeButton } from '../components/ui/SwipeButton';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function WorkoutScreen() {
  // Garde l'écran allumé pendant la séance
  useKeepAwake();

  const [weight, setWeight] = useState(80);
  const [reps, setReps] = useState(8);
  const [rpe, setRpe] = useState(8);
  const [restTimeLeft, setRestTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimeLeft !== null && restTimeLeft > 0) {
      interval = setInterval(() => {
        setRestTimeLeft(prev => prev ? prev - 1 : 0);
      }, 1000);
    } else if (restTimeLeft === 0) {
      setRestTimeLeft(null);
    }
    return () => clearInterval(interval);
  }, [restTimeLeft]);

  const handleCompleteSet = async () => {
    // 1. Sauvegarder dans WatermelonDB / local
    console.log(`Saved: ${weight}kg x ${reps} @ RPE ${rpe}`);

    // 2. Démarrer le chrono de repos (ex: 90s)
    setRestTimeLeft(90);

    // 3. Programmer une notification locale au cas où l'app est en background
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏱️ Temps de repos terminé !",
        body: "C'est l'heure de ta prochaine série.",
        sound: true,
      },
      trigger: { seconds: 90 },
    });
  };

  const formatRestTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Bench Press</Text>
          <Text style={styles.subtitle}>Série 1 / 4</Text>
        </View>

        {restTimeLeft !== null ? (
          <View style={styles.restTimer}>
            <Text style={styles.restLabel}>TEMPS DE REPOS</Text>
            <Text style={styles.restTime}>{formatRestTime(restTimeLeft)}</Text>
          </View>
        ) : null}

        <StepperPad 
          label="Poids (KG)" 
          value={weight} 
          step={2.5} 
          onChange={setWeight} 
          unit="kg" 
        />
        
        <StepperPad 
          label="Répétitions" 
          value={reps} 
          step={1} 
          onChange={setReps} 
        />
        
        <RpeSlider 
          value={rpe} 
          onChange={setRpe} 
        />

        <View style={styles.footer}>
          <SwipeButton onComplete={handleCompleteSet} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000', // True black for OLED
  },
  container: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    marginBottom: 32,
    marginTop: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    color: '#a1a1aa', // zinc-400
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  restTimer: {
    backgroundColor: '#10b98120', // Emerald avec opacité
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  restLabel: {
    color: '#10b981',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  restTime: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 32,
    alignItems: 'center',
  }
});
