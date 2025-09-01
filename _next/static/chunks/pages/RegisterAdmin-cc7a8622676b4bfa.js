(self.webpackChunkhost=self.webpackChunkhost||[]).push([[756],{5529:function(e,r,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/RegisterAdmin",function(){return n(5981)}])},2422:function(e,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"createAsyncLocalStorage",{enumerable:!0,get:function(){return createAsyncLocalStorage}});let n=Error("Invariant: AsyncLocalStorage accessed in runtime where it is not available");let FakeAsyncLocalStorage=class FakeAsyncLocalStorage{disable(){throw n}getStore(){}run(){throw n}exit(){throw n}enterWith(){throw n}};let l=globalThis.AsyncLocalStorage;function createAsyncLocalStorage(){return l?new l:new FakeAsyncLocalStorage}("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),e.exports=r.default)},8427:function(e,r,n){"use strict";function clientHookInServerComponentError(e){}Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"clientHookInServerComponentError",{enumerable:!0,get:function(){return clientHookInServerComponentError}}),n(8754),n(3027),("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),e.exports=r.default)},636:function(e,r,n){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),function(e,r){for(var n in r)Object.defineProperty(e,n,{enumerable:!0,get:r[n]})}(r,{ReadonlyURLSearchParams:function(){return ReadonlyURLSearchParams},useSearchParams:function(){return useSearchParams},usePathname:function(){return usePathname},ServerInsertedHTMLContext:function(){return g.ServerInsertedHTMLContext},useServerInsertedHTML:function(){return g.useServerInsertedHTML},useRouter:function(){return useRouter},useParams:function(){return useParams},useSelectedLayoutSegments:function(){return useSelectedLayoutSegments},useSelectedLayoutSegment:function(){return useSelectedLayoutSegment},redirect:function(){return y.redirect},permanentRedirect:function(){return y.permanentRedirect},RedirectType:function(){return y.RedirectType},notFound:function(){return h.notFound}});let l=n(3027),d=n(9031),c=n(1593),f=n(8427),m=n(6160),g=n(252),y=n(7866),h=n(9363),b=Symbol("internal for urlsearchparams readonly");function readonlyURLSearchParamsError(){return Error("ReadonlyURLSearchParams cannot be modified")}let ReadonlyURLSearchParams=class ReadonlyURLSearchParams{[Symbol.iterator](){return this[b][Symbol.iterator]()}append(){throw readonlyURLSearchParamsError()}delete(){throw readonlyURLSearchParamsError()}set(){throw readonlyURLSearchParamsError()}sort(){throw readonlyURLSearchParamsError()}constructor(e){this[b]=e,this.entries=e.entries.bind(e),this.forEach=e.forEach.bind(e),this.get=e.get.bind(e),this.getAll=e.getAll.bind(e),this.has=e.has.bind(e),this.keys=e.keys.bind(e),this.values=e.values.bind(e),this.toString=e.toString.bind(e),this.size=e.size}};function useSearchParams(){(0,f.clientHookInServerComponentError)("useSearchParams");let e=(0,l.useContext)(c.SearchParamsContext),r=(0,l.useMemo)(()=>e?new ReadonlyURLSearchParams(e):null,[e]);return r}function usePathname(){return(0,f.clientHookInServerComponentError)("usePathname"),(0,l.useContext)(c.PathnameContext)}function useRouter(){(0,f.clientHookInServerComponentError)("useRouter");let e=(0,l.useContext)(d.AppRouterContext);if(null===e)throw Error("invariant expected app router to be mounted");return e}function useParams(){(0,f.clientHookInServerComponentError)("useParams");let e=(0,l.useContext)(d.GlobalLayoutRouterContext),r=(0,l.useContext)(c.PathParamsContext);return(0,l.useMemo)(()=>(null==e?void 0:e.tree)?function getSelectedParams(e,r){void 0===r&&(r={});let n=e[1];for(let e of Object.values(n)){let n=e[0],l=Array.isArray(n),d=l?n[1]:n;if(!d||d.startsWith("__PAGE__"))continue;let c=l&&("c"===n[2]||"oc"===n[2]);c?r[n[0]]=n[1].split("/"):l&&(r[n[0]]=n[1]),r=getSelectedParams(e,r)}return r}(e.tree):r,[null==e?void 0:e.tree,r])}function useSelectedLayoutSegments(e){void 0===e&&(e="children"),(0,f.clientHookInServerComponentError)("useSelectedLayoutSegments");let{tree:r}=(0,l.useContext)(d.LayoutRouterContext);return function getSelectedLayoutSegmentPath(e,r,n,l){let d;if(void 0===n&&(n=!0),void 0===l&&(l=[]),n)d=e[1][r];else{var c;let r=e[1];d=null!=(c=r.children)?c:Object.values(r)[0]}if(!d)return l;let f=d[0],g=(0,m.getSegmentValue)(f);return!g||g.startsWith("__PAGE__")?l:(l.push(g),getSelectedLayoutSegmentPath(d,r,!1,l))}(r,e)}function useSelectedLayoutSegment(e){void 0===e&&(e="children"),(0,f.clientHookInServerComponentError)("useSelectedLayoutSegment");let r=useSelectedLayoutSegments(e);return 0===r.length?null:r[0]}("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),e.exports=r.default)},9363:function(e,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),function(e,r){for(var n in r)Object.defineProperty(e,n,{enumerable:!0,get:r[n]})}(r,{notFound:function(){return notFound},isNotFoundError:function(){return isNotFoundError}});let n="NEXT_NOT_FOUND";function notFound(){let e=Error(n);throw e.digest=n,e}function isNotFoundError(e){return(null==e?void 0:e.digest)===n}("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),e.exports=r.default)},7866:function(e,r,n){"use strict";var l,d;Object.defineProperty(r,"__esModule",{value:!0}),function(e,r){for(var n in r)Object.defineProperty(e,n,{enumerable:!0,get:r[n]})}(r,{RedirectType:function(){return l},getRedirectError:function(){return getRedirectError},redirect:function(){return redirect},permanentRedirect:function(){return permanentRedirect},isRedirectError:function(){return isRedirectError},getURLFromRedirectError:function(){return getURLFromRedirectError},getRedirectTypeFromError:function(){return getRedirectTypeFromError}});let c=n(3743),f="NEXT_REDIRECT";function getRedirectError(e,r,n){void 0===n&&(n=!1);let l=Error(f);l.digest=f+";"+r+";"+e+";"+n;let d=c.requestAsyncStorage.getStore();return d&&(l.mutableCookies=d.mutableCookies),l}function redirect(e,r){throw void 0===r&&(r="replace"),getRedirectError(e,r,!1)}function permanentRedirect(e,r){throw void 0===r&&(r="replace"),getRedirectError(e,r,!0)}function isRedirectError(e){if("string"!=typeof(null==e?void 0:e.digest))return!1;let[r,n,l,d]=e.digest.split(";",4);return r===f&&("replace"===n||"push"===n)&&"string"==typeof l&&("true"===d||"false"===d)}function getURLFromRedirectError(e){return isRedirectError(e)?e.digest.split(";",3)[2]:null}function getRedirectTypeFromError(e){if(!isRedirectError(e))throw Error("Not a redirect error");return e.digest.split(";",3)[1]}(d=l||(l={})).push="push",d.replace="replace",("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),e.exports=r.default)},3743:function(e,r,n){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"requestAsyncStorage",{enumerable:!0,get:function(){return d}});let l=n(2422),d=(0,l.createAsyncLocalStorage)();("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),e.exports=r.default)},6160:function(e,r){"use strict";function getSegmentValue(e){return Array.isArray(e)?e[1]:e}Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"getSegmentValue",{enumerable:!0,get:function(){return getSegmentValue}}),("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),e.exports=r.default)},252:function(e,r,n){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),function(e,r){for(var n in r)Object.defineProperty(e,n,{enumerable:!0,get:r[n]})}(r,{ServerInsertedHTMLContext:function(){return c},useServerInsertedHTML:function(){return useServerInsertedHTML}});let l=n(1757),d=l._(n(3027)),c=d.default.createContext(null);function useServerInsertedHTML(e){let r=(0,d.useContext)(c);r&&r(e)}},5981:function(e,r,n){"use strict";n.r(r),n.d(r,{default:function(){return RegisterAdmin}});var l=n(2807),d=n(3027),c=n(9332),f=n(6501);function RegisterAdmin(){let e=(0,c.useRouter)(),[r,n]=(0,d.useState)(""),[m,g]=(0,d.useState)(""),[y,h]=(0,d.useState)(""),[b,v]=(0,d.useState)(!1),handleApiError=e=>{if(!e.success)switch(console.error("API Error:",e),e.error){case"BAD_REQUEST":return e.message||"Invalid input provided";case"ALREADY_EXISTS":return e.message||"Admin with this email already exists";case"UNAUTHORIZED":return"Unauthorized access";case"DATA_NOT_FOUND":return"Resource not found";case"CONFLICT":return e.message||"Please try again";case"FORBIDDEN":return"Access denied";case"MONGO_EXCEPTION":return console.error("MongoDB Error Details:",e.details),"Database error occurred";case"DB_ERROR":return e.message||"Database error occurred";default:return"An unexpected error occurred"}return""},handleRegister=async l=>{if(l.preventDefault(),!r.trim()||!m.trim()||!y.trim()){f.ZP.error("All fields are required");return}v(!0);try{let l=await fetch("http://192.168.18.37:3000/users/api/v1/create-admin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:r,email:m,password:y})}),d=await l.json();if(!l.ok||!d.success){let e=handleApiError(d);throw Error(e||"Failed to register admin")}if(d.success&&1===d.type)f.ZP.success("Admin registered successfully"),n(""),g(""),h(""),e.push("/login");else throw Error("Invalid response format")}catch(r){let e=r instanceof Error?r.message:"Failed to register admin";f.ZP.error(e)}finally{v(!1)}};return(0,l.jsx)("div",{className:"min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900",children:(0,l.jsxs)("div",{className:"flex w-full h-screen animate-fade-in",children:[(0,l.jsxs)("div",{className:"w-1/2 bg-gradient-to-br from-gray-800 to-gray-900 text-white p-16 flex flex-col justify-center items-center",children:[(0,l.jsx)("div",{className:"text-5xl font-bold text-orange-500 mb-6",children:"\uD83C\uDF7D️ Rasant"}),(0,l.jsx)("p",{className:"text-gray-300 text-lg text-center max-w-md leading-relaxed",children:"Create your Rasant Admin Account and take control of your restaurant management with ease. Join us to streamline operations and enhance your business efficiency."})]}),(0,l.jsxs)("div",{className:"w-1/2 bg-white dark:bg-gray-800 p-16 flex flex-col justify-center",children:[(0,l.jsx)("h2",{className:"text-3xl font-semibold text-gray-800 dark:text-white mb-8 text-center",children:"Create Admin Account"}),(0,l.jsxs)("form",{onSubmit:handleRegister,className:"space-y-6 max-w-md mx-auto",children:[(0,l.jsx)("input",{type:"text",value:r,onChange:e=>n(e.target.value),placeholder:"Name",className:"w-full p-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 text-lg",required:!0}),(0,l.jsx)("input",{type:"email",value:m,onChange:e=>g(e.target.value),placeholder:"Email",className:"w-full p-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 text-lg",required:!0}),(0,l.jsx)("input",{type:"password",value:y,onChange:e=>h(e.target.value),placeholder:"Password",className:"w-full p-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 text-lg",required:!0}),(0,l.jsx)("button",{type:"submit",disabled:b,className:"w-full bg-orange-500 text-white p-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 text-lg font-medium",children:b?"Registering...":"Register"})]})]})]})})}},9332:function(e,r,n){e.exports=n(636)},6501:function(e,r,n){"use strict";let l,d;n.d(r,{ZP:function(){return Z}});var c,f=n(3027);let m={data:""},t=e=>"object"==typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||m,g=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,y=/\/\*[^]*?\*\/|  +/g,h=/\n+/g,o=(e,r)=>{let n="",l="",d="";for(let c in e){let f=e[c];"@"==c[0]?"i"==c[1]?n=c+" "+f+";":l+="f"==c[1]?o(f,c):c+"{"+o(f,"k"==c[1]?"":r)+"}":"object"==typeof f?l+=o(f,r?r.replace(/([^,])+/g,e=>c.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,r=>/&/.test(r)?r.replace(/&/g,e):e?e+" "+r:r)):c):null!=f&&(c=/^--/.test(c)?c:c.replace(/[A-Z]/g,"-$&").toLowerCase(),d+=o.p?o.p(c,f):c+":"+f+";")}return n+(r&&d?r+"{"+d+"}":d)+l},b={},s=e=>{if("object"==typeof e){let r="";for(let n in e)r+=n+s(e[n]);return r}return e},i=(e,r,n,l,d)=>{var c;let f=s(e),m=b[f]||(b[f]=(e=>{let r=0,n=11;for(;r<e.length;)n=101*n+e.charCodeAt(r++)>>>0;return"go"+n})(f));if(!b[m]){let r=f!==e?e:(e=>{let r,n,l=[{}];for(;r=g.exec(e.replace(y,""));)r[4]?l.shift():r[3]?(n=r[3].replace(h," ").trim(),l.unshift(l[0][n]=l[0][n]||{})):l[0][r[1]]=r[2].replace(h," ").trim();return l[0]})(e);b[m]=o(d?{["@keyframes "+m]:r}:r,n?"":"."+m)}let v=n&&b.g?b.g:null;return n&&(b.g=b[m]),c=b[m],v?r.data=r.data.replace(v,c):-1===r.data.indexOf(c)&&(r.data=l?c+r.data:r.data+c),m},p=(e,r,n)=>e.reduce((e,l,d)=>{let c=r[d];if(c&&c.call){let e=c(n),r=e&&e.props&&e.props.className||/^go/.test(e)&&e;c=r?"."+r:e&&"object"==typeof e?e.props?"":o(e,""):!1===e?"":e}return e+l+(null==c?"":c)},"");function u(e){let r=this||{},n=e.call?e(r.p):e;return i(n.unshift?n.raw?p(n,[].slice.call(arguments,1),r.p):n.reduce((e,n)=>Object.assign(e,n&&n.call?n(r.p):n),{}):n,t(r.target),r.g,r.o,r.k)}u.bind({g:1});let v,_,S,E=u.bind({k:1});function goober_modern_j(e,r){let n=this||{};return function(){let l=arguments;function a(d,c){let f=Object.assign({},d),m=f.className||a.className;n.p=Object.assign({theme:_&&_()},f),n.o=/ *go\d+/.test(m),f.className=u.apply(n,l)+(m?" "+m:""),r&&(f.ref=c);let g=e;return e[0]&&(g=f.as||e,delete f.as),S&&g[0]&&S(f),v(g,f)}return r?r(a):a}}var W=e=>"function"==typeof e,dist_f=(e,r)=>W(e)?e(r):e,w=(l=0,()=>(++l).toString()),A=()=>{if(void 0===d&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");d=!e||e.matches}return d},U=(e,r)=>{switch(r.type){case 0:return{...e,toasts:[r.toast,...e.toasts].slice(0,20)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===r.toast.id?{...e,...r.toast}:e)};case 2:let{toast:n}=r;return U(e,{type:e.toasts.find(e=>e.id===n.id)?1:0,toast:n});case 3:let{toastId:l}=r;return{...e,toasts:e.toasts.map(e=>e.id===l||void 0===l?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===r.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==r.toastId)};case 5:return{...e,pausedAt:r.time};case 6:let d=r.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+d}))}}},j=[],R={toasts:[],pausedAt:void 0},dist_u=e=>{R=U(R,e),j.forEach(e=>{e(R)})},J=(e,r="blank",n)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:r,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...n,id:(null==n?void 0:n.id)||w()}),x=e=>(r,n)=>{let l=J(r,e,n);return dist_u({type:2,toast:l}),l.id},dist_c=(e,r)=>x("blank")(e,r);dist_c.error=x("error"),dist_c.success=x("success"),dist_c.loading=x("loading"),dist_c.custom=x("custom"),dist_c.dismiss=e=>{dist_u({type:3,toastId:e})},dist_c.remove=e=>dist_u({type:4,toastId:e}),dist_c.promise=(e,r,n)=>{let l=dist_c.loading(r.loading,{...n,...null==n?void 0:n.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let d=r.success?dist_f(r.success,e):void 0;return d?dist_c.success(d,{id:l,...n,...null==n?void 0:n.success}):dist_c.dismiss(l),e}).catch(e=>{let d=r.error?dist_f(r.error,e):void 0;d?dist_c.error(d,{id:l,...n,...null==n?void 0:n.error}):dist_c.dismiss(l)}),e};var P=E`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,O=E`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,C=E`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,k=goober_modern_j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${P} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${O} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${C} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,L=E`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,N=goober_modern_j("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${L} 1s linear infinite;
`,I=E`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,F=E`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,T=goober_modern_j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${I} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${F} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,D=goober_modern_j("div")`
  position: absolute;
`,H=goober_modern_j("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,$=E`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,z=goober_modern_j("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${$} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,M=({toast:e})=>{let{icon:r,type:n,iconTheme:l}=e;return void 0!==r?"string"==typeof r?f.createElement(z,null,r):r:"blank"===n?null:f.createElement(H,null,f.createElement(N,{...l}),"loading"!==n&&f.createElement(D,null,"error"===n?f.createElement(k,{...l}):f.createElement(T,{...l})))},ye=e=>`
0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,ge=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}
`,q=goober_modern_j("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,X=goober_modern_j("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Ae=(e,r)=>{let n=e.includes("top")?1:-1,[l,d]=A()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[ye(n),ge(n)];return{animation:r?`${E(l)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${E(d)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};f.memo(({toast:e,position:r,style:n,children:l})=>{let d=e.height?Ae(e.position||r||"top-center",e.visible):{opacity:0},c=f.createElement(M,{toast:e}),m=f.createElement(X,{...e.ariaProps},dist_f(e.message,e));return f.createElement(q,{className:e.className,style:{...d,...n,...e.style}},"function"==typeof l?l({icon:c,message:m}):f.createElement(f.Fragment,null,c,m))}),c=f.createElement,o.p=void 0,v=c,_=void 0,S=void 0,u`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;var Z=dist_c}},function(e){e.getEagerSharedForChunkId&&e.getEagerSharedForChunkId(756,e.initConsumes),e.getEagerRemotesForChunkId&&e.getEagerRemotesForChunkId(756,e.initRemotes),e.O(0,[888,179],function(){return e.own_remote.then(function(){return Promise.all([Promise.all(e.initRemotes),Promise.all(e.initConsumes)])}).then(function(){return e(e.s=5529)})}),_N_E=e.O()}]);