// Tabemasho 3rd Gen Application Form - Portal View & Gallery Logic
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Firebase Configuration (tabemasho-cbe9d)
const firebaseConfig = {
  apiKey: "AIzaSyAV6QSIzNvD4SQYamlHNTa66jXsxTzfjSM",
  authDomain: "tabemasho-cbe9d.firebaseapp.com",
  projectId: "tabemasho-cbe9d",
  storageBucket: "tabemasho-cbe9d.firebasestorage.app",
  messagingSenderId: "298551855831",
  appId: "1:298551855831:web:80ad21924c2347704ffe92",
  measurementId: "G-C65FP1PGL1"
};

// Initialize Firebase App, Analytics & Cloud Firestore
const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch (e) {}
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
  // State
  const formData = {
    name: '',
    birthYear: '',
    gender: '',
    schoolDept: '',
    status: '',
    statusOther: '',
    subway: '',
    phone: '',
    reasons: [],
    reasonOther: '',
    interest: '',
    activities: [],
    activityOther: '',
    timeSlots: [],
    expectations: '',
    photoDataUrl: '',
    agreements: {
      period: false,
      frequency: false,
      fee: false,
      purpose: false,
      rules: false
    }
  };

  // Restore Draft
  loadDraft();

  // Initialize View Routing (Home / Form / Gallery)
  initViewRouting();

  // Initialize UI Bindings
  initGalleryFilterAndLightbox();
  initBirthYearChips();
  initGenderButtons();
  initStatusRadios();
  initPhoneFormatter();
  initReasonChips();
  initActivityChips();
  initTimeSlotMatrix();
  initPhotoUpload();
  initAgreements();
  initFormInputs();
  initDraftActions();
  initFormSubmit();

  // Initial Progress Update
  updateProgress();

  /* ========================================================
     0. View Routing (Portal Home / Form / Gallery)
     ======================================================== */
  function initViewRouting() {
    const homeView = document.getElementById('homeView');
    const formView = document.getElementById('formView');
    const galleryView = document.getElementById('galleryView');

    function switchView(viewName) {
      if (homeView) homeView.classList.add('view-hidden');
      if (formView) formView.classList.add('view-hidden');
      if (galleryView) galleryView.classList.add('view-hidden');

      if (viewName === 'form' && formView) {
        formView.classList.remove('view-hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (viewName === 'gallery' && galleryView) {
        galleryView.classList.remove('view-hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (homeView) {
        homeView.classList.remove('view-hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    // Trigger buttons from Home
    const heroApplyBtn = document.getElementById('heroApplyBtn');
    const heroGalleryBtn = document.getElementById('heroGalleryBtn');

    if (heroApplyBtn) heroApplyBtn.addEventListener('click', () => switchView('form'));
    if (heroGalleryBtn) heroGalleryBtn.addEventListener('click', () => switchView('gallery'));

    // Navigation Bar Links
    const navApplyBtn = document.getElementById('navApplyBtn');
    const navGalleryBtn = document.getElementById('navGalleryBtn');
    const navLogo = document.getElementById('navLogo');

    if (navApplyBtn) navApplyBtn.addEventListener('click', () => switchView('form'));
    if (navGalleryBtn) navGalleryBtn.addEventListener('click', () => switchView('gallery'));
    if (navLogo) navLogo.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('home');
    });

    // Back to Home buttons
    document.querySelectorAll('.btn-back-home').forEach(btn => {
      btn.addEventListener('click', () => switchView('home'));
    });

    // Cross-link buttons
    document.querySelectorAll('.btn-go-form').forEach(btn => {
      btn.addEventListener('click', () => switchView('form'));
    });
    document.querySelectorAll('.btn-go-gallery').forEach(btn => {
      btn.addEventListener('click', () => switchView('gallery'));
    });

    // Check URL hash if exists
    if (window.location.hash === '#apply') {
      switchView('form');
    } else if (window.location.hash === '#gallery') {
      switchView('gallery');
    } else {
      switchView('home');
    }
  }

  /* ========================================================
     0-1. Photo Gallery Filtering & Lightbox
     ======================================================== */
  function initGalleryFilterAndLightbox() {
    const filterBtns = document.querySelectorAll('.gallery-filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');

    let currentPhotoList = [];
    let currentPhotoIndex = 0;

    function buildCurrentList() {
      currentPhotoList = Array.from(galleryItems)
        .filter(el => !el.classList.contains('hidden'))
        .map(el => ({
          src: el.dataset.fullsrc || el.querySelector('img').src,
          caption: el.dataset.caption || ''
        }));
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
          b.classList.remove('bg-slate-900', 'text-white');
          b.classList.add('bg-slate-100', 'text-slate-600');
        });
        btn.classList.remove('bg-slate-100', 'text-slate-600');
        btn.classList.add('bg-slate-900', 'text-white');

        const category = btn.dataset.filter;
        galleryItems.forEach(item => {
          if (category === 'all' || item.dataset.category === category) {
            item.classList.remove('hidden');
          } else {
            item.classList.add('hidden');
          }
        });
        buildCurrentList();
      });
    });

    buildCurrentList();

    galleryItems.forEach(item => {
      item.addEventListener('click', () => {
        buildCurrentList();
        const src = item.dataset.fullsrc || item.querySelector('img').src;
        currentPhotoIndex = currentPhotoList.findIndex(p => p.src.includes(src) || src.includes(p.src));
        if (currentPhotoIndex === -1) currentPhotoIndex = 0;
        updateLightbox();
        if (lightboxModal) {
          lightboxModal.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    function updateLightbox() {
      if (currentPhotoList.length === 0) return;
      const current = currentPhotoList[currentPhotoIndex];
      if (lightboxImg) lightboxImg.src = current.src;
      if (lightboxCaption) lightboxCaption.innerText = current.caption;
    }

    if (lightboxPrev) {
      lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentPhotoList.length > 0) {
          currentPhotoIndex = (currentPhotoIndex - 1 + currentPhotoList.length) % currentPhotoList.length;
          updateLightbox();
        }
      });
    }

    if (lightboxNext) {
      lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentPhotoList.length > 0) {
          currentPhotoIndex = (currentPhotoIndex + 1) % currentPhotoList.length;
          updateLightbox();
        }
      });
    }

    if (lightboxClose && lightboxModal) {
      lightboxClose.addEventListener('click', () => {
        lightboxModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
      });
    }

    if (lightboxModal) {
      lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) {
          lightboxModal.classList.add('hidden');
          document.body.style.overflow = 'auto';
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (!lightboxModal || lightboxModal.classList.contains('hidden')) return;
      if (e.key === 'Escape') {
        lightboxModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
      } else if (e.key === 'ArrowLeft' && lightboxPrev) {
        lightboxPrev.click();
      } else if (e.key === 'ArrowRight' && lightboxNext) {
        lightboxNext.click();
      }
    });
  }

  /* ========================================================
     1. Form Progress & Minimalist HUD
     ======================================================== */
  function updateProgress() {
    let completedSteps = 0;
    const totalSteps = 11;

    if (formData.name.trim()) completedSteps++;
    if (formData.birthYear) completedSteps++;
    if (formData.gender) completedSteps++;
    if (formData.schoolDept.trim()) completedSteps++;
    if (formData.status) completedSteps++;
    if (formData.subway.trim()) completedSteps++;
    if (formData.phone.replace(/[^0-9]/g, '').length >= 10) completedSteps++;
    if (formData.reasons.length > 0) completedSteps++;
    if (formData.interest.trim()) completedSteps++;
    if (formData.activities.length > 0) completedSteps++;
    if (formData.timeSlots.length > 0) completedSteps++;

    const percent = Math.round((completedSteps / totalSteps) * 100);
    
    const progressBar = document.getElementById('progressBar');
    const progressPercentText = document.getElementById('progressPercent');
    const progressStepCount = document.getElementById('progressStepCount');

    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressPercentText) progressPercentText.innerText = `${percent}%`;
    if (progressStepCount) progressStepCount.innerText = `${completedSteps}/${totalSteps}`;

    // Update the Live Interactive Membership Ticket
    updateLiveTicket();

    saveDraft();
  }

  /* ========================================================
     1-1. Live Interactive Membership Ticket Logic
     ======================================================== */
  function updateLiveTicket() {
    const ticketName = document.getElementById('ticketName');
    const ticketSchool = document.getElementById('ticketSchool');
    const ticketMeta = document.getElementById('ticketMeta');
    const ticketSubway = document.getElementById('ticketSubway');
    const ticketActivities = document.getElementById('ticketActivities');

    if (ticketName) {
      if (formData.name.trim()) {
        ticketName.innerText = formData.name.trim();
        ticketName.classList.remove('text-slate-300');
        ticketName.classList.add('text-slate-900');
      } else {
        ticketName.innerText = '지원자 이름';
        ticketName.classList.add('text-slate-300');
        ticketName.classList.remove('text-slate-900');
      }
    }

    if (ticketSchool) {
      ticketSchool.innerText = formData.schoolDept.trim() || '학교 및 학과를 입력하세요';
    }

    if (ticketMeta) {
      const g = formData.gender || '성별';
      const y = formData.birthYear ? `${formData.birthYear}년생` : '연도';
      const s = formData.status || '상태';
      ticketMeta.innerText = `${g} • ${y} • ${s}`;
    }

    if (ticketSubway) {
      ticketSubway.innerText = formData.subway.trim() ? `🚇 ${formData.subway.trim()}` : '🚇 가까운 역';
    }

    if (ticketActivities) {
      if (formData.activities && formData.activities.length > 0) {
        ticketActivities.innerHTML = formData.activities.map(act => 
          `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono">#${act}</span>`
        ).join('');
      } else {
        ticketActivities.innerHTML = `<span class="text-[11px] text-slate-400 italic">원서에서 희망 활동을 선택해주세요</span>`;
      }
    }
  }

  /* ========================================================
     2. Birth Year (00~07)
     ======================================================== */
  function initBirthYearChips() {
    const container = document.getElementById('birthYearContainer');
    if (!container) return;
    const years = ['00', '01', '02', '03', '04', '05', '06', '07'];
    
    container.innerHTML = '';
    years.forEach(yr => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `pill-chip text-xs sm:text-sm ${formData.birthYear === yr ? 'active' : ''}`;
      btn.innerHTML = `<span>${yr}년생</span>`;
      btn.addEventListener('click', () => {
        container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        if (formData.birthYear === yr) {
          formData.birthYear = '';
        } else {
          formData.birthYear = yr;
          btn.classList.add('active');
        }
        updateProgress();
      });
      container.appendChild(btn);
    });
  }

  /* ========================================================
     3. Gender (남성 / 여성)
     ======================================================== */
  function initGenderButtons() {
    const maleBtn = document.getElementById('genderMale');
    const femaleBtn = document.getElementById('genderFemale');
    if (!maleBtn || !femaleBtn) return;

    function setGender(val) {
      formData.gender = val;
      maleBtn.classList.toggle('active', val === '남성');
      femaleBtn.classList.toggle('active', val === '여성');
      updateProgress();
    }

    maleBtn.addEventListener('click', () => setGender('남성'));
    femaleBtn.addEventListener('click', () => setGender('여성'));

    if (formData.gender) {
      setGender(formData.gender);
    }
  }

  /* ========================================================
     4. Status (재학 / 휴학 / 기타)
     ======================================================== */
  function initStatusRadios() {
    const container = document.getElementById('statusContainer');
    const otherInput = document.getElementById('statusOtherInput');
    if (!container) return;

    const options = ['재학', '휴학', '기타'];
    container.innerHTML = '';

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `pill-chip text-xs sm:text-sm ${formData.status === opt ? 'active' : ''}`;
      btn.innerText = opt;
      btn.addEventListener('click', () => {
        container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        formData.status = opt;
        btn.classList.add('active');
        if (otherInput) {
          if (opt === '기타') {
            otherInput.classList.remove('hidden');
            otherInput.focus();
          } else {
            otherInput.classList.add('hidden');
            formData.statusOther = '';
          }
        }
        updateProgress();
      });
      container.appendChild(btn);
    });

    if (otherInput) {
      otherInput.value = formData.statusOther || '';
      otherInput.addEventListener('input', (e) => {
        formData.statusOther = e.target.value;
        updateProgress();
      });
      if (formData.status === '기타') {
        otherInput.classList.remove('hidden');
      }
    }
  }

  /* ========================================================
     5. Phone Formatter
     ======================================================== */
  function initPhoneFormatter() {
    const phoneInput = document.getElementById('phoneInput');
    if (!phoneInput) return;

    phoneInput.value = formData.phone || '';
    phoneInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/[^0-9]/g, '');
      if (val.length > 11) val = val.substring(0, 11);

      if (val.length > 7) {
        val = val.substring(0, 3) + '-' + val.substring(3, 7) + '-' + val.substring(7);
      } else if (val.length > 3) {
        val = val.substring(0, 3) + '-' + val.substring(3);
      }
      e.target.value = val;
      formData.phone = val;
      updateProgress();
    });
  }

  /* ========================================================
     6. Reasons (복수 선택 + 기타)
     ======================================================== */
  function initReasonChips() {
    const container = document.getElementById('reasonsContainer');
    const otherInput = document.getElementById('reasonOtherInput');
    if (!container) return;

    const reasons = [
      { id: 'food', label: '일본 음식·맛집 🍜' },
      { id: 'travel', label: '일본 여행 ✈️' },
      { id: 'anime', label: '애니·만화 🎬' },
      { id: 'jpop', label: 'J-POP 🎵' },
      { id: 'language', label: '일본어 🗣️' },
      { id: 'culture', label: '일본 문화 🏯' },
      { id: 'friends', label: '새로운 사람들과 친해지고 싶어서 🤝' },
      { id: 'other', label: '기타 ✏️' }
    ];

    container.innerHTML = '';
    reasons.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isSelected = formData.reasons.includes(item.label) || (item.id === 'other' && formData.reasons.includes('기타'));
      btn.className = `pill-chip text-xs sm:text-sm ${isSelected ? 'active' : ''}`;
      btn.innerText = item.label;

      btn.addEventListener('click', () => {
        const val = item.id === 'other' ? '기타' : item.label;
        const index = formData.reasons.indexOf(val);
        if (index > -1) {
          formData.reasons.splice(index, 1);
          btn.classList.remove('active');
          if (item.id === 'other' && otherInput) {
            otherInput.classList.add('hidden');
          }
        } else {
          formData.reasons.push(val);
          btn.classList.add('active');
          if (item.id === 'other' && otherInput) {
            otherInput.classList.remove('hidden');
            otherInput.focus();
          }
        }
        updateProgress();
      });
      container.appendChild(btn);
    });

    if (otherInput) {
      otherInput.value = formData.reasonOther || '';
      otherInput.addEventListener('input', (e) => {
        formData.reasonOther = e.target.value;
        updateProgress();
      });
      if (formData.reasons.includes('기타')) {
        otherInput.classList.remove('hidden');
      }
    }
  }

  /* ========================================================
     7. Activities (최대 3개 선택!)
     ======================================================== */
  function initActivityChips() {
    const container = document.getElementById('activitiesContainer');
    const badge = document.getElementById('activityCounterBadge');
    const otherInput = document.getElementById('activityOtherInput');
    if (!container) return;

    const activities = [
      { id: 'gourmet', label: '일본 맛집 탐방 🍱' },
      { id: 'cafe', label: '일본 감성 카페 ☕' },
      { id: 'media', label: '애니·일드 같이 보기 📺' },
      { id: 'karaoke', label: 'J-POP·노래방 🎤' },
      { id: 'study', label: '기초 일본어·회화 📚' },
      { id: 'trip_plan', label: '일본 여행 계획 짜기 🗺️' },
      { id: 'experience', label: '일본 문화 체험 🎐' },
      { id: 'social', label: '편하게 친목하기 🍻' },
      { id: 'other', label: '기타 ✏️' }
    ];

    function updateCounter() {
      if (badge) {
        badge.innerText = `${formData.activities.length} / 3 선택`;
        if (formData.activities.length === 3) {
          badge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200';
        } else if (formData.activities.length > 0) {
          badge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white';
        } else {
          badge.className = 'text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500';
        }
      }
    }

    container.innerHTML = '';
    activities.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const val = item.id === 'other' ? '기타' : item.label;
      const isSelected = formData.activities.includes(val);
      btn.className = `pill-chip text-xs sm:text-sm ${isSelected ? 'active' : ''}`;
      btn.innerText = item.label;

      btn.addEventListener('click', () => {
        const index = formData.activities.indexOf(val);
        if (index > -1) {
          formData.activities.splice(index, 1);
          btn.classList.remove('active');
          if (item.id === 'other' && otherInput) {
            otherInput.classList.add('hidden');
          }
        } else {
          if (formData.activities.length >= 3) {
            showToast('활동은 최대 3개까지만 선택할 수 있습니다', 'warning');
            return;
          }
          formData.activities.push(val);
          btn.classList.add('active');
          if (item.id === 'other' && otherInput) {
            otherInput.classList.remove('hidden');
            otherInput.focus();
          }
        }
        updateCounter();
        updateProgress();
      });
      container.appendChild(btn);
    });

    if (otherInput) {
      otherInput.value = formData.activityOther || '';
      otherInput.addEventListener('input', (e) => {
        formData.activityOther = e.target.value;
        updateProgress();
      });
      if (formData.activities.includes('기타')) {
        otherInput.classList.remove('hidden');
      }
    }

    updateCounter();
  }

  /* ========================================================
     8. Time Slot Matrix
     ======================================================== */
  function initTimeSlotMatrix() {
    const weekdayGrid = document.getElementById('weekdayMatrix');
    const weekendGrid = document.getElementById('weekendMatrix');
    if (!weekdayGrid || !weekendGrid) return;

    const weekdayDays = ['월', '화', '수', '목', '금'];
    const weekdayTimes = ['17~19시', '19~21시', '21시 이후'];

    const weekendDays = ['토', '일'];
    const weekendTimes = ['오전', '12~15시', '15~18시', '18시 이후'];

    renderMatrix(weekdayGrid, weekdayDays, weekdayTimes, '평일');
    renderMatrix(weekendGrid, weekendDays, weekendTimes, '주말');

    const selectAllWeekdaysBtn = document.getElementById('selectWeekdayEvenings');
    const selectAllWeekendsBtn = document.getElementById('selectWeekendAfternoons');
    const clearScheduleBtn = document.getElementById('clearSchedule');

    if (selectAllWeekdaysBtn) {
      selectAllWeekdaysBtn.addEventListener('click', () => {
        weekdayDays.forEach(d => {
          ['19~21시', '21시 이후'].forEach(t => {
            const key = `평일_${d}_${t}`;
            if (!formData.timeSlots.includes(key)) formData.timeSlots.push(key);
          });
        });
        refreshMatrixUI();
        updateProgress();
        showToast('평일 저녁 시간대가 선택되었습니다');
      });
    }

    if (selectAllWeekendsBtn) {
      selectAllWeekendsBtn.addEventListener('click', () => {
        weekendDays.forEach(d => {
          ['12~15시', '15~18시'].forEach(t => {
            const key = `주말_${d}_${t}`;
            if (!formData.timeSlots.includes(key)) formData.timeSlots.push(key);
          });
        });
        refreshMatrixUI();
        updateProgress();
        showToast('주말 오후 시간대가 선택되었습니다');
      });
    }

    if (clearScheduleBtn) {
      clearScheduleBtn.addEventListener('click', () => {
        formData.timeSlots = [];
        refreshMatrixUI();
        updateProgress();
      });
    }
  }

  function renderMatrix(container, days, times, prefix) {
    container.innerHTML = '';
    
    const colClass = days.length === 5 ? 'grid-cols-6' : 'grid-cols-3';

    const headerRow = document.createElement('div');
    headerRow.className = `grid ${colClass} gap-1 sm:gap-1.5 mb-1.5 text-center font-semibold text-[10px] sm:text-xs text-slate-400`;
    headerRow.innerHTML = `<div></div>` + days.map(d => `<div class="bg-slate-100/80 rounded-md py-1 text-slate-700 font-bold">${d}</div>`).join('');
    container.appendChild(headerRow);

    times.forEach(t => {
      const row = document.createElement('div');
      row.className = `grid ${colClass} gap-1 sm:gap-1.5 mb-1.5 items-center`;
      
      const timeLabel = document.createElement('div');
      timeLabel.className = 'text-[9px] sm:text-[11px] font-medium text-slate-500 text-center py-1 leading-tight';
      timeLabel.innerText = t;
      row.appendChild(timeLabel);

      days.forEach(d => {
        const slotKey = `${prefix}_${d}_${t}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.slot = slotKey;
        btn.className = `time-slot-btn ${formData.timeSlots.includes(slotKey) ? 'active' : ''}`;
        btn.innerHTML = `<span>가능</span>`;
        btn.addEventListener('click', () => {
          const index = formData.timeSlots.indexOf(slotKey);
          if (index > -1) {
            formData.timeSlots.splice(index, 1);
            btn.classList.remove('active');
          } else {
            formData.timeSlots.push(slotKey);
            btn.classList.add('active');
          }
          updateProgress();
        });
        row.appendChild(btn);
      });
      container.appendChild(row);
    });
  }

  function refreshMatrixUI() {
    document.querySelectorAll('.time-slot-btn').forEach(btn => {
      const key = btn.dataset.slot;
      btn.classList.toggle('active', formData.timeSlots.includes(key));
    });
  }

  /* ========================================================
     9. Modern Photo Upload & Preview
     ======================================================== */
  function initPhotoUpload() {
    const fileInput = document.getElementById('photoInput');
    const dropZone = document.getElementById('photoDropZone');
    const previewContainer = document.getElementById('photoPreviewContainer');
    const previewImage = document.getElementById('photoImagePreview');
    const removeBtn = document.getElementById('removePhotoBtn');

    if (!fileInput || !dropZone) return;

    function handleFile(file) {
      if (!file || !file.type.startsWith('image/')) {
        showToast('이미지 파일(jpg, png 등)을 선택해주세요', 'warning');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast('사진 용량은 10MB 이하로 업로드해주세요', 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        formData.photoDataUrl = e.target.result;
        showPhotoPreview(formData.photoDataUrl);
        updateProgress();
      };
      reader.readAsDataURL(file);
    }

    function showPhotoPreview(url) {
      if (previewImage) previewImage.src = url;
      if (dropZone) dropZone.classList.add('hidden');
      if (previewContainer) previewContainer.classList.remove('hidden');
    }

    function removePhoto() {
      formData.photoDataUrl = '';
      if (fileInput) fileInput.value = '';
      if (previewImage) previewImage.src = '';
      if (previewContainer) previewContainer.classList.add('hidden');
      if (dropZone) dropZone.classList.remove('hidden');
      updateProgress();
    }

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-slate-800', 'bg-slate-50');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-slate-800', 'bg-slate-50');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-slate-800', 'bg-slate-50');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', removePhoto);
    }

    if (formData.photoDataUrl) {
      showPhotoPreview(formData.photoDataUrl);
    }
  }

  /* ========================================================
     10. Modern Agreements
     ======================================================== */
  function initAgreements() {
    const agreementKeys = ['period', 'frequency', 'fee', 'purpose', 'rules'];
    const agreeAllBtn = document.getElementById('agreeAllBtn');

    agreementKeys.forEach(key => {
      const checkbox = document.getElementById(`agree_${key}`);
      const card = document.getElementById(`agreeCard_${key}`);
      if (!checkbox) return;

      checkbox.checked = !!formData.agreements[key];
      updateAgreeCardUI(key, checkbox.checked);

      checkbox.addEventListener('change', (e) => {
        formData.agreements[key] = e.target.checked;
        updateAgreeCardUI(key, e.target.checked);
        updateProgress();
      });

      if (card) {
        card.addEventListener('click', (e) => {
          if (e.target.tagName !== 'INPUT') {
            checkbox.checked = !checkbox.checked;
            formData.agreements[key] = checkbox.checked;
            updateAgreeCardUI(key, checkbox.checked);
            updateProgress();
          }
        });
      }
    });

    if (agreeAllBtn) {
      agreeAllBtn.addEventListener('click', () => {
        const allChecked = agreementKeys.every(k => formData.agreements[k]);
        const targetState = !allChecked;

        agreementKeys.forEach(key => {
          formData.agreements[key] = targetState;
          const cb = document.getElementById(`agree_${key}`);
          if (cb) cb.checked = targetState;
          updateAgreeCardUI(key, targetState);
        });

        agreeAllBtn.innerText = targetState ? '전체 해제' : '전체 동의하기';
        updateProgress();
      });
    }
  }

  function updateAgreeCardUI(key, isChecked) {
    const card = document.getElementById(`agreeCard_${key}`);
    const checkBadge = document.getElementById(`checkBadge_${key}`);
    if (card) {
      card.classList.toggle('checked', isChecked);
    }
    if (checkBadge) {
      checkBadge.classList.toggle('bg-slate-900', isChecked);
      checkBadge.classList.toggle('text-white', isChecked);
      checkBadge.classList.toggle('border-slate-900', isChecked);
      checkBadge.classList.toggle('bg-slate-100', !isChecked);
      checkBadge.classList.toggle('text-transparent', !isChecked);
      checkBadge.classList.toggle('border-slate-300', !isChecked);
    }
  }

  /* ========================================================
     11. Basic Text Inputs Binding
     ======================================================== */
  function initFormInputs() {
    const textFields = [
      { id: 'nameInput', key: 'name' },
      { id: 'schoolDeptInput', key: 'schoolDept' },
      { id: 'subwayInput', key: 'subway' },
      { id: 'interestInput', key: 'interest' },
      { id: 'expectationsInput', key: 'expectations' }
    ];

    textFields.forEach(({ id, key }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = formData[key] || '';
      el.addEventListener('input', (e) => {
        formData[key] = e.target.value;
        updateProgress();
      });
    });
  }

  /* ========================================================
     12. Draft Save & Restore
     ======================================================== */
  function saveDraft() {
    try {
      localStorage.setItem('tabemasho_form_draft', JSON.stringify(formData));
      const draftBadge = document.getElementById('draftStatus');
      if (draftBadge) {
        draftBadge.innerText = '저장됨';
        draftBadge.classList.remove('opacity-0');
        setTimeout(() => draftBadge.classList.add('opacity-0'), 1500);
      }
    } catch (e) {}
  }

  function loadDraft() {
    try {
      const saved = localStorage.getItem('tabemasho_form_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(formData, parsed);
      }
    } catch (e) {}
  }

  function initDraftActions() {
    const resetBtn = document.getElementById('resetFormBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('작성 중인 내용을 모두 초기화하시겠습니까?')) {
          localStorage.removeItem('tabemasho_form_draft');
          location.reload();
        }
      });
    }
  }

  /* ========================================================
     13. Form Submission & Celebration
     ======================================================== */
  function initFormSubmit() {
    const form = document.getElementById('applicationForm');
    const modal = document.getElementById('successModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const errors = [];
      if (!formData.name.trim()) errors.push('이름을 입력해주세요.');
      if (!formData.birthYear) errors.push('출생연도를 선택해주세요.');
      if (!formData.gender) errors.push('성별을 선택해주세요.');
      if (!formData.schoolDept.trim()) errors.push('학교명과 학과를 입력해주세요.');
      if (!formData.status) errors.push('현재 상태를 선택해주세요.');
      if (!formData.subway.trim()) errors.push('가장 가까운 지하철역을 입력해주세요.');
      if (!formData.phone.trim() || formData.phone.replace(/[^0-9]/g, '').length < 10) errors.push('올바른 연락처를 입력해주세요.');
      if (formData.reasons.length === 0) errors.push('타베마쇼 지원 이유를 1개 이상 선택해주세요.');
      if (!formData.interest.trim()) errors.push('일본 관련 관심사를 입력해주세요.');
      if (formData.activities.length === 0) errors.push('희망 활동을 1~3개 선택해주세요.');
      if (formData.timeSlots.length === 0) errors.push('활동 가능한 요일/시간대를 선택해주세요.');
      
      const allAgreed = Object.values(formData.agreements).every(v => v === true);
      if (!allAgreed) errors.push('지원 전 확인사항 5가지를 모두 체크해주세요.');

      if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
      }

      const submitBtn = document.getElementById('submitFormBtn');
      const originalBtnContent = submitBtn ? submitBtn.innerHTML : '';

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `
            <span class="inline-block animate-spin mr-1">⏳</span>
            <span>파이어베이스 저장 중...</span>
          `;
        }

        const applicantData = {
          name: formData.name.trim(),
          birthYear: formData.birthYear,
          gender: formData.gender,
          schoolDept: formData.schoolDept.trim(),
          status: formData.status === '기타' && formData.statusOther ? `기타 (${formData.statusOther})` : formData.status,
          subway: formData.subway.trim(),
          phone: formData.phone.trim(),
          reasons: formData.reasons,
          reasonOther: formData.reasonOther || '',
          interest: formData.interest.trim(),
          activities: formData.activities,
          activityOther: formData.activityOther || '',
          timeSlots: formData.timeSlots,
          expectations: formData.expectations.trim(),
          photoDataUrl: formData.photoDataUrl || '',
          agreements: formData.agreements,
          createdAt: new Date().toISOString(),
          timestamp: Date.now()
        };

        // Firestore 컬렉션 'tabemasho_applicants'에 문서 저장
        await addDoc(collection(db, "tabemasho_applicants"), applicantData);

        // Stamp the Live Membership Pass with red Hanko ink!
        const ticketStamp = document.getElementById('ticketStamp');
        if (ticketStamp) {
          ticketStamp.classList.add('stamped');
          ticketStamp.innerHTML = `
            <span class="text-[9px] tracking-widest font-black text-rose-700">受付完了</span>
            <span class="text-[7px] font-jp font-bold text-rose-600">合格祈願</span>
          `;
        }

        triggerConfetti();

        // Populate Success Modal
        const summaryName = document.getElementById('modalSummaryName');
        const summaryDept = document.getElementById('modalSummaryDept');

        if (summaryName) summaryName.innerText = formData.name;
        if (summaryDept) summaryDept.innerText = `${formData.schoolDept} (${formData.birthYear}년생)`;

        if (modal) {
          modal.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
        }

        localStorage.removeItem('tabemasho_form_draft');
      } catch (err) {
        console.error("Firestore 저장 오류:", err);
        showToast('지원서 저장 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnContent;
        }
      }
    });

    if (modalCloseBtn && modal) {
      modalCloseBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        const homeView = document.getElementById('homeView');
        const formView = document.getElementById('formView');
        const galleryView = document.getElementById('galleryView');
        if (homeView) homeView.classList.remove('view-hidden');
        if (formView) formView.classList.add('view-hidden');
        if (galleryView) galleryView.classList.add('view-hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  function triggerConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }

  function showToast(msg, type = 'info') {
    let toast = document.getElementById('globalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalToast';
      toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl z-50 transition-all duration-300 pointer-events-none flex items-center gap-2';
      document.body.appendChild(toast);
    }

    if (type === 'error') {
      toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl z-50 transition-all duration-300 pointer-events-none flex items-center gap-2 bg-rose-600 text-white';
    } else if (type === 'warning') {
      toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl z-50 transition-all duration-300 pointer-events-none flex items-center gap-2 bg-amber-500 text-white';
    } else {
      toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl z-50 transition-all duration-300 pointer-events-none flex items-center gap-2 bg-slate-900 text-white';
    }

    toast.innerText = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0)';

    clearTimeout(window.__toastTimeout);
    window.__toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, 15px)';
    }, 2800);
  }
});
