const form = document.getElementById('booking-form');
    const status = document.getElementById('form-status');
    const submitButton = document.getElementById('submit-button');
    const successState = document.getElementById('success-state');
    const newBooking = document.getElementById('new-booking');

    const dataHandler = { onDataChanged() {} };

    async function initializeSheet() {
      const result = await window.dataSdk.init(dataHandler);
      if (!result.isOk) status.textContent = 'Não foi possível preparar o agendamento. Tente novamente em instantes.';
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      submitButton.disabled = true;
      status.textContent = 'Enviando seu pedido de agendamento...';

      const formData = new FormData(form);
      const record = {
        name: formData.get('name').trim(),
        phone: formData.get('phone').trim(),
        email: formData.get('email').trim(),
        service: formData.get('service'),
        date: formData.get('date'),
        time: formData.get('time'),
        notes: formData.get('notes').trim()
      };

      const result = await window.dataSdk.create(record);
      submitButton.disabled = false;

      if (result.isOk) {
        form.reset();
        form.classList.add('hidden');
        successState.classList.remove('hidden');
        status.textContent = '';
      } else {
        status.textContent = 'Não conseguimos enviar agora. Revise os dados e tente novamente.';
      }
    });

    newBooking.addEventListener('click', () => {
      successState.classList.add('hidden');
      form.classList.remove('hidden');
      document.getElementById('name').focus();
    });

    initializeSheet();