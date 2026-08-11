# Four-Level Blending Practice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four independently selectable 16-question `Learn to Blend` levels while preserving the standalone Simple Word test and existing game systems.

**Architecture:** Keep the current `SimpleWords` screen as the single owner of level selection, the selected 16-word queue, answer state, audio, and completion state. Reuse the current shuffled CVC queue, tile UI, `VirtualKeyboard`, audio engine, feedback, and route; add only small pure level helpers and translations where they remove branching ambiguity.

**Tech Stack:** React 18, React Router 6, Vitest, Testing Library, existing vanilla CSS and Zustand store.

## Global Constraints

- Each level uses the same 16 CVC words and an independently shuffled order.
- The child chooses the level; completing one level never starts another automatically.
- Level 1 uses shuffled letter tiles; levels 2–4 use the existing A–Z keyboard.
- Level 2 accepts only the first letter with the final two letters shown.
- Level 3 accepts only the first two letters with the final letter shown.
- Level 4 accepts all three letters.
- Wrong answers remain on the same question and do not reveal the answer.
- Do not add dependencies, persistent level state, audio assets, or changes to the AEIOU, math, reward, or parent systems.

---

### Task 1: Add level definitions and answer mapping

**Files:**
- Modify: `src/game/simpleWordLearning.js`
- Modify: `src/game/simpleWordLearning.test.js`

**Interfaces:**
- Produces `BLENDING_LEVELS`, an array of four `{ id, titleKey, descriptionKey }` records used by the level picker.
- Produces `getLearningInputLength(level)`, returning `0`, `1`, `2`, or `3` for levels 1–4.
- Produces `getLearningTarget(wordOrItem, level)`, returning the editable answer (`null` for level 1, the first one/two/all three letters for levels 2/3/4).

- [ ] **Step 1: Write the failing tests**

Add these imports and tests to `src/game/simpleWordLearning.test.js`:

```js
import {
  BLENDING_LEVELS,
  getLearningInputLength,
  getLearningTarget,
  buildBlendingSession,
  buildBlendingTestSession,
  shuffleWordLetters,
} from './simpleWordLearning';

it('defines four selectable blending levels', () => {
  expect(BLENDING_LEVELS).toHaveLength(4);
  expect(BLENDING_LEVELS.map((level) => level.id)).toEqual([1, 2, 3, 4]);
});

it('maps each level to the letters the child must enter', () => {
  expect([1, 2, 3, 4].map(getLearningInputLength)).toEqual([0, 1, 2, 3]);
  expect(getLearningTarget('CAT', 1)).toBeNull();
  expect(getLearningTarget('CAT', 2)).toBe('C');
  expect(getLearningTarget('CAT', 3)).toBe('CA');
  expect(getLearningTarget('CAT', 4)).toBe('CAT');
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npm test -- src/game/simpleWordLearning.test.js
```

Expected: FAIL because the new exports do not exist yet.

- [ ] **Step 3: Implement the minimum pure helpers**

Add the four records and helpers to `src/game/simpleWordLearning.js`:

```js
export const BLENDING_LEVELS = [
  { id: 1, titleKey: 'blendingLevelOne', descriptionKey: 'blendingLevelOneDescription' },
  { id: 2, titleKey: 'blendingLevelTwo', descriptionKey: 'blendingLevelTwoDescription' },
  { id: 3, titleKey: 'blendingLevelThree', descriptionKey: 'blendingLevelThreeDescription' },
  { id: 4, titleKey: 'blendingLevelFour', descriptionKey: 'blendingLevelFourDescription' },
];

export function getLearningInputLength(level) {
  return level === 1 ? 0 : level === 4 ? 3 : level - 1;
}

export function getLearningTarget(wordOrItem, level) {
  const word = getWordValue(wordOrItem);
  const length = getLearningInputLength(level);
  return length ? word.slice(0, length) : null;
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
npm test -- src/game/simpleWordLearning.test.js
```

Expected: PASS, including the existing blending curriculum tests.

- [ ] **Step 5: Commit the level model**

```bash
git add src/game/simpleWordLearning.js src/game/simpleWordLearning.test.js
git commit -m "feat: define blending practice levels"
```

### Task 2: Implement the independently selectable four-level screen

**Files:**
- Modify: `src/screens/SimpleWords.jsx`
- Modify: `src/screens/SimpleWords.test.jsx`

**Interfaces:**
- Consumes `BLENDING_LEVELS`, `getLearningInputLength`, and `getLearningTarget` from Task 1.
- The `mode=learn` route first renders the level picker; choosing `{ id: 1 | 2 | 3 | 4 }` starts one 16-question session.
- The existing route without `mode=learn` keeps the current standalone A–Z spelling behavior.

- [ ] **Step 1: Replace old learn-flow expectations with failing tests**

Keep the existing standalone spelling tests. Replace the tests that expect automatic tile-learning followed by `Test Your Blending` with tests for the new behavior. Add these helpers near the existing test helpers:

```jsx
function startLearningLevel(level) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`Level ${level}`) }));
}

async function completeCurrentTileQuestion() {
  await settleLearningAudio();
  const word = screen.getByTestId('learning-word').getAttribute('data-word');
  for (const letter of word) {
    fireEvent.click(screen.getAllByTestId('learning-letter').find((tile) => (
      tile.getAttribute('data-letter') === letter && !tile.disabled
    )));
  }
  expect(screen.getByText('Great blending!')).toBeInTheDocument();
  return word;
}
```

Add tests covering the required behavior:

```jsx
it('shows four levels before a learn session starts', () => {
  render(<MemoryRouter initialEntries={['/simple-words?mode=learn']}><SimpleWords /></MemoryRouter>);
  expect(screen.getAllByRole('button', { name: /Level [1-4]/ })).toHaveLength(4);
  expect(screen.queryByText('1 / 16')).not.toBeInTheDocument();
});

it('keeps level one independent after all 16 questions', async () => {
  render(<MemoryRouter initialEntries={['/simple-words?mode=learn']}><SimpleWords /></MemoryRouter>);
  startLearningLevel(1);
  for (let index = 0; index < 16; index += 1) {
    await completeCurrentTileQuestion();
    fireEvent.click(screen.getByRole('button', { name: index === 15 ? /Finish level/i : /Next word/i }));
  }
  expect(screen.getByRole('heading', { name: /Level complete/i })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Test Your Blending' })).not.toBeInTheDocument();
});

it('lets level two choose only the first letter from A-Z', async () => {
  render(<MemoryRouter initialEntries={['/simple-words?mode=learn']}><SimpleWords /></MemoryRouter>);
  startLearningLevel(2);
  await settleLearningAudio();
  const word = screen.getByTestId('learning-word').getAttribute('data-word');
  expect(screen.getByTestId('learning-slot-1')).toHaveTextContent(word[1]);
  expect(screen.getByTestId('learning-slot-2')).toHaveTextContent(word[2]);
  expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: word[0] }));
  expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
});

it('lets level three choose the first two letters and level four choose all three', async () => {
  render(<MemoryRouter initialEntries={['/simple-words?mode=learn']}><SimpleWords /></MemoryRouter>);
  startLearningLevel(3);
  await settleLearningAudio();
  let word = screen.getByTestId('learning-word').getAttribute('data-word');
  fireEvent.click(screen.getByRole('button', { name: word[0] }));
  fireEvent.click(screen.getByRole('button', { name: word[1] }));
  expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();

  fireEvent.click(screen.getByRole('button', { name: 'Back to levels' }));
  startLearningLevel(4);
  await settleLearningAudio();
  word = screen.getByTestId('learning-word').getAttribute('data-word');
  for (const letter of word) fireEvent.click(screen.getByRole('button', { name: letter }));
  expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
});
```

Also update the existing learning wrong-order test to call `startLearningLevel(1)`, and replace the old automatic learning-to-test assertion with the independent-level assertions above.

- [ ] **Step 2: Run the focused component tests and verify they fail**

Run:

```bash
npm test -- src/screens/SimpleWords.test.jsx
```

Expected: FAIL because `mode=learn` still starts the old tile session and has no level picker or levels 2–4.

- [ ] **Step 3: Add level selection and independent session state**

In `SimpleWords.jsx`:

- Import `BLENDING_LEVELS`, `getLearningInputLength`, and `getLearningTarget`.
- Force `sessionSize` to 16 when `learningMode` is true; leave the standalone adventure test's query-controlled size unchanged.
- Add `learningLevel` initialized to `null` and `learningLevelComplete` initialized to `false`.
- Render the picker when `learningMode && !learningLevel`, with one button per `BLENDING_LEVELS` record and a back button to `backDestination`.
- Add `startLearningLevel(level)` that stops audio, rebuilds the learning queue from the current store stats, resets index, typed input, feedback, timers, and completion state, then sets the selected level.
- In an active learn level, make the header action return to the level picker; keep the picker’s own back action for leaving to `backDestination`.
- Change the learning queue to contain only the 16 learning words; do not transition to the old test queue after question 16.
- Make the current-word audio effect wait until a learning level has been selected, so the picker does not autoplay a hidden question.

- [ ] **Step 4: Add the four answer behaviors with the existing controls**

Use the selected level's input length and target:

```js
const learningInputLength = learningLevel ? getLearningInputLength(learningLevel) : 0;
const learningTarget = learningLevel ? getLearningTarget(current, learningLevel) : null;
const isLearningKeyboardLevel = learningMode && stage === 'learn' && learningLevel > 1;
```

- Keep `handleLearningTile` for level 1.
- Let `handleKey` accept keyboard input for `stage === 'test'` or `isLearningKeyboardLevel`, limiting learn input to `learningInputLength` and test input to three letters.
- Let `handleSubmit` validate `learningTarget` for levels 2–4 and keep its existing full-word validation, stats, hints, and rewards for the standalone test route.
- For a correct learn answer, show existing positive feedback and enable the same `Next word`/`Finish level` control; never start the next level automatically.
- For a wrong learn answer, clear only `typed`, show existing retry feedback, and keep the same question.
- Change the final learning-question action from `Start test` to `Finish level`, setting `learningLevelComplete` instead of `stage='test'`.
- Render level 2 as `_ A T`, level 3 as `_ _ T`, and level 4 as `_ _ _`, with editable letters in the typed slots and fixed clue letters in their correct slots.
- Render `VirtualKeyboard` only for levels 2–4 in the learning view; keep the standalone test rendering unchanged.
- Add the learning-level completion view with `Play Again` and `Back to levels` actions; its heading uses the translated generic `Level complete!` copy.

- [ ] **Step 5: Run the focused component tests and verify they pass**

Run:

```bash
npm test -- src/screens/SimpleWords.test.jsx
```

Expected: PASS for the updated level-picker, level-one, level-two, level-three, level-four, retry, and standalone spelling tests.

- [ ] **Step 6: Commit the screen behavior**

```bash
git add src/screens/SimpleWords.jsx src/screens/SimpleWords.test.jsx
git commit -m "feat: add independent blending practice levels"
```

### Task 3: Update translations and adventure integration

**Files:**
- Modify: `src/i18n/translations.js`
- Modify: `src/screens/SimpleWordsAdventure.test.jsx`
- Modify: `src/screens/BlendingHub.test.jsx`
- Modify: `src/screens/BlendingHub.jsx` only if the current link/copy needs the 16-question default made explicit.

**Interfaces:**
- Supplies Chinese and English labels for the four level buttons, descriptions, level completion, level selector return, and finish action.
- Keeps `/simple-words?mode=learn&adventure=1` reachable and reports a 16-question adventure session.

- [ ] **Step 1: Write the failing copy/integration assertions**

Update `src/screens/SimpleWordsAdventure.test.jsx` to select level one after rendering and expect `1 / 16` plus an adventure mock of `0/16`:

```jsx
fireEvent.click(screen.getByRole('button', { name: /Level 1/i }));
await act(async () => { await Promise.resolve(); });
expect(screen.getByText('1 / 16')).toBeInTheDocument();
expect(screen.getByTestId('adventure-world')).toHaveTextContent('0/16');
```

Update the Blending Hub assertion to expect `16 words` in English and keep the existing route-opening assertion.

- [ ] **Step 2: Run the focused integration tests and verify they fail**

Run:

```bash
npm test -- src/screens/SimpleWordsAdventure.test.jsx src/screens/BlendingHub.test.jsx
```

Expected: FAIL because the old copy says five words and the adventure session defaults to five.

- [ ] **Step 3: Add the bilingual copy and 16-question integration**

Add these translation keys in both language blocks:

```js
blendingLevelPicker: '揀一個學習關卡',
blendingLevelOne: '第一關：三粒字母',
blendingLevelOneDescription: '由三粒字母揀出正確次序',
blendingLevelTwo: '第二關：揀第一粒',
blendingLevelTwoDescription: '睇住後兩粒，由 A–Z 揀第一粒',
blendingLevelThree: '第三關：揀頭兩粒',
blendingLevelThreeDescription: '睇住最後一粒，由 A–Z 揀頭兩粒',
blendingLevelFour: '第四關：自己輸入',
blendingLevelFourDescription: '由 A–Z 輸入完整三粒字母',
blendingLevelComplete: '呢一關完成！',
chooseLevel: '返回關卡選擇',
finishLevel: '完成關卡',
```

Use equivalent English values (`Choose a learning level`, `Level 1: Three letters`, `Choose the first letter`, `Choose the first two letters`, `Enter the whole word`, `Level complete!`, `Back to levels`, and `Finish level`). Change `wordsCount` to `16 個字` / `16 words` and update the blending intro copy so it does not promise automatic learn-then-test progression.

- [ ] **Step 4: Run the focused integration tests and verify they pass**

Run:

```bash
npm test -- src/screens/SimpleWordsAdventure.test.jsx src/screens/BlendingHub.test.jsx
```

Expected: PASS with the 16-question adventure default and bilingual copy.

- [ ] **Step 5: Commit the integration copy**

```bash
git add src/i18n/translations.js src/screens/SimpleWordsAdventure.test.jsx src/screens/BlendingHub.test.jsx src/screens/BlendingHub.jsx
git commit -m "feat: expose sixteen-question blending levels"
```

### Task 4: Full verification

**Files:** None expected.

- [ ] **Step 1: Run all unit and component tests**

```bash
npm test
```

Expected: exit code 0 with zero failed tests.

- [ ] **Step 2: Build the production bundle**

```bash
npm run build
```

Expected: exit code 0 and a generated `dist` bundle.

- [ ] **Step 3: Check the final diff and worktree**

```bash
git diff --check
git status --short --branch
```

Expected: no whitespace errors; only intentional committed changes remain. If
verification exposed a test-only correction, commit that correction with a
focused message before handing off.
