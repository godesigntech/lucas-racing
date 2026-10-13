/* 3D helmet builder: live viewer + five-step configuration panel. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Approval, HelmetDesign, HelmetJob } from '@/core/types';
import type { HelmetViewerApi } from '@/three/HelmetViewer';
import { clone } from '@/core/util';
import { designHash, isLocked, latestRevision, needsWatermark, newHelmetDesign, quoteHelmet } from '@/domain/helmet';
import { getDoc, toast, useAuth, useSettings } from '@/store';
import { Icon, Note } from '@/ui';
import { copyDesign, loadWip, saveDoc, storeWip, useJobs, useThrottled, type DesignDoc, type JobDoc } from './shared';
import { ViewerPanel } from './builder/ViewerPanel';
import { PriceSummary } from './builder/PriceSummary';
import { StepHelmet, helmetStepIssue } from './builder/StepHelmet';
import { StepDesign } from './builder/StepDesign';
import { StepMaterials } from './builder/StepMaterials';
import { StepDetails } from './builder/StepDetails';
import { ReviewStep } from './builder/ReviewStep';
import './helmet.css';

const STEPS = ['Helmet', 'Design', 'Materials', 'Details', 'Review'] as const;

export default function HelmetBuilderPage(_props: { builder?: boolean }) {
  const [params, setParams] = useSearchParams();
  const designParam = params.get('design');
  const jobParam = params.get('job');
  const { user } = useAuth();
  const settings = useSettings();
  const jobs = useJobs();

  const [design, setDesign] = useState<HelmetDesign>(() => (!designParam && !jobParam && loadWip()) || newHelmetDesign());
  const [loading, setLoading] = useState<boolean>(!!(designParam || jobParam));
  const [step, setStep] = useState(0);
  const [approval, setApproval] = useState<Approval | null>(null);
  const [job, setJob] = useState<HelmetJob | null>(null);
  const viewer = useRef<HelmetViewerApi>(null);
  const panelTop = useRef<HTMLDivElement>(null);
  const [headerH, setHeaderH] = useState(112);

  // The sticky viewer sits below the (sticky, variable-height) site header.
  useEffect(() => {
    const h = document.querySelector('.site-header');
    if (!h) return;
    const ro = new ResizeObserver(() => setHeaderH(Math.round(h.getBoundingClientRect().height)));
    ro.observe(h);
    return () => ro.disconnect();
  }, []);

  /* ---------- load ?design= / ?job= ---------- */
  useEffect(() => {
    if (!designParam || jobParam) return;
    if (design.id === designParam) { setLoading(false); return; }
    let alive = true;
    setLoading(true);
    getDoc<DesignDoc>('helmetDesigns', designParam).then((d) => {
      if (!alive) return;
      if (d) { setDesign(clone(d) as HelmetDesign); setApproval(null); }
      else toast('That saved design could not be found', 'warn');
      setLoading(false);
    }).catch(() => { if (alive) { setLoading(false); toast('Could not load the saved design', 'err'); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designParam, jobParam]);

  useEffect(() => {
    if (!jobParam) { setJob(null); return; }
    let alive = true;
    setLoading(true);
    getDoc<JobDoc>('jobs', jobParam).then((j) => {
      if (!alive) return;
      if (j) {
        setJob(j);
        setDesign(clone(latestRevision(j).design));
        setStep(4);
      } else toast('That job could not be found', 'warn');
      setLoading(false);
    }).catch(() => { if (alive) { setLoading(false); toast('Could not load the job', 'err'); } });
    return () => { alive = false; };
  }, [jobParam]);

  /* ---------- working-copy persistence (browser convenience) ---------- */
  useEffect(() => {
    if (job || loading) return;
    const t = window.setTimeout(() => storeWip(design), 400);
    return () => window.clearTimeout(t);
  }, [design, job, loading]);

  const hash = useMemo(() => designHash(design), [design]);
  const quote = useMemo(() => quoteHelmet(design, settings), [design, settings]);
  const unpaid = useMemo(() => needsWatermark(design, jobs), [design, jobs]);
  const viewDesign = useThrottled(design, 80);
  const issue = step === 0 ? helmetStepIssue(design) : null;

  const update = (d: HelmetDesign) => setDesign(d);
  const go = (n: number) => {
    if (n > step && helmetStepIssue(design)) { setStep(0); toast(helmetStepIssue(design)!, 'warn'); return; }
    setStep(Math.max(0, Math.min(STEPS.length - 1, n)));
    requestAnimationFrame(() => {
      const el = panelTop.current;
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const onSaved = (d: HelmetDesign) => {
    setDesign(d);
    if (!job) setParams({ design: d.id }, { replace: true });
  };
  const onDuplicate = async () => {
    const copy = copyDesign(design, `${design.name} (copy)`, user ? user.id : null);
    setApproval(null);
    if (user) {
      await saveDoc('helmetDesigns', copy);
      setDesign(copy);
      setParams({ design: copy.id }, { replace: true });
      toast('Duplicated and saved: you are now editing the copy');
    } else {
      setDesign(copy);
      if (designParam || jobParam) setParams({}, { replace: true });
      setJob(null);
      toast('Duplicated: you are now editing the copy');
    }
  };
  const startNew = () => {
    if (!window.confirm('Start a new helmet? Your current working design will be replaced (saved designs are not affected).')) return;
    setDesign(newHelmetDesign());
    setApproval(null);
    setJob(null);
    setStep(0);
    if (designParam || jobParam) setParams({}, { replace: true });
  };

  return (
    <div className="wrap page hb-page" style={{ '--hb-top': `${headerH}px` } as React.CSSProperties}>
      <div className="hb-head">
        <div>
          <div className="eyebrow lime">3D helmet builder</div>
          <h1 className="h2">{job ? `Revise ${job.ref}` : 'Design your race helmet'}</h1>
        </div>
        <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
          {user && <Link to="/saved" className="btn btn-ghost btn-sm"><Icon name="heart" />Saved designs</Link>}
          <button type="button" className="btn btn-ghost btn-sm" onClick={startNew}><Icon name="plus" />New helmet</button>
        </div>
      </div>

      {job && (
        <div className="hb-banner">
          <Icon name="layers" />
          <span className="grow">Editing a new revision for job <strong>{job.ref}</strong> · based on revision {latestRevision(job).no}{isLocked(job) ? ' · master locked' : ''}</span>
          <Link to="/orders" className="btn btn-ghost btn-xs">My orders</Link>
        </div>
      )}

      <div className="hb">
        <div className="hb-viewer">
          <ViewerPanel ref={viewer} design={viewDesign} kind={quote.kind} unpaid={unpaid} />
          {loading && <div className="hb-loading" role="status">Loading design…</div>}
        </div>

        <div className="hb-panel card" ref={panelTop}>
          <ol className="hb-steps" aria-label="Builder steps">
            {STEPS.map((s, i) => (
              <li key={s}>
                <button type="button" aria-current={i === step ? 'step' : undefined} className={i < step ? 'done' : ''} onClick={() => go(i)}>
                  <span className="n">{i < step ? <Icon name="check" size={12} /> : i + 1}</span>
                  <span className="t">{s}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="hb-body">
            {step === 0 && <StepHelmet design={design} onChange={update} />}
            {step === 1 && <StepDesign design={design} onChange={update} />}
            {step === 2 && <StepMaterials design={design} onChange={update} />}
            {step === 3 && <StepDetails design={design} onChange={update} />}
            {step === 4 && (
              <ReviewStep design={design} onChange={update} hash={hash} quote={quote} approval={approval} setApproval={setApproval}
                viewer={viewer} unpaid={unpaid} job={job} setJob={setJob} onSaved={onSaved} onDuplicate={onDuplicate} />
            )}
            {issue && <Note tone="err" className="hb-issue">{issue}</Note>}
          </div>

          <div className="hb-foot">
            <div className="hb-nav">
              <button type="button" className="btn btn-ghost" onClick={() => go(step - 1)} disabled={step === 0}><Icon name="back" />Back</button>
              <span className="tiny muted hb-stepno">Step {step + 1} of {STEPS.length}</span>
              {step < STEPS.length - 1
                ? <button type="button" className="btn btn-dark" onClick={() => go(step + 1)} disabled={!!issue}>Next: {STEPS[step + 1]}<Icon name="arrow" /></button>
                : <span style={{ width: 90 }} />}
            </div>
            <PriceSummary quote={quote} />
          </div>
        </div>
      </div>
    </div>
  );
}
