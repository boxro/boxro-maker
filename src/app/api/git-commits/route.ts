import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Git 커밋 수 가져오기
    const { stdout } = await execAsync('git rev-list --count HEAD');
    const totalCommits = parseInt(stdout.trim()) || 0;

    return NextResponse.json({ totalCommits });
  } catch (error) {
    console.error('Git 커밋 수 가져오기 실패:', error);
    return NextResponse.json({ totalCommits: 0 });
  }
}

