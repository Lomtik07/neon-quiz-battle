// quiz-manager.js - Управление викторинами (упрощенная версия)

class QuizManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.currentQuiz = null;
        this.availableCategories = [
            { id: 'general', name: 'Общая', icon: 'fas fa-globe' },
            { id: 'science', name: 'Наука', icon: 'fas fa-flask' },
            { id: 'history', name: 'История', icon: 'fas fa-landmark' },
            { id: 'geography', name: 'География', icon: 'fas fa-globe-americas' },
            { id: 'entertainment', name: 'Развлечения', icon: 'fas fa-film' },
            { id: 'sports', name: 'Спорт', icon: 'fas fa-running' }
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
        
        // Создаем простое модальное окно
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <h3><i class="fas fa-edit"></i> СОЗДАНИЕ ВИКТОРИНЫ</h3>
                <p>Функция создания викторин находится в разработке.</p>
                <p>В следующем обновлении вы сможете:</p>
                <ul style="text-align: left; margin: 15px 0; padding-left: 20px;">
                    <li>Создавать собственные вопросы</li>
                    <li>Выбирать категории и сложность</li>
                    <li>Настраивать время ответов</li>
                    <li>Публиковать викторины для всех игроков</li>
                </ul>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i> ЗАКРЫТЬ
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Закрытие при клике на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // Показать мои викторины
    showMyQuizzes() {
        const user = this.gameManager.currentState.user;
        if (!user || user.isGuest) {
            showNotification('Требуется аккаунт', 'Для просмотра викторин нужно войти в аккаунт', '#ff5555');
            return;
        }
        
        // Получаем викторины пользователя
        const userQuizzes = Database.findQuizzesByUser ? Database.findQuizzesByUser(user.id) : [];
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        
        if (userQuizzes.length === 0) {
            modal.innerHTML = `
                <div class="modal-content">
                    <h3><i class="fas fa-list"></i> МОИ ВИКТОРИНЫ</h3>
                    <p>У вас еще нет созданных викторин.</p>
                    <p>Создайте свою первую викторину!</p>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="quizManager.showCreateQuiz(); this.closest('.modal').remove()">
                            <i class="fas fa-plus"></i> СОЗДАТЬ ВИКТОРИНУ
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            <i class="fas fa-times"></i> ЗАКРЫТЬ
                        </button>
                    </div>
                </div>
            `;
        } else {
            let quizzesHTML = '';
            userQuizzes.forEach(quiz => {
                const category = this.availableCategories.find(c => c.id === quiz.category) || this.availableCategories[0];
                quizzesHTML += `
                    <div class="quiz-card" style="margin: 10px 0; padding: 15px; background: rgba(0,20,40,0.6); border-radius: 10px;">
                        <div style="font-weight: bold; color: #00f3ff;">${quiz.title}</div>
                        <div style="font-size: 0.9em; color: #aaa; margin: 5px 0;">${quiz.description || 'Без описания'}</div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85em;">
                            <span><i class="${category.icon}"></i> ${category.name}</span>
                            <span>${quiz.questions ? quiz.questions.length : 0} вопросов</span>
                        </div>
                    </div>
                `;
            });
            
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <h3><i class="fas fa-list"></i> МОИ ВИКТОРИНЫ (${userQuizzes.length})</h3>
                    <div style="max-height: 400px; overflow-y: auto; margin: 15px 0;">
                        ${quizzesHTML}
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="quizManager.showCreateQuiz(); this.closest('.modal').remove()">
                            <i class="fas fa-plus"></i> НОВАЯ ВИКТОРИНА
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            <i class="fas fa-times"></i> ЗАКРЫТЬ
                        </button>
                    </div>
                </div>
            `;
        }
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // Получить публичные викторины по категории
    getPublicQuizzes(category = null) {
        if (!Database.findPublicQuizzes) return [];
        
        let quizzes = Database.findPublicQuizzes();
        if (category && category !== 'all') {
            quizzes = quizzes.filter(quiz => quiz.category === category);
        }
        return quizzes.slice(0, 10); // Ограничиваем количество
    }
    
    // Использовать викторину в комнате
    useQuiz(quizId) {
        const quiz = Database.findQuizById(quizId);
        if (!quiz) {
            showNotification('Ошибка', 'Викторина не найдена', '#ff5555');
            return;
        }
        
        // Если пользователь в комнате, обновляем настройки
        if (this.gameManager.currentState.roomCode) {
            const quizTheme = document.getElementById('quizTheme');
            const customQuizSelect = document.getElementById('customQuizSelect');
            
            if (quizTheme && customQuizSelect) {
                quizTheme.value = 'custom';
                document.getElementById('customQuizGroup').style.display = 'block';
                
                // Ищем нашу викторину в списке
                for (let i = 0; i < customQuizSelect.options.length; i++) {
                    if (customQuizSelect.options[i].value === quizId) {
                        customQuizSelect.selectedIndex = i;
                        break;
                    }
                }
                
                showNotification('Викторина выбрана', `"${quiz.title}" будет использована в игре`, '#00ff9d');
            }
        } else {
            showNotification('Создайте комнату', 'Сначала создайте комнату для игры', '#ffaa00');
        }
    }
}

// Создаем глобальный экземпляр после загрузки игры
let quizManager = null;

// Инициализация по требованию
function initQuizManager() {
    if (!quizManager && window.game) {
        quizManager = new QuizManager(window.game);
        window.quizManager = quizManager;
        console.log('QuizManager инициализирован');
        
        // Обновляем обработчики в меню
        const menuCards = document.querySelectorAll('.menu-card');
        menuCards.forEach(card => {
            const title = card.querySelector('.menu-title')?.textContent.trim();
            if (title === 'СОЗДАТЬ ВИКТОРИНУ' || title === 'МОИ ВИКТОРИНЫ') {
                card.onclick = function(e) {
                    e.preventDefault();
                    if (title === 'СОЗДАТЬ ВИКТОРИНУ') {
                        quizManager.showCreateQuiz();
                    } else {
                        quizManager.showMyQuizzes();
                    }
                };
            }
        });
    }
    return quizManager;
}

// Автоматическая инициализация при клике на кнопку викторин
document.addEventListener('click', function(e) {
    const target = e.target.closest('[onclick*="quizManager"]');
    if (target && !quizManager) {
        initQuizManager();
    }
}, true);
