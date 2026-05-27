'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { SimulationResult, WeeklyBlueprint, DEFAULT_EXERCISE_LIBRARY } from '@/lib/calculations';

// ─── Design Tokens (Objective Data) ───────────────────────────────────────────
const C = {
  textTitle:   '#000000',
  textBody:    '#374151',
  textMuted:   '#9CA3AF',
  
  bgPage:      '#FFFFFF',
  bgAltRow:    '#F9FAFB',

  borderLine:  '#E5E7EB',
  borderDark:  '#000000',
};

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.bgPage,
    padding: 40,
    fontFamily: 'Helvetica',
    color: C.textBody,
  },
  
  // ─── Headers ───
  headerBox: {
    borderBottomWidth: 2,
    borderBottomColor: C.borderDark,
    paddingBottom: 10,
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: C.textTitle, textTransform: 'uppercase' },
  headerDate: { fontSize: 10, color: C.textMuted, textTransform: 'uppercase' },

  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: C.textTitle, textTransform: 'uppercase', marginBottom: 15 },

  // ─── Avatar & Annotations ───
  avatarContainer: {
    position: 'relative',
    height: 350,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  avatarImg: { width: 180, height: 350, objectFit: 'contain' },

  // Annotation Base
  annoRowLeft: { position: 'absolute', left: 0, flexDirection: 'row', alignItems: 'center', width: '40%', justifyContent: 'flex-end' },
  annoRowRight: { position: 'absolute', right: 0, flexDirection: 'row', alignItems: 'center', width: '40%', justifyContent: 'flex-start' },
  annoTextLeft: { fontSize: 9, color: C.textTitle, fontWeight: 'bold', textAlign: 'right' },
  annoTextRight: { fontSize: 9, color: C.textTitle, fontWeight: 'bold', textAlign: 'left' },
  annoLine: { height: 1, backgroundColor: C.borderDark },

  // ─── Dashboard ───
  dashGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tonnageBox: {
    width: '35%',
    borderWidth: 1,
    borderColor: C.borderLine,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tonnageValue: { fontSize: 24, fontWeight: 'bold', color: C.textTitle },
  tonnageLabel: { fontSize: 10, color: C.textMuted, textTransform: 'uppercase', marginTop: 4 },

  muscleTable: {
    width: '60%',
    borderWidth: 1,
    borderColor: C.borderLine,
  },
  mRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.borderLine },
  mRowAlt: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.borderLine, backgroundColor: C.bgAltRow },
  mColName: { flex: 2, fontSize: 9, color: C.textTitle, fontWeight: 'bold' },
  mColVal: { flex: 1, fontSize: 9, color: C.textTitle, textAlign: 'right' },

  // ─── Carnet (Page 2) ───
  dayBlock: { marginBottom: 35, breakInside: 'avoid' },
  dayTitle: { fontSize: 12, fontWeight: 'bold', color: C.textTitle, textTransform: 'uppercase', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: C.borderLine, paddingBottom: 4 },

  table: { width: '100%' },
  thRow: { flexDirection: 'row', paddingBottom: 6, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: C.borderDark },
  thTextMain: { flex: 3, fontSize: 9, fontWeight: 'bold', color: C.textTitle, textTransform: 'uppercase' },
  thTextNum: { flex: 1, fontSize: 9, fontWeight: 'bold', color: C.textTitle, textTransform: 'uppercase', textAlign: 'right' },

  trRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4 },
  trRowAlt: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4, backgroundColor: C.bgAltRow },
  tdTextMain: { flex: 3, fontSize: 10, color: C.textTitle },
  tdTextNum: { flex: 1, fontSize: 10, color: C.textBody, textAlign: 'right' },

  // ─── Footer ───
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.borderLine, paddingTop: 10 },
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

// ─── Component ────────────────────────────────────────────────────────────────
const PDFReport = ({ simulation, blueprint, avatarImageStr, toggledDays }: PDFReportProps) => {
  const dateStr = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // ─── Data Extraction ───
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

  const sets = simulation.weeklyMacro?.weeklyEffectiveSets ?? {};
  
  const muscleGroups = [
    { label: 'Pectoraux', val: (sets['chest'] || 0) + (sets['upperChest'] || 0) },
    { label: 'Dos', val: (sets['lats'] || 0) + (sets['traps'] || 0) + (sets['lowerBack'] || 0) + (sets['rhomboids'] || 0) },
    { label: 'Épaules', val: (sets['frontDelts'] || 0) + (sets['sideDelts'] || 0) + (sets['rearDelts'] || 0) },
    { label: 'Biceps', val: sets['biceps'] || 0 },
    { label: 'Triceps', val: sets['triceps'] || 0 },
    { label: 'Quadriceps', val: sets['quads'] || 0 },
    { label: 'Ischios & Fessiers', val: (sets['hamstrings'] || 0) + (sets['glutes'] || 0) },
  ];

  return (
    <Document>

      {/* ━━━━━━━━━━━━━━━━━━━ PAGE 1 : ANALYSE ANATOMIQUE ━━━━━━━━━━━━━━━━━━━ */}
      <Page size="A4" style={s.page}>
        
        <View style={s.headerBox} fixed>
          <Text style={s.headerTitle}>Rapport de Performance</Text>
          <Text style={s.headerDate}>{dateStr}</Text>
        </View>

        <Text style={s.sectionTitle}>Analyse du Volume</Text>
        
        <View style={s.avatarContainer}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {avatarImageStr && <Image source={avatarImageStr} style={s.avatarImg} />}
          
          {/* Annotations (Lignes pointant vers l'avatar) */}
          <View style={[s.annoRowLeft, { top: '15%' }]}>
            <Text style={s.annoTextLeft}>Épaules : {muscleGroups.find(m => m.label === 'Épaules')?.val} s</Text>
            <View style={[s.annoLine, { width: 40, marginLeft: 8 }]} />
          </View>
          
          <View style={[s.annoRowRight, { top: '25%' }]}>
            <View style={[s.annoLine, { width: 40, marginRight: 8 }]} />
            <Text style={s.annoTextRight}>Pectoraux : {muscleGroups.find(m => m.label === 'Pectoraux')?.val} s</Text>
          </View>

          <View style={[s.annoRowLeft, { top: '35%' }]}>
            <Text style={s.annoTextLeft}>Biceps : {muscleGroups.find(m => m.label === 'Biceps')?.val} s</Text>
            <View style={[s.annoLine, { width: 25, marginLeft: 8 }]} />
          </View>

          <View style={[s.annoRowRight, { top: '40%' }]}>
            <View style={[s.annoLine, { width: 25, marginRight: 8 }]} />
            <Text style={s.annoTextRight}>Dos : {muscleGroups.find(m => m.label === 'Dos')?.val} s</Text>
          </View>

          <View style={[s.annoRowLeft, { top: '48%' }]}>
            <Text style={s.annoTextLeft}>Triceps : {muscleGroups.find(m => m.label === 'Triceps')?.val} s</Text>
            <View style={[s.annoLine, { width: 35, marginLeft: 8 }]} />
          </View>

          <View style={[s.annoRowRight, { top: '65%' }]}>
            <View style={[s.annoLine, { width: 30, marginRight: 8 }]} />
            <Text style={s.annoTextRight}>Quadriceps : {muscleGroups.find(m => m.label === 'Quadriceps')?.val} s</Text>
          </View>

          <View style={[s.annoRowLeft, { top: '80%' }]}>
            <Text style={s.annoTextLeft}>Ischios & Fessiers : {muscleGroups.find(m => m.label === 'Ischios & Fessiers')?.val} s</Text>
            <View style={[s.annoLine, { width: 20, marginLeft: 8 }]} />
          </View>
        </View>

        <View style={s.dashGrid}>
          <View style={s.tonnageBox}>
            <Text style={s.tonnageValue}>{weeklyTonnage} KG</Text>
            <Text style={s.tonnageLabel}>Tonnage Total</Text>
          </View>

          <View style={s.muscleTable}>
            {muscleGroups.map((m, i) => (
              <View key={m.label} style={i % 2 === 0 ? s.mRowAlt : s.mRow}>
                <Text style={s.mColName}>{m.label}</Text>
                <Text style={s.mColVal}>{m.val} séries</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Forge Simulator</Text>
          <Text style={s.footerText}>Données Brutes</Text>
        </View>
      </Page>

      {/* ━━━━━━━━━━━━━━━━━━━ PAGE 2+ : CARNET DE SÉANCE ━━━━━━━━━━━━━━━━━━━ */}
      <Page size="A4" style={s.page}>
        
        <View style={s.headerBox} fixed>
          <Text style={s.headerTitle}>Carnet de Séances</Text>
          <Text style={s.headerDate}>Volume & Intensité</Text>
        </View>

        {DAYS_ORDER.map((day) => {
          const isToggledOn = !toggledDays || toggledDays[day] !== false;
          const dayExercises = blueprint[day as keyof typeof blueprint] || [];
          const activeExercises = dayExercises.filter(ex => ex.active);
          
          if (!isToggledOn || activeExercises.length === 0) return null;

          return (
            <View key={day} style={s.dayBlock} wrap={false}>
              
              <Text style={s.dayTitle}>{day}</Text>

              <View style={s.table}>
                {/* Table Header */}
                <View style={s.thRow}>
                  <Text style={s.thTextMain}>Exercice</Text>
                  <Text style={s.thTextNum}>Séries</Text>
                  <Text style={s.thTextNum}>Reps</Text>
                  <Text style={s.thTextNum}>Poids</Text>
                  <Text style={s.thTextNum}>RPE</Text>
                </View>

                {/* Exercises Rows */}
                {activeExercises.map((ex, exIndex) => {
                  const template = DEFAULT_EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId);
                  const templateName = template?.nom || ex.exerciseId;
                  
                  const groupedSets: { reps: number; poids: number; rpe: number; seriesCount: number }[] = [];
                  ex.sets.filter(s => s.active).forEach(s => {
                    const existing = groupedSets.find(g => g.reps === s.reps && g.poids === s.poids && g.rpe === s.rpe);
                    if (existing) {
                      existing.seriesCount += s.series;
                    } else {
                      groupedSets.push({ reps: s.reps, poids: s.poids, rpe: s.rpe, seriesCount: s.series });
                    }
                  });

                  return groupedSets.map((grp, i) => {
                    const isAlt = (exIndex + i) % 2 !== 0;
                    return (
                      <View key={`${ex.id}-set-${i}`} style={isAlt ? s.trRowAlt : s.trRow}>
                        <Text style={s.tdTextMain}>{i === 0 ? templateName : '  "  '}</Text>
                        <Text style={s.tdTextNum}>{grp.seriesCount}</Text>
                        <Text style={s.tdTextNum}>{grp.reps}</Text>
                        <Text style={s.tdTextNum}>{grp.poids > 0 ? `${grp.poids} kg` : '-'}</Text>
                        <Text style={s.tdTextNum}>{grp.rpe}</Text>
                      </View>
                    );
                  });
                })}
              </View>
            </View>
          );
        })}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Forge Simulator</Text>
          <Text style={s.footerText}>Carnet d&apos;Entraînement</Text>
        </View>

      </Page>
    </Document>
  );
};

export default PDFReport;
