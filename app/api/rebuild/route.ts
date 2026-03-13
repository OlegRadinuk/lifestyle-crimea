import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Запускаем перезапуск в фоне
    execAsync('cd /var/www/lovelifestyle && pm2 restart lovelifestyle')
      .catch(console.error);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Redeploy started' 
    });
  } catch (error) {
    console.error('Redeploy error:', error);
    return NextResponse.json(
      { error: 'Failed to redeploy' }, 
      { status: 500 }
    );
  }
}