
const config = {
    email_to: 'ramirezmendozaf@gmail.com',
    data_url: 'assets/data/experience.json',
    msg_duration: 4000,
    max_retries: 3
};

/* MANEJO DE DESCARGAS */

class DownloadHandler {
    constructor(selector) {
        this.button = document.querySelector(selector);
        if (!this.button) {
            console.warn(`DownloadHandler: No se encontró el botón "${selector}"`);
            return;
        }
            this.currentMessage = null;
            this.handleClick = this.handleClick.bind(this);
            this.button.addEventListener('click', this.handleClick);
    }

    handleClick(e) {
        e.preventDefault();
            const href = this.button.getAttribute('href');
            const filename = this.button.getAttribute('download') || '';
                if (!href) {
                    console.error('DownloadHandler: Falta atributo href en el botón');
                    this.showFeedback('Archivo no disponible.', true);
                    return;
                }

        try {
            const link = document.createElement('a');
                    link.href = href;
                    link.download = filename;
                    link.rel = 'noopener';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                this.showFeedback('Descarga iniciada. ¡Gracias por tu interés!');
            } catch (error) {
                console.error('DownloadHandler: Error al descargar:', error);
                this.showFeedback('Error al iniciar la descarga.', true);
            }
        }

    showFeedback(message, isError = false) {
        if (!this.button) return;
            if (this.currentMessage) {
                    this.currentMessage.remove();
        }

    const msg = document.createElement('div');
        msg.className = isError ? 'error-msg' : 'ok-msg';
        msg.textContent = message;
            this.button.insertAdjacentElement('afterend', msg);
            this.currentMessage = msg;
        requestAnimationFrame(() => msg.classList.add('visible'));

    setTimeout(() => {
            if (msg.parentNode) {
                msg.remove();
            }
            if (this.currentMessage === msg) {
                this.currentMessage = null;
            }
        }, config.msg_duration);
    }

    destroy() {
        if (this.button && this.handleClick) {
            this.button.removeEventListener('click', this.handleClick);
        }
        if (this.currentMessage) {
            this.currentMessage.remove();
            this.currentMessage = null;
        }
    }
}

/* VALIDACIÓN DE FORMULARIO */

class FormValidator {
    constructor(selector) {
        this.form = document.querySelector(selector);
        if (!this.form) return;

        this.fields = ['nombre', 'empresa', 'correo', 'whatsapp', 'asunto', 'mensaje'];
        this.rules = {
            nombre: [2, 50],
            empresa: [2, 100],
            asunto: [5, 100],
            mensaje: [10, 1000]
        };
        this.boundHandleSubmit = this.handleSubmit.bind(this);
        this.fieldListeners = new Map();
        this.currentMessage =null;
        this.init();
    }

    init() {
        this.form.addEventListener('submit', this.boundHandleSubmit);

        this.form.querySelectorAll('input, textarea').forEach(field => {
            const blurHandler = () => this.validateField(field);
            const inputHandler = () => this.clearField(field);
            field.addEventListener('blur', blurHandler);
            field.addEventListener('input', inputHandler);
            this.fieldListeners.set(field, { blurHandler, inputHandler });
        });

    }

    handleSubmit(e) {
        e.preventDefault();
        this.clearAll();

        const data = Object.fromEntries(this.fields.map(f => [f, this.getValue(f)]));
        const errors = this.validateAll(data);

        if (Object.keys(errors).length) {
            this.displayErrors(errors);
            this.focusFirstError();
        } else {
            this.send(data);
        }
    }

    validateAll(data) {
        const errors = {};
        const required = ['nombre', 'empresa', 'correo', 'asunto', 'mensaje'];

        required.forEach(f => !data[f] && (errors[f] = 'Campo requerido'));
        if (data.correo && !this.isEmail(data.correo)) errors.correo = 'Email inválido';
            if (data.whatsapp && !this.isPhone(data.whatsapp)) errors.whatsapp = 'Teléfono inválido';

        for (const [field, [min, max]] of Object.entries(this.rules)) {
            const val = data[field];
            if (!val) continue;
                if (val.length < min) errors[field] = `Mínimo ${min} caracteres`;
                    if (val.length > max) errors[field] = `Máximo ${max} caracteres`;
        }
        return errors;
    }

    isEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    }

    isPhone(phone) {
        return /^(\+\d{1,3})?\d{10,14}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    validateField(field) {
        const val = field.value.trim();
        let msg = '';

        if (field.required && !val)
            { msg = 'Campo requerido';
                }else if (field.name === 'correo' && val && !this.isEmail(val)){ msg = 'Email inválido';
                    }else if (field.name === 'whatsapp' && val && !this.isPhone(val)){ msg = 'Teléfono inválido';
                        }else if (val && this.rules[field.name]) {
                            const [min, max] = this.rules[field.name];
                                if (val.length < min) msg = `Mínimo ${min} caracteres`;
                                    else if (val.length > max) msg = `Máximo ${max} caracteres`;
        }

        msg ? this.showError(field, msg) : this.clearField(field);
    }

    send(data) {
        console.log('Enviando:', data);
        this.openMailClient(data);
        this.showSuccess();
        this.form.reset();
        this.clearAll();
    }

    openMailClient(data) {
        const subject = `Contacto: ${data.asunto}`;
        const body = this.buildBody(data);
        const mailtoLink = `mailto:${config.email_to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        window.location.href =mailtoLink;

        const gmailTab = window.open(gmail, '_blank');

        if (!gmailTab) {
            const outlookTab = window.open(outlook, '_blank');
            if (!outlookTab) {
                alert('Por favor, permite popups para enviar el mensaje.');
            }
        }
    }

    buildBody(data) {
        return `Hola,

        Me pongo en contacto contigo desde tu formulario web.

        DATOS DE CONTACTO:
        ------------------
        Nombre: ${data.nombre}
        Empresa: ${data.empresa}
        Email: ${data.correo}
        WhatsApp: ${data.whatsapp || 'No proporcionado'}

        MENSAJE:
        --------
        ${data.mensaje}

        Saludos cordiales.`;
    }

    /* INTERFAZ VISUAL Y UTILIDADES */
    getValue(name) {
        return this.form.querySelector(`[name="${name}"]`)?.value.trim() || '';
    }

    showError(field, msg) {
        const group = field.closest('.form-group');
            if (!group) return;
                field.classList.add('error');
        let errorEl = group.querySelector('.error-msg');
            if (!errorEl) {
                errorEl = document.createElement('span');
                errorEl.className = 'error-msg';
                group.appendChild(errorEl);
            }
                errorEl.textContent = msg;
                errorEl.style.display = 'block';
    }

    clearField(field) {
        const group = field.closest('.form-group');
            if (!group) return;
                field.classList.remove('error');
        const errorEl = group.querySelector('.error-msg');
            if (errorEl) errorEl.remove();
    }

    clearAll() {
        this.form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        this.form.querySelectorAll('.error-msg').forEach(el => {
            el.style.display = 'none';
            el.textContent = '';
        });
    }

    displayErrors(errors) {
        Object.entries(errors).forEach(([name, msg]) => {
            const field = this.form.querySelector(`[name="${name}"]`);
                if (field) this.showError(field, msg);
        });
    }

    focusFirstError() {
        this.form.querySelector('.error')?.focus();
    }

    showSuccess() {
        this.form.querySelectorAll('.ok-msg, .error-msg').forEach(m => m.remove());
            const msg = document.createElement('div');
            msg.className = 'ok-msg';
            msg.innerHTML = '<i class="fas fa-check-circle"></i> ¡Mensaje listo! Se abrirá tu aplicación de correo.';

            this.form.prepend(msg);
            this.currentMessage = msg;


        setTimeout(() => {
            if (msg.parentNode) msg.remove();
        }, config.msg_duration);
}

    destroy() {
        if (this.form) {
            this.form.removeEventListener('submit', this.boundHandleSubmit);
        }
        this.fieldListeners.forEach((handlers, field) => {
            field.removeEventListener('blur', handlers.blurHandler);
            field.removeEventListener('input', handlers.inputHandler);
        });

        this.fieldListeners.clear();
    }

}

/* CARGA DE EXPERIENCIAS */

class ExperienceLoader {
    constructor(selector) {
        this.container = document.querySelector(selector);
        if (!this.container) {
            console.warn(`ExperienceLoader: No se encontró el contenedor "${selector}"`);
            return;
        }
        this.abortController = new AbortController();
        this.load();
    }

    async load() {
        if (!config?.data_url) {
                console.error('Configuración inválida: falta config.data_url');
                    this.renderError('Error de configuración: No se encontró la URL de datos.');
                    return;
        }
                    this.container.innerHTML = '<p class="loading-msg">Cargando experiencias...</p>';

        try {
            const response = await fetch(config.data_url);
                if (!response.ok) {
                    throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
                if (!data?.experiences || !Array.isArray(data.experiences)) {
                    throw new Error('Estructura de datos inválida: falta "experiences"');
            }

            const validExperiences = data.experiences.filter(exp => {
                return exp && typeof exp === 'object' && !Array.isArray(exp);
            });

            if (validExperiences.length === 0) {
                throw new Error('No hay experiencias válidas en los datos');
            }

            this.render(validExperiences);
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Carga de experiencias cancelada');
                return;
            }

            console.error('Error cargando experiencias:', error);
            this.renderError('No se pudieron cargar las experiencias. Intenta más tarde.');
        }
    }

    render(experiences) {
        if (!experiences.length) {
            this.container.innerHTML = '<p>No hay experiencias disponibles.</p>';
            return;
        }

        this.container.innerHTML = experiences.map(exp => this.createHTML(exp)).join('');
    }
    escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    createHTML(exp) {
        const list = Array.isArray(exp.responsibilities) && exp.responsibilities.length
            ? exp.responsibilities.map(r => `<li>${this.escapeHTML(r)}</li>`).join('')
            : '<li>Sin información disponible</li>';

        return `
        <div class="experience-item">
            <div class="experience-left">
                <h3 class="job-title">${this.escapeHTML(exp.company || 'Empresa desconocida')}</h3>
                <p class="job-position">${this.escapeHTML(exp.position || 'Cargo no especificado')}</p>
                <span class="job-year">${this.escapeHTML(exp.year || '')}</span>
            </div>
            <div class="experience-right">
                <ul class="job-responsibilities">${list}</ul>
            </div>
        </div>`;
    }

    renderError(message) {
        const p = document.createElement('p');
            p.className = 'error-msg';
            p.textContent = message;
            this.container.innerHTML = '';
            this.container.appendChild(p);
    }

    destroy() {
        if (this.abortController) {
            this.abortController.abort();
        }

        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

/* MANEJO DEL MENÚ */

class MenuHandler {
    constructor(btnSelector, menuSelector, config = {}) {
        this.menuBtn = document.querySelector(btnSelector);
        this.menu = document.querySelector(menuSelector);
        if (!this.menuBtn || !this.menu) {
            console.error(`MenuHandler: No se encontraron elementos`);
            return;
        }
        this.config = config;
        this.isOpen = false;

        this.handleMenuBtnClick = this.handleMenuBtnClick.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleMenuClick = this.handleMenuClick.bind(this);

        this.init();
    }

    init() {
        this.menuBtn.addEventListener('click', this.handleMenuBtnClick);
        this.menu.addEventListener('click', this.handleMenuClick);
        document.addEventListener('click', this.handleOutsideClick);

        this.menuBtn.setAttribute('aria-expanded', 'false');
        this.menu.setAttribute('aria-hidden', 'true');
        this.menu.setAttribute('inert', '');
    }

    handleMenuBtnClick(e) {
        e.stopPropagation();
        this.isOpen ? this.closeMenu() : this.openMenu();
    }

    handleOutsideClick(e) {
        if (!this.menu.contains(e.target) && !this.menuBtn.contains(e.target)) {
            this.closeMenu();
        }
    }
    handleMenuClick(e) {
        if (e.target.closest('a')) {
            const link = e.target.closest('a');
            const href = link.getAttribute('href');

            if (href && href.startsWith('#')) {
                e.preventDefault();
                this.closeMenu(); // Al cerrar aquí, el foco vuelve al botón

                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                this.closeMenu();
        }
    }
}

    openMenu() {
        this.isOpen = true;
        this.menu.classList.add('active');
        this.menuBtn.setAttribute('aria-expanded', 'true');
        this.menu.setAttribute('aria-hidden', 'false');

        this.menu.removeAttribute('inert');

        if (typeof this.config?.onOpen === 'function') this.config.onOpen();
    }

    closeMenu() {
        if (!this.isOpen) return;
        this.menuBtn.focus();
        this.isOpen = false;
        this.menu.classList.remove('active');
        this.menuBtn.setAttribute('aria-expanded', 'false');
        this.menu.setAttribute('aria-hidden', 'true');

        this.menu.setAttribute('inert', '');

        if (typeof this.config?.onClose === 'function') this.config.onClose();
    }

    destroy() {
        if (this.menuBtn) {
            this.menuBtn.removeEventListener('click', this.handleMenuBtnClick);
        }
        if (this.menu) {
            this.menu.removeEventListener('click', this.handleMenuClick);
        }
        document.removeEventListener('click', this.handleOutsideClick);
    }
}


/* INICIALIZACIÓN GLOBAL */

const app = {
    handlers: {}
};

document.addEventListener('DOMContentLoaded', () => {
    app.handlers.download = new DownloadHandler('.btn-download', '#btnDownloadCV');
    app.handlers.experience = new ExperienceLoader('#experience-list');
    app.handlers.form = new FormValidator('.contact-form');
    app.handlers.menu = new MenuHandler('#menuBtn', '#menuDropdown', {
        onClose: () => console.log('Menú cerrado')
    });

    console.log('App inicializada:', Object.keys(app.handlers));
});

window.addEventListener('beforeunload', () => {
    Object.values(app.handlers).forEach(handler => {
        if (handler?.destroy) {
            try {
                handler.destroy();
            } catch (e) {
                console.error('Error en cleanup:', e);
            }
        }
    });

window.addEventListener('scroll', () => {
    const nav = document.querySelector('.main-nav');

    if (window.scrollY > 100) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});
});
