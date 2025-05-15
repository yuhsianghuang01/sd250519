/**
 * 考前衝剌系統 - 模擬試題卷系統
 * 負責題庫管理、試卷生成、考試流程和評分功能
 */

// 模擬試題系統管理器
const ExamSystem = (function () {
    // 私有變數
    let questions = [];
    let exams = [];
    let examResults = [];
    const QUESTIONS_STORAGE_KEY = 'exam_questions_data';
    const EXAMS_STORAGE_KEY = 'exam_papers_data';
    const RESULTS_STORAGE_KEY = 'exam_results_data';
    const JSON_FILE_PATH = '/sd/模擬試題卷.json.txt';

    // 題目類型常量
    const QUESTION_TYPES = {
        TRUE_FALSE: 'true_false',     // 是非題
        SINGLE_CHOICE: 'single_choice', // 單選題
        MULTIPLE_CHOICE: 'multiple_choice', // 多選題
        FILL_BLANK: 'fill_blank',     // 填空題
        SHORT_ANSWER: 'short_answer', // 簡答題
        SPEED_READING: 'speed_reading', // 速讀題
        MEMORY: 'memory'              // 記憶題
    };

    // 難度等級常量
    const DIFFICULTY_LEVELS = {
        EASY: 'easy',
        MEDIUM: 'medium',
        HARD: 'hard'
    };

    // 初始化函數
    function init() {
        loadQuestionsFromStorage();
        loadExamsFromStorage();
        loadResultsFromStorage();
        setupEventListeners();
        console.log('模擬試題卷系統初始化完成');
    }

    // 從存儲載入題目
    function loadQuestionsFromStorage() {
        try {
            const storedData = localStorage.getItem(QUESTIONS_STORAGE_KEY);
            if (storedData) {
                questions = JSON.parse(storedData);
                console.log(`已載入 ${questions.length} 道題目`);
            } else {
                console.log('未找到本地題目數據，使用空數據初始化');
                questions = [];
            }
        } catch (error) {
            console.error('載入題目時發生錯誤:', error);
            questions = [];
        }
    }

    // 從存儲載入試卷
    function loadExamsFromStorage() {
        try {
            const storedData = localStorage.getItem(EXAMS_STORAGE_KEY);
            if (storedData) {
                exams = JSON.parse(storedData);
                console.log(`已載入 ${exams.length} 份試卷`);
            } else {
                console.log('未找到本地試卷數據，使用空數據初始化');
                exams = [];
            }
        } catch (error) {
            console.error('載入試卷時發生錯誤:', error);
            exams = [];
        }
    }

    // 從存儲載入考試結果
    function loadResultsFromStorage() {
        try {
            const storedData = localStorage.getItem(RESULTS_STORAGE_KEY);
            if (storedData) {
                examResults = JSON.parse(storedData);
                console.log(`已載入 ${examResults.length} 份考試結果`);
            } else {
                console.log('未找到本地考試結果數據，使用空數據初始化');
                examResults = [];
            }
        } catch (error) {
            console.error('載入考試結果時發生錯誤:', error);
            examResults = [];
        }
    }

    // 保存題目到存儲
    function saveQuestionsToStorage() {
        try {
            localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(questions));
            console.log('題目數據已保存到本地存儲');

            // 同時保存到文件（如果服務器支持）
            saveToJsonFile();
        } catch (error) {
            console.error('保存題目數據時發生錯誤:', error);
        }
    }

    // 保存試卷到存儲
    function saveExamsToStorage() {
        try {
            localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(exams));
            console.log('試卷數據已保存到本地存儲');

            // 同時保存到文件（如果服務器支持）
            saveToJsonFile();
        } catch (error) {
            console.error('保存試卷數據時發生錯誤:', error);
        }
    }

    // 保存考試結果到存儲
    function saveResultsToStorage() {
        try {
            localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(examResults));
            console.log('考試結果數據已保存到本地存儲');

            // 同時保存到文件（如果服務器支持）
            saveToJsonFile();
        } catch (error) {
            console.error('保存考試結果數據時發生錯誤:', error);
        }
    }

    // 保存到JSON文件 (需要伺服器端支援)
    function saveToJsonFile() {
        try {
            // 組合所有數據
            const allData = {
                questions: questions,
                exams: exams,
                exam_results: examResults
            };

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/saveExamData', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        console.log('試題系統數據已保存到文件');
                    } else {
                        console.error('保存試題系統數據到文件失敗:', xhr.statusText);
                    }
                }
            };
            xhr.send(JSON.stringify({
                path: JSON_FILE_PATH,
                data: JSON.stringify(allData)
            }));
        } catch (error) {
            console.error('嘗試保存到文件時發生錯誤:', error);
        }
    }

    // 添加事件監聽器
    function setupEventListeners() {
        // 監聽試卷生成表單提交
        const generateExamForm = document.getElementById('generate-exam-form');
        if (generateExamForm) {
            generateExamForm.addEventListener('submit', handleGenerateExamSubmit);
        }

        // 監聽添加題目表單提交
        const addQuestionForm = document.getElementById('add-question-form');
        if (addQuestionForm) {
            addQuestionForm.addEventListener('submit', handleAddQuestionSubmit);
        }
    }

    // 處理試卷生成表單提交
    function handleGenerateExamSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const examConfig = {
            title: form.title.value,
            description: form.description.value || '模擬測驗',
            academicYear: form.academic_year.value,
            subject: form.subject.value,
            totalTime: parseInt(form.total_time.value, 10) || 60,
            totalScore: parseInt(form.total_score.value, 10) || 100,
            questionTypes: getSelectedQuestionTypes(form),
            difficulty: form.difficulty.value || 'medium',
            questionsCount: parseInt(form.questions_count.value, 10) || 20
        };

        const exam = generateExam(examConfig);

        if (exam) {
            // 導航到考試頁面
            startExam(exam.id);
        }
    }

    // 獲取選中的題目類型
    function getSelectedQuestionTypes(form) {
        const types = [];
        if (form.true_false && form.true_false.checked) types.push(QUESTION_TYPES.TRUE_FALSE);
        if (form.single_choice && form.single_choice.checked) types.push(QUESTION_TYPES.SINGLE_CHOICE);
        if (form.multiple_choice && form.multiple_choice.checked) types.push(QUESTION_TYPES.MULTIPLE_CHOICE);
        if (form.fill_blank && form.fill_blank.checked) types.push(QUESTION_TYPES.FILL_BLANK);
        if (form.short_answer && form.short_answer.checked) types.push(QUESTION_TYPES.SHORT_ANSWER);
        if (form.speed_reading && form.speed_reading.checked) types.push(QUESTION_TYPES.SPEED_READING);
        if (form.memory && form.memory.checked) types.push(QUESTION_TYPES.MEMORY);

        return types.length > 0 ? types : [QUESTION_TYPES.SINGLE_CHOICE]; // 默認單選題
    }

    // 處理添加題目表單提交
    function handleAddQuestionSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const questionType = form.question_type.value;

        // 基本題目數據
        const questionData = {
            academic_year: form.academic_year.value,
            subject: form.subject.value,
            chapter: form.chapter.value,
            type: questionType,
            difficulty: form.difficulty.value,
            content: form.content.value,
            explanation: form.explanation.value,
            time_limit: parseInt(form.time_limit.value, 10) || 60,
            tags: form.tags.value.split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        // 根據題目類型添加特定欄位
        switch (questionType) {
            case QUESTION_TYPES.TRUE_FALSE:
                questionData.answer = form.tf_answer.value === 'true';
                break;

            case QUESTION_TYPES.SINGLE_CHOICE:
            case QUESTION_TYPES.MULTIPLE_CHOICE:
                // 選項處理
                const optionsContainer = form.querySelector('.options-container');
                const optionInputs = optionsContainer.querySelectorAll('.option-text');
                const checkedOptions = optionsContainer.querySelectorAll('.option-checkbox:checked');

                questionData.options = Array.from(optionInputs).map(input => input.value);

                if (questionType === QUESTION_TYPES.SINGLE_CHOICE) {
                    // 單選題只取第一個選中的答案
                    questionData.answer = checkedOptions.length > 0 ?
                        Array.from(optionInputs).indexOf(checkedOptions[0].closest('.option-group').querySelector('.option-text')) : -1;
                } else {
                    // 多選題取所有選中的答案索引
                    questionData.answer = Array.from(checkedOptions).map(checkbox =>
                        Array.from(optionInputs).indexOf(checkbox.closest('.option-group').querySelector('.option-text'))
                    );
                }
                break;

            case QUESTION_TYPES.FILL_BLANK:
                // 填空題答案
                const blankAnswers = form.querySelectorAll('.blank-answer');
                questionData.answer = Array.from(blankAnswers).map(input => input.value);
                break;

            case QUESTION_TYPES.SHORT_ANSWER:
                // 簡答題答案
                questionData.answer = form.short_answer.value;
                questionData.keywords = form.keywords.value.split(',').map(kw => kw.trim()).filter(kw => kw);
                break;

            case QUESTION_TYPES.SPEED_READING:
                // 速讀題處理
                questionData.reading_content = form.reading_content.value;
                questionData.sub_questions = processSubQuestions(form);
                break;

            case QUESTION_TYPES.MEMORY:
                // 記憶題
                questionData.memory_content = form.memory_content.value;
                questionData.memory_time = parseInt(form.memory_time.value, 10) || 30;
                questionData.answer = form.memory_answer.value;
                break;
        }

        // 添加題目
        if (addQuestion(questionData)) {
            form.reset();
            alert('題目添加成功！');

            // 如果有題目列表，更新顯示
            updateQuestionsList();
        }
    }

    // 處理速讀題的子問題
    function processSubQuestions(form) {
        const subQuestionsContainer = form.querySelector('.sub-questions-container');
        if (!subQuestionsContainer) return [];

        const subQuestionGroups = subQuestionsContainer.querySelectorAll('.sub-question-group');
        return Array.from(subQuestionGroups).map(group => {
            const subQuestion = {
                content: group.querySelector('.sub-question-content').value,
                type: group.querySelector('.sub-question-type').value
            };

            if (subQuestion.type === 'single_choice' || subQuestion.type === 'multiple_choice') {
                const options = Array.from(group.querySelectorAll('.sub-option-text')).map(input => input.value);
                const checkedOptions = group.querySelectorAll('.sub-option-checkbox:checked');

                subQuestion.options = options;

                if (subQuestion.type === 'single_choice') {
                    subQuestion.answer = checkedOptions.length > 0 ?
                        Array.from(group.querySelectorAll('.sub-option-text')).indexOf(
                            checkedOptions[0].closest('.sub-option-group').querySelector('.sub-option-text')
                        ) : -1;
                } else {
                    subQuestion.answer = Array.from(checkedOptions).map(checkbox =>
                        Array.from(group.querySelectorAll('.sub-option-text')).indexOf(
                            checkbox.closest('.sub-option-group').querySelector('.sub-option-text')
                        )
                    );
                }
            } else if (subQuestion.type === 'true_false') {
                subQuestion.answer = group.querySelector('.sub-tf-answer').value === 'true';
            } else if (subQuestion.type === 'fill_blank') {
                subQuestion.answer = group.querySelector('.sub-blank-answer').value;
            }

            return subQuestion;
        });
    }

    // 更新題目列表顯示
    function updateQuestionsList() {
        const questionsList = document.getElementById('questions-list');
        if (!questionsList) return;

        // 清空列表
        questionsList.innerHTML = '';

        if (questions.length === 0) {
            questionsList.innerHTML = '<tr><td colspan="6">尚無題目，請添加新題目</td></tr>';
            return;
        }

        // 按最新添加順序顯示題目
        questions.slice().reverse().forEach(question => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${getQuestionTypeText(question.type)}</td>
                <td>${question.subject}</td>
                <td>${question.academic_year}</td>
                <td>${question.content.length > 50 ? question.content.substring(0, 50) + '...' : question.content}</td>
                <td>${getDifficultyText(question.difficulty)}</td>
                <td>
                    <button class="btn-view" data-id="${question.id}">查看</button>
                    <button class="btn-edit" data-id="${question.id}">編輯</button>
                    <button class="btn-delete" data-id="${question.id}">刪除</button>
                </td>
            `;

            // 添加事件監聽器
            const viewBtn = row.querySelector('.btn-view');
            const editBtn = row.querySelector('.btn-edit');
            const deleteBtn = row.querySelector('.btn-delete');

            if (viewBtn) viewBtn.addEventListener('click', () => viewQuestion(question.id));
            if (editBtn) editBtn.addEventListener('click', () => editQuestion(question.id));
            if (deleteBtn) deleteBtn.addEventListener('click', () => confirmDeleteQuestion(question.id));

            questionsList.appendChild(row);
        });
    }

    // 獲取題目類型文字描述
    function getQuestionTypeText(type) {
        switch (type) {
            case QUESTION_TYPES.TRUE_FALSE: return '是非題';
            case QUESTION_TYPES.SINGLE_CHOICE: return '單選題';
            case QUESTION_TYPES.MULTIPLE_CHOICE: return '多選題';
            case QUESTION_TYPES.FILL_BLANK: return '填空題';
            case QUESTION_TYPES.SHORT_ANSWER: return '簡答題';
            case QUESTION_TYPES.SPEED_READING: return '速讀題';
            case QUESTION_TYPES.MEMORY: return '記憶題';
            default: return '未知類型';
        }
    }

    // 獲取難度文字描述
    function getDifficultyText(difficulty) {
        switch (difficulty) {
            case DIFFICULTY_LEVELS.EASY: return '基礎';
            case DIFFICULTY_LEVELS.MEDIUM: return '中等';
            case DIFFICULTY_LEVELS.HARD: return '進階';
            default: return '中等';
        }
    }

    // 添加題目
    function addQuestion(questionData) {
        // 驗證題目數據
        if (!validateQuestion(questionData)) {
            console.error('題目數據無效');
            return false;
        }

        // 生成唯一ID
        questionData.id = generateUniqueId('q');
        questionData.created_at = new Date().toISOString();

        questions.push(questionData);
        saveQuestionsToStorage();
        return true;
    }

    // 更新題目
    function updateQuestion(id, updatedQuestionData) {
        const index = questions.findIndex(q => q.id === id);
        if (index === -1) {
            console.error(`未找到ID為 ${id} 的題目`);
            return false;
        }

        // 保留原始ID和創建時間
        updatedQuestionData.id = id;
        updatedQuestionData.created_at = questions[index].created_at;
        updatedQuestionData.updated_at = new Date().toISOString();

        // 驗證更新後的題目數據
        if (!validateQuestion(updatedQuestionData)) {
            console.error('更新的題目數據無效');
            return false;
        }

        questions[index] = updatedQuestionData;
        saveQuestionsToStorage();
        return true;
    }

    // 刪除題目
    function deleteQuestion(id) {
        const initialLength = questions.length;
        questions = questions.filter(q => q.id !== id);

        if (questions.length === initialLength) {
            console.error(`未找到ID為 ${id} 的題目`);
            return false;
        }

        saveQuestionsToStorage();
        return true;
    }

    // 確認刪除題目
    function confirmDeleteQuestion(id) {
        if (confirm('確定要刪除此題目嗎？此操作無法撤銷。')) {
            if (deleteQuestion(id)) {
                updateQuestionsList();
            }
        }
    }

    // 查看題目詳情
    function viewQuestion(id) {
        const question = questions.find(q => q.id === id);
        if (!question) {
            console.error(`未找到ID為 ${id} 的題目`);
            return;
        }

        // 顯示題目詳情對話框
        const modal = document.getElementById('question-detail-modal');
        if (modal) {
            const detailContent = modal.querySelector('.modal-content');
            if (detailContent) {
                detailContent.innerHTML = generateQuestionDetailHTML(question);
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
            alert(`題目詳情：\n${question.content}\n\n答案：${formatAnswer(question)}`);
        }
    }

    // 生成題目詳情HTML
    function generateQuestionDetailHTML(question) {
        let html = `
            <div class="question-detail">
                <button class="close-modal">&times;</button>
                <h3>${getQuestionTypeText(question.type)}</h3>
                <div class="detail-row">
                    <span class="label">科目：</span>
                    <span>${question.subject}</span>
                </div>
                <div class="detail-row">
                    <span class="label">學年：</span>
                    <span>${question.academic_year}</span>
                </div>
                <div class="detail-row">
                    <span class="label">難度：</span>
                    <span>${getDifficultyText(question.difficulty)}</span>
                </div>
                <div class="detail-row">
                    <span class="label">章節：</span>
                    <span>${question.chapter || '未分類'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">標籤：</span>
                    <span>${question.tags?.join(', ') || '無'}</span>
                </div>
                <div class="detail-content">
                    <h4>題目內容：</h4>
                    <div class="content-text">${question.content}</div>
                </div>
        `;

        // 根據題目類型顯示不同的答案格式
        html += `<div class="detail-answer">
                    <h4>答案：</h4>
                    <div class="answer-text">${formatAnswer(question)}</div>
                 </div>`;

        if (question.explanation) {
            html += `<div class="detail-explanation">
                        <h4>解析：</h4>
                        <div class="explanation-text">${question.explanation}</div>
                     </div>`;
        }

        html += '</div>';
        return html;
    }

    // 格式化答案顯示
    function formatAnswer(question) {
        switch (question.type) {
            case QUESTION_TYPES.TRUE_FALSE:
                return question.answer ? '正確' : '錯誤';

            case QUESTION_TYPES.SINGLE_CHOICE:
                if (question.answer >= 0 && question.answer < question.options.length) {
                    return `${String.fromCharCode(65 + question.answer)}. ${question.options[question.answer]}`;
                }
                return '未設置答案';

            case QUESTION_TYPES.MULTIPLE_CHOICE:
                if (Array.isArray(question.answer) && question.answer.length > 0) {
                    return question.answer
                        .filter(idx => idx >= 0 && idx < question.options.length)
                        .map(idx => `${String.fromCharCode(65 + idx)}. ${question.options[idx]}`)
                        .join('<br>');
                }
                return '未設置答案';

            case QUESTION_TYPES.FILL_BLANK:
                if (Array.isArray(question.answer)) {
                    return question.answer.join('、');
                }
                return question.answer || '未設置答案';

            case QUESTION_TYPES.SHORT_ANSWER:
                return question.answer || '未設置答案';

            case QUESTION_TYPES.SPEED_READING:
                if (Array.isArray(question.sub_questions)) {
                    return question.sub_questions.map((sub, idx) =>
                        `子問題${idx + 1}：${formatSubQuestionAnswer(sub)}`
                    ).join('<br>');
                }
                return '未設置子問題';

            case QUESTION_TYPES.MEMORY:
                return question.answer || '未設置答案';

            default:
                return '未知題型';
        }
    }

    // 格式化子問題答案
    function formatSubQuestionAnswer(subQuestion) {
        if (!subQuestion) return '無效子問題';

        switch (subQuestion.type) {
            case 'true_false':
                return subQuestion.answer ? '正確' : '錯誤';

            case 'single_choice':
                if (subQuestion.answer >= 0 && subQuestion.answer < subQuestion.options.length) {
                    return `${String.fromCharCode(65 + subQuestion.answer)}. ${subQuestion.options[subQuestion.answer]}`;
                }
                return '未設置答案';

            case 'multiple_choice':
                if (Array.isArray(subQuestion.answer) && subQuestion.answer.length > 0) {
                    return subQuestion.answer
                        .filter(idx => idx >= 0 && idx < subQuestion.options.length)
                        .map(idx => `${String.fromCharCode(65 + idx)}. ${subQuestion.options[idx]}`)
                        .join('、');
                }
                return '未設置答案';

            case 'fill_blank':
                return subQuestion.answer || '未設置答案';

            default:
                return '未知子問題類型';
        }
    }

    // 編輯題目
    function editQuestion(id) {
        const question = questions.find(q => q.id === id);
        if (!question) {
            console.error(`未找到ID為 ${id} 的題目`);
            return;
        }

        // 轉到編輯頁面或顯示編輯表單
        // 實際實現會根據UI設計不同而變化
        alert('編輯功能尚未實現，請期待後續版本！');
    }

    // 生成試卷
    function generateExam(config) {
        // 篩選符合條件的題目
        let availableQuestions = questions.filter(q => {
            // 基本條件過濾
            if (config.academicYear && q.academic_year !== config.academicYear) return false;
            if (config.subject && q.subject !== config.subject) return false;
            if (config.questionTypes && !config.questionTypes.includes(q.type)) return false;
            if (config.difficulty && q.difficulty !== config.difficulty) return false;

            return true;
        });

        if (availableQuestions.length === 0) {
            alert('沒有符合條件的題目，請添加題目或調整條件！');
            return null;
        }

        // 如果題目不夠
        if (availableQuestions.length < config.questionsCount) {
            if (!confirm(`只找到 ${availableQuestions.length} 道符合條件的題目，是否繼續生成試卷？`)) {
                return null;
            }
            config.questionsCount = availableQuestions.length;
        }

        // 隨機選擇題目
        const selectedQuestions = [];
        while (selectedQuestions.length < config.questionsCount && availableQuestions.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableQuestions.length);
            selectedQuestions.push(availableQuestions[randomIndex]);
            availableQuestions.splice(randomIndex, 1);
        }

        // 生成試卷數據
        const exam = {
            id: generateUniqueId('e'),
            title: config.title,
            description: config.description,
            academic_year: config.academicYear,
            subject: config.subject,
            total_time: config.totalTime,
            total_score: config.totalScore,
            question_ids: selectedQuestions.map(q => q.id),
            question_scores: calculateQuestionScores(selectedQuestions, config.totalScore),
            created_at: new Date().toISOString()
        };

        // 保存試卷
        exams.push(exam);
        saveExamsToStorage();

        return exam;
    }

    // 計算各題分數
    function calculateQuestionScores(questions, totalScore) {
        if (!questions.length) return [];

        // 根據題目類型和難度分配分數
        // 這裡使用簡單的平均分配，實際應用中可能需要更複雜的計算
        return questions.map(q => {
            let baseScore = totalScore / questions.length;

            // 根據題目類型調整分數
            switch (q.type) {
                case QUESTION_TYPES.TRUE_FALSE:
                    baseScore *= 0.8; // 是非題分值稍低
                    break;
                case QUESTION_TYPES.SINGLE_CHOICE:
                    // 單選題保持基本分值
                    break;
                case QUESTION_TYPES.MULTIPLE_CHOICE:
                    baseScore *= 1.2; // 多選題分值稍高
                    break;
                case QUESTION_TYPES.FILL_BLANK:
                    baseScore *= 1.1; // 填空題分值稍高
                    break;
                case QUESTION_TYPES.SHORT_ANSWER:
                    baseScore *= 1.5; // 簡答題分值較高
                    break;
                case QUESTION_TYPES.SPEED_READING:
                    // 速讀題分值與子問題數量相關
                    baseScore *= (q.sub_questions?.length || 1) * 0.8;
                    break;
                case QUESTION_TYPES.MEMORY:
                    baseScore *= 1.3; // 記憶題分值較高
                    break;
            }

            // 根據難度調整分數
            switch (q.difficulty) {
                case DIFFICULTY_LEVELS.EASY:
                    baseScore *= 0.9;
                    break;
                case DIFFICULTY_LEVELS.MEDIUM:
                    // 中等難度保持基本分值
                    break;
                case DIFFICULTY_LEVELS.HARD:
                    baseScore *= 1.2;
                    break;
            }

            return Math.round(baseScore * 10) / 10; // 四捨五入到一位小數
        });
    }

    // 開始考試
    function startExam(examId) {
        const exam = exams.find(e => e.id === examId);
        if (!exam) {
            console.error(`未找到ID為 ${examId} 的試卷`);
            return;
        }

        // 轉到考試頁面
        // 實際實現會根據前端路由或頁面架構不同而變化
        localStorage.setItem('current_exam_id', examId);
        window.location.href = '/exam.html';
    }

    // 提交考試結果
    function submitExamResult(examId, userAnswers, completionTime) {
        const exam = exams.find(e => e.id === examId);
        if (!exam) {
            console.error(`未找到ID為 ${examId} 的試卷`);
            return null;
        }

        // 評分
        const result = gradeExam(exam, userAnswers);

        // 記錄考試結果
        const examResult = {
            id: generateUniqueId('r'),
            exam_id: examId,
            date: new Date().toISOString(),
            score: result.totalScore,
            total_score: exam.total_score,
            completion_time: completionTime,
            question_results: result.questionResults
        };

        examResults.push(examResult);
        saveResultsToStorage();

        // 如果有設置錯題管理器，添加錯題
        if (window.wrongQuestionManager && result.wrongQuestions.length > 0) {
            result.wrongQuestions.forEach(wrongQ => {
                window.wrongQuestionManager.addWrongQuestion({
                    question_id: wrongQ.id,
                    academic_year: wrongQ.academic_year,
                    subject: wrongQ.subject,
                    date: new Date().toISOString(),
                    content: wrongQ.content,
                    correct_answer: formatAnswer(wrongQ),
                    user_answer: formatUserAnswer(wrongQ, userAnswers[wrongQ.id]),
                    error_reason: '',
                    correct_concept: wrongQ.explanation || '',
                    mastery_status: 'not_reviewed'
                });
            });
        }

        return examResult;
    }

    // 評分
    function gradeExam(exam, userAnswers) {
        const examQuestions = exam.question_ids.map(id => questions.find(q => q.id === id));
        const questionResults = [];
        const wrongQuestions = [];
        let totalScore = 0;

        examQuestions.forEach((question, index) => {
            if (!question) return;

            const userAnswer = userAnswers[question.id];
            const maxScore = exam.question_scores ? exam.question_scores[index] : (exam.total_score / examQuestions.length);
            const result = gradeQuestion(question, userAnswer, maxScore);

            questionResults.push({
                question_id: question.id,
                user_answer: userAnswer,
                is_correct: result.isCorrect,
                score: result.score,
                max_score: maxScore,
                time_spent: userAnswers[`${question.id}_time`] || null
            });

            totalScore += result.score;

            if (!result.isCorrect) {
                wrongQuestions.push(question);
            }
        });

        return {
            totalScore: Math.round(totalScore * 10) / 10,
            questionResults,
            wrongQuestions
        };
    }

    // 單題評分
    function gradeQuestion(question, userAnswer, maxScore) {
        if (!question || userAnswer === undefined || userAnswer === null) {
            return { isCorrect: false, score: 0 };
        }

        let isCorrect = false;
        let score = 0;

        switch (question.type) {
            case QUESTION_TYPES.TRUE_FALSE:
                isCorrect = userAnswer === question.answer;
                score = isCorrect ? maxScore : 0;
                break;

            case QUESTION_TYPES.SINGLE_CHOICE:
                isCorrect = parseInt(userAnswer) === question.answer;
                score = isCorrect ? maxScore : 0;
                break;

            case QUESTION_TYPES.MULTIPLE_CHOICE:
                // 多選題部分給分
                if (Array.isArray(userAnswer) && Array.isArray(question.answer)) {
                    const correctCount = userAnswer.filter(a => question.answer.includes(parseInt(a))).length;
                    const wrongCount = userAnswer.length - correctCount;
                    const missedCount = question.answer.length - correctCount;

                    // 全部正確
                    if (correctCount === question.answer.length && wrongCount === 0) {
                        isCorrect = true;
                        score = maxScore;
                    }
                    // 部分正確 (選對但不完整)
                    else if (correctCount > 0 && wrongCount === 0) {
                        isCorrect = false;
                        score = maxScore * (correctCount / question.answer.length) * 0.8; // 不完整給80%權重
                    }
                    // 部分正確 (有選錯)
                    else if (correctCount > 0 && wrongCount > 0) {
                        isCorrect = false;
                        score = Math.max(0, maxScore * (correctCount / question.answer.length - wrongCount / question.options.length) * 0.6); // 有錯誤給60%權重
                    }
                    // 全部錯誤
                    else {
                        isCorrect = false;
                        score = 0;
                    }
                }
                break;

            case QUESTION_TYPES.FILL_BLANK:
                // 填空題部分給分
                if (Array.isArray(userAnswer) && Array.isArray(question.answer)) {
                    const correctCount = userAnswer.filter((a, idx) =>
                        idx < question.answer.length &&
                        a.trim().toLowerCase() === question.answer[idx].trim().toLowerCase()
                    ).length;

                    isCorrect = correctCount === question.answer.length;
                    score = maxScore * (correctCount / question.answer.length);
                } else if (!Array.isArray(userAnswer) && !Array.isArray(question.answer)) {
                    isCorrect = userAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase();
                    score = isCorrect ? maxScore : 0;
                }
                break;

            case QUESTION_TYPES.SHORT_ANSWER:
                // 簡答題需要人工評分，這裡先根據關鍵詞判斷
                if (question.keywords && Array.isArray(question.keywords) && question.keywords.length > 0) {
                    const userAnswerLower = userAnswer.trim().toLowerCase();
                    const matchedKeywords = question.keywords.filter(kw =>
                        userAnswerLower.includes(kw.trim().toLowerCase())
                    );

                    const keywordMatchRatio = matchedKeywords.length / question.keywords.length;
                    isCorrect = keywordMatchRatio > 0.8; // 匹配80%以上關鍵詞視為正確
                    score = maxScore * keywordMatchRatio;
                } else {
                    // 無法自動評分，需人工評分
                    isCorrect = false;
                    score = 0;
                }
                break;

            case QUESTION_TYPES.SPEED_READING:
                // 速讀題評分
                if (Array.isArray(question.sub_questions) && typeof userAnswer === 'object') {
                    let correctSubQuestions = 0;
                    let totalSubScore = 0;
                    const subQuestionScore = maxScore / question.sub_questions.length;

                    question.sub_questions.forEach((subQ, idx) => {
                        const subUserAnswer = userAnswer[`sub_${idx}`];
                        if (subUserAnswer !== undefined) {
                            const subResult = gradeSubQuestion(subQ, subUserAnswer, subQuestionScore);
                            totalSubScore += subResult.score;
                            if (subResult.isCorrect) correctSubQuestions++;
                        }
                    });

                    isCorrect = correctSubQuestions === question.sub_questions.length;
                    score = totalSubScore;
                }
                break;

            case QUESTION_TYPES.MEMORY:
                // 記憶題
                if (typeof userAnswer === 'string' && typeof question.answer === 'string') {
                    // 根據字符匹配度給分
                    const userAnswerClean = userAnswer.trim().toLowerCase();
                    const correctAnswerClean = question.answer.trim().toLowerCase();

                    if (userAnswerClean === correctAnswerClean) {
                        isCorrect = true;
                        score = maxScore;
                    } else {
                        // 計算相似度
                        const similarity = calculateStringSimilarity(userAnswerClean, correctAnswerClean);
                        isCorrect = similarity > 0.9; // 90%相似度以上視為正確
                        score = maxScore * similarity;
                    }
                }
                break;

            default:
                isCorrect = false;
                score = 0;
        }

        return {
            isCorrect,
            score: Math.round(score * 10) / 10 // 四捨五入到一位小數
        };
    }

    // 子問題評分
    function gradeSubQuestion(subQuestion, userAnswer, maxScore) {
        if (!subQuestion || userAnswer === undefined) {
            return { isCorrect: false, score: 0 };
        }

        let isCorrect = false;
        let score = 0;

        switch (subQuestion.type) {
            case 'true_false':
                isCorrect = userAnswer === subQuestion.answer;
                score = isCorrect ? maxScore : 0;
                break;

            case 'single_choice':
                isCorrect = parseInt(userAnswer) === subQuestion.answer;
                score = isCorrect ? maxScore : 0;
                break;

            case 'multiple_choice':
                // 多選題部分給分
                if (Array.isArray(userAnswer) && Array.isArray(subQuestion.answer)) {
                    const correctCount = userAnswer.filter(a => subQuestion.answer.includes(parseInt(a))).length;
                    const wrongCount = userAnswer.length - correctCount;

                    if (correctCount === subQuestion.answer.length && wrongCount === 0) {
                        isCorrect = true;
                        score = maxScore;
                    } else if (correctCount > 0) {
                        isCorrect = false;
                        const correctRatio = correctCount / subQuestion.answer.length;
                        const penalty = wrongCount * 0.2; // 每選錯一個扣20%
                        score = Math.max(0, maxScore * (correctRatio - penalty));
                    }
                }
                break;

            case 'fill_blank':
                isCorrect = userAnswer.trim().toLowerCase() === subQuestion.answer.trim().toLowerCase();
                score = isCorrect ? maxScore : 0;
                break;

            default:
                isCorrect = false;
                score = 0;
        }

        return {
            isCorrect,
            score: Math.round(score * 10) / 10 // 四捨五入到一位小數
        };
    }

    // 計算字符串相似度 (簡單版本)
    function calculateStringSimilarity(s1, s2) {
        if (s1.length === 0 || s2.length === 0) {
            return 0;
        }

        // 計算Levenshtein距離的簡化版本
        const len1 = s1.length;
        const len2 = s2.length;

        // 創建距離矩陣
        const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

        // 初始化第一行和第一列
        for (let i = 0; i <= len1; i++) {
            matrix[i][0] = i;
        }
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }

        // 填充矩陣
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                if (s1[i - 1] === s2[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // 替換
                        matrix[i][j - 1] + 1,     // 插入
                        matrix[i - 1][j] + 1      // 刪除
                    );
                }
            }
        }

        // 計算相似度
        const maxLen = Math.max(len1, len2);
        const distance = matrix[len1][len2];

        return (maxLen - distance) / maxLen;
    }

    // 格式化用戶答案
    function formatUserAnswer(question, userAnswer) {
        if (userAnswer === undefined || userAnswer === null) {
            return '未作答';
        }

        switch (question.type) {
            case QUESTION_TYPES.TRUE_FALSE:
                return userAnswer ? '正確' : '錯誤';

            case QUESTION_TYPES.SINGLE_CHOICE:
                if (userAnswer >= 0 && userAnswer < question.options.length) {
                    return `${String.fromCharCode(65 + parseInt(userAnswer))}. ${question.options[userAnswer]}`;
                }
                return '無效答案';

            case QUESTION_TYPES.MULTIPLE_CHOICE:
                if (Array.isArray(userAnswer) && userAnswer.length > 0) {
                    return userAnswer
                        .filter(idx => idx >= 0 && idx < question.options.length)
                        .map(idx => `${String.fromCharCode(65 + parseInt(idx))}. ${question.options[idx]}`)
                        .join('、');
                }
                return '無效答案';

            case QUESTION_TYPES.FILL_BLANK:
                if (Array.isArray(userAnswer)) {
                    return userAnswer.join('、');
                }
                return userAnswer;

            case QUESTION_TYPES.SHORT_ANSWER:
            case QUESTION_TYPES.MEMORY:
                return userAnswer;

            case QUESTION_TYPES.SPEED_READING:
                // 速讀題不直接顯示用戶答案，需要單獨處理
                return '查看子問題答案';

            default:
                return '未知答案格式';
        }
    }

    // 獲取考試結果列表
    function getExamResults() {
        return [...examResults];
    }

    // 獲取特定考試結果
    function getExamResult(resultId) {
        return examResults.find(r => r.id === resultId);
    }

    // 獲取特定考試
    function getExam(examId) {
        return exams.find(e => e.id === examId);
    }

    // 獲取題目列表
    function getQuestions(filters = {}) {
        let filteredQuestions = [...questions];

        // 應用篩選條件
        if (filters.academic_year) {
            filteredQuestions = filteredQuestions.filter(q => q.academic_year === filters.academic_year);
        }

        if (filters.subject) {
            filteredQuestions = filteredQuestions.filter(q => q.subject === filters.subject);
        }

        if (filters.type) {
            filteredQuestions = filteredQuestions.filter(q => q.type === filters.type);
        }

        if (filters.difficulty) {
            filteredQuestions = filteredQuestions.filter(q => q.difficulty === filters.difficulty);
        }

        if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
            filteredQuestions = filteredQuestions.filter(q =>
                q.tags && filters.tags.some(tag => q.tags.includes(tag))
            );
        }

        return filteredQuestions;
    }

    // 獲取特定題目
    function getQuestion(questionId) {
        return questions.find(q => q.id === questionId);
    }

    // 驗證題目格式
    function validateQuestion(question) {
        // 基本檢查
        if (!question.type || !question.content) {
            console.error('題目缺少必要字段：type 或 content');
            return false;
        }

        // 根據題目類型驗證
        switch (question.type) {
            case QUESTION_TYPES.TRUE_FALSE:
                if (typeof question.answer !== 'boolean') {
                    console.error('是非題答案必須為布爾值');
                    return false;
                }
                break;

            case QUESTION_TYPES.SINGLE_CHOICE:
                if (!Array.isArray(question.options) || question.options.length < 2) {
                    console.error('單選題必須提供至少2個選項');
                    return false;
                }
                if (typeof question.answer !== 'number' || question.answer < 0 || question.answer >= question.options.length) {
                    console.error('單選題答案必須為有效的選項索引');
                    return false;
                }
                break;

            case QUESTION_TYPES.MULTIPLE_CHOICE:
                if (!Array.isArray(question.options) || question.options.length < 2) {
                    console.error('多選題必須提供至少2個選項');
                    return false;
                }
                if (!Array.isArray(question.answer) || question.answer.length === 0) {
                    console.error('多選題答案必須為非空數組');
                    return false;
                }
                for (const idx of question.answer) {
                    if (typeof idx !== 'number' || idx < 0 || idx >= question.options.length) {
                        console.error('多選題答案包含無效的選項索引');
                        return false;
                    }
                }
                break;

            case QUESTION_TYPES.FILL_BLANK:
                if (!question.answer) {
                    console.error('填空題必須提供答案');
                    return false;
                }
                break;

            case QUESTION_TYPES.SHORT_ANSWER:
                if (!question.answer) {
                    console.error('簡答題必須提供參考答案');
                    return false;
                }
                break;

            case QUESTION_TYPES.SPEED_READING:
                if (!question.reading_content) {
                    console.error('速讀題必須提供閱讀內容');
                    return false;
                }
                if (!Array.isArray(question.sub_questions) || question.sub_questions.length === 0) {
                    console.error('速讀題必須包含至少一個子問題');
                    return false;
                }
                // 驗證子問題
                for (const subQ of question.sub_questions) {
                    if (!subQ.content || !subQ.type || subQ.answer === undefined) {
                        console.error('子問題缺少必要字段');
                        return false;
                    }
                }
                break;

            case QUESTION_TYPES.MEMORY:
                if (!question.memory_content || !question.answer) {
                    console.error('記憶題必須提供記憶內容和答案');
                    return false;
                }
                break;

            default:
                console.error(`不支持的題目類型：${question.type}`);
                return false;
        }

        return true;
    }

    // 生成唯一ID
    function generateUniqueId(prefix = '') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    // 公開API
    return {
        init,
        QUESTION_TYPES,
        DIFFICULTY_LEVELS,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        getQuestions,
        getQuestion,
        updateQuestionsList,
        viewQuestion,
        generateExam,
        getExam,
        startExam,
        submitExamResult,
        getExamResults,
        getExamResult,
        formatAnswer,
        formatUserAnswer,
        saveQuestionsToStorage,
        saveExamsToStorage,
        saveResultsToStorage
    };
})();

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function () {
    ExamSystem.init();

    // 將實例附加到全局對象，方便其他模塊訪問
    window.examSystem = ExamSystem;
});
