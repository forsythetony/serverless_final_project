// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'hmo6zpj3y0'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map
  domain: 'dev-forsythetony.us.auth0.com',            // Auth0 domain
  clientId: 'fllPDpQLscgp32hx5y4OYhsWXAzhQfEm',          // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
