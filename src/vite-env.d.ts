/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_PAYSTACK_PUBLIC_KEY: string
  readonly VITE_ADSENSE_CLIENT: string
  readonly VITE_ADSENSE_SLOT_BANNER: string
  readonly VITE_ADSENSE_SLOT_RECT: string
  readonly VITE_ADSENSE_SLOT_ANCHOR: string
  readonly VITE_PLAUSIBLE_DOMAIN: string
  readonly VITE_TELEGRAM_LINK: string
  readonly VITE_ADMIN_EMAILS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
