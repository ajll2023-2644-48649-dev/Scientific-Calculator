import { useEffect, useMemo, useState } from "react";
import { evaluate, round } from "mathjs";
import "./App.css";

const BASIC_BUTTONS = [
  ["C", "⌫", "(", ")"],
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "−"],
  ["0", ".", "+/−", "+"],
  ["π", "e", "ANS", "="],
];

const SCI_BUTTONS = [
  ["sin", "cos", "tan", "^"],
  ["ln", "log", "√", "%"],
];

const BUTTON_VARIANTS = {
  control: ["C", "⌫", "="],
  operator: ["+", "−", "×", "÷", "^", "%"],
  function: ["sin", "cos", "tan", "ln", "log", "√"],
  special: ["π", "e", "ANS", "+/−"],
};

const normalizeExpression = (expr) =>
  expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt")
    .replace(/ANS/g, "ans")
    .replace(/log\(/g, "log10(");

const formatResult = (value) => {
  if (typeof value === "number" && !Number.isInteger(value)) {
    return round(value, 12).toString();
  }
  return value?.toString() ?? "";
};

export default function Calculator() {
  const [expression, setExpression] = useState("");
  const [ans, setAns] = useState(0);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("scientific");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const display = useMemo(() => {
    if (error) return error;
    return expression || "0";
  }, [expression, error]);

  const addToHistory = (expr, result) => {
    setHistory((prev) => [{ expr, result }, ...prev].slice(0, 20));
  };

  const insert = (value) => {
    setError("");

    if (value === "+/−") {
      if (!expression) return;

      const match = expression.match(/(-?\d+(?:\.\d+)?)$/);
      if (!match) {
        setExpression((prev) => (prev.startsWith("-") ? prev.slice(1) : `-${prev}`));
        return;
      }
      const num = match[0];
      const start = expression.slice(0, -num.length);
      setExpression(start + (num.startsWith("-") ? num.slice(1) : `-${num}`));
      return;
    }

    if (BUTTON_VARIANTS.operator.includes(value) && expression) {
      setExpression((prev) =>
        /[+\-×÷^%]$/.test(prev) ? prev.slice(0, -1) + value : prev + value
      );
      return;
    }

    setExpression((prev) => prev + value);
  };

  const clear = () => {
    setExpression("");
    setError("");
  };

  const backspace = () => {
    setError("");
    setExpression((prev) => prev.slice(0, -1));
  };

  const evaluateExpression = () => {
    if (!expression) return;
    try {
      const normalized = normalizeExpression(expression);
      const scope = { ans };
      const result = evaluate(normalized, scope);
      const formatted = formatResult(result);
      setAns(typeof result === "number" ? result : parseFloat(result) || 0);
      setExpression(formatted);
      setError("");
      addToHistory(expression, formatted);
    } catch (e) {
      setError("Error");
    }
  };

  const handleButtonClick = (value) => {
    switch (value) {
      case "C":
        return clear();
      case "⌫":
        return backspace();
      case "=":
        return evaluateExpression();
      default:
        return insert(value);
    }
  };

  const handleKeyDown = (event) => {
    if (event.defaultPrevented) return;

    const key = event.key;

    if (/^[0-9]$/.test(key)) {
      insert(key);
      event.preventDefault();
      return;
    }

    if (key === ".") {
      insert(key);
      event.preventDefault();
      return;
    }

    const operatorMap = {
      "+": "+",
      "-": "−",
      "*": "×",
      "/": "÷",
      "^": "^",
      "%": "%",
    };

    if (operatorMap[key]) {
      insert(operatorMap[key]);
      event.preventDefault();
      return;
    }

    if (key === "Enter" || key === "=") {
      evaluateExpression();
      event.preventDefault();
      return;
    }

    if (key === "Backspace") {
      backspace();
      event.preventDefault();
      return;
    }

    if (key === "Escape") {
      clear();
      event.preventDefault();
      return;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const buttons = mode === "basic" ? BASIC_BUTTONS : [...BASIC_BUTTONS, ...SCI_BUTTONS];

  return (
    <div className="calculator">
      <div className="calculator-header">
        <div className="calculator-mode">
          <button
            type="button"
            className={`toggle ${mode === "basic" ? "active" : ""}`}
            onClick={() => setMode("basic")}
          >
            Basic
          </button>
          <button
            type="button"
            className={`toggle ${mode === "scientific" ? "active" : ""}`}
            onClick={() => setMode("scientific")}
          >
            Scientific
          </button>
        </div>
        <div className="calculator-history-toggle">
          <button
            type="button"
            className="history-toggle"
            onClick={() => setShowHistory((prev) => !prev)}
          >
            {showHistory ? "Hide History" : "Show History"}
          </button>
        </div>
      </div>

      <div className="calculator-screen" data-testid="display">
        {display}
      </div>

      <div className="calculator-grid">
        {buttons.flat().map((value) => {
          const variant = Object.entries(BUTTON_VARIANTS).find(([_, items]) =>
            items.includes(value)
          )?.[0];

          return (
            <button
              key={value}
              className={`calculator-key ${variant ?? "number"}`}
              type="button"
              onClick={() => handleButtonClick(value)}
            >
              {value}
            </button>
          );
        })}
      </div>

      {showHistory && (
        <div className="calculator-history">
          <div className="history-header">
            <span>History</span>
            <button
              type="button"
              className="history-clear"
              onClick={() => setHistory([])}
            >
              Clear
            </button>
          </div>
          {history.length === 0 ? (
            <div className="history-empty">No history yet.</div>
          ) : (
            <ol className="history-list">
              {history.map((entry, idx) => (
                <li key={`${entry.expr}-${idx}`}>
                  <button
                    type="button"
                    className="history-item"
                    onClick={() => setExpression(entry.expr)}
                  >
                    <span className="history-expr">{entry.expr}</span>
                    <span className="history-result">{entry.result}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="calculator-credit">Scientific Calculator • orange + blue theme</div>
    </div>
  );
}
