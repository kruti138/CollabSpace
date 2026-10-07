import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export type NotificationType = 'COLLABORATOR_ADDED' | 'ROLE_CHANGED' | 'DOCUMENT_SHARED';

export interface INotification extends MongooseDocument {
  recipientEmail: string;
  senderName: string;
  documentTitle: string;
  roomId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientEmail: { type: String, required: true, lowercase: true, index: true },
    senderName: { type: String, required: true },
    documentTitle: { type: String, required: true },
    roomId: { type: String, required: true },
    type: { type: String, enum: ['COLLABORATOR_ADDED', 'ROLE_CHANGED', 'DOCUMENT_SHARED'], required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
