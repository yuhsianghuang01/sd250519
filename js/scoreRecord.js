/**
 * 成績記錄模組
 * 提供成績統計、分析和視覺化
 */

(function () {
    // 使用localStorage儲存數據
    const LOCAL_STORAGE_KEY = 'sd_score_records';

    // 從localStorage獲取數據，如果不存在則初始化
    const getScoreRecords = () => {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    };

    // 將數據儲存到localStorage
    const saveScoreRecords = (records) => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    };

    // 初始化數據
    let scoreRecords = getScoreRecords();

    // 如果没有任何数据，添加一些示例数据
    if (scoreRecords.length === 0) {
        scoreRecords = [
            {
                id: 's1',
                subject: 'math',
                academic_year: '國一',
                title: '數學期中考前測驗',
                score: 85,
                total_score: 100,
                date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14天前
                details: [
                    { category: '代數', score: 25, total: 30 },
                    { category: '幾何', score: 28, total: 30 },
                    { category: '統計', score: 32, total: 40 }
                ]
            },
            {
                id: 's2',
                subject: 'english',
                academic_year: '國一',
                title: '英文單字測驗',
                score: 90,
                total_score: 100,
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天前
                details: [
                    { category: '詞彙', score: 40, total: 50 },
                    { category: '文法', score: 50, total: 50 }
                ]
            }
        ];
        saveScoreRecords(scoreRecords);
    }

    // 公開的API
    window.scoreRecord = {
        // 添加新成績
        addScore: function (scoreData) {
            // 確保有ID
            if (!scoreData.id) {
                scoreData.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            }

            // 確保有日期
            if (!scoreData.date) {
                scoreData.date = new Date().toISOString();
            }

            scoreRecords.push(scoreData);
            saveScoreRecords(scoreRecords);
            return scoreData;
        },

        // 獲取所有成績記錄
        getAllScores: function (filters = {}) {
            let filteredRecords = [...scoreRecords];

            // 按科目過濾
            if (filters.subject) {
                filteredRecords = filteredRecords.filter(record => record.subject === filters.subject);
            }

            // 按學年過濾
            if (filters.academic_year) {
                filteredRecords = filteredRecords.filter(record => record.academic_year === filters.academic_year);
            }

            // 按時間範圍過濾
            if (filters.startDate && filters.endDate) {
                const start = new Date(filters.startDate);
                const end = new Date(filters.endDate);

                filteredRecords = filteredRecords.filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate >= start && recordDate <= end;
                });
            }

            return filteredRecords;
        },

        // 獲取特定成績記錄
        getScore: function (scoreId) {
            return scoreRecords.find(record => record.id === scoreId);
        },

        // 刪除成績記錄
        deleteScore: function (scoreId) {
            const index = scoreRecords.findIndex(record => record.id === scoreId);
            if (index !== -1) {
                scoreRecords.splice(index, 1);
                saveScoreRecords(scoreRecords);
                return true;
            }
            return false;
        },

        // 更新成績記錄
        updateScore: function (scoreId, newData) {
            const index = scoreRecords.findIndex(record => record.id === scoreId);
            if (index !== -1) {
                // 更新數據但保留ID
                scoreRecords[index] = { ...scoreRecords[index], ...newData, id: scoreId };
                saveScoreRecords(scoreRecords);
                return true;
            }
            return false;
        },

        // 獲取成績統計
        getStatistics: function (filters = {}) {
            const filteredRecords = this.getAllScores(filters);

            if (filteredRecords.length === 0) {
                return {
                    count: 0,
                    averageScore: 0,
                    highestScore: 0,
                    lowestScore: 0,
                    distribution: []
                };
            }

            // 計算統計數據
            const scores = filteredRecords.map(record => record.score);
            const totalScore = scores.reduce((sum, score) => sum + score, 0);

            return {
                count: filteredRecords.length,
                averageScore: totalScore / filteredRecords.length,
                highestScore: Math.max(...scores),
                lowestScore: Math.min(...scores),
                distribution: this._calculateDistribution(scores)
            };
        },

        // 計算分數分佈
        _calculateDistribution: function (scores) {
            const distribution = [
                { range: '0-59', count: 0 },
                { range: '60-69', count: 0 },
                { range: '70-79', count: 0 },
                { range: '80-89', count: 0 },
                { range: '90-100', count: 0 }
            ];

            scores.forEach(score => {
                if (score < 60) {
                    distribution[0].count++;
                } else if (score < 70) {
                    distribution[1].count++;
                } else if (score < 80) {
                    distribution[2].count++;
                } else if (score < 90) {
                    distribution[3].count++;
                } else {
                    distribution[4].count++;
                }
            });

            return distribution;
        },

        // 獲取成績趨勢數據
        getTrendData: function (filters = {}) {
            const filteredRecords = this.getAllScores(filters);

            // 按日期排序
            const sortedRecords = [...filteredRecords].sort((a, b) =>
                new Date(a.date) - new Date(b.date)
            );

            return sortedRecords.map(record => ({
                date: new Date(record.date).toLocaleDateString('zh-TW'),
                score: record.score,
                subject: record.subject,
                title: record.title
            }));
        },

        // 獲取科目表現分析
        getSubjectPerformance: function () {
            const subjectGroups = {};

            // 按科目分組
            scoreRecords.forEach(record => {
                if (!subjectGroups[record.subject]) {
                    subjectGroups[record.subject] = [];
                }
                subjectGroups[record.subject].push(record);
            });

            // 計算每個科目的平均分
            const result = [];
            for (const subject in subjectGroups) {
                const records = subjectGroups[subject];
                const avgScore = records.reduce((sum, r) => sum + r.score, 0) / records.length;

                result.push({
                    subject,
                    averageScore: avgScore,
                    count: records.length
                });
            }

            return result;
        },

        // 初始化模組
        init: function () {
            // 確保有示例數據
            if (scoreRecords.length === 0) {
                this._loadSampleData();
            }
        },

        // 載入示例數據
        _loadSampleData: function () {
            scoreRecords = [
                {
                    id: 's1',
                    subject: 'math',
                    academic_year: '國一',
                    title: '數學期中考前測驗',
                    score: 85,
                    total_score: 100,
                    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                    details: [
                        { category: '代數', score: 25, total: 30 },
                        { category: '幾何', score: 28, total: 30 },
                        { category: '統計', score: 32, total: 40 }
                    ]
                },
                {
                    id: 's2',
                    subject: 'english',
                    academic_year: '國一',
                    title: '英文單字測驗',
                    score: 90,
                    total_score: 100,
                    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    details: [
                        { category: '詞彙', score: 40, total: 50 },
                        { category: '文法', score: 50, total: 50 }
                    ]
                }
            ];
            saveScoreRecords(scoreRecords);
        }
    };
})();
