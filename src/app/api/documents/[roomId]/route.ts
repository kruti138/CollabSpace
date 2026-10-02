import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Document from '@/models/Document';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    await connectDB();

    let doc = await Document.findOne({ roomId });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document: doc });
  } catch (error: any) {
    console.error('Error fetching document by roomId:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch document' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await req.json();

    await connectDB();

    const updateFields: Record<string, any> = {};
    if (typeof body.title === 'string') updateFields.title = body.title;
    if (typeof body.contentState === 'string') updateFields.contentState = body.contentState;

    const doc = await Document.findOneAndUpdate(
      { roomId },
      { $set: updateFields },
      { new: true, upsert: false }
    );

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: error.message || 'Failed to update document' }, { status: 500 });
  }
}
