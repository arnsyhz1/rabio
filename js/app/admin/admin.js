import { auth } from './auth.js';
import { navbar } from './navbar.js';
import { util } from '../../common/util.js';
import { dto } from '../../connection/dto.js';
import { theme } from '../../common/theme.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';
import { offline } from '../../common/offline.js';
import { weddingProfile } from '../../common/profile.js';
import { comment } from '../component/comment.js';
import { request, HTTP_GET, HTTP_PATCH, HTTP_PUT } from '../../connection/request.js';

export const admin = (() => {

    /**
     * @returns {Promise<void>}
     */
    const getAllRequest = async () => {
        await auth.getDetailUser().then((res) => {

            document.getElementById('dashboard-name').innerHTML = `${util.escapeHtml(res.data.name)}<i class="fa-solid fa-hands text-warning ms-2"></i>`;
            document.getElementById('dashboard-email').innerHTML = res.data.email;
            document.getElementById('dashboard-accesskey').value = res.data.access_key;
            document.getElementById('button-copy-accesskey').setAttribute('data-copy', res.data.access_key);

            document.getElementById('form-name').value = util.escapeHtml(res.data.name);
            document.getElementById('filterBadWord').checked = Boolean(res.data.is_filter);
            document.getElementById('replyComment').checked = Boolean(res.data.can_reply);
            document.getElementById('editComment').checked = Boolean(res.data.can_edit);
            document.getElementById('deleteComment').checked = Boolean(res.data.can_delete);
        });

        request(HTTP_GET, '/api/stats').token(session.getToken()).send().then((res) => {
            document.getElementById('count-comment').innerHTML = String(res.data.comments).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            document.getElementById('count-like').innerHTML = String(res.data.likes).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            document.getElementById('count-present').innerHTML = String(res.data.present).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            document.getElementById('count-absent').innerHTML = String(res.data.absent).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        });

        comment.show();
    };

    /**
     * @param {HTMLElement} checkbox
     * @returns {Promise<void>}
     */
    const changeFilterBadWord = async (checkbox) => {
        const label = util.disableCheckbox(checkbox);

        await request(HTTP_PATCH, '/api/user').
            token(session.getToken()).
            body({
                filter: Boolean(checkbox.checked)
            }).
            send();

        label.restore();
    };

    /**
     * @param {HTMLElement} checkbox
     * @returns {Promise<void>}
     */
    const replyComment = async (checkbox) => {
        const label = util.disableCheckbox(checkbox);

        await request(HTTP_PATCH, '/api/user').
            token(session.getToken()).
            body({
                can_reply: Boolean(checkbox.checked)
            }).
            send();

        label.restore();
    };

    /**
     * @param {HTMLElement} checkbox
     * @returns {Promise<void>}
     */
    const editComment = async (checkbox) => {
        const label = util.disableCheckbox(checkbox);

        await request(HTTP_PATCH, '/api/user').
            token(session.getToken()).
            body({
                can_edit: Boolean(checkbox.checked)
            }).
            send();

        label.restore();
    };

    /**
     * @param {HTMLElement} checkbox
     * @returns {Promise<void>}
     */
    const deleteComment = async (checkbox) => {
        const label = util.disableCheckbox(checkbox);

        await request(HTTP_PATCH, '/api/user').
            token(session.getToken()).
            body({
                can_delete: Boolean(checkbox.checked)
            }).
            send();

        label.restore();
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {Promise<void>}
     */
    const regenerate = async (button) => {
        if (!confirm('Are you sure?')) {
            return;
        }

        const btn = util.disableButton(button);

        await request(HTTP_PUT, '/api/key').
            token(session.getToken()).
            send(dto.statusResponse).
            then((res) => {
                if (res.data.status) {
                    getAllRequest();
                }
            });

        btn.restore();
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {Promise<void>}
     */
    const changePassword = async (button) => {
        const old = document.getElementById('old_password');
        const newest = document.getElementById('new_password');

        if (old.value.length === 0 || newest.value.length === 0) {
            alert('Password cannot be empty');
            return;
        }

        old.disabled = true;
        newest.disabled = true;

        const btn = util.disableButton(button);

        const result = await request(HTTP_PATCH, '/api/user').
            token(session.getToken()).
            body({
                old_password: old.value,
                new_password: newest.value,
            }).
            send(dto.statusResponse).
            then((res) => res.data.status, () => false);

        btn.restore();

        old.disabled = false;
        newest.disabled = false;

        if (result) {
            old.value = null;
            newest.value = null;
            button.disabled = true;
            alert('Success change password');
        }
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {Promise<void>}
     */
    const changeName = async (button) => {
        const name = document.getElementById('form-name');

        if (name.value.length === 0) {
            alert('Name cannot be empty');
            return;
        }

        name.disabled = true;
        const btn = util.disableButton(button);

        const result = await request(HTTP_PATCH, '/api/user').
            token(session.getToken()).
            body({
                name: name.value,
            }).
            send(dto.statusResponse).
            then((res) => res.data.status, () => false);

        name.disabled = false;
        btn.restore();

        if (result) {
            getAllRequest();
            button.disabled = true;
            alert('Success change name');
        }
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {Promise<void>}
     */
    const download = async (button) => {
        const btn = util.disableButton(button);

        await request(HTTP_GET, '/api/download').token(session.getToken()).download();

        btn.restore();
    };

    /**
     * @returns {void}
     */
    const enableButtonName = () => {
        const btn = document.getElementById('button-change-name');
        if (btn.disabled) {
            btn.disabled = false;
        }
    };

    /**
     * @returns {void}
     */
    const enableButtonPassword = () => {
        const btn = document.getElementById('button-change-password');
        const old = document.getElementById('old_password');

        if (btn.disabled && old.value.length !== 0) {
            btn.disabled = false;
        }
    };

    /**
     * @param {string} id
     * @param {string} value
     * @returns {void}
     */
    const setValue = (id, value) => {
        const field = document.getElementById(id);
        if (field) {
            field.value = value;
        }
    };

    /**
     * @returns {void}
     */
    const populateProfileOptions = (selectedSlug = null) => {
        const picker = document.getElementById('premium-profile-picker');
        if (!picker) {
            return;
        }

        const activeSlug = selectedSlug ?? weddingProfile.getActiveSlug();
        picker.innerHTML = weddingProfile.list().map((profile) => `<option value="${profile.slug}" ${profile.slug === activeSlug ? 'selected' : ''}>${util.escapeHtml(profile.label)} (${util.escapeHtml(profile.slug)})</option>`).join('');
    };

    /**
     * @param {string=} selectedKey
     * @returns {void}
     */
    const populateTemplateOptions = (selectedKey = null) => {
        const picker = document.getElementById('premium-template-key');
        if (!picker) {
            return;
        }

        picker.innerHTML = weddingProfile.getTemplates().map((template) => `<option value="${template.key}" ${template.key === selectedKey ? 'selected' : ''}>${util.escapeHtml(template.name)}</option>`).join('');
    };

    /**
     * @param {object=} profileData
     * @returns {void}
     */
    const syncPremiumForm = (profileData = null) => {
        const profile = profileData ?? weddingProfile.get();
        setValue('premium-invitation-label', profile.invitationLabel);
        setValue('premium-desktop-badge', profile.desktopBadge);
        setValue('premium-bride-short', profile.brideShortName);
        setValue('premium-groom-short', profile.groomShortName);
        setValue('premium-bride-full', profile.brideFullName);
        setValue('premium-groom-full', profile.groomFullName);
        setValue('premium-bride-role', profile.brideRole);
        setValue('premium-groom-role', profile.groomRole);
        populateTemplateOptions(profile.templateKey);
        setValue('premium-bride-parents', profile.brideParents);
        setValue('premium-groom-parents', profile.groomParents);
        setValue('premium-event-date', profile.eventDateLabel);
        setValue('premium-guest-salutation', profile.guestSalutation);
        setValue('premium-intro', profile.invitationIntro);
        setValue('premium-base-url', profile.baseUrl);
        setValue('premium-calendar-title', profile.calendarTitle);
        setValue('premium-calendar-start', profile.calendarStart);
        setValue('premium-calendar-end', profile.calendarEnd);
        setValue('premium-calendar-location', profile.calendarLocation);
        setValue('premium-profile-original-slug', profile.slug);
        setValue('premium-generated-slug', profile.slug);
        setValue('premium-generated-url', profile.publicUrl);
        populateProfileOptions(profile.slug);
    };

    /**
     * @param {'success'|'secondary'} mode
     * @param {string} message
     * @returns {void}
     */
    const showPremiumStatus = (mode, message) => {
        const status = document.getElementById('premium-status');
        if (!status) {
            return;
        }

        status.className = `alert alert-${mode} rounded-4 py-2 px-3 mt-3 mb-0`;
        status.textContent = message;
    };

    /**
     * @returns {object}
     */
    const readPremiumForm = () => ({
        invitationLabel: document.getElementById('premium-invitation-label').value,
        desktopBadge: document.getElementById('premium-desktop-badge').value,
        brideShortName: document.getElementById('premium-bride-short').value,
        groomShortName: document.getElementById('premium-groom-short').value,
        brideFullName: document.getElementById('premium-bride-full').value,
        groomFullName: document.getElementById('premium-groom-full').value,
        brideRole: document.getElementById('premium-bride-role').value,
        groomRole: document.getElementById('premium-groom-role').value,
        templateKey: document.getElementById('premium-template-key').value,
        brideParents: document.getElementById('premium-bride-parents').value,
        groomParents: document.getElementById('premium-groom-parents').value,
        eventDateLabel: document.getElementById('premium-event-date').value,
        guestSalutation: document.getElementById('premium-guest-salutation').value,
        invitationIntro: document.getElementById('premium-intro').value,
        baseUrl: document.getElementById('premium-base-url').value,
        calendarTitle: document.getElementById('premium-calendar-title').value,
        calendarStart: document.getElementById('premium-calendar-start').value,
        calendarEnd: document.getElementById('premium-calendar-end').value,
        calendarLocation: document.getElementById('premium-calendar-location').value,
    });

    /**
     * @returns {void}
     */
    const refreshGeneratedSlug = () => {
        const draft = readPremiumForm();
        const slug = weddingProfile.buildSlug(draft);
        const baseUrl = String(draft.baseUrl || weddingProfile.defaults.baseUrl).replace(/\/+$/, '');
        setValue('premium-generated-slug', slug);
        setValue('premium-generated-url', `${baseUrl}/${slug}`);
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const savePremiumProfile = async (button) => {
        const originalSlug = document.getElementById('premium-profile-original-slug').value;
        const btn = util.disableButton(button, 'Saving');
        const profile = await weddingProfile.save(readPremiumForm(), originalSlug || null);
        syncPremiumForm(profile);
        btn.restore();
        showPremiumStatus('success', `Profile ${profile.label} saved. Public URL: ${profile.publicUrl}`);
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const resetPremiumProfile = async (button) => {
        if (!confirm('Reset premium wedding profile to the default template?')) {
            return;
        }

        const btn = util.disableButton(button, 'Resetting');
        const profile = await weddingProfile.reset();
        syncPremiumForm(profile);
        btn.restore();
        showPremiumStatus('secondary', `Profile reset to template defaults. Active URL: ${profile.publicUrl}`);
    };

    /**
     * @returns {void}
     */
    const createPremiumProfile = async () => {
        const totalProfiles = weddingProfile.list().length + 1;
        const profile = await weddingProfile.save({
            ...weddingProfile.defaults,
            brideShortName: `Pengantin Wanita ${totalProfiles}`,
            groomShortName: `Pengantin Pria ${totalProfiles}`,
            brideFullName: `Nama Lengkap Pengantin Wanita ${totalProfiles}`,
            groomFullName: `Nama Lengkap Pengantin Pria ${totalProfiles}`,
            baseUrl: weddingProfile.get().baseUrl,
            templateKey: 'classic',
        });
        syncPremiumForm(profile);
        showPremiumStatus('secondary', `Draft pasangan baru dibuat. Silakan lengkapi detail untuk slug ${profile.slug}.`);
    };

    /**
     * @param {HTMLSelectElement} select
     * @returns {void}
     */
    const changePremiumProfile = async (select) => {
        const profile = await weddingProfile.setActive(select.value);
        syncPremiumForm(profile);
        showPremiumStatus('secondary', `Berpindah ke profile ${profile.label}.`);
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const deletePremiumProfile = async (button) => {
        if (weddingProfile.list().length <= 1) {
            showPremiumStatus('secondary', 'Minimal harus ada satu profile pasangan.');
            return;
        }

        const currentSlug = document.getElementById('premium-profile-original-slug').value;
        const currentProfile = weddingProfile.get(currentSlug);
        if (!confirm(`Delete profile ${currentProfile.label}?`)) {
            return;
        }

        const btn = util.disableButton(button, 'Deleting');
        const nextProfile = await weddingProfile.remove(currentSlug);
        syncPremiumForm(nextProfile);
        btn.restore();
        showPremiumStatus('secondary', `Profile ${currentProfile.label} deleted. Active profile sekarang ${nextProfile.label}.`);
    };

    /**
     * @returns {void}
     */
    const logout = () => {
        if (!confirm('Are you sure?')) {
            return;
        }

        auth.clearSession();
    };

    /**
     * @returns {void}
     */
    const domLoaded = async () => {
        offline.init();
        comment.init();
        theme.spyTop();
        await weddingProfile.init();
        syncPremiumForm();
        document.querySelectorAll('[data-premium-sync="slug"]').forEach((field) => field.addEventListener('input', refreshGeneratedSlug));

        document.addEventListener('hidden.bs.modal', getAllRequest);

        try {
            const raw = window.location.href.split('?k=');
            if (raw.length > 1 && raw[1].length >= 1) {
                session.setToken(raw[1]);
                window.history.replaceState({}, document.title, raw[0]);
            }

            const exp = session.decode()?.exp;
            if (!exp || exp < (Date.now() / 1000)) {
                throw new Error('Invalid token');
            }

            getAllRequest();
        } catch {
            auth.clearSession();
        }
    };

    /**
     * @returns {object}
     */
    const init = () => {
        auth.init();
        theme.init();
        session.init();
        weddingProfile.init();

        if (!session.isAdmin()) {
            storage('owns').clear();
            storage('likes').clear();
            storage('config').clear();
            storage('comment').clear();
            storage('session').clear();
            storage('information').clear();
        }

        window.addEventListener('DOMContentLoaded', domLoaded);

        return {
            util,
            theme,
            comment,
            admin: {
                auth,
                navbar,
                logout,
                download,
                regenerate,
                editComment,
                replyComment,
                deleteComment,
                changeName,
                changePassword,
                changeFilterBadWord,
                enableButtonName,
                enableButtonPassword,
                createPremiumProfile,
                changePremiumProfile,
                deletePremiumProfile,
                savePremiumProfile,
                resetPremiumProfile,
            },
        };
    };

    return {
        init,
    };
})();
