'use client';

import { Link } from '@nextui-org/link';
import { button as buttonStyles } from '@nextui-org/theme';
import { title, subtitle } from '@/components/primitives';
import clsx from 'clsx';
import { FeaturesGrid } from '@/components/features-grid';
import {
  ExperimentIcon,
  GithubIcon,
  LanguageIcon,
  LogosOpensource,
  MoneyIcon
} from '@/components/icons';
import { ArrowRightIcon } from '@/components/icons';
import { siteConfig, supportEmail } from '@/config/site';
import { useTranslations } from 'next-intl';
import { Translated } from '@/components/translated';

export function HomePage() {
  const t = useTranslations('frontpage');

  const features = [
    {
      title: t('cards.open.title'),
      description: t('cards.open.text'),
      icon: LogosOpensource({})
    },
    {
      title: t('cards.free.title'),
      description: t('cards.free.text'),
      icon: MoneyIcon({})
    },
    {
      title: t('cards.scientific.title'),
      description: t('cards.scientific.text'),
      icon: ExperimentIcon({})
    },
    {
      title: t('cards.translated.title'),
      description: t.raw('cards.translated.text'),
      icon: LanguageIcon({}),
      href: 'https://b5.translations.alheimsins.net/'
    }
  ];

  const titleDescription = t.rich('description.top', {
    violet: (chunks) => (
      <span className={title({ color: 'violet' })}>{chunks}</span>
    )
  });

  const testsTaken = t.rich('tests_taken', {
    green: (chunks) => (
      <span className={title({ color: 'green' })}>{chunks}</span>
    ),
    n: '4.000.000'
  });

  return (
    <section className='relative'>
      <div>
        <section className='flex flex-col items-center justify-center gap-4 py-8 md:py-10'>
          <div className='flex relative z-20 flex-col gap-6 w-full lg:w-1/2 xl:mt-10'>
            <div className='text-center justify-center mt-10'>
              <h1 className={title()}>{titleDescription}</h1>
              <br />
              <h2 className={subtitle({ class: 'mt-4' })}>
                {t('description.info')}
              </h2>
            </div>

            <div className='flex flex-col md:flex-row items-center gap-4 justify-center flex-wrap'>
              <Link
                href='/test'
                className={clsx(
                  buttonStyles({
                    color: 'primary',
                    radius: 'full',
                    variant: 'shadow',
                    size: 'lg',
                    fullWidth: true
                  }),
                  'md:w-auto'
                )}
              >
                {t('call_to_action')} <ArrowRightIcon />
              </Link>
              <Link
                isExternal
                className={clsx(
                  buttonStyles({
                    variant: 'bordered',
                    radius: 'full',
                    size: 'lg',
                    fullWidth: true
                  }),
                  'md:w-auto'
                )}
                href={siteConfig.links.github}
              >
                <GithubIcon size={20} />
                {t('github_cta')}
              </Link>
              <Link
                isExternal
                className={clsx(
                  buttonStyles({
                    variant: 'flat',
                    radius: 'full',
                    size: 'lg',
                    fullWidth: true
                  }),
                  'md:w-auto border border-default-200'
                )}
                href={siteConfig.links.onflow}
              >
                {t('onflow_cta')}
              </Link>
            </div>
          </div>

          <div className='font-normal text-default-500 block max-w-full text-center underline'>
            {t('no_registration')}
          </div>
        </section>

        <div className='mt-20 mx-2'>
          <FeaturesGrid features={features} />
        </div>
      </div>

      <section className='border-t border-b border-divider px-8 mt-16 lg:mt-44 text-center'>
        <div className='my-8'>
          <h1 className={title()}>{testsTaken}</h1>
        </div>
      </section>

      <section className='border-t border-divider mt-24 pt-16 pb-8 px-4 text-center max-w-2xl mx-auto'>
        <h2 className={title({ class: 'text-2xl md:text-3xl' })}>
          {t('thanks.title')}
        </h2>
        <p className='text-default-600 mt-5 text-base md:text-lg leading-relaxed'>
          {t('thanks.body')}
        </p>
        <p className='text-default-600 mt-4 text-base md:text-lg leading-relaxed'>
          {t('thanks.invite')}
        </p>
        <Link
          isExternal
          href={`mailto:${supportEmail}?subject=${encodeURIComponent('OpenFlo — more about my experience')}`}
          className={clsx(
            buttonStyles({
              color: 'primary',
              variant: 'flat',
              radius: 'full',
              size: 'lg'
            }),
            'mt-8 inline-flex'
          )}
        >
          {t('thanks.cta')}
        </Link>
      </section>

      <Translated />
    </section>
  );
}
