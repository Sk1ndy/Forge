'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { SimulationResult, WeeklyBlueprint, DEFAULT_EXERCISE_LIBRARY } from '@/lib/calculations';

// ─── Design Tokens (Premium SaaS) ─────────────────────────────────────────────
const C = {
  textTitle:   '#111827',
  textBody:    '#374151',
  textMuted:   '#6B7280',
  
  bgPage:      '#FFFFFF',
  bgCard:      '#F9FAFB',
  bgHeaderRow: '#F3F4F6',
  bgCoachRow:  '#EFF6FF',
  bgExoBlock:  '#FFFFFF',

  borderUltraLight: '#F3F4F6',
  borderLight: '#E5E7EB',
  borderDark:  '#D1D5DB',
  
  accent:      '#2563EB', // SaaS Blue
  accentLight: '#DBEAFE',
  success:     '#10B981',
};

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.bgPage,
    fontFamily: 'Helvetica',
    padding: 40,
    color: C.textBody,
  },
  
  section: {
    marginTop: 25,
  },
  sectionTitleWrap: {
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    paddingBottom: 8,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: C.textTitle, textTransform: 'uppercase', letterSpacing: 1 },

  // Header Page 1
  headerWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleMain: { fontSize: 28, fontWeight: 'bold', color: C.textTitle, letterSpacing: -0.5 },
  titleSub: { fontSize: 10, color: C.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  headerRight: { alignItems: 'flex-end' },
  badge: { backgroundColor: C.accentLight, color: C.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },

  // KPIs 3 columns
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: C.bgCard,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.borderLight,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  kpiLabel: { fontSize: 9, color: C.textMuted, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 8, letterSpacing: 0.5 },
  kpiValue: { fontSize: 24, fontWeight: 'bold', color: C.accent },
  kpiSub: { fontSize: 9, color: C.success, marginTop: 4, fontWeight: 'bold' },

  // Avatar Section
  avatarWrap: {
    marginTop: 35,
    alignItems: 'center',
    backgroundColor: C.bgCard,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  avatarImg: { width: 220, height: 350, objectFit: 'contain' },
  avatarBadgeTop: { position: 'absolute', top: 20, backgroundColor: '#FFFFFF', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: C.borderLight, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  avatarBadgeBottom: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#FFFFFF', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: C.borderLight, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  avatarBadgeText: { fontSize: 9, fontWeight: 'bold', color: C.textTitle },

  // ─── Tables Page 2 ───
  dayTitle: { fontSize: 14, fontWeight: 'bold', color: C.textTitle, textTransform: 'uppercase' },
  dayCount: { fontSize: 10, color: C.textMuted, marginTop: 2 },

  table: { width: '100%', marginTop: 12 },
  
  // Header Row
  thRow: { 
    flexDirection: 'row', 
    backgroundColor: C.bgHeaderRow, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 6,
    marginBottom: 8 
  },
  thColExo: { flex: 3, textAlign: 'left' },
  thColNum: { flex: 1, textAlign: 'right' },
  thText: { fontSize: 9, fontWeight: 'bold', color: C.textBody, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Exercise Block
  exoBlock: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.borderLight,
    borderRadius: 8,
    overflow: 'hidden',
  },
  trSet: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderUltraLight,
    backgroundColor: C.bgExoBlock,
    alignItems: 'center',
  },
  tdTextMain: { fontSize: 11, fontWeight: 'bold', color: C.textTitle },
  tdTextSub: { fontSize: 9, color: C.textMuted, marginTop: 2 },
  tdNum: { fontSize: 11, fontWeight: 'bold', color: C.textTitle },
  
  colExo: { flex: 3, textAlign: 'left', paddingRight: 8 },
  colNum: { flex: 1, textAlign: 'right' },

  // Coach Advice Row
  coachRow: {
    backgroundColor: C.bgCoachRow,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachIcon: { fontSize: 10, marginRight: 6 },
  coachText: { fontSize: 9, color: C.accent, fontWeight: 'bold' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    paddingTop: 10,
  },
  footerText: { fontSize: 8, color: C.textMuted, textTransform: 'uppercase' },
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
    `Cible principale : ${muscle || 'muscles sollicités'}. Focus sur la qualité du mouvement.`,
    "Exécution stricte requise. Ne sacrifiez pas la forme pour la charge.",
    "Progression linéaire conseillée sur ce mouvement polyarticulaire.",
    "Tension maximale sur la phase de contraction.",
    "Excellent mouvement pour le volume. Maintenez le RPE cible."
  ];
  return advices[Math.floor(Math.random() * advices.length)];
};

// ─── Component ────────────────────────────────────────────────────────────────
const PDFReport = ({ simulation, blueprint, avatarImageStr, toggledDays }: PDFReportProps) => {
  const dateStr = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const macro = simulation.weeklyMacro;

  const totalSets = Object.values(macro?.weeklyEffectiveSets ?? {}).reduce((sum, v) => sum + (v as number), 0);
  
  let weeklyTonnage = 0;
  let totalRpe = 0;
  let setsCount = 0;

  Object.entries(blueprint).forEach(([day, dayExercises]) => {
    if (toggledDays && toggledDays[day] === false) return;
    dayExercises.forEach(ex => {
      if (!ex.active) return;
      ex.sets.forEach(set => {
        if (!set.active) return;
        weeklyTonnage += set.series * set.reps * set.poids;
        totalRpe += set.rpe * set.series;
        setsCount += set.series;
      });
    });
  });

  const tonnageVal = weeklyTonnage >= 1000 ? (weeklyTonnage / 1000).toFixed(1) : weeklyTonnage.toString();
  const tonnageUnit = weeklyTonnage >= 1000 ? 'Tonnes' : 'Kg';
  const avgRpe = setsCount > 0 ? (totalRpe / setsCount).toFixed(1) : '0';

  return (
    <Document>

      {/* ━━━━━━━━━━━━━━━━━━━ PAGE 1 : BILAN PERFORMANCE ━━━━━━━━━━━━━━━━━━━ */}
      <Page size="A4" style={s.page}>
        
        <View style={s.headerWrap}>
          <View>
            <Text style={s.titleMain}>BILAN PERFORMANCE</Text>
            <Text style={s.titleSub}>RAPPORT ANALYTIQUE DE LA SEMAINE</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.badge}>FORGE ATHLETE</Text>
            <Text style={s.titleSub}>{dateStr}</Text>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionTitleWrap}>
            <Text style={s.sectionTitle}>Indicateurs de Progrès</Text>
          </View>
          <View style={s.kpiRow}>
            <View style={[s.kpiCard, { marginLeft: 0 }]}>
              <Text style={s.kpiLabel}>Tonnage Hebdo</Text>
              <Text style={s.kpiValue}>{tonnageVal} {tonnageUnit}</Text>
              <Text style={s.kpiSub}>↗ Volume Stimulant</Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiLabel}>Séries Effectives</Text>
              <Text style={s.kpiValue}>{totalSets}</Text>
              <Text style={s.kpiSub}>🎯 Répartition Optimale</Text>
            </View>
            <View style={[s.kpiCard, { marginRight: 0 }]}>
              <Text style={s.kpiLabel}>Intensité Moyenne</Text>
              <Text style={s.kpiValue}>RPE {avgRpe}</Text>
              <Text style={s.kpiSub}>🔥 Haute Intensité</Text>
            </View>
          </View>
        </View>

        {avatarImageStr && (
          <View style={s.section}>
            <View style={s.sectionTitleWrap}>
              <Text style={s.sectionTitle}>Cartographie Musculaire</Text>
            </View>
            <View style={s.avatarWrap}>
              <View style={s.avatarBadgeTop}>
                <Text style={s.avatarBadgeText}>↗ Focus Hypertrophie Actif</Text>
              </View>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image source={avatarImageStr} style={s.avatarImg} />
              <View style={s.avatarBadgeBottom}>
                <Text style={s.avatarBadgeText}>Distribution Parfaite ✅</Text>
              </View>
            </View>
          </View>
        )}

      </Page>

      {/* ━━━━━━━━━━━━━━━━━━━ PAGE 2+ : CARNET DE SÉANCES ━━━━━━━━━━━━━━━━━━━ */}
      <Page size="A4" style={s.page}>
        
        <View style={s.sectionTitleWrap}>
          <Text style={s.sectionTitle}>Programme de la Semaine</Text>
        </View>

        {DAYS_ORDER.map((day) => {
          const isToggledOn = !toggledDays || toggledDays[day] !== false;
          const dayExercises = blueprint[day] || [];
          const activeExercises = dayExercises.filter(ex => ex.active);
          
          if (!isToggledOn || activeExercises.length === 0) {
            return null;
          }

          return (
            <View key={day} style={s.section}>
              
              <Text style={s.dayTitle}>{day}</Text>
              <Text style={s.dayCount}>{activeExercises.length} Exercice{activeExercises.length > 1 ? 's' : ''}</Text>

              <View style={s.table}>
                {/* Header Row */}
                <View style={s.thRow} wrap={false}>
                  <Text style={[s.thText, s.thColExo]}>Exercice</Text>
                  <Text style={[s.thText, s.thColNum]}>Séries</Text>
                  <Text style={[s.thText, s.thColNum]}>Reps</Text>
                  <Text style={[s.thText, s.thColNum]}>Poids</Text>
                  <Text style={[s.thText, s.thColNum]}>RPE</Text>
                </View>

                {/* Exercises Blocks */}
                {activeExercises.map((ex) => {
                  const template = DEFAULT_EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId);
                  const templateName = template?.nom || ex.exerciseId;
                  const targetMuscle = template?.muscle_primaire || '';
                  
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
                    <View key={ex.id} style={s.exoBlock} wrap={false}>
                      {groupedSets.map((grp, i) => (
                        <View key={`${ex.id}-set-${i}`} style={s.trSet}>
                          <View style={s.colExo}>
                            <Text style={s.tdTextMain}>{i === 0 ? templateName : '  "  '}</Text>
                            {i === 0 && targetMuscle && (
                              <Text style={s.tdTextSub}>Cible: {targetMuscle}</Text>
                            )}
                          </View>
                          <Text style={[s.tdNum, s.colNum]}>{grp.seriesCount}</Text>
                          <Text style={[s.tdNum, s.colNum]}>{grp.reps}</Text>
                          <Text style={[s.tdNum, s.colNum]}>{grp.poids > 0 ? `${grp.poids} kg` : '-'}</Text>
                          <Text style={[s.tdNum, s.colNum]}>{grp.rpe}</Text>
                        </View>
                      ))}
                      
                      {/* Coach Advice */}
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
          <Text style={s.footerText}>Bilan Performance généré par Forge</Text>
          <Text style={s.footerText}>PAGE 2 / CARNET</Text>
        </View>

      </Page>
    </Document>
  );
};

export default PDFReport;
