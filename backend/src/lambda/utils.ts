import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { parseUserId } from "../auth/utils";
import { JsonWebTokenError } from "jsonwebtoken";
import { Logger } from "winston";

/**
 * Get a user id from an API Gateway event
 * @param event an event from API Gateway
 *
 * @returns a user id from a JWT token
 */
export function getUserId(event: APIGatewayProxyEvent): string {
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  return parseUserId(jwtToken)
}

export function buildErrorResponse(error: Error, logger: Logger): APIGatewayProxyResult {
  if (error instanceof JsonWebTokenError) {
    logger.error('Failed to authenticate token with error', {
      error
    })

    return {
      statusCode: 401,
      body: 'Invalid token'
    }
  }

  logger.error('Something unexpected went wrong', {
    error
  })

  return {
    statusCode: 500,
    body: 'Something went wrong ༼ノಠل͟ಠ༽ノ ︵ ┻━┻'
  }
}