(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3185],{6435:function(e,t,n){"use strict";n.d(t,{F:function(){return d},f:function(){return u}});var r=n(2265);let o=["light","dark"],a="(prefers-color-scheme: dark)",s="undefined"==typeof window,i=(0,r.createContext)(void 0),l={setTheme:e=>{},themes:[]},d=()=>{var e;return null!==(e=(0,r.useContext)(i))&&void 0!==e?e:l},u=e=>(0,r.useContext)(i)?r.createElement(r.Fragment,null,e.children):r.createElement(m,e),c=["light","dark"],m=({forcedTheme:e,disableTransitionOnChange:t=!1,enableSystem:n=!0,enableColorScheme:s=!0,storageKey:l="theme",themes:d=c,defaultTheme:u=n?"system":"light",attribute:m="data-theme",value:p,children:b,nonce:y})=>{let[_,x]=(0,r.useState)(()=>h(l,u)),[$,S]=(0,r.useState)(()=>h(l)),w=p?Object.values(p):d,k=(0,r.useCallback)(e=>{let r=e;if(!r)return;"system"===e&&n&&(r=v());let a=p?p[r]:r,i=t?g():null,l=document.documentElement;if("class"===m?(l.classList.remove(...w),a&&l.classList.add(a)):a?l.setAttribute(m,a):l.removeAttribute(m),s){let e=o.includes(u)?u:null,t=o.includes(r)?r:e;l.style.colorScheme=t}null==i||i()},[]),C=(0,r.useCallback)(e=>{x(e);try{localStorage.setItem(l,e)}catch(e){}},[e]),E=(0,r.useCallback)(t=>{let r=v(t);S(r),"system"===_&&n&&!e&&k("system")},[_,e]);(0,r.useEffect)(()=>{let e=window.matchMedia(a);return e.addListener(E),E(e),()=>e.removeListener(E)},[E]),(0,r.useEffect)(()=>{let e=e=>{e.key===l&&C(e.newValue||u)};return window.addEventListener("storage",e),()=>window.removeEventListener("storage",e)},[C]),(0,r.useEffect)(()=>{k(null!=e?e:_)},[e,_]);let T=(0,r.useMemo)(()=>({theme:_,setTheme:C,forcedTheme:e,resolvedTheme:"system"===_?$:_,themes:n?[...d,"system"]:d,systemTheme:n?$:void 0}),[_,C,e,$,n,d]);return r.createElement(i.Provider,{value:T},r.createElement(f,{forcedTheme:e,disableTransitionOnChange:t,enableSystem:n,enableColorScheme:s,storageKey:l,themes:d,defaultTheme:u,attribute:m,value:p,children:b,attrs:w,nonce:y}),b)},f=(0,r.memo)(({forcedTheme:e,storageKey:t,attribute:n,enableSystem:s,enableColorScheme:i,defaultTheme:l,value:d,attrs:u,nonce:c})=>{let m="system"===l,f="class"===n?`var d=document.documentElement,c=d.classList;c.remove(${u.map(e=>`'${e}'`).join(",")});`:`var d=document.documentElement,n='${n}',s='setAttribute';`,h=i?o.includes(l)&&l?`if(e==='light'||e==='dark'||!e)d.style.colorScheme=e||'${l}'`:"if(e==='light'||e==='dark')d.style.colorScheme=e":"",g=(e,t=!1,r=!0)=>{let a=d?d[e]:e,s=t?e+"|| ''":`'${a}'`,l="";return i&&r&&!t&&o.includes(e)&&(l+=`d.style.colorScheme = '${e}';`),"class"===n?l+=t||a?`c.add(${s})`:"null":a&&(l+=`d[s](n,${s})`),l},v=e?`!function(){${f}${g(e)}}()`:s?`!function(){try{${f}var e=localStorage.getItem('${t}');if('system'===e||(!e&&${m})){var t='${a}',m=window.matchMedia(t);if(m.media!==t||m.matches){${g("dark")}}else{${g("light")}}}else if(e){${d?`var x=${JSON.stringify(d)};`:""}${g(d?"x[e]":"e",!0)}}${m?"":"else{"+g(l,!1,!1)+"}"}${h}}catch(e){}}()`:`!function(){try{${f}var e=localStorage.getItem('${t}');if(e){${d?`var x=${JSON.stringify(d)};`:""}${g(d?"x[e]":"e",!0)}}else{${g(l,!1,!1)};}${h}}catch(t){}}();`;return r.createElement("script",{nonce:c,dangerouslySetInnerHTML:{__html:v}})},()=>!0),h=(e,t)=>{let n;if(!s){try{n=localStorage.getItem(e)||void 0}catch(e){}return n||t}},g=()=>{let e=document.createElement("style");return e.appendChild(document.createTextNode("*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}")),document.head.appendChild(e),()=>{window.getComputedStyle(document.body),setTimeout(()=>{document.head.removeChild(e)},1)}},v=e=>(e||(e=window.matchMedia(a)),e.matches?"dark":"light")},65559:function(e,t,n){Promise.resolve().then(n.t.bind(n,58877,23)),Promise.resolve().then(n.bind(n,78495)),Promise.resolve().then(n.bind(n,42761)),Promise.resolve().then(n.t.bind(n,6928,23)),Promise.resolve().then(n.t.bind(n,33195,23))},78495:function(e,t,n){"use strict";n.r(t),n.d(t,{Providers:function(){return d}});var r=n(57437);n(2265);var o=n(6435),a=n(99109),s=n(58001),i=n(7820),l=n(95482);function d(e){let{children:t,...n}=e;return(0,r.jsx)(o.f,{...n,children:(0,r.jsx)(a.zt,{value:i.Lp,children:(0,r.jsx)(l.pn,{children:(0,r.jsxs)(s.Ho,{children:[(0,r.jsx)(u,{}),t]})})})})}function u(){return(0,s.av)(),(0,r.jsx)(r.Fragment,{})}},42761:function(e,t,n){"use strict";n.r(t),n.d(t,{Toaster:function(){return s}});var r=n(57437),o=n(6435),a=n(71424);let s=e=>{let{...t}=e,{theme:n="system"}=(0,o.F)();return(0,r.jsx)(a.x,{theme:n,className:"toaster group",toastOptions:{classNames:{toast:"group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",description:"group-[.toast]:text-muted-foreground",actionButton:"group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",cancelButton:"group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"}},...t})}},95482:function(e,t,n){"use strict";n.d(t,{_v:function(){return u},aJ:function(){return d},pn:function(){return i},u:function(){return l}});var r=n(57437),o=n(2265),a=n(98567),s=n(39311);let i=a.zt,l=a.fC,d=a.xz,u=o.forwardRef((e,t)=>{let{className:n,sideOffset:o=4,...i}=e;return(0,r.jsx)(a.VY,{ref:t,sideOffset:o,className:(0,s.cn)("z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md animate-in fade-in-50 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",n),...i})});u.displayName=a.VY.displayName},58877:function(){},6928:function(e){e.exports={style:{fontFamily:"'__Inter_aaf875', '__Inter_Fallback_aaf875'",fontStyle:"normal"},className:"__className_aaf875",variable:"__variable_aaf875"}},33195:function(e){e.exports={style:{fontFamily:"'__JetBrains_Mono_2c91d1', '__JetBrains_Mono_Fallback_2c91d1'",fontStyle:"normal"},className:"__className_2c91d1",variable:"__variable_2c91d1"}},20966:function(e,t,n){"use strict";n.d(t,{M:function(){return l}});var r,o=n(2265),a=n(51030);let s=(r||(r=n.t(o,2)))["useId".toString()]||(()=>void 0),i=0;function l(e){let[t,n]=o.useState(s());return(0,a.b)(()=>{e||n(e=>null!=e?e:String(i++))},[e]),e||(t?`radix-${t}`:"")}}},function(e){e.O(0,[3529,4762,1424,3072,2699,7070,8567,7753,2445,2971,7864,1744],function(){return e(e.s=65559)}),_N_E=e.O()}]);