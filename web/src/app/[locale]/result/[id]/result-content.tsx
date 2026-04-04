'use client';

import { Report } from '@/actions';
import { Snippet } from '@nextui-org/snippet';
import { useTranslations } from 'next-intl';
import { title } from '@/components/primitives';
import { BarChart } from '@/components/bar-chart';
import { ReportLanguageSwitch } from './report-language-switch';
import ShareBar from '@/components/share-bar';
import { DomainTabs } from './domain-tabs';
import { Chip } from '@nextui-org/react';

interface ResultContentProps {
  report: Report;
  showExpanded?: boolean;
}

export function ResultContent({ report, showExpanded }: ResultContentProps) {
  const t = useTranslations('results');

  return (
    <>
      <div className='flex'>
        <div className='flex-grow'>
          <ReportLanguageSwitch
            language={report.language}
            availableLanguages={report.availableLanguages}
          />
        </div>
        <Chip>{new Date(report.timestamp).toLocaleDateString()}</Chip>
      </div>
      {report.fullName ? (
        <p className='text-center mt-3 text-lg font-medium text-default-700'>
          {report.fullName}
        </p>
      ) : null}
      <div className='text-center mt-4'>
        <span className='font-bold'>{t('important')}</span> &nbsp;
        {t('saveResults')}
      </div>
      <div className='flex mt-4'>
        <Snippet
          hideSymbol
          color='danger'
          className='w-full justify-center'
          size='lg'
        >
          {report.id}
        </Snippet>
      </div>
      <div className='flex mt-5 justify-end w-full gap-x-1 print:hidden'>
        <ShareBar report={report} />
      </div>
      <div className='flex mt-10'>
        <h1 className={title()}>{t('theBigFive')}</h1>
      </div>
      <BarChart max={120} results={report.results} />
      <DomainTabs
        results={report.results}
        showExpanded={!!showExpanded}
        scoreText={t('score')}
      />
    </>
  );
}
