import { asyncHandler, sendResponse } from '../utils/index.js';
import * as aiService from '../services/aiService.js';

export const chatWithAssistant = asyncHandler(async (req, res) => {
  const { message, history } = req.body;

  const data = await aiService.getAssistantReply({ message, history });

  sendResponse(res, {
    message: 'AI reply generated successfully',
    data,
  });
});
