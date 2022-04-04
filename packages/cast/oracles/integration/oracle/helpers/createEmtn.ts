import { Env } from '../types';
import { CreateEMTNInput } from '@castframework/models';

export async function createEmtn(
  env: Env,
  emtnInput: CreateEMTNInput,
): Promise<{
  instrumentAddress: string;
  transactionHash: string;
}> {
  return await env.froClient.createEMTN(emtnInput);
}
