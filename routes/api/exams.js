const express = require('express');
const router = express.Router();
const db = require('../../utils/db');

// 生成新試卷API
router.post('/generate', async (req, res) => {
    try {
        // 這裡實現生成試卷的邏輯
        // 示例: 從題庫隨機選取題目
        const result = await db.query(`
            INSERT INTO exams (title, created_at) 
            VALUES ('新試卷 - ${new Date().toISOString()}', NOW())
            RETURNING id
        `);

        const examId = result.rows[0].id;

        // 選取隨機題目並添加到試卷中
        await db.query(`
            INSERT INTO exam_questions (exam_id, question_id, question_order)
            SELECT $1, id, ROW_NUMBER() OVER() 
            FROM questions 
            ORDER BY RANDOM() 
            LIMIT 10
        `, [examId]);

        res.json({ success: true, examId });
    } catch (error) {
        console.error('生成試卷錯誤:', error);
        res.status(500).json({ error: '生成試卷失敗', details: error.message });
    }
});

// 其他試卷相關API...

module.exports = router;
