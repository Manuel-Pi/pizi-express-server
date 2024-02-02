import { OAuthToken } from "~/core/models/OAuthToken.js"
import db from "~/adapters/mongo/DbAdapter.js"

export default db<OAuthToken>(OAuthToken)