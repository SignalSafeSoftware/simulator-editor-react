import { useMemo, useState, useEffect } from 'react';
import SimulatorPhoneDevice from '@signalsafe/simulator-device/phone/SimulatorPhoneDevice';
import { fullDeviceToPayload } from '@signalsafe/simulator-react/adapters/deviceToSession';
import { getInitialSessionState } from '@signalsafe/simulator-react/state/simulatorSessionInitialState';
import { simulatorSessionReducer } from '@signalsafe/simulator-react/state/simulatorSessionReducer';
import type { SimulatorDispatchAction } from '@signalsafe/simulator-react/state/simulatorDispatchActions';
import type { SimulatorEditorPreviewContext, SimulatorEditorSectionValue } from '@signalsafe/simulator-editor-react/editorTypes';
import type { SimulatorDevicePayload, SimulatorEntryPoint } from '@signalsafe/simulator-core/devicePayload';
import { writeSimulatorConversation } from '@signalsafe/simulator-editor-react/simulatorConversationAdapter';
import { parseConversations } from '@signalsafe/simulator-editor-react/parseConversations';
import { validateDeviceJson } from '@signalsafe/simulator-core/validateDeviceJson';
export function Preview({sections,context}:{sections:readonly SimulatorEditorSectionValue[];context:SimulatorEditorPreviewContext}) {
 const result=useMemo(()=>{try{
  const doc:Record<string,unknown>=Object.fromEntries(sections.map(section=>[section.key,section.value]));
  const conversations=parseConversations(doc.messages);
  const selected=conversations.find(item=>item.id===context.navigation?.itemId)??conversations[0];
  if(selected){const {id,...edited}=selected;doc.messages=writeSimulatorConversation({threads:conversations.map(item=>({id:item.id,contact_name:item.contact_name,contact_number:item.contact_number,last_at:item.last_at})),thread_detail:{id}},edited);}
  else doc.messages={threads:[]};
  const nav=context.navigation;let entry:SimulatorEntryPoint|undefined;
  if(nav?.section==='messages.thread_detail')entry={app:'messages',screen:'thread_detail',...(nav.itemId?{target:{kind:'conversation',id:nav.itemId}}:{})};
  else if(nav?.section==='email.detail')entry={app:'email',screen:'detail',...(nav.itemId?{target:{kind:'email',id:nav.itemId}}:{})};
  else if(nav?.section==='contacts')entry={app:'phone',screen:'contacts',...(nav.itemId?{target:{kind:'contact',id:nav.itemId}}:{})};
  else if(nav?.section==='internet.page')entry={app:'internet',screen:nav.itemId??'welcome'};
  else if(nav?.section==='phone')entry={app:'phone',screen:'history'};
  else if(nav?.section==='messages')entry={app:'messages',screen:'threads'};
  else if(nav?.section==='email')entry={app:'email',screen:'list'};
  else if(nav?.section==='internet')entry={app:'internet',screen:'welcome'};
  if(entry)doc.entry_point=entry;
  validateDeviceJson(doc);return {ok:true as const,value:doc satisfies SimulatorDevicePayload};
 }catch(error){return {ok:false as const,error:error instanceof Error?error.message:"Repair the section JSON."};}
 },[sections,context.navigation]);
 return result.ok?<SessionPreview value={result.value} context={context}/>:<p role="alert">{result.error}</p>;
}
function SessionPreview({value,context}:{value:SimulatorDevicePayload;context:SimulatorEditorPreviewContext}){
 const payload=useMemo(()=>fullDeviceToPayload(value),[value]);
 const [state,setState]=useState(()=>getInitialSessionState(payload));
 const [contactId,setContactId]=useState<string>();
 useEffect(()=>{setState(getInitialSessionState(payload));setContactId(undefined);},[payload]);
 const dispatch=(action:SimulatorDispatchAction)=>setState(previous=>simulatorSessionReducer(previous,action));
 useEffect(()=>{
  const app=state.view.activeApp;
  const screen=app==='phone'?state.view.phone.screen:app==='email'?state.view.email.screen:app==='messages'?state.view.messages.screen:app==='internet'?state.view.internet.screen:state.view.home.screen;
  const target=app==='phone'&&screen==='contacts'&&contactId?{kind:'contact' as const,id:contactId}:value.entry_point?.app===app&&value.entry_point?.screen===screen?value.entry_point.target:undefined;
  context.onStartingPositionChange?.({app,screen,...(target?{target}:{})});
 },[state.view,contactId,context.onStartingPositionChange,value.entry_point]);
 return <div className="example-device"><SimulatorPhoneDevice state={state} dispatch={dispatch} onSelectedContactChange={setContactId}/></div>;
}
