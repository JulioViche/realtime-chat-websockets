const { verifyAdminToken } = require('../middlewares/authMiddleware');
const jwt = require('jsonwebtoken');

// Mock de variables de entorno
process.env.JWT_SECRET = 'test_secret';

describe('Auth Middleware - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('should return 401 if no authorization header is provided', () => {
    verifyAdminToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token de acceso no proporcionado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 if header does not start with Bearer', () => {
    req.headers.authorization = 'Basic manual-token';
    
    verifyAdminToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token de acceso no proporcionado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 if token is malformed or invalid', () => {
    req.headers.authorization = 'Bearer invalid-token-string';
    
    verifyAdminToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 if token is expired', () => {
    const expiredToken = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    req.headers.authorization = `Bearer ${expiredToken}`;
    
    verifyAdminToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 403 if role is not admin', () => {
    const userToken = jwt.sign({ role: 'user' }, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${userToken}`;
    
    verifyAdminToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'No tienes permisos de administrador' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next() and attach admin to req if token is valid and role is admin', () => {
    const adminData = { role: 'admin', username: 'superadmin' };
    const validToken = jwt.sign(adminData, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${validToken}`;
    
    verifyAdminToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.admin).toMatchObject(adminData);
    expect(res.status).not.toHaveBeenCalled();
  });
});
