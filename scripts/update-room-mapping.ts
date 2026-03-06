#!/usr/bin/env ts-node

import { travellineService } from '../lib/travelline';
import * as fs from 'fs';

async function generateMapping() {
  console.log('🔍 Fetching room types from Travelline...');
  const roomTypes = await travellineService.getRoomTypes();
  
  console.log(`\n📋 Found ${roomTypes.length} room types:`);
  console.log('\nCopy this mapping into lib/travelline.ts:\n');
  console.log('const ROOM_TYPE_MAPPING: Record<string, string> = {');
  
  roomTypes.slice(0, 10).forEach((rt: any) => {
    // Здесь нужно вручную сопоставить с нашими ID
    console.log(`  // ${rt.name.substring(0, 50)}...`);
    console.log(`  '${rt.id}': 'TODO',`);
  });
  
  console.log('};');
}

generateMapping();