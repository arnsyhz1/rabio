import { util } from '../../common/util.js';
import { bs } from '../../libs/bootstrap.js';
import { dto } from '../../connection/dto.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';
import { localAdmin } from '../../common/local-admin.js';
import { HTTP_STATUS_OK } from '../../connection/request.js';

export const auth = (() => {

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let user = null;

    /**
     * @param {HTMLButtonElement} button
     * @returns {Promise<void>}
     */
    const loginAdmin = async (button) => {
        const btn = util.disableButton(button);

        const formEmail = document.getElementById('loginEmail');
        const formPassword = document.getElementById('loginPassword');

        formEmail.disabled = true;
        formPassword.disabled = true;

        const result = await localAdmin.login(formEmail.value, formPassword.value).then((res) => {
            session.setToken(res.token);
            return true;
        }, () => false);
        if (result) {
            formEmail.value = null;
            formPassword.value = null;
            bs.modal('mainModal').hide();
        }

        btn.restore();
        formEmail.disabled = false;
        formPassword.disabled = false;
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {Promise<void>}
     */
    const loginUser = async (button) => {
        const btn = util.disableButton(button, 'Validating');
        const accessKeyField = document.getElementById('loginAccessKey');
        const accessKey = accessKeyField.value.trim();

        if (accessKey.length === 0) {
            btn.restore();
            alert('Access key tidak boleh kosong');
            return;
        }

        accessKeyField.disabled = true;
        session.setToken(accessKey);

        const valid = await localAdmin.getConfig(accessKey).then(() => true, () => false);
        if (valid) {
            accessKeyField.value = '';
            bs.modal('mainModal').hide();
            window.location.reload();
            return;
        }

        session.logout();
        accessKeyField.disabled = false;
        btn.restore();
        alert('Access key user tidak valid');
    };

    /**
     * @returns {void}
     */
    const clearSession = () => {
        user.clear();
        storage('config').clear();
        session.logout();
        bs.modal('mainModal').show();
    };

    /**
     * @returns {Promise<ReturnType<typeof dto.baseResponse>>}
     */
    const getDetailUser = () => {
        return localAdmin.getUser(session.getToken()).then((data) => {
            Object.entries(data).forEach(([k, v]) => user.set(k, v));
            return dto.baseResponse(HTTP_STATUS_OK, data, null);
        }, (res) => {
            clearSession();
            return res;
        });
    };

    /**
     * @returns {ReturnType<typeof storage>|null}
     */
    const getUserStorage = () => user;

    /**
     * @returns {void}
     */
    const init = () => {
        user = storage('user');
    };

    return {
        init,
        loginAdmin,
        loginUser,
        clearSession,
        getDetailUser,
        getUserStorage,
    };
})();
