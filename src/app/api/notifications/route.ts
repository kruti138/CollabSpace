import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const notifications = await Notification.find({ recipientEmail: authUser.email.toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error('API /api/notifications GET error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { notificationId } = body;

    await dbConnect();

    if (notificationId) {
      await Notification.updateOne(
        { _id: notificationId, recipientEmail: authUser.email.toLowerCase() },
        { read: true }
      );
    } else {
      await Notification.updateMany({ recipientEmail: authUser.email.toLowerCase() }, { read: true });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API /api/notifications PATCH error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
