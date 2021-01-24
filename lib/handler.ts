import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

export const handler: APIGatewayProxyHandlerV2<APIGatewayProxyStructuredResultV2> = async ({
  queryStringParameters = {},
}) => {
  const { url, width, height, q, unsized } = queryStringParameters;

  return {
    body: JSON.stringify(queryStringParameters, null, 2),
    headers: {
      'Content-Type': 'application/json',
    },
  };
};
