/**
 * IBVAP Admin Console — Vanilla JavaScript Implementation
 * Handles dynamic tables, modals, AI module switches, audit log, system settings, and toasts.
 */

(function () {
  'use strict';

  // --- Initial Realistic Data ---
  const state = {
    cameras: [
      {
        id: 'CAM-01',
        name: 'CAM-01',
        subtitle: 'BOP Main Entry Gate',
        location: 'BOP Alpha',
        ipAddress: '192.168.14.21',
        fps: 25,
        status: 'Online'
      },
      {
        id: 'CAM-02',
        name: 'CAM-02',
        subtitle: 'Patrol Strip North',
        location: 'BOP Alpha',
        ipAddress: '192.168.14.22',
        fps: 24,
        status: 'Online'
      },
      {
        id: 'CAM-03',
        name: 'CAM-03',
        subtitle: 'Checkpoint',
        location: 'BOP Alpha',
        ipAddress: '192.168.14.23',
        fps: 22,
        status: 'Online'
      },
      {
        id: 'CAM-04',
        name: 'CAM-04',
        subtitle: 'Sector North',
        location: 'BOP Alpha',
        ipAddress: '192.168.14.24',
        fps: 20,
        status: 'Online'
      }
    ],

    operators: [
      {
        id: 'OP-1',
        initials: 'RK',
        color: 'blue',
        name: 'R. Kumar',
        username: 'rk.operator',
        role: 'Operator',
        accessLevel: 'Surveillance',
        badgeClass: 'surveillance',
        lastActive: '2 min ago',
        status: 'Active'
      },
      {
        id: 'OP-2',
        initials: 'AS',
        color: 'purple',
        name: 'A. Singh',
        username: 'a.singh',
        role: 'Supervisor',
        accessLevel: 'Full Access',
        badgeClass: 'full-access',
        lastActive: '18 min ago',
        status: 'Active'
      },
      {
        id: 'OP-3',
        initials: 'PD',
        color: 'teal',
        name: 'P. Desai',
        username: 'p.desai',
        role: 'Operator',
        accessLevel: 'Surveillance',
        badgeClass: 'surveillance',
        lastActive: '32 min ago',
        status: 'Active'
      },
      {
        id: 'OP-4',
        initials: 'SP',
        color: 'indigo',
        name: 'S. Patel',
        username: 's.patel',
        role: 'Operator',
        accessLevel: 'Incident Mgmt',
        badgeClass: 'incident-mgmt',
        lastActive: '1 hr ago',
        status: 'Active'
      }
    ],

    aiModules: {
      personDetection: true,
      vehicleDetection: true,
      virtualFence: true,
      nightMovement: true,
      anpr: true
    },

    activities: [
      {
        id: 1,
        title: 'Operator account added',
        desc: 'Administrator added a new operator account',
        time: '10 min ago',
        icon: 'person_add',
        color: 'blue'
      },
      {
        id: 2,
        title: 'Camera configuration updated',
        desc: 'CAM-02 stream configuration modified',
        time: '24 min ago',
        icon: 'videocam',
        color: 'green'
      },
      {
        id: 3,
        title: 'AI configuration changed',
        desc: 'Virtual Fence detection settings updated',
        time: '41 min ago',
        icon: 'tune',
        color: 'orange'
      },
      {
        id: 4,
        title: 'Administrator login',
        desc: 'Successful administrative login',
        time: '1 hr ago',
        icon: 'verified_user',
        color: 'purple'
      }
    ],

    // Modals editing references
    editingCameraId: null,
    deletingCameraId: null,
    editingOperatorId: null,
    deletingOperatorId: null
  };

  // --- DOM Elements Cache ---
  const DOM = {
    cameraTableBody: document.getElementById('cameraTableBody'),
    operatorTableBody: document.getElementById('operatorTableBody'),
    statActiveCameras: document.getElementById('statActiveCameras'),
    statOperatorsCount: document.getElementById('statOperatorsCount'),
    statAiModulesCount: document.getElementById('statAiModulesCount'),
    activityList: document.getElementById('activityList'),
    toastContainer: document.getElementById('toastContainer'),

    // Modals
    addCameraModal: document.getElementById('addCameraModal'),
    editCameraModal: document.getElementById('editCameraModal'),
    deleteCameraModal: document.getElementById('deleteCameraModal'),

    addOperatorModal: document.getElementById('addOperatorModal'),
    editOperatorModal: document.getElementById('editOperatorModal'),
    deleteOperatorModal: document.getElementById('deleteOperatorModal'),

    auditLogModal: document.getElementById('auditLogModal'),
    systemSettingsModal: document.getElementById('systemSettingsModal'),

    // Forms
    addCameraForm: document.getElementById('addCameraForm'),
    editCameraForm: document.getElementById('editCameraForm'),
    addOperatorForm: document.getElementById('addOperatorForm'),
    editOperatorForm: document.getElementById('editOperatorForm'),
    systemSettingsForm: document.getElementById('systemSettingsForm'),

    // Mobile Sidebar
    sidebar: document.getElementById('sidebar'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn')
  };

  // --- Toast Notification System ---
  function showToast(title, desc, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    if (type === 'warning') icon = 'warning';
    if (type === 'danger') icon = 'error';

    toast.innerHTML = `
      <span class="material-symbols-outlined toast-icon ${type}">${icon}</span>
      <div class="toast-content">
        <span class="toast-title">${title}</span>
        <span class="toast-desc">${desc}</span>
      </div>
      <button class="toast-close material-symbols-outlined" onclick="this.parentElement.remove()">close</button>
    `;

    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  // --- Modal Helpers ---
  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
  }

  // Close when clicking modal backdrop
  document.querySelectorAll('.modal-overlay').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // Close buttons with data-dismiss="modal"
  document.querySelectorAll('[data-dismiss="modal"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const parentModal = btn.closest('.modal-overlay');
      closeModal(parentModal);
    });
  });

  // --- Render Functions ---

  // 1. Render Stats
  function updateStats() {
    if (DOM.statActiveCameras) {
      const activeCams = state.cameras.filter((c) => c.status === 'Online').length;
      DOM.statActiveCameras.textContent = `${activeCams < 10 ? '0' + activeCams : activeCams} / ${state.cameras.length < 10 ? '0' + state.cameras.length : state.cameras.length}`;
    }
    if (DOM.statOperatorsCount) {
      DOM.statOperatorsCount.textContent = `${state.operators.length < 10 ? '0' + state.operators.length : state.operators.length}`;
    }
    if (DOM.statAiModulesCount) {
      const activeModules = Object.values(state.aiModules).filter(Boolean).length;
      DOM.statAiModulesCount.textContent = `${activeModules < 10 ? '0' + activeModules : activeModules}`;
    }
  }

  // 2. Render Camera Table
  function renderCameraTable() {
    if (!DOM.cameraTableBody) return;
    DOM.cameraTableBody.innerHTML = '';

    state.cameras.forEach((cam, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 600; color: #94a3b8;">${index + 1}</td>
        <td>
          <div class="cell-camera">
            <div class="camera-table-icon">
              <span class="material-symbols-outlined" style="font-size: 18px;">videocam</span>
            </div>
            <div class="camera-name-box">
              <span class="camera-id-title">${cam.name}</span>
              <span class="camera-location-sub">${cam.subtitle}</span>
            </div>
          </div>
        </td>
        <td>${cam.location}</td>
        <td style="font-family: var(--font-mono); font-size: 11px;">${cam.ipAddress}</td>
        <td style="font-family: var(--font-mono); font-weight: 600;">${cam.fps}</td>
        <td>
          <div class="status-badge-inline">
            <span class="status-dot-sm"></span>
            <span>${cam.status}</span>
          </div>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-icon-action" title="Edit Camera" data-action="edit-camera" data-id="${cam.id}">
              <span class="material-symbols-outlined" style="font-size: 17px;">edit</span>
            </button>
            <button class="btn-icon-action delete" title="Delete Camera" data-action="delete-camera" data-id="${cam.id}">
              <span class="material-symbols-outlined" style="font-size: 17px;">delete</span>
            </button>
          </div>
        </td>
      `;
      DOM.cameraTableBody.appendChild(tr);
    });

    updateStats();
  }

  // 3. Render Operator Table
  function renderOperatorTable() {
    if (!DOM.operatorTableBody) return;
    DOM.operatorTableBody.innerHTML = '';

    state.operators.forEach((op, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 600; color: #94a3b8;">${index + 1}</td>
        <td>
          <div class="cell-operator">
            <div class="operator-initials-badge ${op.color}">
              ${op.initials}
            </div>
            <div class="operator-meta-box">
              <span class="operator-name">${op.name}</span>
              <span class="operator-username">${op.username}</span>
            </div>
          </div>
        </td>
        <td>${op.role}</td>
        <td>
          <span class="access-badge ${op.badgeClass}">
            ${op.accessLevel}
          </span>
        </td>
        <td style="color: #64748b; font-size: 11px;">${op.lastActive}</td>
        <td>
          <div class="status-badge-inline">
            <span class="status-dot-sm"></span>
            <span>${op.status}</span>
          </div>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-icon-action" title="Edit Operator" data-action="edit-operator" data-id="${op.id}">
              <span class="material-symbols-outlined" style="font-size: 17px;">edit</span>
            </button>
            <button class="btn-icon-action delete" title="Delete Operator" data-action="delete-operator" data-id="${op.id}">
              <span class="material-symbols-outlined" style="font-size: 17px;">delete</span>
            </button>
          </div>
        </td>
      `;
      DOM.operatorTableBody.appendChild(tr);
    });

    updateStats();
  }

  // 4. Render Activities
  function renderActivities() {
    if (!DOM.activityList) return;
    DOM.activityList.innerHTML = '';

    state.activities.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'activity-item';
      div.innerHTML = `
        <div class="activity-left">
          <div class="activity-avatar ${item.color}">
            <span class="material-symbols-outlined" style="font-size: 18px;">${item.icon}</span>
          </div>
          <div class="activity-info">
            <span class="activity-title">${item.title}</span>
            <span class="activity-sub">${item.desc}</span>
          </div>
        </div>
        <span class="activity-time">${item.time}</span>
      `;
      DOM.activityList.appendChild(div);
    });
  }

  function addActivity(title, desc, icon = 'info', color = 'blue') {
    state.activities.unshift({
      id: Date.now(),
      title,
      desc,
      time: 'Just now',
      icon,
      color
    });
    renderActivities();
  }

  // --- Camera Management Event Handlers ---
  document.getElementById('btnAddCamera').addEventListener('click', () => {
    DOM.addCameraForm.reset();
    openModal(DOM.addCameraModal);
  });

  DOM.addCameraForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('newCamId').value.trim();
    const subtitle = document.getElementById('newCamSubtitle').value.trim();
    const location = document.getElementById('newCamLocation').value.trim();
    const ipAddress = document.getElementById('newCamIp').value.trim();
    const fps = parseInt(document.getElementById('newCamFps').value.trim(), 10) || 25;

    if (!id || !subtitle || !ipAddress) {
      showToast('Validation Error', 'Please fill in all mandatory camera parameters.', 'warning');
      return;
    }

    const newCam = {
      id,
      name: id,
      subtitle,
      location: location || 'BOP Alpha',
      ipAddress,
      fps,
      status: 'Online'
    };

    state.cameras.push(newCam);
    closeModal(DOM.addCameraModal);
    renderCameraTable();
    addActivity('New Camera Added', `${id} (${subtitle}) registered to CCTV network`, 'videocam', 'green');
    showToast('Camera Connected', `Camera ${id} successfully added to stream matrix.`, 'success');
  });

  // Table clicks (Delegation for Edit / Delete)
  DOM.cameraTableBody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-action="edit-camera"]');
    const deleteBtn = e.target.closest('[data-action="delete-camera"]');

    if (editBtn) {
      const camId = editBtn.dataset.id;
      const cam = state.cameras.find((c) => c.id === camId);
      if (cam) {
        state.editingCameraId = camId;
        document.getElementById('editCamId').value = cam.id;
        document.getElementById('editCamSubtitle').value = cam.subtitle;
        document.getElementById('editCamLocation').value = cam.location;
        document.getElementById('editCamIp').value = cam.ipAddress;
        document.getElementById('editCamFps').value = cam.fps;
        document.getElementById('editCamStatus').value = cam.status;
        openModal(DOM.editCameraModal);
      }
    }

    if (deleteBtn) {
      const camId = deleteBtn.dataset.id;
      const cam = state.cameras.find((c) => c.id === camId);
      if (cam) {
        state.deletingCameraId = camId;
        document.getElementById('deleteCamName').textContent = `${cam.name} (${cam.subtitle})`;
        openModal(DOM.deleteCameraModal);
      }
    }
  });

  DOM.editCameraForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cam = state.cameras.find((c) => c.id === state.editingCameraId);
    if (cam) {
      cam.subtitle = document.getElementById('editCamSubtitle').value.trim();
      cam.location = document.getElementById('editCamLocation').value.trim();
      cam.ipAddress = document.getElementById('editCamIp').value.trim();
      cam.fps = parseInt(document.getElementById('editCamFps').value.trim(), 10) || 25;
      cam.status = document.getElementById('editCamStatus').value;

      closeModal(DOM.editCameraModal);
      renderCameraTable();
      addActivity('Camera Config Modified', `${cam.id} stream configuration updated`, 'tune', 'orange');
      showToast('Camera Updated', `${cam.id} configurations saved successfully.`, 'success');
    }
  });

  document.getElementById('btnConfirmDeleteCamera').addEventListener('click', () => {
    const id = state.deletingCameraId;
    state.cameras = state.cameras.filter((c) => c.id !== id);
    closeModal(DOM.deleteCameraModal);
    renderCameraTable();
    addActivity('Camera Stream Removed', `${id} disconnected from IBVAP node`, 'delete', 'orange');
    showToast('Camera Disconnected', `${id} was removed from the active camera list.`, 'danger');
  });

  // --- Operator Management Event Handlers ---
  document.getElementById('btnAddOperator').addEventListener('click', () => {
    DOM.addOperatorForm.reset();
    openModal(DOM.addOperatorModal);
  });

  DOM.addOperatorForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newOpName').value.trim();
    const username = document.getElementById('newOpUsername').value.trim();
    const role = document.getElementById('newOpRole').value;
    const accessLevel = document.getElementById('newOpAccess').value;

    if (!name || !username) {
      showToast('Validation Error', 'Full Name and Username are required.', 'warning');
      return;
    }

    // Generate Initials
    const parts = name.split(' ');
    const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();

    let badgeClass = 'surveillance';
    if (accessLevel === 'Full Access') badgeClass = 'full-access';
    if (accessLevel === 'Incident Mgmt') badgeClass = 'incident-mgmt';

    const colors = ['blue', 'purple', 'teal', 'indigo'];
    const randomColor = colors[state.operators.length % colors.length];

    const newOp = {
      id: 'OP-' + (state.operators.length + 1),
      initials,
      color: randomColor,
      name,
      username,
      role,
      accessLevel,
      badgeClass,
      lastActive: 'Just now',
      status: 'Active'
    };

    state.operators.push(newOp);
    closeModal(DOM.addOperatorModal);
    renderOperatorTable();
    addActivity('Operator Account Created', `Administrator added operator: ${name}`, 'person_add', 'blue');
    showToast('Operator Added', `Operator ${name} (${username}) successfully registered.`, 'success');
  });

  DOM.operatorTableBody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-action="edit-operator"]');
    const deleteBtn = e.target.closest('[data-action="delete-operator"]');

    if (editBtn) {
      const opId = editBtn.dataset.id;
      const op = state.operators.find((o) => o.id === opId);
      if (op) {
        state.editingOperatorId = opId;
        document.getElementById('editOpName').value = op.name;
        document.getElementById('editOpUsername').value = op.username;
        document.getElementById('editOpRole').value = op.role;
        document.getElementById('editOpAccess').value = op.accessLevel;
        document.getElementById('editOpStatus').value = op.status;
        openModal(DOM.editOperatorModal);
      }
    }

    if (deleteBtn) {
      const opId = deleteBtn.dataset.id;
      const op = state.operators.find((o) => o.id === opId);
      if (op) {
        state.deletingOperatorId = opId;
        document.getElementById('deleteOpName').textContent = `${op.name} (${op.username})`;
        openModal(DOM.deleteOperatorModal);
      }
    }
  });

  DOM.editOperatorForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const op = state.operators.find((o) => o.id === state.editingOperatorId);
    if (op) {
      op.name = document.getElementById('editOpName').value.trim();
      op.username = document.getElementById('editOpUsername').value.trim();
      op.role = document.getElementById('editOpRole').value;
      op.accessLevel = document.getElementById('editOpAccess').value;
      op.status = document.getElementById('editOpStatus').value;

      if (op.accessLevel === 'Full Access') op.badgeClass = 'full-access';
      else if (op.accessLevel === 'Incident Mgmt') op.badgeClass = 'incident-mgmt';
      else op.badgeClass = 'surveillance';

      closeModal(DOM.editOperatorModal);
      renderOperatorTable();
      addActivity('Operator Profile Updated', `Permissions updated for ${op.name}`, 'badge', 'blue');
      showToast('Operator Updated', `Profile and permissions saved for ${op.name}.`, 'success');
    }
  });

  document.getElementById('btnConfirmDeleteOperator').addEventListener('click', () => {
    const id = state.deletingOperatorId;
    const op = state.operators.find((o) => o.id === id);
    state.operators = state.operators.filter((o) => o.id !== id);
    closeModal(DOM.deleteOperatorModal);
    renderOperatorTable();
    addActivity('Operator Revoked', `Access revoked for operator account ${op ? op.username : id}`, 'person_remove', 'orange');
    showToast('Operator Removed', `Operator account has been deleted.`, 'danger');
  });

  // --- AI Module Toggle Handlers ---
  const aiToggles = [
    { id: 'togglePersonDetection', key: 'personDetection', label: 'Person Detection' },
    { id: 'toggleVehicleDetection', key: 'vehicleDetection', label: 'Vehicle Detection' },
    { id: 'toggleVirtualFence', key: 'virtualFence', label: 'Virtual Fence' },
    { id: 'toggleNightMovement', key: 'nightMovement', label: 'Night Movement' },
    { id: 'toggleAnpr', key: 'anpr', label: 'ANPR' }
  ];

  aiToggles.forEach(({ id, key, label }) => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.checked = state.aiModules[key];
      checkbox.addEventListener('change', () => {
        state.aiModules[key] = checkbox.checked;
        const status = checkbox.checked ? 'Enabled' : 'Disabled';
        updateStats();
        addActivity('AI Module Configuration', `${label} set to ${status.toUpperCase()}`, 'tune', 'orange');
        showToast(`AI Module: ${label}`, `${label} is now ${status.toLowerCase()}.`, checkbox.checked ? 'info' : 'warning');
      });
    }
  });

  // --- Quick Actions Handlers ---
  document.getElementById('qaManageCameras').addEventListener('click', () => {
    const el = document.getElementById('cameraManagementCard');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      el.style.boxShadow = '0 0 0 3px rgba(0, 82, 255, 0.4)';
      setTimeout(() => (el.style.boxShadow = ''), 2000);
    }
  });

  document.getElementById('qaManageOperators').addEventListener('click', () => {
    const el = document.getElementById('operatorManagementCard');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      el.style.boxShadow = '0 0 0 3px rgba(0, 82, 255, 0.4)';
      setTimeout(() => (el.style.boxShadow = ''), 2000);
    }
  });

  document.getElementById('qaAiConfig').addEventListener('click', () => {
    const el = document.getElementById('aiConfigCard');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      el.style.boxShadow = '0 0 0 3px rgba(126, 34, 206, 0.4)';
      setTimeout(() => (el.style.boxShadow = ''), 2000);
    }
  });

  document.getElementById('qaViewAuditLog').addEventListener('click', () => {
    openModal(DOM.auditLogModal);
  });

  document.getElementById('btnViewFullLog').addEventListener('click', (e) => {
    e.preventDefault();
    openModal(DOM.auditLogModal);
  });

  document.getElementById('qaSystemSettings').addEventListener('click', () => {
    openModal(DOM.systemSettingsModal);
  });

  DOM.systemSettingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    closeModal(DOM.systemSettingsModal);
    addActivity('System Parameters Saved', 'Storage retention and RTSP buffer settings updated', 'settings', 'blue');
    showToast('System Settings Saved', 'Node parameters updated and synchronized.', 'success');
  });

  // Mobile menu button toggle
  if (DOM.mobileMenuBtn && DOM.sidebar) {
    DOM.mobileMenuBtn.addEventListener('click', () => {
      DOM.sidebar.classList.toggle('mobile-open');
    });
  }

  // Header quick actions
  document.getElementById('btnHeaderNotifications').addEventListener('click', () => {
    showToast('Pending Alerts', '3 active perimeter intrusion alerts pending review in Incident Console.', 'warning');
  });

  // Initialize
  updateStats();
  renderCameraTable();
  renderOperatorTable();
  renderActivities();
})();
