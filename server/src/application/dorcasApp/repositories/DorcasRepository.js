import {
  PutCommand,
  DeleteCommand,
  GetCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";

export class DorcasRepository {
  constructor(docClient) {
    this.docClient = docClient;
    this.tableName = process.env.DORCAS_REPORTS_TABLE || "progress_reports_table";
  }

  async saveReport(report) {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: report
      })
    );
    return report;
  }

  async createReport(report) {
    return this.saveReport(report);
  }

  async updateReport(reportId, updates) {
    const existing = await this.fetchReport(reportId);
    const nextReport = {
      ...(existing ?? {}),
      ...updates,
      reportId,
      createdAt: existing?.createdAt ?? updates?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    return this.saveReport(nextReport);
  }

  async fetchReport(reportId) {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { reportId }
      })
    );
    return result.Item || null;
  }

  async fetchAllReports() {
    const items = [];
    let ExclusiveStartKey;

    do {
      const result = await this.docClient.send(
        new ScanCommand({
          TableName: this.tableName,
          ExclusiveStartKey,
        })
      );

      items.push(...(result.Items || []));
      ExclusiveStartKey = result.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return items.sort((a, b) => (b?.updatedAt ?? 0) - (a?.updatedAt ?? 0));
  }

  async deleteReport(reportId) {
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { reportId }
      })
    );
    return true;
  }
}
