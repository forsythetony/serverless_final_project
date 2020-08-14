import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { updateTodo } from '../../service/todos'
import { verifyToken } from '../auth/auth0Authorizer'
import { createLogger } from '../../utils/logger'
import { buildErrorResponse } from '../utils'

import * as middy from 'middy'
import { cors } from 'middy/middlewares'

const logger = createLogger('updateTodo')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  logger.info('Updating todo with event',{
    event
  })

  try {
    const todoId = event.pathParameters.todoId
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  
    const verifiedToken = await verifyToken(event.headers.Authorization)
  
    await updateTodo(todoId, verifiedToken.sub, updatedTodo)
  
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