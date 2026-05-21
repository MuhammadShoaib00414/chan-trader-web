import{j as e}from"./app-CfBv3AY-.js";import{c as a}from"./createLucideIcon-RLkft33t.js";import{_ as c}from"./app-layout-x9yQLvcm.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],t=a("CircleCheck",o);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]],n=a("CircleX",l);function u({toasts:r,onDismiss:i}){return r.length?e.jsx("div",{className:"pointer-events-none fixed right-4 top-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3",children:r.map(s=>e.jsx("div",{className:"pointer-events-auto",children:e.jsxs("div",{className:["relative overflow-hidden rounded-xl border shadow-lg","bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60","transition",s.variant==="success"?"border-emerald-200/70":"border-rose-200/70"].join(" "),role:"status","aria-live":"polite",children:[e.jsxs("div",{className:"flex items-start gap-3 px-4 py-3",children:[e.jsx("div",{className:"mt-0.5",children:s.variant==="success"?e.jsx(t,{className:"size-5 text-emerald-600"}):e.jsx(n,{className:"size-5 text-rose-600"})}),e.jsx("div",{className:"min-w-0 flex-1",children:e.jsx("div",{className:"truncate text-sm font-medium text-foreground",children:s.title})}),e.jsx("button",{type:"button",onClick:()=>i(s.id),className:"rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground","aria-label":"Dismiss notification",children:e.jsx(c,{className:"size-4"})})]}),e.jsx("div",{className:["h-1 w-full",s.variant==="success"?"bg-emerald-100":"bg-rose-100"].join(" "),children:e.jsx("div",{className:["h-full",s.variant==="success"?"bg-emerald-500/70":"bg-rose-500/70","origin-left animate-[toast-progress_2500ms_linear_forwards]"].join(" ")})})]})},s.id))}):null}export{u as T};
