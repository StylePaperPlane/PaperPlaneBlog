export class SecureMediaSessionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SecureMediaSessionError';
    }
}

export function asSecureMediaSessionError(error: unknown, fallback: string): SecureMediaSessionError {
    if (error instanceof SecureMediaSessionError) return error;
    return new SecureMediaSessionError(error instanceof Error && error.message ? error.message : fallback);
}
