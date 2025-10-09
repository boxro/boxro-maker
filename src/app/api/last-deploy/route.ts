import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // package.json의 버전 정보 확인
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    let lastDeploy = 'N/A';

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      lastDeploy = packageJson.version || 'N/A';
    }

    // Git 마지막 커밋 시간 사용
    try {
      const { stdout } = await execAsync('git log -1 --format=%cd --date=short');
      lastDeploy = stdout.trim();
    } catch (error) {
      console.warn('Git 마지막 커밋 시간 가져오기 실패:', error);
    }

    return NextResponse.json({ lastDeploy });
  } catch (error) {
    console.error('마지막 배포 시간 가져오기 실패:', error);
    return NextResponse.json({ lastDeploy: 'N/A' });
  }
}

