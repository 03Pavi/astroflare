
'use client'
import { SwitchLanguage } from '@/shared/ui'
import { useTranslation } from 'react-i18next'

const Page = () => {
  const { t } = useTranslation()
  return (
    <div>
      Welcome to {t('AppName')}
      <SwitchLanguage />
    </div>
  )
}

export default Page


  