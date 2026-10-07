import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Document from '@/models/Document';
import ActivityLog from '@/models/ActivityLog';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim() || '';
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'mine' | 'shared'

    let mongoQuery: any = {};

    if (filter === 'mine') {
      mongoQuery = { ownerId: authUser.userId };
    } else if (filter === 'shared') {
      mongoQuery = {
        ownerId: { $ne: authUser.userId },
        'collaborators.email': authUser.email.toLowerCase(),
      };
    } else {
      mongoQuery = {
        $or: [{ ownerId: authUser.userId }, { 'collaborators.email': authUser.email.toLowerCase() }],
      };
    }

    if (query) {
      mongoQuery.title = { $regex: query, $options: 'i' };
    }

    const documents = await Document.find(mongoQuery).sort({ updatedAt: -1 }).lean();

    return NextResponse.json({ documents });
  } catch (err) {
    console.error('API /api/documents GET error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = body.title?.trim() || 'Untitled Document';

    await dbConnect();

    // Generate clean room ID
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newDoc = await Document.create({
      title,
      ownerId: authUser.userId,
      roomId,
      collaborators: [
        {
          userId: authUser.userId,
          email: authUser.email.toLowerCase(),
          role: 'OWNER',
          addedAt: new Date(),
        },
      ],
      versions: [
        {
          versionId: `ver-init-${Date.now()}`,
          title: 'Initial Creation',
          contentState: '',
          createdBy: authUser.name,
          createdAt: new Date(),
        },
      ],
    });

    // Log Activity
    await ActivityLog.create({
      roomId,
      actorName: authUser.name,
      actorEmail: authUser.email,
      action: 'CREATED',
      details: `Created document "${title}"`,
    });

    return NextResponse.json({ document: newDoc }, { status: 201 });
  } catch (err) {
    console.error('API /api/documents POST error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
