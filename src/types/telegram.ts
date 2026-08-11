export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
};

export type TelegramWebApp = {
  initData: string;

  initDataUnsafe: {
    user?: TelegramUser;
    query_id?: string;
    start_param?: string;
    auth_date?: number;
    hash?: string;
  };

  ready: () => void;

  expand: () => void;

  close: () => void;

  isVersionAtLeast: (
    version: string,
  ) => boolean;

  colorScheme: "light" | "dark";

  themeParams: Record<string, string>;

  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
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

    selectionChanged: () => void;
  };

  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
};