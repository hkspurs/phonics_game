import type { QuizQuestion } from '../types';
import { addText, makeElement, type ScreenHandle } from './responsive';

export interface QuestionViewScene {
  currentQuestion: QuizQuestion | null;
  lastFeedbackMessage?: string;
  stationName: string;
  questionIndex: number;
  questions: QuizQuestion[];
  isAnswered: boolean;
  choiceCards: Array<{ getValue(): unknown }>;
  cardChips: Array<{ getValue(): unknown; getCurrentSlot(): unknown }>;
  slotBoxes: Array<{ hasCard(): boolean; getPlacedCard?(): any }>;
  handleChoiceValue(value: unknown): boolean;
  handleCardTap(card: any): void;
  handleSlotCardRemoval(slot: any): void;
  speakCurrentQuestion(): void;
  handleHint(): void;
  handleReset(): void;
  continueButton: { triggerClick(): void } | null;
  backButton: { triggerClick(): void } | null;
}

function choiceText(value: unknown): string {
  return typeof value === 'number' ? String(value) : String(value ?? '');
}

export function mountQuestionView(host: HTMLElement, scene: QuestionViewScene): ScreenHandle {
  const question = scene.currentQuestion;
  if (!question) return { destroy: () => undefined };
  const shell = makeElement('section', 'screen-view question-view');
  shell.setAttribute('aria-labelledby', 'question-title');
  const top = makeElement('div', 'question-topbar');
  const back = makeElement('button', 'question-back'); back.type = 'button'; back.textContent = '‹ 地圖'; back.addEventListener('click', () => scene.backButton?.triggerClick()); top.append(back);
  const heading = makeElement('div', 'question-heading'); addText(heading, 'span', `第 ${scene.questionIndex + 1} / ${Math.max(1, scene.questions.length)} 題`, 'question-progress'); addText(heading, 'h1', `${scene.stationName} · ${question.subject === 'math' ? '數學' : question.subject === 'english' ? '英語' : '中文'}`, 'question-title').id = 'question-title'; top.append(heading);
  shell.append(top);
  const card = makeElement('div', 'question-card');
  const promptRow = makeElement('div', 'question-prompt-row');
  addText(promptRow, 'p', question.prompt || '請完成以下小挑戰。', 'question-prompt');
  const listen = makeElement('button', 'question-listen'); listen.type = 'button'; listen.textContent = '聽一次'; listen.addEventListener('click', () => scene.speakCurrentQuestion()); promptRow.append(listen); card.append(promptRow);
  const feedback = makeElement('p', 'question-feedback'); feedback.setAttribute('aria-live', 'polite'); card.append(feedback);
  const answerArea = makeElement('div', 'question-answer-area');
  let refreshAnswerView: (() => void) | undefined;
  let resetControl: HTMLButtonElement | null = null;
  const syncFeedback = (correct: boolean): void => {
    feedback.className = `question-feedback ${correct ? 'is-correct' : 'is-hint'}`;
    feedback.textContent = scene.lastFeedbackMessage || (correct ? '答啱啦！聽埋解釋，再撳繼續。' : '再諗吓，睇清楚題目再試一次。');
  };
  if (question.type === 'sentence_scramble') {
    const slots = makeElement('div', 'dom-answer-slots');
    const bank = makeElement('div', 'dom-token-bank');
    type Placement = { value: unknown; slot: QuestionViewScene['slotBoxes'][number] };
    const readPlacements = (): Placement[] => scene.slotBoxes.flatMap((slot) => {
      if (!slot.hasCard()) return [];
      const card = slot.getPlacedCard?.();
      const value = card?.getValue?.() ?? card?.getText?.() ?? '';
      return [{ value, slot }];
    });
    const renderTokens = (): void => {
      slots.replaceChildren(); bank.replaceChildren();
      const placements = readPlacements();
      placements.forEach(({ value, slot }, index) => { const button = makeElement('button', 'answer-token placed-token'); button.type = 'button'; button.textContent = choiceText(value); button.setAttribute('aria-label', `移除第 ${index + 1} 個字詞`); button.addEventListener('click', () => { scene.handleSlotCardRemoval(slot); renderTokens(); }); slots.append(button); });
      const values = question.shuffledTokens?.length ? question.shuffledTokens : question.correctTokens ?? [];
      const placedValues = placements.map(({ value }) => value);
      values.forEach((value) => { if (placedValues.filter((item) => item === value).length >= values.filter((item) => item === value).length) return; const button = makeElement('button', 'answer-token bank-token'); button.type = 'button'; button.textContent = choiceText(value); button.addEventListener('click', () => { if (scene.isAnswered) return; const chip = scene.cardChips.find((candidate) => candidate.getValue() === value && candidate.getCurrentSlot() === null); if (!chip) return; scene.handleCardTap(chip); renderTokens(); if (scene.isAnswered) { syncFeedback(true); showContinue(); } else if (scene.slotBoxes.length > 0 && scene.slotBoxes.every((slot) => slot.hasCard())) { syncFeedback(false); } }); bank.append(button); });
    };
    refreshAnswerView = renderTokens;
    addText(answerArea, 'h2', '將字詞排成一句句子', 'answer-label'); answerArea.append(slots, bank); renderTokens();
  } else {
    addText(answerArea, 'h2', '揀一個答案', 'answer-label');
    const options = makeElement('div', 'choice-grid');
    (question.options ?? []).forEach((value) => { const button = makeElement('button', 'answer-choice'); button.type = 'button'; button.textContent = choiceText(value); button.addEventListener('click', () => { if (scene.isAnswered) return; const correct = scene.handleChoiceValue(value); button.disabled = true; syncFeedback(correct); if (correct) { options.querySelectorAll('button').forEach((candidate) => { (candidate as HTMLButtonElement).disabled = true; }); showContinue(); } }); options.append(button); }); answerArea.append(options);
  }
  card.append(answerArea);
  const actions = makeElement('div', 'question-actions');
  const hint = makeElement('button', 'question-action-button'); hint.type = 'button'; hint.textContent = '提示'; hint.addEventListener('click', () => { scene.handleHint(); refreshAnswerView?.(); if (scene.lastFeedbackMessage) { feedback.className = `question-feedback ${scene.isAnswered ? 'is-correct' : 'is-hint'}`; feedback.textContent = scene.lastFeedbackMessage; } if (scene.isAnswered) showContinue(); }); actions.append(hint);
  if (question.type === 'sentence_scramble') { resetControl = makeElement('button', 'question-action-button') as HTMLButtonElement; resetControl.type = 'button'; resetControl.textContent = '重新來過'; resetControl.addEventListener('click', () => { scene.handleReset(); refreshAnswerView?.(); }); actions.append(resetControl); }
  const continueBtn = makeElement('button', 'story-button story-button-primary question-continue'); continueBtn.type = 'button'; continueBtn.textContent = '繼續前進'; continueBtn.hidden = true; continueBtn.addEventListener('click', () => scene.continueButton?.triggerClick()); actions.append(continueBtn);
  const showContinue = (): void => { continueBtn.hidden = false; hint.hidden = true; if (resetControl) resetControl.hidden = true; };
  card.append(actions); shell.append(card); host.append(shell); back.focus({ preventScroll: true });
  return { destroy: () => shell.remove() };
}
