(() => {
  const passwordButtons = document.querySelectorAll('[data-toggle-password]');
  const forms = document.querySelectorAll('[data-auth-form]');

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function setStatus(form, message, type = 'error') {
    const status = form.querySelector('[data-form-status]');
    if (!status) return;

    status.textContent = message;
    status.classList.toggle('is-success', type === 'success');
  }

  function formatPhone(input) {
    const digits = input.value.replace(/\D/g, '').slice(0, 11);

    if (digits.length <= 2) {
      input.value = digits;
      return;
    }

    if (digits.length <= 7) {
      input.value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      return;
    }

    input.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  passwordButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const field = button.parentElement.querySelector('input');
      const isHidden = field.type === 'password';

      field.type = isHidden ? 'text' : 'password';
      button.setAttribute('aria-label', isHidden ? 'Ocultar senha' : 'Mostrar senha');
      button.innerHTML = `<i data-lucide="${isHidden ? 'eye-off' : 'eye'}" aria-hidden="true"></i>`;
      refreshIcons();
    });
  });

  forms.forEach((form) => {
    const phone = form.querySelector('input[type="tel"]');

    if (phone) {
      phone.addEventListener('input', () => formatPhone(phone));
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        setStatus(form, 'Preencha os campos obrigatórios para continuar.');
        form.reportValidity();
        return;
      }

      if (form.dataset.authForm === 'register') {
        const password = form.querySelector('#password');
        const confirmPassword = form.querySelector('#confirm-password');

        if (password.value !== confirmPassword.value) {
          setStatus(form, 'As senhas precisam ser iguais.');
          confirmPassword.focus();
          return;
        }
      }

      const successMessage = form.dataset.authForm === 'login'
        ? 'Login validado. A integração com o sistema pode ser conectada na próxima etapa.'
        : 'Cadastro validado. Agora falta conectar o envio ao banco de dados.';

      setStatus(form, successMessage, 'success');
      form.reset();
    });
  });

  refreshIcons();
})();
