import cors from 'cors'
import helmet from 'helmet'

export default (options: any = {}) => [
    helmet({
        strictTransportSecurity: false,
        contentSecurityPolicy: {
            directives: {
            "script-src": ["'self'", "'unsafe-inline'", "unpkg.com"]
            }
        }
    }),
    cors({
        origin: (origin: any, callback: any) => {
            if(!origin || options.corsAllowedUris.includes(origin) || origin === `https://localhost:${process.env.PORT}`) callback(null, true)
            else callback(new Error('Not allowed by CORS'))
        }
    })
]