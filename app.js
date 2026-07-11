/**
 * storebook - 로컬 개인 가계부 JavaScript
 * LocalStorage 연동 및 동적 렌더링 로직
 */

// 디버깅용 전역 에러 리스너 (사용자 화면에 에러 팝업 표시)
window.addEventListener('error', function(e) {
    alert('가계부 앱 내부 에러 발생:\n' + e.message + '\n파일: ' + e.filename + '\n라인: ' + e.lineno);
});

// ==========================================================================
// 1. 초기 데이터 모델 및 상수 정의
// ==========================================================================

const DEFAULT_INCOME_CATEGORIES = [
    { value: '급여', label: '급여 💰' },
    { value: '지원금', label: '지원금 🎁' },
    { value: '투자/부업', label: '투자/부업 📈' },
    { value: '기타', label: '기타 수입 🪙' }
];

const DEFAULT_EXPENSE_CATEGORIES = [
    { value: '쇼핑/카드', label: '쇼핑/카드 💳' },
    { value: '주거/월세', label: '주거/월세 🏠' },
    { value: '보험/세금', label: '보험/세금 🛡️' },
    { value: '식비', label: '식비 🍔' },
    { value: '교통', label: '교통 🚗' },
    { value: '생활비', label: '생활비/기타 🛒' }
];

// Notion 스크린샷 데이터 기반 초기 데이터셋 (사용자 온보딩용)
const INITIAL_DEMO_DATA = {
    "2026-07": {
        carryOver: 560000,
        transactions: [
            { id: "tx-demo-1", type: "income", name: "월급", amount: 2780000, category: "급여", isRecurring: true, date: "2026-07-25" },
            { id: "tx-demo-2", type: "income", name: "'그거' 지원금", amount: 1200000, category: "지원금", isRecurring: false, date: "2026-07-10" },
            { id: "tx-demo-3", type: "expense", name: "카드", amount: 537460, category: "쇼핑/카드", isRecurring: false, date: "2026-07-15" },
            { id: "tx-demo-4", type: "expense", name: "보험", amount: 100000, category: "보험/세금", isRecurring: true, date: "2026-07-20" },
            { id: "tx-demo-5", type: "expense", name: "월세", amount: 450000, category: "주거/월세", isRecurring: true, date: "2026-07-01" },
            { id: "tx-demo-6", type: "expense", name: "최저한도 맞추기", amount: 440000, category: "생활비", isRecurring: false, date: "2026-07-05" }
        ]
    }
};

// State 관리 변수
let appState = {
    currentYear: 2026,
    currentMonth: 7, // 1 ~ 12
    data: {}, // LocalStorage에서 로드됨
    incomeCategories: [],
    expenseCategories: []
};

let categoryManagerState = {
    activeTab: 'expense' // 'expense' or 'income'
};

// ==========================================================================
// 2. 유틸리티 함수 (금액 포맷팅, 한글 변환 등)
// ==========================================================================

// 천 단위 쉼표 포맷팅
function formatCurrency(amount) {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })
        .format(amount)
        .replace('₩', '') + '원';
}

// 숫자를 한글 금액 읽기로 변환 (예: 3980000 -> 삼백구십팔만 원)
function numberToKorean(num) {
    if (num === 0) return '영 원';
    if (isNaN(num)) return '';

    const units = ['', '만', '억', '조'];
    const nums = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    const positions = ['', '십', '백', '천'];
    
    let result = [];
    let unitIdx = 0;
    
    while (num > 0) {
        let chunk = num % 10000;
        num = Math.floor(num / 10000);
        
        if (chunk === 0) {
            unitIdx++;
            continue;
        }
        
        let chunkStr = [];
        let temp = chunk;
        for (let i = 0; i < 4; i++) {
            let digit = temp % 10;
            temp = Math.floor(temp / 10);
            
            if (digit > 0) {
                // 일십, 일백 등에서 '일' 생략 처리 (단, 만/억 단위 앞에선 다르게 적용할 수 있음)
                let numWord = nums[digit];
                if (digit === 1 && i > 0) {
                    numWord = '';
                }
                chunkStr.unshift(numWord + positions[i]);
            }
        }
        
        if (chunkStr.length > 0) {
            result.unshift(chunkStr.join('') + units[unitIdx]);
        }
        unitIdx++;
    }
    
    return result.join(' ') + ' 원';
}

// 이전 달 계산 함수 ("YYYY-MM" 형식 리턴)
function getPrevMonthString(yearMonthStr) {
    const [y, m] = yearMonthStr.split('-').map(Number);
    if (m === 1) {
        return `${y - 1}-12`;
    } else {
        const prevM = m - 1;
        return `${y}-${prevM < 10 ? '0' + prevM : prevM}`;
    }
}

// 다음 달 계산 함수 ("YYYY-MM" 형식 리턴)
function getNextMonthString(yearMonthStr) {
    const [y, m] = yearMonthStr.split('-').map(Number);
    if (m === 12) {
        return `${y + 1}-01`;
    } else {
        const nextM = m + 1;
        return `${y}-${nextM < 10 ? '0' + nextM : nextM}`;
    }
}

// ==========================================================================
// 3. 데이터 동기화 및 LocalStorage 관리
// ==========================================================================

function loadCategories() {
    const storedIncome = localStorage.getItem('storebook_income_categories');
    const storedExpense = localStorage.getItem('storebook_expense_categories');
    
    if (storedIncome) {
        try {
            appState.incomeCategories = JSON.parse(storedIncome);
            if (!Array.isArray(appState.incomeCategories)) throw new Error("Not an array");
        } catch (e) {
            console.error("수입 카테고리 로드 에러:", e);
            appState.incomeCategories = [...DEFAULT_INCOME_CATEGORIES];
            localStorage.setItem('storebook_income_categories', JSON.stringify(appState.incomeCategories));
        }
    } else {
        appState.incomeCategories = [...DEFAULT_INCOME_CATEGORIES];
        localStorage.setItem('storebook_income_categories', JSON.stringify(appState.incomeCategories));
    }
    
    if (storedExpense) {
        try {
            appState.expenseCategories = JSON.parse(storedExpense);
            if (!Array.isArray(appState.expenseCategories)) throw new Error("Not an array");
        } catch (e) {
            console.error("지출 카테고리 로드 에러:", e);
            appState.expenseCategories = [...DEFAULT_EXPENSE_CATEGORIES];
            localStorage.setItem('storebook_expense_categories', JSON.stringify(appState.expenseCategories));
        }
    } else {
        appState.expenseCategories = [...DEFAULT_EXPENSE_CATEGORIES];
        localStorage.setItem('storebook_expense_categories', JSON.stringify(appState.expenseCategories));
    }
}

function saveCategories() {
    localStorage.setItem('storebook_income_categories', JSON.stringify(appState.incomeCategories));
    localStorage.setItem('storebook_expense_categories', JSON.stringify(appState.expenseCategories));
}

function loadLocalData() {
    loadCategories();
    const stored = localStorage.getItem('storebook_data');
    if (stored) {
        try {
            appState.data = JSON.parse(stored);
        } catch (e) {
            console.error("데이터 로드 오류, 데모 데이터를 불러옵니다.", e);
            appState.data = { ...INITIAL_DEMO_DATA };
        }
    } else {
        // 데이터가 없으면 노션 캡처 바탕의 데모 데이터를 초기 적재
        appState.data = { ...INITIAL_DEMO_DATA };
        saveLocalData();
    }
}

function saveLocalData() {
    localStorage.setItem('storebook_data', JSON.stringify(appState.data));
}

// 특정 월의 데이터 가져오기 (없으면 구조 생성)
function getMonthData(year, month) {
    const key = `${year}-${month < 10 ? '0' + month : month}`;
    if (!appState.data[key]) {
        appState.data[key] = {
            carryOver: 0,
            transactions: []
        };
        
        // 이전 달의 최종 잔액이 존재하면 이월 잔액으로 설정
        const prevKey = getPrevMonthString(key);
        if (appState.data[prevKey]) {
            appState.data[key].carryOver = calculateMonthBalance(prevKey);
        }
    }
    return appState.data[key];
}

// 특정 월의 잔액 계산
function calculateMonthBalance(yearMonthKey) {
    const monthData = appState.data[yearMonthKey];
    if (!monthData) return 0;
    
    const carryOver = monthData.carryOver || 0;
    const totalIncome = monthData.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = monthData.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
        
    return carryOver + totalIncome - totalExpense;
}

// ==========================================================================
// 4. UI 렌더링 엔진
// ==========================================================================

function updateUI() {
    const currentMonthKey = `${appState.currentYear}-${appState.currentMonth < 10 ? '0' + appState.currentMonth : appState.currentMonth}`;
    
    // 1. 월 표시 업데이트 및 날짜 한계 지정
    const yearStr = appState.currentYear;
    const monthStr = appState.currentMonth < 10 ? '0' + appState.currentMonth : appState.currentMonth;
    document.getElementById('current-month-display').innerText = `${yearStr}년 ${monthStr}월`;
    
    const dateInput = document.getElementById('entry-date');
    const minDate = `${yearStr}-${monthStr}-01`;
    const lastDay = new Date(appState.currentYear, appState.currentMonth, 0).getDate();
    const maxDate = `${yearStr}-${monthStr}-${lastDay < 10 ? '0' + lastDay : lastDay}`;
    
    dateInput.min = minDate;
    dateInput.max = maxDate;
    
    const currentVal = dateInput.value;
    if (!currentVal || currentVal < minDate || currentVal > maxDate) {
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth() + 1;
        if (todayYear === appState.currentYear && todayMonth === appState.currentMonth) {
            const todayDay = today.getDate();
            dateInput.value = `${todayYear}-${todayMonth < 10 ? '0' + todayMonth : todayMonth}-${todayDay < 10 ? '0' + todayDay : todayDay}`;
        } else {
            dateInput.value = minDate;
        }
    }
    
    // 2. 이월 잔액 동적 계산 및 이월 업데이트
    // 만약 수동 설정된 이월 잔액이 없거나 0일 때, 이전달 데이터가 있으면 이전달의 최종 잔액을 자동으로 가져옵니다.
    const monthData = getMonthData(appState.currentYear, appState.currentMonth);
    const prevKey = getPrevMonthString(currentMonthKey);
    
    if (appState.data[prevKey]) {
        // 자동 이월 흐름 연결
        monthData.carryOver = calculateMonthBalance(prevKey);
    }
    
    const carryOver = monthData.carryOver || 0;
    
    // 이월 잔액 풋터 텍스트 업데이트
    const carryOverFooter = document.getElementById('carry-over-footer');
    if (appState.data[prevKey]) {
        carryOverFooter.innerText = "이전 달에서 자동 이월됨";
    } else {
        carryOverFooter.innerText = "클릭하여 수동 수정 가능";
    }
    
    // 수입 및 지출 합계 연산
    const transactions = monthData.transactions || [];
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    // 최종 예상 잔액
    // 다음달 수입(소득) 개념 = 이월 잔액 + 수입 총액
    const nextMonthIncomeTotal = carryOver + totalIncome;
    const remainingBalance = nextMonthIncomeTotal - totalExpense;
    
    // 요약 영역 DOM 반영
    document.getElementById('carry-over-balance').innerText = formatCurrency(carryOver);
    document.getElementById('total-income').innerText = formatCurrency(totalIncome);
    document.getElementById('total-expense').innerText = formatCurrency(totalExpense);
    document.getElementById('remaining-balance').innerText = formatCurrency(remainingBalance);
    
    // 수입 상세 안내
    document.getElementById('income-comparison').innerText = `이월 포함 소득: ${formatCurrency(nextMonthIncomeTotal)}`;
    
    // 남은 잔액 퍼센트 및 스타일
    const balanceCard = document.querySelector('.summary-card.balance');
    const balanceFooter = document.getElementById('balance-percentage');
    if (nextMonthIncomeTotal > 0) {
        const percent = Math.max(0, Math.round((remainingBalance / nextMonthIncomeTotal) * 100));
        balanceFooter.innerText = `총 수입의 ${percent}% 남음`;
        
        // 잔고 경고 표시
        if (percent < 15) {
            balanceCard.style.borderColor = 'var(--color-expense)';
            balanceFooter.style.color = 'var(--color-expense)';
        } else {
            balanceCard.style.borderColor = '';
            balanceFooter.style.color = '';
        }
    } else {
        balanceFooter.innerText = `수입 내역 없음`;
        balanceCard.style.borderColor = '';
        balanceFooter.style.color = '';
    }

    // 3. 예산 진행 바 업데이트 (수입 대비 지출 비율)
    const progressBar = document.getElementById('budget-progress-bar');
    const progressPercentText = document.getElementById('progress-percentage');
    
    if (nextMonthIncomeTotal > 0) {
        const ratio = Math.min(100, Math.round((totalExpense / nextMonthIncomeTotal) * 100));
        progressBar.style.width = `${ratio}%`;
        progressPercentText.innerText = `${ratio}%`;
        
        if (ratio >= 90) {
            progressBar.style.background = 'var(--color-expense)';
        } else if (ratio >= 60) {
            progressBar.style.background = 'var(--color-primary)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, var(--color-income) 0%, var(--color-primary) 100%)';
        }
    } else {
        progressBar.style.width = `0%`;
        progressPercentText.innerText = `0%`;
    }

    // 4. 내역 리스트 렌더링
    renderLists(transactions);
    
    // Lucide 아이콘 다시 그리기
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// 수입/지출 리스트 상세 렌더링 (날짜별 그룹화 및 정렬)
function renderLists(transactions) {
    const incomeList = document.getElementById('income-list');
    const expenseList = document.getElementById('expense-list');
    
    // 기존 내역 비우기
    incomeList.innerHTML = '';
    expenseList.innerHTML = '';
    
    const activeFilter = document.querySelector('.filter-btn.active').id;
    
    const incomeTx = transactions.filter(t => t.type === 'income');
    const expenseTx = transactions.filter(t => t.type === 'expense');
    
    // 필터 필터링 체크 및 렌더링
    const showIncome = activeFilter === 'filter-all' || activeFilter === 'filter-income';
    const showExpense = activeFilter === 'filter-all' || activeFilter === 'filter-expense';
    
    // 날짜별 그룹화 헬퍼 함수
    const groupByDate = (txs) => {
        const groups = {};
        txs.forEach(tx => {
            const dateVal = tx.date || `${appState.currentYear}-${appState.currentMonth < 10 ? '0' + appState.currentMonth : appState.currentMonth}-01`;
            if (!groups[dateVal]) groups[dateVal] = [];
            groups[dateVal].push(tx);
        });
        return groups;
    };
    
    // 그룹별 렌더링 헬퍼 함수
    const renderGroups = (container, groupedTxs, type) => {
        // 날짜 오름차순 정렬
        const sortedDates = Object.keys(groupedTxs).sort((a, b) => new Date(a) - new Date(b));
        
        sortedDates.forEach(dateStr => {
            const dateObj = new Date(dateStr);
            const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
            const dayName = daysOfWeek[dateObj.getDay()];
            const formattedDateText = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일 (${dayName})`;
            
            // 해당 날짜의 총합 계산
            const sum = groupedTxs[dateStr].reduce((s, t) => s + t.amount, 0);
            
            const dateGroupDiv = document.createElement('div');
            dateGroupDiv.className = 'date-group';
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'date-group-header';
            headerDiv.innerHTML = `
                <span class="date-text"><i data-lucide="calendar" class="sub-icon"></i> ${formattedDateText}</span>
                <span class="date-sum">${type === 'income' ? '+' : '-'}${formatCurrency(sum)}</span>
            `;
            dateGroupDiv.appendChild(headerDiv);
            
            // 거래 아이템 DOM 추가
            groupedTxs[dateStr].forEach(tx => {
                dateGroupDiv.appendChild(createTransactionDOM(tx));
            });
            
            container.appendChild(dateGroupDiv);
        });
    };
    
    // 수입 목록 그리기
    if (showIncome && incomeTx.length > 0) {
        const grouped = groupByDate(incomeTx);
        renderGroups(incomeList, grouped, 'income');
    } else {
        incomeList.innerHTML = `<li class="empty-list-placeholder">수입 내역이 없습니다.</li>`;
    }
    
    // 지출 목록 그리기
    if (showExpense && expenseTx.length > 0) {
        const grouped = groupByDate(expenseTx);
        renderGroups(expenseList, grouped, 'expense');
    } else {
        expenseList.innerHTML = `<li class="empty-list-placeholder">지출 내역이 없습니다.</li>`;
    }
}

// 각 항목 DOM 구조 생성
function createTransactionDOM(tx) {
    const li = document.createElement('li');
    li.className = 'list-item';
    li.dataset.id = tx.id;
    
    // 카테고리 매핑 레이블 구하기
    const categoryConfig = (tx.type === 'income' ? appState.incomeCategories : appState.expenseCategories)
        .find(c => c.value === tx.category);
    const categoryLabel = categoryConfig ? categoryConfig.label : tx.category;
    
    li.innerHTML = `
        <div class="item-left">
            <div class="item-meta">
                <span class="item-name" title="${tx.name}">${tx.name}</span>
                ${tx.isRecurring ? `
                    <span class="recurring-badge">
                        <i data-lucide="repeat"></i>고정
                    </span>
                ` : ''}
            </div>
            <span class="item-category">${categoryLabel}</span>
        </div>
        <div class="item-right">
            <span class="item-amount type-${tx.type}">
                ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
            </span>
            <button class="delete-item-btn" aria-label="삭제">
                <i data-lucide="trash-2"></i>
            </button>
        </div>
    `;
    
    // 삭제 버튼 클릭 리스너 연결
    li.querySelector('.delete-item-btn').addEventListener('click', () => {
        deleteTransaction(tx.id);
    });
    
    return li;
}

// ==========================================================================
// 5. 기능 액션 처리 (추가, 삭제, 달 이동, 카테고리 로드 등)
// ==========================================================================

// 카테고리 폼 셀렉트 박스 세팅
function populateCategories(type) {
    const categorySelect = document.getElementById('entry-category');
    categorySelect.innerHTML = '';
    
    const categories = type === 'income' ? appState.incomeCategories : appState.expenseCategories;
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.value;
        option.text = cat.label;
        categorySelect.appendChild(option);
    });
}

// 수입/지출 탭 전환
function switchFormTab(type) {
    const tabExpense = document.getElementById('tab-expense');
    const tabIncome = document.getElementById('tab-income');
    const entryTypeInput = document.getElementById('entry-type');
    const submitBtnText = document.getElementById('submit-btn-text');
    const submitBtn = document.getElementById('submit-entry-btn');
    
    entryTypeInput.value = type;
    populateCategories(type);
    
    if (type === 'expense') {
        tabExpense.classList.add('active');
        tabIncome.classList.remove('active');
        submitBtnText.innerText = '지출 추가하기';
        submitBtn.style.background = 'linear-gradient(135deg, var(--color-expense) 0%, hsl(340, 80% ,50%) 100%)';
        submitBtn.style.boxShadow = '0 4px 15px var(--color-expense-glow)';
    } else {
        tabExpense.classList.remove('active');
        tabIncome.classList.add('active');
        submitBtnText.innerText = '수입 추가하기';
        submitBtn.style.background = 'linear-gradient(135deg, var(--color-income) 0%, hsl(160, 80%, 40%) 100%)';
        submitBtn.style.boxShadow = '0 4px 15px var(--color-income-glow)';
    }
}

// 금액 실시간 입력 처리 (포맷팅 및 한글 안내)
function handleAmountInput(e) {
    let value = e.target.value;
    
    // 숫자 이외 문자 모두 제거
    value = value.replace(/[^0-9]/g, '');
    
    if (value === '') {
        e.target.value = '';
        document.getElementById('amount-korean-word').innerText = '영 원';
        return;
    }
    
    const numberVal = parseInt(value, 10);
    e.target.value = numberVal.toLocaleString('ko-KR');
    
    // 한글 음독 가이드
    document.getElementById('amount-korean-word').innerText = numberToKorean(numberVal);
}

// 새로운 거래 항목 추가
function handleFormSubmit(e) {
    e.preventDefault();
    
    const type = document.getElementById('entry-type').value;
    const dateInput = document.getElementById('entry-date');
    const nameInput = document.getElementById('entry-name');
    const amountInput = document.getElementById('entry-amount');
    const categorySelect = document.getElementById('entry-category');
    const isRecurringCheckbox = document.getElementById('entry-is-recurring');
    
    const rawAmount = amountInput.value.replace(/,/g, '');
    const amount = parseInt(rawAmount, 10);
    
    if (!nameInput.value.trim() || isNaN(amount) || amount <= 0 || !dateInput.value) {
        alert("올바른 날짜, 항목 이름, 금액을 입력해 주세요.");
        return;
    }
    
    const newTx = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: type,
        name: nameInput.value.trim(),
        amount: amount,
        category: categorySelect.value,
        isRecurring: isRecurringCheckbox.checked,
        date: dateInput.value
    };
    
    const monthData = getMonthData(appState.currentYear, appState.currentMonth);
    monthData.transactions.push(newTx);
    
    // 로컬 데이터 저장 및 갱신
    saveLocalData();
    updateUI();
    
    // 폼 초기화 (날짜, 타입 탭, 카테고리는 유지)
    nameInput.value = '';
    amountInput.value = '';
    isRecurringCheckbox.checked = false;
    document.getElementById('amount-korean-word').innerText = '영 원';
}

// 거래 항목 삭제
function deleteTransaction(id) {
    const monthData = getMonthData(appState.currentYear, appState.currentMonth);
    const itemIndex = monthData.transactions.findIndex(t => t.id === id);
    
    if (itemIndex > -1) {
        // 리스트 애니메이션 효과 후 삭제 처리
        const domEl = document.querySelector(`.list-item[data-id="${id}"]`);
        if (domEl) {
            domEl.style.animation = 'itemRemove var(--transition-normal) forwards';
            domEl.addEventListener('animationend', () => {
                monthData.transactions.splice(itemIndex, 1);
                saveLocalData();
                updateUI();
            });
        } else {
            monthData.transactions.splice(itemIndex, 1);
            saveLocalData();
            updateUI();
        }
}

// 카테고리 관리자 화면 렌더링
function renderCategoryManager() {
    const list = document.getElementById('category-list');
    if (!list) return;
    list.innerHTML = '';
    
    const categories = categoryManagerState.activeTab === 'expense' 
        ? appState.expenseCategories 
        : appState.incomeCategories;
        
    categories.forEach(cat => {
        const li = document.createElement('li');
        li.className = 'mini-category-item';
        li.innerHTML = `
            <span>${cat.label}</span>
            <button class="delete-cat-btn" aria-label="삭제">
                <i data-lucide="x"></i>
            </button>
        `;
        
        li.querySelector('.delete-cat-btn').addEventListener('click', () => {
            deleteCategory(cat.value);
        });
        
        list.appendChild(li);
    });
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// 카테고리 삭제
function deleteCategory(value) {
    if (categoryManagerState.activeTab === 'expense') {
        appState.expenseCategories = appState.expenseCategories.filter(c => c.value !== value);
    } else {
        appState.incomeCategories = appState.incomeCategories.filter(c => c.value !== value);
    }
    saveCategories();
    
    // 지출/수입 등록용 폼 셀렉트 박스 갱신
    const currentFormType = document.getElementById('entry-type').value;
    populateCategories(currentFormType);
    
    renderCategoryManager();
    updateUI();
}

// 카테고리 추가
function addCategory(label) {
    const emojiRegex = /[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g;
    const value = label.trim().replace(emojiRegex, '').trim() || 'cat-' + Date.now();
    
    const newCat = { value: value, label: label.trim() };
    
    if (categoryManagerState.activeTab === 'expense') {
        if (appState.expenseCategories.some(c => c.label === label.trim() || c.value === value)) {
            alert("이미 존재하는 카테고리 이름 또는 값입니다.");
            return;
        }
        appState.expenseCategories.push(newCat);
    } else {
        if (appState.incomeCategories.some(c => c.label === label.trim() || c.value === value)) {
            alert("이미 존재하는 카테고리 이름 또는 값입니다.");
            return;
        }
        appState.incomeCategories.push(newCat);
    }
    saveCategories();
    
    // 지출/수입 등록용 폼 셀렉트 박스 갱신
    const currentFormType = document.getElementById('entry-type').value;
    populateCategories(currentFormType);
    
    renderCategoryManager();
    updateUI();
}

// ==========================================================================
// 6. 데이터 백업 관리 (Export / Import / Reset)
// ==========================================================================

// JSON 백업 파일 저장
function exportData() {
    const dataStr = JSON.stringify(appState.data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const today = new Date().toISOString().slice(0, 10);
    const exportFileDefaultName = `storebook_backup_${today}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// JSON 백업 파일 불러오기
function importData(e) {
    const fileReader = new FileReader();
    fileReader.onload = function(event) {
        try {
            const parsedData = JSON.parse(event.target.result);
            
            // 간단 유효성 검사
            if (typeof parsedData === 'object' && parsedData !== null) {
                if (confirm("백업 데이터를 복원하시겠습니까? 기존 저장된 가계부 데이터가 덮어씌워집니다.")) {
                    appState.data = parsedData;
                    saveLocalData();
                    updateUI();
                    alert("데이터 복원이 완료되었습니다.");
                }
            } else {
                alert("올바르지 않은 백업 파일 형식입니다.");
            }
        } catch (error) {
            alert("백업 파일을 읽는 중 오류가 발생했습니다.");
        }
    };
    if (e.target.files[0]) {
        fileReader.readAsText(e.target.files[0]);
    }
}

// 전체 데이터 리셋
function clearAllData() {
    if (confirm("정말로 모든 가계부 데이터를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
        localStorage.removeItem('storebook_data');
        appState.data = { ...INITIAL_DEMO_DATA };
        saveLocalData();
        updateUI();
        alert("가계부 데이터가 초기 설정으로 초기화되었습니다.");
    }
}

// ==========================================================================
// 7. 이벤트 리스너 등록 & 최초 초기화 실행
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. 기초 설정 로드
    const now = new Date();
    // 데모가 2026년 7월로 구성되어 있으므로, 초기 뷰를 데모 데이터가 풍부한 2026-07로 고정
    appState.currentYear = 2026;
    appState.currentMonth = 7;
    
    loadLocalData();
    populateCategories('expense'); // 기본 지출 추가 탭
    
    // 2. 이벤트 리스너 연결
    
    // 월 이동 네비게이션
    document.getElementById('prev-month-btn').addEventListener('click', () => {
        if (appState.currentMonth === 1) {
            appState.currentMonth = 12;
            appState.currentYear -= 1;
        } else {
            appState.currentMonth -= 1;
        }
        updateUI();
    });
    
    document.getElementById('next-month-btn').addEventListener('click', () => {
        if (appState.currentMonth === 12) {
            appState.currentMonth = 1;
            appState.currentYear += 1;
        } else {
            appState.currentMonth += 1;
        }
        updateUI();
    });
    
    // 입력 폼 탭 스위치
    document.getElementById('tab-expense').addEventListener('click', () => switchFormTab('expense'));
    document.getElementById('tab-income').addEventListener('click', () => switchFormTab('income'));
    
    // 금액 포맷팅 및 가이드
    document.getElementById('entry-amount').addEventListener('input', handleAmountInput);
    
    // 폼 제출
    document.getElementById('transaction-form').addEventListener('submit', handleFormSubmit);
    
    // 데이터 필터 버튼
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateUI();
        });
    });
    
    // 시스템 관리 기능 연결
    document.getElementById('export-btn').addEventListener('click', exportData);
    document.getElementById('import-file-input').addEventListener('change', importData);
    document.getElementById('clear-all-btn').addEventListener('click', clearAllData);
    
    // 이월 잔액 카드 클릭 시 인라인 입력창 전환 및 수정
    const carryOverCard = document.getElementById('carry-over-card');
    const carryOverValue = document.getElementById('carry-over-balance');
    
    carryOverCard.addEventListener('click', () => {
        if (carryOverCard.classList.contains('editing')) return;
        
        carryOverCard.classList.add('editing');
        const monthData = getMonthData(appState.currentYear, appState.currentMonth);
        const rawVal = monthData.carryOver || 0;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'carry-over-inline-input';
        input.value = rawVal.toLocaleString('ko-KR');
        
        const originalText = carryOverValue.innerText;
        carryOverValue.innerHTML = '';
        carryOverValue.appendChild(input);
        input.focus();
        input.select();
        
        // 클릭 이벤트 버블링 방지 (input 클릭 시 카드가 다시 click 이벤트 받는 것 방지)
        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9]/g, '');
            if (value === '') {
                e.target.value = '';
            } else {
                e.target.value = parseInt(value, 10).toLocaleString('ko-KR');
            }
        });
        
        const saveValue = () => {
            let rawVal = input.value.replace(/,/g, '');
            let newVal = parseInt(rawVal, 10);
            if (isNaN(newVal) || newVal < 0) newVal = 0;
            
            monthData.carryOver = newVal;
            saveLocalData();
            carryOverCard.classList.remove('editing');
            updateUI();
        };
        
        input.addEventListener('blur', saveValue);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            } else if (e.key === 'Escape') {
                carryOverCard.classList.remove('editing');
                carryOverValue.innerText = originalText;
                updateUI();
            }
        });
    });
    
    // 카테고리 관리 탭 전환 및 추가/삭제 기능 연결
    const catTabExpense = document.getElementById('cat-tab-expense');
    const catTabIncome = document.getElementById('cat-tab-income');
    const addCatForm = document.getElementById('add-category-form');
    const newCatInput = document.getElementById('new-category-name');
    
    catTabExpense.addEventListener('click', () => {
        categoryManagerState.activeTab = 'expense';
        catTabExpense.classList.add('active');
        catTabIncome.classList.remove('active');
        newCatInput.placeholder = "새 지출 카테고리 (예: 도서 📚)";
        renderCategoryManager();
    });
    
    catTabIncome.addEventListener('click', () => {
        categoryManagerState.activeTab = 'income';
        catTabIncome.classList.add('active');
        catTabExpense.classList.remove('active');
        newCatInput.placeholder = "새 수입 카테고리 (예: 보너스 🎁)";
        renderCategoryManager();
    });
    
    addCatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newLabel = newCatInput.value.trim();
        if (newLabel) {
            addCategory(newLabel);
            newCatInput.value = '';
        }
    });
    
    // 카테고리 관리자 초기 로드
    renderCategoryManager();
    
    // 3. 최초 화면 렌더링
    updateUI();
});
