import { TEST_DATABASE_SKIP_MESSAGE, isTestDatabaseConfigured } from "./helpers";

if (!isTestDatabaseConfigured()) {
  console.warn(TEST_DATABASE_SKIP_MESSAGE);
}
