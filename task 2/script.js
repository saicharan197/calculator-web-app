/**
 * Modern Glassmorphic Calculator Engine
 * Features:
 * - Robust safe token-based math parser (Shunting-Yard + RPN, ZERO eval())
 * - Correct operator precedence (* and / before + and -)
 * - Support for chained expressions, decimals, negatives, percentages
 * - Graceful division-by-zero & error handling
 * - Floating-point precision error correction (0.1 + 0.2 = 0.3)
 * - Auto-scaling display typography & scientific notation for large numbers
 * - Full calculation history with localStorage persistence & recall
 * - Dark & Light theme switcher with persistence
 * - Copy result to clipboard with visual toast
 * - Complete keyboard support with tactile visual feedback
 */

(function () {
  'use strict';

  // --- DOM Elements ---
  const primaryDisplay = document.getElementById('primaryDisplay');
  const expressionDisplay = document.getElementById('expressionDisplay');
  const keypad = document.getElementById('keypad');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyPanel = document.getElementById('historyPanel');
  const historyList = document.getElementById('historyList');
  const historyBadge = document.getElementById('historyBadge');
  const copyResultBtn = document.getElementById('copyResultBtn');
  const shortcutsToggleBtn = document.getElementById('shortcutsToggleBtn');
  const shortcutsModal = document.getElementById('shortcutsModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  const appLayout = document.querySelector('.app-layout');

  // --- Calculator State ---
  let currentInput = '0';
  let expressionTokens = []; // Array of { type: 'num'|'op', value: string }
  let justEvaluated = false;
  let activeOperator = null;
  let calculationHistory = [];

  // --- Constants ---
  const STORAGE_KEY_HISTORY = 'calc_history_data';
  const STORAGE_KEY_THEME = 'calc_theme_preference';
  const MAX_HISTORY_ITEMS = 30;

  // ==========================================================================
  // 1. Math Parsing Engine (Shunting-Yard Algorithm + RPN Evaluator)
  // Completely safe: No eval(), No new Function()
  // ==========================================================================

  const PRECEDENCE = {
    '+': 1,
    '-': 1,
    '×': 2,
    '*': 2,
    '÷': 2,
    '/': 2
  };

  /**
   * Safe floating point arithmetic rounding
   * Prevents 0.1 + 0.2 = 0.30000000000000004
   */
  function cleanFloat(number) {
    if (isNaN(number) || !isFinite(number)) return number;
    return parseFloat(Number(number).toPrecision(12));
  }

  /**
   * Converts infix tokens into Reverse Polish Notation (Postfix)
   * using Dijkstra's Shunting-yard algorithm
   */
  function shuntingYard(tokens) {
    const outputQueue = [];
    const operatorStack = [];

    for (const token of tokens) {
      if (token.type === 'num') {
        outputQueue.push(token);
      } else if (token.type === 'op') {
        const op1 = token.value;
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1].type === 'op' &&
          PRECEDENCE[operatorStack[operatorStack.length - 1].value] >= PRECEDENCE[op1]
        ) {
          outputQueue.push(operatorStack.pop());
        }
        operatorStack.push(token);
      }
    }

    while (operatorStack.length > 0) {
      outputQueue.push(operatorStack.pop());
    }

    return outputQueue;
  }

  /**
   * Evaluates a Reverse Polish Notation token stream
   */
  function evaluateRPN(postfixTokens) {
    const stack = [];

    for (const token of postfixTokens) {
      if (token.type === 'num') {
        stack.push(parseFloat(token.value));
      } else if (token.type === 'op') {
        if (stack.length < 2) {
          throw new Error('Invalid calculation');
        }
        const b = stack.pop();
        const a = stack.pop();
        let res = 0;

        switch (token.value) {
          case '+':
            res = a + b;
            break;
          case '-':
            res = a - b;
            break;
          case '×':
          case '*':
            res = a * b;
            break;
          case '÷':
          case '/':
            if (b === 0) {
              throw new Error('Cannot divide by 0');
            }
            res = a / b;
            break;
          default:
            throw new Error('Unknown operator');
        }

        stack.push(cleanFloat(res));
      }
    }

    if (stack.length !== 1) {
      throw new Error('Invalid calculation');
    }

    return stack[0];
  }

  /**
   * Safely calculates the value of current expression tokens + input
   */
  function evaluateExpression(tokens) {
    if (!tokens || tokens.length === 0) return 0;
    const postfix = shuntingYard(tokens);
    return evaluateRPN(postfix);
  }

  // ==========================================================================
  // 2. Display Formatting & Helpers
  // ==========================================================================

  /**
   * Format numbers with localized commas and reasonable length
   */
  function formatDisplayNumber(numStr) {
    if (numStr === 'Error' || numStr === 'Cannot divide by 0') return numStr;
    if (numStr.endsWith('.')) {
      const parts = numStr.slice(0, -1).split('.');
      return Number(parts[0]).toLocaleString('en-US') + '.';
    }
    if (numStr.includes('.')) {
      const parts = numStr.split('.');
      const intPart = Number(parts[0]).toLocaleString('en-US');
      return `${intPart}.${parts[1]}`;
    }

    const val = Number(numStr);
    if (isNaN(val)) return numStr;

    // Handle scientific notation for extreme numbers
    if (Math.abs(val) >= 1e14 || (Math.abs(val) > 0 && Math.abs(val) < 1e-7)) {
      return val.toExponential(6).replace('e+', 'e');
    }

    return val.toLocaleString('en-US', { maximumFractionDigits: 10 });
  }

  /**
   * Dynamically adjust font size based on input length
   */
  function updateDisplayTypography() {
    const len = primaryDisplay.textContent.length;
    if (primaryDisplay.classList.contains('error')) {
      primaryDisplay.style.fontSize = '';
      return;
    }

    if (len > 14) {
      primaryDisplay.style.fontSize = '1.65rem';
    } else if (len > 10) {
      primaryDisplay.style.fontSize = '2.1rem';
    } else {
      primaryDisplay.style.fontSize = '2.75rem';
    }
  }

  /**
   * Render the primary and secondary displays
   */
  function renderDisplay() {
    primaryDisplay.classList.remove('error');

    // Build expression string for the secondary display
    const exprText = expressionTokens
      .map(t => (t.type === 'op' ? ` ${t.value} ` : t.value))
      .join('');

    expressionDisplay.textContent = exprText;
    primaryDisplay.textContent = formatDisplayNumber(currentInput);
    updateDisplayTypography();
    highlightActiveOperator();
  }

  function displayError(msg) {
    primaryDisplay.classList.add('error');
    primaryDisplay.textContent = msg;
    expressionDisplay.textContent = '';
    currentInput = '0';
    expressionTokens = [];
    justEvaluated = true;
    updateDisplayTypography();
    highlightActiveOperator();
  }

  function highlightActiveOperator() {
    const opButtons = document.querySelectorAll('.btn-op');
    opButtons.forEach(btn => {
      if (activeOperator && btn.getAttribute('data-op') === activeOperator) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });
  }

  // ==========================================================================
  // 3. User Actions (Number, Operator, Equals, Clear, etc.)
  // ==========================================================================

  function handleNumberInput(digit) {
    if (justEvaluated) {
      currentInput = digit;
      expressionTokens = [];
      justEvaluated = false;
    } else if (currentInput === '0') {
      currentInput = digit;
    } else {
      // Limit to 15 digits to avoid overflowing display
      if (currentInput.replace(/[-.]/g, '').length >= 15) return;
      currentInput += digit;
    }
    activeOperator = null;
    renderDisplay();
  }

  function handleDecimal() {
    if (justEvaluated) {
      currentInput = '0.';
      expressionTokens = [];
      justEvaluated = false;
    } else if (!currentInput.includes('.')) {
      currentInput += '.';
    }
    activeOperator = null;
    renderDisplay();
  }

  function handleOperator(op) {
    // If just evaluated, start new expression with previous result
    if (justEvaluated) {
      expressionTokens = [{ type: 'num', value: currentInput }];
      justEvaluated = false;
    } else if (currentInput !== '') {
      // Push current input as number token
      expressionTokens.push({ type: 'num', value: currentInput });
    } else if (expressionTokens.length > 0 && expressionTokens[expressionTokens.length - 1].type === 'op') {
      // If user presses another operator, replace the previous operator
      expressionTokens.pop();
    }

    expressionTokens.push({ type: 'op', value: op });
    currentInput = '';
    activeOperator = op;
    renderDisplay();
  }

  function handleCalculate() {
    if (expressionTokens.length === 0 && !justEvaluated) return;

    let fullTokens = [...expressionTokens];

    // If there is an active operand entered, push it to fullTokens
    if (currentInput !== '') {
      fullTokens.push({ type: 'num', value: currentInput });
    } else if (fullTokens.length > 0 && fullTokens[fullTokens.length - 1].type === 'op') {
      // If ends with an operator, pop it off
      fullTokens.pop();
    }

    if (fullTokens.length === 0) return;

    // Build the expression string for history record
    const expressionString = fullTokens
      .map(t => (t.type === 'op' ? ` ${t.value} ` : t.value))
      .join('');

    try {
      const result = evaluateExpression(fullTokens);
      const cleanResult = cleanFloat(result);

      if (isNaN(cleanResult) || !isFinite(cleanResult)) {
        displayError('Invalid calculation');
        return;
      }

      const resultString = cleanResult.toString();

      // Save to calculation history
      addHistoryRecord(expressionString, resultString);

      // Display result
      expressionDisplay.textContent = `${expressionString} =`;
      currentInput = resultString;
      expressionTokens = [];
      justEvaluated = true;
      activeOperator = null;
      primaryDisplay.textContent = formatDisplayNumber(resultString);
      updateDisplayTypography();
      highlightActiveOperator();
    } catch (err) {
      displayError(err.message || 'Error');
    }
  }

  function handleClear() {
    currentInput = '0';
    expressionTokens = [];
    justEvaluated = false;
    activeOperator = null;
    renderDisplay();
  }

  function handleBackspace() {
    if (justEvaluated) {
      // If just evaluated, backspace clears
      handleClear();
      return;
    }

    if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
      if (currentInput === '-' || currentInput === '-0') {
        currentInput = '0';
      }
    } else {
      currentInput = '0';
    }
    renderDisplay();
  }

  function handleToggleSign() {
    if (currentInput === '0' || currentInput === '') return;
    if (currentInput.startsWith('-')) {
      currentInput = currentInput.slice(1);
    } else {
      currentInput = '-' + currentInput;
    }
    renderDisplay();
  }

  function handlePercentage() {
    if (currentInput === '' || currentInput === '0') return;

    const val = parseFloat(currentInput);
    if (isNaN(val)) return;

    // Check if preceded by + or - for smart tax/discount percentage:
    // e.g., 100 + 10% => 100 + 10 (10% of 100)
    let percentVal = cleanFloat(val / 100);

    if (expressionTokens.length >= 2) {
      const lastOp = expressionTokens[expressionTokens.length - 1];
      const baseNumToken = expressionTokens[expressionTokens.length - 2];
      if (baseNumToken && baseNumToken.type === 'num' && (lastOp.value === '+' || lastOp.value === '-')) {
        const baseNum = parseFloat(baseNumToken.value);
        if (!isNaN(baseNum)) {
          percentVal = cleanFloat((baseNum * val) / 100);
        }
      }
    }

    currentInput = percentVal.toString();
    renderDisplay();
  }

  // ==========================================================================
  // 4. Calculation History Management & LocalStorage
  // ==========================================================================

  function loadHistory() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        calculationHistory = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read history from localStorage', e);
      calculationHistory = [];
    }
    renderHistoryUI();
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(calculationHistory));
    } catch (e) {
      console.warn('Could not save history to localStorage', e);
    }
  }

  function addHistoryRecord(expression, result) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const record = {
      id: Date.now() + Math.random(),
      expression,
      result,
      timestamp: timeStr
    };

    calculationHistory.unshift(record);
    if (calculationHistory.length > MAX_HISTORY_ITEMS) {
      calculationHistory.pop();
    }

    saveHistory();
    renderHistoryUI();
  }

  function clearHistory() {
    calculationHistory = [];
    saveHistory();
    renderHistoryUI();
    showToast('Calculation history cleared');
  }

  function renderHistoryUI() {
    historyList.innerHTML = '';

    // Update history badge
    if (calculationHistory.length > 0) {
      historyBadge.style.display = 'flex';
      historyBadge.textContent = calculationHistory.length;
    } else {
      historyBadge.style.display = 'none';
    }

    if (calculationHistory.length === 0) {
      historyList.innerHTML = `
        <div class="history-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <div class="history-empty-text">No calculation history yet</div>
        </div>
      `;
      return;
    }

    calculationHistory.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Recall calculation ${item.expression} = ${item.result}`);

      el.innerHTML = `
        <span class="history-item-time">${item.timestamp}</span>
        <span class="history-item-expr">${item.expression} =</span>
        <span class="history-item-res">${formatDisplayNumber(item.result)}</span>
      `;

      // Clicking recalls the result to active display
      el.addEventListener('click', () => {
        currentInput = item.result;
        expressionTokens = [];
        justEvaluated = true;
        renderDisplay();
        showToast('Recalled result to display');
      });

      // Keyboard accessibility for history items
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.click();
        }
      });

      historyList.appendChild(el);
    });
  }

  // ==========================================================================
  // 5. Theme Switcher (Dark / Light)
  // ==========================================================================

  function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, newTheme);
    } catch (e) {
      console.warn('Could not save theme preference', e);
    }
    showToast(`Switched to ${newTheme} mode`);
  }

  // ==========================================================================
  // 6. Copy to Clipboard & Toast Notifications
  // ==========================================================================

  let toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toastMessage.textContent = message;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  async function copyCurrentResult() {
    if (primaryDisplay.classList.contains('error')) return;
    const valueToCopy = currentInput;

    if (!valueToCopy) return;

    try {
      await navigator.clipboard.writeText(valueToCopy);
      showToast(`Copied ${valueToCopy} to clipboard!`);
    } catch (err) {
      // Fallback for environments where navigator.clipboard might fail
      const textArea = document.createElement('textarea');
      textArea.value = valueToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showToast(`Copied ${valueToCopy} to clipboard!`);
      } catch (e) {
        showToast('Unable to copy');
      }
      document.body.removeChild(textArea);
    }
  }

  // ==========================================================================
  // 7. Event Listeners & Keyboard Handler
  // ==========================================================================

  // Keypad click delegation
  keypad.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    const action = btn.dataset.action;
    const num = btn.dataset.num;
    const op = btn.dataset.op;

    switch (action) {
      case 'number':
        handleNumberInput(num);
        break;
      case 'decimal':
        handleDecimal();
        break;
      case 'operator':
        handleOperator(op);
        break;
      case 'calculate':
        handleCalculate();
        break;
      case 'clear':
        handleClear();
        break;
      case 'backspace':
        handleBackspace();
        break;
      case 'toggle-sign':
        handleToggleSign();
        break;
      case 'percent':
        handlePercentage();
        break;
    }
  });

  // Keyboard navigation & inputs
  window.addEventListener('keydown', (e) => {
    // If modal is open, let Escape close modal
    if (shortcutsModal.classList.contains('open')) {
      if (e.key === 'Escape') {
        shortcutsModal.classList.remove('open');
        e.preventDefault();
      }
      return;
    }

    const key = e.key;
    let buttonToAnimate = null;

    if (key >= '0' && key <= '9') {
      handleNumberInput(key);
      buttonToAnimate = document.querySelector(`.btn[data-num="${key}"]`);
    } else if (key === '.') {
      handleDecimal();
      buttonToAnimate = document.getElementById('btn-decimal');
    } else if (key === '+' || key === '-') {
      const op = key === '-' ? '-' : '+';
      handleOperator(op);
      buttonToAnimate = document.querySelector(`.btn-op[data-op="${op}"]`);
    } else if (key === '*' || key.toLowerCase() === 'x') {
      handleOperator('×');
      buttonToAnimate = document.getElementById('btn-multiply');
    } else if (key === '/') {
      e.preventDefault(); // Prevent browser search trigger
      handleOperator('÷');
      buttonToAnimate = document.getElementById('btn-divide');
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      handleCalculate();
      buttonToAnimate = document.getElementById('btn-equals');
    } else if (key === 'Backspace') {
      handleBackspace();
      buttonToAnimate = document.getElementById('btn-backspace');
    } else if (key === 'Escape') {
      handleClear();
      buttonToAnimate = document.getElementById('btn-clear');
    } else if (key === '%') {
      handlePercentage();
      buttonToAnimate = document.getElementById('btn-percent');
    } else if (key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
      copyCurrentResult();
    } else if (key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) {
      toggleHistoryDrawer();
    }

    // Trigger visual tactile animation on matched button
    if (buttonToAnimate) {
      buttonToAnimate.classList.add('keyboard-active');
      setTimeout(() => {
        buttonToAnimate.classList.remove('keyboard-active');
      }, 150);
    }
  });

  // History Panel Toggling
  function toggleHistoryDrawer() {
    appLayout.classList.toggle('history-open');
  }

  historyToggleBtn.addEventListener('click', toggleHistoryDrawer);
  closeHistoryBtn.addEventListener('click', () => {
    appLayout.classList.remove('history-open');
  });

  clearHistoryBtn.addEventListener('click', clearHistory);
  themeToggleBtn.addEventListener('click', toggleTheme);
  copyResultBtn.addEventListener('click', copyCurrentResult);

  // Keyboard Shortcuts Modal Controls
  shortcutsToggleBtn.addEventListener('click', () => {
    shortcutsModal.classList.add('open');
  });

  closeModalBtn.addEventListener('click', () => {
    shortcutsModal.classList.remove('open');
  });

  shortcutsModal.addEventListener('click', (e) => {
    if (e.target === shortcutsModal) {
      shortcutsModal.classList.remove('open');
    }
  });

  // --- Initializer ---
  function init() {
    initTheme();
    loadHistory();
    renderDisplay();
  }

  init();
})();
