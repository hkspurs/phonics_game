import { DataManager } from '../services/DataManager';
import { addText, makeElement, type ScreenHandle } from './responsive';

export interface DiagnosticReportActions { close(): void; review(): void; }

export function mountDiagnosticReportView(host: HTMLElement, actions: DiagnosticReportActions): ScreenHandle {
  const summary = DataManager.getInstance().getDiagnosticSummary(); const priorFocus = document.activeElement as HTMLElement | null;
  const backdrop = makeElement('div', 'dialog-backdrop report-backdrop'); const dialog = makeElement('section', 'support-dialog report-dialog'); dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); dialog.setAttribute('aria-labelledby', 'report-title');
  const heading = makeElement('div', 'report-dialog-head');
  addText(heading, 'h1', '學習報告').id = 'report-title';
  const topClose = makeElement('button', 'dialog-cancel'); topClose.type = 'button'; topClose.textContent = '關閉報告';
  heading.append(topClose); dialog.append(heading);
  if (summary.totalAttempts === 0) addText(dialog, 'p', '未有練習紀錄。完成第一題後，這裡會顯示學習進度。', 'empty-report');
  else { const metrics = makeElement('dl', 'report-metrics'); const metric = (term: string, value: string) => { addText(metrics, 'dt', term); addText(metrics, 'dd', value); }; metric('首次答對率', `${Math.round(summary.firstAttemptAccuracyRate * 100)}%`); metric('最終完成率', `${Math.round(summary.eventualCompletionRate * 100)}%`); metric('已完成題目', `${summary.totalQuestionsCompleted} 題`); metric('提示使用', `${summary.totalHintsUsed} 次`); dialog.append(metrics); addText(dialog, 'p', '首次答對率只計第一次作答；最終完成率計算經過再試後完成的題目。', 'support-help'); }
  const subjects = makeElement('div', 'report-subjects'); ([['中文', summary.subjectBreakdown.chinese], ['數學', summary.subjectBreakdown.math], ['英語', summary.subjectBreakdown.english]] as const).forEach(([name, stats]) => { const section = makeElement('section', 'report-subject'); addText(section, 'h2', name); addText(section, 'p', stats.totalAttempts ? `首次答對率 ${Math.round(stats.firstAttemptAccuracy * 100)}%` : '未有練習紀錄'); addText(section, 'p', stats.totalAttempts ? `完成 ${stats.completed} 題 · 作答 ${stats.totalAttempts} 次` : '完成 0 題 · 作答 0 次'); subjects.append(section); }); dialog.append(subjects);
  const actionsRow = makeElement('div', 'dialog-actions'); const review = makeElement('button', 'story-button story-button-primary'); review.type = 'button'; review.textContent = summary.mistakeQueue.length ? `溫習錯題（${summary.mistakeQueue.length}）` : '目前沒有錯題'; review.disabled = summary.mistakeQueue.length === 0; review.addEventListener('click', actions.review); actionsRow.append(review); dialog.append(actionsRow); backdrop.append(dialog); host.append(backdrop);
  const finish = () => { document.removeEventListener('keydown', onKey); backdrop.remove(); actions.close(); priorFocus?.focus(); }; const focusables = () => Array.from(dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')); const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') finish(); if (event.key === 'Tab') { const items = focusables(); if (!items.length) return; const index = items.indexOf(document.activeElement as HTMLButtonElement); event.preventDefault(); items[(index + (event.shiftKey ? -1 : 1) + items.length) % items.length].focus(); } }; topClose.addEventListener('click', finish); backdrop.addEventListener('click', (event) => { if (event.target === backdrop) finish(); }); document.addEventListener('keydown', onKey); topClose.focus(); return { destroy: () => { document.removeEventListener('keydown', onKey); backdrop.remove(); } };
}
