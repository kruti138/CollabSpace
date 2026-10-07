import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Document from '@/models/Document';
import ActivityLog from '@/models/ActivityLog';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const authUser = await getAuthUser(req);

    await dbConnect();

    const doc = await Document.findOne({ roomId }).lean();

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Determine User Role
    let userRole: 'OWNER' | 'EDITOR' | 'VIEWER' = 'VIEWER';

    if (authUser) {
      if (doc.ownerId.toString() === authUser.userId) {
        userRole = 'OWNER';
      } else {
        const collab = doc.collaborators?.find((c: any) => c.email.toLowerCase() === authUser.email.toLowerCase());
        if (collab) {
          userRole = collab.role;
        }
      }
    }

    return NextResponse.json({
      document: doc,
      userRole,
    });
  } catch (err) {
    console.error('API /api/documents/[roomId] GET error:', err);
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

    await dbConnect();

    const doc = await Document.findOne({ roomId });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check permissions (Owner or Editor can modify)
    const isOwner = doc.ownerId.toString() === authUser.userId;
    const collab = doc.collaborators?.find((c: any) => c.email.toLowerCase() === authUser.email.toLowerCase());

    if (!isOwner && (!collab || collab.role === 'VIEWER')) {
      return NextResponse.json({ error: 'Permission denied: Viewers cannot edit documents' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    let updated = false;

    if (typeof body.title === 'string' && body.title.trim() !== doc.title) {
      const oldTitle = doc.title;
      doc.title = body.title.trim();
      updated = true;

      await ActivityLog.create({
        roomId,
        actorName: authUser.name,
        actorEmail: authUser.email,
        action: 'RENAMED',
        details: `Renamed document from "${oldTitle}" to "${doc.title}"`,
      });
    }

    if (typeof body.contentState === 'string') {
      doc.contentState = body.contentState;
      updated = true;
    }

    if (typeof body.whiteboardState === 'string') {
      doc.whiteboardState = body.whiteboardState;
      updated = true;
    }

    if (updated) {
      await doc.save();
    }

    return NextResponse.json({ document: doc });
  } catch (err) {
    console.error('API /api/documents/[roomId] PUT error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const doc = await Document.findOne({ roomId });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Only OWNER can delete document
    if (doc.ownerId.toString() !== authUser.userId) {
      return NextResponse.json({ error: 'Forbidden: Only document owner can delete this document' }, { status: 403 });
    }

    await Document.deleteOne({ roomId });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    console.error('API /api/documents/[roomId] DELETE error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
