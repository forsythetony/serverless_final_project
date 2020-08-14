import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { inspect } from 'util'
// import { verify, decode } from 'jsonwebtoken'
import { decode, verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'
import { JWTKeyResponse } from './jwtKeyResponse'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = process.env.JWT_SET_URL
var signingCert = undefined

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

export async function verifyToken(authHeader: string): Promise<JwtPayload> {
  console.log(authHeader)
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  let kid = jwt.header.kid
  if (!kid) {
    throw new Error(`The token didn't have a 'kid' value on it!`)
  }

  console.log(`Here's the kid -> ${kid}`)

  let signingCert = await getJWKCert(kid)

  return verify(
    token, 
    signingCert, 
    { algorithms: ['RS256']}
  ) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

async function getJWKCert(kid: string): Promise<string> {

  if (!signingCert) {
    console.log(`Unable to find a signing cert. Going to retrieve one from ${jwksUrl}`)

    let returnData = await Axios.get(jwksUrl)

    console.log("Here's the response I got back from axios -> ", inspect(returnData))

    let jwtKeysResponse : JWTKeyResponse = returnData.data

    console.log(JSON.stringify(jwtKeysResponse.keys))

    let foundKeys = jwtKeysResponse.keys.filter(currKey => {

      console.group('Filter Test')
      console.log(JSON.stringify(currKey))

      console.log(`Current kid:${currKey.kid}`)
      console.log(`Matching against:${kid}`)

      if (currKey.kid === kid) {
        console.log("Found a match!")
        console.groupEnd()
        return true
      }

      console.groupEnd()
      return false
    })

    if (foundKeys.length < 1) {
      throw new Error(`Unable to find a key with kid -> ${kid}`)
    }

    let foundCert = foundKeys[0].x5c[0]

    console.log(`Here's the cert I found -> ${foundCert}`)

    signingCert = fixCert(foundCert)

    return signingCert
  }
  else {
    console.log(`Looks like there's already a signing cert I can use ${signingCert}`)
    return signingCert
  }
}

/**
 * A quick hack to get the jsonwebtoken `verify` function to accept this
 * token as valid. I feel like there has to be a config option or something
 * to allow us to pass it through in the raw form.
 * 
 * @param rawCert The raw certificate lacking opening and closing strings
 * 
 * @returns A fixed cert that will be accepted by the  jsonwebtoken `verify` 
 *          function.
 */
function fixCert(rawCert: string): string {
  return `-----BEGIN CERTIFICATE-----\n${rawCert}\n-----END CERTIFICATE-----`
}