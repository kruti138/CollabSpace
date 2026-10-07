import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export type CollaboratorRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface ICollaborator {
  userId?: mongoose.Types.ObjectId;
  email: string;
  role: CollaboratorRole;
  addedAt: Date;
}

export interface IDocumentVersion {
  versionId: string;
  title: string;
  contentState: string;
  createdBy: string;
  createdAt: Date;
}

export interface IDocument extends MongooseDocument {
  title: string;
  ownerId: mongoose.Types.ObjectId;
  roomId: string;
  contentState?: string; // Base64 encoded Yjs update for Tiptap
  whiteboardState?: string; // JSON string for tldraw canvas
  collaborators: ICollaborator[];
  versions: IDocumentVersion[];
  createdAt: Date;
  updatedAt: Date;
}

const CollaboratorSchema = new Schema<ICollaborator>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['OWNER', 'EDITOR', 'VIEWER'], default: 'EDITOR' },
  addedAt: { type: Date, default: Date.now },
});

const DocumentVersionSchema = new Schema<IDocumentVersion>({
  versionId: { type: String, required: true },
  title: { type: String, required: true },
  contentState: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const DocumentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, default: 'Untitled Document' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: String, required: true, unique: true, index: true },
    contentState: { type: String, default: '' },
    whiteboardState: { type: String, default: '' },
    collaborators: [CollaboratorSchema],
    versions: [DocumentVersionSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
