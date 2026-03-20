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

const normalizeValue = (key, value) => {
    const fallback = defaults[key];
    if (typeof fallback === 'string') {
        const normalized = String(value ?? '').trim();
        return normalized.length > 0 ? normalized : fallback;
    }

    return value ?? fallback;
};

const toDisplayNames = (profile) => ({
    coupleShortDisplay: `${profile.brideShortName} & ${profile.groomShortName}`,
    coupleShortText: `${profile.brideShortName} and ${profile.groomShortName}`,
});

const createDescription = (profile) => {
    const { coupleShortText } = toDisplayNames(profile);
    return `Save the Date! ${coupleShortText} will be getting married on ${profile.eventDateLabel}. We would be honored to have you join us in celebrating this special day.`;
};

const hydrateDerivedValues = (profile) => {
    const { coupleShortDisplay, coupleShortText } = toDisplayNames(profile);

    return {
        ...profile,
        coupleShortDisplay,
        coupleShortText,
        heroTitle: `${profile.invitationLabel} ${coupleShortText} — You're invited!`,
        desktopSummary: `${coupleShortText} will be getting married on ${profile.eventDateLabel}.`,
        welcomeCouple: `${profile.brideShortName} dan ${profile.groomShortName}`,
        invitationDescription: createDescription(profile),
    };
};

export const weddingProfile = (() => {

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let table = null;

    const ensureTable = () => {
        if (!table) {
            table = storage('wedding_profile');
        }

        return table;
    };

    const get = () => {
        const current = ensureTable().get();
        const merged = keys.reduce((result, key) => {
            result[key] = normalizeValue(key, current[key]);
            return result;
        }, {});

        return hydrateDerivedValues(merged);
    };

    const set = (payload) => {
        const current = get();
        const next = keys.reduce((result, key) => {
            result[key] = normalizeValue(key, payload[key] ?? current[key]);
            return result;
        }, {});

        const profile = hydrateDerivedValues(next);
        const wedding = ensureTable();
        keys.forEach((key) => wedding.set(key, profile[key]));

        return profile;
    };

    const reset = () => {
        const wedding = ensureTable();
        wedding.clear();
        return get();
    };

    const init = () => ensureTable();

    return {
        get,
        set,
        init,
        reset,
        defaults,
    };
})();
