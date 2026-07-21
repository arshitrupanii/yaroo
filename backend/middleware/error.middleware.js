import { ApiError } from '../lib/ApiError.js';

const normalizeError = (error) => {
    if (error instanceof ApiError) {
        return error;
    }

    if (error.name === 'ValidationError') {
        return new ApiError(400, 'Validation failed', {
            code: 'VALIDATION_ERROR',
            details: Object.values(error.errors).map((fieldError) => ({
                field: fieldError.path,
                message: fieldError.message
            }))
        });
    }

    if (error.name === 'CastError') {
        return new ApiError(400, `Invalid ${error.path}`, {
            code: 'INVALID_ID',
            details: [{ field: error.path, message: 'Invalid identifier format' }]
        });
    }

    if (error.code === 11000) {
        const fields = Object.keys(error.keyPattern || {});
        return new ApiError(409, 'Duplicate value already exists', {
            code: 'DUPLICATE_VALUE',
            details: fields.map((field) => ({ field, message: `${field} already exists` }))
        });
    }

    if (error.type === 'entity.too.large') {
        return new ApiError(413, 'Request body is too large', {
            code: 'PAYLOAD_TOO_LARGE'
        });
    }

    if (error.message?.startsWith('CORS blocked origin:')) {
        return new ApiError(403, 'Cross-site request blocked', {
            code: 'UNTRUSTED_ORIGIN'
        });
    }

    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return new ApiError(400, 'Invalid JSON body', {
            code: 'INVALID_JSON'
        });
    }

    return new ApiError(500, 'Internal server error', {
        code: 'INTERNAL_SERVER_ERROR'
    });
};

export const notFoundHandler = (req, res, next) => {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, {
        code: 'ROUTE_NOT_FOUND'
    }));
};

export const errorHandler = (error, req, res, next) => {
    const normalizedError = normalizeError(error);
    const statusCode = normalizedError.statusCode || 500;

    if (statusCode >= 500 || process.env.LOG_CLIENT_ERRORS === 'true') {
        console.error({
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode,
            code: normalizedError.code,
            message: error.message,
            stack: error.stack
        });
    }

    const response = {
        message: normalizedError.message,
        code: normalizedError.code,
        requestId: req.requestId
    };

    if (normalizedError.details) {
        response.details = normalizedError.details;
    }

    if (process.env.EXPOSE_ERROR_STACK === 'true') {
        response.stack = error.stack;
    }

    return res.status(statusCode).json(response);
};
