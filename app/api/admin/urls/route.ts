import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const getFilePath = () => path.join(process.cwd(), 'data', 'mall_urls.json');

export async function GET() {
  try {
    const filePath = getFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json({});
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { mallId, url } = await request.json();
    const filePath = getFilePath();
    
    let urls: Record<string, string> = {};
    if (fs.existsSync(filePath)) {
      urls = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    
    urls[mallId] = url;
    fs.writeFileSync(filePath, JSON.stringify(urls, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
