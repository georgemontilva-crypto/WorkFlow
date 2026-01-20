import OpenAI from "openai";
import * as chatDb from "./chat_db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate AI response based on user message and conversation history
 */
export async function generateAIResponse(
  ticketId: number,
  userMessage: string,
  userId: number
): Promise<string> {
  try {
    // Get conversation history
    const messages = await chatDb.getTicketMessages(ticketId);
    
    // Build conversation context for OpenAI
    const conversationHistory = messages.map(msg => ({
      role: msg.sender_type === 'user' ? 'user' : 'assistant',
      content: msg.message,
    }));

    // Add system prompt
    const systemPrompt = `Eres un asistente virtual de soporte para HiWork, una aplicación de gestión financiera y de clientes.

Tu objetivo es ayudar a los usuarios con:
- Preguntas sobre cómo usar la aplicación
- Problemas técnicos básicos
- Información sobre funcionalidades
- Gestión de clientes, facturas, transacciones y metas de ahorro
- Mercados de criptomonedas

Responde de manera amigable, profesional y concisa. Si no puedes resolver el problema, sugiere al usuario que solicite hablar con un asistente humano usando el botón correspondiente.

Responde siempre en español.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0]?.message?.content || 
      "Lo siento, no pude generar una respuesta. ¿Podrías reformular tu pregunta?";

    // Save AI response to database
    await chatDb.addChatMessage(ticketId, userId, "ai", aiResponse);

    return aiResponse;
  } catch (error) {
    console.error("Error generating AI response:", error);
    
    // Fallback response
    const fallbackResponse = "Disculpa, estoy teniendo problemas para procesar tu solicitud. ¿Podrías intentar de nuevo o solicitar hablar con un asistente humano?";
    await chatDb.addChatMessage(ticketId, userId, "ai", fallbackResponse);
    
    return fallbackResponse;
  }
}

/**
 * Check if message should trigger AI response
 */
export function shouldTriggerAI(ticketStatus: string): boolean {
  // AI responds when ticket is open or waiting_user
  return ticketStatus === "open" || ticketStatus === "waiting_user";
}

/**
 * Analyze sentiment of user message
 */
export async function analyzeSentiment(message: string): Promise<"positive" | "neutral" | "negative"> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: "Analiza el sentimiento del siguiente mensaje y responde solo con: positive, neutral, o negative"
        },
        { role: "user", content: message }
      ],
      temperature: 0.3,
      max_tokens: 10,
    });

    const sentiment = completion.choices[0]?.message?.content?.toLowerCase().trim();
    
    if (sentiment === "positive" || sentiment === "neutral" || sentiment === "negative") {
      return sentiment;
    }
    
    return "neutral";
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return "neutral";
  }
}

/**
 * Generate welcome message for new ticket
 */
export async function generateWelcomeMessage(userId: number): Promise<string> {
  return "¡Hola! 👋 Soy tu asistente virtual de HiWork. Estoy aquí para ayudarte con cualquier pregunta sobre la aplicación, gestión de clientes, facturas, transacciones o mercados de criptomonedas.\n\n¿En qué puedo ayudarte hoy?";
}
