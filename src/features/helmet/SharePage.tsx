/* View-only 360° preview of a shared helmet design. */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { HelmetDesign, ShareLink } from '@/core/types';
import { fmtDate } from '@/core/util';
import { modelById, modelLabel } from '@/data/helmets';
import { needsWatermark, quoteHelmet } from '@/domain/helmet';
import { getDoc, useSettings } from '@/store';
import type { Doc } from '@/store/backend';
import { Empty, Icon } from '@/ui';
import { copyDesign, storeWip, useJobs } from './shared';
import { ViewerPanel } from './builder/ViewerPanel';
import './helmet.css';

export default function SharePage(_props: { builder?: boolean }) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const settings = useSettings();
  const jobs = useJobs();
  const [link, setLink] = useState<ShareLink | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    setLink(undefined);
    getDoc<ShareLink & Doc>('shares', id).then((l) => alive && setLink(l)).catch(() => alive && setLink(null));
    return () => { alive = false; };
  }, [id]);

  const design = link && link.kind === 'helmet' ? (link.designSnapshot as HelmetDesign) : null;
  const unpaid = useMemo(() => (design ? needsWatermark(design, jobs) : true), [design, jobs]);
  const quote = useMemo(() => (design ? quoteHelmet(design, settings) : null), [design, settings]);

  if (link === undefined) return <div className="wrap page hb-page"><div className="muted">Loading shared design…</div></div>;
  if (!design || !quote) {
    return (
      <div className="wrap page hb-page">
        <Empty title="Shared design not found" action={<Link to="/helmet-builder" className="btn btn-primary"><Icon name="helmet" />Create your own</Link>}>
          {link && link.kind === 'kart'
            ? <>This link is for a kart sticker design. <Link className="btn-link" to={`/kart-share/${id}`}>Open it here</Link>.</>
            : 'The link may have been mistyped, or the preview was removed.'}
        </Empty>
      </div>
    );
  }

  const model = modelById(design.modelId);
  const startFrom = () => {
    storeWip(copyDesign(design, `${design.name} (from share)`, null));
    navigate('/helmet-builder');
  };

  return (
    <div className="wrap page hb-page">
      <div className="hb-head">
        <div>
          <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
            <span className="eyebrow lime">Shared helmet</span>
            <span className="badge dark"><Icon name="eye" size={12} />View only</span>
          </div>
          <h1 className="h2">{design.name}</h1>
          <p className="small muted" style={{ marginTop: 4 }}>{modelLabel(model)} · shared {fmtDate(link!.createdAt)}</p>
        </div>
        <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
          <button type="button" className="btn btn-ghost" onClick={startFrom}><Icon name="copy" />Start from this design</button>
          <Link to="/helmet-builder" className="btn btn-primary"><Icon name="helmet" />Create your own</Link>
        </div>
      </div>
      <ViewerPanel design={design} kind={quote.kind} unpaid={unpaid} defaultAutoRotate
        textureWatermark={unpaid ? 'LUCAS RACING · PREVIEW' : null} className="share-stage" />
      <p className="tiny muted" style={{ marginTop: 10 }}>
        Concept preview on placeholder geometry: colours, films and shapes are approximate. {unpaid ? 'Watermarked because this version is not a paid production master.' : ''}
      </p>
    </div>
  );
}
