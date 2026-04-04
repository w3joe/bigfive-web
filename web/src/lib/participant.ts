import type { ParticipantFormState, ParticipantProfile } from '@/types';

const MAX_LIST_ITEMS = 50;
const MAX_ITEM_LEN = 200;

export function emptyParticipantForm(): ParticipantFormState {
  return {
    firstName: '',
    middleName: '',
    lastName: '',
    age: '',
    sex: '',
    maritalStatus: '',
    occupation: '',
    educationLevel: '',
    ethnicBackground: '',
    city: '',
    country: '',
    skillsRaw: '',
    hobbiesRaw: ''
  };
}

/** Comma-separated only → jsonb array in DB. */
export function parseCommaSeparatedList(raw: string): string[] | null {
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS)
    .map((s) => s.slice(0, MAX_ITEM_LEN));
  return parts.length > 0 ? parts : null;
}

export function formStateToProfile(s: ParticipantFormState): ParticipantProfile {
  const ageParsed = parseInt(String(s.age).trim(), 10);
  const age =
    Number.isFinite(ageParsed) && ageParsed >= 1 && ageParsed <= 120
      ? ageParsed
      : null;

  const clip = (v: string) => {
    const x = v.trim();
    return x.length ? x.slice(0, 500) : null;
  };

  return {
    firstName: clip(s.firstName),
    middleName: clip(s.middleName),
    lastName: clip(s.lastName),
    age,
    sex: clip(s.sex),
    maritalStatus: clip(s.maritalStatus),
    occupation: clip(s.occupation),
    educationLevel: clip(s.educationLevel),
    ethnicBackground: clip(s.ethnicBackground),
    city: clip(s.city),
    country: clip(s.country),
    skillsAndExpertiseList: parseCommaSeparatedList(s.skillsRaw),
    hobbiesAndInterestsList: parseCommaSeparatedList(s.hobbiesRaw)
  };
}

export function displayNameFromForm(s: ParticipantFormState): string {
  return [s.firstName, s.middleName, s.lastName]
    .map((x) => x.trim())
    .filter(Boolean)
    .join(' ')
    .trim();
}

export function validateIntakeStep(
  step: number,
  s: ParticipantFormState
): boolean {
  switch (step) {
    case 0:
      return [s.firstName, s.middleName, s.lastName].every(
        (x) => x.trim().length >= 1
      );
    case 1: {
      const age = parseInt(s.age.trim(), 10);
      return (
        Number.isFinite(age) &&
        age >= 1 &&
        age <= 120 &&
        s.sex.trim().length >= 1 &&
        s.maritalStatus.trim().length >= 1 &&
        s.occupation.trim().length >= 1 &&
        s.educationLevel.trim().length >= 1 &&
        s.ethnicBackground.trim().length >= 1
      );
    }
    case 2:
      return s.city.trim().length >= 1 && s.country.trim().length >= 1;
    case 3: {
      const sk = parseCommaSeparatedList(s.skillsRaw);
      const ho = parseCommaSeparatedList(s.hobbiesRaw);
      return Boolean(sk?.length && ho?.length);
    }
    default:
      return false;
  }
}

export function isParticipantFormFullyValid(s: ParticipantFormState): boolean {
  return [0, 1, 2, 3].every((st) => validateIntakeStep(st, s));
}

/** @deprecated Use isParticipantFormFullyValid — kept for call sites. */
export function isParticipantNameValid(s: ParticipantFormState): boolean {
  return isParticipantFormFullyValid(s);
}

/** Restore legacy saves that only stored `fullName`. */
export function participantFromLegacyFullName(fullName: string): ParticipantFormState {
  const p = emptyParticipantForm();
  const t = fullName.trim();
  if (!t) return p;
  const parts = t.split(/\s+/);
  if (parts.length === 1) {
    p.lastName = parts[0];
    return p;
  }
  p.firstName = parts[0];
  p.lastName = parts.slice(1).join(' ');
  return p;
}
