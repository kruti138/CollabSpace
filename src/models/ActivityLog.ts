import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export type ActionType =
  | 'CREATED'
  | 'RENAMED'
  | 'COLLABORATOR_ADDED'
  | 'COLLABORATOR_REMOVED'
  | 'ROLE_CHANGED'
  | 'RESTORED_VERSION'
  | 'WHITEBOARD_UPDATED';

export interface IActivityLog extends MongooseDocument {
  roomId: string;
  actorName: string;
  actorEmail: string;
  action: ActionType;
  details: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    roomId: { type: String, required: true, index: true },
    actorName: { type: String, required: true },
    actorEmail: { type: String, required: true },
    action: {
      type: String,
      enum: [
        'CREATED',
        'RENAMED',
        'COLLABORATOR_ADDED',
        'COLLABORATOR_REMOVED',
        'ROLE_CHANGED',
        'RESTORED_VERSION',
        'WHITEBOARD_UPDATED',
      ],
      required: true,
    },
    details: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
