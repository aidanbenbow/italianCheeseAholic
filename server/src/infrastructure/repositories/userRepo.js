import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

export class UserRepository {
  constructor(docClient) {
    this.docClient = docClient;
    this.tableName = "users";
  }

  async saveUser(user) {
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: user
    }));
  }

  async getUser(username) {
    const result = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { username }
    }));
    return result.Item || null;
  }
}
