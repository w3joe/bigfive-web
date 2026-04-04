'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@nextui-org/button';
import { RadioGroup, Radio } from '@nextui-org/radio';
import { Progress } from '@nextui-org/progress';
import confetti from 'canvas-confetti';
import { useRouter } from '@/navigation';

import { CloseIcon, InfoIcon } from '@/components/icons';
import { type Question } from '@bigfive-org/questions';
import { sleep, formatTimer, isDev } from '@/lib/helpers';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import useTimer from '@/hooks/useTimer';
import { type Answer } from '@/types';
import { Card, CardHeader } from '@nextui-org/card';
import { useTranslations } from 'next-intl';
import {
  displayNameFromForm,
  emptyParticipantForm,
  formStateToProfile,
  isParticipantFormFullyValid,
  participantFromLegacyFullName
} from '@/lib/participant';
import { ParticipantIntake } from './participant-intake';

interface SurveyProps {
  questions: Question[];
  nextText: string;
  prevText: string;
  resultsText: string;
  saveTest: Function;
  language: string;
}

type StoredB5 = {
  answers?: Answer[];
  currentQuestionIndex?: number;
  participant?: Partial<import('@/types').ParticipantFormState>;
  intakeStep?: number;
  /** Legacy single-field name */
  fullName?: string;
};

export const Survey = ({
  questions,
  nextText,
  prevText,
  resultsText,
  saveTest,
  language
}: SurveyProps) => {
  const router = useRouter();
  const t = useTranslations('test');
  const [phase, setPhase] = useState<'name' | 'survey'>('name');
  const [intakeStep, setIntakeStep] = useState(0);
  const [participant, setParticipant] = useState(emptyParticipantForm);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionsPerPage, setQuestionsPerPage] = useState(1);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [restored, setRestored] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const { width } = useWindowDimensions();
  const seconds = useTimer();

  useEffect(() => {
    const handleResize = () => {
      setQuestionsPerPage(window.innerWidth > 768 ? 3 : 1);
    };
    handleResize();
  }, [width]);

  useEffect(() => {
    const restoreData = () => {
      if (dataInLocalStorage()) {
        console.log('Restoring data from local storage');
        restoreDataFromLocalStorage();
      }
    };
    restoreData();
  }, []);

  const currentQuestions = useMemo(
    () =>
      questions.slice(
        currentQuestionIndex,
        currentQuestionIndex + questionsPerPage
      ),
    [currentQuestionIndex, questions, questionsPerPage]
  );

  const isTestDone = questions.length === answers.length;

  const progress = Math.round((answers.length / questions.length) * 100);

  const nextButtonDisabled =
    inProgress ||
    currentQuestionIndex + questionsPerPage > answers.length ||
    (isTestDone &&
      currentQuestionIndex === questions.length - questionsPerPage) ||
    loading;

  const backButtonDisabled = currentQuestionIndex === 0 || loading;

  async function handleAnswer(id: string, value: string) {
    const question = questions.find((question) => question.id === id);
    if (!question) return;

    const newAnswer: Answer = {
      id,
      score: Number(value),
      domain: question.domain,
      facet: question.facet
    };

    setAnswers((prevAnswers) => [
      ...prevAnswers.filter((a) => a.id !== id),
      newAnswer
    ]);

    const latestAnswerId = answers.slice(-1)[0]?.id;

    if (
      questionsPerPage === 1 &&
      questions.length !== answers.length + 1 &&
      id !== latestAnswerId
    ) {
      setInProgress(true);
      await sleep(700);
      setCurrentQuestionIndex((prev) => prev + 1);
      window.scrollTo(0, 0);
      setInProgress(false);
    }
    populateDataInLocalStorage();
  }

  function handlePreviousQuestions() {
    setCurrentQuestionIndex((prev) => prev - questionsPerPage);
    window.scrollTo(0, 0);
  }

  function handleNextQuestions() {
    if (inProgress) return;
    setCurrentQuestionIndex((prev) => prev + questionsPerPage);
    window.scrollTo(0, 0);
    if (restored) setRestored(false);
  }

  function skipToEnd() {
    const randomAnswers = questions
      .map((question) => ({
        id: question.id,
        score: Math.floor(Math.random() * 5) + 1,
        domain: question.domain,
        facet: question.facet
      }))
      .slice(0, questions.length - 1);

    setAnswers([...randomAnswers]);
    setCurrentQuestionIndex(questions.length - 1);
  }

  async function submitTest() {
    if (!isParticipantFormFullyValid(participant)) {
      return;
    }
    setLoading(true);
    try {
      confetti({});
      const profile = formStateToProfile(participant);
      const displayName = displayNameFromForm(participant);
      const result = await saveTest({
        testId: 'b5-120',
        lang: language,
        fullName: displayName.slice(0, 500),
        participant: profile,
        invalid: false,
        timeElapsed: seconds,
        dateStamp: new Date(),
        answers
      });
      localStorage.removeItem('inProgress');
      localStorage.removeItem('b5data');
      localStorage.setItem('resultId', result.id);
      router.push(`/result/${result.id}`);
    } finally {
      setLoading(false);
    }
  }

  function dataInLocalStorage() {
    return !!localStorage.getItem('inProgress');
  }

  function populateDataInLocalStorage() {
    localStorage.setItem('inProgress', 'true');
    localStorage.setItem(
      'b5data',
      JSON.stringify({
        answers,
        currentQuestionIndex,
        participant,
        intakeStep,
        fullName: displayNameFromForm(participant)
      } satisfies StoredB5)
    );
  }

  function restoreDataFromLocalStorage() {
    const data = localStorage.getItem('b5data');
    if (data) {
      const parsed = JSON.parse(data) as StoredB5;
      const a = parsed.answers ?? [];
      const idx = parsed.currentQuestionIndex ?? 0;
      setAnswers(a);
      setCurrentQuestionIndex(idx);

      if (parsed.participant && typeof parsed.participant === 'object') {
        setParticipant({
          ...emptyParticipantForm(),
          ...parsed.participant
        });
      } else if (typeof parsed.fullName === 'string' && parsed.fullName.trim()) {
        setParticipant(participantFromLegacyFullName(parsed.fullName));
      }

      if (typeof parsed.intakeStep === 'number' && parsed.intakeStep >= 0) {
        setIntakeStep(parsed.intakeStep);
      }

      setRestored(a.length > 0);
      if (a.length > 0) setPhase('survey');
    }
  }

  function completeIntake() {
    if (!isParticipantFormFullyValid(participant)) return;
    setPhase('survey');
    populateDataInLocalStorage();
  }

  function clearDataInLocalStorage() {
    console.log('Clearing data from local storage');
    localStorage.removeItem('inProgress');
    localStorage.removeItem('b5data');
    location.reload();
  }

  if (phase === 'name') {
    return (
      <ParticipantIntake
        participant={participant}
        setParticipant={setParticipant}
        step={intakeStep}
        setStep={setIntakeStep}
        onComplete={completeIntake}
        onPersist={populateDataInLocalStorage}
      />
    );
  }

  return (
    <div className='mt-2'>
      <Progress
        aria-label='Progress bar'
        value={progress}
        className='max-w'
        showValueLabel={true}
        label={formatTimer(seconds)}
        minValue={0}
        maxValue={100}
        size='lg'
        color='secondary'
      />
      {restored && (
        <Card className='mt-4 bg-warning/20 text-warning-600 dark:text-warning'>
          <CardHeader className='justify-between'>
            <Button isIconOnly variant='light' color='warning'>
              <InfoIcon />
            </Button>
            <p>
              Your answers has been restored. Click here to&nbsp;
              <a
                className='underline cursor-pointer'
                onClick={clearDataInLocalStorage}
                aria-label='Clear data'
              >
                start a new test
              </a>
              .
            </p>
            <Button
              isIconOnly
              variant='light'
              color='warning'
              onClick={() => setRestored(false)}
            >
              <CloseIcon />
            </Button>
          </CardHeader>
        </Card>
      )}
      {currentQuestions.map((question) => (
        <div key={'q' + question.num}>
          <h2 className='text-2xl my-4'>{question.text}</h2>
          <div>
            <RadioGroup
              onValueChange={(value) => handleAnswer(question.id, value)}
              value={answers
                .find((answer) => answer.id === question.id)
                ?.score.toString()}
              color='secondary'
              isDisabled={inProgress}
            >
              {question.choices.map((choice, index) => (
                <Radio
                  key={index + question.id}
                  value={choice.score.toString()}
                >
                  {choice.text}
                </Radio>
              ))}
            </RadioGroup>
          </div>
        </div>
      ))}
      {isTestDone && !isParticipantFormFullyValid(participant) && (
        <div className='mt-10 mb-6 w-full max-w-lg space-y-4 rounded-xl border border-warning p-4 bg-warning-50 dark:bg-warning-950/30'>
          <p className='text-default-700 text-sm'>{t('intake_incomplete_profile')}</p>
          <Button color='warning' variant='flat' onPress={clearDataInLocalStorage}>
            {t('intake_clear_restart')}
          </Button>
        </div>
      )}
      <div className='my-12 space-x-4 inline-flex flex-wrap items-center gap-y-3'>
        <Button
          color='primary'
          isDisabled={backButtonDisabled}
          onClick={handlePreviousQuestions}
        >
          {prevText.toUpperCase()}
        </Button>

        <Button
          color='primary'
          isDisabled={nextButtonDisabled}
          onClick={handleNextQuestions}
        >
          {nextText.toUpperCase()}
        </Button>

        {isTestDone && (
          <Button
            color='secondary'
            onClick={submitTest}
            disabled={loading || !isParticipantFormFullyValid(participant)}
            isLoading={loading}
          >
            {resultsText.toUpperCase()}
          </Button>
        )}

        {isDev && !isTestDone && (
          <Button color='primary' onClick={skipToEnd}>
            Skip to end (dev)
          </Button>
        )}
      </div>
    </div>
  );
};
