import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export async function GET() {
  try {
    let lastBuild = 'N/A';

    // .next 폴더의 생성 시간 확인
    const nextPath = path.join(process.cwd(), '.next');
    if (fs.existsSync(nextPath)) {
      const stats = fs.statSync(nextPath);
      lastBuild = stats.mtime.toLocaleDateString('ko-KR');
    }

    // Git 마지막 커밋 시간 사용 (fallback)
    try {
      const { stdout } = await execAsync('git log -1 --format=%cd --date=short');
      lastBuild = stdout.trim();
    } catch (error) {
      console.warn('Git 마지막 커밋 시간 가져오기 실패:', error);
    }

    return NextResponse.json({ lastBuild });
  } catch (error) {
    console.error('마지막 빌드 시간 가져오기 실패:', error);
    return NextResponse.json({ lastBuild: 'N/A' });
  }
}

