export type TelegramWebApp = {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
  };

  ready: () => void;
  expand: () => void;

  close: () => void;

  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (
      callback: () => void,
    ) => void;
    offClick: (
      callback: () => void,
    ) => void;
  };

  MainButton: {
    text: string;
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
  };

  colorScheme: "light" | "dark";

  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };

  HapticFeedback: {
    impactOccurred: (
      style:
        | "light"
        | "medium"
        | "heavy"
        | "rigid"
        | "soft",
    ) => void;

    notificationOccurred: (
      type:
        | "error"
        | "success"
        | "warning",
    ) => void;
  };
};

export function getTelegramWebApp():
  | TelegramWebApp
  | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  const telegram =
    window as typeof window & {
      Telegram?: {
        WebApp?: TelegramWebApp;
      };
    };

  return (
    telegram.Telegram?.WebApp ??
    null
  );
}