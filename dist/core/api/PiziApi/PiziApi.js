import { getRouter } from "./restRouter.js";
export class Api {
    apiKey;
    api;
    constructor(apiKey, api) {
        this.apiKey = apiKey;
        this.api = api;
    }
    getApi() {
        return this.api;
    }
    getClientApi() {
        return getRestApi(this.api);
    }
}
function getModelApi(dbAdapter, extraApi) {
    return {
        queries: {
            async get(id) {
                const model = await dbAdapter.findOne(id);
                return model.toPublic() ?? model;
            },
            async list(filter) {
                const models = await dbAdapter.find(filter);
                return models.map(model => model.toPublic() ?? model);
            },
            ...extraApi?.queries
        },
        mutations: {
            async create(model) {
                await dbAdapter.save(model);
                return model;
            },
            async update(model) {
                if (!model.id)
                    throw new Error('undefined id');
                await dbAdapter.save(model);
                return model;
            },
            async delete(id) {
                await dbAdapter.delete(id);
            },
            ...extraApi?.mutations
        }
    };
}
function getRestApi(api) {
    return {};
}
function getModelRestApi(collectionName, extraApi) {
    const extraClientApi = { queries: {}, mutations: {} };
    if (extraApi?.queries)
        for (const key of Object.keys(extraApi.queries)) {
            const matchGet = key.match(/^get(\w+)/);
            if (matchGet && matchGet[1]) {
                extraClientApi.queries[key] ||= {};
                extraClientApi.queries[key] = async function (id) {
                    if (!id)
                        throw new Error('undefined id');
                    return await fetchGet(`${collectionName}/${id}/${matchGet[1].toLocaleLowerCase()}`);
                };
            }
        }
    return {
        queries: {
            async get(id) {
                if (!id)
                    throw new Error('undefined id');
                return await fetchGet(`${collectionName}/${id}`);
            },
            async list(filter) {
                return await fetchGet(`${collectionName}`);
            },
            ...extraClientApi?.queries
        },
        mutations: {
            async create(model) {
                return await fetchPost(`${collectionName}`, model);
            },
            async update(model) {
                if (!model.id)
                    throw new Error('undefined id');
                return await fetchPut(`${collectionName}/${model.id}`, model);
            },
            async delete(id) {
                if (!id)
                    throw new Error('undefined id');
                return await fetchDelete(`${collectionName}/${id}`);
            },
            ...extraClientApi?.mutations
        }
    };
}
export class ModelApi extends Api {
    dbAdapter;
    collectionName;
    extraApi;
    constructor(apiKey, options) {
        super(apiKey, getModelApi(options.dbAdapter, options.extraApi));
        this.dbAdapter = options.dbAdapter;
        this.collectionName = options.collectionName ?? this.apiKey;
        this.extraApi = options.extraApi;
    }
    getClientApi() {
        return getModelRestApi(this.collectionName, this.extraApi);
    }
}
export class PiziApi {
    apis = [];
    constructor(apis) {
        this.apis = apis;
    }
    getApi() {
        const serverApi = {};
        for (const api of this.apis) {
            serverApi[api.apiKey] = api.getApi();
        }
        return serverApi;
    }
    getClientApi() {
        const clientApi = {};
        for (const api of this.apis) {
            clientApi[api.apiKey] = api.getClientApi();
        }
        return clientApi;
    }
    getRouter() {
        return getRouter(this.apis);
    }
}
export async function fetchJSON(url, data = {}, options = {}) {
    const headers = await getHeaders({ json: true, ...options.headers });
    const response = await fetch(`/api/rest/${url}`, { headers, method: options.method || 'GET', body: data });
    return await response.json();
}
export async function sendJSON(url, data, options = {}) {
    options.method ||= 'POST';
    return await fetchJSON(url, data, options);
}
export async function fetchGet(url, options = {}) {
    options.method = 'GET';
    return await fetchJSON(url, null, options);
}
export async function fetchPut(url, data, options = {}) {
    options.method = 'PUT';
    return await fetchJSON(url, data, options);
}
export async function fetchPost(url, data, options = {}) {
    options.method = 'POST';
    return await sendJSON(url, options);
}
export async function fetchDelete(url, options = {}) {
    options.method = 'DELETE';
    return await fetchJSON(url, null, options);
}
async function getHeaders(options = {}) {
    const headers = {};
    if (options.json)
        headers['Content-Type'] = 'application/json';
    if (API.token)
        headers['Authorization'] = `Bearer ${API.token}`;
    return headers;
}
//# sourceMappingURL=PiziApi.js.map