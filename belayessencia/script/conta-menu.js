(() => {
  const containers = [...document.querySelectorAll('[data-account-menu]')];
  if (!containers.length) return;

  const statusUrl = '../../processos/sessao_status.php';

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function initials(name) {
    return String(name || 'Cliente')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'C';
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function avatarMarkup(user) {
    const fallback = escapeHtml(initials(user?.nome));

    if (!user?.foto_url) {
      return `<span class="account-menu__avatar" aria-hidden="true">${fallback}</span>`;
    }

    return `
      <span class="account-menu__avatar" aria-hidden="true">
        <img src="${escapeHtml(user.foto_url)}" alt="" onerror="this.hidden = true; this.nextElementSibling.hidden = false">
        <span hidden>${fallback}</span>
      </span>
    `;
  }

  function renderLogin(container) {
    container.classList.remove('is-open');
    container.innerHTML = '<a class="account-menu__login" href="login.html">Entrar</a>';
  }

  function closeAll(except = null) {
    containers.forEach((container) => {
      if (container !== except) {
        container.classList.remove('is-open');
        const button = container.querySelector('.account-menu__trigger');
        if (button) button.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function renderMenu(container, user, index) {
    const panelId = `account-menu-panel-${index}`;
    const name = escapeHtml(user?.nome || 'Minha conta');
    const email = escapeHtml(user?.email || '');

    container.innerHTML = `
      <button class="account-menu__trigger" type="button" aria-expanded="false" aria-controls="${panelId}">
        ${avatarMarkup(user)}
        <span class="account-menu__name">${name}</span>
        <i class="account-menu__icon" data-lucide="chevron-down" aria-hidden="true"></i>
      </button>
      <div class="account-menu__panel" id="${panelId}">
        <div class="account-menu__summary">
          <strong>${name}</strong>
          <span>${email}</span>
        </div>
        <a class="account-menu__item" href="meus-agendamentos.html">
          <i data-lucide="calendar-check" aria-hidden="true"></i>
          <span>Meus agendamentos</span>
        </a>
        <a class="account-menu__item" href="meus-dados.html">
          <i data-lucide="user-round-cog" aria-hidden="true"></i>
          <span>Meus dados</span>
        </a>
        <a class="account-menu__item" href="../../processos/logout.php">
          <i data-lucide="log-out" aria-hidden="true"></i>
          <span>Sair</span>
        </a>
      </div>
    `;

    const button = container.querySelector('.account-menu__trigger');
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = !container.classList.contains('is-open');
      closeAll(container);
      container.classList.toggle('is-open', willOpen);
      button.setAttribute('aria-expanded', String(willOpen));
    });
  }

  containers.forEach(renderLogin);

  fetch(statusUrl, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (!data?.autenticado) return;

      containers.forEach((container, index) => renderMenu(container, data.usuario, index));
      refreshIcons();
    })
    .catch(() => {})
    .finally(refreshIcons);

  document.addEventListener('click', () => closeAll());
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });
  window.addEventListener('account:updated', (event) => {
    containers.forEach((container, index) => renderMenu(container, event.detail, index));
    refreshIcons();
  });
})();
