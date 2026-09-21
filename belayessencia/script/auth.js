(() => {
  const passwordButtons = document.querySelectorAll('[data-toggle-password]');
  const forms = document.querySelectorAll('[data-auth-form]');
  const params = new URLSearchParams(window.location.search);

  const messages = {
    register: {
      error: {
        metodo: 'Envio inválido. Tente novamente pelo formulário.',
        campos: 'Preencha todos os campos obrigatórios.',
        email: 'Informe um e-mail válido.',
        senha_curta: 'A senha precisa ter pelo menos 6 caracteres.',
        senhas: 'As senhas precisam ser iguais.',
        termos: 'Confirme o aceite para continuar.',
        email_existente: 'Este e-mail já está cadastrado.',
        banco: 'Não foi possível salvar seu cadastro agora. Tente novamente em instantes.',
      },
    },
    login: {
      success: {
        cadastro: 'Cadastro realizado com sucesso. Agora entre com seu e-mail e senha.',
      },
      error: {
        metodo: 'Envio inválido. Tente novamente pelo formulário.',
        campos: 'Preencha e-mail e senha para entrar.',
        email: 'Informe um e-mail válido.',
        credenciais: 'E-mail ou senha incorretos.',
        inativo: 'Este cadastro está inativo. Fale com a equipe Bela Y Essência.',
        banco: 'Não foi possível entrar agora. Tente novamente em instantes.',
      },
    },
  };

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
    const formType = form.dataset.authForm;

    if (phone) {
      phone.addEventListener('input', () => formatPhone(phone));
    }

    const successCode = params.get('sucesso');
    const errorCode = params.get('erro');

    if (successCode && messages[formType]?.success?.[successCode]) {
      setStatus(form, messages[formType].success[successCode], 'success');
    }

    if (errorCode && messages[formType]?.error?.[errorCode]) {
      setStatus(form, messages[formType].error[errorCode]);
    }

    form.addEventListener('submit', (event) => {
      if (!form.checkValidity()) {
        event.preventDefault();
        setStatus(form, 'Preencha os campos obrigatórios para continuar.');
        form.reportValidity();
        return;
      }

      if (form.dataset.authForm === 'register') {
        const password = form.querySelector('#password');
        const confirmPassword = form.querySelector('#confirm-password');

        if (password.value !== confirmPassword.value) {
          event.preventDefault();
          setStatus(form, 'As senhas precisam ser iguais.');
          confirmPassword.focus();
        }
      }
    });
  });

  refreshIcons();
})();
