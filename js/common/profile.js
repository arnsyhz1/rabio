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
});

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

export const weddingProfile = (() => {

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let registry = null;

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let legacy = null;

    const ensureRegistry = () => {
        if (!registry) {
            registry = storage('wedding_profiles');
        }

        if (!legacy) {
            legacy = storage('wedding_profile');
        }

        if (!registry.has('items')) {
            registry.set('items', {});
        }

        if (!registry.has('activeSlug')) {
            registry.set('activeSlug', '');
        }

        const items = registry.get('items');
        const hasLegacyData = Object.keys(legacy.get()).length > 0;

        if (Object.keys(items).length === 0 && hasLegacyData) {
            const migrated = hydrateProfile(legacy.get());
            registry.set('items', { [migrated.slug]: sanitizeProfile(migrated) });
            registry.set('activeSlug', migrated.slug);
            legacy.clear();
        }

        if (Object.keys(registry.get('items')).length === 0) {
            const seeded = hydrateProfile(defaults);
            registry.set('items', { [seeded.slug]: sanitizeProfile(seeded) });
            registry.set('activeSlug', seeded.slug);
        }

        return registry;
    };

    const getItems = () => ensureRegistry().get('items') ?? {};

    const list = () => Object.values(getItems()).map(hydrateProfile);

    const has = (slug) => Object.keys(getItems()).includes(String(slug));

    const getActiveSlug = () => {
        const activeSlug = ensureRegistry().get('activeSlug');
        if (activeSlug && has(activeSlug)) {
            return activeSlug;
        }

        const fallback = list()[0]?.slug ?? hydrateProfile(defaults).slug;
        ensureRegistry().set('activeSlug', fallback);
        return fallback;
    };

    const setActive = (slug) => {
        if (!has(slug)) {
            return get();
        }

        ensureRegistry().set('activeSlug', slug);
        return get(slug);
    };

    const get = (slug = null) => {
        const target = slug && has(slug) ? slug : getActiveSlug();
        return hydrateProfile(getItems()[target]);
    };

    const save = (payload, previousSlug = null) => {
        const profile = hydrateProfile(payload);
        const items = getItems();

        if (previousSlug && previousSlug !== profile.slug && items[previousSlug]) {
            delete items[previousSlug];
        }

        items[profile.slug] = sanitizeProfile(profile);
        ensureRegistry().set('items', items);
        ensureRegistry().set('activeSlug', profile.slug);

        return profile;
    };

    const remove = (slug) => {
        const items = getItems();
        if (!items[slug]) {
            return get();
        }

        delete items[slug];
        ensureRegistry().set('items', items);

        if (Object.keys(items).length === 0) {
            const seeded = hydrateProfile(defaults);
            ensureRegistry().set('items', { [seeded.slug]: sanitizeProfile(seeded) });
            ensureRegistry().set('activeSlug', seeded.slug);
            return seeded;
        }

        if (getActiveSlug() === slug) {
            const nextSlug = Object.keys(items)[0];
            ensureRegistry().set('activeSlug', nextSlug);
        }

        return get();
    };

    const reset = (slug = null) => {
        const targetSlug = slug && has(slug) ? slug : getActiveSlug();
        const items = getItems();
        const seeded = hydrateProfile(defaults);
        items[targetSlug] = sanitizeProfile({
            ...seeded,
            brideShortName: seeded.brideShortName,
            groomShortName: seeded.groomShortName,
        });
        ensureRegistry().set('items', items);
        ensureRegistry().set('activeSlug', targetSlug);

        if (targetSlug !== seeded.slug && !items[seeded.slug]) {
            delete items[targetSlug];
            items[seeded.slug] = sanitizeProfile(seeded);
            ensureRegistry().set('items', items);
            ensureRegistry().set('activeSlug', seeded.slug);
            return seeded;
        }

        return get();
    };

    const init = () => ensureRegistry();

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
        setActive,
        getActiveSlug,
        list,
        save,
        init,
        reset,
        remove,
        defaults,
        buildSlug,
        resolveFromLocation,
    };
})();
