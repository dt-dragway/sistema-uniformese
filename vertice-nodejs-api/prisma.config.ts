import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  seed: 'ts-node --project tsconfig.seed.json prisma/seed.ts',
});
