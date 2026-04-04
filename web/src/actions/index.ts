'use server';

import { getSupabaseAdmin } from '@/db';
import { B5Error, DbResult, Feedback } from '@/types';
import calculateScore from '@bigfive-org/score';
import generateResult, {
  getInfo,
  Language,
  Domain
} from '@bigfive-org/results';
import { formatId, validId } from '@/lib/helpers';

const resultsTable =
  process.env.SUPABASE_RESULTS_TABLE || 'survey_results';

const resultLanguages = getInfo().languages;

export type Report = {
  id: string;
  timestamp: number;
  fullName: string;
  availableLanguages: Language[];
  language: string;
  results: Domain[];
};

function toTimestamp(value: string | Date): number {
  if (value instanceof Date) return value.getTime();
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? Date.now() : t;
}

export async function getTestResult(
  rawId: string,
  language?: string
): Promise<Report | undefined> {
  'use server';
  try {
    const id = formatId(rawId.trim());
    if (!validId(id)) {
      throw new B5Error({
        name: 'NotFoundError',
        message: `Invalid result id: ${rawId}`
      });
    }

    const supabase = getSupabaseAdmin();
    const { data: row, error } = await supabase
      .from(resultsTable)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(error);
      throw new Error('Something wrong happend. Failed to get test result!');
    }

    if (!row) {
      console.error(`The test results with id ${id} are not found!`);
      throw new B5Error({
        name: 'NotFoundError',
        message: `The test results with id ${id} is not found in the database!`
      });
    }

    const selectedLanguage =
      language ||
      (!!resultLanguages.find((l) => l.id == row.lang) ? row.lang : 'en');

    const scores = calculateScore({ answers: row.answers });
    const results = generateResult({ lang: selectedLanguage, scores });

    const combinedName = [
      row.first_name,
      row.middle_name,
      row.last_name
    ]
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      .join(' ')
      .trim();

    return {
      id: row.id,
      timestamp: toTimestamp(row.date_stamp),
      fullName:
        (typeof row.full_name === 'string' && row.full_name.trim()) ||
        combinedName ||
        '',
      availableLanguages: resultLanguages,
      language: selectedLanguage,
      results
    };
  } catch (error) {
    if (error instanceof B5Error) {
      throw error;
    }
    throw new Error('Something wrong happend. Failed to get test result!');
  }
}

function normalizeDateStamp(value: DbResult['dateStamp']): string {
  const d =
    value instanceof Date ? value : new Date(typeof value === 'string' ? value : '');
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export async function saveTest(testResult: DbResult) {
  'use server';
  try {
    const supabase = getSupabaseAdmin();

    const answers = JSON.parse(
      JSON.stringify(testResult.answers ?? [])
    ) as DbResult['answers'];

    const timeElapsed = Math.max(
      0,
      Math.floor(Number(testResult.timeElapsed)) || 0
    );

    const p = testResult.participant;

    const row = {
      test_id: String(testResult.testId ?? ''),
      lang: String(testResult.lang ?? 'en'),
      full_name: String(testResult.fullName ?? '').trim().slice(0, 500),
      first_name: p.firstName,
      middle_name: p.middleName,
      last_name: p.lastName,
      age: p.age,
      sex: p.sex,
      marital_status: p.maritalStatus,
      occupation: p.occupation,
      education_level: p.educationLevel,
      ethnic_background: p.ethnicBackground,
      city: p.city,
      country: p.country,
      skills_and_expertise_list: p.skillsAndExpertiseList,
      hobbies_and_interests_list: p.hobbiesAndInterestsList,
      invalid: Boolean(testResult.invalid),
      time_elapsed: timeElapsed,
      date_stamp: normalizeDateStamp(testResult.dateStamp),
      answers
    };

    const { data, error } = await supabase
      .from(resultsTable)
      .insert(row)
      .select('id');

    if (error) {
      console.error('saveTest Supabase error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        table: resultsTable
      });
      throw new B5Error({
        name: 'SavingError',
        message:
          process.env.NODE_ENV === 'development'
            ? `Failed to save: ${error.message}${error.hint ? ` (${error.hint})` : ''}`
            : 'Failed to save test result!'
      });
    }

    const inserted = Array.isArray(data) ? data[0] : data;
    if (!inserted?.id) {
      console.error('saveTest: insert returned no row', { data, table: resultsTable });
      throw new B5Error({
        name: 'SavingError',
        message:
          'Failed to save test result! (no row returned — check table name, migration, and SUPABASE_SERVICE_ROLE_KEY)'
      });
    }

    return { id: inserted.id };
  } catch (error) {
    if (error instanceof B5Error) {
      throw error;
    }
    console.error(error);
    throw new B5Error({
      name: 'SavingError',
      message: 'Failed to save test result!'
    });
  }
}

export type FeebackState = {
  message: string;
  type: 'error' | 'success';
};

export async function saveFeedback(
  prevState: FeebackState,
  formData: FormData
): Promise<FeebackState> {
  'use server';
  const feedback: Feedback = {
    name: String(formData.get('name')),
    email: String(formData.get('email')),
    message: String(formData.get('message'))
  };
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('feedback').insert({
      name: feedback.name,
      email: feedback.email,
      message: feedback.message
    });

    if (error) {
      console.error(error);
      return {
        message: 'Error sending feedback!',
        type: 'error'
      };
    }

    return {
      message: 'Sent successfully!',
      type: 'success'
    };
  } catch (error) {
    return {
      message: 'Error sending feedback!',
      type: 'error'
    };
  }
}
