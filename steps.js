(() => {
  const Steps = {
    mode: 'client',
    agentEmail: null,
    originalHTML: null,

    init({ mode = 'client' } = {}) {
      this.mode = mode;
      this.agentEmail = this.getAgentEmail();
      this.setupMailtoButton();
      if (mode === 'agent') this.setupEditing();
      this.updateCounts();
    },

    qs(sel){ return document.querySelector(sel); },
    qsa(sel){ return Array.from(document.querySelectorAll(sel)); },

    getAgentEmail(){
      const url = new URL(window.location.href);
      const param = url.searchParams.get('agent');
      if (param) return param;
      const raw = url.search.replace(/^\?/, '');
      if (raw && raw.includes('@') && !raw.includes('=')) return decodeURIComponent(raw);
      return 'ejecutiva@clinyco.cl';
    },

    composeSubject(){
      const total = this.qsa('.step').length;
      const done  = this.qsa('.step[data-status="done"]').length;
      return `Solicitud de gestión – Pasos ${done}/${total}`;
    },

    composeBody(){
      const lines = [];
      const steps = this.qsa('.step').map((li, idx) => {
        const title = li.querySelector('.step-title')?.textContent?.trim() || li.textContent.trim();
        const status = (li.dataset.status || '').toLowerCase() === 'done' ? '[x]' : '[ ]';
        return `${status} Paso ${idx + 1}: ${title}`;
      });
      const baseUrl = location.href.split('?')[0];
      lines.push(
        'Hola,',
        'Necesito apoyo con mis pasos.',
        '',
        `URL: ${baseUrl}`,
        `Agente indicado: ${this.agentEmail}`,
        '',
        'Recuento de pasos:',
        ...steps,
        '',
        'Gracias.'
      );
      return lines.join('\n');
    },

    setupMailtoButton(){
      const btn = this.qs('#mailtoAgent');
      if (!btn) return;
      const refreshHref = () => {
        const href = `mailto:${this.agentEmail}?subject=${encodeURIComponent(this.composeSubject())}&body=${encodeURIComponent(this.composeBody())}`;
        btn.setAttribute('href', href);
      };
      refreshHref();
      btn.addEventListener('click', refreshHref);
    },

    updateCounts(){
      const total = this.qsa('.step').length;
      const done  = this.qsa('.step[data-status="done"]').length;
      const el = this.qs('[data-steps-count]');
      if (el) el.textContent = `${done}/${total}`;
    },

    setupEditing(){
      const list = this.qs('.steps-list');
      if (!list) return;

      const btnEdit   = this.qs('#btnEdit');
      const btnSave   = this.qs('#btnSave');
      const btnCancel = this.qs('#btnCancel');

      const storageKey = `steps:${location.pathname}`;

      const takeSnapshot = () => list.innerHTML;
      const restoreSnapshot = (html) => { list.innerHTML = html; };

      const saved = localStorage.getItem(storageKey);
      if (saved) restoreSnapshot(saved);

      const enableEditing = (enabled) => {
        list.querySelectorAll('.step .step-title').forEach(el => {
          el.setAttribute('contenteditable', enabled ? 'true' : 'false');
          el.classList.toggle('editable', !!enabled);
        });
        btnSave.disabled   = !enabled;
        btnCancel.disabled = !enabled;
        btnEdit.disabled   = !!enabled;
      };

      this.originalHTML = takeSnapshot();
      this.updateCounts();

      btnEdit?.addEventListener('click', () => {
        enableEditing(true);
        list.querySelector('.step .step-title')?.focus();
      });

      btnCancel?.addEventListener('click', () => {
        restoreSnapshot(this.originalHTML);
        enableEditing(false);
        this.updateCounts();
      });

      btnSave?.addEventListener('click', () => {
        const html = takeSnapshot();
        localStorage.setItem(storageKey, html);
        this.originalHTML = html;
        enableEditing(false);
        this.updateCounts();
        this.toast('Cambios guardados localmente.');
      });

      list.addEventListener('click', (e) => {
        const toggler = e.target.closest('[data-toggle-status]');
        if (toggler) {
          const li = toggler.closest('.step');
          li.dataset.status = li.dataset.status === 'done' ? 'pending' : 'done';
          this.updateCounts();
        }
      });
    },

    toast(msg){
      const t = document.createElement('div');
      t.className = 'toast';
      t.textContent = msg;
      document.body.appendChild(t);
      requestAnimationFrame(() => t.classList.add('show'));
      setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 300);
      }, 2000);
    }
  };

  window.Steps = Steps;

  document.addEventListener('DOMContentLoaded', () => {
    const mode = document.documentElement.getAttribute('data-mode') || 'client';
    Steps.init({ mode });
  });
})();
