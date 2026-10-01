async function renderUserNav(nav) {
  const res = await fetch('/api/auth/me');
  if (!res.ok) return;

  const user = await res.json();
  if (user.picture?.startsWith('https://')) {
    const img = document.createElement('img');
    img.src = user.picture;
    img.alt = '';
    img.className = 'avatar';
    img.setAttribute('referrerpolicy', 'no-referrer');
    nav.append(img);
  }
  const name = document.createElement('span');
  name.textContent = user.name || user.email;
  const logout = document.createElement('button');
  logout.type = 'button';
  logout.className = 'btn small';
  logout.textContent = 'Se déconnecter';
  logout.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    location.replace('/login');
  });
  nav.append(name, logout);
}

fetch('/partials/header.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('header').innerHTML = html;
    renderUserNav(document.querySelector('.user-nav'));
  });
