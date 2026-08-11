import React from 'react';

export default function WorldProgress({ steps = [], activeStep = 0, label = 'World progress' }) {
  return (
    <div className="world-progress" data-testid="world-progress">
      <div className="world-progress__track" role="list" aria-label={label}>
        {steps.map((step, index) => {
          const name = typeof step === 'string' ? step : step.label;
          const isActive = index === activeStep;
          const isComplete = index < activeStep;

          return (
            <React.Fragment key={name}>
              <div
                className={`world-progress__step${isActive ? ' is-active' : ''}${isComplete ? ' is-complete' : ''}`}
                role="listitem"
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="world-progress__dot" aria-hidden="true">
                  {isComplete ? '✓' : index + 1}
                </span>
                <span data-active={isActive ? 'true' : 'false'}>{name}</span>
              </div>
              {index < steps.length - 1 && <span className={`world-progress__line${index < activeStep ? ' is-complete' : ''}`} aria-hidden="true" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
