import { storage } from './storage.js';

const defaults = Object.freeze({
    invitationLabel: 'The Wedding of',
    desktopBadge: 'Save the Date!',
    brideShortName: 'Tari',
    groomShortName: 'Erland',
    brideFullName: 'Siti Sukentari',
    groomFullName: 'Septian Erland Pratama',
    brideRole: 'Putri Pertama',
    groomRole: 'Putra Pertama',
    brideParents: 'Bapak Zajang Darman\n&\nIbu Nurul Sulastri',
    groomParents: 'Bapak Nasserudin\n&\n(Alm.) Ibu Erchamni',
    eventDateLabel: 'Kamis, 24 Juli 2025',
    guestSalutation: 'Kepada Yth. Bapak/Ibu/Saudara/i',
    invitationIntro: 'Tanpa mengurangi rasa hormat, dengan ini kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada acara pernikahan kami.',
    baseUrl: 'https://tari.erland.me',
    calendarTitle: 'The Wedding of Tari and Erland',
    calendarStart: '2025-07-24 10:00:00',
    calendarEnd: '2025-07-24 14:00:00',
    calendarLocation: 'https://maps.app.goo.gl/PtFWJys9FF6fkzhG7',
    calendarTimeZone: 'Asia/Jakarta',
    templateKey: 'classic',
});

const templates = Object.freeze([
    {
        key: 'classic',
        name: 'Classic',
        description: 'Template clean dan netral untuk semua tema pernikahan.',
    },
    {
        key: 'royal',
        name: 'Royal Gold',
        description: 'Template elegan dengan aksen emas dan nuansa premium.',
    },
    {
        key: 'garden',
        name: 'Garden Sage',
        description: 'Template segar bernuansa hijau untuk konsep outdoor.',
    },
]);

const keys = Object.freeze(Object.keys(defaults));

const toSlugPart = (value) => String(value ?? '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

const buildSlug = (profile) => {
    const combined = [profile.brideShortName, profile.groomShortName]
        .map(toSlugPart)
        .filter(Boolean)
        .join('-');

    return combined.length > 0 ? combined : 'wedding-couple';
};

const normalizeValue = (key, value) => {
    const fallback = defaults[key];
    if (typeof fallback === 'string') {
        const normalized = String(value ?? '').trim();
        return normalized.length > 0 ? normalized : fallback;
    }

    return value ?? fallback;
};

const normalizeBaseUrl = (url) => String(url).replace(/\/+$/, '');

const toDisplayNames = (profile) => ({
    coupleShortDisplay: `${profile.brideShortName} & ${profile.groomShortName}`,
    coupleShortText: `${profile.brideShortName} and ${profile.groomShortName}`,
});

const createDescription = (profile) => {
    const { coupleShortText } = toDisplayNames(profile);
    return `Save the Date! ${coupleShortText} will be getting married on ${profile.eventDateLabel}. We would be honored to have you join us in celebrating this special day.`;
};

const sanitizeProfile = (payload = {}) => keys.reduce((result, key) => {
    result[key] = normalizeValue(key, payload[key]);
    return result;
}, {});

const hydrateProfile = (payload = {}) => {
    const profile = sanitizeProfile(payload);
    const { coupleShortDisplay, coupleShortText } = toDisplayNames(profile);
    const slug = buildSlug(profile);
    const baseUrl = normalizeBaseUrl(profile.baseUrl);
    const publicUrl = `${baseUrl}/${slug}`;

    return {
        ...profile,
        slug,
        baseUrl,
        publicUrl,
        coupleShortDisplay,
        coupleShortText,
        heroTitle: `${profile.invitationLabel} ${coupleShortText} — You're invited!`,
        desktopSummary: `${coupleShortText} will be getting married on ${profile.eventDateLabel}.`,
        welcomeCouple: `${profile.brideShortName} dan ${profile.groomShortName}`,
        invitationDescription: createDescription(profile),
        generatorUrl: publicUrl,
        label: `${profile.brideShortName} & ${profile.groomShortName}`,
    };
};

const CACHE_TABLE = 'wedding_profiles_cache';

export const weddingProfile = (() => {

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let cache = null;

    const state = {
        activeSlug: '',
        items: {},
        templates: [...templates],
        profileUrl: '',
    };

    const ensureCache = () => {
        if (!cache) {
            cache = storage(CACHE_TABLE);
        }

        return cache;
    };

    const syncCache = () => {
        const store = ensureCache();
        store.set('activeSlug', state.activeSlug);
        store.set('items', state.items);
        store.set('templates', state.templates);
    };

    const seedDefaults = () => {
        const seeded = hydrateProfile(defaults);
        state.items = { [seeded.slug]: sanitizeProfile(seeded) };
        state.activeSlug = seeded.slug;
        state.templates = [...templates];
        syncCache();
        return seeded;
    };

    const loadCache = () => {
        const store = ensureCache();
        const items = store.get('items') ?? {};
        const activeSlug = store.get('activeSlug') ?? '';
        const cachedTemplates = store.get('templates') ?? templates;

        state.items = items;
        state.activeSlug = activeSlug;
        state.templates = Array.isArray(cachedTemplates) && cachedTemplates.length > 0 ? cachedTemplates : [...templates];

        if (Object.keys(state.items).length === 0) {
            seedDefaults();
        }
    };

    const getItems = () => state.items ?? {};

    const has = (slug) => Object.keys(getItems()).includes(String(slug));

    const list = () => Object.values(getItems()).map(hydrateProfile);

    const getActiveSlug = () => {
        if (state.activeSlug && has(state.activeSlug)) {
            return state.activeSlug;
        }

        const fallback = list()[0]?.slug ?? seedDefaults().slug;
        state.activeSlug = fallback;
        syncCache();
        return fallback;
    };

    const get = (slug = null) => {
        const target = slug && has(slug) ? slug : getActiveSlug();
        return hydrateProfile(getItems()[target]);
    };

    const getTemplates = () => state.templates;

    const getProfileUrl = () => state.profileUrl || document.body?.getAttribute('data-profile-url') || './api/profile.php';

    const buildPayload = () => ({
        activeSlug: state.activeSlug,
        profiles: list().map((profile) => ({
            ...sanitizeProfile(profile),
            slug: profile.slug,
        })),
        templates: state.templates,
    });

    const applyResponse = (payload = {}) => {
        const profiles = Array.isArray(payload.profiles) ? payload.profiles : [];
        state.items = profiles.reduce((result, profile) => {
            const hydrated = hydrateProfile(profile);
            result[hydrated.slug] = sanitizeProfile(hydrated);
            return result;
        }, {});
        state.activeSlug = payload.activeSlug || profiles[0]?.slug || '';
        state.templates = Array.isArray(payload.templates) && payload.templates.length > 0 ? payload.templates : [...templates];

        if (Object.keys(state.items).length === 0) {
            seedDefaults();
            return;
        }

        syncCache();
    };

    const request = async (method = 'GET', body = null) => {
        const options = {
            method,
            headers: {
                Accept: 'application/json',
            },
        };

        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }

        const response = await fetch(getProfileUrl(), options);
        if (!response.ok) {
            throw new Error(`Profile API request failed with status ${response.status}`);
        }

        return response.json();
    };

    const init = async () => {
        ensureCache();
        loadCache();
        state.profileUrl = getProfileUrl();

        try {
            const response = await request();
            applyResponse(response.data);
        } catch {
            syncCache();
        }

        return get();
    };

    const save = async (payload, previousSlug = null) => {
        const fallback = hydrateProfile(payload);

        try {
            const response = await request('POST', {
                action: 'save',
                previousSlug,
                profile: {
                    ...sanitizeProfile(payload),
                    slug: buildSlug(payload),
                },
            });
            applyResponse(response.data.registry);
            return get(response.data.profile.slug);
        } catch {
            const items = getItems();
            if (previousSlug && previousSlug !== fallback.slug && items[previousSlug]) {
                delete items[previousSlug];
            }
            items[fallback.slug] = sanitizeProfile(fallback);
            state.activeSlug = fallback.slug;
            syncCache();
            return fallback;
        }
    };

    const setActive = async (slug) => {
        if (!has(slug)) {
            return get();
        }

        try {
            const response = await request('POST', {
                action: 'set-active',
                slug,
            });
            applyResponse(response.data.registry);
            return get(response.data.profile.slug);
        } catch {
            state.activeSlug = slug;
            syncCache();
            return get(slug);
        }
    };

    const remove = async (slug) => {
        if (!has(slug)) {
            return get();
        }

        try {
            const response = await request('POST', {
                action: 'delete',
                slug,
            });
            applyResponse(response.data.registry);
            return get();
        } catch {
            delete state.items[slug];
            if (Object.keys(state.items).length === 0) {
                return seedDefaults();
            }

            state.activeSlug = Object.keys(state.items)[0];
            syncCache();
            return get();
        }
    };

    const reset = async (slug = null) => {
        try {
            const response = await request('POST', {
                action: 'reset',
                slug: slug ?? getActiveSlug(),
            });
            applyResponse(response.data.registry);
            return get(response.data.profile.slug);
        } catch {
            return seedDefaults();
        }
    };

    const resolveFromLocation = (location = window.location) => {
        const params = new URLSearchParams(location.search);
        const querySlug = params.get('wedding');
        if (querySlug && has(querySlug)) {
            return get(querySlug);
        }

        const segments = location.pathname.split('/').filter(Boolean);
        const lastSegment = segments.at(-1);
        const reserved = ['index.html', 'dashboard.html', 'link-generator.html', 'text-generator.html'];

        if (lastSegment && !reserved.includes(lastSegment) && has(lastSegment)) {
            return get(lastSegment);
        }

        return get();
    };

    return {
        get,
        has,
        list,
        save,
        init,
        reset,
        remove,
        defaults,
        buildSlug,
        setActive,
        getActiveSlug,
        getTemplates,
        getProfileUrl,
        buildPayload,
        resolveFromLocation,
    };
})();
