import oAuth2Server from '@node-oauth/oauth2-server'
import OAuthTokenDbAdapter from '~/adapters/mongo/OAuthTokenDbAdapter.js'
import OAuthClientDbAdapter from '~/adapters/mongo/OAuthClientDbAdapter.js'
import OAuthAuthorizationCodeDbAdapter from '~/adapters/mongo/OAuthAuthorizationCodeDbAdapter.js'
import UserDbAdapter from '~/adapters/mongo/UserDbAdapter.js'
import { OAuthAuthorizationCode } from '~/core/models/OAuthAuthorizationCode.js'
import { OAuthToken } from '~/core/models/OAuthToken.js'

export default new oAuth2Server({
    model: {
        async getAccessToken(bearerToken){
            if(!bearerToken) throw new oAuth2Server.InvalidTokenError(`missing accessToken`)
            const accessToken = await OAuthTokenDbAdapter.findOne({ accessToken: bearerToken })
            if(!accessToken) throw new oAuth2Server.InvalidTokenError(`invalid access token`)
            return accessToken?.toNodeOAuthAccessToken()
        },
    
        async getRefreshToken(bearerToken){
            if(!bearerToken) throw new oAuth2Server.InvalidTokenError(`missing refreshToken`)
            const refreshToken = await OAuthTokenDbAdapter.findOne({ refreshToken: bearerToken })
            if(!refreshToken) throw new oAuth2Server.InvalidTokenError(`invalid refresh token`)
            return refreshToken?.toNodeOAuthRefreshToken()
        },
    
        async getClient(id, secret){
            if(!id) throw new oAuth2Server.InvalidClientError(`missing clientId`)
            const filter: any = { id }
            if(secret) filter.secret = secret
            return await OAuthClientDbAdapter.findOne(filter).catch(() => {
                throw new oAuth2Server.InvalidClientError(`invalid client: ${id}`) 
            })
        },
    
        async getUser( username, password ){
            if(!username) throw new oAuth2Server.InvalidRequestError(`missing username`)
            if(!password) throw new oAuth2Server.InvalidRequestError(`missing password`)
            const user = await UserDbAdapter.findOne({ username }).catch( () => null )
            if(!user || !user.validatePassword(password)) throw new oAuth2Server.InvalidRequestError(`invalid credentials`)
            return user
        },
   
        async saveAuthorizationCode(code, client, user){
            const authorizationCode = new OAuthAuthorizationCode({
                ...code,
                clientId: client.id,
                userId:   user.id
            })
            await OAuthAuthorizationCodeDbAdapter.save(authorizationCode)
            return authorizationCode.toNodeOAuthAuthorizationCode()
        },

        async getAuthorizationCode(code){
            if(!code) throw new oAuth2Server.InvalidRequestError(`missing authorization code`)
            const authorizationCode = await OAuthAuthorizationCodeDbAdapter.findOne({authorizationCode: code}).catch(e => {
                throw new oAuth2Server.InvalidRequestError(`invalid code: ${code}`)
            })
            return {
                ...authorizationCode,
                client: await OAuthClientDbAdapter.findOne(authorizationCode.clientId),
                user: { id: authorizationCode.userId }
            }
        },

        async revokeAuthorizationCode(code){
            if(!code?.id) throw new Error(`missing code`)
            await OAuthAuthorizationCodeDbAdapter.delete(code.id)
            return true
        },

        async saveToken( token, client, user ){
            const accessToken = new OAuthToken({
                accessToken:           token.accessToken,
                accessTokenExpiresAt:  token.accessTokenExpiresAt,
                refreshToken:          token.refreshToken,
                refreshTokenExpiresAt: token.refreshTokenExpiresAt,
                clientId: client.id,
                userId:   user.id
            })
            await OAuthTokenDbAdapter.save(accessToken)
            return {
                ...accessToken,
                client,
                user: { 
                    id: user.id, 
                    username: user.username 
                }
            }
        },
        
        async revokeToken( token ){
            if(!token?.id) throw new Error(`missing token id`)
            await OAuthTokenDbAdapter.delete(token.id)
            return true
        }
    }
})

export function tokenOptions(req: any) {
    return {
        accessTokenLifetime:  parseInt(process.env.OAUTH_ACCESS_TOKEN_LIFETIME),
        refreshTokenLifetime: parseInt(process.env.OAUTH_REFRESH_TOKEN_LIFETIME),
        requireClientAuthentication: {refresh_token: req.body!.client_id !== process.env.OAUTH_CLIENT_ID}
    }
}

export function tokenToSnakeCase(token: oAuth2Server.Token, withRefreshToken: boolean = true){
    const returnedToken: {
        access_token: string
        access_token_expires_at: Date | undefined
        refresh_token?: string
        refresh_token_expires_at?: Date | undefined
        token_type: string
        user: oAuth2Server.User
    } = {
        access_token: 			    token.accessToken,
        access_token_expires_at: 	token.accessTokenExpiresAt,
        token_type:                 token.tokenType,
        user:                       token.user
    }
    if(withRefreshToken){
        returnedToken.refresh_token = token.refreshToken
        returnedToken.refresh_token_expires_at = token.refreshTokenExpiresAt
    }
    return returnedToken
}

export async function generateCodeChallenge(codeVerifier: string, method: string = 'S256') {
    let digest
    switch(method){
        case 'S256':
            digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier))
            break;
        default:
            throw new Error('invalid method')
    }
    return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}