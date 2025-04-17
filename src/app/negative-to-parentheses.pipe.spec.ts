import { NegativeToParenthesesPipe } from './negative-to-parentheses.pipe';

describe('NegativeToParenthesesPipe', () => {
  it('create an instance', () => {
    const pipe = new NegativeToParenthesesPipe();
    expect(pipe).toBeTruthy();
  });
});
