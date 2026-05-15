window.App = window.App || {};
(function(){
'use strict';
App.fmt = {
    date(ts) { if(!ts) return '-'; const d=new Date(ts); return d.toLocaleDateString()+' '+d.toLocaleTimeString(); },
    ago(ts) { const s=(Date.now()-ts)/1000; if(s<60) return Math.floor(s)+'s ago'; if(s<3600) return Math.floor(s/60)+'m ago'; if(s<86400) return Math.floor(s/3600)+'h ago'; return Math.floor(s/86400)+'d ago'; },
    truncate(str,len=60) { if(!str) return ''; return str.length>len ? str.substring(0,len)+'...' : str; },
    bytes(n) { if(!n||n===0) return '0 B'; const u=['B','KB','MB','GB']; let i=0; while(n>=1024&&i<3){n/=1024;i++;} return n.toFixed(i?1:0)+' '+u[i]; },
    escapeHtml(s) { if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); },
    maskToken(t) { if(!t) return ''; return t.substring(0,4)+'****'+t.substring(t.length-4); },
};
})();
