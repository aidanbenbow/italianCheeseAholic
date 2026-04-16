export default class DorcasService {
  constructor(reportRepo) {
    this.reportRepo = reportRepo;
  }

  save(report = {}) {
    const now = Date.now();
    const reportId = typeof report.reportId === "string" && report.reportId.trim()
      ? report.reportId.trim()
      : `report-${now}`;

    const normalized = {
      reportId,
      formId: typeof report.formId === "string" && report.formId.trim()
        ? report.formId.trim()
        : "form_2",
      title: typeof report.title === "string" && report.title.trim()
        ? report.title.trim()
        : "Progress report",
      values: report.values && typeof report.values === "object"
        ? report.values
        : {},
      reporterName: typeof report.reporterName === "string"
        ? report.reporterName.trim()
        : "",
      createdAt: Number.isFinite(report.createdAt) ? report.createdAt : now,
      updatedAt: now,
    };

    return this.reportRepo.saveReport(normalized);
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
