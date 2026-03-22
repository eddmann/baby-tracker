import type { ConfigRepository } from "../repositories/interfaces/config.repository";
import type { SessionRepository } from "../repositories/interfaces/session.repository";
import { generateToken, hashPin, verifyPin } from "../middleware/auth";
import { unauthorized } from "./errors";
import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";
import type { UseCaseError } from "./errors";

interface Deps {
  configRepository: ConfigRepository;
  sessionRepository: SessionRepository;
}

interface Input {
  pin: string;
}

interface Output {
  token: string;
}

export async function verifyPinUseCase(
  deps: Deps,
  input: Input,
): Promise<Result<Output, UseCaseError>> {
  let storedHash = await deps.configRepository.get("pin_hash");

  // If no PIN is set yet, set it with the provided PIN
  if (!storedHash) {
    storedHash = await hashPin(input.pin);
    await deps.configRepository.set("pin_hash", storedHash);
  }

  const isValid = await verifyPin(input.pin, storedHash);
  if (!isValid) {
    return err(unauthorized("Invalid PIN"));
  }

  const token = generateToken();
  const expiresAt = new Date(
    Date.now() + 90 * 24 * 60 * 60 * 1000,
  ).toISOString();
  await deps.sessionRepository.create(token, expiresAt);

  return ok({ token });
}
