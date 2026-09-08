(() => {
      const form = document.getElementById('booking-form');
      const procedure = document.getElementById('procedure');
      const dateInput = document.getElementById('booking-date');
      const nameInput = document.getElementById('full-name');
      const whatsappInput = document.getElementById('whatsapp');
      const timeButtons = [...document.querySelectorAll('.time-slot')];
      const message = document.getElementById('form-message');
      const submitButton = document.getElementById('submit-button');
      const bookingView = document.getElementById('booking-view');
      const successView = document.getElementById('success-view');
      const newBookingButton = document.getElementById('new-booking');
      const summary = document.getElementById('confirmation-summary');

      let selectedTime = '';
      let recordCount = 0;
      let sdkReady = false;

      const today = new Date();
      const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
      dateInput.min = localToday;

      function showMessage(text, type) {
        message.textContent = text;
        message.classList.remove('hidden', 'text-[#a15e52]', 'text-[#55745b]');
        message.classList.add(type === 'error' ? 'text-[#a15e52]' : 'text-[#55745b]');
      }

      function clearMessage() {
        message.textContent = '';
        message.classList.add('hidden');
      }

      function formatDate(value) {
        const [year, month, day] = value.split('-');
        return new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }).format(new Date(Number(year), Number(month) - 1, Number(day)));
      }

      timeButtons.forEach((button) => {
        button.addEventListener('click', () => {
          selectedTime = button.dataset.time;
          timeButtons.forEach((item) => {
            const active = item === button;
            item.classList.toggle('is-selected', active);
            item.setAttribute('aria-pressed', String(active));
          });
          clearMessage();
        });
      });

      whatsappInput.addEventListener('input', () => {
        const digits = whatsappInput.value.replace(/\D/g, '').slice(0, 11);
        if (digits.length <= 2) whatsappInput.value = digits;
        else if (digits.length <= 7) whatsappInput.value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        else whatsappInput.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
      });

      const dataHandler = {
        onDataChanged(data) {
          recordCount = data.length;
        }
      };

      async function initialiseData() {
        const result = await window.dataSdk.init(dataHandler);
        sdkReady = result.isOk;
        if (!result.isOk) {
          showMessage('Não foi possível preparar o envio agora. Tente novamente em instantes.', 'error');
        }
      }

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearMessage();

        if (!procedure.value || !dateInput.value || !selectedTime || !nameInput.value.trim() || !whatsappInput.value.trim()) {
          showMessage('Preencha os seus dados e selecione procedimento, data e horário para continuar.', 'error');
          return;
        }

        if (recordCount >= 999) {
          showMessage('A agenda recebeu muitas solicitações. Por favor, tente novamente mais tarde.', 'error');
          return;
        }

        if (!sdkReady) {
          showMessage('Estamos preparando o envio. Aguarde um instante e tente novamente.', 'error');
          return;
        }

        submitButton.disabled = true;
        submitButton.classList.add('is-loading');

        const booking = {
          nome: nameInput.value.trim(),
          whatsapp: whatsappInput.value.trim(),
          procedimento: procedure.value,
          data: dateInput.value,
          horario: selectedTime,
          created_at: new Date().toISOString()
        };

        const result = await window.dataSdk.create(booking);

        submitButton.disabled = false;
        submitButton.classList.remove('is-loading');

        if (!result.isOk) {
          showMessage('Não foi possível enviar sua solicitação. Confira os dados e tente novamente.', 'error');
          return;
        }

        summary.textContent = `${booking.nome}, recebemos sua solicitação para ${booking.procedimento} no dia ${formatDate(booking.data)}, às ${booking.horario}.`;
        bookingView.classList.add('hidden-view');
        successView.classList.remove('hidden-view');
        lucide.createIcons();
      });

      newBookingButton.addEventListener('click', () => {
        form.reset();
        selectedTime = '';
        timeButtons.forEach((button) => {
          button.classList.remove('is-selected');
          button.setAttribute('aria-pressed', 'false');
        });
        clearMessage();
        successView.classList.add('hidden-view');
        bookingView.classList.remove('hidden-view');
        procedure.focus();
      });

      lucide.createIcons();
      initialiseData();
    })();