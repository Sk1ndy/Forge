import React from 'react';
import { ExpoRoot } from 'expo-router';

// Fallback entry point to ensure Expo Router resolves correctly
// even if Metro defaults to node_modules/expo/AppEntry.js
export default function App() {
  // @ts-ignore - require.context is an Expo/Metro extension
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}
