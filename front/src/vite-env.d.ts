/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_PREFIX: string
    readonly VITE_ENABLE_MOCK: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
