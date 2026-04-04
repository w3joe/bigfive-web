import { getTestResult } from '@/actions';
import { formatId } from '@/lib/helpers';
import { getTranslations } from 'next-intl/server';
import { supportEmail } from '@/config/site';
import { Alert } from '@/components/alert';
import { ResultContent } from './result-content';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'results' });
  return {
    title: t('seo.title'),
    description: t('seo.description')
  };
}

interface ResultPageParams {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ lang?: string; showExpanded?: boolean }>;
}

export default async function ResultPage({
  params,
  searchParams
}: ResultPageParams) {
  const { id } = await params;
  const { lang, showExpanded } = await searchParams;
  let report;

  try {
    report = await getTestResult(formatId(id), lang);
  } catch (error) {
    throw new Error('Could not retrieve report');
  }

  if (!report)
    return (
      <Alert title='Could not retrive report'>
        <>
          <p>We could not retrive the following id {id}.</p>
          <p>Please check that it is correct or contact us at {supportEmail}</p>
        </>
      </Alert>
    );

  return <ResultContent report={report} showExpanded={showExpanded} />;
}
