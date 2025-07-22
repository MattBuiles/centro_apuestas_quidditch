import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import { logger } from '../utils/Logger';

interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  // Log the error with context
  logger.error('Request error occurred', error, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Default error
  let statusCode = error.statusCode || 500;
  let message = 'Internal Server Error';
  let isOperational = error.isOperational || false;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    isOperational = true;
  } else if (error.name === 'UnauthorizedError' || error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Unauthorized';
    isOperational = true;
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    isOperational = true;
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
    isOperational = true;
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = error.message || 'Resource not found';
    isOperational = true;
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    message = error.message;
    isOperational = true;
  } else if (error.name === 'DatabaseError' || error.message?.includes('SQLITE')) {
    statusCode = 503;
    message = 'Database temporarily unavailable';
    isOperational = true;
  } else if (error.message?.includes('Circuit breaker')) {
    statusCode = 503;
    message = 'Service temporarily unavailable';
    isOperational = true;
  } else if (error.message?.includes('Too many requests')) {
    statusCode = 429;
    message = 'Too many requests, please try again later';
    isOperational = true;
  } else if (statusCode >= 500 && error.message) {
    // Only show internal server error message in development
    message = process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error';
  }

  // For non-operational errors in production, don't expose details
  if (!isOperational && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
  }

  // Send error response
  const response: ApiResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: {
        name: error.name,
        isOperational,
        originalMessage: error.message
      }
    })
  };

  // Ensure we don't send after headers are already sent
  if (!res.headersSent) {
    res.status(statusCode).json(response);
  }

  // For critical errors, we might want to restart the process
  if (!isOperational && statusCode >= 500) {
    logger.error('Critical error detected', error, { 
      statusCode, 
      willRestart: false // Set to true if you want to restart on critical errors
    });
  }
};
