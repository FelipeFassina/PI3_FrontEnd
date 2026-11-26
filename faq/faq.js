(function () {
  const app = document.querySelector('#app');

  const contaLink = window.NoxApi?.isLoggedIn()
    ? '<a class="back-link" href="../account/account.html">Conta</a>'
    : '';

  const questions = [
    [
      'Preciso reservar com antecedência?',
      'Não. Você pode consultar a disponibilidade e reservar na hora. Para garantir uma suíte específica, recomendamos o agendamento.'
    ],
    [
      'Quais formas de pagamento são aceitas?',
      'Aceitamos Pix, Cartão de Crédito e Débito através do checkout seguro do Mercado Pago.'
    ],
    [
      'Posso cancelar ou alterar minha reserva?',
      'Sim. Consulte sua reserva pela área do hóspede em Minhas Reservas.'
    ],
    [
      'O BUSCAMOR funciona 24 horas?',
      'Sim. Funcionamos todos os dias, 24 horas.'
    ]
  ];

  const faqItems = questions
    .map(
      ([question, answer], index) => `
        <details${index === 0 ? ' open' : ''}>
          <summary>${question}</summary>
          <p>${answer}</p>
        </details>
      `
    )
    .join('');

  app.innerHTML = `
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
    <main class="flow-shell">
      <div class="flow-intro">
        <p class="eyebrow">Tudo bem saber</p>
        <h1>Perguntas<br /><em>frequentes.</em></h1>
        <p>As respostas para você chegar tranquilo e aproveitar cada minuto.</p>
      </div>
      <section class="faq-list">${faqItems}</section>
    </main>
  `;
})();
