import { getItems, getInfo } from '@bigfive-org/questions';
import { Survey } from './survey';
import { saveTest } from '@/actions';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { TestLanguageSwitch } from './test-language-switch';

const questionLanguages = getInfo().languages;

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export default async function TestPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { lang } = await searchParams;
  setRequestLocale(locale);
  const language =
    lang || (questionLanguages.some((l) => l.id === locale) ? locale : 'en');
  const questions = getItems(language);
  const t = await getTranslations({ locale, namespace: 'test' });
  return (
    <>
      <div className='flex'>
        <TestLanguageSwitch
          availableLanguages={questionLanguages}
          language={language}
        />
      </div>
      <Survey
        questions={questions}
        nextText={t('next')}
        prevText={t('back')}
        resultsText={t('seeResults')}
        saveTest={saveTest}
        language={language}
      />
    </>
  );
}
