
declare global {
    var __MONGO_INSTANCE: any
    var __MONGO_URI: any
}

export default async () => {
    if(global.__MONGO_INSTANCE) await global.__MONGO_INSTANCE.stop()
}