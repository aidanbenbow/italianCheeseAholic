import { PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

export class FormRepository {
  constructor(docClient) {
    this.docClient = docClient;
    this.tableName = "forms";
  }

  async createForm(form) {
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: form
    }));
    return form;
  }

  async updateForm(formId, updates) {
    const params = {
      TableName: this.tableName,
      Key: { formId },
      UpdateExpression: "SET #data = :data",
      ExpressionAttributeNames: { "#data": "data" },
      ExpressionAttributeValues: { ":data": updates },
      ReturnValues: "ALL_NEW"
    };
    const result = await this.docClient.send(new UpdateCommand(params));
    return result.Attributes;
  }

  async deleteForm(formId) {
    await this.docClient.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { formId }
    }));
    return true;
  }

  async fetchForm(formId) {
    const result = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { formId }
    }));
    return result.Item || null;
  }

  async fetchAllForms() {
    const result = await this.docClient.send(new ScanCommand({
      TableName: this.tableName
    }));
    return result.Items || [];
  }
}
