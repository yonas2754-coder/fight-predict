import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (message?.text) {
      const chatId = message.chat.id;
      const text = message.text;

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
            caption: `Echo: ${text}`
          })
        }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error handling Telegram update:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}