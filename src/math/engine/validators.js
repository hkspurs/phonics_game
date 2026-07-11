/**
 * Validates a generated math question to ensure it meets all constraints.
 * Returns { valid: true } or { valid: false, reason: '...' }.
 *
 * @param {object} question - The question object to validate
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateMathQuestion(question) {
  // Basic structural checks
  if (!question || typeof question !== 'object') {
    return { valid: false, reason: 'Question is not an object' };
  }

  if (question.id === undefined || question.id === null) {
    return { valid: false, reason: 'Missing id' };
  }

  if (!question.skillId) {
    return { valid: false, reason: 'Missing skillId' };
  }

  if (!question.type) {
    return { valid: false, reason: 'Missing type' };
  }

  if (question.answer === undefined || question.answer === null) {
    return { valid: false, reason: 'Missing answer' };
  }

  // Choices validation (skip for ordering which uses array answer)
  if (question.type !== 'ordering') {
    if (!Array.isArray(question.choices)) {
      return { valid: false, reason: 'choices is not an array' };
    }

    // Check that choices contains the answer
    const answerStr = JSON.stringify(question.answer);
    const hasAnswer = question.choices.some(c => JSON.stringify(c) === answerStr);
    if (!hasAnswer) {
      return { valid: false, reason: 'choices does not contain the answer' };
    }
  }

  // Values validation
  if (!question.values || typeof question.values !== 'object') {
    return { valid: false, reason: 'values is not an object' };
  }

  // Type-specific validation
  switch (question.skillId) {
    case 'addition_within_10':
      return validateAddition(question);
    case 'subtraction_within_10':
      return validateSubtraction(question);
    case 'number_bonds_to_10':
      return validateNumberBonds(question);
    case 'number_counting_1_20':
      return validateCounting(question);
    case 'number_ordering_1_20':
      return validateOrdering(question);
    case 'compare_quantity_1_20':
      return validateComparison(question);
    case 'ordinal_position_1_10':
      return validateOrdinal(question);
    case 'shape_and_pattern_basics':
      return validatePattern(question);
    default:
      return { valid: true };
  }
}

function validateAddition(q) {
  const { a, b, result } = q.values;
  if (a === undefined || b === undefined || result === undefined) {
    return { valid: false, reason: 'Addition missing values (a, b, result)' };
  }
  if (a < 0) {
    return { valid: false, reason: `Addition: a (${a}) must be >= 0` };
  }
  if (b < 0) {
    return { valid: false, reason: `Addition: b (${b}) must be >= 0` };
  }
  if (a + b !== result) {
    return { valid: false, reason: `Addition: ${a} + ${b} !== ${result}` };
  }
  if (result > 10) {
    return { valid: false, reason: `Addition: result (${result}) exceeds 10` };
  }
  return { valid: true };
}

function validateSubtraction(q) {
  const { a, b, result } = q.values;
  if (a === undefined || b === undefined || result === undefined) {
    return { valid: false, reason: 'Subtraction missing values (a, b, result)' };
  }
  if (a > 10) {
    return { valid: false, reason: `Subtraction: a (${a}) exceeds 10` };
  }
  if (result < 0) {
    return { valid: false, reason: `Subtraction: result (${result}) is negative` };
  }
  if (a - b !== result) {
    return { valid: false, reason: `Subtraction: ${a} - ${b} !== ${result}` };
  }
  return { valid: true };
}

function validateNumberBonds(q) {
  const { target, givenPart, missingPart } = q.values;
  if (target === undefined || givenPart === undefined || missingPart === undefined) {
    return { valid: false, reason: 'Number bonds missing values (target, givenPart, missingPart)' };
  }
  if (givenPart < 0) {
    return { valid: false, reason: `Number bonds: givenPart (${givenPart}) is negative` };
  }
  if (missingPart < 0) {
    return { valid: false, reason: `Number bonds: missingPart (${missingPart}) is negative` };
  }
  if (givenPart + missingPart !== target) {
    return { valid: false, reason: `Number bonds: ${givenPart} + ${missingPart} !== ${target}` };
  }
  return { valid: true };
}

function validateCounting(q) {
  const { count } = q.values;
  if (count === undefined) {
    return { valid: false, reason: 'Counting missing count value' };
  }
  if (count < 1 || count > 20) {
    return { valid: false, reason: `Counting: count (${count}) out of range 1-20` };
  }
  return { valid: true };
}

function validateOrdering(q) {
  const { items } = q.values;
  if (!Array.isArray(items)) {
    return { valid: false, reason: 'Ordering: items is not an array' };
  }
  if (items.length < 3 || items.length > 6) {
    return { valid: false, reason: `Ordering: item count (${items.length}) must be 3-6` };
  }
  const unique = new Set(items);
  if (unique.size !== items.length) {
    return { valid: false, reason: 'Ordering: values are not unique' };
  }
  return { valid: true };
}

function validateComparison(q) {
  const { a, b } = q.values;
  if (a === undefined || b === undefined) {
    return { valid: false, reason: 'Comparison missing values (a, b)' };
  }
  if (typeof a !== 'number' || typeof b !== 'number') {
    return { valid: false, reason: 'Comparison: a and b must be numbers' };
  }
  return { valid: true };
}

function validateOrdinal(q) {
  const { position, queueSize } = q.values;
  if (position === undefined || queueSize === undefined) {
    return { valid: false, reason: 'Ordinal missing values (position, queueSize)' };
  }
  if (position < 1 || position > queueSize) {
    return { valid: false, reason: `Ordinal: position (${position}) out of range 1-${queueSize}` };
  }
  return { valid: true };
}

function validatePattern(q) {
  const { template } = q.values;
  if (!template) {
    return { valid: false, reason: 'Pattern: missing template' };
  }
  const validTemplates = ['AB', 'AAB', 'ABB', 'ABC'];
  if (!validTemplates.includes(template)) {
    return { valid: false, reason: `Pattern: invalid template '${template}'` };
  }
  return { valid: true };
}
