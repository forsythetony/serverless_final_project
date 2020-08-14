import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { verifyToken } from '../auth/auth0Authorizer'
import { getAllTodosForUser } from '../../service/todos'
import { createLogger } from '../../utils/logger'
import { buildErrorResponse } from '../utils'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

const logger = createLogger('getTodos')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  logger.info('Retrieving todos for event', {
    event
  })

  try {
    const verifiedToken = await verifyToken(event.headers.Authorization)
  
    logger.info('Successfully verified token', {
      verifiedToken
    })

    const todosForUser = await getAllTodosForUser(verifiedToken.sub)
  
    return {
      statusCode: 200,
      body: JSON.stringify({
        items: todosForUser
      })
    }
  }
  catch (error) {
    return buildErrorResponse(error, logger)
  }
})

handler.use(
  cors()
)