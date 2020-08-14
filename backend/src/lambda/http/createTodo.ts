import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

import { createTodo } from '../../service/todos'

import { verifyToken } from '../auth/auth0Authorizer'
import { buildErrorResponse } from '../utils'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

const logger = createLogger('createTodo')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  logger.info('Creating todo', {
    event
  })
  try {
    const newTodoRequest: CreateTodoRequest = JSON.parse(event.body)

    const verifiedToken = await verifyToken(event.headers.Authorization)

    logger.info('Successfully verified token', {
      verifiedToken
    })

    const newTodo = await createTodo(
      newTodoRequest, 
      verifiedToken.sub
    )

    return {
      statusCode: 201,
      headers: {
          'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
          item: newTodo
      })
    }
  } catch (error) {
    return buildErrorResponse(error, logger)
  }
})

handler.use(
 cors() 
)