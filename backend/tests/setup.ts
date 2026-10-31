process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-only-secret-do-not-use-in-prod';
process.env.LOGIN_RATE_LIMIT_MAX = '500';
process.env.SUBMIT_RATE_LIMIT_MAX = '500';
process.env.RATE_LIMIT_MAX = '5000';
process.env.UPLOAD_MAX_BYTES = '1048576';
process.env.UPLOAD_DIR = './test-uploads';

export {};
