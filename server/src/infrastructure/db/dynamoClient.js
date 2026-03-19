import {
  DynamoDBClient
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient
} from "@aws-sdk/lib-dynamodb";

const region = normalizeEnv(process.env.AWS_REGION) || "eu-central-1";
const accessKeyId = normalizeEnv(process.env.AWS_ACCESS_KEY_ID);
const secretAccessKey = normalizeEnv(process.env.AWS_SECRET_ACCESS_KEY);
const sessionToken = normalizeEnv(process.env.AWS_SESSION_TOKEN);

const clientConfig = { region };

if (accessKeyId && secretAccessKey) {
  clientConfig.credentials = {
    accessKeyId,
    secretAccessKey,
    ...(sessionToken ? { sessionToken } : {})
  };
}

const client = new DynamoDBClient(clientConfig);

export const docClient = DynamoDBDocumentClient.from(client);

function normalizeEnv(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed[trimmed.length - 1] === quote) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}