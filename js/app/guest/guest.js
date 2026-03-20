import { image } from './image.js';
import { audio } from './audio.js';
import { progress } from './progress.js';
import { util } from '../../common/util.js';
import { bs } from '../../libs/bootstrap.js';
import { theme } from '../../common/theme.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';
import { offline } from '../../common/offline.js';
import { weddingProfile } from '../../common/profile.js';
import { comment } from '../component/comment.js';
import { basicAnimation, openAnimation } from '../../libs/confetti.js';

export const guest = (() => {

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let information = null;

    /**
     * @param {string} id
     * @param {string} value
     * @returns {void}
     */
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        }
    };

    /**
     * @param {string} id
     * @param {string} value
     * @returns {void}
     */
    const setMultiline = (id, value) => {
        const el = document.getElementById(id);
        if (!el) {
            return;
        }

        el.innerHTML = util.escapeHtml(value).replace(/\n/g, '<br>');
    };

    /**
     * @returns {void}
     */
    const applyProfile = () => {
        const profile = weddingProfile.resolveFromLocation();

        document.title = profile.heroTitle;
        document.body.setAttribute('data-template', profile.templateKey);

        document.querySelector('link[rel="canonical"]')?.setAttribute('href', profile.publicUrl);
        document.querySelector('meta[property="og:url"]')?.setAttribute('content', profile.publicUrl);
        document.querySelector('meta[property="og:image"]')?.setAttribute('content', `${profile.baseUrl}/assets/images/share.webp`);
        document.querySelector('meta[property="og:image:secure_url"]')?.setAttribute('content', `${profile.baseUrl}/assets/images/share.webp`);

        document.querySelectorAll('meta[name="title"], meta[property="og:title"], meta[property="og:image:alt"], meta[property="og:site_name"], meta[name="apple-mobile-web-app-title"]').forEach((meta) => {
            meta.setAttribute('content', profile.heroTitle);
        });

        document.querySelectorAll('meta[name="description"], meta[property="og:description"]').forEach((meta) => {
            meta.setAttribute('content', profile.invitationDescription);
        });

        setText('desktop-badge', profile.desktopBadge);
        setText('desktop-summary', profile.desktopSummary);
        setText('hero-label', profile.invitationLabel);
        setText('hero-couple', profile.coupleShortDisplay);
        setText('hero-date', profile.eventDateLabel);
        setText('bride-full-name', profile.brideFullName);
        setText('groom-full-name', profile.groomFullName);
        setText('bride-role', profile.brideRole);
        setText('groom-role', profile.groomRole);
        setText('welcome-couple', profile.welcomeCouple);
        setText('invitation-intro', profile.invitationIntro);
        setMultiline('bride-parents', profile.brideParents);
        setMultiline('groom-parents', profile.groomParents);

        const countdown = document.getElementById('count-down');
        if (countdown) {
            countdown.setAttribute('data-time', profile.calendarStart);
        }

        const guestName = document.getElementById('guest-name');
        if (guestName) {
            guestName.setAttribute('data-message', profile.guestSalutation);
        }
    };

    /**
     * @returns {void}
     */
    const countDownDate = () => {
        const until = document.getElementById('count-down')?.getAttribute('data-time')?.replace(' ', 'T');
        if (!until) {
            alert('invalid count down date.');
            return;
        }

        const count = (new Date(until)).getTime();

        setInterval(() => {
            const distance = Math.abs(count - Date.now());

            document.getElementById('day').innerText = Math.floor(distance / (1000 * 60 * 60 * 24)).toString();
            document.getElementById('hour').innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString();
            document.getElementById('minute').innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString();
            document.getElementById('second').innerText = Math.floor((distance % (1000 * 60)) / 1000).toString();
        }, 1000);
    };

    /**
     * @param {string} id
     * @param {number} speed
     * @returns {void}
     */
    const opacity = (id, speed = 0.01) => {
        const el = document.getElementById(id);
        let op = parseFloat(el.style.opacity);

        let clear = null;
        const callback = () => {
            if (op > 0) {
                el.style.opacity = op.toFixed(3);
                op -= speed;
                return;
            }

            clearInterval(clear);
            clear = null;
            el.remove();
        };

        clear = setInterval(callback, 10);
    };

    /**
     * @returns {void}
     */
    const showGuestName = () => {
        /**
         * Make sure "to=" is the last query string.
         * Ex. ulems.my.id/?id=some-uuid-here&to=name
         */
        const raw = window.location.search.split('to=');
        let name = null;

        if (raw.length > 1 && raw[1].length >= 1) {
            name = window.decodeURIComponent(raw[1]);
        }

        if (name) {
            const guestName = document.getElementById('guest-name');
            const div = document.createElement('div');
            div.classList.add('m-2');
            div.innerHTML = `<small class="mt-0 mb-1 mx-0 p-0">${guestName?.getAttribute('data-message')}</small><p class="m-0 p-0" style="font-size: 1.3rem">${util.escapeHtml(name)}</p>`;

            guestName?.appendChild(div);
        }

        const form = document.getElementById('form-name');
        if (form) {
            form.value = information.get('name') ?? name;
        }
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const open = (button) => {
        button.disabled = true;
        document.body.scrollIntoView({ behavior: 'instant' });

        if (theme.isAutoMode()) {
            document.getElementById('button-theme').style.display = 'block';
        }

        audio.init();
        theme.spyTop();

        basicAnimation();
        opacity('welcome', 0.025);
        util.timeOut(openAnimation, 1500);
    };

    /**
     * @param {HTMLImageElement} img
     * @returns {void}
     */
    const modal = (img) => {
        const m = document.getElementById('show-modal-image');
        m.src = img.src;
        m.width = img.width;
        m.height = img.height;
        bs.modal('modal-image').show();
    };

    /**
     * @returns {void}
     */
    const closeInformation = () => information.set('info', true);

    /**
     * @returns {void}
     */
    const normalizeArabicFont = () => {
        document.querySelectorAll('.font-arabic').forEach((el) => {
            el.innerHTML = String(el.innerHTML).normalize('NFC');
        });
    };

    /**
     * @returns {void}
     */
    const animateSvg = () => {
        document.querySelectorAll('svg').forEach((el) => {
            util.timeOut(() => el.classList.add(el.getAttribute('data-class')), parseInt(el.getAttribute('data-time')));
        });
    };

    /**
     * @returns {void}
     */
    const buildGoogleCalendar = () => {
        const profile = weddingProfile.resolveFromLocation();

        /**
         * @param {string} d 
         * @returns {string}
         */
        const formatDate = (d) => (new Date(d + ':00Z')).toISOString().replace(/[-:]/g, '').split('.')[0];

        const buildGoogleCalendarURL = () => {
            const url = new URL('https://calendar.google.com/calendar/render');
            const data = {
                action: 'TEMPLATE',
                text: profile.calendarTitle,
                dates: `${formatDate(profile.calendarStart)}/${formatDate(profile.calendarEnd)}`,
                details: profile.invitationIntro,
                location: profile.calendarLocation,
                ctz: profile.calendarTimeZone,
            };
            Object.entries(data).forEach(([k, v]) => url.searchParams.set(k, v));
            return url.toString();
        };

        const buildICS = () => {
            const formatICSDate = (d) => new Date(d.replace(' ', 'T')).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            const normalizeLine = (value) => String(value).replace(/\n/g, '\\n').replace(/,/g, '\\,');

            return [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//Rabio Premium Wedding//EN',
                'BEGIN:VEVENT',
                `UID:${Date.now()}@rabio-premium`,
                `DTSTAMP:${formatICSDate(profile.calendarStart)}`,
                `DTSTART:${formatICSDate(profile.calendarStart)}`,
                `DTEND:${formatICSDate(profile.calendarEnd)}`,
                `SUMMARY:${normalizeLine(profile.calendarTitle)}`,
                `DESCRIPTION:${normalizeLine(profile.invitationIntro)}`,
                `LOCATION:${normalizeLine(profile.calendarLocation)}`,
                'END:VEVENT',
                'END:VCALENDAR',
            ].join('\r\n');
        };

        const isAppleDevice = () => {
            const ua = navigator.userAgent || window.navigator.userAgent;
            return /iPad|iPhone|iPod|Macintosh/.test(ua) && !window.MSStream;
        };

        document.querySelector('#addToCalendar')?.addEventListener('click', () => {
            if (isAppleDevice()) {
                const file = new Blob([buildICS()], { type: 'text/calendar;charset=utf-8' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(file);
                link.download = `${profile.coupleShortText.replace(/\s+/g, '-').toLowerCase()}-premium.ics`;
                link.click();
                URL.revokeObjectURL(link.href);
            } else {
                const url = buildGoogleCalendarURL();
                window.open(url, '_blank');
            }
        });
    };

    /**
     * @returns {void}
     */
    const booting = () => {
        applyProfile();
        animateSvg();
        countDownDate();
        showGuestName();
        normalizeArabicFont();
        buildGoogleCalendar();
        document.getElementById('root').style.opacity = '1';

        if (information.has('presence')) {
            document.getElementById('form-presence').value = information.get('presence') ? '1' : '2';
        }

        if (information.get('info')) {
            document.getElementById('information')?.remove();
        }

        window.AOS.init();
        document.body.scrollIntoView({ behavior: 'instant' });

        // remove loading screen and show welcome screen.
        opacity('loading', 0.025);
    };

    /**
     * @returns {void}
     */
    const domLoaded = async () => {
        offline.init();
        progress.init();
        information = storage('information');
        await weddingProfile.init();
        const token = document.body.getAttribute('data-key');

        // document.addEventListener('progress.done', () => booting());
        booting();
        document.addEventListener('hide.bs.modal', () => document.activeElement?.blur());

        if (!token || token.length <= 0) {
            image.init().load();
            document.getElementById('comment')?.remove();
            document.querySelector('a.nav-link[href="#comment"]')?.closest('li.nav-item')?.remove();
        }

        if (token.length > 0) {
            // add 2 progress for config and comment.
            // before img.load();
            progress.add();
            progress.add();

            const img = image.init();
            if (!img.hasDataSrc()) {
                img.load();
            }

            const params = new URLSearchParams(window.location.search);
            session.setToken(params.get('k') ?? token);

            // fetch after document is loaded.
            window.addEventListener('load', () => session.guest().then(() => {
                progress.complete('config');

                if (img.hasDataSrc()) {
                    img.load();
                }

                comment.init();
                comment.show()
                    .then(() => progress.complete('comment'))
                    .catch(() => progress.invalid('comment'));
            }).catch(() => progress.invalid('config')));
        }
    };

    /**
     * @returns {object}
     */
    const init = () => {
        theme.init();
        session.init();

        if (session.isAdmin()) {
            storage('user').clear();
            storage('owns').clear();
            storage('likes').clear();
            storage('session').clear();
            storage('comment').clear();
            storage('tracker').clear();
        }

        window.addEventListener('DOMContentLoaded', domLoaded);

        return {
            util,
            theme,
            comment,
            guest: {
                open,
                modal,
                closeInformation,
            },
        };
    };

    return {
        init,
    };
})();
