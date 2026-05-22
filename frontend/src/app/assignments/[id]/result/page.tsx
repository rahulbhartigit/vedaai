'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Result } from '@/lib/api';
import { wsManager } from '@/lib/websocket';
import { useAssignmentStore } from '@/store/assignmentStore';
import QuestionPaper from '@/components/QuestionPaper';

type PageStatus = 'loading' | 'processing' | 'done' | 'failed';

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addToast, fetchAssignments } = useAssignmentStore();

  const [status, setStatus] = useState<PageStatus>('loading');
  const [result, setResult] = useState<Result | null>(null);
  const [statusMsg, setStatusMsg] = useState('Loading your question paper…');
  const [regenerating, setRegenerating] = useState(false);

  const loadResult = useCallback(async () => {
    try {
      const { data } = await api.getResult(id);
      setResult(data);
      setStatus('done');
    } catch {
      // not ready yet
    }
  }, [id]);

  useEffect(() => {
    loadResult();
    wsManager.connect(id);

    const offProcessing = wsManager.on('job:processing', (data) => {
      setStatus('processing');
      setStatusMsg(String(data.message || 'AI is generating your question paper…'));
    });

    const offDone = wsManager.on('job:done', async () => {
      addToast('Question paper ready!', 'success');
      await fetchAssignments();
      await loadResult();
    });

    const offFailed = wsManager.on('job:failed', (data) => {
      setStatus('failed');
      setStatusMsg(String(data.message || 'Generation failed. Please try again.'));
      addToast('Generation failed', 'error');
    });

    const poll = setInterval(async () => {
      try {
        const { data: a } = await api.getAssignment(id);
        if (a.status === 'done' && !result) await loadResult();
        if (a.status === 'processing') setStatus('processing');
        if (a.status === 'failed') { setStatus('failed'); clearInterval(poll); }
      } catch { /* ignore */ }
    }, 5000);

    return () => {
      wsManager.disconnect();
      offProcessing(); offDone(); offFailed();
      clearInterval(poll);
    };
  }, [id, loadResult, addToast, fetchAssignments]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setResult(null);
    setStatus('processing');
    setStatusMsg('Regenerating question paper…');
    try {
      await api.regenerate(id);
      wsManager.connect(id);
      addToast('Regeneration started!', 'info');
    } catch {
      addToast('Failed to start regeneration', 'error');
      setStatus('failed');
    } finally {
      setRegenerating(false);
    }
  };

  if (status === 'done' && result) {
    return <QuestionPaper result={result} onRegenerate={handleRegenerate} regenerating={regenerating} />;
  }

  return (
    <div className="result-loading-wrap">
      <div className="processing-card">
        {status === 'failed' ? (
          <>
            <div style={{ fontSize: 48 }}>❌</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Generation Failed</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 320, textAlign: 'center' }}>{statusMsg}</div>
            <button className="btn-next" onClick={handleRegenerate}>Try Again</button>
          </>
        ) : (
          <>
            <div className="spinner" />
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {status === 'loading' ? 'Checking status…' : 'Generating Paper'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 320, textAlign: 'center' }}>{statusMsg}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Usually takes 15–30 seconds</div>
          </>
        )}
      </div>
    </div>
  );
}
