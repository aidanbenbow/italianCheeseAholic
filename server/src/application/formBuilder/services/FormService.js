export default class FormService {
  constructor(formRepo) {
    this.formRepo = formRepo;
  }

  create(form) {
    return this.formRepo.createForm(form);
  }

  update(formId, updates) {
    return this.formRepo.updateForm(formId, updates);
  }

  delete(formId) {
    return this.formRepo.deleteForm(formId);
  }

  fetch(formId) {
    return this.formRepo.fetchForm(formId);
  }

  fetchAll() {
    return this.formRepo.fetchAllForms();
  }
}
