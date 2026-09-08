import { Amplify } from 'aws-amplify';

import { configureAmplify, isAmplifyOutputs } from './amplify';

jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

const validOutputs = {
  version: '1',
  auth: {
    aws_region: 'us-east-1',
    user_pool_id: 'us-east-1_synthetic',
    user_pool_client_id: 'synthetic-client-id',
  },
};

describe('Amplify bootstrap', () => {
  it('configures Amplify from valid generated Auth outputs', () => {
    expect(configureAmplify(validOutputs)).toBe(true);
    expect(Amplify.configure).toHaveBeenCalledWith(validOutputs);
  });

  it('accepts the current 1.5 client-output schema version', () => {
    const currentOutputs = { ...validOutputs, version: '1.5' };

    expect(configureAmplify(currentOutputs)).toBe(true);
    expect(Amplify.configure).toHaveBeenCalledWith(currentOutputs);
  });

  it.each([
    undefined,
    {},
    { ...validOutputs, version: '2' },
    { version: '1' },
    { version: '1', auth: {} },
    {
      version: '1',
      auth: {
        aws_region: 'us-east-1',
        user_pool_id: 'us-east-1_synthetic',
      },
    },
  ])('does not configure Amplify from missing or malformed outputs', (outputs) => {
    expect(isAmplifyOutputs(outputs)).toBe(false);
    expect(configureAmplify(outputs)).toBe(false);
    expect(Amplify.configure).not.toHaveBeenCalled();
  });
});
