/**
 * 考前衝剌系統 - 每日複習計畫表模組
 * 負責處理複習計畫的新增、查詢、修改、刪除和時間管理
 */

// 複習計畫管理器
const ReviewPlanManager = (function () {
    // 私有變數
    let plans = [];
    const STORAGE_KEY = 'daily_review_plans';
    const JSON_FILE_PATH = '/sd/每日複習計畫表.json.txt';

    // 初始化函數
    function init() {
        loadFromCookies();
        setupEventListeners();
        updatePlanDisplay();
        console.log('複習計畫模組初始化完成');
    }

    // 從Cookies載入資料
    function loadFromCookies() {
        try {
            const storedData = getCookie(STORAGE_KEY);
            if (storedData) {
                plans = JSON.parse(storedData);
                console.log(`已從Cookies載入 ${plans.length} 筆複習計畫`);
            } else {
                console.log('未找到本地複習計畫，使用空記錄初始化');
                plans = [];
            }
        } catch (error) {
            console.error('載入複習計畫時發生錯誤:', error);
            plans = [];
        }
    }

    // 保存資料到Cookies
    function saveToCookies() {
        try {
            const jsonData = JSON.stringify(plans);
            setCookie(STORAGE_KEY, jsonData, 365); // 保存一年
            console.log('複習計畫已保存到Cookies');

            // 同時嘗試保存到文件
            saveToJsonFile(jsonData);
        } catch (error) {
            console.error('保存複習計畫時發生錯誤:', error);
        }
    }

    // 保存到JSON文件 (需要伺服器端支援)
    function saveToJsonFile(jsonData) {
        // 這部分需要伺服器端支援，此處使用簡單的Ajax請求示範
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/savePlanData', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        console.log('複習計畫已保存到文件');
                    } else {
                        console.error('保存複習計畫到文件失敗:', xhr.statusText);
                    }
                }
            };
            xhr.send(JSON.stringify({
                path: JSON_FILE_PATH,
                data: jsonData
            }));
        } catch (error) {
            console.error('嘗試保存到文件時發生錯誤:', error);
        }
    }

    // 設置事件監聽器
    function setupEventListeners() {
        // 當使用DOM操作時實現
        const addPlanForm = document.getElementById('add-plan-form');
        if (addPlanForm) {
            addPlanForm.addEventListener('submit', handleAddPlanSubmit);
        }

        // 計劃拖拽排序 (需要jQuery UI)
        const planList = document.getElementById('plan-list');
        if (planList && window.jQuery && jQuery.ui) {
            jQuery(planList).sortable({
                update: function (event, ui) {
                    updatePlanOrder();
                }
            });
        }
    }

    // 處理新增計畫表單提交
    function handleAddPlanSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const newPlan = {
            subject: form.subject.value,
            month: parseInt(form.month.value, 10),
            date: parseInt(form.date.value, 10),
            main_item: form.main_item.value,
            sub_item: form.sub_item.value,
            notes: form.notes.value,
            status: 'pending', // 預設狀態：待完成
            estimated_time: parseInt(form.estimated_time.value, 10) || 30,
            actual_time: 0
        };

        // 驗證並添加計劃
        if (validatePlan(newPlan)) {
            addPlan(newPlan);
            form.reset();
            updatePlanDisplay();
        }
    }

    // 更新計劃顯示
    function updatePlanDisplay() {
        const planList = document.getElementById('plan-list');
        if (!planList) return;

        // 按日期排序計劃
        const sortedPlans = [...plans].sort((a, b) => {
            if (a.month !== b.month) return a.month - b.month;
            return a.date - b.date;
        });

        // 清空並重新填充列表
        planList.innerHTML = '';

        if (sortedPlans.length === 0) {
            planList.innerHTML = '<li class="no-plans">尚無複習計畫，請添加新計畫</li>';
            return;
        }

        sortedPlans.forEach(plan => {
            const li = document.createElement('li');
            li.dataset.id = plan.id;
            li.className = `plan-item status-${plan.status}`;

            const dateStr = `${plan.month}月${plan.date}日`;
            const statusClass = plan.status === 'completed' ? 'completed' :
                (plan.status === 'in-progress' ? 'in-progress' : 'pending');

            li.innerHTML = `
                <div class="plan-date">${dateStr}</div>
                <div class="plan-subject">${plan.subject}</div>
                <div class="plan-content">
                    <div class="plan-main-item">${plan.main_item}</div>
                    <div class="plan-sub-item">${plan.sub_item || ''}</div>
                </div>
                <div class="plan-time">預計: ${plan.estimated_time}分鐘</div>
                <div class="plan-status ${statusClass}">${getStatusText(plan.status)}</div>
                <div class="plan-actions">
                    <button class="btn-edit" data-id="${plan.id}">編輯</button>
                    <button class="btn-delete" data-id="${plan.id}">刪除</button>
                    <button class="btn-complete" data-id="${plan.id}" ${plan.status === 'completed' ? 'hidden' : ''}>
                        ${plan.status === 'in-progress' ? '完成' : '開始'}
                    </button>
                </div>
            `;

            // 添加點擊事件
            const editBtn = li.querySelector('.btn-edit');
            const deleteBtn = li.querySelector('.btn-delete');
            const completeBtn = li.querySelector('.btn-complete');

            if (editBtn) editBtn.addEventListener('click', () => editPlan(plan.id));
            if (deleteBtn) deleteBtn.addEventListener('click', () => confirmDeletePlan(plan.id));
            if (completeBtn) completeBtn.addEventListener('click', () => updatePlanStatus(plan.id));

            planList.appendChild(li);
        });
    }

    // 取得狀態文字
    function getStatusText(status) {
        switch (status) {
            case 'completed': return '已完成';
            case 'in-progress': return '進行中';
            case 'pending': return '待開始';
            default: return '未知';
        }
    }

    // 新增複習計畫
    function addPlan(plan) {
        // 生成唯一ID
        plan.id = generateUniqueId();
        plan.created_at = new Date().toISOString();

        plans.push(plan);
        saveToCookies();
        return true;
    }

    // 更新複習計畫
    function updatePlan(id, updatedPlan) {
        const index = plans.findIndex(plan => plan.id === id);
        if (index === -1) {
            console.error(`未找到ID為 ${id} 的複習計畫`);
            return false;
        }

        // 保留原始ID和創建時間
        updatedPlan.id = id;
        updatedPlan.created_at = plans[index].created_at;
        updatedPlan.updated_at = new Date().toISOString();

        plans[index] = updatedPlan;
        saveToCookies();
        updatePlanDisplay();
        return true;
    }

    // 刪除複習計畫
    function deletePlan(id) {
        const initialLength = plans.length;
        plans = plans.filter(plan => plan.id !== id);

        if (plans.length === initialLength) {
            console.error(`未找到ID為 ${id} 的複習計畫`);
            return false;
        }

        saveToCookies();
        updatePlanDisplay();
        return true;
    }

    // 確認刪除計畫
    function confirmDeletePlan(id) {
        if (confirm('確定要刪除此複習計畫嗎？此操作無法撤銷。')) {
            deletePlan(id);
        }
    }

    // 編輯計畫
    function editPlan(id) {
        const plan = plans.find(p => p.id === id);
        if (!plan) {
            console.error(`未找到ID為 ${id} 的複習計畫`);
            return;
        }

        // 如果有編輯表單，填充數據
        const editForm = document.getElementById('edit-plan-form');
        if (editForm) {
            editForm.elements.plan_id.value = plan.id;
            editForm.elements.subject.value = plan.subject;
            editForm.elements.month.value = plan.month;
            editForm.elements.date.value = plan.date;
            editForm.elements.main_item.value = plan.main_item;
            editForm.elements.sub_item.value = plan.sub_item || '';
            editForm.elements.notes.value = plan.notes || '';
            editForm.elements.estimated_time.value = plan.estimated_time;

            // 顯示編輯表單
            const editModal = document.getElementById('edit-plan-modal');
            if (editModal) {
                editModal.style.display = 'block';
            }
        } else {
            // 如果沒有編輯表單，可以通過其他方式實現，如提示用戶
            console.warn('未找到編輯表單，請確保頁面包含ID為edit-plan-form的表單');
        }
    }

    // 更新計畫順序 (適用於拖拽排序)
    function updatePlanOrder() {
        const planList = document.getElementById('plan-list');
        if (!planList) return;

        const items = planList.querySelectorAll('li.plan-item');
        const newOrder = [];

        items.forEach(item => {
            const id = item.dataset.id;
            const plan = plans.find(p => p.id === id);
            if (plan) {
                newOrder.push(plan);
            }
        });

        // 如果所有計劃都被找到，更新順序
        if (newOrder.length === plans.length) {
            plans = newOrder;
            saveToCookies();
        }
    }

    // 更新計畫狀態
    function updatePlanStatus(id) {
        const plan = plans.find(p => p.id === id);
        if (!plan) {
            console.error(`未找到ID為 ${id} 的複習計畫`);
            return;
        }

        // 狀態轉換: 待開始 -> 進行中 -> 已完成
        if (plan.status === 'pending') {
            plan.status = 'in-progress';
            plan.start_time = new Date().toISOString();
        } else if (plan.status === 'in-progress') {
            plan.status = 'completed';
            plan.end_time = new Date().toISOString();

            // 計算實際花費時間（分鐘）
            if (plan.start_time) {
                const start = new Date(plan.start_time);
                const end = new Date(plan.end_time);
                plan.actual_time = Math.round((end - start) / (1000 * 60));
            }
        }

        saveToCookies();
        updatePlanDisplay();
    }

    // 獲取所有複習計畫
    function getAllPlans() {
        return [...plans]; // 返回副本，避免直接修改原數組
    }

    // 依條件過濾複習計畫
    function filterPlans(options = {}) {
        return plans.filter(plan => {
            // 按科目過濾
            if (options.subject && plan.subject !== options.subject) {
                return false;
            }

            // 按月份過濾
            if (options.month && plan.month !== options.month) {
                return false;
            }

            // 按日期過濾
            if (options.date && plan.date !== options.date) {
                return false;
            }

            // 按狀態過濾
            if (options.status && plan.status !== options.status) {
                return false;
            }

            // 按主項次過濾
            if (options.mainItem && !plan.main_item.includes(options.mainItem)) {
                return false;
            }

            return true;
        });
    }

    // 獲取特定日期的複習計畫
    function getPlansForDate(month, date) {
        return plans.filter(plan => plan.month === month && plan.date === date);
    }

    // 獲取今日複習計畫
    function getTodayPlans() {
        const today = new Date();
        const month = today.getMonth() + 1; // getMonth() 從0開始
        const date = today.getDate();

        return getPlansForDate(month, date);
    }

    // 生成智能複習建議
    function generateReviewSuggestions() {
        // 獲取錯題相關數據
        let wrongQuestions = [];
        if (window.wrongQuestionManager) {
            wrongQuestions = window.wrongQuestionManager.getRecentWrongQuestions(20);
        }

        // 按科目分組錯題
        const subjectGroups = {};
        wrongQuestions.forEach(q => {
            if (!subjectGroups[q.subject]) {
                subjectGroups[q.subject] = [];
            }
            subjectGroups[q.subject].push(q);
        });

        // 生成建議的複習計畫
        const suggestions = [];

        // 錯題多的科目優先安排
        const sortedSubjects = Object.keys(subjectGroups).sort((a, b) =>
            subjectGroups[b].length - subjectGroups[a].length
        );

        // 生成未來7天的計劃建議
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + i);

            const month = targetDate.getMonth() + 1;
            const date = targetDate.getDate();

            // 每天安排1-2個科目複習
            const maxSubjectsPerDay = i === 0 ? 1 : 2; // 今天少安排一點，避免過度負擔
            const daySubjects = sortedSubjects.slice(i % sortedSubjects.length, (i % sortedSubjects.length) + maxSubjectsPerDay);

            daySubjects.forEach(subject => {
                // 找出該科目的錯題知識點
                const topics = new Set();
                subjectGroups[subject].forEach(q => {
                    if (q.topic) topics.add(q.topic);
                });

                const mainItem = Array.from(topics).length > 0 ?
                    `${subject}重點知識點複習` :
                    `${subject}綜合複習`;

                const subItems = Array.from(topics).length > 0 ?
                    Array.from(topics).join('、') :
                    '整體複習';

                suggestions.push({
                    subject: subject,
                    month: month,
                    date: date,
                    main_item: mainItem,
                    sub_item: subItems,
                    notes: `根據錯題分析自動生成的複習建議`,
                    status: 'pending',
                    estimated_time: 45,
                    is_suggestion: true
                });
            });
        }

        return suggestions;
    }

    // 驗證計畫格式
    function validatePlan(plan) {
        // 必填字段檢查
        const requiredFields = ['subject', 'month', 'date', 'main_item'];
        for (const field of requiredFields) {
            if (plan[field] === undefined || plan[field] === null || plan[field] === '') {
                console.error(`複習計畫缺少必填字段: ${field}`);
                return false;
            }
        }

        // 日期格式檢查
        if (isNaN(plan.month) || plan.month < 1 || plan.month > 12) {
            console.error('月份必須為1-12的整數');
            return false;
        }

        if (isNaN(plan.date) || plan.date < 1 || plan.date > 31) {
            console.error('日期必須為1-31的整數');
            return false;
        }

        // 檢查日期是否有效
        const daysInMonth = new Date(new Date().getFullYear(), plan.month, 0).getDate();
        if (plan.date > daysInMonth) {
            console.error(`${plan.month}月只有${daysInMonth}天`);
            return false;
        }

        return true;
    }

    // 生成唯一ID
    function generateUniqueId() {
        return 'plan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 設置Cookie
    function setCookie(name, value, days) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + expires + '; path=/';
    }

    // 獲取Cookie
    function getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // 公開API
    return {
        init,
        addPlan,
        updatePlan,
        deletePlan,
        getAllPlans,
        filterPlans,
        getPlansForDate,
        getTodayPlans,
        generateReviewSuggestions,
        updatePlanDisplay
    };
})();

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function () {
    ReviewPlanManager.init();

    // 將實例附加到全局對象，方便其他模塊訪問
    window.planManager = ReviewPlanManager;
});
