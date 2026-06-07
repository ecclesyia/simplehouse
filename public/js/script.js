console.log('script loaded');


// (frontend API layer)

const API_BASE = 'http://localhost:3001/api';

// ---- Session helpers (token + user in localStorage) ----

function getToken() {
  return localStorage.getItem('simplehouse_token') || null;
}

function getCurrentUser() {
  const raw = localStorage.getItem('simplehouse_user');
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function setSession(token, user) {
  localStorage.setItem('simplehouse_token', token);
  localStorage.setItem('simplehouse_user', JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem('simplehouse_token');
  localStorage.removeItem('simplehouse_user');
  localStorage.removeItem('simplehouse_queues');
}

// ---- Navigation ----

function navigateTo(path) {
  window.location.href = path;
}

// ---- Form validation (unchanged from original) ----

function validateForm(form) {
  let valid = true;
  form.querySelectorAll('[required]').forEach(function (input) {
    const error = input.nextElementSibling;
    if (!input.value.trim()) {
      if (error && error.classList.contains('error-text')) error.style.display = 'block';
      input.classList.add('input--error');
      valid = false;
    } else {
      if (error && error.classList.contains('error-text')) error.style.display = 'none';
      input.classList.remove('input--error');
    }
  });
  return valid;
}

// ---- API helpers ----

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ---- Auth ----

async function apiRegister(fullname, email, password, phone, role) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullname, email, password, phone, role })
  });
}

async function apiLogin(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  setSession(data.token, data.user);
  return data.user;
}

// ---- Doctors / Dropdowns ----

async function apiGetAreas() {
  return apiFetch('/doctors/areas');
}

async function apiGetSpecialists() {
  return apiFetch('/doctors/specialists');
}

async function apiSearchDoctors(name, area_id, specialist_id) {
  const params = new URLSearchParams();
  if (name) params.append('name', name);
  if (area_id) params.append('area_id', area_id);
  if (specialist_id) params.append('specialist_id', specialist_id);
  return apiFetch('/doctors/search?' + params.toString());
}

async function apiGetDoctorSchedules(doctorId) {
  return apiFetch(`/doctors/${doctorId}/schedules`);
}

// ---- Queues ----

async function apiBookQueue(doctor_id, schedule_id, disease) {
  return apiFetch('/queues', {
    method: 'POST',
    body: JSON.stringify({ doctor_id, schedule_id, disease })
  });
}

async function apiGetMyQueues() {
  return apiFetch('/queues/my');
}

async function apiGetMyLog() {
  return apiFetch('/queues/log');
}

async function apiCancelQueue(queueId) {
  return apiFetch(`/queues/${queueId}/cancel`, { method: 'PATCH' });
}

// ---- Admin ----

async function apiAdminGetQueues() {
  return apiFetch('/admin/queues');
}

async function apiAdminGetQueueCount() {
  return apiFetch('/admin/queues/count');
}

async function apiAdminNextQueue(queueId) {
  return apiFetch(`/admin/queues/${queueId}/next`, { method: 'PATCH' });
}

async function apiAdminCancelQueue(queueId) {
  return apiFetch(`/admin/queues/${queueId}/cancel`, { method: 'PATCH' });
}

// =============================================
// PAGE-SPECIFIC LOGIC (auto-runs on each page)
// =============================================

document.addEventListener('DOMContentLoaded', async function () {
  const bodyId = document.body.firstElementChild?.id;

  // ---- USER REGISTER ----
  if (document.getElementById('user-register-page')) {
    const form = document.getElementById('register-form');
    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!validateForm(this)) return;
        const terms = document.getElementById('terms');
        if (!terms.checked) { alert('Please agree to the terms and conditions'); return; }
        try {
          await apiRegister(
            document.getElementById('fullname').value,
            document.getElementById('email').value,
            document.getElementById('password').value,
            document.getElementById('phone').value,
            'user'
          );
          alert('Account created! Please log in.');
          navigateTo('login.html');
        } catch (err) {
          alert(err.message);
        }
      });
    }
  }

  // ---- USER LOGIN ----
  if (document.getElementById('user-login-page')) {
    const form = document.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!validateForm(this)) return;
        const terms = document.getElementById('terms');
        if (!terms.checked) { alert('Please agree to the terms and conditions'); return; }
        try {
          const user = await apiLogin(
            document.getElementById('email').value,
            document.getElementById('password').value
          );
          if (user.role !== 'user') {
            clearCurrentUser();
            alert('Please use the Admin login.');
            return;
          }
          navigateTo('dashboard.html');
        } catch (err) {
          alert(err.message);
        }
      });
    }
  }

  // ---- ADMIN LOGIN ----
  if (document.getElementById('admin-login-page')) {
    const form = document.getElementById('admin-login-form');
    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!validateForm(this)) return;
        const terms = document.getElementById('terms');
        if (!terms.checked) { alert('Please agree to the terms and conditions'); return; }
        try {
          const user = await apiLogin(
            document.getElementById('email').value,
            document.getElementById('password').value
          );
          if (user.role !== 'admin') {
            clearCurrentUser();
            alert('Access denied. Not an admin account.');
            return;
          }
          navigateTo('dashboard.html');
        } catch (err) {
          alert(err.message);
        }
      });
    }
  }

  // ---- ADMIN REGISTER ----
  if (document.getElementById('admin-register-page')) {
    const form = document.getElementById('admin-register-form');
    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!validateForm(this)) return;
        const terms = document.getElementById('terms');
        if (!terms.checked) { alert('Please agree to the terms and conditions'); return; }
        try {
          await apiRegister(
            document.getElementById('fullname').value,
            document.getElementById('email').value,
            document.getElementById('password').value,
            document.getElementById('phone').value,
            'admin'
          );
          alert('Admin account created! Please log in.');
          navigateTo('login.html');
        } catch (err) {
          alert(err.message);
        }
      });
    }
  }

  // ---- USER DASHBOARD ----
  if (document.getElementById('user-dashboard-page')) {
    const user = getCurrentUser();
    if (!user || user.role !== 'user') { navigateTo('login.html'); return; }
    setProfileUI(user);
    document.getElementById('welcome-name').textContent = user.fullname || 'User';

    try {
      const queues = await apiGetMyQueues();
      const emptyEl = document.getElementById('queue-empty');
      const tableEl = document.getElementById('queue-table');
      const tbody = document.getElementById('queue-tbody');

      if (queues.length === 0) {
        emptyEl.style.display = 'flex';
        tableEl.style.display = 'none';
      } else {
        emptyEl.style.display = 'none';
        tableEl.style.display = 'block';
        tbody.innerHTML = '';
        queues.forEach(function (q) {
          const statusClass = q.status === 'WAITING' ? 'status-badge--waiting'
            : q.status === 'DONE' ? 'status-badge--done' : 'status-badge--cancelled';
          const row = document.createElement('tr');
          row.innerHTML =
            '<td>' + q.no + '.</td>' +
            '<td>' + q.id + '</td>' +
            '<td>' + q.disease + '</td>' +
            '<td>' + q.estimation + '</td>' +
            '<td><span class="status-badge ' + statusClass + '">' + q.status + '</span></td>';
          tbody.appendChild(row);
        });
      }
    } catch (err) {
      console.error('Failed to load queues:', err.message);
    }
  }

  // ---- USER LOG ----
  if (document.getElementById('user-log-page')) {
    const user = getCurrentUser();
    if (!user || user.role !== 'user') { navigateTo('login.html'); return; }
    setProfileUI(user);

    try {
      const logs = await apiGetMyLog();
      const tbody = document.getElementById('log-tbody');
      tbody.innerHTML = '';
      if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">No history yet.</td></tr>';
      } else {
        logs.forEach(function (log) {
        const statusClass = (log.status === 'BOOKED' || log.status === 'DONE' || log.status === 'COMPLETED')
          ? 'status-badge--done' : 
          log.status === 'WAITING' || log.status === 'CONSULTING' ? 'status-badge--waiting'
          : 'status-badge--cancelled';
          'status-badge--cancelled';
          const row = document.createElement('tr');
          row.innerHTML =
            '<td>' + log.no + '.</td>' +
            '<td>' + log.date + '</td>' +
            '<td>' + log.disease + '</td>' +
            '<td>' + log.doctor + '</td>' +
            '<td>' + log.area + '</td>' +
            '<td><span class="status-badge ' + statusClass + '">' + log.status + '</span></td>';
          tbody.appendChild(row);
        });
      }
    } catch (err) {
      console.error('Failed to load log:', err.message);
    }

    // =============================================
    // SHARED: Notifications + Messages panels
    // =============================================
    function formatTime(ts) {
      const d = new Date(ts);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
        ' · ' + d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    }

    function openPanel() {
      document.getElementById('msg-overlay').classList.add('open');
      document.getElementById('msg-panel').classList.add('open');
    }
    function closePanel() {
      document.getElementById('msg-overlay').classList.remove('open');
      document.getElementById('msg-panel').classList.remove('open');
    }

    const msgCloseBtn = document.getElementById('msg-close');
    const msgOverlay = document.getElementById('msg-overlay');
    if (msgCloseBtn) msgCloseBtn.addEventListener('click', closePanel);
    if (msgOverlay) msgOverlay.addEventListener('click', closePanel);

    // ---- Notification dropdown ----
    const notifBtn = document.getElementById('icon-notification');
    const notifDropdown = document.getElementById('notif-dropdown');
    const notifClose = document.getElementById('notif-close');
    const notifMarkRead = document.getElementById('notif-mark-read');
    console.log('Notification variable made');

    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener('click', async function(e) {
        console.log('Notification icon clicked');
        e.preventDefault();
        notifDropdown.classList.toggle('open');
        if (notifDropdown.classList.contains('open')) {
          await loadNotifications();
        }
      });
    }
    if (notifClose) notifClose.addEventListener('click', () => notifDropdown.classList.remove('open'));
    if (notifMarkRead) notifMarkRead.addEventListener('click', async () => {
      await apiMarkNotifsRead();
      await loadNotifications();
      updateNotifBadge();
    });

    async function loadNotifications() {
      const list = document.getElementById('notif-list');
      if (!list) return;
      try {
        const notifs = await apiGetNotifications();
        if (notifs.length === 0) {
          list.innerHTML = '<div class="notif-empty">No notifications yet.</div>';
          return;
        }
        list.innerHTML = notifs.map(n => `
          <div class="notif-item ${n.is_read ? '' : 'notif-item--unread'}">
            <div class="notif-item__dot ${n.is_read ? 'notif-item__dot--read' : ''}"></div>
            <div class="notif-item__body">
              <div class="notif-item__text">${n.message}</div>
              <div class="notif-item__time">${formatTime(n.created_at)}</div>
            </div>
          </div>
        `).join('');
      } catch(e) { console.error(e); }
    }

    async function updateNotifBadge() {
      const badge = document.querySelector('#icon-notification .header-icon__badge');
      if (!badge) return;
      try {
        const data = await apiGetNotifUnread();
        if (data.count > 0) badge.classList.add('has-badge');
        else badge.classList.remove('has-badge');
      } catch(e) {}
    }

    async function updateMsgBadge() {
      const badge = document.querySelector('#icon-messages .header-icon__badge');
      if (!badge) return;
      try {
        const data = await apiGetMessageUnread();
        if (data.count > 0) badge.classList.add('has-badge');
        else badge.classList.remove('has-badge');
      } catch(e) {}
    }

    // ---- USER message panel ----
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === 'user') {
      const msgBtn = document.getElementById('icon-messages');
      if (msgBtn) {
        msgBtn.addEventListener('click', async function(e) {
          e.preventDefault();
          openPanel();
          await loadUserThread();
        });
      }

      const sendBtn = document.getElementById('chat-send');
      const chatInput = document.getElementById('chat-input');
      if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', async () => {
          const body = chatInput.value.trim();
          if (!body) return;
          chatInput.value = '';
          await apiSendMessage(body, null);
          await loadUserThread();
        });
        chatInput.addEventListener('keydown', async (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
          }
        });
      }

      async function loadUserThread() {
        const thread = document.getElementById('chat-thread');
        if (!thread) return;
        try {
          const msgs = await apiGetMyMessages();
          if (msgs.length === 0) {
            thread.innerHTML = '<div class="notif-empty">No messages yet. Say hello!</div>';
            return;
          }
          thread.innerHTML = msgs.map(m => {
            const isMe = m.sender_id === currentUser.id;
            return `
              <div class="chat-bubble-row ${isMe ? 'chat-bubble-row--me' : 'chat-bubble-row--them'}">
                <div class="chat-bubble ${isMe ? 'chat-bubble--me' : 'chat-bubble--them'}">${m.body}</div>
                <div class="chat-time">${isMe ? 'You' : m.sender_name} · ${formatTime(m.created_at)}</div>
              </div>
            `;
          }).join('');
          thread.scrollTop = thread.scrollHeight;
        } catch(e) { console.error(e); }
      }

      // Poll badges every 15s
      updateNotifBadge();
      updateMsgBadge();
      setInterval(() => { updateNotifBadge(); updateMsgBadge(); }, 15000);
    }

    // ---- ADMIN message panel ----
    if (currentUser && currentUser.role === 'admin') {
      let activeUserId = null;

      const msgBtn = document.getElementById('icon-messages');
      if (msgBtn) {
        msgBtn.addEventListener('click', async function(e) {
          e.preventDefault();
          openPanel();
          showConvList();
          await loadConversations();
        });
      }

      function showConvList() {
        document.getElementById('conv-list').style.display = 'block';
        document.getElementById('chat-thread').style.display = 'none';
        document.getElementById('chat-input-row').style.display = 'none';
        document.getElementById('conv-back').style.display = 'none';
        document.getElementById('panel-title').textContent = 'Messages';
        activeUserId = null;
      }

      document.getElementById('conv-back')?.addEventListener('click', showConvList);

      async function loadConversations() {
        const list = document.getElementById('conv-list');
        if (!list) return;
        try {
          const convs = await apiGetConversations();
          if (convs.length === 0) {
            list.innerHTML = '<div class="notif-empty">No messages from users yet.</div>';
            return;
          }
          list.innerHTML = convs.map(c => `
            <div class="conv-item" data-uid="${c.id}">
              <div class="conv-item__avatar">${c.fullname.charAt(0).toUpperCase()}</div>
              <div class="conv-item__info">
                <div class="conv-item__name">${c.fullname}</div>
                <div class="conv-item__preview">${c.last_message || '...'}</div>
              </div>
              <div class="conv-item__meta">
                <div class="conv-item__time">${c.last_time ? formatTime(c.last_time) : ''}</div>
                ${c.unread > 0 ? `<div class="conv-item__badge">${c.unread}</div>` : ''}
              </div>
            </div>
          `).join('');

          list.querySelectorAll('.conv-item').forEach(item => {
            item.addEventListener('click', async function() {
              activeUserId = this.getAttribute('data-uid');
              const name = this.querySelector('.conv-item__name').textContent;
              document.getElementById('panel-title').textContent = name;
              document.getElementById('conv-back').style.display = 'block';
              document.getElementById('conv-list').style.display = 'none';
              document.getElementById('chat-thread').style.display = 'flex';
              document.getElementById('chat-input-row').style.display = 'flex';
              await loadAdminThread(activeUserId);
            });
          });
        } catch(e) { console.error(e); }
      }

      async function loadAdminThread(userId) {
        const thread = document.getElementById('chat-thread');
        if (!thread) return;
        try {
          const msgs = await apiGetThread(userId);
          if (msgs.length === 0) {
            thread.innerHTML = '<div class="notif-empty">No messages yet.</div>';
            return;
          }
          thread.innerHTML = msgs.map(m => {
            const isMe = m.sender_role === 'admin';
            return `
              <div class="chat-bubble-row ${isMe ? 'chat-bubble-row--me' : 'chat-bubble-row--them'}">
                <div class="chat-bubble ${isMe ? 'chat-bubble--me' : 'chat-bubble--them'}">${m.body}</div>
                <div class="chat-time">${isMe ? 'You' : m.sender_name} · ${formatTime(m.created_at)}</div>
              </div>
            `;
          }).join('');
          thread.scrollTop = thread.scrollHeight;
        } catch(e) { console.error(e); }
      }

      const sendBtn = document.getElementById('chat-send');
      const chatInput = document.getElementById('chat-input');
      if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', async () => {
          if (!activeUserId) return;
          const body = chatInput.value.trim();
          if (!body) return;
          chatInput.value = '';
          await apiSendMessage(body, activeUserId);
          await loadAdminThread(activeUserId);
        });
        chatInput.addEventListener('keydown', async (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
          }
        });
      }

      updateMsgBadge();
      setInterval(updateMsgBadge, 15000);
    }
  }

// ---- USER MAKE QUEUE ----
if (document.getElementById('user-make-queue-page')) {
  const user = getCurrentUser();
  if (!user || user.role !== 'user') { navigateTo('login.html'); return; }
  setProfileUI(user);
  document.getElementById('welcome-name').textContent = user.fullname || 'User';

  const doctorSelect    = document.querySelector('select[data-field="doctor"]');
  const areaSelect      = document.querySelector('select[data-field="area"]');
  const specialistSelect = document.querySelector('select[data-field="specialist"]');
  const daySelect       = document.querySelector('select[data-field="day"]');
  const hourSelect      = document.querySelector('select[data-field="hour"]');

  let allDoctors = [];
  let allSchedules = [];

  // Load areas
  try {
    const areas = await apiGetAreas();
    areas.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.name;
      areaSelect.appendChild(opt);
    });
  } catch (e) { console.error('Areas load failed', e); }

  // Load specialists
  try {
    const specialists = await apiGetSpecialists();
    specialists.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      specialistSelect.appendChild(opt);
    });
  } catch (e) { console.error('Specialists load failed', e); }

  // Load all doctors up front (no filter)
  async function loadDoctors() {
    const area_id = areaSelect.value || '';
    const specialist_id = specialistSelect.value || '';
    try {
      allDoctors = await apiSearchDoctors('', area_id, specialist_id);
      doctorSelect.innerHTML = '<option value="" disabled selected hidden>Select doctor</option>';
      allDoctors.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.name + ' — ' + d.specialist + ' (' + d.area + ')';
        doctorSelect.appendChild(opt);
      });
      // Reset schedules
      daySelect.innerHTML = '<option value="" disabled selected hidden>Select day</option>';
      hourSelect.innerHTML = '<option value="" disabled selected hidden>Select hour</option>';
      allSchedules = [];
    } catch (e) { console.error('Doctor load failed', e); }
  }

  await loadDoctors();

  // When area or specialist changes, reload doctor list
  areaSelect.addEventListener('change', loadDoctors);
  specialistSelect.addEventListener('change', loadDoctors);

  // When doctor changes, load their schedules
  doctorSelect.addEventListener('change', async function () {
    const doctorId = this.value;
    if (!doctorId) return;
    try {
      allSchedules = await apiGetDoctorSchedules(doctorId);

      const days = [...new Set(allSchedules.map(s => s.day))];
      const hours = [...new Set(allSchedules.map(s => s.hour))];

      daySelect.innerHTML = '<option value="" disabled selected hidden>Select day</option>';
      days.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        daySelect.appendChild(opt);
      });

      hourSelect.innerHTML = '<option value="" disabled selected hidden>Select hour</option>';
      hours.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = h;
        hourSelect.appendChild(opt);
      });
    } catch (e) { console.error('Schedule load failed', e); }
  });

  // Book button
  const bookBtn = document.querySelector('.btn-book');
  if (bookBtn) {
    bookBtn.addEventListener('click', async function () {
      const doctorId = doctorSelect.value;
      const selectedDay = daySelect.value;
      const selectedHour = hourSelect.value;

      if (!doctorId) { alert('Please select a doctor.'); return; }
      if (!selectedDay || !selectedHour) { alert('Please select a day and hour.'); return; }

      const schedule = allSchedules.find(s => s.day === selectedDay && s.hour === selectedHour);
      if (!schedule) { alert('No matching schedule found.'); return; }

      const disease = prompt('Enter your disease / reason for visit (optional):') || '';

      try {
        await apiBookQueue(doctorId, schedule.id, disease);
        alert('Queue successfully booked!');
        navigateTo('dashboard.html');
      } catch (err) {
        alert('Booking failed: ' + err.message);
      }
    });
  }
}

  // ---- USER NOTIFICATIONS ----
  if (document.getElementById('user-notifications-page')) {
    const user = getCurrentUser();
    if (!user || user.role !== 'user') { navigateTo('login.html'); return; }
    setProfileUI(user);
    // Notifications remain static/dummy — no backend needed per current design
  }

  // ---- USER MESSAGES ----
  if (document.getElementById('user-messages-page')) {
    const user = getCurrentUser();
    if (!user || user.role !== 'user') { navigateTo('login.html'); return; }
    setProfileUI(user);
  }

  // ---- ADMIN DASHBOARD ----
  if (document.getElementById('admin-dashboard-page')) {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') { navigateTo('login.html'); return; }
    setProfileUI(user);
    document.getElementById('welcome-name').textContent = user.fullname || 'Admin';

    try {
      const data = await apiAdminGetQueueCount();
      document.getElementById('queue-count').textContent = data.count;
    } catch (err) {
      console.error('Queue count failed:', err.message);
    }
  }

  // ---- ADMIN NAVIGATE ----
  if (document.getElementById('admin-navigate-page')) {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') { navigateTo('login.html'); return; }
    setProfileUI(user);

    async function loadAdminQueues() {
      try {
        const queues = await apiAdminGetQueues();
        const tbody = document.getElementById('navigate-table-body');
        tbody.innerHTML = '';

        if (queues.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">No active queues.</td></tr>';
          return;
        }

        queues.forEach(function (q) {
          const isConsulting = q.status === 'CONSULTING';
          const btnLabel = isConsulting ? 'Complete' : 'Next';
          const tr = document.createElement('tr');
          tr.innerHTML =
            '<td>' + q.no + '.</td>' +
            '<td>' + q.id + '</td>' +
            '<td>' + q.disease + '</td>' +
            '<td>' + q.patient_name + '</td>' +
            '<td><button class="btn--next" data-id="' + q.raw_id + '">' + btnLabel + '</button></td>' +
            '<td>' + q.status + '</td>';
          tbody.appendChild(tr);
        });

        // tbody.querySelectorAll('.btn--next').forEach(function (btn) {
        //   btn.addEventListener('click', async function () {
        //     const rawId = this.getAttribute('data-id');
        //     try {
        //       await apiAdminNextQueue(rawId);
        //       await loadAdminQueues();
        //     } catch (err) {
        //       alert('Error: ' + err.message);
        //     }
        //   });
        // });

      tbody.querySelectorAll('.btn--next').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          const rawId = this.getAttribute('data-id'); // already a plain number string
          try {
            await apiAdminNextQueue(rawId);
            await loadAdminQueues();
          } catch (err) {
            alert('Error: ' + err.message);
          }
        });
      });
      } catch (err) {
        console.error('Admin queues load failed:', err.message);
      }
    }

    await loadAdminQueues();
  }
});

// ---- Messages ----
async function apiGetMyMessages() {
  return apiFetch('/messages/my');
}
async function apiSendMessage(body, receiver_id) {
  const payload = { body };
  if (receiver_id) payload.receiver_id = receiver_id;
  return apiFetch('/messages/send', { method: 'POST', body: JSON.stringify(payload) });
}
async function apiGetConversations() {
  return apiFetch('/messages/conversations');
}
async function apiGetThread(userId) {
  return apiFetch(`/messages/thread/${userId}`);
}
async function apiGetMessageUnread() {
  return apiFetch('/messages/unread-count');
}

// ---- Notifications ----
async function apiGetNotifications() {
  return apiFetch('/notifications/my');
}
async function apiGetNotifUnread() {
  return apiFetch('/notifications/unread-count');
}
async function apiMarkNotifsRead() {
  return apiFetch('/notifications/mark-read', { method: 'PATCH' });
}

// ---- Shared UI helpers ----

function setProfileUI(user) {
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const phoneEl = document.getElementById('profile-phone');
  if (nameEl) nameEl.textContent = user.fullname || 'User';
  if (emailEl) emailEl.textContent = user.email || '';
  if (phoneEl) phoneEl.textContent = user.phone || '';
}