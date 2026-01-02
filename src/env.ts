import z from "zod";

const envSchema = z.object({
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
});

export const env = envSchema.parse({
  HOST: process.env.HOST,
  PORT: process.env.PORT,
});
