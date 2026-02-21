# AGENTS.md

Agent instructions for the Xertra monorepo — a DEX/AMM on Stratis EVM, forked from PancakeSwap v1.

## Repository Structure

Yarn 1.x workspaces monorepo. Node 20.

```
xertra/
├── interface/             # @xertra/interface — React swap UI (CRA + TypeScript)
├── packages/
│   ├── xertra-sdk/        # @xertra/sdk — Chain config, entities (pre-built, no src)
│   └── xertra-uikit/      # @xertra/uikit — UI component library (forked PancakeSwap toolkit)
└── stratisswap/           # (gitignored) Uniswap SDK references, not used
```

## Build / Dev / Lint / Test Commands

All commands from repo root unless noted.

```bash
yarn install                  # Install all workspaces
yarn dev                      # Start dev server (delegates to interface)
yarn build                    # Production build
yarn lint                     # ESLint across interface
yarn test                     # Unit tests (interface, jest + jsdom)

# Node 17+ compatibility flags (often needed):
NODE_OPTIONS=--openssl-legacy-provider yarn dev
TSC_COMPILE_ON_ERROR=true yarn build

# Run a single test file:
yarn workspace @xertra/interface test --watchAll=false --testPathPattern="utils/prices"

# Run tests matching a describe/test name:
yarn workspace @xertra/interface test --watchAll=false -t "swap state"

# UIKit tests:
yarn workspace @xertra/uikit test
yarn workspace @xertra/uikit test --testPathPattern="button"

# Lint with autofix:
yarn workspace @xertra/interface lint:fix

# UIKit build (after modifying uikit source):
yarn workspace @xertra/uikit build

# Cypress integration tests (requires build first):
yarn workspace @xertra/interface integration-test

# Deploy:
wrangler pages deploy interface/build --project-name=xertraswap
```

## Stratis EVM Chain Info

| Network | Chain ID | RPC |
|---------|----------|-----|
| Mainnet | 105105   | https://rpc.stratisevm.com |
| Testnet (Auroria) | 205205 | https://auroria.rpc.stratisevm.com |

Native token: STRAX. Wrapped: WSTRAX. Subgraph: `http://138.201.91.50:8000/subgraphs/name/ianlapham/uniswap-v3`

## Code Style

### Formatting (Prettier)

- **No semicolons** in `interface/` (UIKit uses semicolons — separate fork convention)
- **Single quotes** in `interface/` (UIKit uses double quotes)
- **Print width:** 120 characters
- **Indentation:** 2 spaces
- Husky pre-commit runs `yarn format` automatically

### Imports

Absolute imports via `tsconfig.json` `baseUrl: "src"` — never use `../../` chains from interface source:

```ts
import { useActiveWeb3React } from 'hooks'         // absolute from src/
import { INITIAL_ALLOWED_SLIPPAGE } from 'constants'
import AppBody from '../AppBody'                    // relative only for siblings
```

**Order:** external packages → workspace packages (`@xertra/sdk`, `@xertra/uikit`) → absolute internal → relative.

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Component files | PascalCase dir + `index.tsx` | `pages/Swap/index.tsx` |
| Hook files | camelCase with `use` prefix | `useSwapCallback.ts` |
| Utility files | camelCase | `prices.ts`, `chunkArray.ts` |
| State modules | Feature dirs with `actions.ts`, `reducer.ts`, `hooks.ts` | `state/swap/` |
| Styled files | `styleds.tsx` (plural) | `components/swap/styleds.tsx` |
| Components | PascalCase | `ConfirmSwapModal` |
| Hooks/functions | camelCase | `useApproveCallback` |
| Constants | UPPER_SNAKE_CASE | `INITIAL_ALLOWED_SLIPPAGE` |
| Enums | PascalCase name, UPPER_SNAKE members | `enum Field { INPUT, OUTPUT }` |
| Interfaces | PascalCase | `SwapState`, `ModalProps` |

### Types

- Use `interface` for object shapes, `type` for unions and aliases
- `as const` on config/constant objects
- `readonly` on Redux state interface fields
- `React.FC<Props>` for component typing
- Explicit return types on exported hooks and utilities; infer locals
- `noImplicitAny: false` is set — `any` is tolerated but minimize usage

```ts
// interface for shapes
export interface SwapState {
  readonly independentField: Field
  readonly typedValue: string
}

// type for unions
type EstimatedSwapCall = SuccessfulCall | FailedCall

// as const for configs
export const CHAIN_IDS = { MAINNET: 105105, TESTNET: 205205 } as const
```

### Functions

- **Arrow functions** for React components
- **`function` declarations** for exported hooks and utility functions
- Callbacks inside components use `useCallback` with arrow syntax

```ts
// Component — arrow
const Swap = () => { ... }

// Hook — function declaration
export function useApproveCallback(...): [ApprovalState, () => Promise<void>] { ... }
```

### Exports

- **Default exports** for page components, reducers, providers
- **Named exports** for hooks, utilities, types, constants, actions
- Barrel `index.ts` files re-export from component directories

### Error Handling

- **Promise `.then/.catch` chains** are the dominant pattern (not async/await try/catch)
- **Early return guards** with `console.error` for null/undefined checks
- `console.log` is warned by ESLint — use `console.error`, `console.warn`, or `console.info`
- Check `error?.code === 4001` for user-rejected transactions
- Custom error classes in `utils/retry.ts`: `CancelledError`, `RetryableError`

```ts
tokenContract.approve(spender, amount)
  .then((response: TransactionResponse) => {
    addTransaction(response, { summary: '...' })
  })
  .catch((error: Error) => {
    console.error('Failed to approve token', error)
  })
```

### State Management

Redux Toolkit with feature-based organization. Each feature in `state/<name>/` has:
- `actions.ts` — `createAction` definitions
- `reducer.ts` — `createReducer` with builder pattern
- `hooks.ts` — typed selectors and dispatch hooks

### Styling

`styled-components` throughout. Theme via `ThemeProvider`. Access with `${({ theme }) => theme.colors.primary}`.

Design tokens: primary `#7168C0`, bg `#101112`, card `#1A1C1D`, font Inter, border-radius 8px.

## Testing Conventions

- Test files: `*.test.ts` / `*.test.tsx`
- Interface tests co-located with source; UIKit tests in `src/__tests__/`
- Use `describe`/`it` or `describe`/`test` (both acceptable)
- Assertions: `expect().toEqual()` for deep equality, `expect().toBe()` for strict
- UIKit uses `renderWithTheme` helper and inline snapshots
- Cypress E2E tests in `interface/cypress/integration/*.test.ts`

## Commit Conventions

Conventional Commits enforced by commitlint: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `style:`, `perf:`, `ci:`, `build:`, `revert:`. Sentence-case subjects.

## Key Files Reference

- Token list: `interface/src/constants/token/xertra.json`
- Chain config: `interface/src/config/chains.ts`
- Wallet connectors: `interface/src/connectors/index.ts`
- Theme: `interface/src/theme/xertraTheme.ts`, `interface/src/theme/xertra-design-tokens.ts`
- Token logos: `interface/public/images/coins/` (256x256 PNG)
- Bridge info: `interface/src/pages/Pools/index.tsx` → `BRIDGE_INFO` constant

## MCP Servers

Playwright MCP is configured in `opencode.json` for browser automation. Use `playwright` tools to navigate pages, click elements, fill forms, and take snapshots via accessibility tree (no screenshots needed). Useful for verifying the running dev server UI.
