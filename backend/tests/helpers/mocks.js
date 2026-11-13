// Layanan eksternal di-mock: tidak ada panggilan nyata ke Midtrans, SMTP, atau Gemini.
jest.mock('../../src/config/midtrans', () => ({
  snap: { createTransaction: jest.fn().mockResolvedValue({ token: 'tok-test', redirect_url: 'http://pay.test' }) }
}));

jest.mock('../../src/utils/emailHelper', () => ({
  sendOrderEmail: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({}),
    verify: jest.fn().mockResolvedValue(true)
  }))
}), { virtual: true });

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(() => ({
    models: { generateContent: jest.fn().mockResolvedValue({ text: 'Balasan mock Gemini' }) }
  }))
}), { virtual: true });
