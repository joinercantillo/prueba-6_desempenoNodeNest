import { Role } from '../../../common/enums/role.enum.js';
import { ReservationStatus } from '../enums/maintenance-status.enum.js';
import {
  VALID_TRANSITIONS,
  canCancel,
  isFinalStatus,
  isOwner,
  isValidTransition,
} from './status-rules.js';

describe('status rules (RN-03)', () => {
  it('declares the expected allowed transitions', () => {
    expect(VALID_TRANSITIONS).toEqual({
      [ReservationStatus.SCHEDULED]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED],
      [ReservationStatus.CONFIRMED]: [ReservationStatus.IN_PROGRESS, ReservationStatus.CANCELLED],
      [ReservationStatus.IN_PROGRESS]: [ReservationStatus.COMPLETED],
      [ReservationStatus.COMPLETED]: [],
      [ReservationStatus.CANCELLED]: [],
    });
  });

  it.each([
    [ReservationStatus.SCHEDULED, ReservationStatus.CONFIRMED],
    [ReservationStatus.SCHEDULED, ReservationStatus.CANCELLED],
    [ReservationStatus.CONFIRMED, ReservationStatus.IN_PROGRESS],
    [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED],
    [ReservationStatus.IN_PROGRESS, ReservationStatus.COMPLETED],
  ])('allows %s -> %s', (current, requested) => {
    expect(isValidTransition(current, requested)).toBe(true);
  });

  it.each([
    [ReservationStatus.SCHEDULED, ReservationStatus.IN_PROGRESS],
    [ReservationStatus.SCHEDULED, ReservationStatus.COMPLETED],
    [ReservationStatus.SCHEDULED, ReservationStatus.SCHEDULED],
    [ReservationStatus.CONFIRMED, ReservationStatus.SCHEDULED],
    [ReservationStatus.CONFIRMED, ReservationStatus.COMPLETED],
    [ReservationStatus.IN_PROGRESS, ReservationStatus.CANCELLED],
    [ReservationStatus.COMPLETED, ReservationStatus.CONFIRMED],
    [ReservationStatus.CANCELLED, ReservationStatus.CONFIRMED],
  ])('rejects the jump %s -> %s', (current, requested) => {
    expect(isValidTransition(current, requested)).toBe(false);
  });

  it('only FINISHED and CANCELLED are final statuses', () => {
    expect(isFinalStatus(ReservationStatus.COMPLETED)).toBe(true);
    expect(isFinalStatus(ReservationStatus.CANCELLED)).toBe(true);
    expect(isFinalStatus(ReservationStatus.SCHEDULED)).toBe(false);
    expect(isFinalStatus(ReservationStatus.CONFIRMED)).toBe(false);
    expect(isFinalStatus(ReservationStatus.IN_PROGRESS)).toBe(false);
  });

  it('only admin and coordinator can cancel', () => {
    expect(canCancel(Role.ADMIN)).toBe(true);
    expect(canCancel(Role.TECHNICIAN)).toBe(true);
    expect(canCancel(Role.TECHNICIAN)).toBe(false);
  });

  it('a receptionist only owns their reservations', () => {
    expect(isOwner(Role.TECHNICIAN, 1, 1)).toBe(true);
    expect(isOwner(Role.TECHNICIAN, 2, 1)).toBe(false);
    expect(isOwner(Role.TECHNICIAN, undefined, 1)).toBe(false);
  });

  it('admin and coordinator access any reservation', () => {
    expect(isOwner(Role.ADMIN, 7, undefined)).toBe(true);
    expect(isOwner(Role.TECHNICIAN, 7, undefined)).toBe(true);
  });
});
