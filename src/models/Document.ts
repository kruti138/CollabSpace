import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDocument extends MongooseDocument {
  title: string;
  ownerId: mongoose.Types.ObjectId;
  roomId: string;
  contentState?: string; // Base64 encoded Yjs update
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, default: 'Untitled Document' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: String, required: true, unique: true, index: true },
    contentState: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
