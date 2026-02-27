// ─── State ───────────────────────────────────────────────────────────
let allStudents = [];   // full list from server
let deleteTargetId = null;

// ─── Bootstrap Modal refs ────────────────────────────────────────────
let studentModalInst, deleteModalInst;

document.addEventListener('DOMContentLoaded', () => {
    studentModalInst = new bootstrap.Modal(document.getElementById('studentModal'));
    deleteModalInst = new bootstrap.Modal(document.getElementById('deleteModal'));

    // Wire up confirm-delete button
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

    fetchStudents();
});

// ─── Toast Notification ──────────────────────────────────────────────
function showToast(message, type = 'success') {
    const stack = document.getElementById('toastStack');
    const toast = document.createElement('div');
    toast.className = 'app-toast';

    const icon = type === 'success' ? 'fa-check' : 'fa-exclamation';
    toast.innerHTML = `
        <div class="toast-icon ${type}"><i class="fas ${icon}"></i></div>
        <div class="toast-msg">${message}</div>
    `;

    stack.appendChild(toast);

    // Auto remove after 3.5 s
    setTimeout(() => {
        toast.classList.add('removing');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, 3500);
}

// ─── Avatar colour pool ──────────────────────────────────────────────
const AVATAR_COLORS = [
    '#e94560', '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#db2777'
];
function avatarColor(name) {
    let hash = 0;
    for (const c of name) hash = (hash << 5) - hash + c.charCodeAt(0);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initials(name) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ─── Fetch & Render ──────────────────────────────────────────────────
async function fetchStudents() {
    showLoading(true);
    try {
        const res = await fetch('/students');
        if (!res.ok) throw new Error('Server error');
        allStudents = await res.json();
        renderTable(allStudents);
        updateStats(allStudents);
    } catch (e) {
        console.error(e);
        showToast('Failed to load students.', 'error');
        renderEmpty();
    } finally {
        showLoading(false);
    }
}

function showLoading(on) {
    const tbody = document.getElementById('studentTableBody');
    if (on) {
        tbody.innerHTML = `
            <tr class="loading-row">
                <td colspan="6">
                    <div class="spinner-wrap">
                        <div class="custom-spinner"></div>
                        <span style="color:var(--text-muted); font-size:0.88rem;">Loading students…</span>
                    </div>
                </td>
            </tr>`;
    }
}

function renderEmpty() {
    document.getElementById('studentTableBody').innerHTML = `
        <tr>
            <td colspan="6">
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-user-slash"></i></div>
                    <p class="mb-0">No students found.<br>Try a different search or add a new student.</p>
                </div>
            </td>
        </tr>`;
}

function renderTable(students) {
    const tbody = document.getElementById('studentTableBody');

    if (students.length === 0) { renderEmpty(); return; }

    tbody.innerHTML = students.map((s, i) => {
        const color = avatarColor(s.name);
        const initl = initials(s.name);
        const delay = Math.min(i * 40, 400);
        return `
        <tr class="animate-row" style="animation-delay:${delay}ms;">
            <td class="text-muted" style="font-size:0.8rem;">${s.id}</td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="avatar" style="background:${color};">${initl}</div>
                    <span class="fw-500">${escHtml(s.name)}</span>
                </div>
            </td>
            <td><a href="mailto:${escHtml(s.email)}" class="text-decoration-none" style="color:var(--text-dark);">${escHtml(s.email)}</a></td>
            <td>${s.phone ? escHtml(s.phone) : '<span class="text-muted">—</span>'}</td>
            <td>${s.course ? `<span class="course-badge">${escHtml(s.course)}</span>` : '<span class="text-muted">—</span>'}</td>
            <td>
                <button class="btn btn-edit me-1" onclick='openEditModal(${JSON.stringify(s).replace(/'/g, "&#39;")})'>
                    <i class="fas fa-pen me-1"></i>Edit
                </button>
                <button class="btn btn-del" onclick="openDeleteModal(${s.id}, '${escHtml(s.name).replace(/'/g, "\\'")}')" >
                    <i class="fas fa-trash-alt me-1"></i>Delete
                </button>
            </td>
        </tr>`;
    }).join('');
}

function updateStats(students) {
    const courses = new Set(students.map(s => s.course).filter(Boolean));
    document.getElementById('stat-total').textContent = students.length;
    document.getElementById('stat-courses').textContent = courses.size;
    document.getElementById('stat-new').textContent = students.length;
}

// ─── Live Search / Filter ────────────────────────────────────────────
function filterStudents() {
    const q = document.getElementById('searchInput').value.trim().toLowerCase();
    const filtered = allStudents.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.course && s.course.toLowerCase().includes(q))
    );
    renderTable(filtered);
    document.getElementById('stat-new').textContent = filtered.length;
    document.getElementById('stat-search').textContent = q ? `"${q}"` : 'All';
}

// ─── Open Add Modal ──────────────────────────────────────────────────
function openAddModal() {
    document.getElementById('studentForm').reset();
    document.getElementById('studentId').value = '';
    document.getElementById('studentModalLabel').innerHTML = '<i class="fas fa-user-plus me-2"></i>Add Student';
    document.getElementById('saveBtnText').textContent = 'Save Student';
    studentModalInst.show();
}

// ─── Open Edit Modal ─────────────────────────────────────────────────
function openEditModal(student) {
    document.getElementById('studentId').value = student.id;
    document.getElementById('name').value = student.name;
    document.getElementById('email').value = student.email;
    document.getElementById('phone').value = student.phone || '';
    document.getElementById('course').value = student.course || '';
    document.getElementById('studentModalLabel').innerHTML = '<i class="fas fa-user-edit me-2"></i>Edit Student';
    document.getElementById('saveBtnText').textContent = 'Update Student';
    studentModalInst.show();
}

// ─── Save (Add or Edit) ──────────────────────────────────────────────
async function saveStudent() {
    const id = document.getElementById('studentId').value;
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const course = document.getElementById('course').value.trim();

    if (!name || !email) {
        showToast('Name and email are required.', 'error');
        return;
    }

    setSaveBtnLoading(true);

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/students/${id}` : '/students';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, course })
        });
        const result = await res.json();

        if (res.ok) {
            studentModalInst.hide();
            showToast(result.message || 'Student saved successfully!');
            fetchStudents();
        } else {
            showToast(result.error || 'Failed to save.', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Network error. Please try again.', 'error');
    } finally {
        setSaveBtnLoading(false);
    }
}

function setSaveBtnLoading(on) {
    document.getElementById('saveBtnSpinner').classList.toggle('d-none', !on);
    document.getElementById('saveStudentBtn').disabled = on;
}

// ─── Delete Flow ──────────────────────────────────────────────────────
function openDeleteModal(id, name) {
    deleteTargetId = id;
    document.getElementById('deleteStudentName').textContent = `"${name}" will be permanently removed.`;
    deleteModalInst.show();
}

async function confirmDelete() {
    if (!deleteTargetId) return;
    setDelBtnLoading(true);

    try {
        const res = await fetch(`/students/${deleteTargetId}`, { method: 'DELETE' });
        const result = await res.json();

        if (res.ok) {
            deleteModalInst.hide();
            showToast(result.message || 'Student deleted.');
            fetchStudents();
        } else {
            showToast(result.error || 'Failed to delete.', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Network error. Please try again.', 'error');
    } finally {
        setDelBtnLoading(false);
        deleteTargetId = null;
    }
}

function setDelBtnLoading(on) {
    document.getElementById('delBtnSpinner').classList.toggle('d-none', !on);
    document.getElementById('confirmDeleteBtn').disabled = on;
}

// ─── Utility ─────────────────────────────────────────────────────────
function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
