window.App = window.App || {};
(function(){
'use strict';
document.addEventListener('DOMContentLoaded', async () => {
    // Discover config
    try {
        const resp = await fetch(App.config.adminPrefix + '/api/config');
        const cfg = await resp.json();
        Object.assign(App.config, cfg);
    } catch(e) {
        console.warn('Admin config discovery failed, using defaults');
    }

    App.layout.render();

    // Register routes
    Object.entries(App.pages || {}).forEach(([hash, fn]) => {
        App.router.register(hash, fn);
    });

    App.router.start();
});
})();
