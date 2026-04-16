export default class DorcasService {
  constructor(reportRepo) {
    this.reportRepo = reportRepo;
  }

  async save(report = {}) {
    const now = new Date();
    const nowIso = now.toISOString();

    const reportId = this._normalizeString(report.reportId)
      || this._normalizeString(report.id)
      || `report-${now.getTime()}`;

    const existing = await this.reportRepo.fetchReport(reportId);
    const values = report.values && typeof report.values === "object" ? report.values : {};

    const name = this._normalizeString(
      report.name
      ?? report.reporterName
      ?? values.name
      ?? existing?.name
      ?? existing?.reporterName
    );

    const message = this._normalizeString(
      report.message
      ?? values.message
      ?? existing?.message
    );

    const reportText = this._normalizeString(
      report.report
      ?? report.feedback
      ?? values.report
      ?? values.feedback
      ?? existing?.report
      ?? existing?.feedback
    );

    const createdAt = this._normalizeCreatedAt(
      report.createdAt
      ?? existing?.createdAt
      ?? nowIso
    );

    const fallbackYear = this._yearTwoDigits(createdAt);
    const messageYear = this._normalizeNumber(
      report.messageYear
      ?? existing?.messageYear,
      fallbackYear
    );
    const reportYear = this._normalizeNumber(
      report.reportYear
      ?? existing?.reportYear,
      fallbackYear
    );

    const normalized = {
      ...(existing ?? {}),
      reportId,
      id: this._normalizeString(report.id) || existing?.id || reportId,
      createdAt,
      updatedAt: nowIso,
      name,
      message,
      report: reportText,
      messageYear,
      reportYear,
      status: this._normalizeString(report.status) || existing?.status || "sponsored",
      used: this._normalizeBoolean(report.used, existing?.used ?? true),
      letter: this._normalizeBoolean(report.letter, existing?.letter ?? false),
    };

    delete normalized.values;
    delete normalized.feedback;
    delete normalized.reporterName;
    delete normalized.formId;
    delete normalized.title;

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

  _normalizeString(value) {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    return trimmed;
  }

  _normalizeBoolean(value, fallback = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
    return Boolean(fallback);
  }

  _normalizeNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  _normalizeCreatedAt(value) {
    if (typeof value === "string") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
      return new Date().toISOString();
    }

    if (Number.isFinite(value)) {
      return new Date(value).toISOString();
    }

    return new Date().toISOString();
  }

  _yearTwoDigits(isoDate) {
    const date = new Date(isoDate);
    const fullYear = Number.isNaN(date.getTime())
      ? new Date().getUTCFullYear()
      : date.getUTCFullYear();
    return fullYear % 100;
  }
}
