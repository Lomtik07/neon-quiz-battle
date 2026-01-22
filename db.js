// db.js - Локальная база данных (оптимизированная)

class LocalDatabase {
    constructor() {
        this.key = 'neon_quiz_data';
        this.init();
    }
    
    init() {
        try {
            const saved = localStorage.getItem(this.key);
            if (saved) {
                this.data = JSON.parse(saved);
            } else {
                this.data = {
                    users: [],
                    rooms: [],
                    quizzes: [],
                    recentRooms: []
                };
                this.createDemoData();
                this.save();
            }
            console.log('База данных загружена');
        } catch (error) {
            console.error('Ошибка загрузки БД:', error);
            this.data = {
                users: [],
                rooms: [],
                quizzes: [],
                recentRooms: []
            };
        }
    }
    
    createDemoData() {
        // Тестовые пользователи
        this.data.users = [
            {
                id: 'user_1',
                username: 'Админ',
                password: 'admin123',
                email: 'admin@quiz.com',
                avatar: 'A',
                isGuest: false,
                stats: { gamesPlayed: 10, gamesWon: 6, totalScore: 800 }
            },
            {
                id: 'user_2',
                username: 'Игрок',
                password: 'player123',
                email: 'player@quiz.com',
                avatar: 'И',
                isGuest: false,
                stats: { gamesPlayed: 5, gamesWon: 2, totalScore: 350 }
            }
        ];
        
        // Тестовые викторины
        this.data.quizzes = [
            {
                id: 'quiz_1',
                title: 'Общая викторина',
                category: 'general',
                questions: [
                    {
                        question: 'Сколько планет в Солнечной системе?',
                        answers: [
                            { text: '7', correct: false },
                            { text: '8', correct: true },
                            { text: '9', correct: false },
                            { text: '10', correct: false }
                        ]
                    }
                ]
            }
        ];
    }
    
    save() {
        try {
            localStorage.setItem(this.key, JSON.stringify(this.data));
        } catch (error) {
            console.error('Ошибка сохранения:', error);
        }
    }
    
    // Пользователи
    createUser(username, password, email = '') {
        const user = {
            id: 'user_' + Date.now(),
            username: username,
            password: password,
            email: email,
            avatar: username.charAt(0).toUpperCase(),
            isGuest: false,
            stats: { gamesPlayed: 0, gamesWon: 0, totalScore: 0 }
        };
        
        this.data.users.push(user);
        this.save();
        return user;
    }
    
    findUserById(userId) {
        return this.data.users.find(user => user.id === userId);
    }
    
    findUserByCredentials(username, password) {
        return this.data.users.find(user => 
            user.username === username && user.password === password
        );
    }
    
    updateUser(userId, updates) {
        const user = this.findUserById(userId);
        if (user) {
            Object.assign(user, updates);
            this.save();
            return user;
        }
        return null;
    }
    
    // Комнаты
    createRoom(code, hostName, hostId) {
        const room = {
            id: 'room_' + Date.now(),
            code: code,
            hostId: hostId,
            hostName: hostName,
            players: [{
                id: hostId || 'guest_' + Date.now(),
                name: hostName,
                avatar: hostName.charAt(0).toUpperCase(),
                isHost: true,
                score: 0
            }],
            maxPlayers: 8,
            gameState: 'waiting',
            createdAt: Date.now(),
            lastActivity: Date.now()
        };
        
        this.data.rooms.push(room);
        this.addRecentRoom(code);
        this.save();
        return room;
    }
    
    findRoomByCode(code) {
        return this.data.rooms.find(room => room.code === code);
    }
    
    updateRoom(roomCode, updates) {
        const room = this.findRoomByCode(roomCode);
        if (room) {
            Object.assign(room, updates);
            room.lastActivity = Date.now();
            this.save();
            return room;
        }
        return null;
    }
    
    deleteRoom(roomCode) {
        const index = this.data.rooms.findIndex(room => room.code === roomCode);
        if (index !== -1) {
            this.data.rooms.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }
    
    addPlayerToRoom(roomCode, playerName, playerId) {
        const room = this.findRoomByCode(roomCode);
        if (!room || room.players.length >= room.maxPlayers) return null;
        
        const player = {
            id: playerId || 'guest_' + Date.now(),
            name: playerName,
            avatar: playerName.charAt(0).toUpperCase(),
            isHost: false,
            score: 0
        };
        
        room.players.push(player);
        this.save();
        return player;
    }
    
    removePlayerFromRoom(roomCode, playerId) {
        const room = this.findRoomByCode(roomCode);
        if (room) {
            room.players = room.players.filter(p => p.id !== playerId);
            if (room.players.length === 0) {
                this.deleteRoom(roomCode);
            } else {
                this.save();
            }
        }
    }
    
    // Недавние комнаты
    addRecentRoom(roomCode) {
        this.data.recentRooms = this.data.recentRooms.filter(code => code !== roomCode);
        this.data.recentRooms.unshift(roomCode);
        if (this.data.recentRooms.length > 5) {
            this.data.recentRooms = this.data.recentRooms.slice(0, 5);
        }
        this.save();
    }
    
    getRecentRooms() {
        return this.data.recentRooms
            .map(code => this.findRoomByCode(code))
            .filter(room => room)
            .slice(0, 5);
    }
    
    // Викторины
    createQuiz(quizData) {
        const quiz = {
            id: 'quiz_' + Date.now(),
            ...quizData,
            createdAt: new Date().toISOString()
        };
        
        this.data.quizzes.push(quiz);
        this.save();
        return quiz;
    }
    
    findQuizById(quizId) {
        return this.data.quizzes.find(quiz => quiz.id === quizId);
    }
    
    findQuizzesByUser(userId) {
        return this.data.quizzes.filter(quiz => quiz.createdBy === userId);
    }
}

// Создаем глобальный экземпляр
const Database = new LocalDatabase();
window.Database = Database;
