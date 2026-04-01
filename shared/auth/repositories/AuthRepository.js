import { PutCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

export class AuthRepository {
  constructor(docClient) {
    this.docClient = docClient;
    this.tableName = process.env.USERS_TABLE_NAME || "users_table";
  }

  async createUser(user) {
    const normalized = {
      userId: user?.userId ?? user?.username,
      username: user?.username ?? user?.userId,
      password: user?.password,
      role: user?.role ?? "user"
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: normalized
      })
    );
    return normalized;
  }

  async saveUser(user) {
    return this.createUser(user);
  }

  async getUserByUsername(username) {
    const normalizedUsername = String(username ?? "").trim();
    if (!normalizedUsername) {
      return null;
    }

    const byUserId = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { userId: normalizedUsername }
      })
    );

    if (byUserId?.Item) {
      return byUserId.Item;
    }

    const byUsername = await this.docClient.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: "#username = :username",
        ExpressionAttributeNames: {
          "#username": "username"
        },
        ExpressionAttributeValues: {
          ":username": normalizedUsername
        },
        Limit: 1
      })
    );

    return byUsername?.Items?.[0] || null;
  }
}
