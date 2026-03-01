// TypeScript interfaces for the application models

// Interface representing a User
interface User {
    id: number;
    username: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

// Interface representing a Tournament
interface Tournament {
    id: number;
    name: string;
    date: Date;
    participants: User[];
}

// Interface representing a Match
interface Match {
    id: number;
    tournamentId: number;
    playerOne: User;
    playerTwo: User;
    winner?: User;
    startTime: Date;
    endTime?: Date;
}

// Interface representing a Credit Factory
interface CreditFactory {
    id: number;
    owner: User;
    balance: number;
    transactionHistory: Transaction[];
}

// Interface representing a Telegram Bot functionality
interface TelegramBot {
    token: string;
    chatId: string;
    sendMessage(message: string): Promise<void>;
}
