'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, QuestionType } from '@/lib/api';
import { useAssignmentStore } from '@/store/assignmentStore';

const QUESTION_TYPES = [
  'Multiple Choice Questions', 'Short Questions', 'Long Answer Questions',
  'Diagram/Graph-Based Questions', 'Numerical Problems', 'Fill in the Blanks',
  'True/False', 'Match the Following', 'Assertion & Reasoning', 'Case Study',
];

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { addToast, fetchAssignments } = useAssignmentStore();
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [branch, setBranch] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    { type: 'Multiple Choice Questions', count: 4, marks: 1 },
    { type: 'Short Questions', count: 3, marks: 2 },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const addQT = () =>
    setQuestionTypes((q) => [...q, { type: QUESTION_TYPES[0], count: 3, marks: 2 }]);

  const removeQT = (i: number) =>
    setQuestionTypes((q) => q.filter((_, idx) => idx !== i));

  const updateQTField = (i: number, field: keyof QuestionType, value: string | number) =>
    setQuestionTypes((q) => q.map((qt, idx) => (idx === i ? { ...qt, [field]: value } : qt)));

  const totalQs = questionTypes.reduce((s, q) => s + q.count, 0);
  const totalMarks = questionTypes.reduce((s, q) => s + q.count * q.marks, 0);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!subject.trim()) e.subject = 'Subject is required';
    if (!branch.trim()) e.branch = 'Branch / Class is required';
    if (!dueDate) e.dueDate = 'Due date is required';
    if (questionTypes.length === 0) e.qt = 'Add at least one question type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('subject', subject);
      formData.append('branch', branch);
      formData.append('dueDate', dueDate);
      formData.append('questionTypes', JSON.stringify(questionTypes));
      if (additionalInstructions) formData.append('additionalInstructions', additionalInstructions);
      if (file) formData.append('file', file);
      const { data } = await api.createAssignment(formData);
      await fetchAssignments();
      addToast('Assignment created! Generating question paper…', 'success');
      router.push(`/assignments/${data._id}/result`);
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to create', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-form-wrap">
      <div className="page-heading">
        <span className="page-heading-dot" />
        <h1 className="page-title">Create Assignment</h1>
      </div>
      <p className="page-subtitle">Set up a new assignment for your students</p>

      {/* Progress bar */}
      <div className="progress-bar-outer">
        <div className="progress-bar-inner" style={{ width: '45%' }} />
      </div>

      {/* Card */}
      <div className="form-card">
        <div className="form-card-title">Assignment Details</div>
        <div className="form-card-subtitle">Basic information about your assignment</div>

        {/* File Upload */}
        <div className="form-group">
          <div
            className={`file-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input ref={fileRef} type="file" accept=".pdf,.txt,.png,.jpg,.jpeg"
              style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
            <svg className="file-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {file ? (
              <>
                <div className="file-zone-title">✅ {file.name}</div>
                <div className="file-zone-sub">Click to replace</div>
              </>
            ) : (
              <>
                <div className="file-zone-title">Choose a file or drag & drop it here</div>
                <div className="file-zone-sub">JPEG, PNG, PDF upto 10MB</div>
                <span className="browse-btn">Browse Files</span>
              </>
            )}
          </div>
          <div className="file-hint">Upload images of your preferred document/image</div>
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label">Assignment Title *</label>
          <input className={`form-input ${errors.title ? 'error' : ''}`}
            placeholder="e.g. Mid-Term Examination" value={title}
            onChange={(e) => setTitle(e.target.value)} />
          {errors.title && <div className="form-error">{errors.title}</div>}
        </div>

        {/* Subject */}
        <div className="form-group">
          <label className="form-label">Subject *</label>
          <input className={`form-input ${errors.subject ? 'error' : ''}`}
            placeholder="e.g. Physics, Mathematics, English" value={subject}
            onChange={(e) => setSubject(e.target.value)} />
          {errors.subject && <div className="form-error">{errors.subject}</div>}
        </div>

        {/* Branch / Class */}
        <div className="form-group">
          <label className="form-label">Branch / Class *</label>
          <input className={`form-input ${errors.branch ? 'error' : ''}`}
            placeholder="e.g. 10th Grade, B.Tech CSE 2nd Year" value={branch}
            onChange={(e) => setBranch(e.target.value)} />
          {errors.branch && <div className="form-error">{errors.branch}</div>}
        </div>

        {/* Due Date */}
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <div className="date-input-wrap">
            <input type="date" className={`form-input ${errors.dueDate ? 'error' : ''}`}
              placeholder="DD-MM-YYYY" value={dueDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDueDate(e.target.value)} />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          {errors.dueDate && <div className="form-error">{errors.dueDate}</div>}
        </div>

        {/* Question Types */}
        <div className="form-group">
          <label className="form-label">Question Type</label>
          {errors.qt && <div className="form-error" style={{ marginBottom: 8 }}>{errors.qt}</div>}

          {questionTypes.map((qt, i) => (
            <div key={i}>
              {/* Type row */}
              <div className="qt-row">
                <select className="qt-select" value={qt.type}
                  onChange={(e) => updateQTField(i, 'type', e.target.value)}>
                  {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button className="qt-remove-btn" onClick={() => removeQT(i)}
                  disabled={questionTypes.length === 1} title="Remove">✕</button>
              </div>
              {/* Steppers */}
              <div className="qt-counters">
                <div className="qt-counter-group">
                  <div className="qt-counter-label">No. of Questions</div>
                  <div className="stepper">
                    <button className="stepper-btn" onClick={() => updateQTField(i, 'count', Math.max(1, qt.count - 1))} disabled={qt.count <= 1}>−</button>
                    <span className="stepper-val">{qt.count}</span>
                    <button className="stepper-btn" onClick={() => updateQTField(i, 'count', qt.count + 1)}>+</button>
                  </div>
                </div>
                <div className="qt-counter-group">
                  <div className="qt-counter-label">Marks</div>
                  <div className="stepper">
                    <button className="stepper-btn" onClick={() => updateQTField(i, 'marks', Math.max(1, qt.marks - 1))} disabled={qt.marks <= 1}>−</button>
                    <span className="stepper-val">{qt.marks}</span>
                    <button className="stepper-btn" onClick={() => updateQTField(i, 'marks', qt.marks + 1)}>+</button>
                  </div>
                </div>
              </div>
              {i < questionTypes.length - 1 && <div className="qt-section-divider" />}
            </div>
          ))}

          {/* Add type */}
          <button className="add-qt-btn" onClick={addQT}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Question Type
          </button>

          <div className="qt-totals">
            Total Questions : <b>{totalQs}</b> &nbsp;&nbsp; Total Marks : <b>{totalMarks}</b>
          </div>
        </div>

        {/* Additional Instructions */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Additional Information <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(For better output)</span></label>
          <div className="textarea-wrap">
            <textarea className="form-input form-textarea"
              placeholder="e.g Generate a question paper for 3 hour exam duration…"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              style={{ paddingRight: 40 }}
            />
            <button className="mic-btn" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="form-nav">
        <button className="btn-prev" onClick={() => router.back()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Previous
        </button>
        <button className="btn-next" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Creating…' : 'Next'}
          {!submitting && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>}
        </button>
      </div>
    </div>
  );
}
