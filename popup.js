// Calculator - Popup Script
// Developed by Nasri Ayari
class PopupController {
  constructor() {
    this.statusIndicator = document.getElementById('status-indicator');
    this.statusText = document.querySelector('.status-text');
    this.statusDot = document.querySelector('.status-dot');
    this.calculateBtn = document.getElementById('calculate-btn');
    this.exportBtn = document.getElementById('export-btn');
    
    this.init();
  }

  init() {
    // Add event listeners
    this.calculateBtn.addEventListener('click', () => this.calculateGrades());
    this.exportBtn.addEventListener('click', () => this.exportGrades());
    
    // Check initial status
    this.checkGradeStatus();
    
    // Update status every 2 seconds when popup is open
    this.statusInterval = setInterval(() => {
      this.checkGradeStatus();
    }, 2000);
  }

  // Check if grades have been calculated on current page
  checkGradeStatus() {
    chrome.runtime.sendMessage({ action: "getActiveTab" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        this.updateStatus('error', 'Erreur de connexion');
        return;
      }
      
      if (!response) {
        this.updateStatus('warning', 'Aucune réponse');
        return;
      }

      switch (response.status) {
        case 'calculated':
          this.updateStatus('success', 'Notes calculées');
          this.exportBtn.disabled = false;
          this.calculateBtn.textContent = '🔄 Recalculer';
          break;
        case 'not_calculated':
          this.updateStatus('waiting', 'Prêt à calculer');
          this.exportBtn.disabled = true;
          this.calculateBtn.textContent = '📊 Calculer les Notes';
          break;
        case 'no_tab':
          this.updateStatus('error', 'Aucun onglet actif');
          this.exportBtn.disabled = true;
          break;
        default:
          this.updateStatus('warning', 'État inconnu');
          this.exportBtn.disabled = true;
      }
    });
  }

  // Update status indicator
  updateStatus(type, text) {
    this.statusText.textContent = text;
    this.statusDot.className = `status-dot ${type}`;
    this.statusIndicator.className = `status-indicator ${type}`;
  }

  // Calculate grades
  calculateGrades() {
    this.updateStatus('loading', 'Calcul en cours...');
    this.calculateBtn.disabled = true;
    
    chrome.runtime.sendMessage({ action: "calculateGrades" });
    
    // Re-enable button and check status after 2 seconds
    setTimeout(() => {
      this.calculateBtn.disabled = false;
      this.checkGradeStatus();
    }, 2000);
  }

  // Export grades
  exportGrades() {
    this.exportBtn.disabled = true;
    this.exportBtn.textContent = '⬇️ Export en cours...';
    
    chrome.runtime.sendMessage({ action: "exportGrades" });
    
    setTimeout(() => {
      this.exportBtn.disabled = false;
      this.exportBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Exporter (JSON)
      `;
    }, 1500);
  }

  // Cleanup when popup closes
  destroy() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
  }
}

// Initialize popup controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const popup = new PopupController();
  
  // Cleanup when popup is closed
  window.addEventListener('beforeunload', () => {
    popup.destroy();
  });
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'r':
      case 'R':
        e.preventDefault();
        document.getElementById('calculate-btn').click();
        break;
      case 'e':
      case 'E':
        e.preventDefault();
        if (!document.getElementById('export-btn').disabled) {
          document.getElementById('export-btn').click();
        }
        break;
    }
  }
});
