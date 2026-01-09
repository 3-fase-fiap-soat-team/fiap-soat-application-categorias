# Running Tests & Generating Coverage (LCOV) for Sonar

Steps to run tests locally and generate LCOV report used by SonarQube/SonarCloud:

1. Install dependencies:

   npm install

2. Run unit tests and generate LCOV:

   npm run test:cov:lcov

   The LCOV file will be generated at `coverage/lcov.info` (configured in `jest`/`package.json`).

3. Run Sonar Scanner in CI or locally (requires sonar-scanner CLI or CI integration):

   npm run sonar:scan

Notes:
- If `jest` is not recognized locally, ensure Node and npm are installed in your environment and `npm install` has been executed.
- The project includes a `sonar-project.properties` with basic configuration; update `sonar.host.url` and `sonar.login` in your CI environment.

CI (GitHub Actions):

- A basic CI workflow is available at `.github/workflows/ci.yml` that runs `npm ci`, executes tests with coverage, uploads `coverage/lcov.info` as an artifact and conditionally runs Sonar Scanner when `SONAR_TOKEN` is set in repository secrets.
- To enable Sonar analysis in GitHub Actions, add `SONAR_TOKEN` (and optionally `SONAR_HOST_URL`) to your repository secrets.
 - To enable Sonar analysis in GitHub Actions using SonarCloud action, add these repository secrets:
    - **SONAR_TOKEN**: your Sonar token
    - **SONAR_ORGANIZATION**: your SonarCloud organization key (e.g., my-org)
    - **SONAR_PROJECT_KEY**: (optional) a project key if you need to override the default from `sonar-project.properties`
 - The CI workflow will run the SonarCloud action only when `SONAR_TOKEN` is set; the action picks up `coverage/lcov.info` via `sonar.typescript.lcov.reportPaths` in `sonar-project.properties`.
