import { HelmetViewer } from '@/three/HelmetViewer';
import { newHelmetDesign } from '@/domain/helmet';
const d = newHelmetDesign();
const d2 = { ...newHelmetDesign('bell-kc7', 't-split'), chrome: false, spoiler: { enabled: true, color: '#e3262b' } };
export function HomePage() { return <div className="wrap page"><div className="grid g2"><div className="viewer-stage" style={{ height: 420 }}><HelmetViewer design={d} /></div><div className="viewer-stage" style={{ height: 420 }}><HelmetViewer design={d2} initialView="side" /></div></div></div>; }
