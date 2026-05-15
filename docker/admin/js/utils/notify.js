window.App = window.App || {};
(function(){
'use strict';
const container = document.createElement('div');
container.className = 'toast-container';
document.body.appendChild(container);

App.notify = {
    show(msg, type) {
        const el = document.createElement('div');
        el.className = 'toast toast-'+type;
        el.textContent = msg;
        container.appendChild(el);
        setTimeout(() => { el.remove(); }, 3000);
    },
    success(msg) { this.show(msg,'success'); },
    error(msg) { this.show(msg,'error'); },
    warning(msg) { this.show(msg,'warning'); },
};
})();
