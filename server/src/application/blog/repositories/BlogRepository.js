import {
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  GetCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";

export class BlogRepository {
  constructor(docClient) {
    this.docClient = docClient;
    this.tableName = "articles";
  }

  async createArticle(article) {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: article
      })
    );
    return article;
  }

  async updateArticle(articleId, updates) {
    const params = {
      TableName: this.tableName,
      Key: { articleId },
      UpdateExpression: "SET #data = :data",
      ExpressionAttributeNames: { "#data": "data" },
      ExpressionAttributeValues: { ":data": updates },
      ReturnValues: "ALL_NEW"
    };

    const result = await this.docClient.send(new UpdateCommand(params));
    return result.Attributes;
  }

  async fetchArticle(articleId) {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { articleId }
      })
    );
    return result.Item || null;
  }

  async fetchAllArticles() {
    const result = await this.docClient.send(
      new ScanCommand({
        TableName: this.tableName
      })
    );
    return result.Items || [];
  }

  async deleteArticle(articleId) {
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { articleId }
      })
    );
    return true;
  }
}
