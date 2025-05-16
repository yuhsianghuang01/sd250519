/**
 * 共用工具函數模組
 */

(function () {
    // 初始化所有模態框
    function initModals() {
        document.querySelectorAll('.modal').forEach(function (modal) {
            // 點擊模態框背景關閉
            modal.addEventListener('click', function (event) {
                if (event.target === this) {
                    this.style.display = 'none';
                }
            });

            // 點擊關閉按鈕關閉
            const closeBtn = modal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', function () {
                    modal.style.display = 'none';
                });
            }

            // 防止模態框內容點擊事件傳播到背景
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.addEventListener('click', function (event) {
                    event.stopPropagation();
                });
            }
        });
    }

    // 顯示通知
    function showNotification(message, type = 'info', duration = 3000) {
        // 創建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = message;

        // 添加到頁面
        document.body.appendChild(notification);

        // 顯示動畫
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // 自動隱藏
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, duration);
    }

    // 獲取科目名稱
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

    // 獲取難度名稱
    function getDifficultyName(difficulty) {
        const difficultyNames = {
            easy: '簡單',
            medium: '中等',
            hard: '困難',
            mixed: '混合'
        };
        return difficultyNames[difficulty] || '未知';
    }

    // 獲取題型名稱
    function getQuestionTypeName(type) {
        const typeNames = {
            true_false: '是非題',
            single_choice: '單選題',
            multiple_choice: '多選題',
            fill_blank: '填空題',
            short_answer: '簡答題'
        };
        return typeNames[type] || '未知';
    }

    // 格式化日期
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW');
    }

    // 確認對話框
    function confirm(message, onConfirm, onCancel) {
        const confirmed = window.confirm(message);
        if (confirmed && typeof onConfirm === 'function') {
            onConfirm();
        } else if (!confirmed && typeof onCancel === 'function') {
            onCancel();
        }
        return confirmed;
    }

    // 初始化系統
    function initSystem() {
        // 初始化模態框
        initModals();

        // 初始化考試系統
        if (window.examSystem && typeof window.examSystem.init === 'function') {
            window.examSystem.init();
        }

        // 初始化通知樣式
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 4px;
                color: white;
                z-index: 10000;
                box-shadow: 0 3px 6px rgba(0,0,0,0.16);
                transform: translateY(-30px);
                opacity: 0;
                transition: transform 0.3s, opacity 0.3s;
            }
            
            .notification.show {
                transform: translateY(0);
                opacity: 1;
            }
            
            .notification-info {
                background-color: #3498db;
            }
            
            .notification-success {
                background-color: #2ecc71;
            }
            
            .notification-warning {
                background-color: #f39c12;
            }
            
            .notification-error {
                background-color: #e74c3c;
            }
        `;
        document.head.appendChild(style);

        // 添加自適應深色模式支持
        initDarkModeSupport();

        // 初始化全局錯誤處理
        initGlobalErrorHandling();
    }

    // 自適應深色模式支持
    function initDarkModeSupport() {
        // 檢查用戶設置
        const storedTheme = localStorage.getItem('sd_theme');
        if (storedTheme) {
            document.documentElement.setAttribute('data-theme', storedTheme);
        } else {
            // 檢查系統偏好
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        }

        // 添加切換主題按鈕（如果存在）
        const themeToggleBtn = document.getElementById('theme-toggle');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', toggleTheme);
        }
    }

    // 主題切換函數
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('sd_theme', newTheme);

        // 更新切換按鈕的圖標（如果存在）
        const themeToggleIcon = document.getElementById('theme-toggle-icon');
        if (themeToggleIcon) {
            themeToggleIcon.classList.toggle('icon-sun', newTheme === 'light');
            themeToggleIcon.classList.toggle('icon-moon', newTheme === 'dark');
        }
    }

    // 初始化全局錯誤處理
    function initGlobalErrorHandling() {
        window.addEventListener('error', function (event) {
            console.error('全局錯誤:', event.message, '於', event.filename, '第', event.lineno, '行');
        });

        window.addEventListener('unhandledrejection', function (event) {
            console.error('未處理的Promise拒絕:', event.reason);
        });
    }

    // 公開API
    window.sdUtils = {
        initModals: initModals,
        showNotification: showNotification,
        getSubjectName: getSubjectName,
        getDifficultyName: getDifficultyName,
        getQuestionTypeName: getQuestionTypeName,
        formatDate: formatDate,
        confirm: confirm,
        initSystem: initSystem
    };

    // 頁面載入時自動初始化
    document.addEventListener('DOMContentLoaded', initSystem);
})();
