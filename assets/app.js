// Tabemasho 3rd Gen Application Form Logic

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

  // Restore Draft from LocalStorage if exists
  loadDraft();

  // Initialize UI Bindings
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
     1. Form Progress & Onigiri State
     ======================================================== */
  function updateProgress() {
    let completedSteps = 0;
    const totalSteps = 12; // Key required milestones

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
    
    // Check all agreements
    const allAgreed = Object.values(formData.agreements).every(v => v === true);
    if (allAgreed) completedSteps++;

    const percent = Math.round((completedSteps / totalSteps) * 100);
    
    const progressBar = document.getElementById('progressBar');
    const progressPercentText = document.getElementById('progressPercent');
    const onigiriMascot = document.getElementById('onigiriMascot');
    const onigiriStatusText = document.getElementById('onigiriStatusText');

    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressPercentText) progressPercentText.innerText = `${percent}%`;

    // Dynamic Onigiri mascot mood
    if (onigiriMascot && onigiriStatusText) {
      if (percent === 0) {
        onigiriMascot.innerText = '🍙';
        onigiriStatusText.innerText = '지원서를 시작해보세요!';
      } else if (percent < 40) {
        onigiriMascot.innerText = '🍙';
        onigiriStatusText.innerText = '밥을 뭉치고 있어요~';
      } else if (percent < 80) {
        onigiriMascot.innerText = '🍱';
        onigiriStatusText.innerText = '맛있는 김을 두르는 중!';
      } else if (percent < 100) {
        onigiriMascot.innerText = '✨🍙';
        onigiriStatusText.innerText = '우메보시(매실) 올리는 중! 거의 다 왔어요';
      } else {
        onigiriMascot.innerText = '🎉🍙';
        onigiriStatusText.innerText = '타베마쇼 삼각김밥 완성! 제출 가능해요';
      }
    }

    saveDraft();
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
      btn.className = `custom-chip text-sm px-4 py-2 ${formData.birthYear === yr ? 'active' : ''}`;
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
      btn.className = `custom-chip text-sm px-4 py-2 ${formData.status === opt ? 'active' : ''}`;
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
      btn.className = `custom-chip text-sm px-3.5 py-2 ${isSelected ? 'active' : ''}`;
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
        badge.innerText = `선택: ${formData.activities.length} / 최대 3개`;
        if (formData.activities.length === 3) {
          badge.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300';
        } else if (formData.activities.length > 0) {
          badge.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300';
        } else {
          badge.className = 'text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200';
        }
      }
    }

    container.innerHTML = '';
    activities.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const val = item.id === 'other' ? '기타' : item.label;
      const isSelected = formData.activities.includes(val);
      btn.className = `custom-chip text-sm px-3.5 py-2 ${isSelected ? 'active' : ''}`;
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
            // Shake effect & warning
            showToast('활동은 최대 3개까지만 선택할 수 있어요! 🍙', 'warning');
            btn.classList.add('animate-bounce');
            setTimeout(() => btn.classList.remove('animate-bounce'), 400);
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
     8. Time Slot Matrix (평일 & 주말 타임테이블)
     ======================================================== */
  function initTimeSlotMatrix() {
    const weekdayGrid = document.getElementById('weekdayMatrix');
    const weekendGrid = document.getElementById('weekendMatrix');
    if (!weekdayGrid || !weekendGrid) return;

    const weekdayDays = ['월', '화', '수', '목', '금'];
    const weekdayTimes = ['17~19시', '19~21시', '21시 이후'];

    const weekendDays = ['토', '일'];
    const weekendTimes = ['오전', '12~15시', '15~18시', '18시 이후'];

    // Render Weekday Matrix
    renderMatrix(weekdayGrid, weekdayDays, weekdayTimes, '평일');
    // Render Weekend Matrix
    renderMatrix(weekendGrid, weekendDays, weekendTimes, '주말');

    // Quick Select Buttons
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
        showToast('평일 저녁 시간대가 모두 선택되었어요! 🌙');
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
        showToast('주말 오후 시간대가 모두 선택되었어요! ☀️');
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
    
    // Header row
    const headerRow = document.createElement('div');
    headerRow.className = `grid grid-cols-${days.length + 1} gap-1.5 mb-1.5 text-center font-bold text-xs text-slate-500`;
    headerRow.innerHTML = `<div>시간</div>` + days.map(d => `<div class="bg-slate-100 rounded py-1 text-slate-700">${d}</div>`).join('');
    container.appendChild(headerRow);

    // Time rows
    times.forEach(t => {
      const row = document.createElement('div');
      row.className = `grid grid-cols-${days.length + 1} gap-1.5 mb-1.5 items-center`;
      
      const timeLabel = document.createElement('div');
      timeLabel.className = 'text-[11px] font-semibold text-slate-600 bg-amber-50/60 rounded px-1 py-1.5 text-center border border-amber-100';
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
     9. Photo Upload & Polaroid Preview
     ======================================================== */
  function initPhotoUpload() {
    const fileInput = document.getElementById('photoInput');
    const dropZone = document.getElementById('photoDropZone');
    const previewContainer = document.getElementById('polaroidPreviewContainer');
    const previewImage = document.getElementById('polaroidImage');
    const removeBtn = document.getElementById('removePhotoBtn');

    if (!fileInput || !dropZone) return;

    function handleFile(file) {
      if (!file || !file.type.startsWith('image/')) {
        showToast('이미지 파일(jpg, png 등)을 업로드해주세요!', 'warning');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast('사진 용량은 10MB 이하로 올려주세요!', 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        formData.photoDataUrl = e.target.result;
        showPhotoPreview(formData.photoDataUrl);
        updateProgress();
        showToast('폴라로이드 사진이 준비되었어요! 📸');
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
      dropZone.classList.add('border-blue-500', 'bg-blue-50/50');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
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
     10. Agreements & Stamp Interaction
     ======================================================== */
  function initAgreements() {
    const agreementKeys = ['period', 'frequency', 'fee', 'purpose', 'rules'];
    const agreeAllBtn = document.getElementById('agreeAllBtn');

    agreementKeys.forEach(key => {
      const checkbox = document.getElementById(`agree_${key}`);
      const row = document.getElementById(`agreeRow_${key}`);
      if (!checkbox) return;

      checkbox.checked = !!formData.agreements[key];
      updateAgreeRowUI(key, checkbox.checked);

      checkbox.addEventListener('change', (e) => {
        formData.agreements[key] = e.target.checked;
        updateAgreeRowUI(key, e.target.checked);
        updateProgress();
      });

      if (row) {
        row.addEventListener('click', (e) => {
          if (e.target.tagName !== 'INPUT') {
            checkbox.checked = !checkbox.checked;
            formData.agreements[key] = checkbox.checked;
            updateAgreeRowUI(key, checkbox.checked);
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
          updateAgreeRowUI(key, targetState);
        });

        agreeAllBtn.innerText = targetState ? '✓ 전체 확인 해제' : '✓ 전체 확인 및 동의하기';
        updateProgress();

        if (targetState) {
          showToast('모든 유의사항을 확인하셨습니다! 💮');
        }
      });
    }
  }

  function updateAgreeRowUI(key, isChecked) {
    const row = document.getElementById(`agreeRow_${key}`);
    const stamp = document.getElementById(`stamp_${key}`);
    if (row) {
      row.classList.toggle('bg-blue-50/70', isChecked);
      row.classList.toggle('border-blue-300', isChecked);
    }
    if (stamp) {
      stamp.classList.toggle('hidden', !isChecked);
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
        draftBadge.innerText = '자동 저장됨 ✓';
        draftBadge.classList.remove('opacity-0');
        setTimeout(() => draftBadge.classList.add('opacity-0'), 1500);
      }
    } catch (e) {
      // quota or private mode
    }
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
        if (confirm('작성 중인 내용을 모두 초기화할까요?')) {
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

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validation
      const errors = [];
      if (!formData.name.trim()) errors.push('1번: 이름을 입력해주세요.');
      if (!formData.birthYear) errors.push('2번: 출생연도를 선택해주세요.');
      if (!formData.gender) errors.push('3번: 성별을 선택해주세요.');
      if (!formData.schoolDept.trim()) errors.push('4번: 학교명과 학과를 입력해주세요.');
      if (!formData.status) errors.push('5번: 현재 상태를 선택해주세요.');
      if (!formData.subway.trim()) errors.push('6번: 거주지 인근 지하철역을 입력해주세요.');
      if (!formData.phone.trim() || formData.phone.replace(/[^0-9]/g, '').length < 10) errors.push('7번: 올바른 전화번호를 입력해주세요.');
      if (formData.reasons.length === 0) errors.push('8번: 타베마쇼 지원 이유를 1개 이상 선택해주세요.');
      if (!formData.interest.trim()) errors.push('9번: 일본 관련 관심사를 입력해주세요.');
      if (formData.activities.length === 0) errors.push('10번: 희망 활동을 1~3개 선택해주세요.');
      if (formData.timeSlots.length === 0) errors.push('11번: 활동 가능한 요일/시간대를 1개 이상 선택해주세요.');
      
      const allAgreed = Object.values(formData.agreements).every(v => v === true);
      if (!allAgreed) errors.push('마지막: 지원 전 확인사항 5가지를 모두 체크해주세요.');

      if (errors.length > 0) {
        showToast(errors[0], 'error');
        // Scroll to first invalid field
        return;
      }

      // Success celebration!
      triggerConfetti();

      // Populate Success Modal
      const summaryName = document.getElementById('modalSummaryName');
      const summaryDept = document.getElementById('modalSummaryDept');
      const summaryPhoto = document.getElementById('modalSummaryPhoto');

      if (summaryName) summaryName.innerText = formData.name;
      if (summaryDept) summaryDept.innerText = `${formData.schoolDept} (${formData.birthYear}년생)`;
      if (summaryPhoto && formData.photoDataUrl) {
        summaryPhoto.src = formData.photoDataUrl;
        summaryPhoto.parentElement.classList.remove('hidden');
      }

      if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      }

      // Clear draft after successful submission
      localStorage.removeItem('tabemasho_form_draft');
    });

    if (modalCloseBtn && modal) {
      modalCloseBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
      });
    }
  }

  /* Confetti burst */
  function triggerConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);
    }
  }

  /* Simple Toast Notification */
  function showToast(msg, type = 'info') {
    let toast = document.getElementById('globalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalToast';
      toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-sm font-bold shadow-xl z-50 transition-all duration-300 pointer-events-none flex items-center gap-2';
      document.body.appendChild(toast);
    }

    if (type === 'error') {
      toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-sm font-bold shadow-xl z-50 transition-all duration-300 pointer-events-none flex items-center gap-2 bg-red-600 text-white';
    } else if (type === 'warning') {
      toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-sm font-bold shadow-xl z-50 transition-all duration-300 pointer-events-none flex items-center gap-2 bg-amber-500 text-white';
    } else {
      toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-sm font-bold shadow-xl z-50 transition-all duration-300 pointer-events-none flex items-center gap-2 bg-[#1D3557] text-white';
    }

    toast.innerText = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0)';

    clearTimeout(window.__toastTimeout);
    window.__toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, 20px)';
    }, 2800);
  }
});
