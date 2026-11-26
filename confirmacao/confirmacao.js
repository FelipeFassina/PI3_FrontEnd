(function () {
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

  const urlParams = new URLSearchParams(window.location.search);
  const statusMP = urlParams.get('status') || 'pendente';
  const lastRes = JSON.parse(sessionStorage.getItem('noxLastReservation') || '{}');

  const titulos = {
    aprovado: ['Pagamento aprovado', 'Seu momento<br /><em>está confirmado.</em>'],
    pendente: ['Pagamento em análise', 'Sua reserva<br /><em>foi registrada.</em>'],
    recusado: ['Pagamento não concluído', 'Tente novamente<br /><em>em Minhas Reservas.</em>']
  };

  const [eyebrow, titulo] = titulos[statusMP] || titulos.pendente;

  document.body.classList.add('confirmation-page');
  app.innerHTML = `
    ${header()}
    <main class="confirmation">
      <div class="success-mark">${statusMP === 'recusado' ? '!' : '✓'}</div>
      <p class="eyebrow">${eyebrow}</p>
      <h1>${titulo}</h1>
      <p class="confirmation-copy">
        Apresente seu código de reserva e CPF na recepção ao chegar.
      </p>
      <div class="confirmation-code">
        <span>Código da reserva</span>
        <strong>#${lastRes.id || '---'}</strong>
      </div>
      <div class="confirmation-actions">
        <a class="button button-dark" href="../minhas-reservas/minhas-reservas.html">
          Ver minhas reservas <span>↗</span>
        </a>
        <a class="text-link" href="../home/index.html">Voltar para o início</a>
      </div>
    </main>
  `;
})();
