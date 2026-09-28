const articleForm = document.getElementById('article-form');
const articlesBox = document.getElementById('articles');

function renderArticle(a) {
  const card = document.createElement('div');
  card.className = 'card article';

  const title = document.createElement('h4');
  title.textContent = a.title;

  const content = document.createElement('p');
  content.textContent = a.content;

  const meta = document.createElement('span');
  meta.className = 'muted';
  meta.textContent = `${a.author} — ${new Date(a.created_at).toLocaleString('fr-FR')}`;

  card.append(title, content, meta);
  return card;
}

async function loadArticles() {
  const { ok, status, data } = await api('GET', '/api/articles');
  if (status === 401) return location.replace('/login');
  if (!ok) return;
  articlesBox.replaceChildren(...data.map(renderArticle));
}

if (articleForm) {
  const error = articleForm.querySelector('.error');
  articleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    const { ok, status } = await api('POST', '/api/articles', {
      title: articleForm.title.value,
      content: articleForm.content.value,
    });
    if (status === 401) return location.replace('/login');
    if (!ok) {
      error.textContent = 'Titre et contenu obligatoires.';
      return;
    }
    articleForm.reset();
    loadArticles();
  });
  loadArticles();
}