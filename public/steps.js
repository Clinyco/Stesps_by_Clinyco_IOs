(function () {
  const params = new URLSearchParams(window.location.search);
  const agentEmail = params.get('agent') || params.get('email');
  const stepsList = document.querySelector('.step-list');
  const mailButton = document.getElementById('contact-agent');

  function computeMailto() {
    if (!mailButton || !agentEmail) return;
    const steps = stepsList ? stepsList.querySelectorAll('li').length : 0;
    const subject = encodeURIComponent(`Solicitud de gestión – Pasos ${steps}`);
    const body = encodeURIComponent(
      `Hola,\n\nNecesito apoyo con los pasos (${steps} en total).\n\nGracias.`
    );
    mailButton.href = `mailto:${agentEmail}?subject=${subject}&body=${body}`;
  }

  if (mailButton) {
    if (!agentEmail) {
      mailButton.classList.add('hidden');
    } else {
      computeMailto();
    }
  }

  const isAgentPage = document.body.dataset.mode === 'agent';

  if (!isAgentPage) {
    return;
  }

  const storageKey = 'clinyco-agent-steps';
  const textarea = document.getElementById('steps-editor');
  const preview = document.getElementById('steps-preview');
  const saveBtn = document.getElementById('save-steps');
  const editBtn = document.getElementById('edit-steps');
  const cancelBtn = document.getElementById('cancel-steps');

  function renderPreview(markdown) {
    if (!preview) return;
    preview.innerHTML = '';
    const lines = markdown.split('\n').filter(Boolean);
    lines.forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      preview.appendChild(li);
    });
    computeMailto();
  }

  function enterEditMode() {
    textarea.classList.remove('hidden');
    saveBtn.classList.remove('hidden');
    cancelBtn.classList.remove('hidden');
    editBtn.classList.add('hidden');
  }

  function exitEditMode() {
    textarea.classList.add('hidden');
    saveBtn.classList.add('hidden');
    cancelBtn.classList.add('hidden');
    editBtn.classList.remove('hidden');
  }

  const saved = localStorage.getItem(storageKey);
  if (saved && textarea) {
    textarea.value = saved;
    renderPreview(saved);
  }

  if (editBtn) {
    editBtn.addEventListener('click', () => {
      enterEditMode();
    });
  }

  if (cancelBtn && textarea) {
    cancelBtn.addEventListener('click', () => {
      exitEditMode();
      textarea.value = saved ?? textarea.value;
    });
  }

  if (saveBtn && textarea) {
    saveBtn.addEventListener('click', () => {
      const value = textarea.value;
      localStorage.setItem(storageKey, value);
      renderPreview(value);
      exitEditMode();
    });
  }
})();
