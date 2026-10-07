(() => {
  const form = document.getElementById('profile-form');
  const message = document.getElementById('profile-message');
  const summary = document.getElementById('profile-summary');
  const submitButton = document.getElementById('profile-submit');
  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const phoneInput = document.getElementById('profile-phone');
  const locationInput = document.getElementById('profile-location');
  const fileInput = document.getElementById('foto-perfil');
  const photo = document.getElementById('profile-photo');
  const initialsText = document.getElementById('profile-initials');

  const dataUrl = '../../processos/perfil_dados.php';

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

  function showMessage(text, type = 'error') {
    message.textContent = text;
    message.classList.remove('hidden', 'is-success');
    message.classList.toggle('is-success', type === 'success');
  }

  function clearMessage() {
    message.textContent = '';
    message.classList.add('hidden');
    message.classList.remove('is-success');
  }

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? 'Salvando...' : 'Salvar dados';
  }

  function redirectToLogin(data) {
    const loginUrl = data?.redirect || 'login.html?erro=sessao';
    window.location.href = loginUrl.replace('../belayessencia/html/', '');
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    const data = await response.json().catch(() => null);

    if (response.status === 401) {
      redirectToLogin(data);
      throw new Error('Sessão expirada.');
    }

    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || 'Não foi possível completar a solicitação.');
    }

    return data;
  }

  function renderPhoto(user) {
    initialsText.textContent = initials(user.nome);

    if (!user.foto_url) {
      photo.hidden = true;
      photo.removeAttribute('src');
      initialsText.hidden = false;
      return;
    }

    photo.src = user.foto_url;
    photo.hidden = false;
    initialsText.hidden = true;
  }

  function renderUser(user) {
    nameInput.value = user.nome || '';
    emailInput.value = user.email || '';
    phoneInput.value = user.telefone || '';
    locationInput.value = user.localizacao || '';
    summary.textContent = user.telefone ? `${user.nome} · ${user.email} · ${user.telefone}` : `${user.nome} · ${user.email}`;
    renderPhoto(user);
  }

  async function loadProfile() {
    try {
      const data = await requestJson(dataUrl);
      renderUser(data.usuario);
      clearMessage();
    } catch (error) {
      showMessage(error.message);
    }
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    clearMessage();

    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      fileInput.value = '';
      showMessage('Use uma imagem JPG, PNG ou WEBP.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      fileInput.value = '';
      showMessage('Envie uma foto com até 2 MB.');
      return;
    }

    photo.src = URL.createObjectURL(file);
    photo.hidden = false;
    initialsText.hidden = true;
  });

  photo.addEventListener('error', () => {
    photo.hidden = true;
    initialsText.hidden = false;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage();

    if (!nameInput.value.trim() || !phoneInput.value.trim()) {
      showMessage('Informe nome e telefone para salvar.');
      return;
    }

    setLoading(true);

    try {
      const data = await requestJson(form.action, {
        method: 'POST',
        body: new FormData(form),
      });
      renderUser(data.usuario);
      fileInput.value = '';
      window.dispatchEvent(new CustomEvent('account:updated', { detail: data.usuario }));
      showMessage(data.message || 'Dados atualizados com sucesso.', 'success');
    } catch (error) {
      showMessage(error.message);
    } finally {
      setLoading(false);
    }
  });

  refreshIcons();
  loadProfile();
})();
