import { IAdapter } from "~/adapters/adapters.js"
import { IModel } from "~/core/models/Model.js"
import { getRouter } from "./restRouter.js"

export type IQuery = (filters?: any) => Promise<any> | Promise<any[]>
export type IMutation = (filters?: any) => Promise<any> | Promise<any[]>

export interface IApi{
    queries?: { [key: string]: IQuery }
    mutations?: { [key: string]: IMutation }
}

export class Api <A extends IApi = IApi>{
    apiKey: string
    api: A

    constructor(apiKey: string, api: A){
        this.apiKey = apiKey
        this.api = api
    }

    getApi(): A {
        return this.api
    }

    getClientApi(): A {
        return getRestApi(this.api) as A
    }
}

export interface IModelApi<M extends IModel> extends IApi{
    queries: {
        get:( id: string) => Promise<M>
        list:( filter: any ) => Promise<M[]>
    }
    mutations: {
        create:( model: M) => Promise<M>
        update:( model: M) => Promise<M>
        delete:( id: string ) => Promise<void>
    }
}

function getModelApi<M extends IModel>(dbAdapter: IAdapter<M>, extraApi?: IApi){
    return {
        queries: {
            async get(id){
                const model = await dbAdapter.findOne(id)
                return (model as any).toPublic() ?? model
            },
            async list(filter){
                const models = await dbAdapter.find(filter)
                return models.map(model => (model as any).toPublic() ?? model)
            },
            ...extraApi?.queries
        },
        mutations: {
            async create(model){
                await dbAdapter.save(model)
                return model
            },
            async update(model){
                if(!model.id) throw new Error('undefined id')
                await dbAdapter.save(model)
                return model
            },
            async delete(id){
                await dbAdapter.delete(id)
            },
            ...extraApi?.mutations
        }
    } as IModelApi<M>
}

function getRestApi(api: IApi){
    return {} as IApi
}

function getModelRestApi<M extends IModel = IModel>(collectionName: string, extraApi?: IApi){
    const extraClientApi: any = { queries: {}, mutations: {}}
    if(extraApi?.queries) for(const key of Object.keys(extraApi.queries)){
        const matchGet = key.match(/^get(\w+)/)
        if(matchGet && matchGet[1]){
            extraClientApi.queries[key] ||= {}
            extraClientApi.queries[key] = async function(id: string){
                if(!id) throw new Error('undefined id')
                return await fetchGet(`${collectionName}/${id}/${matchGet[1].toLocaleLowerCase()}`)
            }
        }
    }
    return {
        queries: {
            async get(id){
                if(!id) throw new Error('undefined id')
                return await fetchGet(`${collectionName}/${id}`)
            },
            async list(filter){
                return await fetchGet(`${collectionName}`)
            },
            ...extraClientApi?.queries
        },
        mutations: {
            async create(model){
                return await fetchPost(`${collectionName}`, model)
            },
            async update(model){
                if(!model.id) throw new Error('undefined id')
                return await fetchPut(`${collectionName}/${model.id}`, model)
            },
            async delete(id){
                if(!id) throw new Error('undefined id')
                return await fetchDelete(`${collectionName}/${id}`)
            },
            ...extraClientApi?.mutations
        }
    } as IModelApi<M>
}

interface IPartialModelApi <M extends IModel, A extends IModelApi<M>>{
    queries?: Partial<A["queries"]>
    mutations?: Partial<A["mutations"]>
}

export class ModelApi<M extends IModel = IModel, A extends IModelApi<M> = IModelApi<M>> extends Api<A>{
    dbAdapter: IAdapter<M>
    collectionName: string
    extraApi?: IPartialModelApi<M, A>

    constructor(apiKey: string, options : { dbAdapter: IAdapter<M>, collectionName?: string, extraApi? : IPartialModelApi<M, A> }){
        super(apiKey, getModelApi<M>(options.dbAdapter, options.extraApi as IApi) as A)
        this.dbAdapter = options.dbAdapter
        this.collectionName = options.collectionName ?? this.apiKey
        this.extraApi = options.extraApi
    }

    getClientApi(): A {
        return getModelRestApi(this.collectionName, this.extraApi as IApi) as A
    }
}

export type IServerApi = {
    [key: string]: IApi
}

export class PiziApi<T extends IServerApi> {
    apis: Api[] = []

    constructor(apis: Api[]){
        this.apis = apis
    }

    getApi(): T{
        const serverApi: any = {}
        for(const api of this.apis){
            serverApi[api.apiKey] = api.getApi()
        }
        return serverApi as T
    }

    getClientApi(){
        const clientApi: any = {}
        for(const api of this.apis){
            clientApi[api.apiKey] = api.getClientApi()
        }
        return clientApi as T
    }

    getRouter(){
       return getRouter(this.apis)
    }
}

interface IJsonOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers? : IHeaderOptions
}

export async function fetchJSON(url: string, data: any = {}, options: IJsonOptions = {}){
    const headers = await getHeaders({json: true, ...options.headers})
    const response = await fetch(`/api/rest/${url}`, { headers, method: options.method || 'GET', body: data })
    return await response.json()
}

interface ISendJsonOptions extends IJsonOptions{
    method?: 'POST' | 'PUT' 
}

export async function sendJSON(url: string, data: any, options: ISendJsonOptions = {}){
    options.method ||= 'POST'
    return await fetchJSON(url, data, options)
}

export async function fetchGet(url: string, options: IJsonOptions = {}){
    options.method = 'GET'
    return await fetchJSON(url, null, options)
}

export async function fetchPut(url: string, data: any, options: IJsonOptions = {}){
    options.method = 'PUT'
    return await fetchJSON(url, data, options)
}

export async function fetchPost(url: string, data: any, options: IJsonOptions = {}){
    options.method = 'POST'
    return await sendJSON(url, options)
}

export async function fetchDelete(url: string, options: IJsonOptions = {}){
    options.method = 'DELETE'
    return await fetchJSON(url, null, options)
}

interface IHeaderOptions {
    json?: boolean
}

async function getHeaders(options: IHeaderOptions = {}){
    const headers: any = {}
    if(options.json) headers['Content-Type'] = 'application/json' 
    if(API.token) headers['Authorization'] = `Bearer ${API.token}` 
    return headers
}