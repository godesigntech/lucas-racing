/* The signed-in customer's saved helmet designs (plus links to kart sticker designs). */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { HelmetDesign, KartDesign } from '@/core/types';
import { fmtDate } from '@/core/util';
import { modelById, modelLabel } from '@/data/helmets';
import { quoteHelmet } from '@/domain/helmet';
import { removeDoc, toast, useAuth, useMine, useSettings } from '@/store';
import type { Doc } from '@/store/backend';
import { Empty, Icon, Modal, PageHead } from '@/ui';
import { copyDesign, copyText, createHelmetShare, saveDoc, shareUrl, type DesignDoc } from './shared';
import { useHelmetThumb } from './thumbs';
import './helmet.css';

function DesignCard({ d, onShare }: { d: HelmetDesign; onShare: (d: HelmetDesign) => void }) {
  const settings = useSettings();
  const thumb = useHelmetThumb(d, 240);
  const [name, setName] = useState(d.name);
  const q = quoteHelmet(d, settings);
  const rename = async () => {
    const n = name.trim();
    if (!n || n === d.name) { setName(d.name); return; }
    await saveDoc('helmetDesigns', { ...d, name: n });
    toast('Renamed');
  };
  const duplicate = async () => {
    await saveDoc('helmetDesigns', copyDesign(d, `${d.name} (copy)`, d.ownerId));
    toast('Design duplicated');
  };
  const del = async () => {
    if (!window.confirm(`Delete "${d.name}"? This can't be undone. Orders and quotes already placed are not affected.`)) return;
    await removeDoc('helmetDesigns', d.id);
    toast('Design deleted');
  };
  return (
    <article className="card saved-card">
      <Link to={`/helmet-builder?design=${d.id}`} className="saved-thumb" aria-label={`Open ${d.name}`}>
        <img src={thumb} alt="" width={240} height={197} />
        <span className={'hb-kind ' + (q.kind === 'standard' ? 'std' : 'quote')}>{q.kind === 'standard' ? 'Standard' : 'Quote'}</span>
      </Link>
      <div className="saved-body stack" style={{ '--gap': '8px' } as React.CSSProperties}>
        <input className="input sm saved-name" value={name} aria-label="Design name" onChange={(e) => setName(e.target.value)} onBlur={rename}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setName(d.name); e.currentTarget.blur(); } }} />
        <div className="tiny muted">{modelLabel(modelById(d.modelId))} · updated {fmtDate(d.updatedAt)}</div>
        <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
          <Link to={`/helmet-builder?design=${d.id}`} className="btn btn-dark btn-xs"><Icon name="pencil" size={13} />Open</Link>
          <button type="button" className="btn btn-ghost btn-xs" onClick={duplicate}><Icon name="copy" size={13} />Duplicate</button>
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => onShare(d)}><Icon name="share" size={13} />Share</button>
          <button type="button" className="btn btn-danger btn-xs" onClick={del} aria-label={`Delete ${d.name}`}><Icon name="trash" size={13} /></button>
        </div>
      </div>
    </article>
  );
}

export default function SavedDesignsPage(_props: { builder?: boolean }) {
  const { user } = useAuth();
  const { items, loading } = useMine<DesignDoc>('helmetDesigns');
  const { items: karts } = useMine<KartDesign & Doc>('kartDesigns');
  const [share, setShare] = useState<{ name: string; url: string } | null>(null);

  if (!user) {
    return (
      <div className="wrap page hb-page">
        <PageHead eyebrow="Saved designs" title="Your saved designs" />
        <Empty title="Sign in to save designs" action={<div className="row" style={{ justifyContent: 'center' }}><Link to="/account" className="btn btn-primary"><Icon name="user" />Sign in or create an account</Link><Link to="/helmet-builder" className="btn btn-ghost">Open the builder</Link></div>}>
          Saving designs needs an account. You can still build, share and check out as a guest.
        </Empty>
      </div>
    );
  }

  const mine = items.filter((d) => d.ownerId === user.id);
  const myKarts = karts.filter((k) => k.ownerId === user.id);
  const doShare = async (d: HelmetDesign) => {
    try {
      const id = await createHelmetShare(d);
      setShare({ name: d.name, url: shareUrl(id) });
    } catch (e) {
      toast('Could not create share link: ' + (e as Error).message, 'err');
    }
  };

  return (
    <div className="wrap page hb-page">
      <PageHead eyebrow="Saved designs" title="Your saved designs" actions={<Link to="/helmet-builder" className="btn btn-primary"><Icon name="plus" />New helmet</Link>}>
        Reopen, rename, duplicate or share your helmets. Saving keeps a design; ordering always uses the exact version you approve.
      </PageHead>

      <section className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <h2 className="h3">Helmet designs <span className="muted" style={{ fontWeight: 600 }}>· {mine.length}</span></h2>
        {loading && !mine.length ? <div className="muted">Loading…</div>
          : mine.length ? <div className="saved-grid">{mine.map((d) => <DesignCard key={d.id + d.updatedAt} d={d} onShare={doShare} />)}</div>
          : <Empty title="No saved helmets yet" action={<Link to="/helmet-builder" className="btn btn-dark">Open the helmet builder</Link>}>Design a helmet and press "Save design" on the Review step.</Empty>}
      </section>

      <section className="stack" style={{ '--gap': '12px', marginTop: 40 } as React.CSSProperties}>
        <h2 className="h3">Kart sticker designs <span className="muted" style={{ fontWeight: 600 }}>· {myKarts.length}</span></h2>
        {myKarts.length ? (
          <ul className="kart-list">
            {myKarts.map((k) => (
              <li key={k.id}>
                <span className="grow"><strong>{k.name}</strong><span className="tiny muted" style={{ display: 'block' }}>Updated {fmtDate(k.updatedAt)}</span></span>
                <Link to={`/stickers/build?design=${k.id}`} className="btn btn-ghost btn-xs">Open<Icon name="arrow" size={13} /></Link>
              </li>
            ))}
          </ul>
        ) : <p className="small muted">No saved kart sticker designs. <Link to="/stickers" className="btn-link">Browse sticker kits</Link></p>}
      </section>

      <Modal open={!!share} onClose={() => setShare(null)} title={`Share "${share?.name ?? ''}"`}>
        {share && (
          <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
            <p className="small muted">Anyone with this link can view a watermarked 360° preview. They can't edit your design.</p>
            <div className="share-box">
              <input className="input sm" readOnly value={share.url} aria-label="Share link" onFocus={(e) => e.currentTarget.select()} />
              <button type="button" className="btn btn-primary btn-sm" onClick={async () => toast((await copyText(share.url)) ? 'Link copied' : 'Copy failed: select and copy manually')}><Icon name="copy" />Copy</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
