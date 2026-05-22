import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  branch: string;
  dueDate: Date;
  questionTypes: IQuestionType[];
  additionalInstructions?: string;
  fileUrl?: string;
  fileContent?: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  jobId?: string;
  errorMessage?: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionTypeSchema = new Schema<IQuestionType>({
  type: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  marks: { type: Number, required: true, min: 1 },
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    branch: { type: String, default: '', trim: true },
    dueDate: { type: Date, required: true },
    questionTypes: { type: [QuestionTypeSchema], required: true },
    additionalInstructions: { type: String, trim: true },
    fileUrl: { type: String },
    fileContent: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'done', 'failed'],
      default: 'pending',
    },
    jobId: { type: String },
    errorMessage: { type: String },
    userId: { type: String },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
