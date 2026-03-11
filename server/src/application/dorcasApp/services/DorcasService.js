export default class DorcasService {
  constructor(reportRepo) {
    this.reportRepo = reportRepo;
  }

  create(report) {
    return this.reportRepo.createReport(report);
  }

  update(reportId, updates) {
    return this.reportRepo.updateReport(reportId, updates);
  }

  fetch(reportId) {
    return this.reportRepo.fetchReport(reportId);
  }

  fetchAll() {
    return this.reportRepo.fetchAllReports();
  }

  delete(reportId) {
    return this.reportRepo.deleteReport(reportId);
  }
}
