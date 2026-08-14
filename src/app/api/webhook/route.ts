import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { message, callback_query } = body;

    // 1. HANDLE INCOMING MESSAGES (Send GIF with Inline Play Buttons)
    if (message?.text) {
      const chatId = message.chat.id;

      const gifs = [
        'https://media.giphy.com/media/10HlNaQ6gwf11cjDo/giphy.gif',
        'https://media.giphy.com/media/LmWwrBhejkk9EFP504/giphy.gif',
        'https://media.giphy.com/media/13GIgrGds1D9o0/giphy.gif',
        'https://media.giphy.com/media/3oKIPnAiaMcws8nosE/giphy.gif'
      ];

      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendAnimation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            animation: randomGif,
            reply_markup: {
              inline_keyboard: [
                // Row 1: Big Play Button (Opens Telegram Mini App inside the chat)
                [
                  {
                    text: '▶️ PLAY GAME',
                    web_app: { url: 'https://fight-predict-mu.vercel.app' }
                  }
                ],
                // Row 2: Two side-by-side interactive buttons
                [
                  {
                    text: '🔥 Action Button',
                    callback_data: 'btn_action_click'
                  },
                  {
                    text: '🌐 Open Website',
                    url: 'https://fight-predict-mu.vercel.app'
                  }
                ]
              ]
            }
          })
        }
      );
    }

    // 2. HANDLE INLINE BUTTON CLICKS (callback_query)
    if (callback_query) {
      const callbackId = callback_query.id;
      const chatId = callback_query.message.chat.id;
      const data = callback_query.data;

      if (data === 'btn_action_click') {
        // Acknowledge the button press (stops the loading indicator on the button)
        await fetch(
          `https://api.telegram.org/bot${process.env.BOT_TOKEN}/answerCallbackQuery`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: callbackId,
              text: 'Action triggered successfully!',
              show_alert: false // Set to true for a pop-up alert
            })
          }
        );

        // Optional: Send a response message back to the user
        await fetch(
          `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: ' You clicked the action button!'
            })
          }
        );
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Error handling Telegram update:', error);
    return NextResponse.json(
      { ok: false, error: (error as any)?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}