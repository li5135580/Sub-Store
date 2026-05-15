window.App = window.App || {};
(function(){
'use strict';
App.router = {
    routes: {},
    register(hash, renderFn) { this.routes[hash] = renderFn; },
    go(hash) { location.hash = hash; },
    start() {
        this._handle();
        window.addEventListener('hashchange', () => this._handle());
    },
    _handle() {
        const hash = location.hash.replace('#','') || 'dashboard';
        const container = document.getElementById('content');
        if (!container) return;
        const navs = document.querySelectorAll('.sidebar-nav a');
        navs.forEach(a => a.classList.toggle('active', a.getAttribute('href')==='#'+hash));
        const fn = this.routes[hash];
        if (fn) fn(container);
        else container.innerHTML = '<div class="empty"><div class="empty-ico">404</div><p>Page not found</p></div>';
    },
};
})();
