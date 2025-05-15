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
        loadFromCookies();
        console.log('成績記錄模組初始化完成');
    }

    // 從Cookies載入資料
    function loadFromCookies() {
        try {
            const storedData = getCookie(STORAGE_KEY);
            if (storedData) {
                records = JSON.parse(storedData);
                console.log(`已從Cookies載入 ${records.length} 筆成績記錄`);
            } else {
                console.log('未找到本地成績記錄，使用空記錄初始化');
                records = [];
            }
        } catch (error) {
            console.error('載入成績記錄時發生錯誤:', error);
            records = [];
        }
    }

    // 保存資料到Cookies
    function saveToCookies() {
        try {
            const jsonData = JSON.stringify(records);
            setCookie(STORAGE_KEY, jsonData, 365); // 保存一年
            console.log('成績記錄已保存到Cookies');

            // 同時嘗試保存到文件
            saveToJsonFile(jsonData);
        } catch (error) {
            console.error('保存成績記錄時發生錯誤:', error);
        }
    }

    // 保存到JSON文件 (需要伺服器端支援)
    function saveToJsonFile(jsonData) {
        // 這部分需要伺服器端支援，此處使用簡單的Ajax請求示範
        // 實際實現可能需要根據服務器端API調整
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

    // 新增成績記錄
    function addRecord(record) {
        // 驗證記錄格式
        if (!validateRecord(record)) {
            console.error('成績記錄格式無效');
            return false;
        }

        // 生成唯一ID
        record.id = generateUniqueId();
        record.created_at = new Date().toISOString();

        // 計算百分比
        if (record.score && record.total_score) {
            record.percentage = (record.score / record.total_score * 100).toFixed(2);
        }

        records.push(record);
        saveToCookies();
        return true;
    }

    // 更新成績記錄
    function updateRecord(id, updatedRecord) {
        const index = records.findIndex(record => record.id === id);
        if (index === -1) {
            console.error(`未找到ID為 ${id} 的成績記錄`);
            return false;
        }

        // 保留原始ID和創建時間
        updatedRecord.id = id;
        updatedRecord.created_at = records[index].created_at;
        updatedRecord.updated_at = new Date().toISOString();

        // 更新百分比
        if (updatedRecord.score && updatedRecord.total_score) {
            updatedRecord.percentage = (updatedRecord.score / updatedRecord.total_score * 100).toFixed(2);
        }

        records[index] = updatedRecord;
        saveToCookies();
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

        saveToCookies();
        return true;
    }

    // 獲取所有成績記錄
    function getAllRecords() {
        return [...records]; // 返回副本，避免直接修改原數組
    }

    // 依條件過濾成績記錄
    function filterRecords(options = {}) {
        return records.filter(record => {
            // 按學年過濾
            if (options.academicYear && record.academic_year !== options.academicYear) {
                return false;
            }

            // 按科目過濾
            if (options.subject && record.subject !== options.subject) {
                return false;
            }

            // 按考試類型過濾
            if (options.examType && record.exam_type !== options.examType) {
                return false;
            }

            // 按日期範圍過濾
            if (options.startDate && new Date(record.date) < new Date(options.startDate)) {
                return false;
            }
            if (options.endDate && new Date(record.date) > new Date(options.endDate)) {
                return false;
            }

            // 按分數範圍過濾
            if (options.minScore !== undefined && record.score < options.minScore) {
                return false;
            }
            if (options.maxScore !== undefined && record.score > options.maxScore) {
                return false;
            }

            return true;
        });
    }

    // 計算科目平均分數
    function calculateSubjectAverage(subject, academicYear = null) {
        const filteredRecords = records.filter(record => {
            if (record.subject !== subject) return false;
            if (academicYear && record.academic_year !== academicYear) return false;
            return true;
        });

        if (filteredRecords.length === 0) return null;

        const sum = filteredRecords.reduce((total, record) => total + record.score, 0);
        return (sum / filteredRecords.length).toFixed(2);
    }

    // 計算進步幅度 (最近n次考試)
    function calculateProgress(subject, n = 5) {
        const subjectRecords = records
            .filter(record => record.subject === subject)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, n);

        if (subjectRecords.length < 2) return null;

        const latest = subjectRecords[0].percentage;
        const earliest = subjectRecords[subjectRecords.length - 1].percentage;

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
            percentages: subjectRecords.map(record => record.percentage)
        };
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

        return true;
    }

    // 生成唯一ID
    function generateUniqueId() {
        return 'score_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
        addRecord,
        updateRecord,
        deleteRecord,
        getAllRecords,
        filterRecords,
        calculateSubjectAverage,
        calculateProgress,
        getScoreTrend
    };
})();

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function () {
    ScoreRecordManager.init();

    // 將實例附加到全局對象，方便其他模塊訪問
    window.scoreManager = ScoreRecordManager;
});
