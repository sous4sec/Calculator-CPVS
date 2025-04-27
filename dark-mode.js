/**
 * dark-mode.js - Controle do tema escuro/claro do sistema
 * 
 * Funcionalidades:
 * - Alternância entre temas
 * - Persistência da preferência no localStorage
 * - Aplicação automática ao carregar a página
 * - Ícone dinâmico (sol/lua)
 */

class DarkMode {
    constructor() {
        this.toggleButton = document.getElementById('toggle-dark-mode');
        this.init();
    }

    init() {
        this.loadPreference();
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => this.toggle());
        }
        this.watchSystemTheme();
    }

    loadPreference() {
        const savedPreference = localStorage.getItem('darkMode');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Prioridade: 1. Preferência salva 2. Preferência do sistema
        const shouldEnable = savedPreference !== null 
            ? savedPreference === 'true' 
            : systemPrefersDark;
        
        this.set(shouldEnable);
    }

    watchSystemTheme() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (localStorage.getItem('darkMode') === null) {
                this.set(e.matches);
            }
        });
    }

    toggle() {
        this.set(!document.body.classList.contains('dark-mode'));
    }

    set(enableDarkMode) {
        // Aplica o tema
        document.body.classList.toggle('dark-mode', enableDarkMode);
        localStorage.setItem('darkMode', enableDarkMode);
        
        // Atualiza o ícone
        this.updateIcon(enableDarkMode);
        
        // Dispara evento personalizado (opcional para outros scripts)
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { darkMode: enableDarkMode }
        }));
    }

    updateIcon(isDark) {
        if (!this.toggleButton) return;
        
        const icon = this.toggleButton.querySelector('i');
        if (!icon) return;

        // Limpa e aplica classes
        icon.className = 'bi'; // Classe base
        icon.classList.add(isDark ? 'bi-moon' : 'bi-brightness-low');
        
        // Atualiza ARIA label
        this.toggleButton.setAttribute(
            'aria-label', 
            isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'
        );
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => new DarkMode());