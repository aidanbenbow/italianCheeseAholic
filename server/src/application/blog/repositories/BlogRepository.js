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
    this.tableName = process.env.BLOG_TABLE_NAME || "articles_table";
    this.memoryArticles = new Map();
    this.allowMemoryFallback = process.env.BLOG_ALLOW_MEMORY_FALLBACK
      ? process.env.BLOG_ALLOW_MEMORY_FALLBACK === "true"
      : process.env.NODE_ENV !== "production";
  }

  async createArticle(article) {
    const normalized = {
      articleId: article?.articleId ?? `article-${Date.now()}`,
      ...article
    };

    return this.withMemoryFallback(
      async () => {
        await this.docClient.send(
          new PutCommand({
            TableName: this.tableName,
            Item: normalized
          })
        );
        return normalized;
      },
      async () => {
        this.memoryArticles.set(normalized.articleId, normalized);
        return normalized;
      }
    );
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

    return this.withMemoryFallback(
      async () => {
        const result = await this.docClient.send(new UpdateCommand(params));
        return result.Attributes;
      },
      async () => {
        const existing = this.memoryArticles.get(articleId) || { articleId };
        const next = { ...existing, ...updates };
        this.memoryArticles.set(articleId, next);
        return next;
      }
    );
  }

  async fetchArticle(articleId) {
    return this.withMemoryFallback(
      async () => {
        const result = await this.docClient.send(
          new GetCommand({
            TableName: this.tableName,
            Key: { articleId }
          })
        );
        return result.Item || null;
      },
      async () => this.memoryArticles.get(articleId) || null
    );
  }

  async fetchAllArticles() {
    return this.withMemoryFallback(
      async () => {
        const result = await this.docClient.send(
          new ScanCommand({
            TableName: this.tableName
          })
        );
        return result.Items || [];
      },
      async () => Array.from(this.memoryArticles.values())
    );
  }

  async deleteArticle(articleId) {
    return this.withMemoryFallback(
      async () => {
        await this.docClient.send(
          new DeleteCommand({
            TableName: this.tableName,
            Key: { articleId }
          })
        );
        return true;
      },
      async () => {
        this.memoryArticles.delete(articleId);
        return true;
      }
    );
  }

  async withMemoryFallback(primaryTask, fallbackTask) {
    try {
      return await primaryTask();
    } catch (error) {
      if (!this.allowMemoryFallback || !isCredentialsError(error)) {
        throw error;
      }

      console.warn("BlogRepository: AWS credentials unavailable, using in-memory fallback.");
      return fallbackTask();
    }
  }
}

function isCredentialsError(error) {
  const message = String(error?.message || "").toLowerCase();
  const name = String(error?.name || "").toLowerCase();

  return (
    name.includes("credential")
    || message.includes("could not load credentials")
    || message.includes("credential")
  );
}
