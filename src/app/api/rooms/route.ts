import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const assetsDir = path.join(process.cwd(), 'public', 'assets', 'rooms');
    const files = fs.readdirSync(assetsDir);
    
    const rooms = files
      .filter(file => /\.(avif|png|jpg|jpeg|webp)$/i.test(file))
      .map((file, index) => {
        const name = file
          .replace(/\.(avif|png|jpg|jpeg|webp)$/i, '')
          .split(/[-_]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
        return {
          id: `room-${index}`,
          name,
          src: `/assets/rooms/${file}`
        };
      });

    return NextResponse.json(rooms);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load rooms' }, { status: 500 });
  }
}
