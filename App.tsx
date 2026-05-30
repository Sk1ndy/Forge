import React from 'react';
import { ExpoRoot } from 'expo-router';

// Fallback entry point at monorepo root due to hoisted node_modules resolving AppEntry.js
// relative to the monorepo root instead of the workspace folder.
export default function App() {
  // Redirect Expo Router context to the mobile application's app directory
  // @ts-ignore
  const ctx = require.context('./apps/mobile/app');
  return <ExpoRoot context={ctx} />;
}
