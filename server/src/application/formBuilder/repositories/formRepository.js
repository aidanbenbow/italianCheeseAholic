import {
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";

export class FormRepository {
  constructor(docClient) {
    this.docClient = docClient;
    this.tableName = "form_app";
  }

  // ========================
  // 📝 FORM OPERATIONS
  // ========================

  async createForm({ formId, title, data }) {
    const timestamp = Date.now();

    const item = {
      formId,
      sk: "FORM",
      type: "FORM",
      title,
      data,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item,
      ConditionExpression: "attribute_not_exists(formId)" // prevent overwrite
    }));

    return item;
  }

  async updateForm(formId, updates) {
    const params = {
      TableName: this.tableName,
      Key: {
        formId,
        sk: "FORM"
      },
      UpdateExpression: `
        SET #title = :title,
            #data = :data,
            updatedAt = :updatedAt
      `,
      ExpressionAttributeNames: {
        "#title": "title",
        "#data": "data"
      },
      ExpressionAttributeValues: {
        ":title": updates.title,
        ":data": updates.data,
        ":updatedAt": Date.now()
      },
      ReturnValues: "ALL_NEW"
    };

    const result = await this.docClient.send(new UpdateCommand(params));
    return result.Attributes;
  }

  async getForm(formId) {
    const result = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: {
        formId,
        sk: "FORM"
      }
    }));

    return result.Item || null;
  }

  // ========================
  // 📊 RESULT OPERATIONS
  // ========================

  async submitResult(formId, answers) {
    const timestamp = Date.now();

    const item = {
      formId,
      sk: `RESULT#${timestamp}`,
      type: "RESULT",
      submissionId: timestamp.toString(),
      answers,
      createdAt: timestamp
    };

    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }));

    return item;
  }

  async getResults(formId, { limit = 50, lastKey } = {}) {
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: "formId = :formId AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: {
        ":formId": formId,
        ":prefix": "RESULT#"
      },
      Limit: limit,
      ScanIndexForward: false // newest first
    };

    if (lastKey) {
      params.ExclusiveStartKey = lastKey;
    }

    const result = await this.docClient.send(new QueryCommand(params));

    return {
      items: result.Items || [],
      lastKey: result.LastEvaluatedKey || null
    };
  }

  // ========================
  // 🔗 COMPOSED QUERIES
  // ========================

  async getFormWithResults(formId, options = {}) {
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: "formId = :formId",
      ExpressionAttributeValues: {
        ":formId": formId
      }
    };

    const result = await this.docClient.send(new QueryCommand(params));
    const items = result.Items || [];

    const form = items.find(i => i.sk === "FORM") || null;
    const results = items.filter(i => i.sk.startsWith("RESULT#"));

    return {
      ...form,
      results
    };
  }

  async deleteFormCascade(formId) {
  const result = await this.docClient.send(new QueryCommand({
    TableName: this.tableName,
    KeyConditionExpression: "formId = :formId",
    ExpressionAttributeValues: {
      ":formId": formId
    }
  }));

  const items = result.Items || [];

  // Batch delete (max 25 per request)
  const chunks = [];
  for (let i = 0; i < items.length; i += 25) {
    chunks.push(items.slice(i, i + 25));
  }

  for (const chunk of chunks) {
    await this.docClient.send(new BatchWriteCommand({
      RequestItems: {
        [this.tableName]: chunk.map(item => ({
          DeleteRequest: {
            Key: {
              formId: item.formId,
              sk: item.sk
            }
          }
        }))
      }
    }));
  }

  return true;
}
async fetchAllForms({ limit = 20, lastKey } = {}) {
  const params = {
    TableName: this.tableName,
    IndexName: "GSI1",
    KeyConditionExpression: "#type = :type",
    ExpressionAttributeNames: {
      "#type": "type"
    },
    ExpressionAttributeValues: {
      ":type": "FORM"
    },
    Limit: limit,
    ScanIndexForward: false // newest first
  };

  if (lastKey) {
    params.ExclusiveStartKey = lastKey;
  }

  const result = await this.docClient.send(new QueryCommand(params));

  return {
    items: result.Items || [],
    lastKey: result.LastEvaluatedKey || null
  };
}
}