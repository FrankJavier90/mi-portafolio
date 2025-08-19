
class DownloadHandler {
    constructor(selector) {
        const button = document.querySelector(selector);
        if (!button) return;

        button.addEventListener('click', e => {
            e.preventDefault();
            const link = document.createElement('a');
            link.href = button.getAttribute('href');
            link.download = button.getAttribute('download') || '';
            link.click();
        });
    }
}
class FormValidator {
    constructor(selector) {
        this.form = document.querySelector(selector)
        this.setup()
    }

    setup() {
        if (!this.form) return;

        this.form.addEventListener('submit', e => this.submit(e));
        this.liveEvents();
    }

    liveEvents() {
        const fields = this.form.querySelectorAll('input, textarea');
        fields.forEach(field => {
            field.addEventListener('blur', e => this.checkField(e.target));
            field.addEventListener('input', e => this.clearField(e.target));
        });
    }

    submit(e) {
        e.preventDefault();

        this.clearAll();
        const data = this.getData();
        const check = this.checkAll(data);

        if (check.ok) {
            this.sendData(data);
        } else {
            this.showAll(check.errors);
            this.focus();
        }
    }

    getData() {
        return{
            nombre: this.getValue('nombre'),
            empresa: this.getValue('empresa'),
            correo: this.getValue('correo'),
            whatsapp: this.getValue('whatsapp'),
            asunto: this.getValue('asunto'),
            mensaje: this.getValue('mensaje')
        };
    }

    getValue(name) {
        const field = this.form.querySelector(`[name="${name}"]`);
        return field?.value.trim() || '';
    }

    checkAll(data) {
        const errors = {}
        const required = ['nombre','empresa','correo', 'asunto', 'mensaje'];

    required.forEach(f => {
            if (!data[f]) errors[f] = 'Campo requerido';
        });
    if (data.correo && !this.isEmail(data.correo)) {
            errors.correo = 'Email inválido';
        }
    if (data.whatsapp && !this.isPhone(data.whatsapp)) {
            errors.whatsapp = 'Teléfono inválido';
        }

    Object.assign(errors, this.checkSize(data));

        return { ok: !Object.keys(errors).length, errors };
    }

    isEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    isPhone(phone) {
        const clean = phone.replace(/[\s\-\(\)]/g, '');
        return /^(\+\d{1,3})?\d{10,14}$/.test(clean);
    }

    checkSize(data) {
        const rules = {
            nombre: [2, 50],
            empresa: [2, 100],
            asunto: [5, 100],
            mensaje: [10, 1000]
        };

        const errors = {};
        Object.entries(rules).forEach(([field, [min, max]]) => {
            const val = data[field];
            if (val) {
                if (val.length < min) errors[field] = `Mínimo ${min} caracteres`;
                if (val.length > max) errors[field] = `Máximo ${max} caracteres`;
            }
        });
        return errors;
    }

    checkField(field) {
        const name = field.name;
        const val = field.value.trim();

        this.clearField(field);

        let error = null;

        if (field.required && !val) {
            error = 'Campo requerido';
        } else if (name === 'correo' && val && !this.isEmail(val)) {
            error = 'Email inválido';
        } else if (name === 'whatsapp' && val && !this.isPhone(val)) {
            error = 'Teléfono inválido';
        }
        if (error) this.showError(field, error);
    }

    sendData(data) {
        console.log('Enviando:', data);
        this.openMail(data)
        this.showOk();
    }

    openMail(data) {
        const to = 'ramirezmendozaf@gmail.com';
        const subject = `Contacto: ${data.asunto}`;
        const body = this.buildBody(data);
        const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        const outlook = `https://outlook.live.com/owa/?path=/mail/action/compose&to=${to}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        try {
            window.open(gmail, '_blank');
        } catch (e) {
            window.open(outlook, '_blank');
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

    showAll(errors) {
        Object.entries(errors).forEach(([field, msg]) => {
            const input = this.form.querySelector(`[name="${field}"]`);
            if (input) this.showError(input, msg);
        });
    }

    showError(field, msg) {
        if (!field) return;

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
        if (!field) return;

        const group = field.closest('.form-group');
        if (!group) return;

        const errorEl = group.querySelector('.error-msg');

        field.classList.remove('error');
        if (errorEl) errorEl.style.display = 'none';
    }

    clearAll() {
        this.form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        this.form.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
    }

    focus() {
        this.form.querySelector('.error')?.focus();
    }

    showOk() {
        const msg = document.createElement('div');
        msg.className = 'ok-msg';
        msg.textContent = '¡Mensaje enviado correctamente!';

        this.form.insertBefore(msg, this.form.firstChild);
        setTimeout(() => msg.remove(), 4000);
    }
}
class ExperienceLoader {
    constructor(selector) {
        this.container = document.querySelector(selector);
        if (!this.container) return;
        this.loadExperiences();
    }

    async loadExperiences() {
        try {
            const response = await fetch('assets/data/experience.json');
            const data = await response.json();
            this.renderExperiences(data.experiences);
        } catch (error) {
            console.error('Error loading experiences:', error);
            this.container.innerHTML = '<p>Error cargando experiencias</p>';
        }
    }

    renderExperiences(experiences) {
        const html = experiences.map(exp => this.createExperienceHTML(exp)).join('');
        this.container.innerHTML = html;
    }

    createExperienceHTML(experience) {
        const responsibilities = experience.responsibilities
            .map(resp => `<li>${resp}</li>`)
            .join('');

        return `
            <div class="experience-item">
                <div class="experience-left">
                    <h3 class="job-title">${experience.company}</h3>
                    <p class="job-position">${experience.position}</p>
                    <span class="job-year">${experience.year}</span>
                </div>
                <div class="experience-right">
                    <ul class="job-responsibilities">
                        ${responsibilities}
                    </ul>
                </div>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DownloadHandler('.btn-download');
    new ExperienceLoader('#experience-list');
    new FormValidator('.contact-form');
});
