import { defineFunction } from '@aws-amplify/backend';

export const dataInvariants = defineFunction({
  name: 'faithful77-data-invariants',
  entry: './handler.ts',
  runtime: 24,
  resourceGroupName: 'data',
  timeoutSeconds: 10,
  memoryMB: 256,
});
