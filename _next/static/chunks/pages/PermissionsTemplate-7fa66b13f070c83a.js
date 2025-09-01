(self.webpackChunkhost=self.webpackChunkhost||[]).push([[216],{3454:function(e,r,n){"use strict";var l,d;e.exports=(null==(l=n.g.process)?void 0:l.env)&&"object"==typeof(null==(d=n.g.process)?void 0:d.env)?n.g.process:n(7663)},2944:function(e,r,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/PermissionsTemplate",function(){return n(1322)}])},1322:function(e,r,n){"use strict";n.r(r);var l=n(2807),d=n(3027),c=n(6249),m=n(6501),f=n(3454);let g=f.env.REACT_APP_API_BASE_URL||"http://192.168.18.37:3000";r.default=e=>{let{token:r,logout:n}=e,[f,h]=(0,d.useState)([]),[y,b]=(0,d.useState)([]),[v,w]=(0,d.useState)(null),[_,k]=(0,d.useState)([]),[j,N]=(0,d.useState)(""),[E,P]=(0,d.useState)(""),[T,C]=(0,d.useState)({fetch:!1,create:!1,delete:!1,update:!1}),[S,D]=(0,d.useState)(!1),[O,I]=(0,d.useState)(null);(0,d.useEffect)(()=>{r&&(fetchRoles(),fetchPermissions())},[r]);let handleApiError=e=>{if(!e.success)switch(e.error){case"DATA_NOT_FOUND":return"Not Found";case"BAD_REQUEST":return e.message||"Invalid input provided";case"ALREADY_EXISTS":return e.message||"Permission already exists";case"CONFLICT":return e.message||"Please try again";case"FORBIDDEN":return"Access Denied";case"UNAUTHORIZED":return n(),window.location.href="/pos-system/login","Please log in to continue";case"MONGO_EXCEPTION":return"Database error occurred";case"DB_CHECK_FAIL":return e.message||"Database error occurred";default:return"An unexpected error occurred"}return""},fetchRoles=async()=>{C(e=>({...e,fetch:!0}));try{let e=await fetch("".concat(g,"/rolepermission/api/v1/roles/list"),{headers:{Authorization:"Bearer ".concat(r)}}),l=await e.json();if(401===e.status){n(),window.location.href="/pos-system/login";return}if(!e.ok||!l.success)throw Error(handleApiError(l));h(l.data||[])}catch(e){m.ZP.error(e instanceof Error?e.message:"Failed to fetch roles")}finally{C(e=>({...e,fetch:!1}))}},fetchPermissions=async()=>{C(e=>({...e,fetch:!0}));try{let e=await fetch("".concat(g,"/rolepermission/api/v1/permissions/list"),{headers:{Authorization:"Bearer ".concat(r)}}),l=await e.json();if(401===e.status){n(),window.location.href="/pos-system/login";return}if(!e.ok||!l.success)throw Error(handleApiError(l));b(l.data||[])}catch(e){m.ZP.error(e instanceof Error?e.message:"Failed to fetch permissions")}finally{C(e=>({...e,fetch:!1}))}},handleCreatePermission=async()=>{if(!j.trim()){m.ZP.error("Permission key cannot be empty!");return}if(y.some(e=>e.key===j.trim())){m.ZP.error("Permission key already exists!");return}C(e=>({...e,create:!0}));try{let e=await fetch("".concat(g,"/rolepermission/api/v1/permissions/create"),{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer ".concat(r)},body:JSON.stringify({key:j.trim(),description:E.trim()||void 0})}),l=await e.json();if(401===e.status){n(),window.location.href="/pos-system/login";return}if(!e.ok||!l.success)throw Error(handleApiError(l));b([...y,l.data]),N(""),P(""),m.ZP.success("Permission created successfully!")}catch(e){m.ZP.error(e instanceof Error?e.message:"Failed to create permission")}finally{C(e=>({...e,create:!1}))}},handleDeletePermission=async e=>{C(e=>({...e,delete:!0}));try{let l=await fetch("".concat(g,"/rolepermission/api/v1/permissions/delete"),{method:"DELETE",headers:{"Content-Type":"application/json",Authorization:"Bearer ".concat(r)},body:JSON.stringify({permission_id:e})}),d=await l.json();if(401===l.status){n(),window.location.href="/pos-system/login";return}if(!l.ok||!d.success)throw Error(handleApiError(d));b(y.filter(r=>r._id!==e)),m.ZP.success("Permission removed successfully!")}catch(e){m.ZP.error(e instanceof Error?e.message:"Failed to delete permission")}finally{C(e=>({...e,delete:!1})),D(!1)}},handlePermissionToggle=(e,r)=>{k(n=>r?[...n,e]:n.filter(r=>r!==e))},handleUpdatePermissions=async e=>{if(!e){m.ZP.error("Please select a role first!");return}C(e=>({...e,update:!0}));try{let l=f.find(r=>r._id===e);if(!l)throw Error("Role not found");let d=l.permissions.map(e=>e._id),c=_.filter(e=>!d.includes(e)),h=d.filter(e=>!_.includes(e)),y=await fetch("".concat(g,"/rolepermission/api/v1/roles/update-permissions"),{method:"PUT",headers:{"Content-Type":"application/json",Authorization:"Bearer ".concat(r)},body:JSON.stringify({role_id:e,add_permission_ids:c,remove_permission_ids:h})}),b=await y.json();if(401===y.status){n(),window.location.href="/pos-system/login";return}if(!y.ok||!b.success)throw Error(handleApiError(b));m.ZP.success("Permissions updated successfully!"),w(null),k([]),await fetchRoles()}catch(e){m.ZP.error(e instanceof Error?e.message:"Failed to update permissions")}finally{C(e=>({...e,update:!1}))}},loadRolePermissions=e=>{let r=f.find(r=>r._id===e);k((null==r?void 0:r.permissions.map(e=>e._id))||[]),w(e)},openDeleteModal=e=>{I(e),D(!0)};return T.fetch?(0,l.jsx)("div",{className:"bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-700",children:(0,l.jsxs)("div",{className:"animate-pulse space-y-4",children:[(0,l.jsx)("div",{className:"h-6 bg-gray-200 dark:bg-gray-700 rounded-lg"}),[,,,].fill(0).map((e,r)=>(0,l.jsx)("div",{className:"h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"},r))]})}):(0,l.jsxs)("div",{className:"bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700",children:[(0,l.jsx)("h2",{className:"text-lg font-semibold text-gray-900 dark:text-white mb-4",children:"Manage Permissions"}),(0,l.jsxs)("div",{className:"space-y-6",children:[(0,l.jsxs)("div",{children:[(0,l.jsx)("h3",{className:"text-sm font-semibold text-gray-900 dark:text-white mb-2",children:"Create Permission"}),(0,l.jsx)("p",{className:"text-xs text-gray-500 dark:text-gray-400 mb-2",children:"Use format: resource_action (e.g., orders_can_view, orders_can_edit, orders_can_delete)"}),(0,l.jsxs)("div",{className:"flex flex-col sm:flex-row sm:space-x-3",children:[(0,l.jsxs)("div",{className:"flex-1",children:[(0,l.jsx)("label",{className:"block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1",children:"Permission Key"}),(0,l.jsx)("input",{type:"text",value:j,onChange:e=>N(e.target.value),className:"w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500",placeholder:"e.g., orders_can_view"})]}),(0,l.jsxs)("div",{className:"flex-1",children:[(0,l.jsx)("label",{className:"block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1",children:"Description"}),(0,l.jsx)("input",{type:"text",value:E,onChange:e=>P(e.target.value),className:"w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500",placeholder:"Enter permission description"})]}),(0,l.jsx)("div",{className:"mt-4 sm:mt-6 sm:self-end",children:(0,l.jsx)("button",{onClick:handleCreatePermission,className:"px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300",disabled:T.create,children:T.create?"Creating...":"Create Permission"})})]})]}),(0,l.jsxs)("div",{children:[(0,l.jsx)("h3",{className:"text-sm font-semibold text-gray-900 dark:text-white mb-2",children:"Existing Permissions"}),0===y.length?(0,l.jsx)("p",{className:"text-xs text-gray-500 dark:text-gray-400",children:"No permissions found"}):(0,l.jsx)("ul",{className:"space-y-2",children:y.map(e=>(0,l.jsxs)("li",{className:"flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 text-xs",children:[(0,l.jsxs)("div",{children:[(0,l.jsx)("span",{className:"font-semibold",children:e.key}),e.description&&(0,l.jsx)("p",{className:"text-gray-600 dark:text-gray-400 text-xs",children:e.description})]}),(0,l.jsx)("button",{onClick:()=>openDeleteModal(e._id),className:"text-red-600 hover:text-red-800 p-1 mt-2 sm:mt-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50",disabled:T.delete,children:(0,l.jsx)(c.Z,{className:"w-4 h-4"})})]},e._id))})]}),(0,l.jsxs)("div",{children:[(0,l.jsx)("h3",{className:"text-sm font-semibold text-gray-900 dark:text-white mb-2",children:"Assign Permissions to Roles"}),(0,l.jsxs)("div",{className:"space-y-4",children:[(0,l.jsxs)("div",{children:[(0,l.jsx)("label",{className:"block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1",children:"Select Role"}),(0,l.jsxs)("select",{value:v||"",onChange:e=>loadRolePermissions(e.target.value),className:"w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500",children:[(0,l.jsx)("option",{value:"",children:"Select a role"}),f.map(e=>(0,l.jsx)("option",{value:e._id,children:e.name},e._id))]})]}),v&&(0,l.jsxs)("div",{children:[(0,l.jsx)("h4",{className:"text-xs font-semibold text-gray-900 dark:text-white mb-2",children:"Permissions for Role"}),(0,l.jsx)("div",{className:"space-y-2 max-h-48 overflow-y-auto",children:y.map(e=>(0,l.jsxs)("div",{className:"flex items-center",children:[(0,l.jsx)("input",{type:"checkbox",checked:_.includes(e._id),onChange:r=>handlePermissionToggle(e._id,r.target.checked),className:"h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded",disabled:T.update}),(0,l.jsxs)("label",{className:"ml-2 text-xs text-gray-700 dark:text-gray-300",children:[e.key,e.description&&(0,l.jsxs)("span",{className:"text-gray-500 dark:text-gray-400",children:[" (",e.description,")"]})]})]},e._id))}),(0,l.jsx)("button",{onClick:()=>handleUpdatePermissions(v),className:"mt-4 px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300",disabled:T.update,children:T.update?"Updating...":"Update Permissions"})]})]})]})]}),S&&(0,l.jsx)("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",children:(0,l.jsxs)("div",{className:"bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-full max-w-sm",children:[(0,l.jsx)("h3",{className:"text-sm font-semibold text-gray-900 dark:text-white mb-2",children:"Confirm Deletion"}),(0,l.jsx)("p",{className:"text-xs text-gray-600 dark:text-gray-300 mb-4",children:"Are you sure you want to delete this permission? This action cannot be undone."}),(0,l.jsxs)("div",{className:"flex justify-end space-x-3",children:[(0,l.jsx)("button",{onClick:()=>{I(null),D(!1)},className:"px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700",children:"Cancel"}),(0,l.jsx)("button",{onClick:()=>{O&&handleDeletePermission(O)},className:"px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300",disabled:T.delete,children:T.delete?"Deleting...":"Delete"})]})]})})]})}},7663:function(e){!function(){var r={229:function(e){var r,n,l,d=e.exports={};function defaultSetTimout(){throw Error("setTimeout has not been defined")}function defaultClearTimeout(){throw Error("clearTimeout has not been defined")}function runTimeout(e){if(r===setTimeout)return setTimeout(e,0);if((r===defaultSetTimout||!r)&&setTimeout)return r=setTimeout,setTimeout(e,0);try{return r(e,0)}catch(n){try{return r.call(null,e,0)}catch(n){return r.call(this,e,0)}}}!function(){try{r="function"==typeof setTimeout?setTimeout:defaultSetTimout}catch(e){r=defaultSetTimout}try{n="function"==typeof clearTimeout?clearTimeout:defaultClearTimeout}catch(e){n=defaultClearTimeout}}();var c=[],m=!1,f=-1;function cleanUpNextTick(){m&&l&&(m=!1,l.length?c=l.concat(c):f=-1,c.length&&drainQueue())}function drainQueue(){if(!m){var e=runTimeout(cleanUpNextTick);m=!0;for(var r=c.length;r;){for(l=c,c=[];++f<r;)l&&l[f].run();f=-1,r=c.length}l=null,m=!1,function(e){if(n===clearTimeout)return clearTimeout(e);if((n===defaultClearTimeout||!n)&&clearTimeout)return n=clearTimeout,clearTimeout(e);try{n(e)}catch(r){try{return n.call(null,e)}catch(r){return n.call(this,e)}}}(e)}}function Item(e,r){this.fun=e,this.array=r}function noop(){}d.nextTick=function(e){var r=Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)r[n-1]=arguments[n];c.push(new Item(e,r)),1!==c.length||m||runTimeout(drainQueue)},Item.prototype.run=function(){this.fun.apply(null,this.array)},d.title="browser",d.browser=!0,d.env={},d.argv=[],d.version="",d.versions={},d.on=noop,d.addListener=noop,d.once=noop,d.off=noop,d.removeListener=noop,d.removeAllListeners=noop,d.emit=noop,d.prependListener=noop,d.prependOnceListener=noop,d.listeners=function(e){return[]},d.binding=function(e){throw Error("process.binding is not supported")},d.cwd=function(){return"/"},d.chdir=function(e){throw Error("process.chdir is not supported")},d.umask=function(){return 0}}},n={};function __nccwpck_require__(e){var l=n[e];if(void 0!==l)return l.exports;var d=n[e]={exports:{}},c=!0;try{r[e](d,d.exports,__nccwpck_require__),c=!1}finally{c&&delete n[e]}return d.exports}__nccwpck_require__.ab="//";var l=__nccwpck_require__(229);e.exports=l}()},6249:function(e,r,n){"use strict";var l=n(3027);let d=l.forwardRef(function({title:e,titleId:r,...n},d){return l.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:d,"aria-labelledby":r},n),e?l.createElement("title",{id:r},e):null,l.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"}))});r.Z=d},6501:function(e,r,n){"use strict";let l,d;n.d(r,{ZP:function(){return H}});var c,m=n(3027);let f={data:""},t=e=>"object"==typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||f,g=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,h=/\/\*[^]*?\*\/|  +/g,y=/\n+/g,o=(e,r)=>{let n="",l="",d="";for(let c in e){let m=e[c];"@"==c[0]?"i"==c[1]?n=c+" "+m+";":l+="f"==c[1]?o(m,c):c+"{"+o(m,"k"==c[1]?"":r)+"}":"object"==typeof m?l+=o(m,r?r.replace(/([^,])+/g,e=>c.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,r=>/&/.test(r)?r.replace(/&/g,e):e?e+" "+r:r)):c):null!=m&&(c=/^--/.test(c)?c:c.replace(/[A-Z]/g,"-$&").toLowerCase(),d+=o.p?o.p(c,m):c+":"+m+";")}return n+(r&&d?r+"{"+d+"}":d)+l},b={},s=e=>{if("object"==typeof e){let r="";for(let n in e)r+=n+s(e[n]);return r}return e},i=(e,r,n,l,d)=>{var c;let m=s(e),f=b[m]||(b[m]=(e=>{let r=0,n=11;for(;r<e.length;)n=101*n+e.charCodeAt(r++)>>>0;return"go"+n})(m));if(!b[f]){let r=m!==e?e:(e=>{let r,n,l=[{}];for(;r=g.exec(e.replace(h,""));)r[4]?l.shift():r[3]?(n=r[3].replace(y," ").trim(),l.unshift(l[0][n]=l[0][n]||{})):l[0][r[1]]=r[2].replace(y," ").trim();return l[0]})(e);b[f]=o(d?{["@keyframes "+f]:r}:r,n?"":"."+f)}let v=n&&b.g?b.g:null;return n&&(b.g=b[f]),c=b[f],v?r.data=r.data.replace(v,c):-1===r.data.indexOf(c)&&(r.data=l?c+r.data:r.data+c),f},p=(e,r,n)=>e.reduce((e,l,d)=>{let c=r[d];if(c&&c.call){let e=c(n),r=e&&e.props&&e.props.className||/^go/.test(e)&&e;c=r?"."+r:e&&"object"==typeof e?e.props?"":o(e,""):!1===e?"":e}return e+l+(null==c?"":c)},"");function u(e){let r=this||{},n=e.call?e(r.p):e;return i(n.unshift?n.raw?p(n,[].slice.call(arguments,1),r.p):n.reduce((e,n)=>Object.assign(e,n&&n.call?n(r.p):n),{}):n,t(r.target),r.g,r.o,r.k)}u.bind({g:1});let v,w,_,k=u.bind({k:1});function goober_modern_j(e,r){let n=this||{};return function(){let l=arguments;function a(d,c){let m=Object.assign({},d),f=m.className||a.className;n.p=Object.assign({theme:w&&w()},m),n.o=/ *go\d+/.test(f),m.className=u.apply(n,l)+(f?" "+f:""),r&&(m.ref=c);let g=e;return e[0]&&(g=m.as||e,delete m.as),_&&g[0]&&_(m),v(g,m)}return r?r(a):a}}var W=e=>"function"==typeof e,dist_f=(e,r)=>W(e)?e(r):e,j=(l=0,()=>(++l).toString()),A=()=>{if(void 0===d&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");d=!e||e.matches}return d},U=(e,r)=>{switch(r.type){case 0:return{...e,toasts:[r.toast,...e.toasts].slice(0,20)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===r.toast.id?{...e,...r.toast}:e)};case 2:let{toast:n}=r;return U(e,{type:e.toasts.find(e=>e.id===n.id)?1:0,toast:n});case 3:let{toastId:l}=r;return{...e,toasts:e.toasts.map(e=>e.id===l||void 0===l?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===r.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==r.toastId)};case 5:return{...e,pausedAt:r.time};case 6:let d=r.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+d}))}}},N=[],E={toasts:[],pausedAt:void 0},dist_u=e=>{E=U(E,e),N.forEach(e=>{e(E)})},J=(e,r="blank",n)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:r,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...n,id:(null==n?void 0:n.id)||j()}),x=e=>(r,n)=>{let l=J(r,e,n);return dist_u({type:2,toast:l}),l.id},dist_c=(e,r)=>x("blank")(e,r);dist_c.error=x("error"),dist_c.success=x("success"),dist_c.loading=x("loading"),dist_c.custom=x("custom"),dist_c.dismiss=e=>{dist_u({type:3,toastId:e})},dist_c.remove=e=>dist_u({type:4,toastId:e}),dist_c.promise=(e,r,n)=>{let l=dist_c.loading(r.loading,{...n,...null==n?void 0:n.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let d=r.success?dist_f(r.success,e):void 0;return d?dist_c.success(d,{id:l,...n,...null==n?void 0:n.success}):dist_c.dismiss(l),e}).catch(e=>{let d=r.error?dist_f(r.error,e):void 0;d?dist_c.error(d,{id:l,...n,...null==n?void 0:n.error}):dist_c.dismiss(l)}),e};var P=k`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,T=k`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,C=k`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,S=goober_modern_j("div")`
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
    animation: ${T} 0.15s ease-out forwards;
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
`,D=k`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,O=goober_modern_j("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${D} 1s linear infinite;
`,I=k`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,R=k`
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
}`,F=goober_modern_j("div")`
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
    animation: ${R} 0.2s ease-out forwards;
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
`,$=goober_modern_j("div")`
  position: absolute;
`,L=goober_modern_j("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,Z=k`
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
  animation: ${Z} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,M=({toast:e})=>{let{icon:r,type:n,iconTheme:l}=e;return void 0!==r?"string"==typeof r?m.createElement(z,null,r):r:"blank"===n?null:m.createElement(L,null,m.createElement(O,{...l}),"loading"!==n&&m.createElement($,null,"error"===n?m.createElement(S,{...l}):m.createElement(F,{...l})))},ye=e=>`
0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,ge=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}
`,B=goober_modern_j("div")`
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
`,q=goober_modern_j("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Ae=(e,r)=>{let n=e.includes("top")?1:-1,[l,d]=A()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[ye(n),ge(n)];return{animation:r?`${k(l)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${k(d)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};m.memo(({toast:e,position:r,style:n,children:l})=>{let d=e.height?Ae(e.position||r||"top-center",e.visible):{opacity:0},c=m.createElement(M,{toast:e}),f=m.createElement(q,{...e.ariaProps},dist_f(e.message,e));return m.createElement(B,{className:e.className,style:{...d,...n,...e.style}},"function"==typeof l?l({icon:c,message:f}):m.createElement(m.Fragment,null,c,f))}),c=m.createElement,o.p=void 0,v=c,w=void 0,_=void 0,u`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;var H=dist_c}},function(e){e.getEagerSharedForChunkId&&e.getEagerSharedForChunkId(216,e.initConsumes),e.getEagerRemotesForChunkId&&e.getEagerRemotesForChunkId(216,e.initRemotes),e.O(0,[888,179],function(){return e.own_remote.then(function(){return Promise.all([Promise.all(e.initRemotes),Promise.all(e.initConsumes)])}).then(function(){return e(e.s=2944)})}),_N_E=e.O()}]);