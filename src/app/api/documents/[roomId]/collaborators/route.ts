import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Document from '@/models/Document';
import User from '@/models/User';
import Notification from '@/models/Notification';
import ActivityLog from '@/models/ActivityLog';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email = body.email?.toLowerCase()?.trim();
    const role = (body.role || 'EDITOR') as 'EDITOR' | 'VIEWER';

    if (!email) {
      return NextResponse.json({ error: 'Collaborator email is required' }, { status: 400 });
    }

    await dbConnect();

    const doc = await Document.findOne({ roomId });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Only OWNER can add collaborators
    if (doc.ownerId.toString() !== authUser.userId) {
      return NextResponse.json({ error: 'Forbidden: Only the owner can invite collaborators' }, { status: 403 });
    }

    // Check if collaborator already exists
    const existing = doc.collaborators.find((c: any) => c.email.toLowerCase() === email);
    if (existing) {
      return NextResponse.json({ error: 'User is already a collaborator on this document' }, { status: 400 });
    }

    // Find User by email (optional: attach userId if registered)
    const targetUser = await User.findOne({ email });

    doc.collaborators.push({
      userId: targetUser ? targetUser._id : undefined,
      email,
      role,
      addedAt: new Date(),
    });

    await doc.save();

    // Create Notification for invited user
    await Notification.create({
      recipientEmail: email,
      senderName: authUser.name,
      documentTitle: doc.title,
      roomId,
      type: 'COLLABORATOR_ADDED',
      message: `${authUser.name} added you as a ${role.toLowerCase()} on "${doc.title}"`,
    });

    // Log Activity
    await ActivityLog.create({
      roomId,
      actorName: authUser.name,
      actorEmail: authUser.email,
      action: 'COLLABORATOR_ADDED',
      details: `Added ${email} as ${role.toLowerCase()}`,
    });

    return NextResponse.json({ collaborators: doc.collaborators }, { status: 201 });
  } catch (err) {
    console.error('API /api/documents/[roomId]/collaborators POST error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email = body.email?.toLowerCase()?.trim();
    const newRole = body.role as 'EDITOR' | 'VIEWER';

    if (!email || !newRole) {
      return NextResponse.json({ error: 'Email and new role are required' }, { status: 400 });
    }

    await dbConnect();

    const doc = await Document.findOne({ roomId });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.ownerId.toString() !== authUser.userId) {
      return NextResponse.json({ error: 'Forbidden: Only owner can change collaborator roles' }, { status: 403 });
    }

    const collab = doc.collaborators.find((c: any) => c.email.toLowerCase() === email);
    if (!collab) {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 });
    }

    if (collab.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 });
    }

    collab.role = newRole;
    await doc.save();

    await Notification.create({
      recipientEmail: email,
      senderName: authUser.name,
      documentTitle: doc.title,
      roomId,
      type: 'ROLE_CHANGED',
      message: `${authUser.name} changed your permission to ${newRole.toLowerCase()} on "${doc.title}"`,
    });

    await ActivityLog.create({
      roomId,
      actorName: authUser.name,
      actorEmail: authUser.email,
      action: 'ROLE_CHANGED',
      details: `Changed ${email} role to ${newRole.toLowerCase()}`,
    });

    return NextResponse.json({ collaborators: doc.collaborators });
  } catch (err) {
    console.error('API /api/documents/[roomId]/collaborators PATCH error:', err);
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

    const body = await req.json().catch(() => ({}));
    const email = body.email?.toLowerCase()?.trim();

    if (!email) {
      return NextResponse.json({ error: 'Collaborator email required' }, { status: 400 });
    }

    await dbConnect();

    const doc = await Document.findOne({ roomId });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.ownerId.toString() !== authUser.userId) {
      return NextResponse.json({ error: 'Forbidden: Only owner can remove collaborators' }, { status: 403 });
    }

    doc.collaborators = doc.collaborators.filter((c: any) => c.email.toLowerCase() !== email);
    await doc.save();

    await ActivityLog.create({
      roomId,
      actorName: authUser.name,
      actorEmail: authUser.email,
      action: 'COLLABORATOR_REMOVED',
      details: `Removed ${email} from document collaborators`,
    });

    return NextResponse.json({ collaborators: doc.collaborators });
  } catch (err) {
    console.error('API /api/documents/[roomId]/collaborators DELETE error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
