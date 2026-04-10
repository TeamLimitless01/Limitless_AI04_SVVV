import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IInterview extends Document {
  mode?: string;
  difficulty?: string;
  skills?: string;
  details?: string;
  conversation?: any;
  user?: mongoose.Types.ObjectId;
  interviewTime?: number;
  resume?: string;
  candidateName?: string;
  report?: any;
  interviewLanguage?: string;
}

const InterviewSchema: Schema = new Schema({
  mode: { type: String, required: false },
  difficulty: { type: String, required: false },
  skills: { type: String, required: false },
  details: { type: String, required: false },
  conversation: { type: Schema.Types.Mixed, required: false },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  interviewTime: { type: Number, required: false },
  resume: { type: String, required: false },
  candidateName: { type: String, required: false },
  report: { type: Schema.Types.Mixed, required: false },
  interviewLanguage: { type: String, required: false },
}, { timestamps: true });

InterviewSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.documentId = ret._id.toString();
    ret.id = ret._id;
    return ret;
  }
});

export const Interview: Model<IInterview> = mongoose.models.Interview || mongoose.model<IInterview>('Interview', InterviewSchema);
