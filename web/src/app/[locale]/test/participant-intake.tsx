'use client';

import { Button } from '@nextui-org/button';
import { Input } from '@nextui-org/input';
import { Select, SelectItem } from '@nextui-org/select';
import type { ParticipantFormState } from '@/types';
import {
  parseCommaSeparatedList,
  validateIntakeStep
} from '@/lib/participant';
import { useTranslations } from 'next-intl';
import { title } from '@/components/primitives';
import { useState } from 'react';

const INTAKE_STEPS = 4;

type Props = {
  participant: ParticipantFormState;
  setParticipant: React.Dispatch<React.SetStateAction<ParticipantFormState>>;
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  onComplete: () => void;
  onPersist: () => void;
};

export function ParticipantIntake({
  participant,
  setParticipant,
  step,
  setStep,
  onComplete,
  onPersist
}: Props) {
  const t = useTranslations('test');
  const [showErrors, setShowErrors] = useState(false);

  function patch<K extends keyof ParticipantFormState>(
    key: K,
    value: ParticipantFormState[K]
  ) {
    setShowErrors(false);
    setParticipant((prev) => ({ ...prev, [key]: value }));
  }

  const sexOptions = [
    { key: 'female', label: t('intake_sex_female') },
    { key: 'male', label: t('intake_sex_male') },
    { key: 'non_binary', label: t('intake_sex_non_binary') },
    { key: 'prefer_not_to_say', label: t('intake_prefer_not') },
    { key: 'other', label: t('intake_sex_other') }
  ];

  const maritalOptions = [
    { key: 'single', label: t('intake_marital_single') },
    { key: 'partnered', label: t('intake_marital_partnered') },
    { key: 'married', label: t('intake_marital_married') },
    { key: 'divorced_separated', label: t('intake_marital_divorced') },
    { key: 'widowed', label: t('intake_marital_widowed') },
    { key: 'prefer_not_to_say', label: t('intake_prefer_not') }
  ];

  const educationOptions = [
    { key: 'less_than_high_school', label: t('intake_edu_less_hs') },
    { key: 'high_school', label: t('intake_edu_hs') },
    { key: 'some_college', label: t('intake_edu_some_college') },
    { key: 'bachelor', label: t('intake_edu_bachelor') },
    { key: 'master', label: t('intake_edu_master') },
    { key: 'doctorate', label: t('intake_edu_doctorate') },
    { key: 'vocational', label: t('intake_edu_vocational') },
    { key: 'prefer_not_to_say', label: t('intake_prefer_not') }
  ];

  const stepTitles = [
    t('intake_step_name'),
    t('intake_step_demo'),
    t('intake_step_location'),
    t('intake_step_interests')
  ];

  const req = (label: string) => `${label} ${t('intake_required_marker')}`;

  function goNext() {
    if (!validateIntakeStep(step, participant)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (step < INTAKE_STEPS - 1) {
      setStep((s) => s + 1);
      window.scrollTo(0, 0);
      onPersist();
      return;
    }
    onPersist();
    onComplete();
  }

  function goBack() {
    if (step > 0) {
      setShowErrors(false);
      setStep((s) => s - 1);
      window.scrollTo(0, 0);
      onPersist();
    }
  }

  const e0 = showErrors && step === 0;
  const e1 = showErrors && step === 1;
  const e2 = showErrors && step === 2;
  const e3 = showErrors && step === 3;

  return (
    <div className='mt-2 max-w-xl mx-auto space-y-6'>
      <div>
        <h1 className={title({ class: 'text-2xl md:text-3xl mb-1' })}>
          {t('nameStepTitle')}
        </h1>
        <p className='text-default-500 text-sm'>
          {t('intake_step_progress', { step: step + 1, total: INTAKE_STEPS })} ·{' '}
          {stepTitles[step]}
        </p>
        <p className='text-default-600 text-base mt-4 leading-relaxed'>
          {t('nameStepHint')}
        </p>
        {showErrors && (
          <p className='text-danger text-sm font-medium mt-3' role='alert'>
            {t('intake_all_required')}
          </p>
        )}
      </div>

      {step === 0 && (
        <div className='space-y-4'>
          <Input
            label={req(t('intake_first_name'))}
            value={participant.firstName}
            onValueChange={(v) => patch('firstName', v)}
            variant='bordered'
            size='lg'
            autoComplete='given-name'
            isInvalid={e0 && !participant.firstName.trim()}
          />
          <Input
            label={req(t('intake_middle_name'))}
            description={t('intake_middle_name_help')}
            value={participant.middleName}
            onValueChange={(v) => patch('middleName', v)}
            variant='bordered'
            size='lg'
            autoComplete='additional-name'
            isInvalid={e0 && !participant.middleName.trim()}
          />
          <Input
            label={req(t('intake_last_name'))}
            value={participant.lastName}
            onValueChange={(v) => patch('lastName', v)}
            variant='bordered'
            size='lg'
            autoComplete='family-name'
            isInvalid={e0 && !participant.lastName.trim()}
          />
        </div>
      )}

      {step === 1 && (
        <div className='space-y-4'>
          <Input
            label={req(t('intake_age'))}
            placeholder={t('intake_age_placeholder')}
            type='number'
            min={1}
            max={120}
            value={participant.age}
            onValueChange={(v) => patch('age', v)}
            variant='bordered'
            size='lg'
            inputMode='numeric'
            isInvalid={
              e1 &&
              (() => {
                const n = parseInt(participant.age.trim(), 10);
                return !Number.isFinite(n) || n < 1 || n > 120;
              })()
            }
          />
          <Select
            label={req(t('intake_sex'))}
            placeholder={t('intake_select_placeholder')}
            selectedKeys={participant.sex ? new Set([participant.sex]) : new Set()}
            onSelectionChange={(keys) => {
              const k = Array.from(keys)[0];
              patch('sex', typeof k === 'string' ? k : '');
            }}
            variant='bordered'
            size='lg'
            isInvalid={e1 && !participant.sex.trim()}
            errorMessage={e1 && !participant.sex.trim() ? ' ' : undefined}
          >
            {sexOptions.map((o) => (
              <SelectItem key={o.key}>{o.label}</SelectItem>
            ))}
          </Select>
          <Select
            label={req(t('intake_marital'))}
            placeholder={t('intake_select_placeholder')}
            selectedKeys={
              participant.maritalStatus
                ? new Set([participant.maritalStatus])
                : new Set()
            }
            onSelectionChange={(keys) => {
              const k = Array.from(keys)[0];
              patch('maritalStatus', typeof k === 'string' ? k : '');
            }}
            variant='bordered'
            size='lg'
            isInvalid={e1 && !participant.maritalStatus.trim()}
            errorMessage={
              e1 && !participant.maritalStatus.trim() ? ' ' : undefined
            }
          >
            {maritalOptions.map((o) => (
              <SelectItem key={o.key}>{o.label}</SelectItem>
            ))}
          </Select>
          <Input
            label={req(t('intake_occupation'))}
            value={participant.occupation}
            onValueChange={(v) => patch('occupation', v)}
            variant='bordered'
            size='lg'
            autoComplete='organization-title'
            isInvalid={e1 && !participant.occupation.trim()}
          />
          <Select
            label={req(t('intake_education'))}
            placeholder={t('intake_select_placeholder')}
            selectedKeys={
              participant.educationLevel
                ? new Set([participant.educationLevel])
                : new Set()
            }
            onSelectionChange={(keys) => {
              const k = Array.from(keys)[0];
              patch('educationLevel', typeof k === 'string' ? k : '');
            }}
            variant='bordered'
            size='lg'
            isInvalid={e1 && !participant.educationLevel.trim()}
            errorMessage={
              e1 && !participant.educationLevel.trim() ? ' ' : undefined
            }
          >
            {educationOptions.map((o) => (
              <SelectItem key={o.key}>{o.label}</SelectItem>
            ))}
          </Select>
          <Input
            label={req(t('intake_ethnic'))}
            placeholder={t('intake_ethnic_placeholder')}
            value={participant.ethnicBackground}
            onValueChange={(v) => patch('ethnicBackground', v)}
            variant='bordered'
            size='lg'
            isInvalid={e1 && !participant.ethnicBackground.trim()}
          />
        </div>
      )}

      {step === 2 && (
        <div className='space-y-4'>
          <Input
            label={req(t('intake_city'))}
            value={participant.city}
            onValueChange={(v) => patch('city', v)}
            variant='bordered'
            size='lg'
            autoComplete='address-level2'
            isInvalid={e2 && !participant.city.trim()}
          />
          <Input
            label={req(t('intake_country'))}
            value={participant.country}
            onValueChange={(v) => patch('country', v)}
            variant='bordered'
            size='lg'
            autoComplete='country-name'
            isInvalid={e2 && !participant.country.trim()}
          />
        </div>
      )}

      {step === 3 && (
        <div className='space-y-4'>
          <Input
            label={req(t('intake_skills'))}
            placeholder={t('intake_list_hint')}
            value={participant.skillsRaw}
            onValueChange={(v) => patch('skillsRaw', v)}
            variant='bordered'
            size='lg'
            isInvalid={
              e3 && !parseCommaSeparatedList(participant.skillsRaw)?.length
            }
          />
          <Input
            label={req(t('intake_hobbies'))}
            placeholder={t('intake_list_hint')}
            value={participant.hobbiesRaw}
            onValueChange={(v) => patch('hobbiesRaw', v)}
            variant='bordered'
            size='lg'
            isInvalid={
              e3 && !parseCommaSeparatedList(participant.hobbiesRaw)?.length
            }
          />
        </div>
      )}

      <div className='flex flex-wrap gap-3 pt-4'>
        <Button
          variant='bordered'
          size='lg'
          radius='full'
          onPress={goBack}
          isDisabled={step === 0}
        >
          {t('intake_back').toUpperCase()}
        </Button>
        <Button color='primary' size='lg' radius='full' onPress={goNext}>
          {step === INTAKE_STEPS - 1
            ? t('continueToTest').toUpperCase()
            : t('intake_next').toUpperCase()}
        </Button>
      </div>
    </div>
  );
}
