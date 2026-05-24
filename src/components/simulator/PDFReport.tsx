'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { SimulationResult, WeeklyBlueprint, DEFAULT_EXERCISE_LIBRARY } from '@/lib/calculations';

// ─── Design Tokens (Premium Dark Theme) ──────────────────────────────────────
const C = {
  black:       '#000000',
  dark:        '#09090b',
  zinc800:     '#27272a',
  zinc700:     '#3f3f46',
  zinc500:     '#71717a',
  zinc300:     '#d4d4d8',
  zinc100:     '#f4f4f5',
  white:       '#ffffff',
  accent:      '#10b981', // Emerald for positive highlights
  accentDim:   '#064e3b',
};

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Page Styles
  coverPage: {
    padding: 0,
    backgroundColor: C.dark,
    fontFamily: 'Helvetica',
    color: C.white,
  },
  contentPage: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    backgroundColor: C.white,
    fontFamily: 'Helvetica',
    color: C.dark,
  },

  // ── Cover Elements ──
  coverHeader: {
    padding: 50,
    paddingTop: 70,
  },
  coverLabel: { fontSize: 10, color: C.accent, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12, fontWeight: 'bold' },
  coverTitle: { fontSize: 38, fontWeight: 'bold', color: C.white, marginBottom: 10, lineHeight: 1.1 },
  coverSubtitle: { fontSize: 14, color: C.zinc500, opacity: 0.8 },
  
  heroSection: {
    flexDirection: 'row',
    flex: 1,
    paddingHorizontal: 50,
  },
  heroLeft: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 20,
  },
  heroRight: {
    width: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  metricBox: {
    backgroundColor: C.zinc800,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: C.accent,
  },
  metricValue: { fontSize: 32, fontWeight: 'bold', color: C.white, marginBottom: 4 },
  metricLabel: { fontSize: 10, color: C.zinc500, textTransform: 'uppercase', letterSpacing: 1 },

  avatarWrap: {
    width: '100%',
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.black,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.zinc800,
    overflow: 'hidden',
  },
  avatarImg: { width: 220, height: 350, objectFit: 'contain' },

  coverFooter: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: C.zinc800,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerTextDark: { fontSize: 9, color: C.zinc500, letterSpacing: 1 },

  // ── Content Elements (Light Theme) ──
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 2,
    borderBottomColor: C.dark,
    paddingBottom: 15,
    marginBottom: 30,
  },
  contentTitle: { fontSize: 24, fontWeight: 'bold', color: C.dark },
  contentDate: { fontSize: 10, color: C.zinc500, fontWeight: 'bold' },

  // Day Section
  dayBlock: { marginBottom: 40, breakInside: 'avoid' },
  dayHeaderWrap: {
    backgroundColor: C.dark,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTitle: { fontSize: 14, fontWeight: 'bold', color: C.white, textTransform: 'uppercase', letterSpacing: 1 },
  dayCount: { fontSize: 10, color: C.accent, fontWeight: 'bold' },

  // Table
  table: { width: '100%' },
  thRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.zinc300, paddingBottom: 8, marginBottom: 8 },
  tr: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fafafa', borderRadius: 6, marginBottom: 6, paddingVertical: 10, paddingHorizontal: 12 },
  th: { fontSize: 9, fontWeight: 'bold', color: C.zinc500, textTransform: 'uppercase' },
  td: { fontSize: 11, color: C.dark, fontWeight: 'bold' },
  tdSub: { fontSize: 9, color: C.zinc500, fontWeight: 'normal', marginTop: 2 },
  
  colExo: { flex: 2.5, paddingRight: 10 },
  colSet: { flex: 1, textAlign: 'center' },
  colWeight: { flex: 1, textAlign: 'center' },
  colRpe: { flex: 1, textAlign: 'center' },
  colCheck: { width: 30, alignItems: 'center', justifyContent: 'center' },

  checkCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: C.zinc300, backgroundColor: C.white },

  // Footer light
  footerLight: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: C.zinc100,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerTextLight: { fontSize: 8, color: C.zinc500 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
interface PDFReportProps {
  simulation: SimulationResult;
  blueprint: WeeklyBlueprint;
  avatarImageStr?: string;
  chartImageStr?: string;
  toggledDays?: { [day: string]: boolean };
}

const DAYS_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// ─── Component ────────────────────────────────────────────────────────────────
const PDFReport = ({ simulation, blueprint, avatarImageStr, toggledDays }: PDFReportProps) => {
  const dateStr = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
  const macro = simulation.weeklyMacro;

  // Calcul du volume total
  const totalSets = Object.values(macro?.weeklyEffectiveSets ?? {}).reduce((sum, v) => sum + (v as number), 0);
  
  // Calcul du tonnage total
  let weeklyTonnage = 0;
  Object.entries(blueprint).forEach(([day, dayExercises]) => {
    if (toggledDays && toggledDays[day] === false) return;
    dayExercises.forEach(ex => {
      if (!ex.active) return;
      ex.sets.forEach(set => {
        if (!set.active) return;
        weeklyTonnage += set.series * set.reps * set.poids;
      });
    });
  });

  const tonnageStr = weeklyTonnage >= 1000 ? `${(weeklyTonnage / 1000).toFixed(1)} t` : `${weeklyTonnage} kg`;

  return (
    <Document>

      {/* ━━━━━━━━━━━━━━━━━━━ PAGE 1 : COVER PREMIUM (DARK) ━━━━━━━━━━━━━━━━━━━ */}
      <Page size="A4" style={s.coverPage}>
        
        <View style={s.coverHeader}>
          <Text style={s.coverLabel}>Plan d&apos;entraînement personnalisé</Text>
          <Text style={s.coverTitle}>Objectif Hypertrophie</Text>
          <Text style={s.coverSubtitle}>Généré professionnellement via Forge Biomécanique</Text>
        </View>

        <View style={s.heroSection}>
          <View style={s.heroLeft}>
            <View style={s.metricBox}>
              <Text style={s.metricValue}>{totalSets}</Text>
              <Text style={s.metricLabel}>Séries Hebdomadaires</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricValue}>{tonnageStr}</Text>
              <Text style={s.metricLabel}>Tonnage Cible</Text>
            </View>
            <View style={[s.metricBox, { borderLeftColor: C.zinc700, backgroundColor: 'transparent', paddingLeft: 0 }]}>
              <Text style={[s.metricLabel, { color: C.white, fontSize: 12, marginBottom: 8, letterSpacing: 0, textTransform: 'none', fontWeight: 'bold' }]}>
                🎯 Consignes du Coach :
              </Text>
              <Text style={[s.metricLabel, { textTransform: 'none', lineHeight: 1.5, color: '#a1a1aa' }]}>
                • Respectez les temps de repos (1m30 - 2m).{'\n'}
                • L&apos;indicateur RPE indique l&apos;effort perçu (10 = échec total, 8 = 2 reps en réserve).{'\n'}
                • Cochez chaque exercice complété.
              </Text>
            </View>
          </View>
          
          <View style={s.heroRight}>
            {avatarImageStr && (
              <View style={s.avatarWrap}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image source={avatarImageStr} style={s.avatarImg} />
              </View>
            )}
          </View>
        </View>

        <View style={s.coverFooter}>
          <Text style={s.footerTextDark}>FORGE PRO COACHING</Text>
          <Text style={s.footerTextDark}>{dateStr}</Text>
        </View>

      </Page>

      {/* ━━━━━━━━━━━━━━━━━━━ PAGE 2+ : CARNET QUOTIDIEN (LIGHT) ━━━━━━━━━━━━━━━━━━━ */}
      <Page size="A4" style={s.contentPage}>
        
        <View style={s.contentHeader}>
          <Text style={s.contentTitle}>Carnet d&apos;Entraînement</Text>
          <Text style={s.contentDate}>SEMAINE TYPE</Text>
        </View>

        {DAYS_ORDER.map((day) => {
          const isToggledOn = !toggledDays || toggledDays[day] !== false;
          const dayExercises = blueprint[day] || [];
          const activeExercises = dayExercises.filter(ex => ex.active);
          
          // Si le jour est de repos, on ne l'affiche pas du tout ou on l'affiche minimaliste.
          // Le prompt dit : "pour que la personne sache quel exo faire".
          // Les jours de repos n'apportent pas de valeur dans un guide, sautons-les pour un effet plus dense et pro.
          if (!isToggledOn || activeExercises.length === 0) {
            return null;
          }

          return (
            <View key={day} style={s.dayBlock}>
              
              <View style={s.dayHeaderWrap}>
                <Text style={s.dayTitle}>{day}</Text>
                <Text style={s.dayCount}>{activeExercises.length} Exercice{activeExercises.length > 1 ? 's' : ''}</Text>
              </View>

              <View style={s.table}>
                {/* Header du tableau */}
                <View style={[s.thRow, { paddingHorizontal: 12 }]}>
                  <Text style={[s.th, s.colExo]}>Mouvement</Text>
                  <Text style={[s.th, s.colSet]}>Volume</Text>
                  <Text style={[s.th, s.colWeight]}>Charge</Text>
                  <Text style={[s.th, s.colRpe]}>Effort</Text>
                  <View style={s.colCheck} />
                </View>

                {/* Exercices */}
                {activeExercises.map(ex => {
                  const template = DEFAULT_EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId);
                  const templateName = template?.nom || ex.exerciseId;
                  const targetMuscle = template?.muscle_primaire || '';
                  
                  // Grouping identique
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
                    <View key={`${ex.id}-${i}`} style={s.tr} wrap={false}>
                      <View style={s.colExo}>
                        <Text style={s.td}>{i === 0 ? templateName : '  "  '}</Text>
                        {i === 0 && targetMuscle && (
                           <Text style={s.tdSub}>Cible : {targetMuscle}</Text>
                        )}
                      </View>
                      
                      <View style={s.colSet}>
                        <Text style={s.td}>{grp.seriesCount} × {grp.reps}</Text>
                        <Text style={s.tdSub}>Reps</Text>
                      </View>

                      <View style={s.colWeight}>
                        <Text style={s.td}>{grp.poids > 0 ? `${grp.poids} kg` : '-'}</Text>
                        <Text style={s.tdSub}>Cible</Text>
                      </View>

                      <View style={s.colRpe}>
                        <Text style={s.td}>RPE {grp.rpe}</Text>
                        <Text style={s.tdSub}>Intensité</Text>
                      </View>

                      <View style={s.colCheck}>
                        <View style={s.checkCircle} />
                      </View>
                    </View>
                  ));
                })}
              </View>
            </View>
          );
        })}

        <View style={s.footerLight} fixed>
          <Text style={s.footerTextLight}>GÉNÉRÉ PAR FORGE</Text>
          <Text style={s.footerTextLight}>PAGE 2 / CARNET</Text>
        </View>

      </Page>
    </Document>
  );
};

export default PDFReport;
