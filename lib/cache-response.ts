import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { S3 } from 'aws-sdk';

export async function cacheResponse(
  s3: S3,
  event: APIGatewayProxyEventV2,
  response: APIGatewayProxyStructuredResultV2
) {}
