export default class FormService {
  constructor(formRepo) {
    this.formRepo = formRepo;
  }

  // ========================
  // 📝 FORM
  // ========================

  create(form) {
    return this.formRepo.createForm(form);
  }

  update(formId, updates) {
    return this.formRepo.updateForm(formId, updates);
  }

  async delete(formId) {
    // ⚠️ must delete ALL items (form + results)
    return this.formRepo.deleteFormCascade(formId);
  }

  fetch(formId) {
    return this.formRepo.getForm(formId);
  }

  fetchAll(options) {
  return this.formRepo.fetchAllForms(options);
}

  // ========================
  // 📊 RESULTS
  // ========================

  submit(formId, answers) {
    return this.formRepo.submitResult(formId, answers);
  }

  fetchResults(formId, options) {
    return this.formRepo.getResults(formId, options);
  }

  // ========================
  // 🔗 COMPOSED
  // ========================

  fetchWithResults(formId) {
    return this.formRepo.getFormWithResults(formId);
  }
}