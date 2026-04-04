import { SVGProps } from 'react';

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type BaseAnswer = {
  score: number;
  domain: string;
  facet: number;
};

export type Answer = BaseAnswer & { id: string };

/** Normalized profile persisted to Supabase (snake_case columns). */
export type ParticipantProfile = {
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  age: number | null;
  sex: string | null;
  maritalStatus: string | null;
  occupation: string | null;
  educationLevel: string | null;
  ethnicBackground: string | null;
  city: string | null;
  country: string | null;
  skillsAndExpertiseList: string[] | null;
  hobbiesAndInterestsList: string[] | null;
};

/** Client-side intake form (string fields before coercion). */
export type ParticipantFormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  age: string;
  sex: string;
  maritalStatus: string;
  occupation: string;
  educationLevel: string;
  ethnicBackground: string;
  city: string;
  country: string;
  skillsRaw: string;
  hobbiesRaw: string;
};

export type DbResult = {
  testId: string;
  lang: string;
  /** Display name — also stored as `full_name` for backwards compatibility. */
  fullName: string;
  participant: ParticipantProfile;
  invalid: boolean;
  timeElapsed: number;
  dateStamp: string | Date;
  answers: Answer[];
};

export type Feedback = {
  name: string;
  email: string;
  message: string;
};

type ErrorName = 'NotFoundError' | 'SavingError';

class ErrorBase<T extends string> extends Error {
  name: T;
  message: string;
  cause: any;

  constructor({
    name,
    message,
    cause
  }: {
    name: T;
    message: string;
    cause?: any;
  }) {
    super();
    this.name = name;
    this.message = message;
    this.cause = cause;
  }
}

export class B5Error extends ErrorBase<ErrorName> {}
