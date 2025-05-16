const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const db = require('../../utils/db');

// 設置文件上傳
const upload = multer({
    dest: path.join(__dirname, '../../uploads/'),
    limits: { fileSize: 10 * 1024 * 1024 } // 限制10MB
});

// 導入題目API
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '沒有上傳文件' });
        }

        const results = [];
        const filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();

        if (fileExt === '.csv') {
            // 處理CSV文件
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    await processImportedQuestions(results, res);
                    // 清理臨時文件
                    fs.unlinkSync(filePath);
                });
        } else if (['.xlsx', '.xls'].includes(fileExt)) {
            // 處理Excel文件 (需要額外安裝excel處理庫如xlsx)
            const xlsx = require('xlsx');
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(worksheet);

            await processImportedQuestions(jsonData, res);
            // 清理臨時文件
            fs.unlinkSync(filePath);
        } else {
            // 清理臨時文件
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: '不支持的文件格式' });
        }
    } catch (error) {
        console.error('導入題目錯誤:', error);
        res.status(500).json({ error: '導入題目失敗', details: error.message });
    }
});

// 處理導入的題目數據
async function processImportedQuestions(questions, res) {
    try {
        // 開始事務
        await db.query('BEGIN');

        for (const q of questions) {
            // 假設CSV/Excel中的列為: question_text, correct_answer, options (JSON字符串)
            await db.query(`
                INSERT INTO questions (question_text, correct_answer, options, created_at)
                VALUES ($1, $2, $3, NOW())
            `, [q.question_text, q.correct_answer, JSON.stringify(q.options || [])]);
        }

        // 提交事務
        await db.query('COMMIT');

        res.json({
            success: true,
            message: `成功導入 ${questions.length} 個題目`
        });
    } catch (error) {
        // 回滾事務
        await db.query('ROLLBACK');
        throw error;
    }
}

module.exports = router;
