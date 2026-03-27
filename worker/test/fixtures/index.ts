export * from "./session.fixture";
export * from "./sleep.fixture";
export * from "./feed.fixture";
export * from "./nappy.fixture";
export * from "./pump.fixture";
export * from "./dailyTask.fixture";
export * from "./growth.fixture";

import { resetSessionIdCounter } from "./session.fixture";
import { resetSleepIdCounter } from "./sleep.fixture";
import { resetFeedIdCounter } from "./feed.fixture";
import { resetNappyIdCounter } from "./nappy.fixture";
import { resetPumpIdCounter } from "./pump.fixture";
import {
  resetDailyTaskIdCounter,
  resetDailyTaskCompletionIdCounter,
} from "./dailyTask.fixture";
import { resetGrowthIdCounter } from "./growth.fixture";

export function resetAllFixtureCounters(): void {
  resetSessionIdCounter();
  resetSleepIdCounter();
  resetFeedIdCounter();
  resetNappyIdCounter();
  resetPumpIdCounter();
  resetDailyTaskIdCounter();
  resetDailyTaskCompletionIdCounter();
  resetGrowthIdCounter();
}
