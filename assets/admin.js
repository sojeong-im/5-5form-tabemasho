// Tabemasho 3rd Gen Admin Dashboard - Firebase Firestore Integration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAV6QSIzNvD4SQYamlHNTa66jXsxTzfjSM",
  authDomain: "tabemasho-cbe9d.firebaseapp.com",
  projectId: "tabemasho-cbe9d",
  storageBucket: "tabemasho-cbe9d.firebasestorage.app",
  messagingSenderId: "298551855831",
  appId: "1:298551855831:web:80ad21924c2347704ffe92",
  measurementId: "G-C65FP1PGL1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// State
let applicants = [];
const ADMIN_KEY = '00347';

document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const loginForm = document.getElementById('loginForm');
  const adminPw = document.getElementById('adminPw');
  const loginError = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const searchInput = document.getElementById('searchInput');
  const genderFilter = document.getElementById('genderFilter');

  // Check saved session
  if (sessionStorage.getItem('tabemasho_admin_auth') === 'true') {
    showDashboard();
  }

  // Login handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (adminPw.value === ADMIN_KEY) {
      loginError.classList.add('hidden');
      sessionStorage.setItem('tabemasho_admin_auth', 'true');
      loginBtn.disabled = true;
      loginBtn.innerText = '불러오는 중... ⏳';
      await showDashboard();
    } else {
      loginError.classList.remove('hidden');
      adminPw.focus();
    }
  });

  // Logout handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('tabemasho_admin_auth');
      location.reload();
    });
  }

  // Refresh handler
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '<span>⏳</span> 갱신 중...';
      await loadApplicants();
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<span>🔄</span> 새로고침';
    });
  }

  // Search & Filter handlers
  if (searchInput) searchInput.addEventListener('input', filterAndRender);
  if (genderFilter) genderFilter.addEventListener('change', filterAndRender);

  // CSV Export handler
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCsv);
  }

  // Detail Modal Close
  const detailModal = document.getElementById('detailModal');
  const detailModalClose = document.getElementById('detailModalClose');
  if (detailModalClose && detailModal) {
    detailModalClose.addEventListener('click', () => {
      detailModal.classList.add('hidden');
      document.body.style.overflow = 'auto';
    });
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) {
        detailModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
      }
    });
  }

  async function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    await loadApplicants();
  }

  async function loadApplicants() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-12 text-slate-400">
          <div class="inline-block animate-spin mr-2">⏳</div> 파이어베이스에서 지원서를 불러오는 중입니다...
        </td>
      </tr>
    `;

    try {
      // First try orderBy timestamp desc
      let querySnapshot;
      try {
        const q = query(collection(db, "tabemasho_applicants"), orderBy("timestamp", "desc"));
        querySnapshot = await getDocs(q);
      } catch (err) {
        // Fallback without index if needed
        querySnapshot = await getDocs(collection(db, "tabemasho_applicants"));
      }

      applicants = [];
      querySnapshot.forEach((doc) => {
        applicants.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort client-side in case fallback was used
      applicants.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      updateStats();
      filterAndRender();
    } catch (err) {
      console.error("지원서 로드 오류:", err);
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-12 text-rose-500 font-bold">
            데이터를 불러오는 중 오류가 발생했습니다: ${err.message}
          </td>
        </tr>
      `;
    }
  }

  function updateStats() {
    const statTotal = document.getElementById('statTotal');
    const statMale = document.getElementById('statMale');
    const statFemale = document.getElementById('statFemale');

    const total = applicants.length;
    const male = applicants.filter(a => a.gender === '남성').length;
    const female = applicants.filter(a => a.gender === '여성').length;

    if (statTotal) statTotal.innerText = total;
    if (statMale) statMale.innerText = male;
    if (statFemale) statFemale.innerText = female;
  }

  function filterAndRender() {
    const queryTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const genderTerm = genderFilter ? genderFilter.value : 'all';

    const filtered = applicants.filter(app => {
      const matchGender = genderTerm === 'all' || app.gender === genderTerm;
      const matchQuery = !queryTerm || 
        (app.name && app.name.toLowerCase().includes(queryTerm)) ||
        (app.schoolDept && app.schoolDept.toLowerCase().includes(queryTerm)) ||
        (app.subway && app.subway.toLowerCase().includes(queryTerm)) ||
        (app.phone && app.phone.includes(queryTerm)) ||
        (app.interest && app.interest.toLowerCase().includes(queryTerm));

      return matchGender && matchQuery;
    });

    renderTable(filtered);
  }

  function renderTable(list) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-12 text-slate-400">
            ${applicants.length === 0 ? '접수된 지원서가 아직 없습니다. 🍙' : '검색 조건과 일치하는 지원자가 없습니다.'}
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = list.map((item, idx) => {
      const formattedDate = item.createdAt 
        ? new Date(item.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '-';

      const genderBadge = item.gender === '남성' 
        ? `<span class="text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded text-[10px] font-bold">남</span>`
        : `<span class="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] font-bold">여</span>`;

      const activitiesShort = Array.isArray(item.activities) && item.activities.length > 0
        ? item.activities.slice(0, 2).join(', ') + (item.activities.length > 2 ? ` 외 ${item.activities.length - 2}` : '')
        : '-';

      return `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">${formattedDate}</td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
              <span>${escapeHtml(item.name || '-')}</span>
              ${genderBadge}
              <span class="text-[11px] text-slate-400 font-normal">(${item.birthYear ? item.birthYear + '년' : '-'})</span>
            </div>
          </td>
          <td class="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
            <a href="tel:${item.phone}" class="hover:underline">${escapeHtml(item.phone || '-')}</a>
          </td>
          <td class="py-3 px-4">
            <div class="font-medium text-slate-900">${escapeHtml(item.schoolDept || '-')}</div>
            <div class="text-[11px] text-slate-400">${escapeHtml(item.status || '-')}</div>
          </td>
          <td class="py-3 px-4 whitespace-nowrap">
            <span class="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700 text-[11px]">
              🚇 ${escapeHtml(item.subway || '-')}
            </span>
          </td>
          <td class="py-3 px-4 text-slate-600 max-w-[150px] truncate" title="${escapeHtml(Array.isArray(item.activities) ? item.activities.join(', ') : '')}">
            ${escapeHtml(activitiesShort)}
          </td>
          <td class="py-3 px-4 text-center whitespace-nowrap">
            <button 
              type="button" 
              data-id="${item.id}"
              class="btn-detail px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-colors cursor-pointer"
            >
              상세보기
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach click listeners to detail buttons
    document.querySelectorAll('.btn-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const applicant = applicants.find(a => a.id === id);
        if (applicant) openDetailModal(applicant);
      });
    });
  }

  function openDetailModal(item) {
    const detailModal = document.getElementById('detailModal');
    const detailName = document.getElementById('detailName');
    const detailGenderAge = document.getElementById('detailGenderAge');
    const detailSub = document.getElementById('detailSub');
    const detailPhone = document.getElementById('detailPhone');
    const detailReasons = document.getElementById('detailReasons');
    const detailInterest = document.getElementById('detailInterest');
    const detailActivities = document.getElementById('detailActivities');
    const detailTimeSlots = document.getElementById('detailTimeSlots');
    const detailExpectations = document.getElementById('detailExpectations');
    const detailSubmittedAt = document.getElementById('detailSubmittedAt');

    detailName.innerText = item.name || '-';
    detailGenderAge.innerText = `${item.gender || '-'} · ${item.birthYear || '-'}년생`;
    detailSub.innerText = `${item.schoolDept || '-'} · ${item.status || '-'} · 가까운 역: ${item.subway || '-'}`;
    detailPhone.innerText = `📞 ${item.phone || '-'}`;

    // Reasons
    const reasonsList = Array.isArray(item.reasons) ? item.reasons.join(', ') : '-';
    detailReasons.innerHTML = escapeHtml(reasonsList) + (item.reasonOther ? `<br><span class="text-slate-500 font-normal">↳ 기타 사유: ${escapeHtml(item.reasonOther)}</span>` : '');

    // Interest
    detailInterest.innerText = item.interest || '작성된 내용이 없습니다.';

    // Activities
    const activitiesList = Array.isArray(item.activities) ? item.activities.join(', ') : '-';
    detailActivities.innerHTML = escapeHtml(activitiesList) + (item.activityOther ? `<br><span class="text-slate-500 font-normal">↳ 기타 활동: ${escapeHtml(item.activityOther)}</span>` : '');

    // Time slots
    if (Array.isArray(item.timeSlots) && item.timeSlots.length > 0) {
      detailTimeSlots.innerHTML = item.timeSlots.map(slot => 
        `<span class="bg-white border border-slate-200 px-2 py-1 rounded text-slate-700 font-medium">🕒 ${escapeHtml(slot)}</span>`
      ).join('');
    } else {
      detailTimeSlots.innerText = '-';
    }

    // Expectations
    detailExpectations.innerText = item.expectations || '작성된 내용이 없습니다.';

    // Submitted At
    detailSubmittedAt.innerText = item.createdAt 
      ? new Date(item.createdAt).toLocaleString('ko-KR')
      : '-';

    detailModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function exportToCsv() {
    if (applicants.length === 0) {
      alert('내보낼 지원자 데이터가 없습니다.');
      return;
    }

    const headers = ['제출일시', '이름', '출생연도', '성별', '소속학교학과', '상태', '가까운역', '연락처', '지원이유', '일본관심사', '희망활동', '가능시간대', '기대하는점'];
    
    const rows = applicants.map(a => [
      a.createdAt ? new Date(a.createdAt).toLocaleString('ko-KR') : '',
      a.name || '',
      a.birthYear || '',
      a.gender || '',
      a.schoolDept || '',
      a.status || '',
      a.subway || '',
      a.phone || '',
      Array.isArray(a.reasons) ? a.reasons.join('; ') : '',
      `"${(a.interest || '').replace(/"/g, '""')}"`,
      Array.isArray(a.activities) ? a.activities.join('; ') : '',
      Array.isArray(a.timeSlots) ? a.timeSlots.join('; ') : '',
      `"${(a.expectations || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tabemasho_applicants_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
