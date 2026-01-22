// game.js - Основная логика игры

class GameManager {
    constructor() {
        // ... существующий код ...

        // Добавим интервал для обновления списка комнат
        this.roomsUpdateInterval = null;
    }

    // ... существующий код ...

    // Показать главное меню
    showMainMenu() {
        this.showScreen('menu');
        this.updateProfileInfo();
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.style.display = 'block';
        
        // Запускаем обновление списка комнат
        this.startRoomsUpdate();
    }

    // Обновление информации профиля
    updateProfileInfo() {
        if (!this.currentState.user) return;
        
        const user = this.currentState.user;
        
        // ... существующий код ...

        // Статистика - исправим отображение
        const gamesPlayed = document.getElementById('gamesPlayed');
        const gamesWon = document.getElementById('gamesWon');
        const totalScore = document.getElementById('totalScore');
        
        if (gamesPlayed) gamesPlayed.textContent = user.stats?.gamesPlayed || 0;
        if (gamesWon) gamesWon.textContent = user.stats?.gamesWon || 0;
        if (totalScore) totalScore.textContent = user.stats?.totalScore || 0;
    }

    // Показать экран комнат
    showRoomScreen() {
        this.showScreen('room');
        this.updateRecentRooms();
        this.updateAvailableRooms();
    }

    // Обновление списка доступных комнат
    updateAvailableRooms() {
        const roomsList = document.getElementById('roomsList');
        if (!roomsList) return;
        
        let availableRooms = [];
        if (Database && Database.data && Database.data.rooms) {
            availableRooms = Database.data.rooms.filter(room => 
                room.gameState === 'waiting' && 
                room.players && 
                room.players.length < room.maxPlayers
            );
        }
        
        if (availableRooms.length === 0) {
            roomsList.innerHTML = `
                <div class="room-item">
                    <span class="room-info">Нет доступных комнат</span>
                    <span class="room-code">-</span>
                </div>
            `;
            return;
        }
        
        roomsList.innerHTML = '';
        availableRooms.forEach(room => {
            const playerCount = room.players ? room.players.length : 0;
            const maxPlayers = room.maxPlayers || 8;
            
            const roomItem = document.createElement('div');
            roomItem.className = 'room-item';
            roomItem.innerHTML = `
                <div>
                    <div class="room-code">${room.code}</div>
                    <div class="room-info">
                        Создатель: ${room.hostName} | Игроков: ${playerCount}/${maxPlayers} | Тема: ${room.theme}
                    </div>
                </div>
                <button class="btn join-room-btn" data-room="${room.code}">
                    <i class="fas fa-sign-in-alt"></i> ВОЙТИ
                </button>
            `;
            
            roomsList.appendChild(roomItem);
        });
        
        // Добавляем обработчики для кнопок входа
        document.querySelectorAll('.join-room-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const roomCode = e.target.closest('button').dataset.room;
                this.joinExistingRoom(roomCode);
            });
        });
    }

    // Присоединение к существующей комнате
    joinExistingRoom(roomCode) {
        if (!roomCode) return;
        
        const playerName = this.currentState.playerName;
        const playerId = this.currentState.user ? this.currentState.user.id : null;
        
        let room = null;
        if (Database) {
            room = Database.findRoomByCode(roomCode);
        }
        
        if (!room) {
            showNotification('Ошибка', 'Комната не найдена', '#ff5555');
            return;
        }
        
        if (room.players && room.players.length >= room.maxPlayers) {
            showNotification('Ошибка', 'В комнате нет свободных мест', '#ff5555');
            return;
        }
        
        let player = null;
        if (Database) {
            player = Database.addPlayerToRoom(roomCode, playerName, playerId);
        } else {
            // Fallback
            player = {
                id: playerId || 'guest_' + Date.now(),
                name: playerName,
                isHost: false,
                score: 0,
                ready: false
            };
            if (!room.players) room.players = [];
            room.players.push(player);
        }
        
        if (player) {
            this.currentState.currentRoom = room;
            this.currentState.roomCode = roomCode;
            this.currentState.isHost = false;
            
            this.showRoomCode(roomCode);
            if (Database) Database.addRecentRoom(roomCode);
            
            showNotification('Успех!', `Вы присоединились к комнате ${roomCode}`, '#00ff9d');
        } else {
            showNotification('Ошибка', 'Не удалось присоединиться', '#ff5555');
        }
    }

    // Запуск обновления списка комнат
    startRoomsUpdate() {
        if (this.roomsUpdateInterval) {
            clearInterval(this.roomsUpdateInterval);
        }
        
        this.roomsUpdateInterval = setInterval(() => {
            if (this.currentState.gameScreen === 'room' || 
                this.currentState.gameScreen === 'code') {
                this.updateAvailableRooms();
                this.updateRecentRooms();
            }
        }, 5000);
    }

    // Обновление списка недавних комнат
    updateRecentRooms() {
        const roomsList = document.getElementById('roomsList');
        if (!roomsList) return;
        
        let recentRooms = [];
        if (Database) {
            recentRooms = Database.getRecentRooms();
        }
        
        if (recentRooms.length === 0) {
            return; // Не перезаписываем основной список комнат
        }
        
        // Обновляем недавние комнаты только если есть что показать
        const recentSection = document.getElementById('recentRooms');
        if (recentSection) {
            let recentHTML = `
                <h3><i class="fas fa-history"></i> НЕДАВНИЕ КОМНАТЫ</h3>
                <div id="recentRoomsList"></div>
            `;
            
            // Добавляем секцию недавних комнат, если её нет
            let recentList = document.getElementById('recentRoomsList');
            if (!recentList) {
                const recentDiv = document.createElement('div');
                recentDiv.id = 'recentRoomsList';
                recentDiv.innerHTML = '';
                recentRooms.forEach(room => {
                    const playerCount = room.players ? room.players.length : 0;
                    const maxPlayers = room.maxPlayers || 8;
                    
                    recentDiv.innerHTML += `
                        <div class="room-item">
                            <div>
                                <div class="room-code">${room.code}</div>
                                <div class="room-info">
                                    Создатель: ${room.hostName} | Игроков: ${playerCount}/${maxPlayers}
                                </div>
                            </div>
                            <button class="btn join-room-btn" data-room="${room.code}">
                                <i class="fas fa-sign-in-alt"></i> ПРИСОЕДИНИТЬСЯ
                            </button>
                        </div>
                    `;
                });
                
                const existingRecent = document.querySelector('#recentRooms > div');
                if (existingRecent) {
                    existingRecent.innerHTML = recentDiv.innerHTML;
                } else {
                    recentSection.innerHTML += recentDiv.innerHTML;
                }
                
                // Добавляем обработчики для кнопок
                setTimeout(() => {
                    document.querySelectorAll('#recentRooms .join-room-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const roomCode = e.target.closest('button').dataset.room;
                            this.joinExistingRoom(roomCode);
                        });
                    });
                }, 100);
            }
        }
    }

    // Создание викторины
    createQuiz() {
        showNotification('В разработке', 'Создание собственных опросов скоро будет доступно!', '#ffaa00');
        
        // Здесь будет логика создания собственных викторин
        // Пока просто показываем уведомление
        setTimeout(() => {
            // Временная реализация - переход к созданию комнаты
            this.showRoomScreen();
        }, 1500);
    }

    // Показать статистику
    showStats() {
        if (!this.currentState.user) {
            this.showScreen('auth');
            return;
        }
        
        this.showScreen('profile');
        this.updateProfileInfo();
    }

    // Показать друзей
    showFriends() {
        showNotification('В разработке', 'Система друзей скоро будет доступна!', '#ffaa00');
    }

    // Показать таблицу лидеров
    showLeaderboard() {
        showNotification('В разработке', 'Таблица лидеров скоро будет доступна!', '#ffaa00');
        
        // Временная реализация - показываем статистику текущего пользователя
        this.showStats();
    }

    // Показать настройки
    showSettings() {
        this.showScreen('settings');
        
        // Загружаем сохраненные настройки
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle && this.currentState.user) {
            const settings = Database ? Database.getSettings(this.currentState.user.id) : {};
            soundToggle.checked = settings.soundEnabled !== false;
        }
    }

    // Показать экран
    showScreen(screen) {
        // Скрываем все контейнеры
        const containers = [
            'authContainer', 
            'roomContainer', 
            'codeContainer',
            'profileContainer',
            'menuContainer',
            'settingsContainer'
        ];
        
        containers.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
        
        // Показываем нужный контейнер
        switch(screen) {
            case 'auth':
                document.getElementById('authContainer').style.display = 'block';
                break;
            case 'room':
                document.getElementById('roomContainer').style.display = 'block';
                this.updateAvailableRooms();
                this.updateRecentRooms();
                break;
            case 'code':
                document.getElementById('codeContainer').style.display = 'block';
                break;
            case 'profile':
                document.getElementById('profileContainer').style.display = 'block';
                break;
            case 'menu':
                document.getElementById('menuContainer').style.display = 'block';
                break;
            case 'settings':
                document.getElementById('settingsContainer').style.display = 'block';
                break;
        }
        
        this.currentState.gameScreen = screen;
    }

    // ... остальной существующий код ...
}

// Функция для показа уведомлений (должна быть определена)
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

// Создаем глобальный экземпляр GameManager
const game = new GameManager();

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, есть ли сохраненный пользователь
    const lastUserId = localStorage.getItem('last_user_id');
    if (lastUserId && Database) {
        const user = Database.findUserById(lastUserId);
        if (user) {
            game.currentState.user = user;
            game.currentState.playerName = user.username;
            game.showMainMenu();
        }
    }
    
    // Инициализируем кнопки меню
    const menuCards = document.querySelectorAll('.menu-card[onclick*="game.showScreen"]');
    menuCards.forEach(card => {
        const oldClick = card.getAttribute('onclick');
        card.removeAttribute('onclick');
        card.addEventListener('click', (e) => {
            e.preventDefault();
            if (oldClick.includes('game.showScreen(\'room\')')) {
                game.showRoomScreen();
            } else {
                eval(oldClick);
            }
        });
    });
    
    console.log('Neon Quiz Battle инициализирован!');
});
