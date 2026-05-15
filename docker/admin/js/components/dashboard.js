window.App = window.App || {};
window.App.pages = window.App.pages || {};
(function(){
'use strict';
App.pages.dashboard = async function(container) {
    App.layout.setTitle('Dashboard');
    container.innerHTML = '<div class="cards" id="stats-cards"><div class="card"><div class="card-label">Loading</div><div class="card-value">...</div></div></div>';
    try {
        const [subs,cols,files,arts,tokens,mods] = await Promise.all([
            App.api.getSubs().catch(()=>({data:[]})),
            App.api.getCols().catch(()=>({data:[]})),
            App.api.getFiles().catch(()=>({data:[]})),
            App.api.getArtifacts().catch(()=>({data:[]})),
            App.api.getTokens().catch(()=>({data:[]})),
            App.api.getModules().catch(()=>({data:[]})),
        ]);
        const items = [
            {label:'Subscriptions',value:App.unwrap(subs)?.length||0,link:'#subscriptions'},
            {label:'Collections',value:App.unwrap(cols)?.length||0,link:'#collections'},
            {label:'Files',value:App.unwrap(files)?.length||0,link:'#files'},
            {label:'Artifacts',value:App.unwrap(arts)?.length||0,link:'#artifacts'},
            {label:'Tokens',value:App.unwrap(tokens)?.length||0,link:'#tokens'},
            {label:'Modules',value:App.unwrap(mods)?.length||0,link:'#modules'},
        ];
        document.getElementById('stats-cards').innerHTML = items.map(i =>
            `<div class="card"><div class="card-label">${i.label}</div><div class="card-value">${i.value}</div><a href="${i.link}">View all &rarr;</a></div>`
        ).join('');
    } catch(e) {
        container.innerHTML = '<div class="empty"><p>Failed to load dashboard: '+App.fmt.escapeHtml(e.message)+'</p></div>';
    }
};
})();
