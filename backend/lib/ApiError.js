export class ApiError extends Error {
    constructor(statusCode, message, options = {}) {
        super(message);

        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = options.code;
        this.details = options.details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}
