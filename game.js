// game.js - Основная логика игры

// Функция для показа уведомлений
function showNotification(title, text, color) {
    const notification = document.getElementById('notification');
    const titleEl = document.getElementById('notificationTitle');
    const textEl = document.getElementById('notificationText');
    
    if (!notification || !titleEl || !textEl) return;
    
    titleEl.textContent = title;
    textEl.textContent = text;
    notification.style.borderColor = color;
    notification.style.display = 'block';
    
    // Автоматически скрыть через 5 секунд
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

class GameManager {
    constructor() {
        this.currentState = {
            user: null,
            currentRoom: null,
            gameScreen: 'auth',
            playerName: 'Игрок',
            isHost: false,
            roomCode: null,
            currentQuiz: null,
            gameInProgress: false
        };
        
        this.playerListInterval = null;
        this.roomsUpdateInterval = null;
        this.gameTimerInterval = null;
        this.questionTimer = null;
        
        // Инициализация менеджеров
        this.realtimeManager = null;
        this.quizManager = null;
        
        // Загружаем пользователя из localStorage
        this.loadSavedUser();
        this.initializeEventListeners();
        this.loadUserPreferences();
    }
    
    // Загрузка сохраненного пользователя
    loadSavedUser() {
        try {
            const savedName = localStorage.getItem('quiz_player_name');
            if (savedName) {
                this.currentState.playerName = savedName;
            }
            
            const lastUserId = localStorage.getItem('last_user_id');
            if (lastUserId && Database) {
                const user = Database.findUserById(lastUserId);
                if (user) {
                    this.currentState.user = user;
                    this.currentState.playerName = user.username;
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
        }
    }
    
    // Инициализация обработчиков событий
    initializeEventListeners() {
        // ... (все обработчики из предыдущей версии, дополненные новыми)
        
        // Добавляем обработчики для новых элементов
        this.setupRoomSettingsHandlers();
        this.setupGameHandlers();
    }
    
    // Настройка обработчиков настроек комнаты
    setupRoomSettingsHandlers() {
        const quizTheme = document.getElementById('quizTheme');
        if (quizTheme) {
            quizTheme.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    document.getElementById('customQuizGroup').style.display = 'block';
                    this.loadCustomQuizzes();
                } else {
                    document.getElementById('customQuizGroup').style.display = 'none';
                }
            });
        }
        
        const myQuizzesBtn = document.getElementById('myQuizzesBtn');
        if (myQuizzesBtn) {
            myQuizzesBtn.addEventListener('click', () => {
                if (this.quizManager) {
                    this.quizManager.showMyQuizzes();
                }
            });
        }
    }
    
    // Настройка обработчиков игры
    setupGameHandlers() {
        // Обработчики для игрового экрана будут добавлены динамически
    }
    
    // Создание комнаты с викториной
    createRoomWithQuiz(quizId) {
        const roomCode = this.generateRoomCode();
        const hostName = this.currentState.playerName;
        const hostId = this.currentState.user ? this.currentState.user.id : null;
        const quiz = Database.findQuizById(quizId);
        
        if (!quiz) {
            showNotification('Ошибка', 'Викторина не найдена', '#ff5555');
            return;
        }
        
        const room = Database.createRoom(roomCode, hostName, hostId, quizId, quiz.questions[0]?.timeLimit || 20);
        
        if (room) {
            this.currentState.currentRoom = room;
            this.currentState.roomCode = roomCode;
            this.currentState.isHost = true;
            this.currentState.currentQuiz = quiz;
            
            this.showRoomCode(roomCode);
            this.updateRecentRooms();
            
            // Устанавливаем тему викторины
            const quizTheme = document.getElementById('quizTheme');
            if (quizTheme) {
                quizTheme.value = quiz.category;
            }
            
            // Устанавливаем лимит времени
            const questionTime = document.getElementById('questionTime');
            if (questionTime) {
                questionTime.value = quiz.questions[0]?.timeLimit || 20;
            }
            
            showNotification('Комната создана!', `Викторина: ${quiz.title}`, '#00ff9d');
        }
    }
    
    // Загрузка пользовательских викторин
    loadCustomQuizzes() {
        const customQuizSelect = document.getElementById('customQuizSelect');
        if (!customQuizSelect) return;
        
        const user = this.currentState.user;
        if (!user) {
            customQuizSelect.innerHTML = '<option>Войдите в аккаунт</option>';
            return;
        }
        
        const quizzes = Database.findQuizzesByUser(user.id);
        
        if (quizzes.length === 0) {
            customQuizSelect.innerHTML = '<option>Нет созданных викторин</option>';
            return;
        }
        
        customQuizSelect.innerHTML = quizzes.map(quiz => 
            `<option value="${quiz.id}">${quiz.title}</option>`
        ).join('');
    }
    
    // Начать игру
    startGame() {
        if (!this.currentState.isHost) return;
        
        const quizTheme = document.getElementById('quizTheme')?.value;
        const timeLimit = document.getElementById('questionTime')?.value;
        
        if (quizTheme === 'custom') {
            const quizId = document.getElementById('customQuizSelect')?.value;
            const quiz = Database.findQuizById(quizId);
            
            if (!quiz) {
                showNotification('Ошибка', 'Выберите викторину', '#ff5555');
                return;
            }
            
            this.currentState.currentQuiz = quiz;
        } else {
            // Загружаем викторину по теме
            const quizzes = Database.findPublicQuizzes(quizTheme);
            if (quizzes.length > 0) {
                // Берем случайную викторину
                const randomQuiz = quizzes[Math.floor(Math.random() * quizzes.length)];
                this.currentState.currentQuiz = randomQuiz;
            } else {
                // Создаем тестовую викторину
                this.currentState.currentQuiz = this.createTestQuiz(quizTheme);
            }
        }
        
        // Обновляем комнату
        Database.updateRoom(this.currentState.roomCode, {
            gameState: 'playing',
            quizId: this.currentState.currentQuiz?.id,
            timeLimit: parseInt(timeLimit) || 20,
            currentQuestion: 0,
            questionStartTime: Date.now(),
            results: []
        });
        
        // Показываем игровой экран
        this.showGameScreen();
    }
    
    // Показать игровой экран
    showGameScreen() {
        this.showScreen('game');
        
        const room = Database.findRoomByCode(this.currentState.roomCode);
        if (!room || !this.currentState.currentQuiz) return;
        
        const quiz = this.currentState.currentQuiz;
        const currentQuestion = quiz.questions[room.currentQuestion];
        
        // Отображаем вопрос
        this.displayQuestion(currentQuestion, room.currentQuestion + 1, quiz.questions.length);
        
        // Запускаем таймер
        if (room.timeLimit > 0) {
            this.startQuestionTimer(room.timeLimit);
        }
        
        // Запускаем обновление игры
        if (this.realtimeManager) {
            this.realtimeManager.startRoomUpdates(this.currentState.roomCode);
        }
    }
    
    // Отобразить вопрос
    displayQuestion(question, questionNumber, totalQuestions) {
        const questionContainer = document.getElementById('questionContainer');
        const answersContainer = document.getElementById('answersContainer');
        const currentQuestionEl = document.getElementById('currentQuestion');
        const totalQuestionsEl = document.getElementById('totalQuestions');
        
        if (!questionContainer || !answersContainer) return;
        
        // Обновляем счетчик вопросов
        if (currentQuestionEl) currentQuestionEl.textContent = questionNumber;
        if (totalQuestionsEl) totalQuestionsEl.textContent = totalQuestions;
        
        // Отображаем вопрос
        questionContainer.innerHTML = `
            <div class="question-text">${question.question}</div>
        `;
        
        // Отображаем ответы
        answersContainer.innerHTML = '';
        question.answers.forEach((answer, index) => {
            const answerBtn = document.createElement('button');
            answerBtn.className = 'answer-btn';
            answerBtn.textContent = answer.text;
            answerBtn.dataset.answerIndex = index;
            answerBtn.dataset.correct = answer.correct;
            
            answerBtn.addEventListener('click', () => {
                this.selectAnswer(index, answer.correct);
            });
            
            answersContainer.appendChild(answerBtn);
        });
        
        // Обновляем список игроков
        this.updateGamePlayers();
    }
    
    // Выбрать ответ
    selectAnswer(answerIndex, isCorrect) {
        if (!this.currentState.user || !this.currentState.roomCode) return;
        
        const room = Database.findRoomByCode(this.currentState.roomCode);
        if (!room || room.gameState !== 'playing') return;
        
        // Помечаем ответ игрока
        const player = room.players.find(p => p.id === this.currentState.user.id);
        if (player) {
            player.currentAnswer = answerIndex;
            player.answered = true;
            
            // Начисляем очки
            if (isCorrect) {
                const timeLeft = this.calculateTimeLeft(room);
                const points = Math.max(10, Math.floor(timeLeft * 2));
                player.score += points;
            }
            
            Database.updateRoom(room.code, { players: room.players });
            
            // Показываем результат
            this.showAnswerResult(isCorrect);
            
            // Если все ответили, переходим дальше
            if (this.allPlayersAnswered(room) && this.currentState.isHost) {
                setTimeout(() => {
                    this.nextQuestion();
                }, 3000);
            }
        }
    }
    
    // Показать результат ответа
    showAnswerResult(isCorrect) {
        const answerBtns = document.querySelectorAll('.answer-btn');
        answerBtns.forEach(btn => {
            if (btn.dataset.correct === 'true') {
                btn.classList.add('correct');
            } else if (parseInt(btn.dataset.answerIndex) === this.currentAnswer) {
                btn.classList.add('incorrect');
            }
            btn.disabled = true;
        });
        
        showNotification(
            isCorrect ? 'Правильно!' : 'Неправильно',
            isCorrect ? 'Отличный ответ!' : 'Попробуйте в следующий раз',
            isCorrect ? '#00ff9d' : '#ff5555'
        );
    }
    
    // Все игроки ответили
    allPlayersAnswered(room) {
        return room.players.every(player => player.answered);
    }
    
    // Следующий вопрос
    nextQuestion() {
        const room = Database.findRoomByCode(this.currentState.roomCode);
        if (!room || !this.currentState.currentQuiz) return;
        
        const quiz = this.currentState.currentQuiz;
        
        if (room.currentQuestion < quiz.questions.length - 1) {
            // Переходим к следующему вопросу
            room.currentQuestion++;
            room.questionStartTime = Date.now();
            room.players.forEach(player => {
                player.answered = false;
                player.currentAnswer = null;
            });
            
            Database.updateRoom(room.code, {
                currentQuestion: room.currentQuestion,
                questionStartTime: room.questionStartTime,
                players: room.players
            });
            
            // Отображаем новый вопрос
            const currentQuestion = quiz.questions[room.currentQuestion];
            this.displayQuestion(currentQuestion, room.currentQuestion + 1, quiz.questions.length);
            
            // Сбрасываем таймер
            if (this.questionTimer) {
                clearInterval(this.questionTimer);
            }
            if (room.timeLimit > 0) {
                this.startQuestionTimer(room.timeLimit);
            }
        } else {
            // Конец игры
            this.endGame();
        }
    }
    
    // Завершить игру
    endGame() {
        const room = Database.findRoomByCode(this.currentState.roomCode);
        if (!room) return;
        
        // Определяем победителей
        const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
        const winners = sortedPlayers.filter(p => p.score === sortedPlayers[0].score);
        
        // Обновляем статистику игроков
        room.players.forEach(player => {
            if (player.id.startsWith('user_')) {
                Database.updateUserStats(player.id, {
                    won: winners.some(w => w.id === player.id),
                    score: player.score
                });
            }
        });
        
        // Показываем результаты
        this.showGameResults(sortedPlayers, winners);
        
        // Обновляем состояние комнаты
        Database.updateRoom(room.code, {
            gameState: 'finished',
            results: sortedPlayers
        });
    }
    
    // Показать результаты игры
    showGameResults(players, winners) {
        this.showScreen('results');
        
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-container';
        
        let resultsHTML = `
            <h2><i class="fas fa-trophy"></i> РЕЗУЛЬТАТЫ ИГРЫ</h2>
            <div class="winners">
                <h3>Победители:</h3>
                ${winners.map(winner => `
                    <div class="winner">
                        <div class="winner-avatar">${winner.avatar}</div>
                        <div class="winner-name">${winner.name}</div>
                        <div class="winner-score">${winner.score} очков</div>
                    </div>
                `).join('')}
            </div>
            <div class="leaderboard">
                <h3>Общий зачет:</h3>
                ${players.map((player, index) => `
                    <div class="leaderboard-item ${index < 3 ? 'podium-' + (index + 1) : ''}">
                        <div class="rank">${index + 1}</div>
                        <div class="player-avatar">${player.avatar}</div>
                        <div class="player-name">${player.name}</div>
                        <div class="player-score">${player.score} очков</div>
                    </div>
                `).join('')}
            </div>
            <div class="results-actions">
                <button class="btn btn-primary" onclick="game.returnToMenu()">
                    <i class="fas fa-home"></i> В меню
                </button>
                <button class="btn btn-secondary" onclick="game.playAgain()">
                    <i class="fas fa-redo"></i> Играть снова
                </button>
            </div>
        `;
        
        resultsContainer.innerHTML = resultsHTML;
        
        const mainContainer = document.getElementById('mainContainer');
        if (mainContainer) {
            mainContainer.innerHTML = '';
            mainContainer.appendChild(resultsContainer);
        }
    }
    
    // Сменить имя пользователя
    changeUsername() {
        document.getElementById('usernameModal').style.display = 'flex';
        document.getElementById('newUsername').value = this.currentState.playerName;
        document.getElementById('newUsername').focus();
    }
    
    // Сохранить имя пользователя
    saveUsername() {
        const newUsername = document.getElementById('newUsername')?.value.trim();
        if (!newUsername || newUsername.length < 2) {
            showNotification('Ошибка', 'Имя должно содержать минимум 2 символа', '#ff5555');
            return;
        }
        
        this.currentState.playerName = newUsername;
        this.currentState.user.username = newUsername;
        
        // Сохраняем в localStorage
        localStorage.setItem('quiz_player_name', newUsername);
        
        // Обновляем в базе данных
        if (Database && this.currentState.user.id) {
            Database.updateUser(this.currentState.user.id, { username: newUsername });
        }
        
        // Обновляем UI
        this.updateProfileInfo();
        
        // Скрываем модальное окно
        this.hideModal('usernameModal');
        
        showNotification('Успех', 'Имя изменено', '#00ff9d');
    }
    
    // Сменить аватар
    changeAvatar() {
        document.getElementById('avatarModal').style.display = 'flex';
        this.loadAvatarOptions();
    }
    
    // Загрузить варианты аватаров
    loadAvatarOptions() {
        const avatarGrid = document.getElementById('avatarGrid');
        if (!avatarGrid) return;
        
        const avatars = [
            '😀', '😎', '🤓', '😊', '😍', '🥳', '🤖', '👻',
            '🐱', '🐶', '🐼', '🦊', '🐯', '🦁', '🐮', '🐷',
            '⭐', '🌟', '💫', '✨', '🔥', '💥', '🌈', '☀️'
        ];
        
        avatarGrid.innerHTML = '';
        avatars.forEach((avatar, index) => {
            const avatarOption = document.createElement('div');
            avatarOption.className = 'avatar-option';
            if (this.currentState.user?.avatar === avatar) {
                avatarOption.classList.add('selected');
            }
            avatarOption.textContent = avatar;
            avatarOption.dataset.avatar = avatar;
            
            avatarOption.addEventListener('click', () => {
                this.selectAvatar(avatar);
            });
            
            avatarGrid.appendChild(avatarOption);
        });
    }
    
    // Выбрать аватар
    selectAvatar(avatar) {
        this.currentState.user.avatar = avatar;
        
        // Сохраняем в базе данных
        if (Database && this.currentState.user.id) {
            Database.updateUser(this.currentState.user.id, { avatar: avatar });
        }
        
        // Обновляем UI
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            userAvatar.textContent = avatar;
        }
        
        // Показываем выбранный аватар
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.avatar === avatar) {
                option.classList.add('selected');
            }
        });
        
        showNotification('Успех', 'Аватар изменен', '#00ff9d');
    }
    
    // Скрыть модальное окно
    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
    
    // Вернуться в меню
    returnToMenu() {
        this.leaveRoom();
        this.showMainMenu();
    }
    
    // Играть снова
    playAgain() {
        // Создаем новую комнату с той же викториной
        if (this.currentState.currentQuiz) {
            this.createRoomWithQuiz(this.currentState.currentQuiz.id);
        } else {
            this.showScreen('room');
        }
    }
    
    // Создать тестовую викторину
    createTestQuiz(category) {
        const questions = {
            general: [
                {
                    question: 'Сколько планет в Солнечной системе?',
                    answers: [
                        { text: '7', correct: false },
                        { text: '8', correct: true },
                        { text: '9', correct: false },
                        { text: '10', correct: false }
                    ],
                    timeLimit: 20
                }
            ],
            science: [
                {
                    question: 'Какой химический элемент имеет символ Au?',
                    answers: [
                        { text: 'Серебро', correct: false },
                        { text: 'Золото', correct: true },
                        { text: 'Алюминий', correct: false },
                        { text: 'Аргон', correct: false }
                    ],
                    timeLimit: 15
                }
            ],
            // ... другие категории
        };
        
        return {
            id: 'test_quiz_' + category,
            title: 'Тестовая викторина: ' + category,
            description: 'Тестовые вопросы',
            category: category,
            difficulty: 'medium',
            questions: questions[category] || questions.general,
            createdBy: 'system',
            isPublic: true
        };
    }
    
    // Обновить игроков в игре
    updateGamePlayers() {
        const room = Database.findRoomByCode(this.currentState.roomCode);
        if (!room) return;
        
        const gamePlayers = document.getElementById('gamePlayers');
        if (!gamePlayers) return;
        
        gamePlayers.innerHTML = '';
        room.players.forEach(player => {
            const playerEl = document.createElement('div');
            playerEl.className = 'game-player';
            playerEl.innerHTML = `
                <div class="game-player-avatar">${player.avatar}</div>
                <div class="game-player-info">
                    <div class="game-player-name">${player.name}</div>
                    <div class="game-player-score">${player.score} очков</div>
                    <div class="game-player-status ${player.answered ? 'answered' : 'waiting'}">
                        ${player.answered ? '✓ Отвечено' : '⌛ Ожидание'}
                    </div>
                </div>
            `;
            gamePlayers.appendChild(playerEl);
        });
    }
    
    // Запустить таймер вопроса
    startQuestionTimer(timeLimit) {
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
        }
        
        let timeLeft = timeLimit;
        const gameTimer = document.getElementById('gameTimer');
        
        this.questionTimer = setInterval(() => {
            timeLeft--;
            
            if (gameTimer) {
                gameTimer.textContent = timeLeft;
                
                // Меняем цвет при малом времени
                if (timeLeft <= 5) {
                    gameTimer.style.color = '#ff5555';
                } else if (timeLeft <= 10) {
                    gameTimer.style.color = '#ffaa00';
                }
            }
            
            if (timeLeft <= 0) {
                clearInterval(this.questionTimer);
                if (this.currentState.isHost) {
                    this.nextQuestion();
                }
            }
        }, 1000);
    }
    
    // Рассчитать оставшееся время
    calculateTimeLeft(room) {
        if (!room.questionStartTime || room.timeLimit === 0) return 0;
        
        const now = Date.now();
        const elapsed = Math.floor((now - room.questionStartTime) / 1000);
        return Math.max(0, room.timeLimit - elapsed);
    }
    
    // Инициализировать менеджеры
    initManagers() {
        this.realtimeManager = new RealtimeManager(this);
        this.quizManager = new QuizManager(this);
        
        // Экспортируем для глобального доступа
        window.quizManager = this.quizManager;
    }
}

// Создаем глобальный экземпляр GameManager
const game = new GameManager();

// Инициализация при загрузке
window.addEventListener('load', () => {
    game.hideLoader();
    
    // Инициализируем менеджеры
    game.initManagers();
    
    // Если есть сохраненный пользователь, показываем главное меню
    if (game.currentState.user) {
        game.showMainMenu();
    }
    
    console.log('Neon Quiz Battle инициализирован!');
});
