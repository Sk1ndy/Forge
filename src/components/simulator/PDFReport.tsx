import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { SimulationResult, WeeklyBlueprint } from '@/lib/calculations';

// Définition des styles stricts pour react-pdf
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#09090b',
  },
  subtitle: {
    fontSize: 10,
    color: '#71717a',
    marginTop: 5,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#27272a',
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
    color: '#52525b',
  },
  bold: {
    fontWeight: 'bold',
    color: '#18181b',
  },
  gradeContainer: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderLeft: '4px solid #10b981', // green by default
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#09090b', // dark background since avatar is dark
    borderRadius: 8,
  },
  avatarImage: {
    width: 250,
    height: 350,
    objectFit: 'contain',
  },
  alertContainer: {
    padding: 10,
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
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#a1a1aa',
    fontSize: 8,
    borderTop: '1px solid #f4f4f5',
    paddingTop: 10,
  }
});

interface PDFReportProps {
  simulation: SimulationResult;
  blueprint: WeeklyBlueprint;
  avatarImageStr?: string; // Image base64 passée en prop
  score: number;
  grade: string;
  critique: string;
}

const PDFReport = ({ simulation, avatarImageStr, score, grade, critique }: PDFReportProps) => {
  const dateStr = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  // Calcul du volume hebdomadaire
  const totalSets = Object.values(simulation.weeklyMacro?.weeklyEffectiveSets ?? {}).reduce((sum, v) => sum + (v as number), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Rapport d&apos;Entraînement Hebdomadaire</Text>
          <Text style={styles.subtitle}>Forge Biomécanique • {dateStr}</Text>
        </View>

        {/* Score & Critique */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Évaluation Globale</Text>
          <View style={[styles.gradeContainer, { borderLeftColor: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444' }]}>
            <Text style={[styles.bold, { fontSize: 16, marginBottom: 4 }]}>Score : {score}/100 (Grade {grade})</Text>
            <Text style={[styles.text, { fontStyle: 'italic' }]}>{critique}</Text>
          </View>
        </View>

        {/* Heatmap Statique (Image Capturée) */}
        {avatarImageStr && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Carte Anatomique (Heatmap)</Text>
            <View style={styles.avatarContainer}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image source={avatarImageStr} style={styles.avatarImage} />
            </View>
          </View>
        )}

        {/* Volume & SNC */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métriques Centrales & Volume</Text>
          <View style={styles.row}>
            <Text style={styles.text}>Volume Hebdomadaire (Séries effectives)</Text>
            <Text style={styles.bold}>{totalSets} séries</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.text}>Saturation du Système Nerveux Central (SNC)</Text>
            <Text style={[styles.bold, { color: simulation.sncPercentage > 80 ? '#ef4444' : '#18181b' }]}>
              {simulation.sncPercentage.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.text}>Charge Axiale (Tier 1)</Text>
            <Text style={styles.bold}>{simulation.weeklyMacro?.axialSncLoad.toFixed(1)}%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.text}>Ratio Push / Pull</Text>
            <Text style={styles.bold}>
              {simulation.weeklyMacro?.pushPullRatio?.push.toFixed(0)}% / {simulation.weeklyMacro?.pushPullRatio?.pull.toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Alertes & Prescriptions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alertes & Traumatismes Détectés</Text>
          {simulation.weeklyTraumas && simulation.weeklyTraumas.length > 0 ? (
            simulation.weeklyTraumas.map((t, i) => (
              <View key={i} style={styles.alertContainer}>
                <Text style={styles.alertText}>⚠️ {t.muscleName} : Pic traumatique (INOL {t.peakInol.toFixed(2)})</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.text, { color: '#10b981', fontWeight: 'bold' }]}>✅ Aucun traumatisme musculaire critique détecté cette semaine.</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Généré par Forge (Simulateur Biomécanique) • sk1ndy.com/forge</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PDFReport;
