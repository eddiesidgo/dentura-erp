import { useEffect } from 'react'
import i18n from 'i18next'
import dayjs from 'dayjs'
import { dateLocales } from '@/locales'
import { setLang, useAppDispatch, useAppSelector } from '@/store'

function useLocale() {
    const locale = useAppSelector((state) => state.locale.currentLang) || 'en'
    const dispatch = useAppDispatch()

    useEffect(() => {
        const formattedLang = String(locale).replace(/-([a-z])/g, (g) =>
            g[1].toUpperCase(),
        )
        const loadLocale =
            dateLocales[formattedLang] ?? dateLocales[locale] ?? dateLocales.en
        const resolvedLang = dateLocales[formattedLang]
            ? formattedLang
            : dateLocales[locale]
              ? locale
              : 'en'

        if (resolvedLang !== locale) {
            dispatch(setLang(resolvedLang))
            return
        }

        if (resolvedLang !== i18n.language) {
            i18n.changeLanguage(resolvedLang)
        }

        if (typeof loadLocale === 'function') {
            loadLocale().then(() => {
                dayjs.locale(resolvedLang)
            })
        }
    }, [locale, dispatch])

    return locale
}

export default useLocale
