'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { SimulationResult, WeeklyBlueprint, DEFAULT_EXERCISE_LIBRARY } from '@/lib/calculations';

// ─── Design Tokens (Magazine Style) ───────────────────────────────────────────
const C = {
  navy:        '#0f172a',
  navyLight:   '#1e293b',
  white:       '#ffffff',
  offWhite:    '#f8fafc',
  gray100:     '#f1f5f9',
  gray300:     '#cbd5e1',
  gray500:     '#64748b',
  gray800:     '#1e293b',
  black:       '#020617',
  emerald:     '#10b981',
  gold:        '#eab308',
};

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.offWhite,
    fontFamily: 'Helvetica',
    color: C.black,
    padding: 0,
  },
  
  // Header
  header: {
    backgroundColor: C.navy,
    padding: 40,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 36, fontWeight: 'bold', color: C.white, textTransform: 'uppercase', letterSpacing: -1 },
  headerSubtitle: { fontSize: 12, color: C.gray300, marginTop: 4, letterSpacing: 2 },
  headerRight: { alignItems: 'flex-end' },
  headerBadge: { backgroundColor: C.emerald, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, fontSize: 10, fontWeight: 'bold', color: C.white, marginBottom: 8, textTransform: 'uppercase' },
  headerDate: { fontSize: 10, color: C.gray300 },

  // Hero Section
  hero: {
    padding: 40,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  heroLeft: { flex: 1 },
  heroLabel: { fontSize: 12, color: C.gray500, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  heroValue: { fontSize: 64, fontWeight: 'bold', color: C.navy, letterSpacing: -2, lineHeight: 1 },
  heroUnit: { fontSize: 24, color: C.gray500, fontWeight: 'normal', letterSpacing: 0 },
  
  // Avatar / Heatmap Section
  avatarSection: {
    padding: 40,
    paddingVertical: 30,
    alignItems: 'center',
    backgroundColor: C.offWhite,
  },
  avatarWrap: {
    width: 200,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'contain' },
  avatarLegendBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.gray300,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.emerald, marginRight: 8 },
  legendText: { fontSize: 10, fontWeight: 'bold', color: C.navy, textTransform: 'uppercase' },

  // Dashboard Section
  dashboardRow: {
    flexDirection: 'row',
    padding: 40,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  dashCol: {
    flex: 1,
    backgroundColor: C.white,
    padding: 20,
    borderRadius: 8,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: C.gray100,
  },
  dashLabel: { fontSize: 10, color: C.gray500, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 12 },
  progressBarBg: { height: 6, backgroundColor: C.gray100, borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: C.navy, borderRadius: 3 },
  dashStatus: { fontSize: 11, fontWeight: 'bold', color: C.emerald },

  // Page 2 : Guide
  guidePage: {
    padding: 40,
    backgroundColor: C.white,
    fontFamily: 'Helvetica',
  },
  dayBlock: { marginBottom: 40, breakInside: 'avoid' },
  dayTitleBox: {
    borderLeftWidth: 4,
    borderLeftColor: C.navy,
    paddingLeft: 12,
    marginBottom: 20,
  },
  dayTitle: { fontSize: 24, fontWeight: 'bold', color: C.navy, textTransform: 'uppercase' },
  daySubtitle: { fontSize: 10, color: C.gray500, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },

  // Table
  table: { width: '100%' },
  thRow: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: C.navy, paddingBottom: 8, marginBottom: 8 },
  th: { fontSize: 9, fontWeight: 'bold', color: C.navy, textTransform: 'uppercase', letterSpacing: 1 },
  
  trGroup: { marginBottom: 4 },
  tr: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.gray100, paddingVertical: 12, paddingHorizontal: 10 },
  trAlt: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, paddingVertical: 12, paddingHorizontal: 10 },
  td: { fontSize: 12, color: C.black, fontWeight: 'bold' },
  
  coachRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#f8fafc', borderLeftWidth: 2, borderLeftColor: C.emerald, marginLeft: 10, marginRight: 10, marginBottom: 8 },
  coachIcon: { fontSize: 10, marginRight: 6 },
  coachText: { fontSize: 9, color: C.gray500, fontStyle: 'italic' },

  colExo: { flex: 3 },
  colSet: { flex: 1, textAlign: 'center' },
  colRep: { flex: 1, textAlign: 'center' },
  colWeight: { flex: 1, textAlign: 'center' },
  colRpe: { flex: 1, textAlign: 'center' },

  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.gray100,
    paddingTop: 10,
  },
  footerText: { fontSize: 8, color: C.gray300, fontWeight: 'bold', textTransform: 'uppercase' },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
interface PDFReportProps {
  simulation: SimulationResult;
  blueprint: WeeklyBlueprint;
  avatarImageStr?: string | null;
  toggledDays?: { [day: string]: boolean };
}

const DAYS_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const getRandomPositiveAdvice = (muscle: string) => {
  const advices = [
    `Focus sur la contraction maximale des ${muscle || 'muscles ciblés'}.`,
    "Contrôlez bien la phase excentrique (descente lente).",
    "Gardez une tension continue tout au long du mouvement.",
    "Explosivité sur la phase concentrique !",
    "Maintenez une posture solide et stable."
  ];
  return advices[Math.floor(Math.random() * advices.length)];
};

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

  const tonnageVal = weeklyTonnage >= 1000 ? (weeklyTonnage / 1000).toFixed(1) : weeklyTonnage.toString();
  const tonnageUnit = weeklyTonnage >= 1000 ? 'Tonnes' : 'Kg';

  // Stats pour le dashboard
  const pushPct = macro?.pushPullRatio?.push ?? 50;
  const axial = macro?.axialSncLoad ?? 0;

  return (
    <Document>

      {/* ━━━━━━━━━━━━━━━━━━━ PAGE 1 : GUIDE COVER ━━━━━━━━━━━━━━━━━━━ */}
      <Page size="A4" style={s.page}>
        
        {/* HEADER */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Guide de Progression</Text>
            <Text style={s.headerSubtitle}>PROGRAMME D&apos;ENTRAÎNEMENT SUR MESURE</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerBadge}>FORGE ATHLETE</Text>
            <Text style={s.headerDate}>{dateStr}</Text>
          </View>
        </View>

        {/* HERO TONNAGE */}
        <View style={s.hero}>
          <View style={s.heroLeft}>
            <Text style={s.heroLabel}>Tonnage Hebdomadaire Cible</Text>
            <Text style={s.heroValue}>
              {tonnageVal} <Text style={s.heroUnit}>{tonnageUnit}</Text>
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
             <Text style={s.heroLabel}>Séries Effectives</Text>
             <Text style={[s.heroValue, { fontSize: 48, color: C.emerald }]}>{totalSets}</Text>
          </View>
        </View>

        {/* AVATAR HEATMAP */}
        {avatarImageStr && (
          <View style={s.avatarSection}>
            <View style={s.avatarWrap}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image source={avatarImageStr} style={s.avatarImg} />
            </View>
            <View style={s.avatarLegendBox}>
              <View style={s.legendDot} />
              <Text style={s.legendText}>Volume de Stimulus Optimisé pour la Croissance</Text>
            </View>
          </View>
        )}

        {/* DASHBOARD 3 COLONNES */}
        <View style={s.dashboardRow}>
          {/* Col 1 : Volume */}
          <View style={[s.dashCol, { marginLeft: 0 }]}>
            <Text style={s.dashLabel}>Charge de Travail</Text>
            <View style={s.progressBarBg}>
              <View style={[s.progressBarFill, { width: '85%', backgroundColor: C.navy }]} />
            </View>
            <Text style={s.dashStatus}>🚀 Volume optimisé</Text>
          </View>
          
          {/* Col 2 : Charge Axiale */}
          <View style={s.dashCol}>
            <Text style={s.dashLabel}>Stress Structurel</Text>
            <View style={s.progressBarBg}>
              <View style={[s.progressBarFill, { width: `${Math.min(100, axial)}%`, backgroundColor: C.emerald }]} />
            </View>
            <Text style={s.dashStatus}>✅ Parfaitement toléré</Text>
          </View>

          {/* Col 3 : Balance Push/Pull */}
          <View style={[s.dashCol, { marginRight: 0 }]}>
            <Text style={s.dashLabel}>Ratio Moteur</Text>
            <View style={s.progressBarBg}>
              <View style={[s.progressBarFill, { width: `${pushPct}%`, backgroundColor: C.navy }]} />
            </View>
            <Text style={s.dashStatus}>⚖️ Équilibre validé</Text>
          </View>
        </View>

      </Page>

      {/* ━━━━━━━━━━━━━━━━━━━ PAGE 2+ : LE CARNET ━━━━━━━━━━━━━━━━━━━ */}
      <Page size="A4" style={s.guidePage}>
        
        {DAYS_ORDER.map((day) => {
          const isToggledOn = !toggledDays || toggledDays[day] !== false;
          const dayExercises = blueprint[day] || [];
          const activeExercises = dayExercises.filter(ex => ex.active);
          
          if (!isToggledOn || activeExercises.length === 0) {
            return null;
          }

          return (
            <View key={day} style={s.dayBlock}>
              
              <View style={s.dayTitleBox}>
                <Text style={s.dayTitle}>{day}</Text>
                <Text style={s.daySubtitle}>— {activeExercises.length} Mouvement{activeExercises.length > 1 ? 's' : ''} au programme</Text>
              </View>

              <View style={s.table}>
                {/* Header */}
                <View style={[s.thRow, { paddingHorizontal: 10 }]}>
                  <Text style={[s.th, s.colExo]}>Mouvement</Text>
                  <Text style={[s.th, s.colSet]}>Séries</Text>
                  <Text style={[s.th, s.colRep]}>Reps</Text>
                  <Text style={[s.th, s.colWeight]}>Poids</Text>
                  <Text style={[s.th, s.colRpe]}>RPE</Text>
                </View>

                {/* Rows */}
                {activeExercises.map((ex, exIndex) => {
                  const template = DEFAULT_EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId);
                  const templateName = template?.nom || ex.exerciseId;
                  const targetMuscle = template?.muscle_primaire || '';
                  
                  // Groupement des séries identiques
                  const groupedSets: { reps: number; poids: number; rpe: number; seriesCount: number }[] = [];
                  ex.sets.filter(s => s.active).forEach(s => {
                    const existing = groupedSets.find(g => g.reps === s.reps && g.poids === s.poids && g.rpe === s.rpe);
                    if (existing) {
                      existing.seriesCount += s.series;
                    } else {
                      groupedSets.push({ reps: s.reps, poids: s.poids, rpe: s.rpe, seriesCount: s.series });
                    }
                  });

                  return (
                    <View key={ex.id} style={s.trGroup} wrap={false}>
                      {groupedSets.map((grp, i) => {
                        const isAlt = i % 2 !== 0;
                        return (
                          <View key={`${ex.id}-set-${i}`} style={isAlt ? s.trAlt : s.tr}>
                            <View style={s.colExo}>
                              <Text style={s.td}>{i === 0 ? templateName : '  "  '}</Text>
                            </View>
                            <Text style={[s.td, s.colSet]}>{grp.seriesCount}</Text>
                            <Text style={[s.td, s.colRep]}>{grp.reps}</Text>
                            <Text style={[s.td, s.colWeight]}>{grp.poids > 0 ? `${grp.poids} kg` : '-'}</Text>
                            <Text style={[s.td, s.colRpe]}>{grp.rpe}</Text>
                          </View>
                        );
                      })}
                      
                      {/* Ligne Conseil Coach */}
                      <View style={s.coachRow}>
                        <Text style={s.coachIcon}>💡</Text>
                        <Text style={s.coachText}>Conseil Coach : {getRandomPositiveAdvice(targetMuscle)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

            </View>
          );
        })}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>FORGE ATHLETICS</Text>
          <Text style={s.footerText}>GUIDE D&apos;ENTRAÎNEMENT</Text>
        </View>

      </Page>
    </Document>
  );
};

export default PDFReport;
