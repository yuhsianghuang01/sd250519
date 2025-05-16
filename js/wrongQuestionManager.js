/**
 * 錯題管理模組
 * 提供錯題收集、整理、複習功能
 */

(function () {
    // 使用localStorage儲存數據
    const LOCAL_STORAGE_KEY = 'sd_wrong_questions';

    // 從localStorage獲取數據，如果不存在則初始化
    const getWrongQuestions = () => {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    };

    // 將數據儲存到localStorage
    const saveWrongQuestions = (questions) => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(questions));
    };

    // 初始化數據
    let wrongQuestions = getWrongQuestions();

    // 如果没有任何数据，添加一些示例数据
    if (wrongQuestions.length === 0) {
        wrongQuestions = [
            {
                id: 'w1',
                question_id: 'q1',
                question_content: '下列哪一個數是質數？',
                subject: 'math',
                chapter: '數與量',
                difficulty: 'easy',
                academic_year: '國一',
                first_wrong_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                last_wrong_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                wrong_count: 2,
                wrong_answers: [
                    {
                        answer: '9',
                        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        answer: '15',
                        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ],
                correct_answer: '17'
            }
        ];
        saveWrongQuestions(wrongQuestions);
    }

    // 公開的API
    window.wrongQuestionManager = {
        // 添加錯題
        addWrongQuestion: function (questionData) {
            // 檢查是否已存在
            const existingIndex = wrongQuestions.findIndex(q => q.question_id === questionData.question_id);

            if (existingIndex !== -1) {
                // 更新錯題信息
                wrongQuestions[existingIndex].wrong_count++;
                wrongQuestions[existingIndex].last_wrong_date = new Date().toISOString();
                if (questionData.user_answer !== undefined) {
                    wrongQuestions[existingIndex].wrong_answers.push({
                        answer: questionData.user_answer,
                        date: new Date().toISOString()
                    });
                }
            } else {
                // 添加新錯題
                const newWrongQuestion = {
                    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                    question_id: questionData.question_id,
                    question_content: questionData.question_content || '',
                    subject: questionData.subject,
                    chapter: questionData.chapter || '',
                    difficulty: questionData.difficulty,
                    academic_year: questionData.academic_year || '',
                    first_wrong_date: new Date().toISOString(),
                    last_wrong_date: new Date().toISOString(),
                    wrong_count: 1,
                    wrong_answers: [],
                    correct_answer: questionData.correct_answer || ''
                };

                if (questionData.user_answer !== undefined) {
                    newWrongQuestion.wrong_answers.push({
                        answer: questionData.user_answer,
                        date: new Date().toISOString()
                    });
                }

                wrongQuestions.push(newWrongQuestion);
            }

            saveWrongQuestions(wrongQuestions);
            return true;
        },

        // 獲取所有錯題
        getAllWrongQuestions: function (filters = {}) {
            let filteredQuestions = [...wrongQuestions];

            // 按科目過濾
            if (filters.subject) {
                filteredQuestions = filteredQuestions.filter(q => q.subject === filters.subject);
            }

            // 按章節過濾
            if (filters.chapter) {
                filteredQuestions = filteredQuestions.filter(q => q.chapter === filters.chapter);
            }

            // 按難度過濾
            if (filters.difficulty) {
                filteredQuestions = filteredQuestions.filter(q => q.difficulty === filters.difficulty);
            }

            // 按學年過濾
            if (filters.academic_year) {
                filteredQuestions = filteredQuestions.filter(q => q.academic_year === filters.academic_year);
            }

            // 按時間範圍過濾
            if (filters.startDate && filters.endDate) {
                const start = new Date(filters.startDate);
                const end = new Date(filters.endDate);

                filteredQuestions = filteredQuestions.filter(q => {
                    const lastWrongDate = new Date(q.last_wrong_date);
                    return lastWrongDate >= start && lastWrongDate <= end;
                });
            }

            return filteredQuestions;
        },

        // 獲取特定錯題
        getWrongQuestion: function (id) {
            return wrongQuestions.find(q => q.id === id);
        },

        // 按原題ID獲取錯題
        getWrongQuestionByOriginalId: function (questionId) {
            return wrongQuestions.find(q => q.question_id === questionId);
        },

        // 刪除錯題
        deleteWrongQuestion: function (id) {
            const index = wrongQuestions.findIndex(q => q.id === id);
            if (index !== -1) {
                wrongQuestions.splice(index, 1);
                saveWrongQuestions(wrongQuestions);
                return true;
            }
            return false;
        },

        // 標記錯題為已掌握
        markAsMastered: function (id) {
            const index = wrongQuestions.findIndex(q => q.id === id);
            if (index !== -1) {
                wrongQuestions.splice(index, 1);

                // 可以選擇將此題添加到已掌握列表
                // ...這裡可以添加更多邏輯...

                saveWrongQuestions(wrongQuestions);
                return true;
            }
            return false;
        },

        // 獲取錯題分析統計
        getWrongQuestionStatistics: function () {
            if (wrongQuestions.length === 0) {
                return {
                    total: 0,
                    bySubject: [],
                    byDifficulty: [],
                    mostCommon: []
                };
            }

            // 按科目統計
            const subjectCounts = {};
            wrongQuestions.forEach(q => {
                subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
            });

            const bySubject = Object.keys(subjectCounts).map(subject => ({
                subject,
                count: subjectCounts[subject]
            }));

            // 按難度統計
            const difficultyCounts = {};
            wrongQuestions.forEach(q => {
                difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
            });

            const byDifficulty = Object.keys(difficultyCounts).map(difficulty => ({
                difficulty,
                count: difficultyCounts[difficulty]
            }));

            // 按章節統計
            const chapterCounts = {};
            wrongQuestions.forEach(q => {
                if (q.chapter) {
                    chapterCounts[q.chapter] = (chapterCounts[q.chapter] || 0) + 1;
                }
            });

            const byChapter = Object.keys(chapterCounts).map(chapter => ({
                chapter,
                count: chapterCounts[chapter]
            })).sort((a, b) => b.count - a.count);

            // 最常錯的題目
            const sortedByCount = [...wrongQuestions].sort((a, b) => b.wrong_count - a.wrong_count);
            const mostCommon = sortedByCount.slice(0, 5);

            return {
                total: wrongQuestions.length,
                bySubject,
                byDifficulty,
                byChapter,
                mostCommon
            };
        },

        // 生成錯題複習計畫
        generateReviewPlan: function () {
            if (wrongQuestions.length === 0) {
                return [];
            }

            // 按最近錯誤日期排序
            const sortedByDate = [...wrongQuestions].sort((a, b) =>
                new Date(b.last_wrong_date) - new Date(a.last_wrong_date)
            );

            // 分成三個階段：近期(1-3天)、中期(4-7天)、長期(8天以上)
            const now = new Date();
            const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const shortTerm = [];
            const mediumTerm = [];
            const longTerm = [];

            sortedByDate.forEach(q => {
                const lastWrongDate = new Date(q.last_wrong_date);

                if (lastWrongDate >= threeDaysAgo) {
                    shortTerm.push(q);
                } else if (lastWrongDate >= sevenDaysAgo) {
                    mediumTerm.push(q);
                } else {
                    longTerm.push(q);
                }
            });

            return [
                {
                    phase: 'short',
                    title: '近期複習（1-3天）',
                    questions: shortTerm
                },
                {
                    phase: 'medium',
                    title: '中期複習（4-7天）',
                    questions: mediumTerm
                },
                {
                    phase: 'long',
                    title: '長期複習（8天以上）',
                    questions: longTerm
                }
            ];
        },

        // 初始化模組
        init: function () {
            // 確保有示例數據
            if (wrongQuestions.length === 0) {
                this._loadSampleData();
            }
        },

        // 載入示例數據
        _loadSampleData: function () {
            wrongQuestions = [
                {
                    id: 'w1',
                    question_id: 'q1',
                    question_content: '下列哪一個數是質數？',
                    subject: 'math',
                    chapter: '數與量',
                    difficulty: 'easy',
                    academic_year: '國一',
                    first_wrong_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                    last_wrong_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    wrong_count: 2,
                    wrong_answers: [
                        {
                            answer: '9',
                            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
                        },
                        {
                            answer: '15',
                            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                        }
                    ],
                    correct_answer: '17'
                }
            ];
            saveWrongQuestions(wrongQuestions);
        }
    };
})();
