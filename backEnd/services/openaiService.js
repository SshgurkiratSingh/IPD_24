const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY2,
});

const generateChatResponse = async (messages) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      response_format: { type: "json_object" },
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error in OpenAI API call:", error);
    throw error;
  }
};

module.exports = {
  generateChatResponse
};