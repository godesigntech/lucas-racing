/* /stickers and /stickers/build: Coming Soon in launch mode, the future-phase configurator otherwise. */
import { useMode } from '@/store';
import { ComingSoon } from './ComingSoon';
import { Configurator } from './Configurator';
import './kart.css';

export default function StickerKitsPage({ builder }: { builder?: boolean }) {
  const { mode } = useMode();
  if (mode === 'launch' && !builder) return <ComingSoon />;
  return <Configurator />;
}
