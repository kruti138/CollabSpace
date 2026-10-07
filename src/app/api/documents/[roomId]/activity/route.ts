import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ActivityLog from '@/models/ActivityLog';

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    await dbConnect();

    const logs = await ActivityLog.find({ roomId }).sort({ createdAt: -1 }).limit(50).lean();

    return NextResponse.json({ logs });
  } catch (err) {
    console.error('API /api/documents/[roomId]/activity GET error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
