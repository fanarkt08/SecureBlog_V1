function navLink(href, text) {
  const a = document.createElement('a');
  a.href = href;
  a.className = 'btn small';
  a.textContent = text;
  return a;
}

async function renderUserNav(nav) {
  const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
  if (!res.ok) return;

  const user = await res.json();
  if (typeof user.picture === 'string' && user.picture.startsWith('https://')) {
    const img = document.createElement('img');
    img.src = user.picture;
    img.alt = '';
    img.className = 'avatar';
    img.setAttribute('referrerpolicy', 'no-referrer');
    nav.append(img);
  }
  const name = document.createElement('span');
  name.textContent = user.name || user.email;
  nav.append(name, navLink('/logout', 'Se déconnecter'));
}

fetch('/partials/header.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('header').innerHTML = html;
    renderUserNav(document.querySelector('.user-nav'));
  });
