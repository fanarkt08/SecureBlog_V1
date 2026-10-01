const messages = {
  400: 'Email invalide ou mot de passe trop court (8 caractères minimum).',
  401: 'Email ou mot de passe incorrect.',
  409: 'Cet email est déjà utilisé.',
};

const oauthErrors = {
  google: 'Connexion avec Google impossible, réessayez.',
  google_cancelled: 'Connexion avec Google annulée.',
  google_email_taken: 'Un compte existe déjà avec cet email : connectez-vous avec votre mot de passe.',
  github: 'Connexion avec GitHub impossible, réessayez.',
  github_cancelled: 'Connexion avec GitHub annulée.',
  github_email_taken: 'Un compte existe déjà avec cet email : connectez-vous avec votre mot de passe.',
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
  const oauthError = oauthErrors[new URLSearchParams(location.search).get('error')];
  if (oauthError) loginForm.querySelector('.error').textContent = oauthError;
  api('GET', '/api/auth/me').then(({ ok }) => ok && location.replace('/blog'));
  bindForm(loginForm, '/api/auth/login', () => location.replace('/blog'));
}

if (registerForm) {
  bindForm(registerForm, '/api/auth/register', () => location.replace('/login'));
}

if (welcome) {
  api('GET', '/api/auth/me').then(({ ok, data }) => {
    if (!ok) return location.replace('/login');
    welcome.textContent = `Bienvenue, ${data.name || data.email}`;
  });
}
