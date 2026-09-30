const messages = {
  400: 'Email invalide ou mot de passe trop court (8 caractères minimum).',
  401: 'Email ou mot de passe incorrect.',
  409: 'Cet email est déjà utilisé.',
};

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

function bindForm(form, url, onSuccess) {
  const error = form.querySelector('.error');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    const { ok, status } = await api('POST', url, {
      email: form.email.value,
      password: form.password.value,
    });
    if (ok) return onSuccess();
    error.textContent = messages[status] ?? 'Erreur serveur, réessayez.';
  });
}

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const welcome = document.getElementById('welcome');

if (loginForm) {
  if (new URLSearchParams(location.search).get('error') === 'oauth') {
    loginForm.querySelector('.error').textContent = 'Connexion Google échouée, réessayez.';
  }
  api('GET', '/api/auth/me').then(({ ok }) => ok && location.replace('/blog'));
  bindForm(loginForm, '/api/auth/login', () => location.replace('/blog'));
}

if (registerForm) {
  bindForm(registerForm, '/api/auth/register', () => location.replace('/login'));
}

if (welcome) {
  api('GET', '/api/auth/me').then(({ ok, data }) => {
    if (!ok) return location.replace('/login');
    welcome.textContent = `Bienvenue, ${data.email}`;
  });
  document.getElementById('logout').addEventListener('click', async () => {
    await api('POST', '/api/auth/logout');
    location.replace('/login');
  });
}
