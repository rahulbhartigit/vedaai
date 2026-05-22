import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  text: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  marks: number;
  type: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IResult extends Document {
  assignmentId: mongoose.Types.ObjectId;
  sections: ISection[];
  totalMarks: number;
  totalQuestions: number;
  subject: string;
  title: string;
  branch: string;
  schoolName: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'moderate', 'hard'], required: true },
  marks: { type: Number, required: true, min: 1 },
  type: { type: String, required: true },
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: { type: [QuestionSchema], required: true },
});

const ResultSchema = new Schema<IResult>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    sections: { type: [SectionSchema], required: true },
    totalMarks: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    subject: { type: String, required: true },
    title: { type: String, required: true },
    branch: { type: String, default: '' },
    schoolName: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Result = mongoose.model<IResult>('Result', ResultSchema);
