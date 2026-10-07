import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Document from '@/models/Document';
import ActivityLog from '@/models/ActivityLog';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    await dbConnect();

    const doc = await Document.findOne({ roomId }, { versions: 1 }).lean();
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ versions: doc.versions || [] });
  } catch (err) {
    console.error('API /api/documents/[roomId]/versions GET error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = body.title?.trim() || 'Manual Snapshot';

    await dbConnect();

    const doc = await Document.findOne({ roomId });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const newVersion = {
      versionId: `ver-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      contentState: doc.contentState || '',
      createdBy: authUser.name,
      createdAt: new Date(),
    };

    doc.versions.push(newVersion);
    await doc.save();

    await ActivityLog.create({
      roomId,
      actorName: authUser.name,
      actorEmail: authUser.email,
      action: 'RESTORED_VERSION',
      details: `Saved version snapshot "${title}"`,
    });

    return NextResponse.json({ version: newVersion }, { status: 201 });
  } catch (err) {
    console.error('API /api/documents/[roomId]/versions POST error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { versionId } = body;

    if (!versionId) {
      return NextResponse.json({ error: 'Version ID is required' }, { status: 400 });
    }

    await dbConnect();

    const doc = await Document.findOne({ roomId });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const version = doc.versions.find((v: any) => v.versionId === versionId);
    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    doc.contentState = version.contentState;
    await doc.save();

    await ActivityLog.create({
      roomId,
      actorName: authUser.name,
      actorEmail: authUser.email,
      action: 'RESTORED_VERSION',
      details: `Restored document to snapshot "${version.title}"`,
    });

    return NextResponse.json({ contentState: doc.contentState });
  } catch (err) {
    console.error('API /api/documents/[roomId]/versions PUT error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
