// ...existing code...

// 引入API路由
const examsRouter = require('./routes/api/exams');
const questionsRouter = require('./routes/api/questions');

// ...existing code...

// 註冊API路由
app.use('/api/exams', examsRouter);
app.use('/api/questions', questionsRouter);

// ...existing code...
