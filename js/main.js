
const config = {
    email_to: 'ramirezmendozaf@gmail.com',
    data_url: 'assets/data/experience.json',
    msg_duration: 4000,
};

const Utils = {
    escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    isEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email),
    isPhone: (phone) => /^(\+\d{1,3})?\d{10,14}$/.test(phone.replace(/[\s\-\(\)]/g, ''))
};

/* MANEJO DE DESCARGAS */

class DownloadHandler {
    constructor(selector) {
        this.button = document.querySelector(selector);
        this.feedbackContainer = document.getElementById('downloadMsg');
        this.timeoutId = null;

        if (!this.button) return;
        this.init();
    }

    init() {
        this.button.addEventListener('click', () => {
            this.showFeedback('CV descargado. ¡Gracias por tu interés!');
        });
    }

    showFeedback(message) {
        if (!this.feedbackContainer) return;
            if (this.timeoutId) clearTimeout(this.timeoutId);

                this.feedbackContainer.textContent = message;
                this.feedbackContainer.classList.add('active');
                this.timeoutId = setTimeout(() => {
                    this.feedbackContainer.classList.remove('active');
                    setTimeout(() => {
                        if (!this.feedbackContainer.classList.contains('active')) {
                            this.feedbackContainer.textContent = '';
                        }
                    }, 400);
                }, 5000);
            }
        }

/* VALIDACIÓN DE FORMULARIO */

class FormValidator {
    constructor(selector) {
        this.form = document.querySelector(selector);
        if (!this.form) return;

        this.rules = {
            nombre: { min: 2, max: 50, req: true },
            empresa: { min: 2, max: 100, req: true },
            correo: { req: true, type: 'email' },
            whatsapp: { type: 'phone' },
            asunto: { min: 5, max: 100, req: true },
            mensaje: { min: 10, max: 1000, req: true }
        };

        this.currentSuccessMsg = null;
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.form.addEventListener('blur', (e) => {
            if (e.target.matches('input, textarea')) this.validateField(e.target);
        }, true);
        this.form.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea')) this.clearField(e.target);
        });
    }

    getValidationError(name, value) {
        const rule = this.rules[name];
        if (!rule) return null;

        if (rule.req && !value) return 'Campo requerido';

        if (value) {
            if (rule.type === 'email' && !Utils.isEmail(value)) return 'Email inválido';
            if (rule.type === 'phone' && !Utils.isPhone(value)) return 'Teléfono inválido';
            if (rule.min && value.length < rule.min) return `Mínimo ${rule.min} caracteres`;
            if (rule.max && value.length > rule.max) return `Máximo ${rule.max} caracteres`;
        }
        return null;
    }

    validateField(field) {
        const error = this.getValidationError(field.name, field.value.trim());
        error ? this.showError(field, error) : this.clearField(field);
    }

    handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());
        let firstErrorField = null;

        Object.keys(this.rules).forEach(name => {
            const field = this.form.querySelector(`[name="${name}"]`);
            if (field) {
                const error = this.getValidationError(name, data[name]?.trim());
                if (error) {
                    this.showError(field, error);
                    if (!firstErrorField) firstErrorField = field;
                }
            }
        });

        if (firstErrorField) {
            firstErrorField.focus();
        } else {
            this.send(data);
        }
    }

    send(data) {
        const subject = encodeURIComponent(`Contacto Portafolio: ${data.asunto}`);
        const body = encodeURIComponent(
            `Hola Pako,\n\n` +
            `Nombre: ${data.nombre}\n` +
            `Empresa: ${data.empresa}\n` +
            `Email: ${data.correo}\n` +
            `WhatsApp: ${data.whatsapp || 'No proporcionado'}\n\n` +
            `Mensaje:\n${data.mensaje}`
        );

        window.location.href = `mailto:${config.email_to}?subject=${subject}&body=${body}`;
        this.showSuccess();
        this.form.reset();
    }

    showError(field, msg) {
        const group = field.closest('.form-group');
        if (!group) return;

        field.classList.add('error');
        let errorEl = group.querySelector('.error-msg') || document.createElement('span');
        errorEl.className = 'error-msg';
        errorEl.textContent = msg;
        if (!group.querySelector('.error-msg')) group.appendChild(errorEl);
    }

    clearField(field) {
        field.classList.remove('error');
        field.closest('.form-group')?.querySelector('.error-msg')?.remove();
    }

    showSuccess() {
        if (this.currentSuccessMsg) this.currentSuccessMsg.remove();

        const msg = document.createElement('div');
        msg.className = 'ok-msg';
        msg.innerHTML = '<b>¡Excelente!</b> Se abrirá tu cliente de correo.';
        this.form.prepend(msg);
        this.currentSuccessMsg = msg;

        setTimeout(() => {
            msg.remove();
            if (this.currentSuccessMsg === msg) this.currentSuccessMsg = null;
        }, config.msg_duration);
    }
}

/* CARGA DE EXPERIENCIAS */

class ExperienceLoader {
    constructor(selector) {
        this.container = document.querySelector(selector);
        if (this.container) {
            this.load();
        } else {
            console.warn(`ExperienceLoader: El selector "${selector}" no existe en el DOM.`);
        }
    }

    async load() {
        try {
            this.container.innerHTML = '<p class="loading-msg">Cargando trayectoria...</p>';

            const response = await fetch(config.data_url);
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }

            const data = await response.json();
                if (!data.experiences || !Array.isArray(data.experiences) || data.experiences.length === 0) {
                    this.container.innerHTML = '<p>No se encontraron experiencias registradas.</p>';
                    return;
                }

            this.render(data.experiences);
        } catch (err) {
            console.error('Error al cargar experiencias:', err);
            this.container.innerHTML = '<p class="error-msg">Lo sentimos, no se pudo cargar la trayectoria profesional. Intenta recargar la página.</p>';
        }
    }

    render(experiences) {
        const htmlContent = experiences.map(exp => {
            const company = Utils.escapeHTML(exp.company || 'Empresa');
            const position = Utils.escapeHTML(exp.position || 'Cargo');
            const year = Utils.escapeHTML(exp.year || '');
            const respList = Array.isArray(exp.responsibilities)
                ? exp.responsibilities.map(r => `<li>${Utils.escapeHTML(r)}</li>`).join('')
                : '<li>Responsabilidades no especificadas</li>';
            return `
                <article class="experience-item">
                    <div class="experience-left">
                        <h3 class="job-title">${company}</h3>
                        <p class="job-position">${position}</p>
                        <span class="job-year">${year}</span>
                    </div>
                    <div class="experience-right">
                        <ul class="job-responsibilities">
                            ${respList}
                        </ul>
                    </div>
                </article>
            `;
        }).join('');

        this.container.innerHTML = htmlContent;
    }
}

/* MANEJO DEL MENÚ */

class MenuHandler {
    constructor(btnSelector, menuSelector) {
        this.btn = document.querySelector(btnSelector);
        this.menu = document.querySelector(menuSelector);

        if (!this.btn || !this.menu) return;

        this.isOpen = false;
        this.init();
    }

    init() {
        this.close();
        this.btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.isOpen ? this.close() : this.open();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.menu.contains(e.target) && e.target !== this.btn) {
                this.close();
            }
        });
        this.menu.addEventListener('click', (e) => {
            if (e.target.closest('a')) this.close();
        });
    }

    open() {
        this.isOpen = true;
    this.menu.classList.add('active');
    this.btn.setAttribute('aria-expanded', 'true');
    this.btn.classList.add('is-active');
    this.menu.setAttribute('aria-hidden', 'false');
    this.menu.removeAttribute('inert')
    }

    close() {
        if (!this.isOpen) return;

    this.isOpen = false;
    this.menu.classList.remove('active');
    this.btn.setAttribute('aria-expanded', 'false');
    this.btn.classList.remove('is-active');
    this.btn.focus();
    this.menu.setAttribute('aria-hidden', 'true');
    this.menu.setAttribute('inert', '');
    }
}

/* INICIALIZACIÓN GLOBAL */

const app = {
    handlers: {},
    ui: {
        get header() { return document.querySelector('.site-header'); },
        get floating() { return document.querySelector('.floating-contact'); },
        get contactSection() { return document.querySelector('#contact'); },
    }
};

const init = () => {
    try {
        app.handlers.download = new DownloadHandler('#btnDownloadCV');
        app.handlers.experience = new ExperienceLoader('#experience-list');
        app.handlers.form = new FormValidator('.contact-form');
        app.handlers.menu = new MenuHandler('#menuBtn', '#menuDropdown');

        const header = app.ui.header;
        const contact = app.ui.contactSection;
        const options = {
                threshold: 0,
                rootMargin: "-80px 0px -90% 0px"
                };

        if (header && contact) {
            const contactObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        header.classList.add('on-dark');
                    } else {
                        header.classList.remove('on-dark');
                    }
                });
            }, options);
            contactObserver.observe(contact);
        }

        if (app.ui.header) {
            app.ui.header.classList.toggle('scrolled', window.scrollY > 50);
        }

        console.log('App: Inicializada correctamente');
    } catch (error) {
        console.error('App Error: Fallo en la inicialización de módulos', error);
    }
};



let isScrolling = false;
    const handleScroll = () => {
        const header = app.ui.header;
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }
    };

window.addEventListener('scroll', () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            handleScroll();
            isScrolling = false;
        });
        isScrolling = true;
    }
}, { passive: true });

document.addEventListener('DOMContentLoaded', init);
