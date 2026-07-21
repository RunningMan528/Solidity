import { NextRequest, NextResponse } from 'next/server';

const IPFS_PATH_PATTERN = /^[A-Za-z0-9._/-]+$/;

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path');

  if (!path || !IPFS_PATH_PATTERN.test(path) || path.includes('..')) {
    return NextResponse.json({ error: 'Invalid IPFS path' }, { status: 400 });
  }

  const gateway = (process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/').replace(/\/$/, '');

  try {
    const response = await fetch(`${gateway}/${path}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Unable to load IPFS metadata' },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json(), {
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    });
  } catch {
    return NextResponse.json({ error: 'IPFS gateway request failed' }, { status: 502 });
  }
}