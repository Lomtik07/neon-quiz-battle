// realtime.js - Реальное обновление комнат через WebSocket или polling

class RealtimeManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.updateInterval = null;
        this.roomUpdateCallbacks = [];
        this.playerUpdateCallbacks = [];
        this.gameUpdateCallbacks = [];
        
        this.pollingRate = 2000; // Обновление каждые 2 секунды
    }
    
    // Начать обновление комнаты
    startRoomUpdates(roomCode) {
        this.stopUpdates();
        
        this.updateInterval = setInterval(() => {
            this.updateRoomData(roomCode);
        }, this.pollingRate);
        
        console.log(`Начато обновление комнаты ${roomCode}`);
    }
    
    // Остановить обновления
    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('Обновления остановлены');
        }
    }
    
    // Обновить данные комнаты
    async updateRoomData(roomCode) {
        try {
            const room = Database.findRoomByCode(roomCode);
            if (!room) {
                this.stopUpdates();
                showNotification('Ошибка', 'Комната не найдена', '#ff5555');
                this.gameManager.leaveRoom();
                return;
            }
            
            // Обновляем список игроков
            this.updatePlayersList(room);
            
            // Обновляем состояние игры
            this.updateGameState(room);
            
            // Обновляем UI
            this.updateRoomUI(room);
            
            // Вызываем колбэки
            this.roomUpdateCallbacks.forEach(callback => callback(room));
            
        } catch (error) {
            console.error('Ошибка обновления комнаты:', error);
        }
    }
    
    // Обновить список игроков
    updatePlayersList(room) {
        const playersList = document.getElementById('playersList');
        if (!playersList) return;
        
        const currentUser = this.gameManager.currentState.user;
        
        let playersHTML = '';
        room.players.forEach(player => {
            const isCurrentUser = currentUser && player.id === currentUser.id;
            const playerClass = isCurrentUser ? 'player-item current-user' : 'player-item';
            
            playersHTML += `
                <div class="${playerClass}">
                    <div class="player-avatar">${player.avatar}</div>
                    <div class="player-name">
                        ${player.name} ${player.isHost ? '👑' : ''}
                    </div>
                    ${room.gameState === 'playing' ? 
                        `<div class="player-status">
                            ${player.answered ? '✓' : '...'}
                        </div>` : ''
                    }
                </div>
            `;
        });
        
        playersList.innerHTML = playersHTML;
        
        // Обновляем счетчик игроков
        const playerCount = document.getElementById('playerCount');
        if (playerCount) {
            playerCount.textContent = `Игроков: ${room.players.length}/${room.maxPlayers}`;
        }
        
        // Обновляем кнопку начала игры
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            const isHost = this.gameManager.currentState.isHost;
            const hasEnoughPlayers = room.players.length >= 2;
            
            startGameBtn.style.display = (isHost && hasEnoughPlayers && room.gameState === 'waiting') ? 'block' : 'none';
        }
    }
    
    // Обновить состояние игры
    updateGameState(room) {
        if (room.gameState === 'playing') {
            this.updateGameTimer(room);
            this.updateGamePlayers(room);
        }
    }
    
    // Обновить таймер игры
    updateGameTimer(room) {
        if (!room.questionStartTime || room.timeLimit === 0) return;
        
        const now = Date.now();
        const elapsed = Math.floor((now - room.questionStartTime) / 1000);
        const timeLeft = Math.max(0, room.timeLimit - elapsed);
        
        const gameTimer = document.getElementById('gameTimer');
        if (gameTimer) {
            gameTimer.textContent = timeLeft;
            
            // Меняем цвет при малом времени
            if (timeLeft <= 5) {
                gameTimer.style.color = '#ff5555';
                gameTimer.style.textShadow = '0 0 20px #ff5555';
            } else if (timeLeft <= 10) {
                gameTimer.style.color = '#ffaa00';
                gameTimer.style.textShadow = '0 0 20px #ffaa00';
            } else {
                gameTimer.style.color = '#ff00ff';
                gameTimer.style.textShadow = '0 0 20px #ff00ff';
            }
            
            // Автоматический переход при истечении времени
            if (timeLeft === 0 && this.gameManager.currentState.isHost) {
                this.gameManager.nextQuestion();
            }
        }
    }
    
    // Обновить игроков в игре
    updateGamePlayers(room) {
        const gamePlayers = document.getElementById('gamePlayers');
        if (!gamePlayers) return;
        
        let playersHTML = '';
        room.players.forEach(player => {
            playersHTML += `
                <div class="game-player">
                    <div class="game-player-avatar">${player.avatar}</div>
                    <div class="game-player-info">
                        <div class="game-player-name">${player.name}</div>
                        <div class="game-player-score">
                            <i class="fas fa-star"></i> ${player.score}
                        </div>
                        ${player.answered ? 
                            '<div class="game-player-status answered">✓ Отвечен</div>' :
                            '<div class="game-player-status waiting">⌛ Ожидание</div>'
                        }
                    </div>
                </div>
            `;
        });
        
        gamePlayers.innerHTML = playersHTML;
    }
    
    // Обновить UI комнаты
    updateRoomUI(room) {
        // Обновляем тему викторины
        const quizTheme = document.getElementById('quizTheme');
        if (quizTheme) {
            quizTheme.value = room.theme || 'general';
        }
        
        // Обновляем лимит времени
        const questionTime = document.getElementById('questionTime');
        if (questionTime) {
            questionTime.value = room.timeLimit || 20;
        }
        
        // Обновляем последнюю активность
        this.updateLastActivity(room.lastActivity);
    }
    
    // Обновить время последней активности
    updateLastActivity(timestamp) {
        const now = Date.now();
        const diff = Math.floor((now - timestamp) / 1000);
        
        // Можно добавить отображение времени последней активности
        if (diff > 300) { // 5 минут
            console.log('Комната неактивна долгое время');
        }
    }
    
    // Добавить колбэк для обновления комнаты
    onRoomUpdate(callback) {
        this.roomUpdateCallbacks.push(callback);
    }
    
    // Добавить колбэк для обновления игроков
    onPlayerUpdate(callback) {
        this.playerUpdateCallbacks.push(callback);
    }
    
    // Добавить колбэк для обновления игры
    onGameUpdate(callback) {
        this.gameUpdateCallbacks.push(callback);
    }
    
    // Уведомить об изменении комнаты
    notifyRoomChange(roomCode) {
        const room = Database.findRoomByCode(roomCode);
        if (room) {
            this.roomUpdateCallbacks.forEach(callback => callback(room));
        }
    }
    
    // Уведомить об изменении игрока
    notifyPlayerChange(roomCode, playerId) {
        const room = Database.findRoomByCode(roomCode);
        if (room) {
            const player = room.players.find(p => p.id === playerId);
            if (player) {
                this.playerUpdateCallbacks.forEach(callback => callback(room, player));
            }
        }
    }
    
    // Уведомить об изменении игры
    notifyGameChange(roomCode) {
        const room = Database.findRoomByCode(roomCode);
        if (room) {
            this.gameUpdateCallbacks.forEach(callback => callback(room));
        }
    }
    
    // Эмуляция WebSocket соединения
    simulateWebSocket() {
        // В реальном приложении здесь было бы WebSocket соединение
        console.log('WebSocket эмуляция запущена');
        
        // Симуляция случайных обновлений
        setInterval(() => {
            const rooms = Database.data.rooms;
            if (rooms.length > 0) {
                const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
                this.notifyRoomChange(randomRoom.code);
            }
        }, 5000);
    }
}

// Создаем глобальный экземпляр
let realtimeManager = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Будет инициализирован в game.js
});
