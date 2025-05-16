/**
 * 考試系統模組
 * 提供試卷生成、題目管理、成績記錄等功能
 */

(function () {
    // 使用localStorage儲存數據
    const LOCAL_STORAGE_KEYS = {
        EXAMS: 'sd_exams',
        QUESTIONS: 'sd_questions',
        RESULTS: 'sd_exam_results'
    };

    // 從localStorage獲取數據，如果不存在則初始化
    const getDataFromStorage = (key, defaultValue = []) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    };

    // 將數據儲存到localStorage
    const saveDataToStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    // 生成唯一ID
    const generateId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    };

    // 初始化數據
    let exams = getDataFromStorage(LOCAL_STORAGE_KEYS.EXAMS);
    let questions = getDataFromStorage(LOCAL_STORAGE_KEYS.QUESTIONS);
    let examResults = getDataFromStorage(LOCAL_STORAGE_KEYS.RESULTS);

    // 如果没有任何数据，添加一些示例数据
    if (questions.length === 0) {
        questions = [
            {
                id: 'q1',
                type: 'single_choice',
                subject: 'math',
                academic_year: '國一',
                content: '下列哪一個數是質數？',
                options: ['9', '15', '17', '21'],
                answer: 2, // 索引2對應選項'17'
                difficulty: 'easy',
                chapter: '數與量',
                time_limit: 60,
                explanation: '質數是只能被1和自身整除的數。17只能被1和17整除，所以是質數。',
                tags: ['質數', '數論', '基礎數學']
            },
            {
                id: 'q2',
                type: 'true_false',
                subject: 'science',
                academic_year: '國二',
                content: '聲音在真空中能夠傳播。',
                answer: false,
                difficulty: 'medium',
                chapter: '聲音',
                time_limit: 30,
                explanation: '聲音是一種機械波，需要介質才能傳播。在真空中沒有介質，所以聲音無法傳播。',
                tags: ['聲音', '物理', '波動']
            },
            {
                id: 'q3',
                type: 'multiple_choice',
                subject: 'chinese',
                academic_year: '國三',
                content: '下列詞語中，哪些含有錯別字？',
                options: ['博覽群書', '不脛而走', '每況愈下', '首當其衝'],
                answer: [1], // 索引1對應'不脛而走'，正確應為'不逞而走'
                difficulty: 'hard',
                chapter: '字形辨識',
                time_limit: 90,
                explanation: '「不脛而走」是正確的，形容消息傳播快。',
                tags: ['錯別字', '成語', '語文']
            }
        ];
        saveDataToStorage(LOCAL_STORAGE_KEYS.QUESTIONS, questions);
    }

    if (exams.length === 0) {
        exams = [
            {
                id: 'e1',
                title: '數學基礎能力測驗',
                description: '國一基礎數學综合測驗',
                subject: 'math',
                academic_year: '國一',
                total_time: 60,
                total_score: 100,
                difficulty: 'medium',
                created_at: new Date().toISOString(),
                question_ids: ['q1']
            }
        ];
        saveDataToStorage(LOCAL_STORAGE_KEYS.EXAMS, exams);
    }

    if (examResults.length === 0) {
        examResults = [
            {
                id: 'r1',
                exam_id: 'e1',
                date: new Date().toISOString(),
                score: 85,
                total_score: 100,
                time_used: 45,
                answers: [
                    {
                        question_id: 'q1',
                        user_answer: 2,
                        correct: true,
                        time_used: 45
                    }
                ]
            }
        ];
        saveDataToStorage(LOCAL_STORAGE_KEYS.RESULTS, examResults);
    }

    // 公開的API
    window.examSystem = {
        // 獲取所有試卷，可以傳入過濾條件
        getExams: function (filters = {}) {
            let filteredExams = [...exams];

            if (filters.subject) {
                filteredExams = filteredExams.filter(exam => exam.subject === filters.subject);
            }

            if (filters.status === 'completed') {
                const completedExamIds = examResults.map(result => result.exam_id);
                filteredExams = filteredExams.filter(exam => completedExamIds.includes(exam.id));
            } else if (filters.status === 'pending') {
                const completedExamIds = examResults.map(result => result.exam_id);
                filteredExams = filteredExams.filter(exam => !completedExamIds.includes(exam.id));
            }

            return filteredExams;
        },

        // 獲取特定試卷
        getExam: function (examId) {
            return exams.find(exam => exam.id === examId);
        },

        // 獲取所有問題，可以傳入過濾條件
        getQuestions: function (filters = {}) {
            let filteredQuestions = [...questions];

            if (filters.subject) {
                filteredQuestions = filteredQuestions.filter(q => q.subject === filters.subject);
            }

            if (filters.type) {
                filteredQuestions = filteredQuestions.filter(q => q.type === filters.type);
            }

            if (filters.difficulty) {
                filteredQuestions = filteredQuestions.filter(q => q.difficulty === filters.difficulty);
            }

            if (filters.searchTerm) {
                const term = filters.searchTerm.toLowerCase();
                filteredQuestions = filteredQuestions.filter(q =>
                    q.content.toLowerCase().includes(term) ||
                    q.tags.some(tag => tag.toLowerCase().includes(term))
                );
            }

            return filteredQuestions;
        },

        // 獲取特定問題
        getQuestion: function (questionId) {
            return questions.find(q => q.id === questionId);
        },

        // 獲取所有考試結果，可以傳入過濾條件
        getExamResults: function (filters = {}) {
            let filteredResults = [...examResults];

            if (filters.subject) {
                const subjectExamIds = exams
                    .filter(exam => exam.subject === filters.subject)
                    .map(exam => exam.id);
                filteredResults = filteredResults.filter(result => subjectExamIds.includes(result.exam_id));
            }

            if (filters.dateRange) {
                const now = new Date();
                let startDate;

                if (filters.dateRange === 'week') {
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                } else if (filters.dateRange === 'month') {
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                } else if (filters.dateRange === 'quarter') {
                    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                }

                if (startDate) {
                    filteredResults = filteredResults.filter(result => new Date(result.date) >= startDate);
                }
            }

            return filteredResults;
        },

        // 獲取特定考試結果
        getExamResult: function (resultId) {
            return examResults.find(result => result.id === resultId);
        },

        // 生成新試卷
        generateExam: function (config) {
            const newExam = {
                id: generateId(),
                title: config.title,
                description: config.description,
                subject: config.subject,
                academic_year: config.academicYear,
                total_time: config.totalTime,
                total_score: config.totalScore,
                difficulty: config.difficulty,
                created_at: new Date().toISOString(),
                question_ids: []
            };

            // 選擇符合條件的問題
            const eligibleQuestions = questions.filter(q =>
                q.subject === config.subject &&
                q.academic_year === config.academicYear &&
                (config.difficulty === 'mixed' || q.difficulty === config.difficulty) &&
                config.questionTypes.includes(q.type)
            );

            // 如果沒有符合條件的問題，返回錯誤提示
            if (eligibleQuestions.length === 0) {
                alert('找不到符合條件的題目，請調整條件或添加更多題目！');
                return null;
            }

            // 隨機選擇問題，按題型分配數量
            if (eligibleQuestions.length > 0) {
                const typeDistribution = this._calculateTypeDistribution(config.questionTypes, config.questionsCount, eligibleQuestions);
                let selectedIds = [];

                for (const type in typeDistribution) {
                    const typeQuestions = eligibleQuestions.filter(q => q.type === type);
                    // 洗牌該類型的題目
                    const shuffled = [...typeQuestions].sort(() => 0.5 - Math.random());
                    const count = Math.min(typeDistribution[type], shuffled.length);

                    // 添加該類型的題目ID
                    selectedIds = selectedIds.concat(shuffled.slice(0, count).map(q => q.id));
                }

                newExam.question_ids = selectedIds;

                // 如果選擇的題目數量少於要求數量，提示用戶
                if (newExam.question_ids.length < config.questionsCount) {
                    alert(`由於題庫中符合條件的題目不足，只能生成含有 ${newExam.question_ids.length} 道題目的試卷（原要求 ${config.questionsCount} 道題目）。`);
                }
            }

            // 如果沒有選到任何題目，返回錯誤提示
            if (newExam.question_ids.length === 0) {
                alert('試卷生成失敗，未能選到任何題目！');
                return null;
            }

            // 儲存新試卷
            exams.push(newExam);
            saveDataToStorage(LOCAL_STORAGE_KEYS.EXAMS, exams);

            return newExam;
        },

        // 計算題型分配
        _calculateTypeDistribution: function (selectedTypes, totalCount, availableQuestions) {
            const distribution = {};
            const typeCounts = {};

            // 計算每個題型的可用數量
            selectedTypes.forEach(type => {
                const count = availableQuestions.filter(q => q.type === type).length;
                typeCounts[type] = count;
                distribution[type] = 0;
            });

            // 初始平均分配
            let remainingCount = totalCount;
            let remainingTypes = selectedTypes.length;

            selectedTypes.forEach(type => {
                // 按比例分配數量，但不超過可用數量
                const share = Math.min(Math.floor(remainingCount / remainingTypes), typeCounts[type]);
                distribution[type] = share;
                remainingCount -= share;
                remainingTypes--;
            });

            // 處理剩餘的題目數量
            if (remainingCount > 0) {
                // 再次遍歷，分配剩餘數量給還有空間的題型
                for (const type of selectedTypes) {
                    const additional = Math.min(remainingCount, typeCounts[type] - distribution[type]);
                    if (additional > 0) {
                        distribution[type] += additional;
                        remainingCount -= additional;
                        if (remainingCount === 0) break;
                    }
                }
            }

            return distribution;
        },

        // 添加新問題
        addQuestion: function (questionData) {
            const newQuestion = {
                id: generateId(),
                type: questionData.type,
                subject: questionData.subject,
                academic_year: questionData.academic_year,
                content: questionData.content,
                difficulty: questionData.difficulty,
                chapter: questionData.chapter || '',
                time_limit: questionData.time_limit || 60,
                explanation: questionData.explanation || '',
                tags: questionData.tags || []
            };

            // 根據題型處理選項和答案
            switch (questionData.type) {
                case 'true_false':
                    newQuestion.answer = questionData.answer;
                    break;

                case 'single_choice':
                case 'multiple_choice':
                    newQuestion.options = questionData.options;
                    newQuestion.answer = questionData.answer;
                    break;

                case 'fill_blank':
                    newQuestion.answer = questionData.answer;
                    break;

                case 'short_answer':
                    newQuestion.answer = questionData.answer;
                    newQuestion.keywords = questionData.keywords || [];
                    break;
            }

            // 儲存新問題
            questions.push(newQuestion);
            saveDataToStorage(LOCAL_STORAGE_KEYS.QUESTIONS, questions);

            return true;
        },

        // 刪除問題
        deleteQuestion: function (questionId) {
            const index = questions.findIndex(q => q.id === questionId);
            if (index !== -1) {
                questions.splice(index, 1);
                saveDataToStorage(LOCAL_STORAGE_KEYS.QUESTIONS, questions);

                // 同時從所有試卷中移除這個問題
                exams.forEach(exam => {
                    const qIndex = exam.question_ids.indexOf(questionId);
                    if (qIndex !== -1) {
                        exam.question_ids.splice(qIndex, 1);
                    }
                });
                saveDataToStorage(LOCAL_STORAGE_KEYS.EXAMS, exams);

                return true;
            }
            return false;
        },

        // 開始考試
        startExam: function (examId) {
            const exam = this.getExam(examId);
            if (!exam || exam.question_ids.length === 0) {
                if (window.sdUtils) {
                    window.sdUtils.showNotification('試卷不存在或沒有問題！', 'error');
                } else {
                    alert('試卷不存在或沒有問題！');
                }
                return false;
            }

            // 準備考試數據
            const examData = {
                id: exam.id,
                title: exam.title,
                questions: exam.question_ids.map(id => this.getQuestion(id)).filter(q => q !== undefined),
                totalTime: exam.total_time,
                totalScore: exam.total_score
            };

            // 儲存當前考試數據到 sessionStorage
            sessionStorage.setItem('current_exam', JSON.stringify(examData));

            // 在實際應用中，這裡應該跳轉到考試頁面
            // 例如：window.location.href = 'take-exam.html';

            // 暫時用alert模擬
            const message = `即將開始考試：${exam.title}，共${exam.question_ids.length}題，時間${exam.total_time}分鐘`;
            if (window.sdUtils) {
                window.sdUtils.showNotification(message, 'info');
            } else {
                alert(message);
            }

            return true;
        },

        // 刪除試卷
        deleteExam: function (examId) {
            const index = exams.findIndex(e => e.id === examId);
            if (index !== -1) {
                exams.splice(index, 1);
                saveDataToStorage(LOCAL_STORAGE_KEYS.EXAMS, exams);

                // 同時刪除這個試卷的所有結果
                examResults = examResults.filter(result => result.exam_id !== examId);
                saveDataToStorage(LOCAL_STORAGE_KEYS.RESULTS, examResults);

                return true;
            }
            return false;
        },

        // 刪除考試結果
        deleteExamResult: function (resultId) {
            const index = examResults.findIndex(r => r.id === resultId);
            if (index !== -1) {
                examResults.splice(index, 1);
                saveDataToStorage(LOCAL_STORAGE_KEYS.RESULTS, examResults);
                return true;
            }
            return false;
        },

        // 獲取題型分佈
        getQuestionTypeDistribution: function () {
            const typeCounts = {};
            questions.forEach(q => {
                typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
            });

            const typeDistribution = [
                { type: 'true_false', count: typeCounts.true_false || 0 },
                { type: 'single_choice', count: typeCounts.single_choice || 0 },
                { type: 'multiple_choice', count: typeCounts.multiple_choice || 0 },
                { type: 'fill_blank', count: typeCounts.fill_blank || 0 },
                { type: 'short_answer', count: typeCounts.short_answer || 0 }
            ];

            return typeDistribution;
        },

        // 學習分析
        analyzeLearning: function () {
            // 如果結果太少，返回空分析
            if (examResults.length < 3) {
                return [];
            }

            const analysis = [];

            // 分析1：趨勢分析
            const sortedResults = [...examResults].sort((a, b) => new Date(a.date) - new Date(b.date));
            const scores = sortedResults.map(r => (r.score / r.total_score) * 100);

            let trend = '穩定';
            if (scores.length >= 3) {
                const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
                const secondHalf = scores.slice(Math.floor(scores.length / 2));

                const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
                const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;

                if (secondAvg > firstAvg + 5) {
                    trend = '上升';
                } else if (secondAvg < firstAvg - 5) {
                    trend = '下降';
                }
            }

            analysis.push({
                title: '成績趨勢分析',
                content: `您的成績整體呈${trend}趨勢。` +
                    (trend === '上升' ? '繼續保持良好的學習習慣！' :
                        trend === '下降' ? '建議您重新檢視學習方法，加強薄弱環節。' :
                            '建議您嘗試更多不同類型的題目，拓展知識面。')
            });

            // 分析2：常見錯誤分析
            const wrongAnswers = [];
            examResults.forEach(result => {
                result.answers.forEach(answer => {
                    if (!answer.correct) {
                        const question = this.getQuestion(answer.question_id);
                        if (question) {
                            wrongAnswers.push({
                                subject: question.subject,
                                type: question.type,
                                difficulty: question.difficulty,
                                chapter: question.chapter
                            });
                        }
                    }
                });
            });

            // 分析錯誤題目的科目分佈
            const subjectCounts = {};
            wrongAnswers.forEach(a => {
                subjectCounts[a.subject] = (subjectCounts[a.subject] || 0) + 1;
            });

            let weakestSubject = '';
            let maxCount = 0;
            for (const subject in subjectCounts) {
                if (subjectCounts[subject] > maxCount) {
                    maxCount = subjectCounts[subject];
                    weakestSubject = subject;
                }
            }

            if (weakestSubject) {
                analysis.push({
                    title: '科目表現分析',
                    content: `您在${getSubjectName(weakestSubject)}科目的錯誤較多，建議多花時間複習這一科目。`
                });
            }

            // 分析3：難度分析
            const difficultyCounts = {};
            wrongAnswers.forEach(a => {
                difficultyCounts[a.difficulty] = (difficultyCounts[a.difficulty] || 0) + 1;
            });

            const totalWrong = wrongAnswers.length;
            let difficultyAnalysis = '您在不同難度的題目上表現均衡。';

            if (difficultyCounts.hard && difficultyCounts.hard / totalWrong > 0.5) {
                difficultyAnalysis = '您對進階難度的題目掌握不足，建議先鞏固基礎知識，再挑戰難題。';
            } else if (difficultyCounts.easy && difficultyCounts.easy / totalWrong > 0.3) {
                difficultyAnalysis = '您在基礎題目上出錯較多，建議重新學習基本概念和原理。';
            }

            analysis.push({
                title: '難度掌握分析',
                content: difficultyAnalysis
            });

            // 分析4：建議學習內容
            let subjectSuggestions = '';
            if (weakestSubject) {
                // 取得該科目的章節分析
                const chapterCounts = {};
                wrongAnswers.filter(a => a.subject === weakestSubject).forEach(a => {
                    if (a.chapter) {
                        chapterCounts[a.chapter] = (chapterCounts[a.chapter] || 0) + 1;
                    }
                });

                // 找出最弱的章節
                let weakestChapter = '';
                let maxChapterCount = 0;
                for (const chapter in chapterCounts) {
                    if (chapterCounts[chapter] > maxChapterCount) {
                        maxChapterCount = chapterCounts[chapter];
                        weakestChapter = chapter;
                    }
                }

                if (weakestChapter) {
                    subjectSuggestions = `建議重點複習${getSubjectName(weakestSubject)}的「${weakestChapter}」章節，這是您最容易出錯的部分。`;
                }
            }

            if (subjectSuggestions) {
                analysis.push({
                    title: '學習內容建議',
                    content: subjectSuggestions
                });
            }

            return analysis;
        },

        // 初始化系統
        init: function () {
            // 確保所有必要的數據都已載入
            if (questions.length === 0) {
                this._loadSampleQuestions();
            }
            if (exams.length === 0) {
                this._loadSampleExams();
            }
            if (examResults.length === 0) {
                this._loadSampleResults();
            }
            return true;
        },

        // 載入示例題目 (僅在數據為空時使用)
        _loadSampleQuestions: function () {
            questions = [
                {
                    id: 'q1',
                    type: 'single_choice',
                    subject: 'math',
                    academic_year: '國一',
                    content: '下列哪一個數是質數？',
                    options: ['9', '15', '17', '21'],
                    answer: 2, // 索引2對應選項'17'
                    difficulty: 'easy',
                    chapter: '數與量',
                    time_limit: 60,
                    explanation: '質數是只能被1和自身整除的數。17只能被1和17整除，所以是質數。',
                    tags: ['質數', '數論', '基礎數學']
                },
                // ...existing code...
            ];
            saveDataToStorage(LOCAL_STORAGE_KEYS.QUESTIONS, questions);
        },

        // 載入示例試卷 (僅在數據為空時使用)
        _loadSampleExams: function () {
            exams = [
                {
                    id: 'e1',
                    title: '數學基礎能力測驗',
                    description: '國一基礎數學综合測驗',
                    subject: 'math',
                    academic_year: '國一',
                    total_time: 60,
                    total_score: 100,
                    difficulty: 'medium',
                    created_at: new Date().toISOString(),
                    question_ids: ['q1']
                }
            ];
            saveDataToStorage(LOCAL_STORAGE_KEYS.EXAMS, exams);
        },

        // 載入示例結果 (僅在數據為空時使用)
        _loadSampleResults: function () {
            examResults = [
                {
                    id: 'r1',
                    exam_id: 'e1',
                    date: new Date().toISOString(),
                    score: 85,
                    total_score: 100,
                    time_used: 45,
                    answers: [
                        {
                            question_id: 'q1',
                            user_answer: 2,
                            correct: true,
                            time_used: 45
                        }
                    ]
                }
            ];
            saveDataToStorage(LOCAL_STORAGE_KEYS.RESULTS, examResults);
        },

        // 取得最近一次測驗的成績
        getLatestExamResult: function () {
            if (examResults.length === 0) return null;

            // 按日期排序，取最新的
            const sortedResults = [...examResults].sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            );

            return sortedResults[0];
        },

        // 取得累計測驗時間
        getTotalExamTime: function () {
            return examResults.reduce((total, result) => total + (result.time_used || 0), 0);
        },

        // 取得特定科目的平均分數
        getSubjectAverageScore: function (subject) {
            const subjectResults = examResults.filter(result => {
                const exam = this.getExam(result.exam_id);
                return exam && exam.subject === subject;
            });

            if (subjectResults.length === 0) return 0;

            const totalScore = subjectResults.reduce((sum, result) => sum + result.score, 0);
            return totalScore / subjectResults.length;
        }
    };

    // 輔助函數
    function getSubjectName(subject) {
        const subjectNames = {
            chinese: '國文',
            english: '英文',
            math: '數學',
            science: '自然',
            social: '社會'
        };
        return subjectNames[subject] || '未知';
    }
})();
