fetch('/partials/sign_in.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('sign_in').innerHTML = html;
  });
