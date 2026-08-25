const axios = require('axios');

const chat = async (req, res) => {
  try {
    const { message, session_id } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Pesan tidak boleh kosong' });
    }

    // Forward ke AI module (nanti diisi URL dari AI Engineer)
    const AI_API_URL = process.env.AI_API_URL || 'http://localhost:8000/chat';

    const response = await axios.post(AI_API_URL, {
      message,
      session_id: session_id || req.user?.user_id,
      user_id: req.user?.user_id || null
    });

    return res.status(200).json({ reply: response.data.reply || response.data });
  } catch (err) {
    console.error('Chatbot error:', err.message);
    return res.status(200).json({
      reply: 'Maaf, chatbot sedang tidak tersedia. Silakan coba lagi nanti.'
    });
  }
};

module.exports = { chat };