/**
 * 考前衝剌系統 - 成績記錄模組
 * 負責處理成績的新增、查詢、修改、刪除和統計分析
 */

// 成績記錄管理器
const ScoreRecordManager = (function () {
    // 私有變數
    let records = [];
    const STORAGE_KEY = 'exam_score_records';
    const JSON_FILE_PATH = '/sd/成績.json.txt';

    // 初始化函數
    function init() {
        loadFromStorage();
        setupEventListeners();
        updateScoresList();
        console.log('成績記錄模組初始化完成');
    }

    // 從存儲載入資料
    function loadFromStorage() {
        try {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                records = JSON.parse(storedData);
                console.log(`已從localStorage載入 ${records.length} 筆成績記錄`);
            } else {
                console.log('未找到本地成績記錄，使用空記錄初始化');
                records = [];
            }
        } catch (error) {
            console.error('載入成績記錄時發生錯誤:', error);
            records = [];
        }
    }

    // 保存資料到存儲
    function saveToStorage() {
        try {
            const jsonData = JSON.stringify(records);
            localStorage.setItem(STORAGE_KEY, jsonData);
            console.log('成績記錄已保存到localStorage');

            // 同時嘗試保存到文件
            saveToJsonFile(jsonData);
        } catch (error) {
            console.error('保存成績記錄時發生錯誤:', error);
        }
    }

    // 保存到JSON文件 (需要伺服器端支援)
    function saveToJsonFile(jsonData) {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/saveScoreData', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        console.log('成績記錄已保存到文件');
                    } else {
                        console.error('保存成績記錄到文件失敗:', xhr.statusText);
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
        // 添加成績記錄表單提交監聽
        const addScoreForm = document.getElementById('add-score-form');
        if (addScoreForm) {
            addScoreForm.addEventListener('submit', handleAddScoreSubmit);
        }

        // 排序和篩選控件監聽
        const sortSelector = document.getElementById('score-sort');
        if (sortSelector) {
            sortSelector.addEventListener('change', updateScoresList);
        }

        const filterControls = document.querySelectorAll('.score-filter');
        filterControls.forEach(control => {
            control.addEventListener('change', updateScoresList);
        });

        // 成績走勢圖區域互動
        const chartContainer = document.getElementById('score-trend-chart');
        if (chartContainer) {
            // 當點擊科目選擇時更新圖表
            const subjectSelectors = chartContainer.querySelectorAll('.subject-selector');
            subjectSelectors.forEach(selector => {
                selector.addEventListener('change', updateScoreTrendChart);
            });
        }
    }

    // 處理添加成績表單提交
    function handleAddScoreSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const scoreData = {
            academic_year: form.academic_year.value,
            subject: form.subject.value,
            exam_type: form.exam_type.value,
            exam_name: form.exam_name.value,
            date: form.date.value || new Date().toISOString().split('T')[0],
            score: parseFloat(form.score.value),
            total_score: parseFloat(form.total_score.value),
            rank: form.rank ? parseInt(form.rank.value, 10) : null,
            total_students: form.total_students ? parseInt(form.total_students.value, 10) : null,
            notes: form.notes ? form.notes.value : '',
        };

        if (addRecord(scoreData)) {
            form.reset();
            // 設置日期欄位為今天
            if (form.date) {
                form.date.value = new Date().toISOString().split('T')[0];
            }

            showFeedback('success', '成績添加成功！');
            updateScoresList();
            updateScoreTrendChart();
            updateScoreStats();
        } else {
            showFeedback('error', '成績數據無效，請檢查輸入');
        }
    }

    // 更新成績列表顯示
    function updateScoresList() {
        const scoresList = document.getElementById('scores-list');
        if (!scoresList) return;

        // 獲取排序和篩選條件
        const sortSelector = document.getElementById('score-sort');
        const sortBy = sortSelector ? sortSelector.value : 'date-desc';

        // 篩選條件
        const filters = {
            subject: document.getElementById('filter-subject') ?
                document.getElementById('filter-subject').value : null,
            academicYear: document.getElementById('filter-academic-year') ?
                document.getElementById('filter-academic-year').value : null,
            examType: document.getElementById('filter-exam-type') ?
                document.getElementById('filter-exam-type').value : null,
            startDate: document.getElementById('filter-start-date') ?
                document.getElementById('filter-start-date').value : null,
            endDate: document.getElementById('filter-end-date') ?
                document.getElementById('filter-end-date').value : null,
            searchTerm: document.getElementById('search-scores') ?
                document.getElementById('search-scores').value : null
        };

        // 過濾和排序成績記錄
        let filteredRecords = filterRecords(filters);
        filteredRecords = sortRecords(filteredRecords, sortBy);

        // 清空列表
        scoresList.innerHTML = '';

        if (filteredRecords.length === 0) {
            scoresList.innerHTML = '<tr><td colspan="7">尚無成績記錄</td></tr>';
            return;
        }

        // 生成成績列表HTML
        filteredRecords.forEach(record => {
            const row = document.createElement('tr');
            const percentage = ((record.score / record.total_score) * 100).toFixed(1);

            // 根據分數比例設置樣式
            if (percentage >= 90) {
                row.classList.add('excellent-score');
            } else if (percentage >= 80) {
                row.classList.add('good-score');
            } else if (percentage >= 60) {
                row.classList.add('pass-score');
            } else {
                row.classList.add('fail-score');
            }

            row.innerHTML = `
                <td>${record.date}</td>
                <td>${record.subject}</td>
                <td>${record.exam_name || record.exam_type}</td>
                <td>${record.score}/${record.total_score}</td>
                <td>${percentage}%</td>
                <td>${record.rank ? `${record.rank}/${record.total_students}` : '無數據'}</td>
                <td>
                    <button class="btn-view" data-id="${record.id}">查看</button>
                    <button class="btn-edit" data-id="${record.id}">編輯</button>
                    <button class="btn-delete" data-id="${record.id}">刪除</button>
                </td>
            `;

            // 添加事件處理
            const viewBtn = row.querySelector('.btn-view');
            const editBtn = row.querySelector('.btn-edit');
            const deleteBtn = row.querySelector('.btn-delete');

            if (viewBtn) viewBtn.addEventListener('click', () => viewScoreDetail(record.id));
            if (editBtn) editBtn.addEventListener('click', () => editScore(record.id));
            if (deleteBtn) deleteBtn.addEventListener('click', () => confirmDeleteScore(record.id));

            scoresList.appendChild(row);
        });

        // 更新統計信息
        updateScoreStats();
    }

    // 過濾成績記錄
    function filterRecords(filters = {}) {
        return records.filter(record => {
            // 按科目過濾
            if (filters.subject && filters.subject !== 'all' && record.subject !== filters.subject) {
                return false;
            }

            // 按學年過濾
            if (filters.academicYear && filters.academicYear !== 'all' && record.academic_year !== filters.academicYear) {
                return false;
            }

            // 按考試類型過濾
            if (filters.examType && filters.examType !== 'all' && record.exam_type !== filters.examType) {
                return false;
            }

            // 按日期範圍過濾
            if (filters.startDate && new Date(record.date) < new Date(filters.startDate)) {
                return false;
            }
            if (filters.endDate && new Date(record.date) > new Date(filters.endDate)) {
                return false;
            }

            // 按搜索詞過濾
            if (filters.searchTerm && filters.searchTerm.trim() !== '') {
                const searchTermLower = filters.searchTerm.toLowerCase();
                const nameMatch = record.exam_name && record.exam_name.toLowerCase().includes(searchTermLower);
                const noteMatch = record.notes && record.notes.toLowerCase().includes(searchTermLower);

                if (!nameMatch && !noteMatch) {
                    return false;
                }
            }

            return true;
        });
    }

    // 排序成績記錄
    function sortRecords(records, sortBy) {
        const sortedRecords = [...records];

        switch (sortBy) {
            case 'date-desc':
                sortedRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'date-asc':
                sortedRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'score-desc':
                sortedRecords.sort((a, b) => (b.score / b.total_score) - (a.score / a.total_score));
                break;
            case 'score-asc':
                sortedRecords.sort((a, b) => (a.score / a.total_score) - (b.score / b.total_score));
                break;
            case 'subject':
                sortedRecords.sort((a, b) => a.subject.localeCompare(b.subject));
                break;
            case 'rank-asc':
                // 只對有排名的記錄進行排序，無排名的放在後面
                sortedRecords.sort((a, b) => {
                    if (a.rank === null && b.rank === null) return 0;
                    if (a.rank === null) return 1;
                    if (b.rank === null) return -1;
                    return a.rank - b.rank;
                });
                break;
            case 'rank-desc':
                sortedRecords.sort((a, b) => {
                    if (a.rank === null && b.rank === null) return 0;
                    if (a.rank === null) return 1;
                    if (b.rank === null) return -1;
                    return b.rank - a.rank;
                });
                break;
        }

        return sortedRecords;
    }

    // 更新成績統計信息
    function updateScoreStats() {
        const statsContainer = document.getElementById('score-stats');
        if (!statsContainer) return;

        // 獲取各科目最新成績和平均分
        const subjects = [...new Set(records.map(r => r.subject))];
        const subjectStats = subjects.map(subject => {
            const subjectRecords = records.filter(r => r.subject === subject);
            const latestRecord = subjectRecords.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

            const scores = subjectRecords.map(r => (r.score / r.total_score) * 100);
            const avgScore = scores.length > 0 ?
                (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) :
                '無數據';

            // 計算趨勢 (最近3次考試)
            const recentRecords = subjectRecords
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3);

            let trend = null;
            if (recentRecords.length >= 2) {
                const latest = (recentRecords[0].score / recentRecords[0].total_score) * 100;
                const previous = (recentRecords[recentRecords.length - 1].score / recentRecords[recentRecords.length - 1].total_score) * 100;
                trend = latest - previous;
            }

            return {
                subject,
                latestRecord,
                avgScore,
                trend
            };
        });

        // 生成科目統計HTML
        let subjectStatsHtml = '';
        subjectStats.forEach(stat => {
            const latestPercentage = stat.latestRecord ?
                ((stat.latestRecord.score / stat.latestRecord.total_score) * 100).toFixed(1) :
                null;

            const trendIcon = stat.trend === null ? '' :
                stat.trend > 0 ? '<i class="trend-up">↑</i>' :
                    stat.trend < 0 ? '<i class="trend-down">↓</i>' :
                        '<i class="trend-stable">→</i>';

            const trendValue = stat.trend === null ? '' :
                `(${stat.trend > 0 ? '+' : ''}${stat.trend.toFixed(1)}%)`;

            subjectStatsHtml += `
                <div class="subject-stat">
                    <div class="subject-header">
                        <h4>${stat.subject}</h4>
                        <span class="subject-avg">平均: ${stat.avgScore}%</span>
                    </div>
                    <div class="score-progress">
                        <div class="progress-container">
                            <div class="progress-bar" style="width: ${latestPercentage || 0}%"></div>
                        </div>
                        <div class="progress-info">
                            <span class="latest-score">最新: ${latestPercentage ? latestPercentage + '%' : '無數據'}</span>
                            <span class="score-trend">${trendIcon} ${trendValue}</span>
                        </div>
                    </div>
                    <div class="subject-details">
                        <span class="latest-date">
                            ${stat.latestRecord ? `${stat.latestRecord.date} | ${stat.latestRecord.exam_type}` : ''}
                        </span>
                    </div>
                </div>
            `;
        });

        // 生成整體統計數據
        const recentCount = records.length >= 10 ? 10 : records.length;
        const overallAvg = records.length > 0 ?
            (records.reduce((sum, r) => sum + (r.score / r.total_score) * 100, 0) / records.length).toFixed(1) :
            '無數據';

        // 更新統計HTML
        statsContainer.innerHTML = `
            <div class="stats-overview">
                <div class="stat-item">
                    <div class="stat-value">${records.length}</div>
                    <div class="stat-label">總記錄數</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${subjects.length}</div>
                    <div class="stat-label">科目數</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${overallAvg}%</div>
                    <div class="stat-label">平均分數</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${recentCount}</div>
                    <div class="stat-label">近期考試</div>
                </div>
            </div>
            <div class="subject-stats">
                <h3>各科目統計</h3>
                ${subjectStatsHtml}
            </div>
        `;
    }

    // 更新成績走勢圖
    function updateScoreTrendChart() {
        const chartContainer = document.getElementById('score-trend-chart');
        if (!chartContainer || !window.Highcharts) return;

        // 獲取選中的科目
        const subjectSelector = document.getElementById('chart-subject-selector');
        const selectedSubject = subjectSelector ? subjectSelector.value : null;

        // 如果沒有選擇科目，顯示所有科目
        let chartData;
        if (!selectedSubject || selectedSubject === 'all') {
            // 獲取所有科目最近的記錄
            const subjects = [...new Set(records.map(r => r.subject))];
            chartData = subjects.map(subject => {
                const subjectRecords = records
                    .filter(r => r.subject === subject)
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .slice(-10); // 只取最近10條記錄

                return {
                    name: subject,
                    data: subjectRecords.map(r => [
                        new Date(r.date).getTime(),
                        (r.score / r.total_score) * 100
                    ])
                };
            });
        } else {
            // 獲取特定科目的記錄
            const subjectRecords = records
                .filter(r => r.subject === selectedSubject)
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            chartData = [{
                name: selectedSubject,
                data: subjectRecords.map(r => [
                    new Date(r.date).getTime(),
                    (r.score / r.total_score) * 100
                ])
            }];
        }

        // 使用Highcharts繪製圖表
        Highcharts.chart('score-trend-chart', {
            title: {
                text: '成績走勢圖'
            },
            xAxis: {
                type: 'datetime',
                title: {
                    text: '日期'
                }
            },
            yAxis: {
                title: {
                    text: '分數百分比 (%)'
                },
                min: 0,
                max: 100
            },
            tooltip: {
                formatter: function () {
                    return `<b>${this.series.name}</b><br>
                            日期: ${Highcharts.dateFormat('%Y-%m-%d', this.x)}<br>
                            分數: ${this.y.toFixed(1)}%`;
                }
            },
            plotOptions: {
                series: {
                    marker: {
                        enabled: true
                    }
                }
            },
            series: chartData
        });
    }

    // 查看成績詳情
    function viewScoreDetail(id) {
        const record = records.find(r => r.id === id);
        if (!record) {
            console.error(`未找到ID為 ${id} 的成績記錄`);
            return;
        }

        // 顯示成績詳情對話框
        const modal = document.getElementById('score-detail-modal');
        if (modal) {
            const detailContent = modal.querySelector('.modal-content');
            if (detailContent) {
                detailContent.innerHTML = generateScoreDetailHTML(record);
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
            // 如果沒有模態框，使用提示框顯示簡要信息
            const percentage = ((record.score / record.total_score) * 100).toFixed(1);
            alert(`成績詳情：\n日期：${record.date}\n科目：${record.subject}\n考試：${record.exam_name || record.exam_type}\n分數：${record.score}/${record.total_score} (${percentage}%)\n排名：${record.rank ? `${record.rank}/${record.total_students}` : '無數據'}\n備註：${record.notes || '無'}`);
        }
    }

    // 生成成績詳情HTML
    function generateScoreDetailHTML(record) {
        const percentage = ((record.score / record.total_score) * 100).toFixed(1);
        let scoreClass = '';
        if (percentage >= 90) scoreClass = 'excellent-score';
        else if (percentage >= 80) scoreClass = 'good-score';
        else if (percentage >= 60) scoreClass = 'pass-score';
        else scoreClass = 'fail-score';

        return `
            <div class="score-detail">
                <button class="close-modal">&times;</button>
                <h3>成績詳情</h3>
                
                <div class="detail-row">
                    <span class="label">科目：</span>
                    <span>${record.subject}</span>
                </div>
                <div class="detail-row">
                    <span class="label">學年：</span>
                    <span>${record.academic_year}</span>
                </div>
                <div class="detail-row">
                    <span class="label">考試類型：</span>
                    <span>${record.exam_type}</span>
                </div>
                <div class="detail-row">
                    <span class="label">考試名稱：</span>
                    <span>${record.exam_name || '無'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">日期：</span>
                    <span>${record.date}</span>
                </div>
                
                <div class="score-result ${scoreClass}">
                    <div class="score-value">${record.score}/${record.total_score}</div>
                    <div class="score-percentage">${percentage}%</div>
                </div>
                
                <div class="detail-row">
                    <span class="label">排名：</span>
                    <span>${record.rank ? `${record.rank}/${record.total_students}` : '無數據'}</span>
                </div>
                
                <div class="detail-notes">
                    <h4>備註：</h4>
                    <div class="notes-text">${record.notes || '無備註'}</div>
                </div>

                <div class="relative-performance">
                    <h4>相對表現：</h4>
                    ${generateRelativePerformanceHTML(record)}
                </div>
                
                <div class="detail-actions">
                    <button class="btn-edit" data-id="${record.id}">編輯</button>
                    <button class="btn-delete" data-id="${record.id}">刪除</button>
                </div>
            </div>
        `;
    }

    // 生成相對表現HTML（與同科目其他成績比較）
    function generateRelativePerformanceHTML(record) {
        const subjectRecords = records.filter(r =>
            r.subject === record.subject && r.id !== record.id
        );

        if (subjectRecords.length === 0) {
            return '<p>暫無其他同科目成績可供比較</p>';
        }

        // 計算此成績在同科目中的排名
        const currentPercentage = (record.score / record.total_score) * 100;
        const allPercentages = [
            ...subjectRecords.map(r => ({
                id: r.id,
                date: r.date,
                percentage: (r.score / r.total_score) * 100
            })),
            {
                id: record.id,
                date: record.date,
                percentage: currentPercentage
            }
        ].sort((a, b) => b.percentage - a.percentage);

        const rank = allPercentages.findIndex(r => r.id === record.id) + 1;
        const total = allPercentages.length;

        // 計算平均分
        const avgPercentage = subjectRecords.reduce(
            (sum, r) => sum + (r.score / r.total_score) * 100, 0
        ) / subjectRecords.length;

        // 比較與平均分的差距
        const diffFromAvg = currentPercentage - avgPercentage;
        const diffText = diffFromAvg >= 0 ?
            `高於平均 ${diffFromAvg.toFixed(1)}%` :
            `低於平均 ${Math.abs(diffFromAvg).toFixed(1)}%`;

        // 找出最高分和最低分
        const highestRecord = subjectRecords.reduce(
            (highest, r) => (r.score / r.total_score) > (highest.score / highest.total_score) ? r : highest,
            subjectRecords[0]
        );

        const lowestRecord = subjectRecords.reduce(
            (lowest, r) => (r.score / r.total_score) < (lowest.score / lowest.total_score) ? r : lowest,
            subjectRecords[0]
        );

        const highestPercentage = (highestRecord.score / highestRecord.total_score) * 100;
        const lowestPercentage = (lowestRecord.score / lowestRecord.total_score) * 100;

        // 判斷這次是否是個人最佳
        const isPersonalBest = currentPercentage >= allPercentages[0].percentage;

        return `
            <div class="relative-stats">
                <div class="stat-item">
                    <div class="stat-label">科目內排名</div>
                    <div class="stat-value">${rank}/${total}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">與平均分比較</div>
                    <div class="stat-value ${diffFromAvg >= 0 ? 'positive' : 'negative'}">${diffText}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">科目最高分</div>
                    <div class="stat-value">${highestPercentage.toFixed(1)}%</div>
                    <div class="stat-extra">${highestRecord.date}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">科目平均分</div>
                    <div class="stat-value">${avgPercentage.toFixed(1)}%</div>
                </div>
            </div>
            ${isPersonalBest ? '<div class="personal-best">🌟 個人最佳成績！</div>' : ''}
        `;
    }

    // 編輯成績記錄
    function editScore(id) {
        const record = records.find(r => r.id === id);
        if (!record) {
            console.error(`未找到ID為 ${id} 的成績記錄`);
            return;
        }

        // 顯示編輯表單
        const modal = document.getElementById('edit-score-modal');
        if (modal) {
            const editForm = modal.querySelector('#edit-score-form');
            if (editForm) {
                // 填充表單
                editForm.elements.score_id.value = record.id;
                editForm.elements.academic_year.value = record.academic_year;
                editForm.elements.subject.value = record.subject;
                editForm.elements.exam_type.value = record.exam_type;
                editForm.elements.exam_name.value = record.exam_name || '';
                editForm.elements.date.value = record.date;
                editForm.elements.score.value = record.score;
                editForm.elements.total_score.value = record.total_score;
                if (editForm.elements.rank) editForm.elements.rank.value = record.rank || '';
                if (editForm.elements.total_students) editForm.elements.total_students.value = record.total_students || '';
                if (editForm.elements.notes) editForm.elements.notes.value = record.notes || '';

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

                    const updatedRecord = {
                        academic_year: editForm.elements.academic_year.value,
                        subject: editForm.elements.subject.value,
                        exam_type: editForm.elements.exam_type.value,
                        exam_name: editForm.elements.exam_name.value,
                        date: editForm.elements.date.value,
                        score: parseFloat(editForm.elements.score.value),
                        total_score: parseFloat(editForm.elements.total_score.value),
                        rank: editForm.elements.rank ?
                            (editForm.elements.rank.value ? parseInt(editForm.elements.rank.value, 10) : null) :
                            record.rank,
                        total_students: editForm.elements.total_students ?
                            (editForm.elements.total_students.value ? parseInt(editForm.elements.total_students.value, 10) : null) :
                            record.total_students,
                        notes: editForm.elements.notes ? editForm.elements.notes.value : record.notes
                    };

                    if (updateRecord(id, updatedRecord)) {
                        modal.style.display = 'none';
                        showFeedback('success', '成績更新成功！');
                        updateScoresList();
                        updateScoreTrendChart();
                    } else {
                        showFeedback('error', '更新失敗，請檢查輸入數據');
                    }
                };
            }
        } else {
            // 如果沒有模態框，提示用戶
            alert('編輯功能需要編輯表單，請確保頁面包含編輯表單。');
        }
    }

    // 確認刪除成績記錄
    function confirmDeleteScore(id) {
        if (confirm('確定要刪除此成績記錄嗎？此操作無法撤銷。')) {
            if (deleteRecord(id)) {
                showFeedback('success', '成績記錄已刪除');
                updateScoresList();
                updateScoreTrendChart();
            } else {
                showFeedback('error', '刪除失敗');
            }
        }
    }

    // 新增成績記錄
    function addRecord(record) {
        // 驗證記錄格式
        if (!validateRecord(record)) {
            return false;
        }

        // 生成唯一ID
        record.id = generateUniqueId();
        record.created_at = new Date().toISOString();

        // 計算百分比
        if (record.score !== undefined && record.total_score !== undefined) {
            record.percentage = (record.score / record.total_score * 100).toFixed(2);
        }

        records.push(record);
        saveToStorage();
        return true;
    }

    // 更新成績記錄
    function updateRecord(id, updatedRecord) {
        const index = records.findIndex(record => record.id === id);
        if (index === -1) {
            console.error(`未找到ID為 ${id} 的成績記錄`);
            return false;
        }

        // 驗證記錄格式
        if (!validateRecord(updatedRecord)) {
            return false;
        }

        // 保留原始ID和創建時間
        updatedRecord.id = id;
        updatedRecord.created_at = records[index].created_at;
        updatedRecord.updated_at = new Date().toISOString();

        // 更新百分比
        if (updatedRecord.score !== undefined && updatedRecord.total_score !== undefined) {
            updatedRecord.percentage = (updatedRecord.score / updatedRecord.total_score * 100).toFixed(2);
        }

        records[index] = updatedRecord;
        saveToStorage();
        return true;
    }

    // 刪除成績記錄
    function deleteRecord(id) {
        const initialLength = records.length;
        records = records.filter(record => record.id !== id);

        if (records.length === initialLength) {
            console.error(`未找到ID為 ${id} 的成績記錄`);
            return false;
        }

        saveToStorage();
        return true;
    }

    // 獲取所有成績記錄
    function getAllRecords() {
        return [...records]; // 返回副本，避免直接修改原數組
    }

    // 計算科目平均分數
    function calculateSubjectAverage(subject, academicYear = null) {
        const filteredRecords = records.filter(record => {
            if (record.subject !== subject) return false;
            if (academicYear && record.academic_year !== academicYear) return false;
            return true;
        });

        if (filteredRecords.length === 0) return null;

        const percentageSum = filteredRecords.reduce((total, record) =>
            total + (record.score / record.total_score * 100), 0);
        return (percentageSum / filteredRecords.length).toFixed(2);
    }

    // 計算進步幅度 (最近n次考試)
    function calculateProgress(subject, n = 5) {
        const subjectRecords = records
            .filter(record => record.subject === subject)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, n);

        if (subjectRecords.length < 2) return null;

        const latest = subjectRecords[0].score / subjectRecords[0].total_score * 100;
        const earliest = subjectRecords[subjectRecords.length - 1].score / subjectRecords[subjectRecords.length - 1].total_score * 100;

        return (latest - earliest).toFixed(2);
    }

    // 獲取科目成績趨勢數據
    function getScoreTrend(subject, limit = 10) {
        const subjectRecords = records
            .filter(record => record.subject === subject)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-limit);

        return {
            dates: subjectRecords.map(record => record.date),
            scores: subjectRecords.map(record => record.score),
            percentages: subjectRecords.map(record => (record.score / record.total_score * 100).toFixed(1))
        };
    }

    // 獲取改進建議
    function getImprovementSuggestions(subject) {
        const subjectRecords = records
            .filter(record => record.subject === subject)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (subjectRecords.length < 2) {
            return [{
                type: 'info',
                message: '需要更多的成績數據來提供具體建議'
            }];
        }

        const suggestions = [];

        // 計算最近三次考試的平均分與趨勢
        const recentRecords = subjectRecords.slice(0, 3);
        const recentAvg = recentRecords.reduce((sum, r) => sum + (r.score / r.total_score * 100), 0) / recentRecords.length;
        const trend = (recentRecords[0].score / recentRecords[0].total_score * 100) -
            (recentRecords[recentRecords.length - 1].score / recentRecords[recentRecords.length - 1].total_score * 100);

        // 根據成績情況給出建議
        if (recentAvg < 60) {
            suggestions.push({
                type: 'warning',
                message: `${subject}科目近期平均分較低 (${recentAvg.toFixed(1)}%)，建議回歸基礎，鞏固核心概念`
            });
        } else if (recentAvg >= 60 && recentAvg < 75) {
            suggestions.push({
                type: 'info',
                message: `${subject}科目成績處於及格水平 (${recentAvg.toFixed(1)}%)，建議加強薄弱環節，提高解題能力`
            });
        } else if (recentAvg >= 75 && recentAvg < 90) {
            suggestions.push({
                type: 'success',
                message: `${subject}科目成績良好 (${recentAvg.toFixed(1)}%)，建議針對性提升難題解決能力`
            });
        } else {
            suggestions.push({
                type: 'success',
                message: `${subject}科目成績優異 (${recentAvg.toFixed(1)}%)，建議保持並挑戰更高難度題目`
            });
        }

        // 根據成績趨勢給出建議
        if (trend < -10) {
            suggestions.push({
                type: 'danger',
                message: `${subject}科目成績呈明顯下降趨勢 (${trend.toFixed(1)}%)，建議立即檢視學習方法`
            });
        } else if (trend < 0) {
            suggestions.push({
                type: 'warning',
                message: `${subject}科目成績略有下降 (${trend.toFixed(1)}%)，建議分析近期錯題找出原因`
            });
        } else if (trend > 10) {
            suggestions.push({
                type: 'success',
                message: `${subject}科目成績顯著提升 (${trend.toFixed(1)}%)，繼續保持當前學習方法`
            });
        } else if (trend > 0) {
            suggestions.push({
                type: 'info',
                message: `${subject}科目成績有小幅提升 (${trend.toFixed(1)}%)，可增加練習量鞏固進步`
            });
        }

        return suggestions;
    }

    // 驗證記錄格式
    function validateRecord(record) {
        // 必填字段檢查
        const requiredFields = ['academic_year', 'subject', 'exam_type', 'date', 'score', 'total_score'];
        for (const field of requiredFields) {
            if (record[field] === undefined || record[field] === null || record[field] === '') {
                console.error(`成績記錄缺少必填字段: ${field}`);
                return false;
            }
        }

        // 分數格式檢查
        if (isNaN(record.score) || isNaN(record.total_score)) {
            console.error('分數必須為數字');
            return false;
        }

        if (record.score < 0 || record.score > record.total_score) {
            console.error('分數必須大於等於0且不大於總分');
            return false;
        }

        // 排名檢查
        if (record.rank !== null && record.rank !== undefined) {
            if (isNaN(record.rank) || record.rank <= 0) {
                console.error('排名必須為正數');
                return false;
            }

            if (record.total_students !== null && record.total_students !== undefined) {
                if (isNaN(record.total_students) || record.total_students <= 0) {
                    console.error('總人數必須為正數');
                    return false;
                }

                if (record.rank > record.total_students) {
                    console.error('排名不能大於總人數');
                    return false;
                }
            }
        }

        return true;
    }

    // 顯示操作反饋
    function showFeedback(type, message, duration = 3000) {
        // 如果存在Feedback組件，使用它
        if (window.Feedback) {
            window.Feedback[type](message, duration);
            return;
        }

        // 否則創建簡易的反饋元素
        const feedback = document.createElement('div');
        feedback.className = `feedback feedback-${type}`;
        feedback.textContent = message;
        document.body.appendChild(feedback);

        // 顯示反饋
        setTimeout(() => feedback.classList.add('show'), 10);

        // 自動消失
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => document.body.removeChild(feedback), 300);
        }, duration);
    }

    // 生成唯一ID
    function generateUniqueId() {
        return 'score_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    // 匯出成績數據為CSV
    function exportToCSV() {
        if (records.length === 0) {
            showFeedback('error', '沒有數據可導出');
            return;
        }

        // 創建CSV內容
        const headers = ['日期', '學年', '科目', '考試類型', '考試名稱', '分數', '總分', '百分比', '排名', '總人數', '備註'];
        let csvContent = headers.join(',') + '\n';

        records.forEach(record => {
            const percentage = ((record.score / record.total_score) * 100).toFixed(1);
            const row = [
                record.date,
                record.academic_year,
                record.subject,
                record.exam_type,
                `"${record.exam_name || ''}"`,
                record.score,
                record.total_score,
                percentage,
                record.rank || '',
                record.total_students || '',
                `"${record.notes || ''}"`
            ];
            csvContent += row.join(',') + '\n';
        });

        // 創建下載鏈接
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `成績記錄_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 匯入CSV數據
    function importFromCSV(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const content = e.target.result;
            const lines = content.split('\n');

            // 跳過標題行
            const importedRecords = [];
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;

                const values = lines[i].split(',');
                if (values.length < 6) continue;

                try {
                    const record = {
                        date: values[0].trim(),
                        academic_year: values[1].trim(),
                        subject: values[2].trim(),
                        exam_type: values[3].trim(),
                        exam_name: values[4].replace(/"/g, '').trim(),
                        score: parseFloat(values[5].trim()),
                        total_score: parseFloat(values[6].trim()),
                        rank: values[8].trim() ? parseInt(values[8].trim(), 10) : null,
                        total_students: values[9].trim() ? parseInt(values[9].trim(), 10) : null,
                        notes: values[10] ? values[10].replace(/"/g, '').trim() : ''
                    };

                    if (validateRecord(record)) {
                        importedRecords.push(record);
                    }
                } catch (error) {
                    console.error('解析CSV行時出錯:', error);
                }
            }

            if (importedRecords.length > 0) {
                // 添加所有有效記錄
                importedRecords.forEach(record => addRecord(record));
                showFeedback('success', `成功導入 ${importedRecords.length} 條成績記錄`);
                updateScoresList();
                updateScoreTrendChart();
            } else {
                showFeedback('error', '沒有導入任何有效記錄');
            }
        };

        reader.onerror = function () {
            showFeedback('error', '讀取文件時發生錯誤');
        };

        reader.readAsText(file);
    }

    // 公開API
    return {
        init,
        addRecord,
        updateRecord,
        deleteRecord,
        getAllRecords,
        filterRecords,
        calculateSubjectAverage,
        calculateProgress,
        getScoreTrend,
        getImprovementSuggestions,
        exportToCSV,
        importFromCSV,
        updateScoresList,
        updateScoreTrendChart
    };
})();

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function () {
    ScoreRecordManager.init();

    // 將實例附加到全局對象，方便其他模塊訪問
    window.scoreManager = ScoreRecordManager;

    // 導出按鈕處理
    const exportBtn = document.getElementById('export-scores-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', ScoreRecordManager.exportToCSV);
    }

    // 導入按鈕處理
    const importBtn = document.getElementById('import-scores-btn');
    const importFileInput = document.getElementById('import-scores-file');
    if (importBtn && importFileInput) {
        importBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                ScoreRecordManager.importFromCSV(e.target.files[0]);
            }
        });
    }
});
