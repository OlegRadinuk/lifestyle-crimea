#!/usr/bin/env ts-node

import { travellineService } from '../lib/travelline';

async function run() {
  try {
    const count = await travellineService.syncBookings();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

run();