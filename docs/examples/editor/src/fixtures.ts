import type { SimulatorEditorSectionValue } from '@signalsafe/simulator-editor-react/editorTypes';
export function exampleSections(): SimulatorEditorSectionValue[] {
 return [
  {key:'entry_point',label:'Starting screen',value:{app:'home',screen:'home'}},
  {key:'messages',label:'Messages',value:[{id:'conversation-alex',contact_name:'Alex Example',contact_number:'+12025550110',last_at:'2026-11-11T12:00:00Z',messages:[{id:'message-alex',from:'them',text:'The team review is tomorrow at 10. Please bring the draft.',timestamp:'2026-11-11T12:00:00Z'}]},{id:'conversation-sam',contact_name:'Sam Example',contact_number:'+12025550111',last_at:'2026-11-11T13:00:00Z',messages:[{id:'message-sam',from:'them',text:'Let us verify the sender before opening that link.',timestamp:'2026-11-11T13:00:00Z'}]}]},
  {key:'email',label:'Email',value:{folders:[{id:'inbox',name:'Inbox'},{id:'projects',name:'Projects'}],messages:[{id:'mail-example',folder_id:'inbox',subject:'Fictional review invitation',from:'Alex Example',from_addr:'alex@example.test',to:'learner@example.test',body:'This example stays in your browser. No real email is sent.',date_at:'2026-11-11T12:00:00Z'}]}},
  {key:'contacts',label:'Contacts',value:[{id:'alex',display_name:'Alex Example',number:'+12025550110',email:'alex@example.test'},{id:'sam',display_name:'Sam Example',number:'+12025550111',email:'sam@example.test'}]},
  {key:'phone',label:'Phone',value:{calls:[{id:'call-example',type:'received',name:'Alex Example',number:'+12025550110',timestamp:'2026-11-11T12:00:00Z',duration_seconds:42}]}},
  {key:'internet',label:'Browser pages',value:{pages:[{id:'welcome',title:'Example project',url:'https://example.test/welcome',layout:'landing',content:'A fictional project page, rendered inside the simulator sandbox.'}]}},
  {key:'home',label:'Home',value:{home:{widgets:[]}}},
 ];
}
