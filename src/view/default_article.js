fetch('/partials/article.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('default-article').innerHTML = html;
  });