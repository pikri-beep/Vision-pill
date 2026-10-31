"use strict";const{app:f,BrowserWindow:Me,screen:F,ipcMain:o,shell:I,dialog:Ye,Tray:ut,Menu:pt,nativeImage:K,clipboard:G,powerMonitor:ke,globalShortcut:H,systemPreferences:ge}=require("electron");f.commandLine.appendSwitch("disable-background-timer-throttling");f.commandLine.appendSwitch("disable-backgrounding-occluded-windows");f.commandLine.appendSwitch("disable-renderer-backgrounding");f.commandLine.appendSwitch("autoplay-policy","no-user-gesture-required");const ht=f.requestSingleInstanceLock();ht?f.on("second-instance",()=>{typeof he=="function"?he():s&&!s.isDestroyed()&&(s.isVisible()||s.show(),s.restore(),s.focus())}):f.quit();const m=require("node:path"),p=require("fs"),We=require("os"),Ve=require("https"),He=require("http"),ft=require("crypto"),{EventEmitter:yt}=require("events");function fe(t){const e=[m.join(__dirname,t),m.join(__dirname,"../../src",t),m.join(typeof f<"u"&&f.getAppPath?f.getAppPath():process.cwd(),"src",t),m.join(typeof f<"u"&&f.getAppPath?f.getAppPath():process.cwd(),".vite/build",t),m.join(process.cwd(),"src",t)];for(const n of e)try{if(p.existsSync(n)||p.existsSync(n+".js")||p.existsSync(m.join(n,"index.js")))return require(n)}catch{}return require(t)}const{createProgressEngine:mt}=fe("services/progress"),{createNotificationEngine:gt,NOTIFICATION_ACTION_TYPES:hn}=fe("services/notifications"),{createLauncherEngine:wt}=fe("services/launcher"),{createNotesEngine:$t}=fe("services/notes"),{buildInstallCommand:bt,buildLauncherBatch:St,buildHelperPaths:vt}=fe("services/updater");let B=null,s=null,U=!0;function P(){try{return m.join(f.getPath("userData"),"settings.json")}catch{return m.join(process.cwd(),"settings.json")}}function At(){try{const t=P();if(p.existsSync(t)){const e=JSON.parse(p.readFileSync(t,"utf8"));if(typeof e.alwaysOnTop=="boolean")return e.alwaysOnTop}}catch{}return!0}function Tt(t){try{const e=P();let n={};if(p.existsSync(e))try{n=JSON.parse(p.readFileSync(e,"utf8"))}catch{}n.alwaysOnTop=t,p.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}function Pt(){try{const t=P();if(p.existsSync(t)){const e=JSON.parse(p.readFileSync(t,"utf8"));if(typeof e.autoDownloadInstall=="boolean")return e.autoDownloadInstall}}catch{}return!0}function kt(t,e){try{const n=P();let r={};if(p.existsSync(n))try{r=JSON.parse(p.readFileSync(n,"utf8"))}catch{}r[t]=e,p.writeFileSync(n,JSON.stringify(r,null,2),"utf8")}catch{}}function xt(){try{const t=P();if(p.existsSync(t)){const e=JSON.parse(p.readFileSync(t,"utf8"));if(typeof e.mascotMode=="boolean")return e.mascotMode}}catch{}return!0}function et(t){try{const e=P();let n={};if(p.existsSync(e))try{n=JSON.parse(p.readFileSync(e,"utf8"))}catch{}n.mascotMode=t,p.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}function Ct(){try{const t=P();if(p.existsSync(t)){const e=JSON.parse(p.readFileSync(t,"utf8"));if(typeof e.minimalNotch=="boolean")return e.minimalNotch}}catch{}return!1}function pe(t){try{const e=P();let n={};if(p.existsSync(e))try{n=JSON.parse(p.readFileSync(e,"utf8"))}catch{}n.minimalNotch=t,p.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}function It(){try{const t=P();if(p.existsSync(t)){const e=JSON.parse(p.readFileSync(t,"utf8"));if(typeof e.privacyDots=="boolean")return e.privacyDots}}catch{}return!1}function Dt(t){try{const e=P();let n={};if(p.existsSync(e))try{n=JSON.parse(p.readFileSync(e,"utf8"))}catch{}n.privacyDots=t,p.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}function Et(){try{const t=P();if(p.existsSync(t)){const e=JSON.parse(p.readFileSync(t,"utf8"));if(typeof e.smartBrowserAvoidance=="boolean")return e.smartBrowserAvoidance}}catch{}return!0}function Nt(t){try{const e=P();let n={};if(p.existsSync(e))try{n=JSON.parse(p.readFileSync(e,"utf8"))}catch{}n.smartBrowserAvoidance=t,p.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}let J=xt(),v=Ct(),de=It(),se=Et();U=At();function Ot(){try{const t=P();if(p.existsSync(t)){const e=JSON.parse(p.readFileSync(t,"utf8"));if(Array.isArray(e.hiddenTabs))return e.hiddenTabs}}catch{}return[6]}function Wt(t){try{const e=P();let n={};if(p.existsSync(e))try{n=JSON.parse(p.readFileSync(e,"utf8"))}catch{}n.hiddenTabs=t,p.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}const _t=[2,11,12,13,14,15,16,4,5,6,7,8,10,0,1,3];function Mt(){try{const t=P();if(p.existsSync(t)){const e=JSON.parse(p.readFileSync(t,"utf8"));if(Array.isArray(e.tabOrder)&&e.tabOrder.length>0)return e.tabOrder}}catch{}return[..._t]}function Ft(t){try{const e=P();let n={};if(p.existsSync(e))try{n=JSON.parse(p.readFileSync(e,"utf8"))}catch{}n.tabOrder=t,p.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}let ee=Ot(),te=Mt();const ue="http://127.0.0.1:8765/api/process";function Se(){try{const t=P();if(p.existsSync(t)){const e=JSON.parse(p.readFileSync(t,"utf8"));let n=typeof e.jarvisEndpoint=="string"&&e.jarvisEndpoint.trim()?e.jarvisEndpoint.trim():ue;return n==="http://localhost:5000/api/ask"&&(n=ue),{enabled:typeof e.jarvisEnabled=="boolean"?e.jarvisEnabled:!0,endpoint:n}}}catch{}return{enabled:!0,endpoint:ue}}function Rt(t){try{const e=P();let n={};if(p.existsSync(e))try{n=JSON.parse(p.readFileSync(e,"utf8"))}catch{}return typeof(t==null?void 0:t.enabled)=="boolean"&&(n.jarvisEnabled=t.enabled),typeof(t==null?void 0:t.endpoint)=="string"&&t.endpoint.trim()&&(n.jarvisEndpoint=t.endpoint.trim()),p.writeFileSync(e,JSON.stringify(n,null,2),"utf8"),!0}catch{return!1}}function T(){if(U&&!(!s||s.isDestroyed())){try{s.setAlwaysOnTop(!0,"screen-saver",1)}catch{try{s.setAlwaysOnTop(!0,"screen-saver")}catch{try{s.setAlwaysOnTop(!0)}catch{}}}try{s.moveTop()}catch{}}}function Ut(t){if(U=!!t,Tt(U),s&&!s.isDestroyed()){try{U?T():s.setAlwaysOnTop(!1)}catch{}try{s.webContents.send("always-on-top-changed",U)}catch{}}M()}function tt(){try{return m.join(f.getPath("userData"),"quick-pill.log")}catch{return m.join(process.cwd(),"quick-pill.log")}}function c(t,e=null){const r=`[${new Date().toISOString()}] ${t}${e?` | Error: ${e.stack||e}`:""}
`;console.log(r.trim());try{const i=tt();p.appendFileSync(i,r,"utf8")}catch{}}process.on("uncaughtException",t=>{c("UNCAUGHT EXCEPTION (Main Process)",t)});process.on("unhandledRejection",t=>{c("UNHANDLED REJECTION (Main Process)",t)});const L={0:"Alt+B",1:"Alt+W",2:"Alt+O",11:"Alt+H",12:"Alt+A",13:"Alt+P",14:"Alt+L",15:"Alt+Q",16:"Alt+I",3:"Alt+M",4:"Alt+C",5:"Alt+N",6:"Alt+G",7:"Alt+V",8:"Alt+T",10:"Alt+R","minimal-notch":"Alt+Shift+M","dismiss-notification":"Alt+Shift+D"};let V=[];function nt(){try{const t=P();if(p.existsSync(t)){const e=JSON.parse(p.readFileSync(t,"utf8"));if(e&&typeof e.tabShortcuts=="object"&&e.tabShortcuts!==null)return{...L,...e.tabShortcuts}}}catch{}return{...L}}function st(t){try{const e=P();let n={};if(p.existsSync(e))try{n=JSON.parse(p.readFileSync(e,"utf8"))}catch{}return n.tabShortcuts=t,p.writeFileSync(e,JSON.stringify(n,null,2),"utf8"),!0}catch(e){return c("Failed to save tabShortcuts preference:",e),!1}}function Gt(t){if(Number(t)===9){je();return}if(!(!s||s.isDestroyed()))try{s.isVisible()||s.show(),T(),s.focus(),s.webContents.send("open-tab-instant",Number(t))}catch(e){c(`Failed to openTabInstant for tab ${t}:`,e)}}function Fe(t){for(const r of V)try{H.unregister(r)}catch{}V=[];const e=t||nt();for(const[r,i]of Object.entries(e)){if(!i||typeof i!="string"||!i.trim())continue;const a=i.trim();if(a.toUpperCase().includes("CTRL")||a.toUpperCase().includes("CONTROL")){c(`Refusing to register shortcut with Ctrl: ${a}`);continue}if(r==="dismiss-notification"){try{H.register(a,()=>{s&&!s.isDestroyed()&&s.webContents.send("dismiss-latest-notification"),g&&!g.isDestroyed()&&g.webContents.send("dismiss-latest-notification")})?V.push(a):c(`Global shortcut conflict/in-use for ${a} (dismiss-notification)`)}catch(l){c(`Error registering global shortcut ${a}:`,l)}continue}if(r==="minimal-notch"){try{H.register(a,()=>{v=!v,pe(v),s&&!s.isDestroyed()&&(s.webContents.send("settings:minimal-notch-changed",v),s.webContents.send("toggle-minimal-notch-hotkey")),M()})?V.push(a):c(`Global shortcut conflict/in-use for ${a} (minimal-notch)`)}catch(l){c(`Error registering global shortcut ${a}:`,l)}continue}try{H.register(a,()=>{Gt(parseInt(r,10))})?V.push(a):c(`Global shortcut conflict/in-use for ${a} (tab ${r})`)}catch(l){c(`Error registering global shortcut ${a}:`,l)}}const n=e["minimal-notch"]||"Alt+Shift+M";if(!V.includes(n))try{H.register(n,()=>{v=!v,pe(v),s&&!s.isDestroyed()&&(s.webContents.send("settings:minimal-notch-changed",v),s.webContents.send("toggle-minimal-notch-hotkey")),M()})&&V.push(n)}catch(r){c("Error registering fallback global shortcut for minimal notch:",r)}}const{exec:j,execFile:ye,spawn:Re}=require("child_process");function ve(t){return Buffer.from(t,"utf16le").toString("base64")}o.handle("log-message",(t,e,n,r)=>{c(`[RENDERER ${String(e).toUpperCase()}] ${n} ${r?JSON.stringify(r):""}`)});o.handle("log-renderer-error",(t,e)=>{c(`[RENDERER ERROR] Unhandled Renderer Exception ${JSON.stringify(e)}`)});let be=null;o.handle("set-ignore-mouse-events",(t,e,n)=>{if(s&&!s.isDestroyed())try{if(be===e)return;if(be=e,e){const r=n!==void 0?n:!0;s.setIgnoreMouseEvents(!0,{forward:r})}else s.setIgnoreMouseEvents(!1),T()}catch{try{s.setIgnoreMouseEvents(!0,{forward:!0})}catch{}}});o.handle("get-always-on-top",()=>U);o.handle("set-always-on-top",(t,e)=>(Ut(e),U));o.handle("focus-window",()=>{s&&!s.isDestroyed()&&(T(),s.focus())});o.handle("open-external",async(t,e)=>{await I.openExternal(e)});o.handle("get-accent-color",()=>{try{if(process.platform==="win32"){if(typeof(ge==null?void 0:ge.getAccentColor)=="function"){const r=ge.getAccentColor();if(r&&typeof r=="string"&&r.length>=6)return"#"+r.slice(0,6)}const{execSync:t}=require("child_process"),n=t('reg query "HKCU\\Software\\Microsoft\\Windows\\DWM" /v ColorizationColor',{encoding:"utf8"}).match(/0x([0-9a-fA-F]{8})/);if(n)return"#"+n[1].slice(2,8)}}catch{}return"#38bdf8"});o.handle("get-mascot-mode",()=>J);o.handle("set-mascot-mode",(t,e)=>(J=!!e,et(J),M(),J));o.handle("get-minimal-notch",()=>v);o.handle("set-minimal-notch",(t,e)=>(v=!!e,pe(v),s&&!s.isDestroyed()&&s.webContents.send("settings:minimal-notch-changed",v),M(),v));o.handle("toggle-minimal-notch",()=>(v=!v,pe(v),s&&!s.isDestroyed()&&(s.webContents.send("settings:minimal-notch-changed",v),s.webContents.send("toggle-minimal-notch-hotkey")),M(),v));o.handle("get-smart-browser-avoidance",()=>se);o.handle("set-smart-browser-avoidance",(t,e)=>(se=!!e,Nt(se),s&&!s.isDestroyed()&&s.webContents.send("settings:smart-browser-avoidance-changed",se),se));o.handle("get-hidden-tabs",()=>ee);o.handle("set-hidden-tabs",(t,e)=>(Array.isArray(e)&&(ee=e,Wt(ee),s&&!s.isDestroyed()&&s.webContents.send("settings:hidden-tabs-changed",ee),g&&!g.isDestroyed()&&g.webContents.send("settings:hidden-tabs-changed",ee)),ee));o.handle("get-tab-order",()=>te);o.handle("set-tab-order",(t,e)=>(Array.isArray(e)&&(te=e,Ft(te),s&&!s.isDestroyed()&&s.webContents.send("settings:tab-order-changed",te),g&&!g.isDestroyed()&&g.webContents.send("settings:tab-order-changed",te)),te));o.handle("get-privacy-dots",()=>de);o.handle("set-privacy-dots",(t,e)=>(de=!!e,Dt(de),s&&!s.isDestroyed()&&s.webContents.send("settings:privacy-dots-changed",de),de));o.handle("open-settings-window",()=>(je(),!0));o.on("settings-window:minimize",()=>{g&&!g.isDestroyed()&&g.minimize()});o.on("settings-window:close",()=>{g&&!g.isDestroyed()&&g.close()});const jt="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAMklEQVRYhe3OQQ0AIAwEwbf/h1GChwW0U4E2Z9Yk1fN7kG65AwAAAAAAAAAAAAAAwP8AO6kBX7K4Xy0AAAAASUVORK5CYII=";let O=null;function rt(){if(O&&typeof O.isEmpty=="function"&&!O.isEmpty())return O;try{const t=m.resolve(f.getAppPath?f.getAppPath():process.cwd(),"src/assets/icons/icon.png");if(p.existsSync(t)&&(O=K.createFromPath(t).resize({width:32,height:32}),!O.isEmpty()))return O}catch{}try{const t=Z("png");if(p.existsSync(t)&&(O=K.createFromPath(t).resize({width:32,height:32}),!O.isEmpty()))return O}catch{}try{O=K.createFromDataURL(jt).resize({width:32,height:32})}catch{}return O}const $e=new Map;async function Lt(t){try{if(!t||typeof t!="string")return null;const e=m.resolve(t);if(!p.existsSync(e))return null;if($e.has(e)){const r=$e.get(e);return r&&!r.isEmpty()?r.toDataURL():null}let n=null;try{typeof K.createThumbnailFromPath=="function"&&(n=await K.createThumbnailFromPath(e,{width:32,height:32}))}catch{}if(!n||n.isEmpty())try{typeof f.getFileIcon=="function"&&(n=await f.getFileIcon(e,{size:"normal"}),n&&!n.isEmpty()&&(n=n.resize({width:32,height:32})))}catch{}return(!n||n.isEmpty())&&(n=rt()),$e.set(e,n),n&&!n.isEmpty()?n.toDataURL():null}catch(e){return c("cacheShelfIcon error:",e),null}}function Ue(t,e){try{if(!t||typeof t.startDrag!="function"||!e||typeof e!="string")return!1;const n=m.resolve(e);if(!p.existsSync(n))return!1;let r=$e.get(n);return(!r||typeof r.isEmpty=="function"&&r.isEmpty())&&(r=rt()),!r||typeof r.isEmpty=="function"&&r.isEmpty()?(c("executeStartDragSync: no valid icon available, skipping startDrag to prevent crash"),!1):(t.startDrag({file:n,icon:r}),!0)}catch(n){return c("executeStartDragSync error:",n),!1}}o.on("shelf:start-drag",(t,e)=>{Ue(t.sender,e)});o.on("ondragstart",(t,e)=>{Ue(t.sender,e)});o.handle("start-drag",(t,e)=>Ue(t.sender,e));o.handle("shelf:cache-icon",async(t,e)=>await Lt(e));let Q=null;function A(){if(!Q){let t="";try{t=f.getPath("userData")}catch{t=process.cwd()}Q=wt({userDataPath:t,shell:I,getFileIcon:(e,n)=>f.getFileIcon(e,n)})}return Q}o.handle("launcher:search-apps",async(t,e,n)=>{try{return await A().searchApps(e,n)}catch(r){return c("Error in launcher:search-apps:",r),[]}});o.handle("launcher:get-catalog",async()=>{try{return await A().getCatalog()}catch(t){return c("Error in launcher:get-catalog:",t),[]}});o.handle("launcher:reindex-catalog",async()=>{try{return await A().reindexCatalog()}catch(t){return c("Error in launcher:reindex-catalog:",t),{success:!1,count:0}}});o.handle("launcher:launch-app",async(t,e)=>{try{return await A().launchApp(e)}catch(n){return c("Error in launcher:launch-app:",n),{success:!1,error:n.message}}});o.handle("launcher:get-running-windows",async(t,e)=>{try{return await A().getRunningWindows(e)}catch(n){return c("Error in launcher:get-running-windows:",n),[]}});o.handle("launcher:activate-window",async(t,e)=>{try{const n=await A().activateWindow(e);return n.success&&s&&!s.isDestroyed()&&s.webContents.send("launcher:window-activated",{hWnd:e}),n}catch(n){return c("Error in launcher:activate-window:",n),{success:!1,code:"FAILED",error:n.message}}});o.handle("launcher:get-favorites",async()=>{try{return await A().getFavorites()}catch(t){return c("Error in launcher:get-favorites:",t),[]}});o.handle("launcher:set-favorites",async(t,e)=>{try{return await A().setFavorites(e)}catch(n){return c("Error in launcher:set-favorites:",n),{success:!1}}});o.handle("launcher:open-app",async(t,e)=>{try{return e?await I.openPath(e)?await A().launchApp(e):{success:!0}:{success:!1,error:"No target specified"}}catch(n){return c("Error in launcher:open-app:",n),{success:!1,error:n.message}}});o.on("launcher:open-app",async(t,e)=>{try{if(!e)return;await I.openPath(e)&&await A().launchApp(e)}catch(n){c("Error in launcher:open-app (event):",n)}});o.handle("launcher:open-url",async(t,e)=>{try{if(!e)return{success:!1,error:"No URL specified"};let n=String(e).trim();return/^https?:\/\//i.test(n)||(n="https://"+n),await I.openExternal(n),{success:!0}}catch(n){return c("Error in launcher:open-url:",n),{success:!1,error:n.message}}});o.on("launcher:open-url",async(t,e)=>{try{if(!e)return;let n=String(e).trim();/^https?:\/\//i.test(n)||(n="https://"+n),await I.openExternal(n)}catch(n){c("Error in launcher:open-url (event):",n)}});o.handle("launcher:select-file",async()=>{try{const t=await Ye.showOpenDialog({title:"Select Application or Shortcut",properties:["openFile"],filters:[{name:"Applications & Shortcuts",extensions:["exe","lnk","bat","cmd"]},{name:"All Files",extensions:["*"]}]});if(!t.canceled&&t.filePaths.length>0){const e=t.filePaths[0],n=m.basename(e,m.extname(e));return{canceled:!1,filePath:e,name:n}}return{canceled:!0}}catch(t){return c("Error in launcher:select-file:",t),{canceled:!0,error:t.message}}});o.handle("workspaces:get-workspaces",async()=>{try{return await A().getWorkspaces()}catch(t){return c("Error in workspaces:get-workspaces:",t),[]}});o.handle("workspaces:save-workspace",async(t,e)=>{try{return await A().saveWorkspace(e)}catch(n){return c("Error in workspaces:save-workspace:",n),{success:!1,error:n.message}}});o.handle("workspaces:delete-workspace",async(t,e)=>{try{return await A().deleteWorkspace(e)}catch(n){return c("Error in workspaces:delete-workspace:",n),{success:!1,error:n.message}}});o.handle("workspaces:launch-workspace",async(t,e,n)=>{try{return await A().launchWorkspace(e,n)}catch(r){return c("Error in workspaces:launch-workspace:",r),{success:!1,results:[],error:r.message}}});let xe=null;function N(){if(!xe){let t="";try{t=f.getPath("userData")}catch{t=process.cwd()}xe=$t({userDataPath:t,clipboard:G})}return xe}o.handle("notes:get-notes",async(t,e,n)=>{try{return await N().getNotes(e,n)}catch(r){return c("Error in notes:get-notes:",r),[]}});o.handle("notes:save-note",async(t,e)=>{try{const n=await N().saveNote(e);return s&&!s.isDestroyed()&&s.webContents.send("notes:updated",{action:"save",note:n}),n}catch(n){return c("Error in notes:save-note:",n),{success:!1,error:n.message}}});o.handle("notes:delete-note",async(t,e)=>{try{const n=await N().deleteNote(e);return n.success&&s&&!s.isDestroyed()&&s.webContents.send("notes:updated",{action:"delete",id:e}),n}catch(n){return c("Error in notes:delete-note:",n),{success:!1,error:n.message}}});o.handle("notes:undo-delete",async()=>{try{const t=await N().undoDelete();return t.success&&s&&!s.isDestroyed()&&s.webContents.send("notes:updated",{action:"restore",note:t.note}),t}catch(t){return c("Error in notes:undo-delete:",t),{success:!1,error:t.message}}});o.handle("notes:toggle-pin",async(t,e)=>{try{const n=await N().togglePin(e);return n.success&&s&&!s.isDestroyed()&&s.webContents.send("notes:updated",{action:"togglePin",id:e,isPinned:n.isPinned}),n}catch(n){return c("Error in notes:toggle-pin:",n),{success:!1,error:n.message}}});o.handle("notes:toggle-archive",async(t,e)=>{try{const n=await N().toggleArchive(e);return n.success&&s&&!s.isDestroyed()&&s.webContents.send("notes:updated",{action:"toggleArchive",id:e,isArchived:n.isArchived}),n}catch(n){return c("Error in notes:toggle-archive:",n),{success:!1,error:n.message}}});o.handle("notes:save-draft",async(t,e)=>{try{return await N().saveDraft(e)}catch(n){return c("Error in notes:save-draft:",n),{success:!1,error:n.message}}});o.handle("notes:get-draft",async()=>{try{return await N().getDraft()}catch(t){return c("Error in notes:get-draft:",t),null}});o.handle("notes:clear-draft",async()=>{try{return await N().clearDraft()}catch(t){return c("Error in notes:clear-draft:",t),{success:!1,error:t.message}}});o.handle("notes:get-contextual-capture",async(t,e)=>{try{return await N().getContextualCapture(e)}catch(n){return c("Error in notes:get-contextual-capture:",n),{success:!1,code:"CAPTURE_ERROR",error:n.message}}});o.handle("notes:search-notes",async(t,e,n)=>{try{return await N().searchNotes(e,n)}catch(r){return c("Error in notes:search-notes:",r),[]}});o.handle("notes:get-tags",async()=>{try{return await N().getTags()}catch(t){return c("Error in notes:get-tags:",t),[]}});o.handle("notes:convert-to-task",async(t,e)=>{try{return await N().convertToTask(e)}catch(n){return c("Error in notes:convert-to-task:",n),{success:!1,error:n.message}}});o.handle("shortcuts:get-tab-shortcuts",()=>nt());o.handle("shortcuts:set-tab-shortcuts",(t,e)=>{if(!e||typeof e!="object")return{success:!1,error:"Invalid shortcuts object"};const n={};for(const[i,a]of Object.entries(e))if(typeof a=="string"){const l=a.toUpperCase();if(l.includes("CTRL")||l.includes("CONTROL"))return{success:!1,error:"Ctrl cannot be used in tab shortcuts (reserved for Click-Through)"};n[i]=a.trim()}const r={...L,...n};return st(r),Fe(r),s&&!s.isDestroyed()&&s.webContents.send("shortcuts:updated",r),g&&!g.isDestroyed()&&g.webContents.send("shortcuts:updated",r),{success:!0,shortcuts:r}});o.handle("shortcuts:reset-tab-shortcuts",()=>(st(L),Fe(L),s&&!s.isDestroyed()&&s.webContents.send("shortcuts:updated",L),g&&!g.isDestroyed()&&g.webContents.send("shortcuts:updated",L),{success:!0,shortcuts:L}));function ie(t,e){try{o.removeHandler(t)}catch{}o.handle(t,e)}ie("jarvis:ask",async(t,e)=>{if(!e||typeof e!="string"||!e.trim())return{success:!1,error:"Empty prompt provided."};const n=Se();if(!n.enabled)return{success:!1,error:"JARVIS integration is currently disabled in Settings."};const r=n.endpoint||ue;try{const i=new AbortController,a=setTimeout(()=>i.abort(),45e3),l={text:e.trim(),prompt:e.trim(),audio_target:"laptop"},h=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json, text/plain, */*"},body:JSON.stringify(l),signal:i.signal});if(clearTimeout(a),!h.ok){const u=await h.text().catch(()=>"");return{success:!1,error:`JARVIS responded with error ${h.status}: ${u||h.statusText}`}}if((h.headers.get("content-type")||"").includes("application/json")){const u=await h.json();return{success:!0,response:u.reply||u.response||u.text||u.message||u.answer||u.output||u.result||(typeof u=="string"?u:JSON.stringify(u)),raw:u}}else return{success:!0,response:await h.text()}}catch(i){return i.name==="AbortError"?{success:!1,error:"JARVIS query timed out (45s). Your local model may be busy."}:{success:!1,error:"JARVIS local server offline. Make sure D:/JARVIS is running."}}});ie("jarvis:testConnection",async(t,e)=>{const n=Se(),r=e||n.endpoint||ue;try{const i=new AbortController,a=setTimeout(()=>i.abort(),4e3);let l=!1,h="";try{const u=`${new URL(r).origin}/api/status`,y=await fetch(u,{method:"GET",signal:i.signal});if(y.ok){const $=await y.json().catch(()=>null);$&&$.name?(l=!0,h=`${$.name} v${$.version||"2.5"} (${$.model||"Online"})`):y.status<500&&(l=!0,h=`Online (${y.status})`)}}catch{}if(!l)try{const d=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:"ping",prompt:"ping"}),signal:i.signal});d.status<500&&(l=!0,h=`HTTP ${d.status}`)}catch{try{const u=new URL(r),y=await fetch(u.origin,{method:"GET",signal:i.signal});y.status<500&&(l=!0,h=`Host online (${y.status})`)}catch(u){throw u}}return clearTimeout(a),{success:!0,connected:l,details:h}}catch(i){return{success:!1,connected:!1,error:i.message||"Cannot reach server"}}});ie("jarvis:getConfig",async()=>Se());ie("jarvis:setConfig",async(t,e)=>{Rt(e);const n=Se();return s&&!s.isDestroyed()&&s.webContents.send("jarvis:configUpdated",n),g&&!g.isDestroyed()&&g.webContents.send("jarvis:configUpdated",n),{success:!0,config:n}});ie("jarvis:stopServer",async()=>{try{try{const e=new AbortController,n=setTimeout(()=>e.abort(),1500);await fetch("http://127.0.0.1:8765/api/shutdown",{method:"POST",headers:{"Content-Type":"application/json"},signal:e.signal}).catch(()=>null),clearTimeout(n)}catch{}const t="D:\\JARVIS\\stop_jarvis.bat";return p.existsSync(t)&&j(`cmd /c "${t}"`,{cwd:"D:\\JARVIS"}),{success:!0,message:"JARVIS stopped and resources freed."}}catch(t){return{success:!1,error:t.message||"Failed to stop JARVIS"}}});ie("jarvis:launchServer",async()=>{const t="D:\\JARVIS\\run_gui.bat";try{if(p.existsSync(t))return j(`cmd /c "${t}"`,{cwd:"D:\\JARVIS"}),{success:!0,message:"JARVIS launch initiated."}}catch(e){return{success:!1,error:e.message||"Failed to launch run_gui.bat"}}return{success:!1,error:"D:\\JARVIS\\run_gui.bat not found."}});o.handle("launch-app",async(t,e)=>await A().launchApp(e));o.handle("build-app-cache",async()=>await A().reindexCatalog());o.handle("search-apps",async(t,e)=>await A().searchApps(e));o.handle("get-displays",()=>F.getAllDisplays().map(e=>({id:e.id,label:e.label||`Display ${e.id}`,bounds:e.bounds})));o.handle("set-display",(t,e)=>{if(s&&!s.isDestroyed()){const r=F.getAllDisplays().find(d=>d.id.toString()===e.toString())||F.getPrimaryDisplay(),i=560,a=180,l=Math.round(r.bounds.x+(r.bounds.width-i)/2),h=r.bounds.y;s.setBounds({x:l,y:h,width:i,height:a}),s.show(),T()}});o.handle("update-window-position",(t,e,n)=>{});o.handle("set-auto-launch",(t,e)=>{try{f.setLoginItemSettings({openAtLogin:e,path:f.getPath("exe")}),e||Ge(),M(),g&&!g.isDestroyed()&&g.webContents.send("settings:auto-launch-changed",e),s&&!s.isDestroyed()&&s.webContents.send("settings:auto-launch-changed",e)}catch(n){console.error("Failed to set login item settings on Windows:",n)}});o.handle("get-auto-launch",()=>{try{return f.getLoginItemSettings().openAtLogin}catch{return!1}});o.handle("create-desktop-shortcut",()=>{try{const t=f.getPath("desktop"),e=m.join(t,"Quick Pill.lnk"),n=process.execPath||f.getPath("exe");let r=Z("ico");p.existsSync(r)||(r=Z("png"));const i={target:n,cwd:m.dirname(n),description:"Quick Pill - Dynamic Island for Windows",appUserModelId:"com.neosparkx.quickpill"};return p.existsSync(r)&&(i.icon=r,i.iconIndex=0),{success:I.writeShortcutLink(e,"create",i),path:e}}catch(t){return c("create-desktop-shortcut error:",t),{success:!1,error:(t==null?void 0:t.message)||String(t)}}});function Ge(){if(process.platform==="win32")try{const t=["electron.app.Ripple","electron.app.Electron","electron.app.Quick Pill","Ripple"];for(const e of t)j(`reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${e}" /f`,()=>{})}catch{}}const Bt=["https://raw.githubusercontent.com/pikri-beep/Quick-Pill-Dynamic-Island-for-Windows/main/web%20app/public/version.json","https://raw.githubusercontent.com/nabil24024004/Quick-Pill/main/web%20app/public/version.json"];class Jt extends yt{constructor(){super(),this.manifestUrls=[...Bt],this.currentVersion=f?f.getVersion():"5.5.2",this.status="idle",this.updateInfo=null,this.downloadedFilePath=null,this.currentDownloadRequest=null,this.lastProgressEmit=0;const e=Pt();this.autoDownload=e,this.autoInstall=e}compareVersions(e,n){const r=(e||"0.0.0").replace(/^v/i,"").trim(),i=(n||"0.0.0").replace(/^v/i,"").trim(),[a,l]=r.split("-"),[h,d]=i.split("-"),u=a.split(".").map(w=>parseInt(w,10)||0),y=h.split(".").map(w=>parseInt(w,10)||0),$=Math.max(u.length,y.length);for(let w=0;w<$;w++){const k=u[w]||0,x=y[w]||0;if(k>x)return 1;if(k<x)return-1}return!l&&d?1:l&&!d?-1:l&&d?l.localeCompare(d):0}getPlatformKey(){return`win32-${process.arch}`}fetchJson(e,n=12e3,r=5){return new Promise((i,a)=>{if(r<=0)return a(new Error("Too many redirects while fetching update manifest."));const h=(e.startsWith("https")?Ve:He).get(e,{headers:{"User-Agent":`QuickPill-Updater/${this.currentVersion} (${process.platform} ${process.arch})`,Accept:"application/json, text/plain, */*"},timeout:n},d=>{if(d.statusCode>=300&&d.statusCode<400&&d.headers.location){const y=new URL(d.headers.location,e).href;return this.fetchJson(y,n,r-1).then(i).catch(a)}if(d.statusCode!==200)return d.resume(),a(new Error(`Server returned HTTP ${d.statusCode}: ${d.statusMessage}`));let u="";d.setEncoding("utf8"),d.on("data",y=>{u+=y}),d.on("end",()=>{try{const y=JSON.parse(u);i(y)}catch(y){a(new Error(`Invalid JSON received from update manifest: ${y.message}`))}})});h.on("timeout",()=>{h.destroy(),a(new Error("Connection timed out while checking for updates."))}),h.on("error",d=>{a(d)})})}async checkForUpdates(){var e,n,r;if(this.status==="checking"||this.status==="downloading")return{status:this.status,updateInfo:this.updateInfo};this.status="checking",this.emit("checking");try{let i=null,a=null;for(const d of this.manifestUrls)try{const u=`${d}${d.includes("?")?"&":"?"}_t=${Date.now()}`,y=await this.fetchJson(u);if(y&&y.version){i=y;break}}catch(u){a=u}if(!i||!i.version)throw a||new Error('Update manifest is missing required "version" field.');const l=i.version;if(this.compareVersions(l,this.currentVersion)>0){const d=this.getPlatformKey(),u=((e=i.platforms)==null?void 0:e[d])||((n=i.platforms)==null?void 0:n[`${process.platform}-x64`])||((r=i.platforms)==null?void 0:r["win32-x64"]),y=(u==null?void 0:u.url)||"";return this.updateInfo={version:l,currentVersion:this.currentVersion,name:i.name||`Quick Pill v${l}`,releaseDate:i.releaseDate||"",mandatory:!!i.mandatory,changelog:Array.isArray(i.changelog)?i.changelog:[],downloadUrl:y,sha256:(u==null?void 0:u.sha256)||"",size:(u==null?void 0:u.size)||0,installerType:(u==null?void 0:u.installerType)||"nsis"},this.status="available",this.emit("update-available",this.updateInfo),c(`[Auto-Updater] Update v${l} is available (installed: v${this.currentVersion}).`),this.autoDownload&&y&&(c(`[Auto-Updater] New update v${l} detected. Automatically downloading in background...`),setTimeout(()=>{this.startDownload().catch($=>{c("[Auto-Updater] Automatic background download failed:",$)})},1e3)),{status:"available",updateInfo:this.updateInfo}}else{this.status="not-available";const d={currentVersion:this.currentVersion,latestVersion:l};return this.emit("update-not-available",d),{status:"not-available",updateInfo:d}}}catch(i){this.status="error";const a=i.message||"Unknown error occurred while checking for updates.";return this.emit("error",a),{status:"error",error:a}}}startDownload(){if(!this.updateInfo||!this.updateInfo.downloadUrl){const a=new Error("No update available or download URL is missing.");return this.emit("error",a.message),Promise.reject(a)}if(this.status==="downloading")return Promise.resolve({status:"downloading"});this.status="downloading",this.emit("download-started",this.updateInfo);const e=f.getPath("temp"),r=`quick-pill-update-v${this.updateInfo.version}.exe`,i=m.join(e,r);return new Promise((a,l)=>{if(p.existsSync(i))try{p.unlinkSync(i)}catch{}const h=p.createWriteStream(i);let d=0,u=this.updateInfo.size||0,y=0,$=Date.now(),w=0,k=!1;const x=E=>{if(!k){k=!0;try{h.destroy()}catch{}try{p.existsSync(i)&&p.unlinkSync(i)}catch{}this.status="error",c(`[Auto-Updater] ${E.message}`),this.emit("error",E.message),l(E)}},Be=(E,_=5)=>{if(k)return;if(_<=0)return x(new Error("Too many redirects while downloading update binary."));const Te=(E.startsWith("https")?Ve:He).get(E,{headers:{"User-Agent":`QuickPill-Updater/${this.currentVersion} (${process.platform} ${process.arch})`}},D=>{if(k){D.resume();return}if(D.statusCode>=300&&D.statusCode<400&&D.headers.location){D.resume();const Y=new URL(D.headers.location,E).href;return Be(Y,_-1)}if(D.statusCode!==200)return x(new Error(`Download failed with status HTTP ${D.statusCode}: ${D.statusMessage}`));const Pe=parseInt(D.headers["content-length"],10);!isNaN(Pe)&&Pe>0&&(u=Pe),D.on("data",Y=>{d+=Y.length,h.write(Y);const me=Date.now();if(me-this.lastProgressEmit>=100||d===u){const qe=(me-$)/1e3;qe>=.5&&(w=Math.round((d-y)/qe),y=d,$=me);const dt={percent:u>0?Math.min(100,Math.round(d/u*1e3)/10):0,transferredBytes:d,totalBytes:u,speedBytesPerSec:w};this.lastProgressEmit=me,this.emit("download-progress",dt)}}),D.on("end",()=>{k||h.end()}),D.on("error",Y=>{x(Y)})});this.currentDownloadRequest=Te,Te.on("error",D=>{x(D)})};h.on("finish",()=>{if(k)return;if(this.currentDownloadRequest=null,this.updateInfo.sha256&&this.updateInfo.sha256.trim()!=="")try{const _=ft.createHash("sha256"),Je=p.readFileSync(i);if(_.update(Je),_.digest("hex").toLowerCase()!==this.updateInfo.sha256.trim().toLowerCase())return x(new Error("Integrity check failed (SHA-256 mismatch). The downloaded file might be corrupted."))}catch(_){console.warn("Could not verify SHA-256 checksum:",_)}this.downloadedFilePath=i,this.status="downloaded";const E={version:this.updateInfo.version,filePath:i};c(`[Auto-Updater] Update v${this.updateInfo.version} downloaded successfully (${d} bytes).`),this.emit("update-downloaded",E),a(E),this.autoInstall&&(c(`[Auto-Updater] Update v${this.updateInfo.version} downloaded successfully. Automatically installing in background in 2 seconds...`),setTimeout(()=>{Promise.resolve(this.installAndRelaunch()).catch(_=>{c("[Auto-Updater] Automatic install failed:",_)})},2e3))}),h.on("error",E=>{x(E)}),Be(this.updateInfo.downloadUrl)})}cancelDownload(){if(this.currentDownloadRequest){try{this.currentDownloadRequest.destroy()}catch{}this.currentDownloadRequest=null}this.status="idle",this.emit("download-cancelled")}async installAndRelaunch(){if(!this.downloadedFilePath||!p.existsSync(this.downloadedFilePath)){const h=new Error("No downloaded update file found to install.");return c("[Auto-Updater] "+h.message),this.emit("error",h.message),!1}if(f&&f.isPackaged===!1){const h=new Error("Automatic installation is only available for the packaged Quick Pill build.");return c("[Auto-Updater] "+h.message),this.emit("error",h.message),!1}const e=this.downloadedFilePath,n=process.pid;let r="";try{r=f.getPath("exe")}catch{}try{typeof W<"u"&&W&&W.stop()}catch{}let i=null,a=null;try{i=bt({installerPath:e,currentPid:n,appExePath:r,logPath:tt()}),a=vt(f.getPath("temp"),n),p.writeFileSync(a.scriptPath,i.script,"utf8"),p.writeFileSync(a.batchPath,St(a.scriptPath),"utf8")}catch(h){return c("[Auto-Updater] Failed to build install helper:",h),this.emit("error",`Failed to prepare the installer: ${h.message}`),!1}c(`[Auto-Updater] Handing the update over to the installer helper (pid ${n})`),c(`[Auto-Updater] Installer: ${e}`);let l=!1;try{const h=await I.openPath(a.batchPath);l=!h,h&&c(`[Auto-Updater] shell.openPath reported: ${h}`)}catch(h){c("[Auto-Updater] Failed to start the installer helper through the shell:",h)}if(!l)try{const h=Re(i.command,i.args,{detached:!0,stdio:"ignore",windowsHide:!0});h.on("error",d=>{c("[Auto-Updater] Installer helper failed to start:",d)}),h.unref()}catch(h){return c("[Auto-Updater] Failed to launch the installer helper:",h),this.emit("error",`Failed to launch the installer: ${h.message}`),!1}return setTimeout(()=>{try{f&&(f.isQuitting=!0,f.quit())}catch{}setTimeout(()=>{try{process.exit(0)}catch{}},1500)},200),!0}}const S=new Jt;function q(t,e){s&&!s.isDestroyed()&&s.webContents.send("update-event",{event:t,data:e}),g&&!g.isDestroyed()&&g.webContents.send("update-event",{event:t,data:e})}S.on("checking",()=>q("checking"));S.on("update-available",t=>q("available",t));S.on("update-not-available",t=>q("not-available",t));S.on("download-started",t=>q("download-started",t));S.on("download-progress",t=>q("download-progress",t));S.on("update-downloaded",t=>q("downloaded",t));S.on("download-cancelled",()=>q("cancelled"));S.on("error",t=>q("error",t));o.handle("check-for-updates",async()=>await S.checkForUpdates());o.handle("start-update-download",async()=>await S.startDownload());o.handle("cancel-update-download",()=>(S.cancelDownload(),!0));o.handle("install-update",()=>S.installAndRelaunch());o.handle("get-updater-state",()=>({status:S.status,updateInfo:S.updateInfo,downloadedFilePath:S.downloadedFilePath,currentVersion:S.currentVersion}));o.handle("get-app-version",()=>f.getVersion());o.handle("get-auto-download-install",()=>S.autoDownload&&S.autoInstall);o.handle("set-auto-download-install",(t,e)=>{const n=!!e;return S.autoDownload=n,S.autoInstall=n,kt("autoDownloadInstall",n),n});const oe=mt({autoUpdater:S,openPath:async t=>{try{p.existsSync(t)&&(p.statSync(t).isDirectory()?await I.openPath(t):I.showItemInFolder(t))}catch(e){c("[progress openPath error]",e)}}});oe.coordinator.on("update",t=>{s&&!s.isDestroyed()&&s.webContents.send("progress:update",t)});o.handle("progress:get-snapshot",()=>oe.coordinator.getSnapshot());o.handle("progress:execute-action",async(t,e,n,r)=>await oe.coordinator.executeAction(e,n,r));o.handle("progress:start-file-op",async(t,e)=>await oe.fileOpsProvider.startCopy(e));o.handle("progress:start-hash-op",async(t,e)=>await oe.fileOpsProvider.startHash(e));o.handle("progress:clear-history",()=>(oe.registry.clearHistory(),!0));o.handle("progress:select-file",async()=>{if(!s)return null;const t=await Ye.showOpenDialog(s,{properties:["openFile"]});return t.canceled||!t.filePaths.length?null:t.filePaths[0]});const Z=(t=null)=>{const e=t||"ico";try{const n=m.join(f.getAppPath(),`src/assets/icons/icon.${e}`);if(p.existsSync(n))return n}catch{}try{const n=m.join(process.resourcesPath,`icon.${e}`);if(p.existsSync(n))return n;const r=m.join(process.resourcesPath,`assets/icons/icon.${e}`);if(p.existsSync(r))return r}catch{}return m.join(__dirname,`../../src/assets/icons/icon.${e}`)},C={hovering:!1,hitboxWidth:175,hitboxHeight:36,anchorX:null};let ze=null,Ae="still";o.on("notch:lifecycle-state",(t,e)=>{typeof e=="string"&&(Ae=e)});function qt(t,e,n,r){const i=Number(t),a=Number(e);Number.isFinite(i)&&i>0&&(C.hitboxWidth=i),Number.isFinite(a)&&a>0&&(C.hitboxHeight=a);const l=Number(r);C.anchorX=Number.isFinite(l)?l:null}function Vt(t){try{if(!s||s.isDestroyed())return!1;const e=t||F.getCursorScreenPoint(),n=s.getBounds(),r=C.anchorX!==null?n.x+C.anchorX:n.x+Math.round(n.width/2),i=C.hitboxWidth/2,a=r-i,l=r+i,h=n.y,d=n.y+C.hitboxHeight;return e.x>=a&&e.x<=l&&e.y>=h&&e.y<=d}catch{return!1}}function Ht(){if(ze)return;let t=0;ze=setInterval(()=>{if(!s||s.isDestroyed())return;const e=Date.now();if(!(Ae==="still"&&!C.hovering&&e-t<80)){t=e;try{const n=F.getCursorScreenPoint(),r=Vt(n);r&&!C.hovering?(C.hovering=!0,s.setIgnoreMouseEvents(!1),s.webContents.send("notch-cursor-enter"),c(`[cursor-hit-test] enter at ${n.x},${n.y} hitbox=${C.hitboxWidth}x${C.hitboxHeight} anchor=${C.anchorX}`)):!r&&C.hovering?(C.hovering=!1,s.setIgnoreMouseEvents(!0,{forward:!0}),s.webContents.send("notch-cursor-leave"),c(`[cursor-hit-test] leave at ${n.x},${n.y}`)):r&&C.hovering&&be!==!1&&(s.setIgnoreMouseEvents(!1),be=!1)}catch(n){C.errorLogged||(C.errorLogged=!0,c("[cursor-hit-test] watcher error:",n))}}},30)}o.on("notch:set-hitbox",(t,e)=>{const n=e||{};qt(n.width,n.height,n.expanded,n.anchorX),c(`[notch-hitbox] ${n.width}x${n.height} expanded=${n.expanded}`)});const _e=()=>{const t=F.getPrimaryDisplay(),{x:e,y:n,width:r,height:i}=t.bounds,a=560,l=180,h=Math.round(e+(r-a)/2),d=n;s=new Me({width:a,height:l,x:h,y:d,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,minimizable:!1,maximizable:!1,fullscreenable:!1,frame:!1,thickFrame:!1,hasShadow:!1,skipTaskbar:!0,icon:Z(),type:"toolbar",fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:m.join(__dirname,"preload.js"),devTools:!f.isPackaged,backgroundThrottling:!1},show:!0}),s.setIgnoreMouseEvents(!0,{forward:!0}),s.once("ready-to-show",()=>{s&&(s.show(),T(),s.focus())}),s.webContents.on("console-message",(u,y,$,w,k)=>{y>=2&&c(`[RENDERER CONSOLE ${y===3?"ERROR":"WARN"}] (${k?m.basename(k):"unknown"}:${w}) ${$}`)}),s.webContents.on("render-process-gone",(u,y)=>{if(c(`[RENDERER PROCESS GONE] reason=${y==null?void 0:y.reason}, exitCode=${y==null?void 0:y.exitCode}`),s&&!s.isDestroyed())try{s.setIgnoreMouseEvents(!0,{forward:!0})}catch{}}),s.on("blur",()=>{T()}),s.on("minimize",()=>{s&&!s.isDestroyed()&&(s.restore(),T())}),s.on("restore",()=>{T()}),s.on("show",()=>{T()}),setTimeout(()=>{s&&!s.isVisible()&&(s.show(),T(),s.focus())},5e3),s.on("closed",()=>{s=null});try{s.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!f.isPackaged&&process.env.NODE_ENV==="development")s.loadURL("http://localhost:5173");else{const u=[m.join(__dirname,"../renderer/main_window/index.html"),m.join(f.getAppPath(),".vite/renderer/main_window/index.html"),m.join(f.getAppPath(),"dist/index.html"),m.join(__dirname,"index.html"),m.join(f.getAppPath(),"index.html")];let y=!1;for(const $ of u)if(p.existsSync($)){c(`Loading renderer from: ${$}`),s.loadFile($),y=!0;break}y||(c("No packaged renderer HTML found, falling back to localhost:5173"),s.loadURL("http://localhost:5173"))}};let g=null;function je(){if(g&&!g.isDestroyed()){g.show(),g.focus();return}if(g=new Me({width:680,height:560,title:"Quick Pill Settings",backgroundColor:"#121212",autoHideMenuBar:!0,resizable:!0,minimizable:!0,maximizable:!1,frame:!1,icon:Z(),webPreferences:{preload:m.join(__dirname,"preload.js"),devTools:!f.isPackaged,backgroundThrottling:!1}}),!f.isPackaged&&process.env.NODE_ENV==="development")g.loadURL("http://localhost:5173#settings");else{const t=[m.join(__dirname,"../renderer/main_window/index.html"),m.join(f.getAppPath(),".vite/renderer/main_window/index.html"),m.join(f.getAppPath(),"dist/index.html"),m.join(__dirname,"index.html"),m.join(f.getAppPath(),"index.html")];for(const e of t)if(p.existsSync(e)){g.loadFile(e,{hash:"settings"});break}}g.on("closed",()=>{g=null})}function he(){try{if(!s||s.isDestroyed()){_e();return}s.isVisible()||s.show(),s.restore(),T(),s.focus(),s.webContents.send("toggle-minimal-notch-hotkey")}catch(t){c("restoreAndShowQuickPill error:",t)}}function M(){if(!B||B.isDestroyed())return;const t=f.getLoginItemSettings().openAtLogin,e=pt.buildFromTemplate([{label:"Show Quick Pill",click:()=>{he()}},{type:"separator"},{label:"Start with Windows",type:"checkbox",checked:t,click:n=>{try{f.setLoginItemSettings({openAtLogin:n.checked,path:f.getPath("exe")}),n.checked||Ge(),g&&!g.isDestroyed()&&g.webContents.send("settings:auto-launch-changed",n.checked),s&&!s.isDestroyed()&&s.webContents.send("settings:auto-launch-changed",n.checked)}catch{}M()}},{label:"Mascot Mode",type:"checkbox",checked:J,click:n=>{J=n.checked,et(J),s&&!s.isDestroyed()&&s.webContents.send("settings:mascot-mode-changed",J),M()}},{label:"Minimal Notch",type:"checkbox",checked:v,click:n=>{v=n.checked,pe(v),s&&!s.isDestroyed()&&s.webContents.send("settings:minimal-notch-changed",v),M()}},{type:"separator"},{label:"Settings...",click:()=>{je()}},{type:"separator"},{label:"Exit",click:()=>{f.quit()}}]);B.setContextMenu(e)}let Ke=!1,ne=null,zt=null;function Kt(){if(process.platform==="win32")try{const t=require("koffi"),e=t.load("user32.dll"),n=t.load("gdi32.dll"),r=t.struct("RECT",{left:"long",top:"long",right:"long",bottom:"long"});ne={GetForegroundWindow:e.func("GetForegroundWindow","intptr_t",[]),IsZoomed:e.func("IsZoomed","bool",["intptr_t"]),GetWindowRect:e.func("GetWindowRect","bool",["intptr_t",t.out(t.pointer(r))]),GetClassNameA:e.func("GetClassNameA","int",["intptr_t",t.out(t.pointer("char")),"int"]),GetWindowTextA:e.func("GetWindowTextA","int",["intptr_t",t.out(t.pointer("char")),"int"]),GetDC:e.func("GetDC","intptr_t",["intptr_t"]),ReleaseDC:e.func("ReleaseDC","int",["intptr_t","intptr_t"]),GetKeyState:e.func("GetKeyState","int16_t",["int"])},zt={GetPixel:n.func("GetPixel","uint32_t",["intptr_t","int","int"])}}catch(t){c("[Obstruction] Koffi user32/gdi32 init failed, falling back:",t)}}function Qt(){if(process.platform!=="win32")return;Kt();let t=0;setInterval(()=>{if(!s||s.isDestroyed())return;const e=Date.now();if(Ae==="still"&&e-t<750)return;t=e;let n=!1;if(ne)try{const r=ne.GetForegroundWindow();if(r&&r!==0){const i=Buffer.alloc(256);ne.GetClassNameA(r,i,256);const a=i.toString("utf8").replace(/\0.*$/,"").trim(),l=a==="Progman"||a==="WorkerW"||a==="Shell_TrayWnd"||a==="Shell_SecondaryTrayWnd";let h=!1;try{const d=s.getNativeWindowHandle();d.readBigInt64LE&&d.readBigInt64LE(0)===BigInt(r)&&(h=!0)}catch{}try{if(g&&!g.isDestroyed()){const d=g.getNativeWindowHandle();d.readBigInt64LE&&d.readBigInt64LE(0)===BigInt(r)&&(h=!0)}}catch{}if(!l&&!h){const d={};ne.GetWindowRect(r,d);const u=ne.IsZoomed(r),y=F.getPrimaryDisplay(),$=y.bounds.width,w=y.bounds.height,k=(d.right||0)-(d.left||0),x=(d.bottom||0)-(d.top||0);d.left<=0&&d.top<=0&&d.right>=$&&d.bottom>=w&&!u?n=!0:u||d.top<=8&&k>=$*.9?se&&(n=!0):n=!1}}}catch{}n!==Ke&&(Ke=n,s&&!s.isDestroyed()&&s.webContents.send("desktop:obstruction-status",{isObstructed:n}))},250)}f.whenReady().then(()=>{f.setAppUserModelId("com.neosparkx.quickpill"),Ge(),_e(),Ht(),sn(),Qt(),nn(),Fe(),A().getCatalog().catch(t=>c("Failed to warm launcher catalog:",t)),f.on("activate",()=>{Me.getAllWindows().length===0&&_e()});try{let t=Z(),e=K.createFromPath(t);e.isEmpty()&&(t=Z("png"),e=K.createFromPath(t));const n=e.isEmpty()?t:e.resize({width:16,height:16});B=new ut(n),B.setToolTip("Quick Pill"),B.on("click",()=>{he()}),B.on("double-click",()=>{he()}),M()}catch(t){console.error("Failed to create tray:",t)}F.on("display-metrics-changed",()=>{T()}),F.on("display-added",()=>{T()}),F.on("display-removed",()=>{T()}),ke&&(ke.on("resume",()=>{s&&!s.isDestroyed()&&s.webContents.send("system-resume");try{typeof b<"u"&&(b!=null&&b.registry)&&b.registry.checkSnoozedDue()}catch{}setTimeout(T,500),setTimeout(T,2e3)}),ke.on("unlock-screen",()=>{s&&!s.isDestroyed()&&s.webContents.send("system-resume");try{typeof b<"u"&&(b!=null&&b.registry)&&b.registry.checkSnoozedDue()}catch{}setTimeout(T,500),setTimeout(T,2e3)})),setInterval(()=>{if(U&&s&&!s.isDestroyed()&&s.isVisible())if(!s.isAlwaysOnTop())T();else try{s.moveTop()}catch{}},2500),setTimeout(()=>{S.checkForUpdates().catch(t=>{c("Auto-update check on startup error:",t)})},4e3),setInterval(()=>{S.checkForUpdates().catch(t=>{c("Periodic background update check error:",t)})},2*60*60*1e3)});const it=m.join(f.getPath("userData"),"get-media.ps1"),Xt=`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing

$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and 
    $_.IsGenericMethodDefinition -and 
    $_.GetGenericArguments().Count -eq 1 -and 
    $_.GetParameters().Count -eq 1
} | Select-Object -First 1

function Await-Operation($asyncOp, $type) {
    if (-not $asyncOp) { return $null }
    try {
        $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($asyncOp))
        [void]$task.Wait(2000)
        return $task.Result
    } catch {
        return $null
    }
}

function Get-AppIconBase64($appId) {
    try {
        $proc = $null
        if ($appId) {
            $cleanName = $appId.Split('!')[-1].Replace('.exe','')
            $proc = Get-Process | Where-Object { $_.ProcessName -eq $cleanName -or $cleanName -like "*$($_.ProcessName)*" } | Select-Object -First 1
        }
        if (-not $proc) {
            $proc = Get-Process | Where-Object { $_.MainWindowTitle -and ($_.ProcessName -match "chrome|msedge|brave|firefox|spotify|vlc|music") } | Select-Object -First 1
        }
        if ($proc) {
            $path = $proc.MainModule.FileName
            if ($path) {
                $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($path)
                if ($icon) {
                    $bmp = $icon.ToBitmap()
                    $ms = New-Object System.IO.MemoryStream
                    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
                    $bytes = $ms.ToArray()
                    $ms.Close()
                    $bmp.Dispose()
                    $icon.Dispose()
                    if ($bytes.Length -gt 0) {
                        return "data:image/png;base64," + [Convert]::ToBase64String($bytes)
                    }
                }
            }
        }
    } catch {}
    return ""
}

$inputInterface = [Windows.Storage.Streams.IInputStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
$asStreamMethod = [System.IO.WindowsRuntimeStreamExtensions].GetMethod('AsStreamForRead', [type[]]@($inputInterface))

$mgrType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
$propsType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime]
$streamType = [Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType = WindowsRuntime]
$streamRefType = [Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]

$asyncOp = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync()
$manager = Await-Operation $asyncOp $mgrType

if ($manager) {
    $session = $manager.GetCurrentSession()
    if (-not $session) {
        $sessions = $manager.GetSessions()
        if ($sessions -and $sessions.Count -gt 0) {
            $session = $sessions | Where-Object { $_.GetPlaybackInfo().PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing } | Select-Object -First 1
            if (-not $session) { $session = $sessions[0] }
        }
    }
    if ($session) {
        $propsOp = $session.TryGetMediaPropertiesAsync()
        $props = Await-Operation $propsOp $propsType
        $playback = $session.GetPlaybackInfo()
        $status = if ($playback) { $playback.PlaybackStatus.ToString().ToLower() } else { "stopped" }

        $timeline = $session.GetTimelineProperties()
        $basePos = if ($timeline -and $timeline.Position) { $timeline.Position.TotalSeconds } else { 0 }
        if ($status -eq "playing" -and $timeline -and $timeline.LastUpdatedTime) {
            $elapsed = ([DateTimeOffset]::UtcNow - $timeline.LastUpdatedTime).TotalSeconds
            if ($elapsed -gt 0 -and $elapsed -lt 86400) {
                $basePos += $elapsed
            }
        }
        $duration = if ($timeline -and $timeline.EndTime) { [math]::Round($timeline.EndTime.TotalSeconds) } else { 0 }
        if ($duration -gt 0 -and $basePos -gt $duration) { $basePos = $duration }
        $position = [math]::Round($basePos)

        $sourceApp = $session.SourceAppUserModelId
        $artwork = ""

        if ($props -and $props.Thumbnail) {
            try {
                $thumbOp = $props.Thumbnail.OpenReadAsync()
                $stream = Await-Operation $thumbOp $streamType
                if (-not $stream) {
                    $stream = Await-Operation $thumbOp $streamRefType
                }
                if ($stream) {
                    $netStream = $asStreamMethod.Invoke($null, @($stream))
                    if ($netStream) {
                        $mem = New-Object System.IO.MemoryStream
                        $netStream.CopyTo($mem)
                        $bytes = $mem.ToArray()
                        $mem.Close()
                        if ($bytes.Length -gt 0) {
                            $artwork = "data:image/png;base64," + [Convert]::ToBase64String($bytes)
                        }
                    }
                }
            } catch {}
        }

        if (-not $artwork) {
            $artwork = Get-AppIconBase64 $sourceApp
        }

        $info = @{
            Title = if ($props) { $props.Title } else { "" }
            Artist = if ($props) { $props.Artist } else { "" }
            Album = if ($props) { $props.AlbumTitle } else { "" }
            Status = $status
            Source = $sourceApp
            Artwork = $artwork
            Position = $position
            Duration = $duration
        }
        $info | ConvertTo-Json -Compress
        exit
    }
}
Write-Output "null"
`,ot=m.join(f.getPath("userData"),"control-media.ps1"),Zt=`param([string]$command = "playpause", [double]$seekSeconds = 0)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and 
    $_.IsGenericMethodDefinition -and 
    $_.GetGenericArguments().Count -eq 1 -and 
    $_.GetParameters().Count -eq 1
} | Select-Object -First 1

function Await-Operation($asyncOp, $type) {
    if (-not $asyncOp) { return $null }
    try {
        $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($asyncOp))
        [void]$task.Wait(2000)
        return $task.Result
    } catch {
        return $null
    }
}

$mgrType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
$asyncOp = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync()
$manager = Await-Operation $asyncOp $mgrType

if ($manager) {
    $session = $manager.GetCurrentSession()
    if (-not $session) {
        $sessions = $manager.GetSessions()
        if ($sessions -and $sessions.Count -gt 0) {
            $session = $sessions | Where-Object { $_.GetPlaybackInfo().PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing } | Select-Object -First 1
            if (-not $session) { $session = $sessions[0] }
        }
    }
    if ($session) {
        $boolType = [bool]
        switch ($command.ToLower()) {
            "playpause" {
                $success = Await-Operation ($session.TryTogglePlayPauseAsync()) $boolType
                if (-not $success) {
                    $pb = $session.GetPlaybackInfo()
                    if ($pb.PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing) {
                        Await-Operation ($session.TryPauseAsync()) $boolType
                    } else {
                        Await-Operation ($session.TryPlayAsync()) $boolType
                    }
                }
            }
            "play" {
                Await-Operation ($session.TryPlayAsync()) $boolType
            }
            "pause" {
                Await-Operation ($session.TryPauseAsync()) $boolType
            }
            "next" {
                Await-Operation ($session.TrySkipNextAsync()) $boolType
            }
            "previous" {
                Await-Operation ($session.TrySkipPreviousAsync()) $boolType
            }
            "stop" {
                Await-Operation ($session.TryStopAsync()) $boolType
            }
            "seek" {
                $ticks = [long]($seekSeconds * 10000000)
                Await-Operation ($session.TryChangePlaybackPositionAsync($ticks)) $boolType
            }
        }
        exit 0
    }
}

# Fallback to keybd_event if GSMTC is unavailable or had no session
if ($command -in @("playpause", "next", "previous")) {
    $vk = 0xCD
    if ($command -eq "next") { $vk = 0xB0 }
    elseif ($command -eq "previous") { $vk = 0xB1 }
    $type = '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);'
    $MediaKey = Add-Type -MemberDefinition $type -Name "WinMediaKeyFallback" -Namespace "WinAPI" -PassThru
    $MediaKey::keybd_event($vk, 0, 0, [UIntPtr]::Zero)
    $MediaKey::keybd_event($vk, 0, 2, [UIntPtr]::Zero)
}
`;try{p.writeFileSync(it,Xt,"utf8")}catch(t){console.error("Failed to write get-media.ps1 script:",t)}try{p.writeFileSync(ot,Zt,"utf8")}catch(t){console.error("Failed to write control-media.ps1 script:",t)}let Ce=!1;o.handle("get-system-media",async()=>Ce?null:(Ce=!0,new Promise(t=>{const e=n=>{Ce=!1,t(n)};ye("powershell",["-NoProfile","-ExecutionPolicy","Bypass","-File",it],{maxBuffer:10*1024*1024,encoding:"utf8"},(n,r)=>{if(n||!r||r.trim()==="null"||r.trim()==="'null'"){j(`powershell -NoProfile -Command "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,{encoding:"utf8"},(i,a)=>{var h;if(i||!a)return e(null);const l=(h=a.split(`
`).find(d=>d.includes("-")))==null?void 0:h.trim();if(l){const d=l.split(" - ");let u="Unknown",y=l;d.length>1&&(u=d[0].trim(),y=d.slice(1).join(" - ").trim()),e({name:y||l,artist:u||"Unknown",state:"playing",source:"Spotify",position:0,duration:0})}else e(null)});return}try{const i=JSON.parse(r.trim());if(!i||!i.Title&&!i.Artist)return e(null);e({name:i.Title||"Unknown Title",artist:i.Artist||"Unknown Artist",album:i.Album||"",artwork_url:i.Artwork||null,state:i.Status==="playing"?"playing":"paused",source:i.Source||"System",position:Number(i.Position)||0,duration:Number(i.Duration)||0})}catch{e(null)}})})));let R=null,Qe=0,Ie=!1;const Yt=3e4;o.handle("get-bluetooth-status",async()=>{const t=Date.now();return R&&t-Qe<Yt?R:Ie?R||{connected:!1,devices:[]}:(Ie=!0,new Promise(e=>{const r=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$devs = @(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' })
$names = @($devs | ForEach-Object { $_.FriendlyName })
@{ connected = ($devs.Count -gt 0); devices = $names } | ConvertTo-Json -Compress
`,"utf16le").toString("base64");j(`powershell -NoProfile -EncodedCommand ${r}`,(i,a)=>{if(Ie=!1,Qe=Date.now(),i||!a)return R={connected:!1,devices:[]},e(R);try{const l=JSON.parse(a.trim());R={connected:!!l.connected,devices:Array.isArray(l.devices)?l.devices:l.devices?[l.devices]:[]},e(R)}catch{R={connected:!1,devices:[]},e(R)}})}))});let ae=!1,Xe=0,De=!1;o.handle("get-camera-status",async()=>Date.now()-Xe<3500||De?ae:(De=!0,new Promise(e=>{ye("reg",["query","HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam","/s"],(n,r)=>{if(De=!1,Xe=Date.now(),n||!r)return ae=!1,e(!1);ae=!!r.match(/LastUsedTimeStop\s+REG_QWORD\s+0x0\b/i),e(ae)})})));let ce=!1,Ze=0,Ee=!1;o.handle("get-microphone-status",async()=>Date.now()-Ze<3500||Ee?ce:(Ee=!0,new Promise(e=>{ye("reg",["query","HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone","/s"],(n,r)=>{if(Ee=!1,Ze=Date.now(),n||!r)return ce=!1,e(!1);ce=!!r.match(/LastUsedTimeStop\s+REG_QWORD\s+0x0\b/i),e(ce)})})));f.on("window-all-closed",()=>{B||f.quit()});o.handle("control-system-media",async(t,e,...n)=>{const r=typeof n[0]=="number"?n[0]:0;c(`Executing media control: ${e} ${r>0?`(seek: ${r}s)`:""}`),ye("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",ot,"-command",e,"-seekSeconds",r.toString()],{timeout:4e3},i=>{i&&c("Media control error:",i)})});let le=null;function en(){const t=We.cpus();if(!t||t.length===0)return 0;if(!le||le.length!==t.length)return le=t,0;let e=0,n=0;for(let i=0;i<t.length;i++){const a=t[i],l=le[i];let h=a.times.idle-l.times.idle,d=0;for(const u in a.times)d+=a.times[u]-l.times[u];e+=h,n+=d}if(le=t,n===0)return 0;const r=e/n;return Math.max(0,Math.min(100,Math.round((1-r)*100)))}function tn(){const t=We.totalmem(),e=We.freemem();return t?Math.max(0,Math.min(100,Math.round((t-e)/t*100))):0}o.handle("get-system-metrics",async()=>({cpu:en(),ram:tn()}));let z=[],X="";function nn(){try{const e=G.readText().trim();e&&(X=e,z.push({id:"clip-"+Date.now(),text:e,timestamp:Date.now()}))}catch{}let t=0;setInterval(()=>{try{const e=Date.now();if(Ae==="still"&&e-t<1500)return;t=e;const n=G.readText().trim();n&&n!==X&&(X=n,z=[{id:"clip-"+Date.now()+"-"+Math.random().toString(36).slice(2,6),text:n,timestamp:Date.now()},...z.filter(i=>i.text!==n)].slice(0,15),s&&!s.isDestroyed()&&s.webContents.send("clipboard:update",z))}catch{}},600)}o.handle("clipboard:get-history",()=>z);o.on("clipboard:write",(t,e)=>{try{e&&(X=String(e).trim(),G.writeText(String(e)))}catch{}});o.on("clipboard:clear",()=>{try{z=[],X="",G.clear(),s&&!s.isDestroyed()&&s.webContents.send("clipboard:update",[])}catch{}});o.handle("get-clipboard-text",async()=>{try{return G.readText()}catch{return""}});o.handle("write-clipboard-text",async(t,e)=>{try{return e?(X=String(e).trim(),G.writeText(String(e))):G.clear(),!0}catch{return!1}});o.handle("clear-clipboard",async()=>{try{return z=[],X="",G.clear(),s&&!s.isDestroyed()&&s.webContents.send("clipboard:update",[]),!0}catch{return!1}});o.handle("control-system-volume",async(t,e)=>{if(process.platform==="win32"){let n="0xAF";e==="down"&&(n="0xAE"),e==="mute"&&(n="0xAD");const r=`
$type = '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);'
$MediaKey = Add-Type -MemberDefinition $type -Name "WinVolKey" -Namespace "WinAPI" -PassThru
$MediaKey::keybd_event(${n}, 0, 0, [UIntPtr]::Zero)
$MediaKey::keybd_event(${n}, 0, 2, [UIntPtr]::Zero)
`,i=ve(r);return j(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${i}`,a=>{a&&c("Volume control error:",a)}),!0}return!1});let we=null,re=null;function at(){if(!(process.platform!=="win32"||re))try{const t=require("koffi"),e=t.load("kernel32.dll");re={GetLogicalDrives:e.func("GetLogicalDrives","uint32",[]),GetDriveTypeW:e.func("GetDriveTypeW","uint",["str16"]),GetVolumeInformationW:e.func("GetVolumeInformationW","bool",["str16",t.out(t.pointer("char16")),"uint32",t.out(t.pointer("uint32")),t.out(t.pointer("uint32")),t.out(t.pointer("uint32")),t.out(t.pointer("char16")),"uint32"])}}catch(t){c("[USB] Koffi kernel32 init failed:",t)}}function Ne(){if(process.platform==="win32"&&(at(),!!re))try{const t=re.GetLogicalDrives(),e=new Map;for(let n=0;n<26;n++)if(t>>n&1){const r=String.fromCharCode(65+n)+":",i=r+"\\";if(re.GetDriveTypeW(i)===2){let l="USB Drive";try{const h=Buffer.alloc(512);if(re.GetVolumeInformationW(i,h,256,null,null,null,null,0)){const u=h.toString("utf16le").replace(/\0.*$/,"").trim();u&&(l=u)}}catch{}e.set(r,l)}}if(we!==null&&s&&!s.isDestroyed()){for(const[n,r]of e)we.has(n)||(s.webContents.send("usb-change",{action:"connected",drive:n,name:r}),c(`[USB] Device connected: ${n} (${r})`));for(const[n]of we)e.has(n)||(s.webContents.send("usb-change",{action:"disconnected",drive:n,name:"USB Drive"}),c(`[USB] Device disconnected: ${n}`))}we=e}catch(t){c("[USB] Error checking removable drives:",t)}}function sn(){if(process.platform==="win32"&&(at(),setTimeout(Ne,1500),s))try{s.hookWindowMessage(537,()=>{setTimeout(Ne,500)}),c("[USB] Hooked WM_DEVICECHANGE successfully (0% CPU event-driven mode).")}catch(t){c("[USB] Failed to hook window message, falling back to gentle poll:",t),setInterval(Ne,3e4)}}const ct=m.join(f.getPath("userData"),"get-notifications.ps1"),rn=`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime

[void][Windows.UI.Notifications.Management.UserNotificationListener, Windows.UI.Notifications, ContentType = WindowsRuntime]
[void][Windows.UI.Notifications.UserNotification, Windows.UI.Notifications, ContentType = WindowsRuntime]

$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetGenericArguments().Count -eq 1 -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name.StartsWith('IAsyncOperation')
}[0]

function Await-Op($asyncOp, $type) {
    if (-not $asyncOp) { return $null }
    try {
        $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($asyncOp))
        [void]$task.Wait()
        return $task.Result
    } catch { return $null }
}

function Get-AppIconBase64($appId, $appName) {
    try {
        $proc = $null
        if ($appName) {
            $proc = Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and ($_.ProcessName -like "*$appName*" -or $_.MainWindowTitle -like "*$appName*") } | Select-Object -First 1
        }
        if (-not $proc -and $appId) {
            $cleanName = $appId.Split('!')[-1].Split('.')[-1].Replace('.exe','')
            if ($cleanName -and $cleanName -ne "App") {
                $proc = Get-Process | Where-Object { $_.ProcessName -eq $cleanName -or $_.ProcessName -like "*$cleanName*" } | Select-Object -First 1
            }
        }
        if (-not $proc -and $appId -match '.([A-Za-z0-9]+)[_!]') {
            $extracted = $Matches[1]
            $proc = Get-Process | Where-Object { $_.ProcessName -like "*$extracted*" } | Select-Object -First 1
        }
        if (-not $proc) { return "" }
        $exePath = $proc.MainModule.FileName
        if (-not $exePath) { return "" }
        $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($exePath)
        if (-not $icon) { return "" }
        $bmp = $icon.ToBitmap()
        $ms = New-Object System.IO.MemoryStream
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $bytes = $ms.ToArray()
        $ms.Close(); $bmp.Dispose(); $icon.Dispose()
        if ($bytes.Length -gt 0) {
            return "data:image/png;base64," + [Convert]::ToBase64String($bytes)
        }
    } catch {}
    return ""
}

try {
    $listener = [Windows.UI.Notifications.Management.UserNotificationListener]::Current

    $accessType = [Windows.UI.Notifications.Management.UserNotificationListenerAccessStatus, Windows.UI.Notifications, ContentType = WindowsRuntime]
    $access = Await-Op ($listener.RequestAccessAsync()) $accessType

    if ($access -ne [Windows.UI.Notifications.Management.UserNotificationListenerAccessStatus]::Allowed) {
        Write-Output "[]"
        exit
    }

    $kinds = [Windows.UI.Notifications.NotificationKinds]::Toast
    $userNotifType = [Windows.UI.Notifications.UserNotification, Windows.UI.Notifications, ContentType = WindowsRuntime]
    $readOnlyListType = [System.Collections.Generic.IReadOnlyList\`\`1].MakeGenericType($userNotifType)
    $notifsOp = $listener.GetNotificationsAsync($kinds)
    $task = $asTaskGeneric.MakeGenericMethod($readOnlyListType).Invoke($null, @($notifsOp))
    [void]$task.Wait(10000)
    $notifs = $task.Result

    if (-not $notifs) {
        Write-Output "[]"
        exit
    }

    $results = [System.Collections.Generic.List[object]]::new()
    foreach ($n in $notifs) {
        try {
            $toast = $n.Notification.Visual.GetBinding([Windows.UI.Notifications.KnownNotificationBindings]::ToastGeneric)
            if (-not $toast) { continue }
            $texts = $toast.GetTextElements()
            $title = ""
            $body = ""
            $i = 0
            foreach ($t in $texts) {
                if ($i -eq 0) { $title = $t.Text }
                elseif ($i -eq 1) { $body = $t.Text }
                $i++
            }
            $appName = ""
            $appId = ""
            try {
                $appName = $n.AppInfo.DisplayInfo.DisplayName
                $appId = $n.AppInfo.AppUserModelId
            } catch {}
            $icon = Get-AppIconBase64 $appId $appName
            $results.Add([PSCustomObject]@{
                Id = $n.Id
                AppName = $appName
                AppId = $appId
                Title = $title
                Body = $body
                Timestamp = $n.CreationTime.ToString("o")
                Icon = $icon
            })
        } catch { continue }
    }
    @($results) | ConvertTo-Json -Compress -Depth 3
} catch {
    Write-Output "[]"
}
`;try{p.writeFileSync(ct,rn,"utf8")}catch(t){c("Failed to write get-notifications.ps1:",t)}function on(){try{const t=m.join(f.getPath("userData"),"notifications-store.json");if(p.existsSync(t))return JSON.parse(p.readFileSync(t,"utf8"))}catch(t){c("Failed to load notifications-store.json:",t)}return null}function an(t){try{const e=m.join(f.getPath("userData"),"notifications-store.json");p.writeFileSync(e,JSON.stringify(t,null,2),"utf8")}catch(e){c("Failed to save notifications-store.json:",e)}}async function cn(t){return process.platform!=="win32"||!t?!1:new Promise(e=>{const n=`
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetGenericArguments().Count -eq 1 -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name.StartsWith('IAsyncOperation')
}[0]
function Await-Op($asyncOp, $type) {
    if (-not $asyncOp) { return $null }
    try { $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($asyncOp)); [void]$task.Wait(); return $task.Result } catch { return $null }
}
try {
    $listener = [Windows.UI.Notifications.Management.UserNotificationListener, Windows.UI.Notifications, ContentType = WindowsRuntime]::Current
    $listener.RemoveNotification(${t})
    Write-Output "true"
} catch { Write-Output "false" }
`,r=ve(n);j(`powershell -NoProfile -EncodedCommand ${r}`,(i,a)=>{e((a==null?void 0:a.trim())==="true")})})}async function ln(){return process.platform!=="win32"?!1:new Promise(t=>{const n=ve(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
try {
    $listener = [Windows.UI.Notifications.Management.UserNotificationListener, Windows.UI.Notifications, ContentType = WindowsRuntime]::Current
    $listener.ClearNotifications()
    Write-Output "true"
} catch { Write-Output "false" }
`);j(`powershell -NoProfile -EncodedCommand ${n}`,(r,i)=>{t((i==null?void 0:i.trim())==="true")})})}async function Le(t,e){if(process.platform!=="win32"||!t&&!e)return!1;const n=(t||"").trim(),r=(e||"").trim();c(`focusNotificationApp: appId="${n}", appName="${r}"`);try{const a=typeof A=="function"?A():null;if(a&&typeof a.getRunningWindows=="function"&&typeof a.activateWindow=="function"){const l=await a.getRunningWindows({forceRefresh:!0}),h=[r,n].filter(Boolean).map(u=>u.toLowerCase()),d=l.find(u=>{if(!u)return!1;const y=(u.processName||"").toLowerCase(),$=(u.title||"").toLowerCase();return h.some(w=>y===w||y.includes(w)||w.includes(y)||$.includes(w))});if(d&&d.hWnd){const u=await a.activateWindow(d.hWnd);if(u&&u.success)return c(`focusNotificationApp: activated running window of "${r||n}"`),!0}}}catch(a){c("Running window lookup in focusNotificationApp failed:",a)}if(n&&(n.includes("!")||n.toLowerCase().startsWith("shell:appsfolder\\")))try{const a=n.toLowerCase().startsWith("shell:appsfolder\\")?n:`shell:AppsFolder\\${n}`,l=Re("explorer.exe",[a],{detached:!0,stdio:"ignore"});return l&&typeof l.unref=="function"&&l.unref(),!0}catch(a){c("UWP explorer.exe launch failed:",a)}try{const a=typeof A=="function"?A():null;if(a){if(r){const l=await a.launchApp(r);if(l&&l.success)return!0}if(n&&n!==r){const l=await a.launchApp(n);if(l&&l.success)return!0}if(typeof a.getRunningWindows=="function"&&typeof a.activateWindow=="function"){const l=await a.getRunningWindows({forceRefresh:!0}),h=[r,n].filter(Boolean).map(u=>u.toLowerCase()),d=l.find(u=>{if(!u)return!1;const y=(u.processName||"").toLowerCase(),$=(u.title||"").toLowerCase();return h.some(w=>y===w||y.includes(w)||w.includes(y)||$.toLowerCase().includes(w))});if(d&&d.hWnd){const u=await a.activateWindow(d.hWnd);if(u&&u.success)return!0}}}}catch(a){c("LauncherEngine resolution in focusNotificationApp failed:",a)}const i=`${r} ${n}`.toLowerCase();try{if(i.includes("whatsapp"))return await I.openExternal("whatsapp://"),!0;if(i.includes("spotify"))return await I.openExternal("spotify://"),!0;if(i.includes("telegram"))return await I.openExternal("tg://"),!0;if(i.includes("discord"))return await I.openExternal("discord://"),!0;if(i.includes("slack"))return await I.openExternal("slack://"),!0}catch(a){c("URI protocol fallback failed:",a)}return new Promise(a=>{const l=new Set;[r,n].forEach(w=>{w&&(l.add(w),w.split(/\s+/).forEach(x=>{x.length>2&&l.add(x)}),w.split(/[._!\\\/]/).filter(x=>x.length>2&&!/^[0-9A-Fa-f]{8,}$/.test(x)).forEach(x=>l.add(x)))});const h=Array.from(l).filter(w=>w&&w.length>=2),d=h.length>0?h.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"):(r||n).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),u=n.replace(/'/g,"''"),y=`
$type = @'
using System;
using System.Runtime.InteropServices;
public class WinAPI {
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
}
'@
Add-Type -TypeDefinition $type -PassThru | Out-Null

$matched = $false
$pattern = '(?i)(${d})'

# Find by Process Name or Window Title
$procs = Get-Process | Where-Object { 
    $_.ProcessName -match $pattern -or $_.MainWindowTitle -match $pattern 
} | Select-Object -First 1

if ($procs -and $procs.MainWindowHandle -ne 0) {
    $hwnd = $procs.MainWindowHandle
    if ([WinAPI]::IsIconic($hwnd)) {
        [void][WinAPI]::ShowWindow($hwnd, 9)
    } else {
        [void][WinAPI]::ShowWindow($hwnd, 5)
    }
    [WinAPI]::keybd_event(0x12, 0, 0, 0)
    [WinAPI]::keybd_event(0x12, 0, 2, 0)
    [void][WinAPI]::BringWindowToTop($hwnd)
    [void][WinAPI]::SetForegroundWindow($hwnd)
    [void][WinAPI]::SwitchToThisWindow($hwnd, $true)
    $matched = $true
}

if (-not $matched -and '${u}') {
    try {
        Start-Process "explorer.exe" "shell:AppsFolder\\${u}"
        $matched = $true
    } catch {}
}

if ($matched) { Write-Output "true" } else { Write-Output "false" }
`,$=ve(y);j(`powershell -NoProfile -EncodedCommand ${$}`,(w,k)=>{a((k==null?void 0:k.trim())==="true")})})}const b=gt({savePersistence:an,initialPersistedData:on(),removeNotificationSource:cn,focusApp:Le,openExternal:async t=>I.openExternal(t)});b.registry.on("change",t=>{if(s&&!s.isDestroyed()){s.webContents.send("notification:update",t);try{s.webContents.invalidate()}catch{}}});setInterval(()=>{try{b.registry.checkSnoozedDue()}catch{}},1e4);let Oe=!1;async function lt(){return process.platform!=="win32"?[]:Oe?[]:(Oe=!0,new Promise(t=>{ye("powershell",["-NoProfile","-ExecutionPolicy","Bypass","-File",ct],{maxBuffer:5*1024*1024,encoding:"utf8",timeout:1e4},(e,n)=>{if(Oe=!1,e||!n)return t([]);try{const r=JSON.parse(n.trim()),i=Array.isArray(r)?r:r?[r]:[];b.syncNotifications(i,"windows-notification-listener"),t(i)}catch{t([])}})}))}o.handle("get-notifications",async()=>await lt());o.handle("dismiss-notification",async(t,e)=>{const n=await b.dismiss(e);return!!(n!=null&&n.success)});o.handle("focus-notification-app",async(t,e,n)=>await Le(e,n));o.handle("open-notification-target",async(t,e)=>{const n=e||{},r=String(n.url||"").trim();if(r)try{return await I.openExternal(r),c(`openNotificationTarget: opened url ${r}`),!0}catch(i){c("openNotificationTarget: failed to open url:",i)}return await Le(n.appId||"",n.appName||"")});o.handle("notification:get-snapshot",()=>b.getSnapshot());o.handle("notification:sync-now",async()=>(await lt(),b.getSnapshot()));o.handle("notification:execute-action",async(t,e,n,r)=>await b.executeAction(e,n,r));o.handle("notification:snooze",(t,e,n,r)=>b.snooze(e,n,r));o.handle("notification:cancel-snooze",(t,e)=>b.cancelSnooze(e));o.handle("notification:dismiss",async(t,e)=>await b.dismiss(e));o.handle("notification:dismiss-group",(t,e)=>b.dismissGroup(e));o.handle("notification:clear-all",async()=>{try{await ln()}catch{}return b.clearAllActive()});o.handle("notification:undo-dismiss",(t,e)=>b.undoDismiss(e));o.handle("notification:mark-reviewed",(t,e)=>b.markReviewed(e));o.handle("notification:mark-all-reviewed",()=>b.markAllReviewed());o.handle("notification:set-hide-previews",(t,e)=>(b.setHidePreviews(e),!0));o.handle("notification:set-app-excluded",(t,e,n)=>(b.setAppExcluded(e,n),!0));o.handle("notification:clear-history",()=>(b.clearHistory(),!0));o.handle("window:invalidate",()=>{if(s&&!s.isDestroyed())try{s.webContents.invalidate()}catch{}return!0});function dn(){const t=[m.join(process.resourcesPath,"audio-helper.exe"),m.join(process.resourcesPath,"native","bin","audio-helper.exe"),m.join(process.resourcesPath,"native","audio-helper.exe"),m.join(f.getAppPath(),"native","bin","audio-helper.exe"),m.join(__dirname,"..","native","bin","audio-helper.exe"),m.join(__dirname,"native","bin","audio-helper.exe"),m.join(process.cwd(),"native","bin","audio-helper.exe")];for(const e of t)try{if(p.existsSync(e))return e}catch{}return null}class un{constructor(){this.child=null,this.reqId=0,this.pending=new Map,this.buffer="",this.isStopping=!1,this.restartAttempts=0,this.maxRestartAttempts=5,this.restartTimer=null}start(){if(process.platform!=="win32"||this.child&&!this.child.killed)return;const e=dn();if(!e){c("[AudioMixer] audio-helper.exe not found in search paths.");return}try{this.child=Re(e,[],{stdio:["pipe","pipe","pipe"],windowsHide:!0}),this.child.stdout.on("data",n=>{this.buffer+=n.toString("utf8");let r;for(;(r=this.buffer.indexOf(`
`))!==-1;){const i=this.buffer.slice(0,r).trim();this.buffer=this.buffer.slice(r+1),i&&this.handleLine(i)}}),this.child.stderr.on("data",n=>{c(`[AudioMixer stderr] ${n.toString("utf8").trim()}`)}),this.child.on("error",n=>{c("[AudioMixer process error]",n)}),this.child.on("close",n=>{c(`[AudioMixer] Process exited with code ${n}`),this.child=null;for(const[r,i]of this.pending.entries())clearTimeout(i.timer),i.reject(new Error("Audio helper process exited"));if(this.pending.clear(),!this.isStopping&&this.restartAttempts<this.maxRestartAttempts){this.restartAttempts++;const r=Math.min(1e3*Math.pow(2,this.restartAttempts),1e4);this.restartTimer=setTimeout(()=>{c(`[AudioMixer] Restarting audio-helper (attempt ${this.restartAttempts})...`),this.start()},r)}}),c(`[AudioMixer] Successfully spawned audio-helper from ${e}`),this.restartAttempts=0}catch(n){c("[AudioMixer] Failed to spawn audio-helper:",n)}}handleLine(e){try{const n=JSON.parse(e);if(typeof n.id=="number"&&this.pending.has(n.id)){const{resolve:r,reject:i,timer:a}=this.pending.get(n.id);clearTimeout(a),this.pending.delete(n.id),n.success?r(n.data):i(new Error(n.error||"Unknown audio helper error"))}}catch(n){c(`[AudioMixer] Failed to parse stdout line: ${e}`,n)}}send(e,n={},r=5e3){return new Promise((i,a)=>{if((!this.child||!this.child.stdin||this.child.killed)&&(this.start(),!this.child||!this.child.stdin))return a(new Error("Audio helper is not running"));const l=++this.reqId,h={id:l,cmd:e,...n},d=setTimeout(()=>{this.pending.has(l)&&(this.pending.delete(l),a(new Error(`Command '${e}' timed out after ${r}ms`)))},r);this.pending.set(l,{resolve:i,reject:a,timer:d});try{this.child.stdin.write(JSON.stringify(h)+`
`)}catch(u){clearTimeout(d),this.pending.delete(l),a(u)}})}stop(){if(this.isStopping=!0,this.restartTimer&&(clearTimeout(this.restartTimer),this.restartTimer=null),this.child){try{this.child.stdin&&!this.child.stdin.destroyed&&(this.child.stdin.on("error",()=>{}),this.child.stdin.write(JSON.stringify({id:0,cmd:"shutdown"})+`
`))}catch{}setTimeout(()=>{if(this.child){try{this.child.kill()}catch{}this.child=null}},400)}}}const W=new un;f.whenReady().then(()=>{W.start()});f.on("will-quit",()=>{W.stop();try{H.unregisterAll()}catch{}if(Q)try{Q.destroy()}catch{}});f.on("before-quit",()=>{W.stop();try{H.unregisterAll()}catch{}if(Q)try{Q.destroy()}catch{}});o.handle("audio-mixer:get-devices",async()=>{if(process.platform!=="win32")return{devices:[],defaultDeviceId:""};try{return await W.send("listDevices")}catch(t){return c("[audio-mixer:get-devices error]",t),{devices:[],defaultDeviceId:"",error:t.message}}});o.handle("audio-mixer:get-sessions",async(t,e)=>{if(process.platform!=="win32")return{sessions:[]};try{return await W.send("listSessions",{deviceId:e})}catch(n){return c("[audio-mixer:get-sessions error]",n),{sessions:[],error:n.message}}});o.handle("audio-mixer:set-volume",async(t,e={})=>{if(process.platform!=="win32")return!1;try{return await W.send("setSessionVolume",e)}catch(n){return c("[audio-mixer:set-volume error]",n),!1}});o.handle("audio-mixer:set-mute",async(t,e={})=>{if(process.platform!=="win32")return!1;try{return await W.send("setSessionMute",e)}catch(n){return c("[audio-mixer:set-mute error]",n),!1}});o.handle("audio-mixer:set-master-volume",async(t,e={})=>{if(process.platform!=="win32")return!1;try{return await W.send("setMasterVolume",e)}catch(n){return c("[audio-mixer:set-master-volume error]",n),!1}});o.handle("audio-mixer:set-master-mute",async(t,e={})=>{if(process.platform!=="win32")return!1;try{return await W.send("setMasterMute",e)}catch(n){return c("[audio-mixer:set-master-mute error]",n),!1}});
