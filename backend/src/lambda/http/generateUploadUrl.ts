import 'source-map-support/register'
import * as AWS  from 'aws-sdk'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { buildErrorResponse } from '../utils'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { addAttachmentUrl } from '../../service/todos'
import { verifyToken } from '../auth/auth0Authorizer'

const attachmentsBucket = process.env.ATTACHMENTS_BUCKET_NAME
const urlExpiration = process.env.S3_URL_EXPIRATION

const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

const logger = createLogger('generateUploadUrl')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  logger.info('Generating upload url', {
    event
  })

  try {

    const verifiedToken = await verifyToken(event.headers.Authorization)

    const todoId = event.pathParameters.todoId
    
    const uploadUrl = generateUploadUrl(todoId)

    await addAttachmentUrl(todoId, verifiedToken.sub)

    logger.info('Built upload URL and attached to record', {
      todoId,
      uploadUrl
    })

    return {
      body: JSON.stringify({
        uploadUrl: uploadUrl
      }),
      statusCode: 200
    }
  } catch (error) {
    return buildErrorResponse(error, logger)
  }

})

function generateUploadUrl(todoId: string) {

  const IMAGE_EXTENSION = '.jpg'

  logger.info('Building upload URL (with hacked extension)', {
    todoId,
    bucket: attachmentsBucket,
    urlExpiration,
    hackedExtension: IMAGE_EXTENSION
  })
  
  return s3.getSignedUrl('putObject', {
    Bucket: attachmentsBucket,
    Key: `${todoId}${IMAGE_EXTENSION}`,
    Expires: parseInt(urlExpiration)
  })
}

handler.use(
  cors()
)