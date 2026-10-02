import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Document from '@/models/Document';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const documents = await Document.find({ ownerId: currentUser.userId })
      .sort({ updatedAt: -1 })
      .select('title roomId ownerId createdAt updatedAt');

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = body.title || 'Untitled Document';
    const roomId = body.roomId || crypto.randomUUID().slice(0, 8);

    await connectDB();

    const newDoc = await Document.create({
      title,
      ownerId: currentUser.userId,
      roomId,
    });

    return NextResponse.json({ success: true, document: newDoc }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: error.message || 'Failed to create document' }, { status: 500 });
  }
}
