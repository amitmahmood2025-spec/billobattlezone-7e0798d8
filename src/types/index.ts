// TypeScript interfaces for the application models

export interface User {
    id: number;
    username: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Tournament {
    id: number;
    name: string;
    date: Date;
    participants: User[];
}

export interface Match {
    id: number;
    tournamentId: number;
    playerOne: User;
    playerTwo: User;
    winner?: User;
    startTime: Date;
    endTime?: Date;
}

export interface Transaction {
    id: number;
    amount: number;
    type: string;
    createdAt: Date;
}

export interface CreditFactory {
    id: number;
    owner: User;
    balance: number;
    transactionHistory: Transaction[];
}

export interface TelegramBot {
    token: string;
    chatId: string;
    sendMessage(message: string): Promise<void>;
}
