import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { verifyToken } from '../auth/auth0Authorizer'
import { deleteTodo } from '../../service/todos'
import { buildErrorResponse } from '../utils'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

const logger = createLogger('deleteTodo')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  logger.info('Deleting todo', {
    event
  })

  try {
    const todoId = event.pathParameters.todoId

    const verifiedToken = await verifyToken(event.headers.Authorization)

    await deleteTodo(todoId, verifiedToken.sub)
    
    return {
      body: '',
      statusCode: 204
    }
  } catch (error) {
    return buildErrorResponse(error, logger)
  }
})

handler.use(
  cors()
)