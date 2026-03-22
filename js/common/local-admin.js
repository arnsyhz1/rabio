const buildOptions = (method = 'GET', token = '', body = null, accessKey = '') => {
    const headers = {
        Accept: 'application/json',
    };

    if (body) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (accessKey) {
        headers['x-access-key'] = accessKey;
    }

    return {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    };
};

const parseResponse = async (response) => {
    const payload = await response.json();
    if (!response.ok || payload.error) {
        throw new Error(payload.error?.[0] || payload.message || `Request failed with status ${response.status}`);
    }

    return payload.data;
};

export const localAdmin = {
    async login(email, password) {
        const response = await fetch('./api/local-session.php', buildOptions('POST', '', { email, password }));
        return parseResponse(response);
    },
    async getUser(token) {
        const response = await fetch('./api/local-user.php', buildOptions('GET', token));
        return parseResponse(response);
    },
    async updateUser(token, payload) {
        const response = await fetch('./api/local-user.php', buildOptions('PATCH', token, payload));
        return parseResponse(response);
    },
    async regenerateAccessKey(token) {
        const response = await fetch('./api/local-key.php', buildOptions('PUT', token));
        return parseResponse(response);
    },
    async getConfig(accessKey) {
        const response = await fetch('./api/local-config.php', buildOptions('GET', '', null, accessKey));
        return parseResponse(response);
    },
};
