#!/usr/bin/env node
// Helper demonstrating the createRegion() programmatic API.
//
// Run:   node scripts/build-regions.js
// Copy the JSON output into a flow YAML as:
//   env:
//     REGIONS: '<paste here>'
//
// This is the same region set baked into flows/coded-regions.yaml.

const { createRegion } = require('@percy/maestro');

const regions = [
  // Ignore the top 80px nav area via coordinate-based boundingBox
  createRegion({
    boundingBox: { x: 0, y: 0, width: 1280, height: 80 },
    padding: 4,
    algorithm: 'ignore'
  }),

  // Treat layout shifts inside <footer> as noise (CSS selector + layout algorithm)
  createRegion({
    elementCSS: 'footer',
    algorithm: 'layout'
  }),

  // Intelliignore over a mid-page area with full AI-tuning configuration
  createRegion({
    boundingBox: { x: 0, y: 600, width: 1280, height: 400 },
    algorithm: 'intelliignore',
    carouselsEnabled: true,
    bannersEnabled: true,
    adsEnabled: true
  })
];

process.stdout.write(JSON.stringify(regions));
