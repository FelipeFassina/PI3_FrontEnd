(async function () {
  const flow = window.NoxFlow;
  const app = document.querySelector('#app');

  const header = () => {
    const contaLink = window.NoxApi?.isLoggedIn()
      ? '<a class="back-link" href="../account/account.html">Conta</a>'
      : '';

    return `
      <header class="app-header">
        <a class="brand" href="../home/index.html">
          <span>BUSCAMOR</span>
          <small>MOTEL</small>
        </a>
        <div style="display: flex; align-items: center; gap: 20px;">
          ${contaLink}
          <a class="back-link" href="../home/index.html">← Início</a>
        </div>
      </header>
    `;
  };

  const shell = (content) => `
    ${header()}
    <main class="flow-shell">${content}</main>
  `;

  const intro = (eyebrow, title, description) => `
    <div class="flow-intro">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
      <p>${description}</p>
    </div>
  `;

  const renderReservations = async () => {
    if (!window.NoxApi.isLoggedIn()) {
      app.innerHTML = shell(`
        ${intro('Área do hóspede', 'Minhas<br /><em>reservas.</em>', 'Faça login para visualizar suas reservas.')}
        <a class="button button-dark" href="../account/account.html">Entrar na conta <span>↗</span></a>
      `);
      return;
    }

    try {
      const reservas = await window.NoxApi.getMinhasReservas();

      if (!reservas.length) {
        app.innerHTML = shell(`
          ${intro('Área do hóspede', 'Minhas<br /><em>reservas.</em>', 'Acompanhe seus momentos reservados.')}
          <section class="reservation-list">
            <p class="form-feedback">Você ainda não possui reservas.</p>
          </section>
        `);
        return;
      }

      const cards = reservas
        .map(
          (r) => `
            <article class="saved-reservation">
              <div>
                <span class="status-badge">${r.status}</span>
                <h2>Suíte ${r.numeroQuarto} · ${r.nomeQuarto}</h2>
                <p>Check-in: ${flow.formatDateTime(r.dataCheckIn)} · Check-out: ${flow.formatDateTime(r.dataCheckOut)}</p>
              </div>
              <div>
                <strong>Reserva #${r.id} · ${window.NoxApi.formatPrice(r.valorTotal)}</strong>
                <div style="margin-top: 8px; display: flex; gap: 12px;">
                  ${
                    r.status === 'PENDENTE'
                      ? `<button class="button button-dark" data-pagar="${r.id}">Pagar agora</button>`
                      : ''
                  }
                  ${
                    r.status === 'PENDENTE' || r.status === 'CONFIRMADA'
                      ? `<button class="button button-outline" data-cancelar="${r.id}">Cancelar</button>`
                      : ''
                  }
                </div>
              </div>
            </article>
          `
        )
        .join('');

      app.innerHTML = shell(`
        ${intro('Área do hóspede', 'Minhas<br /><em>reservas.</em>', 'Acompanhe seus momentos reservados.')}
        <section class="reservation-list">${cards}</section>
      `);

      document.querySelectorAll('[data-pagar]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          btn.textContent = 'Abrindo MP...';
          try {
            const checkout = await window.NoxApi.iniciarPagamentoReserva(btn.dataset.pagar);
            window.open(checkout.checkoutUrl, '_blank', 'noopener,noreferrer');
            btn.disabled = false;
            btn.textContent = 'Pagar agora';
          } catch (err) {
            alert(err.message);
            btn.disabled = false;
            btn.textContent = 'Pagar agora';
          }
        });
      });

      document.querySelectorAll('[data-cancelar]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('Deseja realmente cancelar esta reserva?')) return;
          try {
            await window.NoxApi.cancelarReserva(btn.dataset.cancelar);
            renderReservations();
          } catch (err) {
            alert(err.message);
          }
        });
      });
    } catch (error) {
      app.innerHTML = shell(
        intro('Área do hóspede', 'Erro ao carregar<br /><em>reservas.</em>', error.message)
      );
    }
  };

  await renderReservations();
})();
