import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SimulatorEditor } from '@signalsafe/simulator-editor-react/SimulatorEditor';
import type { SimulatorEditorSection } from '@signalsafe/simulator-editor-react/editorTypes';
import { exampleSections } from './fixtures';
import { Preview } from './Preview';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@signalsafe/simulator-editor-react/styles.css';
import '@signalsafe/simulator-theme-bootstrap/styles.css';
import './page.css';
function Example() {
 const [sections,setSections]=useState(exampleSections);
 const [revision,setRevision]=useState(0);
 const [valid,setValid]=useState(true);
 const [name,setName]=useState('Example simulator');
 const [view,setView]=useState<'properties'|'simulator'|'json'>('simulator');
 const update=(key:SimulatorEditorSection,value:unknown)=>setSections(previous=>previous.map(section=>section.key===key?{...section,value}:section));
 return <><header className="example-header"><a className="example-brand" href="https://signalsafesoftware.github.io/simulator-editor-react/">SignalSafe · Simulator editor</a><nav aria-label="Package links"><a href="https://github.com/SignalSafeSoftware/simulator-editor-react">Repository</a><a href="https://github.com/SignalSafeSoftware/simulator-editor-react/tree/main/docs/examples/editor">Example source</a><a href="https://signalsafesoftware.github.io/simulator-device/">Device demo</a></nav></header><main><section className="example-intro"><p className="example-eyebrow">REUSABLE AUTHORING COMPONENTS</p><h1>Shape a simulated device.</h1><p>Edit messages, email, contacts, calls and browser pages. Inspect section JSON and choose a starting page. The preview uses the shared simulator packages.</p><p className="example-note">Synthetic data only. Changes stay in this tab; nothing is saved or sent. This demo uses published npm packages.</p><button className="btn btn-outline-secondary" onClick={()=>{setName('Example simulator');setView('simulator');setSections(exampleSections());setRevision(value=>value+1);}}>Reset example</button><button className="btn btn-outline-primary" disabled={!valid} onClick={()=>{const blob=new Blob([JSON.stringify(sections,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='simulator-editor-sections.json';anchor.click();URL.revokeObjectURL(url);}}>Download section data</button><output aria-label="Example validation">{valid?'Ready to edit':'Complete the highlighted fields'}</output></section><SimulatorEditor properties={<label className="form-label d-block">Simulator name<input className="form-control" value={name} onChange={event=>setName(event.target.value)}/></label>} view={view} onViewChange={setView} key={revision} sections={sections} onChange={update} onValidityChange={setValid} renderPreview={context=><Preview sections={sections} context={context}/>}/><section className="example-related"><h2>Build with the shared packages</h2><p>The editor owns authoring controls. The host owns the document, preview adapter, persistence and permissions.</p><ul>{['simulator-core','simulator-react','simulator-device','simulator-theme-bootstrap'].map(name=><li key={name}><a href={'https://github.com/SignalSafeSoftware/'+name}>{name}</a></li>)}</ul><p><a href="https://github.com/SignalSafeSoftware/simulator-editor-react/blob/main/README.md">Integration guide</a> · <a href="https://github.com/SignalSafeSoftware/simulator-editor-react/issues">Report an issue</a></p></section></main><footer>SignalSafe simulator editor · MIT licensed · Fictional examples</footer></>;
}
const root=document.getElementById('root');if(!root)throw new Error('Example root missing');createRoot(root).render(<Example/>);
