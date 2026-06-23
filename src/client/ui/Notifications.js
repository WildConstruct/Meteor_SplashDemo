// Notifications — small transient toasts for warnings/info (build plan §6 layout).
export class Notifications {
  constructor(mount) {
    this.mount = mount;
  }
  show(message, level = 'info', ms = 4000) {
    const el = document.createElement('div');
    el.className = `toast toast-${level}`;
    el.textContent = message;
    this.mount.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, ms);
  }
  info(m) { this.show(m, 'info'); }
  warn(m) { this.show(m, 'warn', 6000); }
  error(m) { this.show(m, 'error', 8000); }
}
