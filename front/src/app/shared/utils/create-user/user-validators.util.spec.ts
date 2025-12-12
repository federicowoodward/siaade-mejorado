import { UserRole } from './role-config';
import {
  MIN_AGE_YEARS,
  canCreateStep2,
  hasMinAge,
  isValidStudentStartYear,
} from './user-validators.util';

describe('user-validators.util', () => {
  const referenceDate = new Date(Date.UTC(2024, 0, 15));

  it('validates minimum age for birth dates', () => {
    expect(hasMinAge('2000-01-01', 16, referenceDate)).toBeTrue();
    expect(hasMinAge('2010-12-31', 16, referenceDate)).toBeFalse();
  });

  it('validates academic start year is at least 16 years after birth', () => {
    expect(isValidStudentStartYear('2000-06-15', 2017, 16)).toBeTrue();
    expect(isValidStudentStartYear('2010-06-15', 2024, 16)).toBeFalse();
  });

  it('blocks creation when birth date does not meet minimum age', () => {
    const params = {
      role: 'student' as UserRole,
      sex: 'F',
      birthDate: '2010-01-10',
      legajo: 'LEG1',
      studentStartYear: 2025,
      minAgeYears: MIN_AGE_YEARS,
      referenceDate,
    };
    expect(canCreateStep2(params)).toBeFalse();
  });

  it('allows creation when all date validations pass', () => {
    const params = {
      role: 'student' as UserRole,
      sex: 'F',
      birthDate: '2000-01-10',
      legajo: 'LEG1',
      studentStartYear: 2018,
      minAgeYears: MIN_AGE_YEARS,
      referenceDate,
    };
    expect(canCreateStep2(params)).toBeTrue();
  });
});
