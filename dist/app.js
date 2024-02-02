import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AppManager } from './core/apps/AppManager.js';
import path from "path";
import oauthRouter from './routers/oauthRouter.js';
import userRouter from './routers/userRouter.js';
import serverAppRouter from './routers/serverAppRouter.js';
import authenticateMiddleware from './middlewares/authenticateMiddleware.js';
import requestLoggerMiddleware from './middlewares/requestLoggerMiddleware.js';
import cookieParser from 'cookie-parser';
const app = express();
app.use(helmet({
    strictTransportSecurity: false,
    contentSecurityPolicy: {
        directives: {
            "script-src": ["'self'", "unpkg.com"]
        }
    }
}));
const CORS_ALLOWED_URIS = JSON.parse(process.env.CORS_ALLOWED_URIS);
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || CORS_ALLOWED_URIS.includes(origin) || origin === `https://localhost:${process.env.PORT}`)
            callback(null, true);
        else
            callback(new Error('Not allowed by CORS'));
    }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLoggerMiddleware);
// Routers App
app.use(authenticateMiddleware);
//app.get("/", (req, res) => res.send("Pizi Server"))
app.use("/api/app", serverAppRouter);
app.use("/api/oauth", oauthRouter);
app.use("/api/users", userRouter);
// Register App
app.post(`/register`, async (req, res, next) => {
    try {
        AppManager.registerApp(req.body.repository);
    }
    catch (e) {
        next(e);
    }
});
// Server App
const serverAppPath = path.join(process.env.ROOT, process.env.WEB_APP_DIR);
app.use(express.static(serverAppPath));
// Redirect all sub routes to root server app
app.use("/*", (req, res) => {
    const appIndexFile = path.join(serverAppPath, "index.html");
    res.sendFile(appIndexFile);
});
//exporting app
export default app;
//# sourceMappingURL=app.js.map