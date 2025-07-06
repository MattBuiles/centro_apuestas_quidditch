import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../types';

export const validateRequest = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      data: errors.array(),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};
