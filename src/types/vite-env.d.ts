/// <reference types="vite/client" />

declare module '@paystack/inline-js' {
  export interface PaystackTransactionOptions {
    key: string;
    email: string;
    amount: number;
    currency?: string;
    reference?: string;
    metadata?: Record<string, unknown>;
    onSuccess?: (transaction: { reference: string; id?: number; message?: string }) => void;
    onCancel?: () => void;
    onError?: (error: { message: string }) => void;
  }
  export default class PaystackPop {
    newTransaction(options: PaystackTransactionOptions): void;
    resumeTransaction(accessCode: string): void;
    cancelTransaction(): void;
    static isLoaded(): boolean;
  }
}
