import { OAuthAuthorizationCode } from "~/core/models/OAuthAuthorizationCode.js"
import db from "~/adapters/mongo/DbAdapter.js"

export default db<OAuthAuthorizationCode>(OAuthAuthorizationCode)