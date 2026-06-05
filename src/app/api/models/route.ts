import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const assetsDir = path.join(process.cwd(), 'public', 'assets', 'models');
    const files = fs.readdirSync(assetsDir);
    
    const models = files
      .filter(file => file.endsWith('.glb') || file.endsWith('.gltf'))
      .map((file, index) => {
        const name = file
          .replace(/\.(glb|gltf)$/, '')
          .split(/[-_]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
        return {
          id: `dynamic-${index}`,
          name,
          src: `/assets/models/${file}`
        };
      });

    return NextResponse.json(models);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load models' }, { status: 500 });
  }
}
