// quiz-manager.js - Создание викторин и опросов

class QuizManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.currentContent = null;
        this.contentType = 'quiz'; // 'quiz' или 'poll'
        this.currentQuestionIndex = 0;
        
        this.categories = [
            { id: 'general', name: 'Общая', icon: 'fas fa-globe' },
            { id: 'science', name: 'Наука', icon: 'fas fa-flask' },
            { id: 'history', name: 'История', icon: 'fas fa-landmark' },
            { id: 'geography', name: 'География', icon: 'fas fa-globe-americas' },
            { id: 'entertainment', name: 'Развлечения', icon: 'fas fa-film' },
            { id: 'sports', name: 'Спорт', icon: 'fas fa-running' },
            { id: 'art', name: 'Искусство', icon: 'fas fa-palette' },
            { id: 'technology', name: 'Технологии', icon: 'fas fa-laptop-code' }
        ];
        
        this.difficulties = [
            { id: 'easy', name: 'Легкая', color: '#00ff9d' },
            { id: 'medium', name: 'Средняя', color: '#ffaa00' },
            { id: 'hard', name: 'Сложная', color: '#ff5555' }
        ];
        
        console.log('QuizManager инициализирован');
    }
    
    // Показать создание викторины
    showCreateQuiz() {
        const user = this.gameManager.currentState.user;
        if (!user || user.isGuest) {
            showNotification('Требуется аккаунт', 'Для создания викторин нужно войти в аккаунт', '#ff5555');
            return;
        }
        
        this.contentType = 'quiz';
        this.currentContent = {
            title: '',
            description: '',
            category: 'general',
            difficulty: 'medium',
            questions: [],
            isPublic: true,
            createdBy: user.id
        };
        
        this.renderContentCreator('СОЗДАНИЕ ВИКТОРИНЫ', 'fas fa-edit');
    }
    
    // Показать создание опроса
    showCreatePoll() {
        const user = this.gameManager.currentState.user;
        if (!user || user.isGuest) {
            showNotification('Требуется аккаунт', 'Для создания опросов нужно войти в аккаунт', '#ff5555');
            return;
        }
        
        this.contentType = 'poll';
        this.currentContent = {
            title: '',
            description: '',
            category: 'general',
            questions: [{
                id: 'q1',
                question: '',
                options: [
                    { text: '', votes: 0 },
                    { text: '', votes: 0 },
                    { text: '', votes: 0 },
                    { text: '', votes: 0 }
                ],
                multipleChoice: false,
                showResults: true
            }],
            isPublic: true,
            createdBy: user.id
        };
        
        this.renderContentCreator('СОЗДАНИЕ ОПРОСА', 'fas fa-poll');
    }
    
    // Показать мои работы
    showMyContent() {
        const user = this.gameManager.currentState.user;
        if (!user || user.isGuest) {
            showNotification('Требуется аккаунт', 'Для просмотра работ нужно войти в аккаунт', '#ff5555');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        
        // Получаем викторины и опросы пользователя
        const userQuizzes = Database.findQuizzesByUser ? Database.findQuizzesByUser(user.id) : [];
        const userPolls = Database.findPollsByUser ? Database.findPollsByUser(user.id) : [];
        
        modal.innerHTML = `
            <div class="modal-content wide-modal">
                <div class="create-content-header">
                    <h3><i class="fas fa-list"></i> МОИ РАБОТЫ</h3>
                    <button class="btn btn-small" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="my-content-tabs">
                    <button class="tab-btn active" data-tab="quizzes">Викторины (${userQuizzes.length})</button>
                    <button class="tab-btn" data-tab="polls">Опросы (${userPolls.length})</button>
                </div>
                
                <div class="tab-content active" id="quizzesTab">
                    ${this.renderContentList(userQuizzes, 'quiz')}
                </div>
                
                <div class="tab-content" id="pollsTab">
                    ${this.renderContentList(userPolls, 'poll')}
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="quizManager.showCreateQuiz(); this.closest('.modal').remove()">
                        <i class="fas fa-plus"></i> НОВАЯ ВИКТОРИНА
                    </button>
                    <button class="btn btn-secondary" onclick="quizManager.showCreatePoll(); this.closest('.modal').remove()">
                        <i class="fas fa-plus"></i> НОВЫЙ ОПРОС
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i> ЗАКРЫТЬ
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Табы
        const tabBtns = modal.querySelectorAll('.tab-btn');
        const tabContents = modal.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                const tabId = btn.dataset.tab + 'Tab';
                document.getElementById(tabId).classList.add('active');
            });
        });
        
        // Закрытие при клике на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // Отрендерить список контента
    renderContentList(items, type) {
        if (!items || items.length === 0) {
            return `
                <div class="empty-content">
                    <i class="fas fa-inbox" style="font-size: 3rem; color: #00f3ff; margin-bottom: 20px;"></i>
                    <h4>У вас еще нет ${type === 'quiz' ? 'викторин' : 'опросов'}</h4>
                    <p>Создайте свою первую ${type === 'quiz' ? 'викторину' : 'опрос'}!</p>
                </div>
            `;
        }
        
        return `
            <div class="content-list">
                ${items.map((item, index) => `
                    <div class="content-item">
                        <div class="content-item-header">
                            <h4>${item.title}</h4>
                            <span class="content-badge ${type}">${type === 'quiz' ? 'Викторина' : 'Опрос'}</span>
                        </div>
                        <p class="content-description">${item.description || 'Без описания'}</p>
                        <div class="content-info">
                            <span><i class="fas fa-folder"></i> ${this.getCategoryName(item.category)}</span>
                            <span><i class="fas fa-question-circle"></i> ${item.questions ? item.questions.length : 0} вопросов</span>
                            <span><i class="fas fa-calendar"></i> ${new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div class="content-actions">
                            <button class="btn btn-small btn-primary" onclick="quizManager.editContent('${item.id}', '${type}')">
                                <i class="fas fa-edit"></i> Редактировать
                            </button>
                            <button class="btn btn-small btn-secondary" onclick="quizManager.useContent('${item.id}', '${type}')">
                                <i class="fas fa-play"></i> Использовать
                            </button>
                            <button class="btn btn-small btn-danger" onclick="quizManager.deleteContent('${item.id}', '${type}')">
                                <i class="fas fa-trash"></i> Удалить
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Получить название категории
    getCategoryName(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.name : 'Общая';
    }
    
    // Отрендерить создатель контента
    renderContentCreator(title, icon) {
        const modal = document.getElementById('createContentModal');
        if (!modal) return;
        
        const header = document.getElementById('createContentHeader');
        const body = document.getElementById('createContentBody');
        
        if (header && body) {
            header.innerHTML = `
                <h3><i class="${icon}"></i> ${title}</h3>
                <button class="btn btn-small" onclick="quizManager.closeCreator()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            body.innerHTML = this.getCreatorForm();
            
            modal.style.display = 'flex';
            
            // Инициализация формы
            this.initCreatorForm();
        }
    }
    
    // Получить форму создания
    getCreatorForm() {
        const isQuiz = this.contentType === 'quiz';
        
        return `
            <div class="content-form">
                <div class="form-group">
                    <label><i class="fas fa-heading"></i> Название</label>
                    <input type="text" id="contentTitle" class="input-field" 
                           placeholder="Введите название" maxlength="50" 
                           value="${this.currentContent.title}">
                </div>
                
                <div class="form-group">
                    <label><i class="fas fa-align-left"></i> Описание</label>
                    <textarea id="contentDescription" class="input-field" 
                              placeholder="Описание" rows="3">${this.currentContent.description}</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-folder"></i> Категория</label>
                        <select id="contentCategory" class="input-field">
                            ${this.categories.map(cat => `
                                <option value="${cat.id}" ${this.currentContent.category === cat.id ? 'selected' : ''}>
                                    ${cat.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    ${isQuiz ? `
                        <div class="form-group">
                            <label><i class="fas fa-chart-line"></i> Сложность</label>
                            <select id="contentDifficulty" class="input-field">
                                ${this.difficulties.map(diff => `
                                    <option value="${diff.id}" ${this.currentContent.difficulty === diff.id ? 'selected' : ''}>
                                        ${diff.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    ` : ''}
                </div>
                
                <div class="form-group">
                    <label class="switch">
                        <input type="checkbox" id="contentPublic" ${this.currentContent.isPublic ? 'checked' : ''}>
                        <span class="slider"></span>
                        <span class="switch-label">Сделать публичным</span>
                    </label>
                </div>
                
                <hr>
                
                <h3><i class="fas fa-question-circle"></i> ${isQuiz ? 'Вопросы викторины' : 'Вопросы опроса'}</h3>
                
                <div id="questionsList">
                    ${isQuiz ? this.renderQuizQuestions() : this.renderPollQuestions()}
                </div>
                
                <button id="addQuestionBtn" class="btn btn-secondary add-question-btn">
                    <i class="fas fa-plus"></i> ДОБАВИТЬ ВОПРОС
                </button>
                
                <div class="quiz-actions">
                    <button id="saveContentBtn" class="btn btn-primary">
                        <i class="fas fa-save"></i> СОХРАНИТЬ
                    </button>
                    <button id="cancelContentBtn" class="btn btn-danger">
                        <i class="fas fa-times"></i> ОТМЕНА
                    </button>
                </div>
            </div>
        `;
    }
    
    // Отрендерить вопросы викторины
    renderQuizQuestions() {
        if (!this.currentContent.questions || this.currentContent.questions.length === 0) {
            return '<div class="no-questions">Добавьте первый вопрос</div>';
        }
        
        return this.currentContent.questions.map((question, index) => `
            <div class="question-item" data-question-id="${question.id}">
                <div class="question-header">
                    <div class="question-number">Вопрос ${index + 1}</div>
                    <button class="remove-question" onclick="quizManager.removeQuestion('${question.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
                
                <div class="form-group">
                    <label>Текст вопроса</label>
                    <textarea class="input-field question-text" 
                              placeholder="Введите текст вопроса" 
                              rows="2">${question.question}</textarea>
                </div>
                
                <div class="form-group">
                    <label>Варианты ответов</label>
                    ${question.answers.map((answer, ansIndex) => `
                        <div class="answer-option">
                            <input type="text" class="input-field answer-text" 
                                   placeholder="Вариант ответа ${ansIndex + 1}" 
                                   value="${answer.text}">
                            <div class="correct-answer">
                                <input type="radio" name="correct_${question.id}" 
                                       value="${ansIndex}" ${answer.correct ? 'checked' : ''}>
                                <span>Правильный ответ</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="form-group">
                    <label>Время на ответ (секунд)</label>
                    <select class="input-field question-time">
                        <option value="0" ${question.timeLimit === 0 ? 'selected' : ''}>Без ограничения</option>
                        <option value="10" ${question.timeLimit === 10 ? 'selected' : ''}>10 сек</option>
                        <option value="15" ${question.timeLimit === 15 ? 'selected' : ''}>15 сек</option>
                        <option value="20" ${question.timeLimit === 20 ? 'selected' : ''}>20 сек</option>
                        <option value="30" ${question.timeLimit === 30 ? 'selected' : ''}>30 сек</option>
                        <option value="45" ${question.timeLimit === 45 ? 'selected' : ''}>45 сек</option>
                        <option value="60" ${question.timeLimit === 60 ? 'selected' : ''}>60 сек</option>
                    </select>
                </div>
            </div>
        `).join('');
    }
    
    // Отрендерить вопросы опроса
    renderPollQuestions() {
        if (!this.currentContent.questions || this.currentContent.questions.length === 0) {
            return '<div class="no-questions">Добавьте первый вопрос</div>';
        }
        
        return this.currentContent.questions.map((question, index) => `
            <div class="question-item" data-question-id="${question.id}">
                <div class="question-header">
                    <div class="question-number">Вопрос опроса ${index + 1}</div>
                    <button class="remove-question" onclick="quizManager.removeQuestion('${question.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
                
                <div class="form-group">
                    <label>Текст вопроса</label>
                    <textarea class="input-field question-text" 
                              placeholder="Введите текст вопроса" 
                              rows="2">${question.question}</textarea>
                </div>
                
                <div class="form-group">
                    <label>Варианты ответов</label>
                    ${question.options.map((option, optIndex) => `
                        <div class="answer-option">
                            <input type="text" class="input-field answer-text" 
                                   placeholder="Вариант ${optIndex + 1}" 
                                   value="${option.text}">
                        </div>
                    `).join('')}
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="switch">
                            <input type="checkbox" class="multiple-choice" ${question.multipleChoice ? 'checked' : ''}>
                            <span class="slider"></span>
                            <span class="switch-label">Множественный выбор</span>
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label class="switch">
                            <input type="checkbox" class="show-results" ${question.showResults !== false ? 'checked' : ''}>
                            <span class="slider"></span>
                            <span class="switch-label">Показывать результаты</span>
                        </label>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Инициализация формы
    initCreatorForm() {
        // Добавление вопроса
        const addQuestionBtn = document.getElementById('addQuestionBtn');
        if (addQuestionBtn) {
            addQuestionBtn.addEventListener('click', () => {
                this.addQuestion();
            });
        }
        
        // Сохранение
        const saveBtn = document.getElementById('saveContentBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveContent();
            });
        }
        
        // Отмена
        const cancelBtn = document.getElementById('cancelContentBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeCreator();
            });
        }
        
        // Настройка обработчиков вопросов
        this.setupQuestionHandlers();
    }
    
    // Настройка обработчиков вопросов
    setupQuestionHandlers() {
        // Обновление вопросов
        const questionTexts = document.querySelectorAll('.question-text');
        questionTexts.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (this.currentContent.questions[index]) {
                    this.currentContent.questions[index].question = e.target.value;
                }
            });
        });
        
        // Обновление ответов
        const answerTexts = document.querySelectorAll('.answer-text');
        answerTexts.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                // Найдем к какому вопросу относится ответ
                const questionItem = input.closest('.question-item');
                if (!questionItem) return;
                
                const questionId = questionItem.dataset.questionId;
                const questionIndex = this.currentContent.questions.findIndex(q => q.id === questionId);
                if (questionIndex === -1) return;
                
                const question = this.currentContent.questions[questionIndex];
                const answerIndex = Array.from(questionItem.querySelectorAll('.answer-text')).indexOf(input);
                
                if (this.contentType === 'quiz') {
                    if (question.answers && question.answers[answerIndex]) {
                        question.answers[answerIndex].text = e.target.value;
                    }
                } else {
                    if (question.options && question.options[answerIndex]) {
                        question.options[answerIndex].text = e.target.value;
                    }
                }
            });
        });
        
        // Правильные ответы
        const correctRadios = document.querySelectorAll('input[type="radio"][name^="correct_"]');
        correctRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const questionItem = radio.closest('.question-item');
                if (!questionItem) return;
                
                const questionId = questionItem.dataset.questionId;
                const questionIndex = this.currentContent.questions.findIndex(q => q.id === questionId);
                if (questionIndex === -1) return;
                
                const question = this.currentContent.questions[questionIndex];
                const answerIndex = parseInt(radio.value);
                
                // Сбрасываем все ответы
                question.answers.forEach(answer => answer.correct = false);
                // Устанавливаем выбранный
                if (question.answers[answerIndex]) {
                    question.answers[answerIndex].correct = true;
                }
            });
        });
        
        // Время ответа
        const timeSelects = document.querySelectorAll('.question-time');
        timeSelects.forEach((select, index) => {
            select.addEventListener('change', (e) => {
                if (this.currentContent.questions[index]) {
                    this.currentContent.questions[index].timeLimit = parseInt(e.target.value);
                }
            });
        });
        
        // Настройки опросов
        const multipleChoice = document.querySelectorAll('.multiple-choice');
        multipleChoice.forEach((checkbox, index) => {
            checkbox.addEventListener('change', (e) => {
                if (this.currentContent.questions[index]) {
                    this.currentContent.questions[index].multipleChoice = e.target.checked;
                }
            });
        });
        
        const showResults = document.querySelectorAll('.show-results');
        showResults.forEach((checkbox, index) => {
            checkbox.addEventListener('change', (e) => {
                if (this.currentContent.questions[index]) {
                    this.currentContent.questions[index].showResults = e.target.checked;
                }
            });
        });
    }
    
    // Добавить вопрос
    addQuestion() {
        const questionId = 'q' + (Date.now() + Math.random().toString(36).substr(2, 9));
        
        if (this.contentType === 'quiz') {
            const question = {
                id: questionId,
                question: '',
                answers: [
                    { text: '', correct: false },
                    { text: '', correct: false },
                    { text: '', correct: true },
                    { text: '', correct: false }
                ],
                timeLimit: 20
            };
            
            this.currentContent.questions.push(question);
        } else {
            const question = {
                id: questionId,
                question: '',
                options: [
                    { text: '', votes: 0 },
                    { text: '', votes: 0 },
                    { text: '', votes: 0 },
                    { text: '', votes: 0 }
                ],
                multipleChoice: false,
                showResults: true
            };
            
            this.currentContent.questions.push(question);
        }
        
        // Перерендериваем
        this.rerenderQuestions();
    }
    
    // Удалить вопрос
    removeQuestion(questionId) {
        if (this.currentContent.questions.length <= 1) {
            showNotification('Ошибка', 'Должен остаться хотя бы один вопрос', '#ff5555');
            return;
        }
        
        this.currentContent.questions = this.currentContent.questions.filter(q => q.id !== questionId);
        this.rerenderQuestions();
    }
    
    // Перерендерить вопросы
    rerenderQuestions() {
        const questionsList = document.getElementById('questionsList');
        if (!questionsList) return;
        
        if (this.contentType === 'quiz') {
            questionsList.innerHTML = this.renderQuizQuestions();
        } else {
            questionsList.innerHTML = this.renderPollQuestions();
        }
        
        this.setupQuestionHandlers();
    }
    
    // Сохранить контент
    saveContent() {
        // Получаем данные из формы
        const title = document.getElementById('contentTitle')?.value.trim();
        const description = document.getElementById('contentDescription')?.value.trim();
        const category = document.getElementById('contentCategory')?.value;
        const isPublic = document.getElementById('contentPublic')?.checked;
        
        if (!title || title.length < 3) {
            showNotification('Ошибка', 'Введите название (мин. 3 символа)', '#ff5555');
            return;
        }
        
        if (this.currentContent.questions.length === 0) {
            showNotification('Ошибка', 'Добавьте хотя бы один вопрос', '#ff5555');
            return;
        }
        
        // Проверяем вопросы
        for (const question of this.currentContent.questions) {
            if (!question.question.trim()) {
                showNotification('Ошибка', 'Заполните текст всех вопросов', '#ff5555');
                return;
            }
            
            if (this.contentType === 'quiz') {
                // Проверяем ответы викторины
                const hasEmptyAnswer = question.answers.some(answer => !answer.text.trim());
                if (hasEmptyAnswer) {
                    showNotification('Ошибка', 'Заполните все варианты ответов', '#ff5555');
                    return;
                }
                
                const hasCorrectAnswer = question.answers.some(answer => answer.correct);
                if (!hasCorrectAnswer) {
                    showNotification('Ошибка', 'Укажите правильный ответ для каждого вопроса', '#ff5555');
                    return;
                }
            } else {
                // Проверяем опции опроса
                const hasEmptyOption = question.options.some(option => !option.text.trim());
                if (hasEmptyOption) {
                    showNotification('Ошибка', 'Заполните все варианты ответов', '#ff5555');
                    return;
                }
            }
        }
        
        // Собираем данные
        const contentData = {
            title: title,
            description: description,
            category: category,
            questions: this.currentContent.questions,
            createdBy: this.gameManager.currentState.user.id,
            isPublic: isPublic,
            createdAt: new Date().toISOString()
        };
        
        if (this.contentType === 'quiz') {
            contentData.difficulty = document.getElementById('contentDifficulty')?.value || 'medium';
            contentData.type = 'quiz';
            
            // Сохраняем викторину
            if (!Database.data.quizzes) Database.data.quizzes = [];
            contentData.id = 'quiz_' + Date.now();
            Database.data.quizzes.push(contentData);
        } else {
            contentData.type = 'poll';
            
            // Сохраняем опрос
            if (!Database.data.polls) Database.data.polls = [];
            contentData.id = 'poll_' + Date.now();
            Database.data.polls.push(contentData);
        }
        
        Database.save();
        
        showNotification('Успех!', 
            this.contentType === 'quiz' ? 'Викторина создана!' : 'Опрос создан!', 
            '#00ff9d');
        
        this.closeCreator();
        
        // Обновляем главное меню
        setTimeout(() => {
            if (this.gameManager) {
                this.gameManager.showScreen('menu');
            }
        }, 1500);
    }
    
    // Закрыть создатель
    closeCreator() {
        const modal = document.getElementById('createContentModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // Редактировать контент
    editContent(contentId, type) {
        let content = null;
        
        if (type === 'quiz') {
            content = Database.data.quizzes?.find(q => q.id === contentId);
        } else {
            content = Database.data.polls?.find(p => p.id === contentId);
        }
        
        if (!content) {
            showNotification('Ошибка', 'Контент не найден', '#ff5555');
            return;
        }
        
        this.contentType = type;
        this.currentContent = { ...content };
        
        this.renderContentCreator(
            type === 'quiz' ? 'РЕДАКТИРОВАНИЕ ВИКТОРИНЫ' : 'РЕДАКТИРОВАНИЕ ОПРОСА',
            type === 'quiz' ? 'fas fa-edit' : 'fas fa-poll'
        );
    }
    
    // Использовать контент
    useContent(contentId, type) {
        let content = null;
        
        if (type === 'quiz') {
            content = Database.data.quizzes?.find(q => q.id === contentId);
        } else {
            content = Database.data.polls?.find(p => p.id === contentId);
        }
        
        if (!content) {
            showNotification('Ошибка', 'Контент не найден', '#ff5555');
            return;
        }
        
        // Если пользователь в комнате, устанавливаем этот контент
        if (this.gameManager.currentState.roomCode) {
            const gameType = document.getElementById('gameType');
            const contentSelect = document.getElementById('contentSelect');
            
            if (gameType && contentSelect) {
                gameType.value = type;
                this.gameManager.updateGameType(type);
                
                // Ищем наш контент в списке
                for (let i = 0; i < contentSelect.options.length; i++) {
                    if (contentSelect.options[i].value === 'my') {
                        contentSelect.selectedIndex = i;
                        break;
                    }
                }
                
                showNotification('Контент выбран', 
                    type === 'quiz' ? `Викторина "${content.title}" будет использована` : 
                                     `Опрос "${content.title}" будет использован`,
                    '#00ff9d');
            }
        } else {
            showNotification('Создайте комнату', 'Сначала создайте комнату для игры', '#ffaa00');
        }
        
        // Закрываем модальное окно если открыто
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
        }
    }
    
    // Удалить контент
    deleteContent(contentId, type) {
        if (!confirm('Вы уверены, что хотите удалить?')) return;
        
        let success = false;
        
        if (type === 'quiz') {
            if (Database.data.quizzes) {
                const index = Database.data.quizzes.findIndex(q => q.id === contentId);
                if (index !== -1) {
                    Database.data.quizzes.splice(index, 1);
                    success = true;
                }
            }
        } else {
            if (Database.data.polls) {
                const index = Database.data.polls.findIndex(p => p.id === contentId);
                if (index !== -1) {
                    Database.data.polls.splice(index, 1);
                    success = true;
                }
            }
        }
        
        if (success) {
            Database.save();
            showNotification('Успех', 'Удалено успешно', '#00ff9d');
            
            // Обновляем список
            this.showMyContent();
        } else {
            showNotification('Ошибка', 'Не удалось удалить', '#ff5555');
        }
    }
}

// Инициализация QuizManager
let quizManager = null;

// Функция для инициализации
function initQuizManager() {
    if (!quizManager && window.game) {
        quizManager = new QuizManager(window.game);
        window.quizManager = quizManager;
        console.log('QuizManager инициализирован');
    }
    return quizManager;
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initQuizManager();
    }, 1000);
});

// Автоматическая инициализация при клике
document.addEventListener('click', function(e) {
    const target = e.target.closest('[onclick*="quizManager"]');
    if (target && !quizManager) {
        initQuizManager();
    }
}, true);
