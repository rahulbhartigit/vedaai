'use client';
import { useRef } from 'react';
import { Result } from '@/lib/api';

interface Props { result: Result; onRegenerate: () => void; regenerating: boolean; }

const ASSERTION_INSTRUCTION = {
  isAssertion: true,
  intro: 'For each question, read both statements carefully and choose the correct option from (a) to (d).',
  options: [
    'Both Assertion (A) and Reason (R) are true, and Reason (R) is the correct explanation of Assertion (A).',
    'Both Assertion (A) and Reason (R) are true, but Reason (R) is not the correct explanation of Assertion (A).',
    'Assertion (A) is true, but Reason (R) is false.',
    'Assertion (A) is false, but Reason (R) is true.',
  ],
};

type Instruction = { isAssertion?: boolean; intro: string; options?: string[] };

function getTypeInstruction(type: string): Instruction {
  const t = type.toLowerCase().trim();
  // Explicit checks — ordered from most specific to least
  if (t.includes('assert'))           return ASSERTION_INSTRUCTION;
  if (t.includes('case study'))       return { intro: 'Read the case carefully before answering. Answers should be based on the information provided along with subject knowledge.' };
  if (t.includes('match'))            return { intro: 'Match the items correctly from Column A to Column B. Write answers in the format (e.g., A-1, B-2).' };
  if (t.includes('true') || t.includes('false')) return { intro: 'Write "True" or "False" clearly for each statement. No explanation is required unless mentioned.' };
  if (t.includes('fill'))             return { intro: 'Write the correct word/term in the blank space provided. Spelling mistakes may lead to loss of marks.' };
  if (t.includes('diagram') || t.includes('graph')) return { intro: 'Draw neat and properly labeled diagrams/graphs. Use a pencil and scale where required. Mention units and axes clearly in graphs.' };
  if (t.includes('numerical') || t.includes('problem')) return { intro: 'Show all calculation steps clearly. Write formulas before substitution. Final answers should include proper units.' };
  if (t.includes('long'))             return { intro: 'Provide detailed explanations with proper steps and reasoning. Support your answers with diagrams, examples, or derivations wherever applicable.' };
  if (t.includes('short'))            return { intro: 'Answer briefly and precisely. Include relevant formulas, definitions, or examples where necessary.' };
  if (t.includes('mcq') || t.includes('multiple choice') || t.includes('choice')) return { intro: 'Choose the most appropriate answer. Write only the correct option letter. No marks for multiple answers.' };
  return { intro: 'Attempt all questions carefully. Marks are indicated against each question.' };
}

export default function QuestionPaper({ result, onRegenerate, regenerating }: Props) {
  const paperRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!paperRef.current) return;
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    const canvas = await html2canvas(paperRef.current, { scale: 2, useCORS: true, backgroundColor: '#fff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    let y = 0;
    const pageH = pdf.internal.pageSize.getHeight();
    while (y < pdfH) {
      if (y > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -y, pdfW, pdfH);
      y += pageH;
    }
    pdf.save(`${result.title.replace(/\s+/g, '_')}.pdf`);
  };

  const branchLabel = result.branch || 'N/A';

  return (
    <div className="output-page">
      {/* ── Action banner ── */}
      <div className="output-banner">
        <div className="output-banner-text">
          Question paper generated for <strong>{result.subject}</strong> — {result.title}
          {result.branch && <> &nbsp;|&nbsp; <strong>{result.branch}</strong></>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn-regen" onClick={onRegenerate} disabled={regenerating}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            {regenerating ? 'Regenerating…' : 'Regenerate'}
          </button>
          <button className="btn-download-pdf" onClick={handleDownloadPDF}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download PDF
          </button>
        </div>
      </div>

      {/* ── A4 Paper ── */}
      <div className="paper-a4-wrap">
        <div className="paper-doc" ref={paperRef}>

          {/* School header */}
          <div className="paper-school">
            <div className="paper-school-name">{result.schoolName || 'School / Institution Name'}</div>
            <div className="paper-school-sub">
              Subject: {result.subject}&nbsp;|&nbsp;Branch / Class: {branchLabel}
            </div>
          </div>
          <hr className="paper-hr" />

          {/* Info row */}
          <div className="paper-info-row">
            <span>Time Allowed: 3 Hours</span>
            <span>Maximum Marks: {result.totalMarks}</span>
          </div>

          {/* Student fields */}
          <div className="paper-student-fields">
            <div className="paper-student-line">Name: <div className="paper-underline" /></div>
            <div className="paper-student-line">Roll Number: <div className="paper-underline" /></div>
            <div className="paper-student-line">
              Class / Branch: <div className="paper-underline" style={{ maxWidth: 200 }} />
              &nbsp;&nbsp;Date: <div className="paper-underline" style={{ maxWidth: 120 }} />
            </div>
          </div>
          <hr className="paper-hr" />

          {/* Sections */}
          {result.sections.map((section, si) => {
            const qType = section.questions[0]?.type || section.title;
            const qText  = section.questions[0]?.text || '';
            // Detect assertion from type OR question text content (AI sometimes tags as "mcq")
            const isAssertionSection =
              qType.toLowerCase().includes('assert') ||
              qText.toLowerCase().includes('assertion (a)') ||
              qText.toLowerCase().includes('assertion(a)');
            const instruction = isAssertionSection ? ASSERTION_INSTRUCTION : getTypeInstruction(qType);
            const totalQ = result.sections.slice(0, si).reduce((a, s) => a + s.questions.length, 0);

            // Don't repeat "Section X –" if the title already starts with "Section"
            const sectionLabel = /^section\s/i.test(section.title)
              ? section.title.toUpperCase()
              : `SECTION ${String.fromCharCode(65 + si)} – ${section.title.toUpperCase()}`;

            return (
              <div key={si} className="paper-section">
                <div className="paper-section-title">{sectionLabel}</div>

                <div className="paper-section-instr">
                  {instruction.isAssertion ? (
                    <div className="paper-assert-instr">
                      <div><strong>Assertion (A):</strong> A statement of fact or claim.</div>
                      <div><strong>Reason (R):</strong> A statement explaining or supporting the assertion.</div>
                      <div style={{ marginTop: 6 }}><em>{instruction.intro}</em></div>
                      <ol className="paper-instr-options" type="a">
                        {instruction.options!.map((opt, oi) => (
                          <li key={oi}>{opt}</li>
                        ))}
                      </ol>
                    </div>
                  ) : (
                    <em>{instruction.intro}</em>
                  )}
                  &nbsp;&nbsp;<strong>Each question carries {section.questions[0]?.marks} {section.questions[0]?.marks === 1 ? 'mark' : 'marks'}.</strong>
                </div>

                {section.questions.map((q, qi) => {
                  // Split "Assertion (A): ... Reason (R): ..." into two bold lines
                  const assertMatch = q.text.match(/Assertion\s*\(A\)\s*:\s*([\s\S]+?)\s+Reason\s*\(R\)\s*:\s*([\s\S]+)/i);
                  return (
                    <div key={qi} className="paper-question">
                      <span className="paper-q-num">Q{totalQ + qi + 1}.</span>
                      <span className="paper-q-body">
                        {assertMatch ? (
                          <span>
                            <strong>Assertion (A):</strong> {assertMatch[1].trim()}<br />
                            <strong>Reason (R):</strong> {assertMatch[2].replace(/\[\d+\s*marks?\]/i, '').trim()}
                          </span>
                        ) : (
                          q.text
                        )}
                        <span className="paper-q-meta"> [{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className="paper-end">— End of Question Paper —</div>
        </div>
      </div>
    </div>

  );
}

