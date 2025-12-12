import { validate } from '../../middleware/validator.js';
import { validationResult } from 'express-validator';

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('Validator Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() if there are no validation errors', () => {
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true)
    });

    validate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should return 400 with validation errors if validation fails', () => {
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue([
        { path: 'email', msg: 'Valid email is required' },
        { path: 'password', msg: 'Password must be at least 6 characters' }
      ])
    });

    validate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation failed',
      errors: [
        { field: 'email', message: 'Valid email is required' },
        { field: 'password', message: 'Password must be at least 6 characters' }
      ]
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return empty errors array if validation result array is empty', () => {
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue([])
    });

    validate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation failed',
      errors: []
    });
    expect(next).not.toHaveBeenCalled();
  });
});