import { dto } from './dto.js';

export const HTTP_GET = 'GET';
export const HTTP_PUT = 'PUT';
export const HTTP_POST = 'POST';
export const HTTP_PATCH = 'PATCH';
export const HTTP_DELETE = 'DELETE';

export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_CREATED = 201;
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

const resolveRequestBase = () => {
    const configured = document.body?.getAttribute('data-url')?.trim() || '';

    if (configured.length > 0) {
        if (/^https?:\/\//i.test(configured)) {
            return configured.replace(/\/+$/, '');
        }

        const resolved = new URL(configured, window.location.href);
        return resolved.href.replace(/\/+$/, '');
    }

    return window.location.origin || '';
};

export const request = (method, path) => {

    const ac = new AbortController();

    const url = resolveRequestBase();
    let req = {
        signal: ac.signal,
        method: String(method).toUpperCase(),
        headers: new Headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }),
    };

    window.addEventListener('offline', () => ac.abort());
    window.addEventListener('popstate', () => ac.abort());
    window.addEventListener('beforeunload', () => ac.abort());

    const parseJsonResponse = async (res) => {
        const contentType = res.headers.get('content-type') || '';
        const payload = await res.text();

        if (!contentType.includes('application/json')) {
            throw new Error(`Endpoint ${url + path} mengembalikan respons non-JSON. Pastikan URL API komentar/dashboard sudah benar.`);
        }

        try {
            return JSON.parse(payload);
        } catch {
            throw new Error(`Endpoint ${url + path} mengembalikan JSON tidak valid.`);
        }
    };

    const parseJsonResponse = async (res) => {
        const contentType = res.headers.get('content-type') || '';
        const payload = await res.text();

        if (!contentType.includes('application/json')) {
            throw new Error(`Endpoint ${url + path} mengembalikan respons non-JSON. Pastikan URL API komentar/dashboard sudah benar.`);
        }

        try {
            return JSON.parse(payload);
        } catch {
            throw new Error(`Endpoint ${url + path} mengembalikan JSON tidak valid.`);
        }
    };

    return {
        /**
         * @template T
         * @param {((data: any) => T)=} transform
         * @returns {Promise<ReturnType<typeof dto.baseResponse<T>>>}
         */
        send(transform = null) {
            return fetch(url + path, req)
                .then((res) => {
                    return parseJsonResponse(res).then((json) => {
                        if (res.status >= HTTP_STATUS_INTERNAL_SERVER_ERROR && (json.message ?? json[0])) {
                            throw new Error(json.message ?? json[0]);
                        }

                        if (json.error) {
                            throw new Error(json.error[0]);
                        }

                        if (transform) {
                            json.data = transform(json.data);
                        }

                        return dto.baseResponse(json.code, json.data, json.error);
                    });
                })
                .catch((err) => {
                    if (err.name === 'AbortError') {
                        console.warn('Fetch abort:', err);
                        return err;
                    }

                    alert(err);
                    throw new Error(err);
                });
        },
        /**
         * @returns {Promise<boolean>}
         */
        download() {
            return fetch(url + path, req)
                .then((res) => {
                    if (res.status !== HTTP_STATUS_OK) {
                        return false;
                    }

                    const existingLink = document.querySelector('a[download]');
                    if (existingLink) {
                        document.body.removeChild(existingLink);
                    }

                    const filename = res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] ?? 'download.csv';

                    return res.blob().then((blob) => {
                        const link = document.createElement('a');
                        const href = window.URL.createObjectURL(blob);

                        link.href = href;
                        link.download = filename;
                        document.body.appendChild(link);

                        link.click();

                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(href);

                        return true;
                    });
                })
                .catch((err) => {
                    if (err.name === 'AbortError') {
                        console.warn('Fetch abort:', err);
                        return err;
                    }

                    alert(err);
                    throw new Error(err);
                });
        },
        /**
         * @param {string} token
         * @returns {ReturnType<typeof request>}
         */
        token(token) {
            if (token.split('.').length === 3) {
                req.headers.append('Authorization', 'Bearer ' + token);
                return this;
            }

            req.headers.append('x-access-key', token);
            return this;
        },
        /**
         * @param {object} body
         * @returns {ReturnType<typeof request>}
         */
        body(body) {
            req.body = JSON.stringify(body);
            return this;
        },
    };
};
