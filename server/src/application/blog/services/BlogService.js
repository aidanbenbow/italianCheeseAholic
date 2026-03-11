export default class BlogService {
  constructor(articleRepo) {
    this.articleRepo = articleRepo;
  }

  create(article) {
    return this.articleRepo.createArticle(article);
  }

  update(articleId, updates) {
    return this.articleRepo.updateArticle(articleId, updates);
  }

  fetch(articleId) {
    return this.articleRepo.fetchArticle(articleId);
  }

  fetchAll() {
    return this.articleRepo.fetchAllArticles();
  }

  delete(articleId) {
    return this.articleRepo.deleteArticle(articleId);
  }
}
