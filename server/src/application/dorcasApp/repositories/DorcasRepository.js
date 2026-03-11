import {
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  GetCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";

export class DorcasRepository {
  constructor(docClient) {
    this.docClient = docClient;
    this.tableName = "dorcas_reports";
  }

  async createReport(report) {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: report
      })
    );
    return report;
  }

  async updateReport(reportId, updates) {
    const params = {
      TableName: this.tableName,
      Key: { reportId },
      UpdateExpression: "SET #data = :data",
      ExpressionAttributeNames: { "#data": "data" },
      ExpressionAttributeValues: { ":data": updates },
      ReturnValues: "ALL_NEW"
    };

    const result = await this.docClient.send(new UpdateCommand(params));
    return result.Attributes;
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
    const result = await this.docClient.send(
      new ScanCommand({
        TableName: this.tableName
      })
    );
    return result.Items || [];
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
