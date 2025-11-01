(() => {
  const Steps = {
    mode: 'client',
    agentEmail: 'ejecutiva@clinyco.cl',
    originalData: [],
    storageKeyValue: null,
    agentEmail: null,
    originalHTML: null,

    init({ mode = 'client' } = {}) {
      this.mode = mode;
      this.agentEmail = this.getAgentEmail();
      this.storageKeyValue = this.makeStorageKey();
      if (mode === 'agent') {
        this.restoreFromLocalStorage();
      }
      this.setupMailtoButton();
      if (mode === 'agent') this.setupEditing();
      this.updateCounts();
    },

    qs(sel){ return document.querySelector(sel); },
    qsa(sel){ return Array.from(document.querySelectorAll(sel)); },

    makeStorageKey(){
      return `steps:${location.pathname}`;
    },

    getChecklistKey(){
      const url = new URL(window.location.href);
      return url.searchParams.get('key') || 'client-onboarding-v1';
    },

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

    collectSteps(){
      return this.qsa('.step').map((li, idx) => {
        const noteEl = li.querySelector('.step-note');
        const descEl = li.querySelector('.step-desc');
        const dataHref = li.getAttribute('data-href') || li.querySelector('.step-info')?.getAttribute('href') || '';
        return {
          id: li.getAttribute('data-step-id') || `s${idx + 1}`,
          title: li.querySelector('.step-title')?.textContent?.trim() || `Paso ${idx + 1}`,
          desc: descEl ? descEl.textContent.trim() : '',
          href: dataHref,
          note: noteEl ? noteEl.value.trim() : '',
          status: (li.getAttribute('data-status') || 'pending').toLowerCase() === 'done' ? 'done' : 'pending',
          order: idx + 1,
        };
      });
    },

    applySteps(data){
      const list = this.qs('.steps-list');
      if (!list || !Array.isArray(data)) return;
      data.forEach((step) => {
        const li = list.querySelector(`.step[data-step-id="${step.id}"]`);
        if (!li) return;
        li.setAttribute('data-step-id', step.id);
        li.setAttribute('data-status', step.status);
        const titleEl = li.querySelector('.step-title');
        if (titleEl) titleEl.textContent = step.title;
        const descEl = li.querySelector('.step-desc');
        if (descEl) descEl.textContent = step.desc || '';
        const noteEl = li.querySelector('.step-note');
        if (noteEl) noteEl.value = step.note || '';
        const info = li.querySelector('.step-info');
        if (step.href) {
          li.setAttribute('data-href', step.href);
          if (info) {
            info.setAttribute('href', step.href);
            info.removeAttribute('hidden');
          }
        } else {
          li.removeAttribute('data-href');
          if (info) {
            info.removeAttribute('href');
            info.setAttribute('hidden', '');
          }
        }
      });
      this.updateCounts();
    },

    restoreFromLocalStorage(){
      try {
        const saved = localStorage.getItem(this.storageKeyValue);
        if (saved) {
          const data = JSON.parse(saved);
          if (Array.isArray(data)) {
            this.applySteps(data);
            this.originalData = data;
            return;
          }
        }
      } catch (error) {
        console.warn('No se pudo cargar pasos guardados localmente', error);
      }
      this.originalData = this.collectSteps();
    },

    saveToLocalStorage(data){
      try {
        localStorage.setItem(this.storageKeyValue, JSON.stringify(data));
      } catch (error) {
        console.warn('No se pudo guardar pasos localmente', error);
      }
    },

    updateCounts(){
      const total = this.qsa('.step').length;
      const done  = this.qsa('.step[data-status="done"]').length;
      const el = this.qs('[data-steps-count]');
      if (el) el.textContent = `${done}/${total}`;
    },

    enableEditing(list, enabled){
      list.querySelectorAll('.step .step-title').forEach(el => {
        el.setAttribute('contenteditable', enabled ? 'true' : 'false');
        el.classList.toggle('editable', !!enabled);
      });
      list.querySelectorAll('.step .step-desc').forEach(el => {
        el.setAttribute('contenteditable', enabled ? 'true' : 'false');
      });
      list.querySelectorAll('.step .step-note').forEach(el => {
        el.toggleAttribute('readonly', !enabled);
      });
    },

    setupEditing(){
      const list = this.qs('.steps-list');
      if (!list) return;

      const btnEdit   = this.qs('#btnEdit');
      const btnSave   = this.qs('#btnSave');
      const btnCancel = this.qs('#btnCancel');

      const setButtons = (editing) => {
        if (btnSave) btnSave.disabled = !editing;
        if (btnCancel) btnCancel.disabled = !editing;
        if (btnEdit) btnEdit.disabled = editing;
      };

      this.enableEditing(list, false);
      setButtons(false);

      btnEdit?.addEventListener('click', () => {
        this.originalData = this.collectSteps();
        this.enableEditing(list, true);
        setButtons(true);
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
        this.applySteps(this.originalData);
        this.enableEditing(list, false);
        setButtons(false);
      });

      btnSave?.addEventListener('click', async () => {
        const data = this.collectSteps();
        this.saveToLocalStorage(data);
        this.originalData = data;
        this.enableEditing(list, false);
        setButtons(false);
        this.updateCounts();
        this.toast('Cambios guardados localmente.');
        const key = this.getChecklistKey();
        await this.persistChecklistToSell(key, data);
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
          if (!li) return;
          const nextStatus = li.getAttribute('data-status') === 'done' ? 'pending' : 'done';
          li.setAttribute('data-status', nextStatus);
          li.dataset.status = li.dataset.status === 'done' ? 'pending' : 'done';
          this.updateCounts();
        }
      });
    },

    async persistChecklistToSell(key, stepsData){
      const steps = stepsData ?? this.collectSteps();
      try {
        const apiBase = '/api';
        const resList = await fetch(`${apiBase}/checklists/${encodeURIComponent(key)}/steps`);
        if (!resList.ok) throw new Error('API list failed');
        const server = await resList.json();
        const byId = new Map((server.data || []).map((s) => [s.id, s]));
        let hadError = false;

        for (const step of steps) {
          const existing = byId.get(step.id);
          const payload = { ...step };
          if (existing) {
            payload.updated_at = existing.updated_at;
          }
          const method = existing ? 'PUT' : 'POST';
          const url = existing
            ? `${apiBase}/checklists/${encodeURIComponent(key)}/steps/${encodeURIComponent(step.id)}`
            : `${apiBase}/checklists/${encodeURIComponent(key)}/steps`;

          const resp = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'x-agent-email': this.agentEmail || '',
            },
            body: JSON.stringify(payload),
          });

          if (resp.status === 403) {
            console.warn('Agente no autorizado para persistir', this.agentEmail);
            this.toast('No autorizado para sincronizar en Sell. Verifica tu acceso.');
            return;
          }

          if (resp.status === 409) {
            console.warn('Conflicto por versión, recarga para obtener los últimos datos', step.id);
            hadError = true;
          } else if (!resp.ok) {
            console.warn('Fallo al persistir paso', step.id, await resp.text());
            hadError = true;
          }
        }
        if (hadError) {
          this.toast('Checklist sincronizado parcialmente. Revisa los conflictos.');
        } else {
          this.toast('Checklist sincronizado con Clinyco (Sell).');
        }
      } catch (error) {
        console.warn('Sin backend o error de API; se mantiene guardado local:', error);
        this.toast('Guardado local (sin backend).');
      }
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
