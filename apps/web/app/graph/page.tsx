import { GraphExplorer } from '../../components/graph-explorer';
import { NetworkTools } from '../../components/network-tools';
export default function GraphPage(){return <div className="content"><div className="page-header"><div><h2>Graf mreza</h2><p>Interaktivno istrazivanje podgrafa i ogranicenih profesionalnih putanja.</p></div></div><article className="card panel-body"><GraphExplorer/></article><div className="mt-5"><NetworkTools/></div></div>}
