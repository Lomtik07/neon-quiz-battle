// quiz-manager.js - Управление созданием и редактированием викторин

class QuizManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.availableCategories = [
            { id: 'general', name: 'Общая', icon: 'fas fa-globe' },
            { id: 'science', name: 'Наука', icon: 'fas fa-flask' },
            { id: 'history', name: 'История', icon: 'fas fa-landmark' },
            { id: 'geography', name: 'География', icon: 'fas fa-globe-americas' },
            { id: 'entertainment', name: 'Развлечения', icon: 'fas fa-film' },
            { id: 'sports', name: 'Спорт', icon: 'fas fa-running' },
            { id: 'art', name: 'Искусство', icon: 'fas fa-palette' },
            { id: 'technology', name: 'Технологии', icon: 'fas fa-laptop-code' }
        ];
        
        this.availableDifficulties = [
            { id: 'easy', name: 'Легкая', color: '#00ff9d' },
            { id: 'medium', name: 'Средняя', color: '#ffaa00' },
            { id: 'hard', name: 'Сложная', color: '#ff5555' }
        ];
    }
    
    // Показать создание викторины
    showCreateQuiz() {
        this.currentQuiz = {
            title: '',
            description: '',
            category: 'general',
            difficulty: 'medium',
            questions: [],
            isPublic: true
        };
        
        this.renderQuizCreator();
        this.gameManager.showScreen('quizCreator');
    }
    
    // Отрендерить создание викторины
    renderQuizCreator() {
        const container = document.querySelector('.quiz-creator');
        if (!container) return;
        
        container.innerHTML = `
            <div class="quiz-form">
                <div class="quiz-form-group">
                    <label><i class="fas fa-heading"></i> Название викторины</label>
                    <input type="text" id="quizTitle" class="input-field" 
                           placeholder="Введите название" maxlength="50">
                </div>
                
                <div class="quiz-form-group">
                    <label><i class="fas fa-align-left"></i> Описание</label>
                    <textarea id="quizDescription" class="input-field" 
                              placeholder="Описание викторины" rows="3"></textarea>
                </div>
                
                <div class="quiz-form-row">
                    <div class="quiz-form-group">
                        <label><i class="fas fa-folder"></i> Категория</label>
                        <select id="quizCategory" class="input-field">
                            ${this.availableCategories.map(cat => 
                                `<option value="${cat.id}">${cat.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="quiz-form-group">
                        <label><i class="fas fa-chart-line"></i> Сложность</label>
                        <select id="quizDifficulty" class="input-field">
                            ${this.availableDifficulties.map(diff => 
                                `<option value="${diff.id}">${diff.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="quiz-form-group">
                    <label class="switch">
                        <input type="checkbox" id="quizPublic" checked>
                        <span class="slider"></span>
                        <span class="switch-label">Сделать викторину публичной</span>
                    </label>
                </div>
                
                <hr>
                
                <h3><i class="fas fa-question-circle"></i> Вопросы</h3>
                
                <div id="questionsList">
                    <!-- Вопросы будут добавлены здесь -->
                </div>
                
                <button id="addQuestionBtn" class="btn btn-secondary add-question-btn">
                    <i class="fas fa-plus"></i> ДОБАВИТЬ ВОПРОС
                </button>
                
                <div class="quiz-actions">
                    <button id="saveQuizBtn" class="btn btn-primary">
                        <i class="fas fa-save"></i> СОХРАНИТЬ ВИКТОРИНУ
                    </button>
                    <button id="cancelQuizBtn" class="btn btn-danger">
                        <i class="fas fa-times"></i> ОТМЕНА
                    </button>
                </div>
            </div>
        `;
        
        // Инициализация обработчиков событий
        this.initQuizCreatorHandlers();
        
        // Добавляем первый вопрос
        this.addQuestion();
    }
    
    // Инициализировать обработчики создателя викторины
    initQuizCreatorHandlers() {
        // Добавление вопроса
        const addQuestionBtn = document.getElementById('addQuestionBtn');
        if (addQuestionBtn) {
            addQuestionBtn.addEventListener('click', () => {
                this.addQuestion();
            });
        }
        
        // Сохранение викторины
        const saveQuizBtn = document.getElementById('saveQuizBtn');
        if (saveQuizBtn) {
            saveQuizBtn.addEventListener('click', () => {
                this.saveQuiz();
            });
        }
        
        // Отмена создания
        const cancelQuizBtn = document.getElementById('cancelQuizBtn');
        if (cancelQuizBtn) {
            cancelQuizBtn.addEventListener('click', () => {
                this.hideQuizCreator();
            });
        }
    }
    
    // Добавить вопрос
    addQuestion() {
        const questionId = 'q' + (this.currentQuiz.questions.length + 1);
        const question = {
            id: questionId,
            question: '',
            answers: [
                { text: '', correct: false },
                { text: '', correct: false },
                { text: '', correct: false },
                { text: '', correct: false }
            ],
            timeLimit: 20
        };
        
        this.currentQuiz.questions.push(question);
        this.renderQuestion(question);
    }
    
    // Отрендерить вопрос
    renderQuestion(question) {
        const questionsList = document.getElementById('questionsList');
        if (!questionsList) return;
        
        const questionIndex = this.currentQuiz.questions.indexOf(question);
        const questionNumber = questionIndex + 1;
        
        const questionElement = document.createElement('div');
        questionElement.className = 'question-item';
        questionElement.dataset.questionId = question.id;
        
        questionElement.innerHTML = `
            <div class="question-header">
                <div class="question-number">Вопрос ${questionNumber}</div>
                <button class="remove-question" data-question-id="${question.id}">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
            
            <div class="quiz-form-group">
                <label>Текст вопроса</label>
                <textarea class="input-field question-text" 
                          placeholder="Введите текст вопроса" 
                          rows="2">${question.question}</textarea>
            </div>
            
            <div class="quiz-form-group">
                <label>Варианты ответов</label>
                ${question.answers.map((answer, index) => `
                    <div class="answer-option">
                        <input type="text" class="input-field answer-text" 
                               placeholder="Вариант ответа ${index + 1}" 
                               value="${answer.text}">
                        <div class="correct-answer">
                            <input type="radio" name="correct_${question.id}" 
                                   value="${index}" ${answer.correct ? 'checked' : ''}>
                            <span>Правильный ответ</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="quiz-form-group">
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
        `;
        
        questionsList.appendChild(questionElement);
        
        // Добавляем обработчики для этого вопроса
        this.initQuestionHandlers(questionElement, question);
    }
    
    // Инициализировать обработчики вопроса
    initQuestionHandlers(element, question) {
        // Удаление вопроса
        const removeBtn = element.querySelector('.remove-question');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeQuestion(question.id);
            });
        }
        
        // Обновление текста вопроса
        const questionText = element.querySelector('.question-text');
        if (questionText) {
            questionText.addEventListener('input', (e) => {
                question.question = e.target.value;
            });
        }
        
        // Обновление ответов
        const answerTexts = element.querySelectorAll('.answer-text');
        answerTexts.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                question.answers[index].text = e.target.value;
            });
        });
        
        // Обновление правильного ответа
        const correctRadios = element.querySelectorAll(`input[name="correct_${question.id}"]`);
        correctRadios.forEach((radio, index) => {
            radio.addEventListener('change', () => {
                // Сбрасываем все ответы
                question.answers.forEach(answer => answer.correct = false);
                // Устанавливаем выбранный
                question.answers[index].correct = true;
            });
        });
        
        // Обновление времени
        const timeSelect = element.querySelector('.question-time');
        if (timeSelect) {
            timeSelect.addEventListener('change', (e) => {
                question.timeLimit = parseInt(e.target.value);
            });
        }
    }
    
    // Удалить вопрос
    removeQuestion(questionId) {
        if (this.currentQuiz.questions.length <= 1) {
            showNotification('Ошибка', 'В викторине должен быть хотя бы один вопрос', '#ff5555');
            return;
        }
        
        this.currentQuiz.questions = this.currentQuiz.questions.filter(q => q.id !== questionId);
        
        // Перерендериваем все вопросы
        this.rerenderQuestions();
    }
    
    // Перерендерить вопросы
    rerenderQuestions() {
        const questionsList = document.getElementById('questionsList');
        if (!questionsList) return;
        
        questionsList.innerHTML = '';
        this.currentQuiz.questions.forEach(question => {
            this.renderQuestion(question);
        });
    }
    
    // Сохранить викторину
    saveQuiz() {
        // Собираем данные из формы
        const title = document.getElementById('quizTitle')?.value.trim();
        const description = document.getElementById('quizDescription')?.value.trim();
        const category = document.getElementById('quizCategory')?.value;
        const difficulty = document.getElementById('quizDifficulty')?.value;
        const isPublic = document.getElementById('quizPublic')?.checked;
        
        // Валидация
        if (!title || title.length < 3) {
            showNotification('Ошибка', 'Введите название викторины (мин. 3 символа)', '#ff5555');
            return;
        }
        
        if (this.currentQuiz.questions.length === 0) {
            showNotification('Ошибка', 'Добавьте хотя бы один вопрос', '#ff5555');
            return;
        }
        
        // Проверяем вопросы
        for (const question of this.currentQuiz.questions) {
            if (!question.question.trim()) {
                showNotification('Ошибка', 'Заполните текст всех вопросов', '#ff5555');
                return;
            }
            
            // Проверяем ответы
            const hasEmptyAnswer = question.answers.some(answer => !answer.text.trim());
            if (hasEmptyAnswer) {
                showNotification('Ошибка', 'Заполните все варианты ответов', '#ff5555');
                return;
            }
            
            // Проверяем правильный ответ
            const hasCorrectAnswer = question.answers.some(answer => answer.correct);
            if (!hasCorrectAnswer) {
                showNotification('Ошибка', 'Укажите правильный ответ для каждого вопроса', '#ff5555');
                return;
            }
        }
        
        // Собираем данные викторины
        const quizData = {
            title: title,
            description: description,
            category: category,
            difficulty: difficulty,
            questions: this.currentQuiz.questions,
            createdBy: this.gameManager.currentState.user?.id,
            isPublic: isPublic
        };
        
        // Сохраняем в базу данных
        const quiz = Database.createQuiz(quizData);
        
        showNotification('Успех!', 'Викторина успешно создана', '#00ff9d');
        
        // Возвращаемся в меню
        setTimeout(() => {
            this.hideQuizCreator();
            this.gameManager.showScreen('menu');
        }, 1500);
    }
    
    // Скрыть создание викторины
    hideQuizCreator() {
        this.gameManager.showScreen('menu');
    }
    
    // Показать мои викторины
    showMyQuizzes() {
        const user = this.gameManager.currentState.user;
        if (!user) {
            showNotification('Ошибка', 'Войдите в аккаунт', '#ff5555');
            return;
        }
        
        this.renderMyQuizzes();
        this.gameManager.showScreen('myQuizzes');
    }
    
    // Отрендерить мои викторины
    renderMyQuizzes() {
        const container = document.getElementById('myQuizzesList');
        if (!container) return;
        
        const user = this.gameManager.currentState.user;
        const quizzes = Database.findQuizzesByUser(user.id);
        
        if (quizzes.length === 0) {
            container.innerHTML = `
                <div class="no-quizzes">
                    <i class="fas fa-inbox" style="font-size: 3rem; color: #00f3ff; margin-bottom: 20px;"></i>
                    <h3>У вас нет созданных викторин</h3>
                    <p>Создайте свою первую викторину!</p>
                    <button class="btn btn-primary" onclick="quizManager.showCreateQuiz()">
                        <i class="fas fa-plus"></i> СОЗДАТЬ ВИКТОРИНУ
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        quizzes.forEach(quiz => {
            const category = this.availableCategories.find(c => c.id === quiz.category);
            const difficulty = this.availableDifficulties.find(d => d.id === quiz.difficulty);
            
            const quizElement = document.createElement('div');
            quizElement.className = 'quiz-card';
            
            quizElement.innerHTML = `
                <div class="quiz-title">${quiz.title}</div>
                <div class="quiz-description">${quiz.description}</div>
                <div class="quiz-info">
                    <span class="quiz-category" style="color: ${difficulty?.color || '#00f3ff'}">
                        <i class="${category?.icon || 'fas fa-question'}"></i> ${category?.name || 'Другое'}
                    </span>
                    <span class="quiz-difficulty">
                        <i class="fas fa-chart-line"></i> ${difficulty?.name || 'Средняя'}
                    </span>
                    <span class="quiz-questions">
                        <i class="fas fa-question-circle"></i> ${quiz.questions.length} вопросов
                    </span>
                </div>
                <div class="quiz-actions">
                    <button class="btn btn-small btn-primary" onclick="quizManager.useQuiz('${quiz.id}')">
                        <i class="fas fa-play"></i> Играть
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="quizManager.editQuiz('${quiz.id}')">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button class="btn btn-small btn-danger" onclick="quizManager.deleteQuiz('${quiz.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            `;
            
            container.appendChild(quizElement);
        });
    }
    
    // Использовать викторину
    useQuiz(quizId) {
        const quiz = Database.findQuizById(quizId);
        if (!quiz) {
            showNotification('Ошибка', 'Викторина не найдена', '#ff5555');
            return;
        }
        
        // Создаем комнату с этой викториной
        this.gameManager.createRoomWithQuiz(quizId);
        this.hideMyQuizzes();
    }
    
    // Редактировать викторину
    editQuiz(quizId) {
        const quiz = Database.findQuizById(quizId);
        if (!quiz) {
            showNotification('Ошибка', 'Викторина не найдена', '#ff5555');
            return;
        }
        
        this.currentQuiz = { ...quiz };
        this.renderQuizCreator();
        
        // Заполняем форму
        document.getElementById('quizTitle').value = quiz.title;
        document.getElementById('quizDescription').value = quiz.description;
        document.getElementById('quizCategory').value = quiz.category;
        document.getElementById('quizDifficulty').value = quiz.difficulty;
        document.getElementById('quizPublic').checked = quiz.isPublic;
        
        this.gameManager.showScreen('quizCreator');
    }
    
    // Удалить викторину
    deleteQuiz(quizId) {
        if (confirm('Вы уверены, что хотите удалить эту викторину?')) {
            const success = Database.deleteQuiz(quizId);
            if (success) {
                showNotification('Успех', 'Викторина удалена', '#00ff9d');
                this.renderMyQuizzes();
            } else {
                showNotification('Ошибка', 'Не удалось удалить викторину', '#ff5555');
            }
        }
    }
    
    // Скрыть мои викторины
    hideMyQuizzes() {
        this.gameManager.showScreen('menu');
    }
    
    // Получить публичные викторины
    getPublicQuizzes(category = null) {
        return Database.findPublicQuizzes(category);
    }
    
    // Получить викторину по ID
    getQuizById(quizId) {
        return Database.findQuizById(quizId);
    }
}

// Создаем глобальный экземпляр
let quizManager = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Будет инициализирован в game.js
});
