if (window.NoxApi?.isLoggedIn()) {
  const detailHeader = document.querySelector('.detail-header');
  const backLink = detailHeader?.querySelector('.back-link');
  if (detailHeader && backLink) {
    const navGroup = document.createElement('div');
    navGroup.style.cssText = 'display: flex; align-items: center; gap: 20px;';

    const contaLink = document.createElement('a');
    contaLink.className = 'back-link';
    contaLink.href = '../account/account.html';
    contaLink.textContent = 'Conta';

    backLink.replaceWith(navGroup);
    navGroup.append(contaLink, backLink);
  }
}

const params = new URLSearchParams(window.location.search);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const setText = (selector, value) => {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
};

const loadDetail = async () => {
  try {
    const suites = await window.NoxApi.listSuites();
    if (!suites.length) {
      setText('.detail-feedback', 'Nenhuma suíte cadastrada no momento.');
      return null;
    }

    const suiteId = params.get('suite') || suites[0].id;
    const suite = await window.NoxApi.getSuite(suiteId);

    document.title = `${suite.name} | BUSCAMOR Motel`;
    setText('#suiteNumber', suite.number);
    setText('#suiteName', suite.name);
    setText('#suiteSummary', suite.description);
    setText('#suiteHeadline', suite.headline);
    setText('#suiteDescription', suite.longDescription);
    document.querySelector('#suiteImage').style.backgroundImage = `url("${suite.image}")`;

    document.querySelector('#suiteAmenities').innerHTML = suite.amenities
      .map((amenity) => `<li>${amenity}</li>`)
      .join('');

    document.querySelector('#otherSuiteLinks').innerHTML = suites
      .filter((item) => item.id !== suite.id)
      .map((item) => `<a href="quarto.html?suite=${item.id}">${item.name} <span>↗</span></a>`)
      .join('');

    return suite;
  } catch (error) {
    setText('.detail-feedback', error.message);
    return null;
  }
};

const suitePromise = loadDetail();

document.querySelector('.detail-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const feedback = document.querySelector('.detail-feedback');
  const form = new FormData(event.currentTarget);

  feedback.textContent = 'Consultando disponibilidade...';

  try {
    const suite = await suitePromise;
    if (!suite) return;

    const result = await window.NoxApi.checkAvailability({
      date: form.get('date'),
      arrivalTime: form.get('arrivalTime'),
      duration: form.get('duration')
    });

    const livre = result.suites.some((s) => s.id === suite.id);
    if (!livre) {
      feedback.textContent = 'Esta suíte já está reservada para o horário informado.';
      return;
    }

    const query = new URLSearchParams({
      unit: 'moema',
      date: form.get('date'),
      arrivalTime: form.get('arrivalTime'),
      duration: form.get('duration'),
      suite: suite.id
    });

    window.location.href = `../reserva/reserva.html?${query}`;
  } catch (error) {
    feedback.textContent = error.message;
  }
});

const revealItems = document.querySelectorAll('.reveal');
if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const hojeISO = new Date().toLocaleDateString('en-CA');
document.querySelectorAll('input[type="date"]').forEach((input) => {
  input.min = hojeISO;
  if (!input.value || input.value < hojeISO) {
    input.value = hojeISO;
  }
});
