import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { SimulationResult, WeeklyBlueprint, DEFAULT_EXERCISE_LIBRARY } from '@/lib/calculations';

// Définition des styles stricts pour react-pdf
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    color: '#333333',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
    marginTop: 5,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000000',
    textTransform: 'uppercase',
    borderBottom: '1px solid #f4f4f5',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  text: {
    fontSize: 10,
    color: '#333333',
  },
  bold: {
    fontWeight: 'bold',
    color: '#000000',
  },
  gradeContainer: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderLeft: '4px solid #10b981',
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#09090b',
    borderRadius: 8,
  },
  avatarImage: {
    width: 200,
    height: 280,
    objectFit: 'contain',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fef2f2',
    borderLeft: '3px solid #ef4444',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 10,
    color: '#991b1b',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#999999',
    fontSize: 8,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
  spacer: {
    marginTop: 20,
  },
  // Table Styles
  dayHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
    backgroundColor: '#f4f4f5',
    padding: 5,
    textTransform: 'uppercase',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 24,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    fontWeight: 'bold',
  },
  col1: { width: '40%', padding: 5, fontSize: 10, borderRightWidth: 1, borderColor: '#e5e7eb' },
  col2: { width: '15%', padding: 5, fontSize: 10, borderRightWidth: 1, borderColor: '#e5e7eb', textAlign: 'center' },
  col3: { width: '15%', padding: 5, fontSize: 10, borderRightWidth: 1, borderColor: '#e5e7eb', textAlign: 'center' },
  col4: { width: '15%', padding: 5, fontSize: 10, borderRightWidth: 1, borderColor: '#e5e7eb', textAlign: 'center' },
  col5: { width: '15%', padding: 5, fontSize: 10, textAlign: 'center' },
  restText: {
    fontSize: 10,
    color: '#666666',
    fontStyle: 'italic',
    padding: 10,
  }
});

interface PDFReportProps {
  simulation: SimulationResult;
  blueprint: WeeklyBlueprint;
  avatarImageStr?: string;
  score: number;
  grade: string;
  critique: string;
  toggledDays?: { [day: string]: boolean };
}

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const PDFReport = ({ simulation, blueprint, avatarImageStr, score, grade, critique, toggledDays }: PDFReportProps) => {
  const dateStr = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  // Calcul du volume hebdomadaire global
  let totalSetsWeek = 0;
  const volumeByMuscle: Record<string, number> = {};
  
  if (simulation.weeklyMacro?.weeklyEffectiveSets) {
    Object.entries(simulation.weeklyMacro.weeklyEffectiveSets).forEach(([muscle, sets]) => {
      volumeByMuscle[muscle] = sets;
      totalSetsWeek += sets;
    });
  }

  // Traductions des muscles
  const MUSCLE_NAMES: Record<string, string> = {
    chest: 'Pectoraux', upperBack: 'Dos', frontDeltoid: 'Épaules',
    biceps: 'Biceps', triceps: 'Triceps', quadriceps: 'Quadriceps', hamstring: 'Ischios/Fessiers'
  };

  return (
    <Document>
      {/* PAGE 1 : BILAN MACRO */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Bilan Hebdomadaire Forge</Text>
          <Text style={styles.subtitle}>{dateStr} • Simulation Macro-Cycle</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Global</Text>
          <View style={[styles.gradeContainer, { borderLeftColor: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444' }]}>
            <Text style={[styles.bold, { fontSize: 16, marginBottom: 4 }]}>Score : {score}/100 (Grade {grade})</Text>
            <Text style={[styles.text, { fontStyle: 'italic' }]}>{critique}</Text>
          </View>
        </View>

        {avatarImageStr && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Carte Anatomique</Text>
            <View style={styles.avatarContainer}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image source={avatarImageStr} style={styles.avatarImage} />
            </View>
          </View>
        )}

        <View style={styles.spacer} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Volume & Stress (Dashboard)</Text>
          <View style={styles.row}>
            <Text style={styles.text}>Volume Total</Text>
            <Text style={styles.bold}>{totalSetsWeek} séries effectives</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.text}>Saturation du SNC</Text>
            <Text style={[styles.bold, { color: simulation.sncPercentage > 80 ? '#ef4444' : '#000000' }]}>
              {simulation.sncPercentage.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.text}>Balance Posturale (Push/Pull)</Text>
            <Text style={styles.bold}>
              {simulation.weeklyMacro?.pushPullRatio?.push.toFixed(0)}% / {simulation.weeklyMacro?.pushPullRatio?.pull.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.spacer} />
          
          <Text style={[styles.text, styles.bold, { marginBottom: 6 }]}>Répartition par Groupe Musculaire :</Text>
          {Object.entries(volumeByMuscle).map(([id, sets]) => (
             <View key={id} style={styles.row}>
               <Text style={styles.text}>• {MUSCLE_NAMES[id] || id}</Text>
               <Text style={styles.text}>{sets} séries</Text>
             </View>
          ))}
        </View>

        <View style={styles.spacer} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alertes & Traumatismes</Text>
          {simulation.weeklyTraumas && simulation.weeklyTraumas.length > 0 ? (
            simulation.weeklyTraumas.map((t, i) => (
              <View key={i} style={styles.alertContainer}>
                <Text style={styles.alertText}>🔴 {t.muscleName} : Pic traumatique détecté (INOL {t.peakInol.toFixed(2)})</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.text, { color: '#10b981', fontWeight: 'bold' }]}>✅ Aucun traumatisme musculaire critique.</Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text>Généré par Forge • sk1ndy.com/forge</Text>
        </View>
      </Page>

      {/* PAGE 2+ : LOG QUOTIDIEN */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Carnet d&apos;Entraînement Quotidien</Text>
          <Text style={styles.subtitle}>Séquence de la semaine</Text>
        </View>

        {DAYS_OF_WEEK.map((day) => {
          const isToggledOn = !toggledDays || toggledDays[day] !== false;
          const dayExercises = blueprint[day] || [];
          const activeExercises = dayExercises.filter(ex => ex.active);
          const isEmpty = !isToggledOn || activeExercises.length === 0;

          return (
            <View key={day} style={styles.section} wrap={false}>
              <Text style={styles.dayHeader}>{day}</Text>
              
              {isEmpty ? (
                <Text style={styles.restText}>Repos (Journée inactive ou vide)</Text>
              ) : (
                <View style={styles.table}>
                  {/* Table Header */}
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={styles.col1}>Exercice</Text>
                    <Text style={styles.col2}>Séries</Text>
                    <Text style={styles.col3}>Reps</Text>
                    <Text style={styles.col4}>Poids</Text>
                    <Text style={styles.col5}>RPE</Text>
                  </View>
                  
                  {/* Table Body */}
                  {activeExercises.map(ex => {
                    const templateName = DEFAULT_EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId)?.nom || ex.exerciseId;
                    // Sum up sets for identical configurations, or list them out? 
                    // Usually we just sum the series if they share the same reps/poids/rpe, 
                    // but since the sequencer can have individual sets, we'll iterate sets or just summarize.
                    // To be simple, we can render one row per exercise showing the summary, or one row per active set.
                    // The prompt asked for: "Exercice" | "Séries" | "Reps" | "Poids" | "RPE"
                    // We'll summarize by grouping identical active sets or just listing each set.
                    // It's cleaner to list each set configuration if they differ, or summarize if identical.
                    
                    // Simple grouping algorithm:
                    const groupedSets: { reps: number; poids: number; rpe: number; seriesCount: number }[] = [];
                    ex.sets.filter(s => s.active).forEach(s => {
                      const existing = groupedSets.find(g => g.reps === s.reps && g.poids === s.poids && g.rpe === s.rpe);
                      if (existing) {
                        existing.seriesCount += s.series;
                      } else {
                        groupedSets.push({ reps: s.reps, poids: s.poids, rpe: s.rpe, seriesCount: s.series });
                      }
                    });

                    return groupedSets.map((grp, i) => (
                      <View key={`${ex.id}-${i}`} style={styles.tableRow}>
                        <Text style={styles.col1}>{i === 0 ? templateName : '"'}</Text>
                        <Text style={styles.col2}>{grp.seriesCount}</Text>
                        <Text style={styles.col3}>{grp.reps}</Text>
                        <Text style={styles.col4}>{grp.poids > 0 ? `${grp.poids} kg` : '-'}</Text>
                        <Text style={styles.col5}>@ {grp.rpe}</Text>
                      </View>
                    ));
                  })}
                </View>
              )}
              <View style={styles.spacer} />
            </View>
          );
        })}

        <View style={styles.footer}>
          <Text>Généré par Forge • sk1ndy.com/forge</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PDFReport;
