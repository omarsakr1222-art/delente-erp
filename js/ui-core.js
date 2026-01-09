// UI Core: icons + generic modal helpers
(function(){
  // Lucide icons replacement with debounced RAF
  if (typeof window.updateIcons !== 'function') {
    window.updateIcons = (function(){
      let scheduled = false;
      return function(){
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          try {
            if (window.lucide && typeof window.lucide.replace === 'function') {
              window.lucide.replace();
            } else if (window.Lucide && typeof window.Lucide.replace === 'function') {
              window.Lucide.replace();
            }
          } catch(e) { /* silent */ }
          scheduled = false;
        });
      };
    })();
  }

  // Generic modal helpers
  if (typeof window.openModal !== 'function') {
    window.openModal = function(modal){
      if (!modal) return;
      try { modal.classList.remove('modal-hidden'); modal.classList.add('modal-visible'); } catch(_){}
      // Update icons after DOM changes
      try { window.updateIcons(); } catch(_){}
    };
  }
  if (typeof window.closeModal !== 'function') {
    window.closeModal = function(modal){
      if (!modal) return;
      try { modal.classList.add('modal-hidden'); modal.classList.remove('modal-visible'); } catch(_){}
    };
  }
  if (typeof window.toggleModal !== 'function') {
    window.toggleModal = function(modal, show){
      if (!modal) return;
      if (show === undefined) {
        const isHidden = modal.classList.contains('modal-hidden');
        return isHidden ? window.openModal(modal) : window.closeModal(modal);
      }
      return show ? window.openModal(modal) : window.closeModal(modal);
    };
  }

  // Custom dialog (notifications/alerts)
  if (typeof window.customDialog !== 'function') {
    window.customDialog = function({ message, title = 'إشعار', isConfirm = false, confirmText = 'تأكيد', confirmClass = 'bg-blue-600 hover:bg-blue-700' }) {
      return new Promise(resolve => {
        const modal = document.getElementById('custom-confirm-modal');
        const dialogTitle = document.getElementById('dialog-title');
        const dialogMessage = document.getElementById('dialog-message');
        const dialogActions = document.getElementById('dialog-actions');
        const confirmBtn = document.getElementById('dialog-confirm-btn');
        const cancelBtn = document.getElementById('dialog-cancel-btn');

        if (!modal || !dialogTitle || !dialogMessage || !confirmBtn || !cancelBtn || !dialogActions) {
          console.error('Custom dialog elements are missing in the DOM.');
          setTimeout(() => resolve(!isConfirm), 10);
          return;
        }

        dialogTitle.textContent = title;
        dialogMessage.textContent = message;

        const newConfirm = confirmBtn.cloneNode(true);
        const newCancel = cancelBtn.cloneNode(true);
        confirmBtn.replaceWith(newConfirm);
        cancelBtn.replaceWith(newCancel);

        newConfirm.textContent = confirmText;
        newConfirm.className = `flex-1 text-white px-4 py-2 rounded-lg font-semibold ${confirmClass}`;

        dialogActions.classList.toggle('justify-between', isConfirm);
        dialogActions.classList.toggle('justify-center', !isConfirm);
        newCancel.classList.toggle('hidden', !isConfirm);
        newCancel.textContent = 'إلغاء';

        newConfirm.addEventListener('click', () => { try { window.closeModal(modal); } catch(_){} resolve(true); }, { once: true });
        if (isConfirm) {
          newCancel.addEventListener('click', () => { try { window.closeModal(modal); } catch(_){} resolve(false); }, { once: true });
        }

        try { window.openModal(modal); } catch(_){ resolve(!isConfirm); }
      });
    };
  }

  if (typeof window.notifyReadOnly !== 'function') {
    window.notifyReadOnly = function(message){
      const msg = message || 'هذا الحساب في وضع المراجعة (قراءة فقط).';
      try { return window.customDialog({ title: 'وضع المراجعة', message: msg }); } catch(e){ try { alert(msg); } catch(_){} }
    };
  }
})();
