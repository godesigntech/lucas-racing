/* Admin helpers: settings drafts with a sticky save bar. */
import { useEffect, useState, type ReactNode } from 'react';
import type { Settings } from '@/core/types';
import { saveSettings, toast, useSettings } from '@/store';
import { Icon } from '@/ui';

/** Edit a slice of Settings locally, then save it back as a whole. */
export function useSettingsDraft<K extends keyof Settings>(key: K) {
  const settings = useSettings();
  const [draft, setDraftState] = useState<Settings[K]>(settings[key]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!dirty) setDraftState(settings[key]);
  }, [settings, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const setDraft = (v: Settings[K]) => { setDraftState(v); setDirty(true); };
  const save = async () => {
    setSaving(true);
    try {
      await saveSettings({ ...settings, [key]: draft });
      setDirty(false);
      toast('Settings saved. New prices apply to new quotes and checkouts.');
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setSaving(false);
    }
  };
  const discard = () => { setDraftState(settings[key]); setDirty(false); };
  return { settings, draft, setDraft, dirty, saving, save, discard };
}

export function SaveBar({ dirty, saving, onSave, onDiscard, children }: { dirty: boolean; saving: boolean; onSave: () => void; onDiscard: () => void; children?: ReactNode }) {
  return (
    <div className="wf-savebar" role="region" aria-label="Save changes">
      <span className="small">{dirty ? 'Unsaved changes' : children ?? 'All changes saved'}</span>
      <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
        <button className="btn btn-ghost btn-sm" onClick={onDiscard} disabled={!dirty || saving}>Discard</button>
        <button className="btn btn-primary btn-sm" onClick={onSave} disabled={!dirty || saving}><Icon name="check" />{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="wf-search">
      <Icon name="search" size={16} />
      <input className="input sm" type="search" placeholder={placeholder} aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export const PROPOSED_NOTE = 'Decision requires client confirmation';
