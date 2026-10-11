import { greetingFor } from '../greeting';

describe('greetingFor', () => {
  it('says good morning from 5 am until noon', () => {
    expect(greetingFor(5)).toBe('Good morning');
    expect(greetingFor(11)).toBe('Good morning');
  });

  it('says good afternoon from noon until 5 pm', () => {
    expect(greetingFor(12)).toBe('Good afternoon');
    expect(greetingFor(16)).toBe('Good afternoon');
  });

  it('says good evening for the rest of the day, including after midnight', () => {
    expect(greetingFor(17)).toBe('Good evening');
    expect(greetingFor(23)).toBe('Good evening');
    expect(greetingFor(0)).toBe('Good evening');
    expect(greetingFor(4)).toBe('Good evening');
  });
});
