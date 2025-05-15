/**
 * 考前衝剌系統 - 錯題整理管理模組
 * 負責錯題的收集、管理、分析和複習功能
 */

// 錯題管理器
const WrongQuestionManager = (function () {
    // 私有變數
    let wrongQuestions = [];
    const STORAGE_KEY = 'wrong_questions_data';
    const JSON_FILE_PATH = '/sd/錯題整理.json.txt';

    // 掌握狀態常量
    const MASTERY_STATUS = {
        NOT_REVIEWED: 'not_reviewed',  // 未複習
        REVIEWING: 'reviewing',        // 複習中
        MASTERED: 'mastered'           // 已掌握
    };

    // 初始化函數
    function init() {
        loadFromStorage();
        setupEventListeners();
        updateWrongQuestionsList();
        console.log('錯題整理模組初始化完成');
    }

    // 從存儲載入錯題
    function loadFromStorage() {
        try {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                wrongQuestions = JSON.parse(storedData);
                console.log(`已從localStorage載入 ${wrongQuestions.length} 筆錯題記錄`);
            } else {
                console.log('未找到本地錯題記錄，使用空記錄初始化');
                wrongQuestions = [];
            }
        } catch (error) {
            console.error('載入錯題記錄時發生錯誤:', error);
            wrongQuestions = [];
        }
    }

    // 保存錯題到存儲
    function saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(wrongQuestions));
            console.log('錯題記錄已保存到localStorage');

            // 同時保存到文件
            saveToJsonFile();
        } catch (error) {
            console.error('保存錯題記錄時發生錯誤:', error);
        }
    }

    // 保存到JSON文件 (需要伺服器端支援)
    function saveToJsonFile() {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/saveWrongQuestionData', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        console.log('錯題記錄已保存到文件');
                    } else {
                        console.error('保存錯題記錄到文件失敗:', xhr.statusText);
                    }
                }
            };
            xhr.send(JSON.stringify({
                path: JSON_FILE_PATH,
                data: JSON.stringify(wrongQuestions)
            }));
        } catch (error) {
            console.error('嘗試保存到文件時發生錯誤:', error);
        }
    }

    // 設置事件監聽器
    function setupEventListeners() {
        // 添加錯題表單提交監聽
        const addWrongQuestionForm = document.getElementById('add-wrong-question-form');
        if (addWrongQuestionForm) {
            addWrongQuestionForm.addEventListener('submit', handleAddWrongQuestionSubmit);
        }

        // 排序和篩選控件監聽
        const sortSelector = document.getElementById('wrong-question-sort');
        if (sortSelector) {
            sortSelector.addEventListener('change', updateWrongQuestionsList);
        }

        const filterControls = document.querySelectorAll('.wrong-question-filter');
        filterControls.forEach(control => {
            control.addEventListener('change', updateWrongQuestionsList);
        });
    }

    // 處理添加錯題表單提交
    function handleAddWrongQuestionSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const newWrongQuestion = {
            question_id: form.question_id ? form.question_id.value : null,
            academic_year: form.academic_year.value,
            subject: form.subject.value,
            date: form.date.value || new Date().toISOString().split('T')[0],
            content: form.content.value,
            correct_answer: form.correct_answer.value,
            user_answer: form.user_answer.value,
            error_reason: form.error_reason.value,
            correct_concept: form.correct_concept.value,
            mastery_status: MASTERY_STATUS.NOT_REVIEWED,
            review_count: 0,
            last_review_date: null,
            correct_rate: 0,
            tags: form.tags.value.split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        if (addWrongQuestion(newWrongQuestion)) {
            form.reset();
            alert('錯題添加成功！');
            updateWrongQuestionsList();
        }
    }

    // 更新錯題列表顯示
    function updateWrongQuestionsList() {
        const wrongQuestionsList = document.getElementById('wrong-questions-list');
        if (!wrongQuestionsList) return;

        // 獲取排序和篩選條件
        const sortSelector = document.getElementById('wrong-question-sort');
        const sortBy = sortSelector ? sortSelector.value : 'date-desc';

        // 過濾條件
        const filters = {
            subject: document.getElementById('filter-subject') ? document.getElementById('filter-subject').value : null,
            academicYear: document.getElementById('filter-academic-year') ? document.getElementById('filter-academic-year').value : null,
            masteryStatus: document.getElementById('filter-mastery') ? document.getElementById('filter-mastery').value : null,
            searchTerm: document.getElementById('search-wrong-questions') ? document.getElementById('search-wrong-questions').value : null
        };

        // 過濾和排序錯題
        let filteredQuestions = filterWrongQuestions(filters);
        filteredQuestions = sortWrongQuestions(filteredQuestions, sortBy);

        // 清空列表
        wrongQuestionsList.innerHTML = '';

        if (filteredQuestions.length === 0) {
            wrongQuestionsList.innerHTML = '<tr><td colspan="7">尚無錯題記錄</td></tr>';
            return;
        }

        // 生成錯題列表HTML
        filteredQuestions.forEach(question => {
            const row = document.createElement('tr');

            // 根據掌握狀態設置行樣式
            if (question.mastery_status === MASTERY_STATUS.MASTERED) {
                row.classList.add('mastered');
            } else if (question.mastery_status === MASTERY_STATUS.REVIEWING) {
                row.classList.add('reviewing');
            }

            row.innerHTML = `
                <td>${question.date}</td>
                <td>${question.subject}</td>
                <td>${question.content.length > 50 ? question.content.substring(0, 50) + '...' : question.content}</td>
                <td>${getMasteryStatusText(question.mastery_status)}</td>
                <td>${question.review_count}</td>
                <td>${question.last_review_date || '-'}</td>
                <td>
                    <button class="btn-view" data-id="${question.id}">查看</button>
                    <button class="btn-review" data-id="${question.id}">複習</button>
                    <button class="btn-edit" data-id="${question.id}">編輯</button>
                    <button class="btn-delete" data-id="${question.id}">刪除</button>
                </td>
            `;

            // 添加事件處理
            const viewBtn = row.querySelector('.btn-view');
            const reviewBtn = row.querySelector('.btn-review');
            const editBtn = row.querySelector('.btn-edit');
            const deleteBtn = row.querySelector('.btn-delete');

            if (viewBtn) viewBtn.addEventListener('click', () => viewWrongQuestion(question.id));
            if (reviewBtn) reviewBtn.addEventListener('click', () => reviewWrongQuestion(question.id));
            if (editBtn) editBtn.addEventListener('click', () => editWrongQuestion(question.id));
            if (deleteBtn) deleteBtn.addEventListener('click', () => confirmDeleteWrongQuestion(question.id));

            wrongQuestionsList.appendChild(row);
        });

        // 更新統計信息
        updateWrongQuestionStats();
    }

    // 獲取掌握狀態文字
    function getMasteryStatusText(status) {
        switch (status) {
            case MASTERY_STATUS.MASTERED: return '已掌握';
            case MASTERY_STATUS.REVIEWING: return '複習中';
            case MASTERY_STATUS.NOT_REVIEWED: return '未複習';
            default: return '未知';
        }
    }

    // 過濾錯題
    function filterWrongQuestions(filters) {
        return wrongQuestions.filter(question => {
            // 按科目過濾
            if (filters.subject && filters.subject !== 'all' && question.subject !== filters.subject) {
                return false;
            }

            // 按學年過濾
            if (filters.academicYear && filters.academicYear !== 'all' && question.academic_year !== filters.academicYear) {
                return false;
            }

            // 按掌握狀態過濾
            if (filters.masteryStatus && filters.masteryStatus !== 'all' && question.mastery_status !== filters.masteryStatus) {
                return false;
            }

            // 按搜索詞過濾
            if (filters.searchTerm && filters.searchTerm.trim() !== '') {
                const searchTermLower = filters.searchTerm.toLowerCase();
                const contentMatch = question.content.toLowerCase().includes(searchTermLower);
                const reasonMatch = question.error_reason.toLowerCase().includes(searchTermLower);
                const conceptMatch = question.correct_concept.toLowerCase().includes(searchTermLower);
                const tagsMatch = question.tags && question.tags.some(tag => tag.toLowerCase().includes(searchTermLower));

                if (!contentMatch && !reasonMatch && !conceptMatch && !tagsMatch) {
                    return false;
                }
            }

            return true;
        });
    }

    // 排序錯題
    function sortWrongQuestions(questions, sortBy) {
        const sortedQuestions = [...questions];

        switch (sortBy) {
            case 'date-desc':
                sortedQuestions.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'date-asc':
                sortedQuestions.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'review-count-desc':
                sortedQuestions.sort((a, b) => b.review_count - a.review_count);
                break;
            case 'review-count-asc':
                sortedQuestions.sort((a, b) => a.review_count - b.review_count);
                break;
            case 'last-review-desc':
                sortedQuestions.sort((a, b) => {
                    if (!a.last_review_date) return 1;
                    if (!b.last_review_date) return -1;
                    return new Date(b.last_review_date) - new Date(a.last_review_date);
                });
                break;
            case 'last-review-asc':
                sortedQuestions.sort((a, b) => {
                    if (!a.last_review_date) return -1;
                    if (!b.last_review_date) return 1;
                    return new Date(a.last_review_date) - new Date(b.last_review_date);
                });
                break;
            case 'mastery-status':
                // 按掌握狀態排序：未複習 -> 複習中 -> 已掌握
                sortedQuestions.sort((a, b) => {
                    const statusOrder = {
                        [MASTERY_STATUS.NOT_REVIEWED]: 0,
                        [MASTERY_STATUS.REVIEWING]: 1,
                        [MASTERY_STATUS.MASTERED]: 2
                    };
                    return statusOrder[a.mastery_status] - statusOrder[b.mastery_status];
                });
                break;
            case 'subject':
                sortedQuestions.sort((a, b) => a.subject.localeCompare(b.subject));
                break;
        }

        return sortedQuestions;
    }

    // 更新錯題統計信息
    function updateWrongQuestionStats() {
        const statsContainer = document.getElementById('wrong-question-stats');
        if (!statsContainer) return;

        // 計算統計數據
        const totalCount = wrongQuestions.length;
        const masteredCount = wrongQuestions.filter(q => q.mastery_status === MASTERY_STATUS.MASTERED).length;
        const reviewingCount = wrongQuestions.filter(q => q.mastery_status === MASTERY_STATUS.REVIEWING).length;
        const notReviewedCount = wrongQuestions.filter(q => q.mastery_status === MASTERY_STATUS.NOT_REVIEWED).length;

        // 計算科目分佈
        const subjectCounts = {};
        wrongQuestions.forEach(q => {
            if (!subjectCounts[q.subject]) {
                subjectCounts[q.subject] = 0;
            }
            subjectCounts[q.subject]++;
        });

        // 生成科目分佈HTML
        let subjectDistributionHtml = '';
        for (const subject in subjectCounts) {
            const percentage = ((subjectCounts[subject] / totalCount) * 100).toFixed(1);
            subjectDistributionHtml += `
                <div class="subject-stat">
                    <span class="subject-name">${subject}</span>
                    <div class="subject-bar">
                        <div class="subject-progress" style="width: ${percentage}%"></div>
                    </div>
                    <span class="subject-count">${subjectCounts[subject]} (${percentage}%)</span>
                </div>
            `;
        }

        // 更新統計HTML
        statsContainer.innerHTML = `
            <div class="stats-overview">
                <div class="stat-item">
                    <div class="stat-value">${totalCount}</div>
                    <div class="stat-label">總錯題數</div>
                </div>
                <div class="stat-item mastered">
                    <div class="stat-value">${masteredCount}</div>
                    <div class="stat-label">已掌握</div>
                </div>
                <div class="stat-item reviewing">
                    <div class="stat-value">${reviewingCount}</div>
                    <div class="stat-label">複習中</div>
                </div>
                <div class="stat-item not-reviewed">
                    <div class="stat-value">${notReviewedCount}</div>
                    <div class="stat-label">未複習</div>
                </div>
            </div>
            <div class="stats-mastery-rate">
                <div class="mastery-label">掌握率</div>
                <div class="mastery-progress">
                    <div class="mastery-bar" style="width: ${totalCount > 0 ? ((masteredCount / totalCount) * 100).toFixed(1) : 0}%"></div>
                </div>
                <div class="mastery-value">${totalCount > 0 ? ((masteredCount / totalCount) * 100).toFixed(1) : 0}%</div>
            </div>
            <div class="stats-subject-distribution">
                <h4>科目分佈</h4>
                ${subjectDistributionHtml}
            </div>
        `;
    }

    // 添加錯題
    function addWrongQuestion(wrongQuestionData) {
        // 驗證錯題數據
        if (!validateWrongQuestion(wrongQuestionData)) {
            console.error('錯題數據無效');
            return false;
        }

        // 生成唯一ID
        wrongQuestionData.id = generateUniqueId();
        wrongQuestionData.created_at = new Date().toISOString();

        wrongQuestions.push(wrongQuestionData);
        saveToStorage();
        return true;
    }

    // 更新錯題
    function updateWrongQuestion(id, updatedData) {
        const index = wrongQuestions.findIndex(q => q.id === id);
        if (index === -1) {
            console.error(`未找到ID為 ${id} 的錯題`);
            return false;
        }

        // 保留原始ID和創建時間
        updatedData.id = id;
        updatedData.created_at = wrongQuestions[index].created_at;
        updatedData.updated_at = new Date().toISOString();

        // 保留複習記錄相關字段
        updatedData.review_count = wrongQuestions[index].review_count;
        updatedData.last_review_date = wrongQuestions[index].last_review_date;
        updatedData.correct_rate = wrongQuestions[index].correct_rate;
        updatedData.mastery_status = wrongQuestions[index].mastery_status;

        wrongQuestions[index] = updatedData;
        saveToStorage();
        updateWrongQuestionsList();
        return true;
    }

    // 刪除錯題
    function deleteWrongQuestion(id) {
        const initialLength = wrongQuestions.length;
        wrongQuestions = wrongQuestions.filter(q => q.id !== id);

        if (wrongQuestions.length === initialLength) {
            console.error(`未找到ID為 ${id} 的錯題`);
            return false;
        }

        saveToStorage();
        return true;
    }

    // 確認刪除錯題
    function confirmDeleteWrongQuestion(id) {
        if (confirm('確定要刪除此錯題嗎？此操作無法撤銷。')) {
            if (deleteWrongQuestion(id)) {
                updateWrongQuestionsList();
            }
        }
    }

    // 查看錯題詳情
    function viewWrongQuestion(id) {
        const question = wrongQuestions.find(q => q.id === id);
        if (!question) {
            console.error(`未找到ID為 ${id} 的錯題`);
            return;
        }

        // 顯示錯題詳情對話框
        const modal = document.getElementById('wrong-question-detail-modal');
        if (modal) {
            const detailContent = modal.querySelector('.modal-content');
            if (detailContent) {
                detailContent.innerHTML = generateWrongQuestionDetailHTML(question);
                modal.style.display = 'block';

                // 綁定關閉按鈕
                const closeBtn = detailContent.querySelector('.close-modal');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        modal.style.display = 'none';
                    });
                }
            }
        } else {
            alert(`錯題詳情：\n題目：${question.content}\n\n正確答案：${question.correct_answer}\n\n錯誤原因：${question.error_reason}`);
        }
    }

    // 生成錯題詳情HTML
    function generateWrongQuestionDetailHTML(question) {
        return `
            <div class="wrong-question-detail">
                <button class="close-modal">&times;</button>
                <h3>錯題詳情</h3>
                <div class="detail-row">
                    <span class="label">科目：</span>
                    <span>${question.subject}</span>
                </div>
                <div class="detail-row">
                    <span class="label">學年：</span>
                    <span>${question.academic_year}</span>
                </div>
                <div class="detail-row">
                    <span class="label">日期：</span>
                    <span>${question.date}</span>
                </div>
                <div class="detail-row">
                    <span class="label">掌握狀態：</span>
                    <span class="mastery-status ${question.mastery_status}">${getMasteryStatusText(question.mastery_status)}</span>
                </div>
                <div class="detail-content">
                    <h4>題目：</h4>
                    <div class="content-text">${question.content}</div>
                </div>
                <div class="detail-answers">
                    <div class="correct-answer">
                        <h4>正確答案：</h4>
                        <div class="answer-text">${question.correct_answer}</div>
                    </div>
                    <div class="user-answer">
                        <h4>我的答案：</h4>
                        <div class="answer-text">${question.user_answer}</div>
                    </div>
                </div>
                <div class="detail-reason">
                    <h4>錯誤原因：</h4>
                    <div class="reason-text">${question.error_reason}</div>
                </div>
                <div class="detail-concept">
                    <h4>正確觀念：</h4>
                    <div class="concept-text">${question.correct_concept}</div>
                </div>
                <div class="detail-review">
                    <h4>複習記錄：</h4>
                    <div class="review-stats">
                        <div class="review-stat">
                            <span class="label">複習次數：</span>
                            <span>${question.review_count || 0}</span>
                        </div>
                        <div class="review-stat">
                            <span class="label">上次複習：</span>
                            <span>${question.last_review_date || '尚未複習'}</span>
                        </div>
                        <div class="review-stat">
                            <span class="label">正確率：</span>
                            <span>${question.correct_rate ? question.correct_rate + '%' : '無數據'}</span>
                        </div>
                    </div>
                </div>
                <div class="detail-tags">
                    <h4>標籤：</h4>
                    <div class="tags-container">
                        ${question.tags && question.tags.length > 0 ?
                question.tags.map(tag => `<span class="tag">${tag}</span>`).join('') :
                '<span class="no-tags">無標籤</span>'}
                    </div>
                </div>
                <div class="detail-actions">
                    <button class="btn-review" data-id="${question.id}">複習此題</button>
                    <button class="btn-edit" data-id="${question.id}">編輯</button>
                    <button class="btn-delete" data-id="${question.id}">刪除</button>
                </div>
            </div>
        `;
    }

    // 複習錯題
    function reviewWrongQuestion(id) {
        const question = wrongQuestions.find(q => q.id === id);
        if (!question) {
            console.error(`未找到ID為 ${id} 的錯題`);
            return;
        }

        // 顯示複習對話框
        const modal = document.getElementById('review-wrong-question-modal');
        if (modal) {
            const reviewContent = modal.querySelector('.modal-content');
            if (reviewContent) {
                reviewContent.innerHTML = generateReviewModalHTML(question);
                modal.style.display = 'block';

                // 綁定關閉按鈕
                const closeBtn = reviewContent.querySelector('.close-modal');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        modal.style.display = 'none';
                    });
                }

                // 綁定答案提交
                const reviewForm = reviewContent.querySelector('#review-form');
                if (reviewForm) {
                    reviewForm.addEventListener('submit', (event) => {
                        event.preventDefault();
                        const userAnswer = reviewForm.elements.user_answer.value;
                        const isCorrect = reviewForm.elements.is_correct.checked;

                        submitReviewResult(id, userAnswer, isCorrect);
                        modal.style.display = 'none';
                    });
                }

                // 綁定顯示答案按鈕
                const showAnswerBtn = reviewContent.querySelector('.show-answer-btn');
                const answerSection = reviewContent.querySelector('.review-answer');
                if (showAnswerBtn && answerSection) {
                    showAnswerBtn.addEventListener('click', () => {
                        answerSection.style.display = 'block';
                        showAnswerBtn.style.display = 'none';
                    });
                }
            }
        } else {
            // 如果沒有對話框，使用簡單的確認方式
            const isCorrect = confirm(`題目：${question.content}\n\n現在請嘗試回答，然後點擊"確定"表示答對，"取消"表示答錯。`);
            submitReviewResult(id, '（通過確認框方式檢查）', isCorrect);
        }
    }

    // 生成複習模態框HTML
    function generateReviewModalHTML(question) {
        return `
            <div class="review-modal">
                <button class="close-modal">&times;</button>
                <h3>複習錯題</h3>
                <div class="review-question">
                    <h4>題目：</h4>
                    <div class="question-text">${question.content}</div>
                </div>
                <div class="review-instruction">
                    <p>請嘗試回答這個問題，完成後點擊下方按鈕查看答案。</p>
                </div>
                <button class="show-answer-btn">顯示答案</button>
                <div class="review-answer" style="display: none;">
                    <h4>正確答案：</h4>
                    <div class="answer-text">${question.correct_answer}</div>
                    <h4>正確觀念：</h4>
                    <div class="concept-text">${question.correct_concept}</div>
                    <form id="review-form">
                        <div class="review-input">
                            <label for="user_answer">請輸入你的答案：</label>
                            <textarea id="user_answer" name="user_answer" rows="3" required></textarea>
                        </div>
                        <div class="review-result">
                            <label>
                                <input type="checkbox" name="is_correct" id="is_correct">
                                我答對了這個問題
                            </label>
                        </div>
                        <div class="review-submit">
                            <button type="submit" class="submit-review-btn">提交結果</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // 提交複習結果
    function submitReviewResult(id, userAnswer, isCorrect) {
        const index = wrongQuestions.findIndex(q => q.id === id);
        if (index === -1) {
            console.error(`未找到ID為 ${id} 的錯題`);
            return false;
        }

        const question = wrongQuestions[index];

        // 更新複習記錄
        question.review_count = (question.review_count || 0) + 1;
        question.last_review_date = new Date().toISOString().split('T')[0];

        // 更新正確率
        const correctCount = (question.correct_count || 0) + (isCorrect ? 1 : 0);
        question.correct_count = correctCount;
        question.correct_rate = Math.round((correctCount / question.review_count) * 100);

        // 更新掌握狀態
        if (isCorrect) {
            // 連續答對或正確率高，提升掌握狀態
            if (question.mastery_status === MASTERY_STATUS.NOT_REVIEWED) {
                question.mastery_status = MASTERY_STATUS.REVIEWING;
            } else if (question.mastery_status === MASTERY_STATUS.REVIEWING && question.correct_rate >= 80 && question.review_count >= 3) {
                question.mastery_status = MASTERY_STATUS.MASTERED;
            }
        } else {
            // 答錯，降低掌握狀態
            if (question.mastery_status === MASTERY_STATUS.MASTERED) {
                question.mastery_status = MASTERY_STATUS.REVIEWING;
            }
        }

        // 記錄本次複習答案
        if (!question.review_history) {
            question.review_history = [];
        }

        question.review_history.push({
            date: new Date().toISOString(),
            user_answer: userAnswer,
            is_correct: isCorrect
        });

        // 更新到存儲
        saveToStorage();
        updateWrongQuestionsList();

        // 提示用戶
        const message = isCorrect ?
            '太棒了！你已經掌握了這道題目。' :
            '繼續努力！這道題目還需要多練習。';

        alert(message);

        return true;
    }

    // 編輯錯題
    function editWrongQuestion(id) {
        const question = wrongQuestions.find(q => q.id === id);
        if (!question) {
            console.error(`未找到ID為 ${id} 的錯題`);
            return;
        }

        // 顯示編輯表單
        const modal = document.getElementById('edit-wrong-question-modal');
        if (modal) {
            const editForm = modal.querySelector('#edit-wrong-question-form');
            if (editForm) {
                // 填充表單
                editForm.elements.question_id.value = question.id;
                editForm.elements.academic_year.value = question.academic_year;
                editForm.elements.subject.value = question.subject;
                editForm.elements.date.value = question.date;
                editForm.elements.content.value = question.content;
                editForm.elements.correct_answer.value = question.correct_answer;
                editForm.elements.user_answer.value = question.user_answer;
                editForm.elements.error_reason.value = question.error_reason;
                editForm.elements.correct_concept.value = question.correct_concept;
                editForm.elements.tags.value = question.tags ? question.tags.join(', ') : '';

                // 顯示模態框
                modal.style.display = 'block';

                // 綁定關閉按鈕
                const closeBtn = modal.querySelector('.close-modal');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        modal.style.display = 'none';
                    });
                }

                // 綁定表單提交
                editForm.onsubmit = function (event) {
                    event.preventDefault();

                    const updatedQuestion = {
                        academic_year: editForm.elements.academic_year.value,
                        subject: editForm.elements.subject.value,
                        date: editForm.elements.date.value,
                        content: editForm.elements.content.value,
                        correct_answer: editForm.elements.correct_answer.value,
                        user_answer: editForm.elements.user_answer.value,
                        error_reason: editForm.elements.error_reason.value,
                        correct_concept: editForm.elements.correct_concept.value,
                        tags: editForm.elements.tags.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    };

                    if (updateWrongQuestion(id, updatedQuestion)) {
                        modal.style.display = 'none';
                        alert('錯題更新成功！');
                    }
                };
            }
        } else {
            alert('編輯功能需要編輯表單，請確保頁面包含編輯表單。');
        }
    }

    // 獲取所有錯題
    function getAllWrongQuestions() {
        return [...wrongQuestions];
    }

    // 獲取最近的錯題
    function getRecentWrongQuestions(limit = 10) {
        return [...wrongQuestions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    // 獲取艾賓浩斯複習建議
    function getEbbinghausReviewSuggestions() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const suggestions = [];

        // 定義間隔天數 (艾賓浩斯遺忘曲線建議的間隔)
        const intervals = [0, 1, 2, 4, 7, 15, 30];

        wrongQuestions.forEach(question => {
            if (question.mastery_status === MASTERY_STATUS.MASTERED) {
                return; // 已掌握的錯題不需要復習
            }

            let lastReviewDate = question.last_review_date ? new Date(question.last_review_date) : null;
            const createdDate = new Date(question.date);
            createdDate.setHours(0, 0, 0, 0);

            // 如果沒有複習過，使用創建日期作為基準
            if (!lastReviewDate) {
                lastReviewDate = createdDate;
            }

            // 計算上次複習或創建至今的天數
            const daysPassed = Math.floor((today - lastReviewDate) / (1000 * 60 * 60 * 24));

            // 計算下一次合適的複習間隔
            let nextInterval = 0;
            for (const interval of intervals) {
                if (daysPassed < interval) {
                    break;
                }
                nextInterval = interval;
            }

            // 如果從上次複習或創建到現在的天數正好等於某個艾賓浩斯間隔，建議今天複習
            if (intervals.includes(daysPassed)) {
                suggestions.push({
                    question: question,
                    daysSinceLastReview: daysPassed,
                    reviewDay: 'today'
                });
            }
            // 如果距離下一個建議間隔只差1-2天，也提供建議
            else if (daysPassed > nextInterval && intervals.find(i => i > daysPassed) - daysPassed <= 2) {
                const nextDay = intervals.find(i => i > daysPassed);
                const daysUntilNext = nextDay - daysPassed;

                suggestions.push({
                    question: question,
                    daysSinceLastReview: daysPassed,
                    reviewDay: daysUntilNext === 0 ? 'today' :
                        daysUntilNext === 1 ? 'tomorrow' :
                            `in ${daysUntilNext} days`
                });
            }
        });

        return suggestions;
    }

    // 驗證錯題數據
    function validateWrongQuestion(question) {
        // 基本檢查
        const requiredFields = ['subject', 'content', 'correct_answer', 'error_reason', 'correct_concept'];
        for (const field of requiredFields) {
            if (!question[field] || question[field].trim() === '') {
                console.error(`錯題缺少必要字段：${field}`);
                return false;
            }
        }

        return true;
    }

    // 生成唯一ID
    function generateUniqueId() {
        return 'wq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 公開API
    return {
        init,
        addWrongQuestion,
        updateWrongQuestion,
        deleteWrongQuestion,
        getAllWrongQuestions,
        getRecentWrongQuestions,
        reviewWrongQuestion,
        getEbbinghausReviewSuggestions,
        MASTERY_STATUS
    };
})();

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function () {
    WrongQuestionManager.init();

    // 將實例附加到全局對象，方便其他模塊訪問
    window.wrongQuestionManager = WrongQuestionManager;
});
