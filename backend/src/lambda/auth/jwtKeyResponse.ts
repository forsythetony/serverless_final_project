export class JWTKey {
    alg: string
    kty: string
    use: string
    n: string
    e: string
    kid: string
    x5t: string
    x5c: string[]
}

export class JWTKeyResponse {
    keys: JWTKey[]
}