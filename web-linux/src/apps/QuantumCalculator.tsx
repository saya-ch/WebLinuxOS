import { useState, useCallback, useMemo } from 'react'
import { Calculator, Delete, Percent, Divide, X, Minus, Plus, Equal, History, Pi, Square, SquareRoot, Power } from 'lucide-react'

interface CalculationHistory {
  expression: string
  result: string
  timestamp: Date
}

export default function QuantumCalculator() {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [history, setHistory] = useState<CalculationHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [mode, setMode] = useState<'basic' | 'scientific'>('basic')

  const handleNumber = useCallback((num: string) => {
    setDisplay(prev => prev === '0' ? num : prev + num)
  }, [])

  const handleOperator = useCallback((op: string) => {
    setDisplay(prev => prev + ' ' + op + ' ')
  }, [])

  const handleFunction = useCallback((fn: string) => {
    switch (fn) {
      case 'sqrt':
        setDisplay(prev => `√(${prev})`)
        break
      case 'pow':
        setDisplay(prev => prev + ' ^ ')
        break
      case 'pi':
        setDisplay(prev => prev === '0' ? 'π' : prev + 'π')
        break
      case 'percent':
        setDisplay(prev => prev + '%')
        break
      case 'square':
        setDisplay(prev => `(${prev})^2`)
        break
      case 'sin':
        setDisplay(prev => `sin(${prev})`)
        break
      case 'cos':
        setDisplay(prev => `cos(${prev})`)
        break
      case 'tan':
        setDisplay(prev => `tan(${prev})`)
        break
      case 'log':
        setDisplay(prev => `log(${prev})`)
        break
      case 'ln':
        setDisplay(prev => `ln(${prev})`)
        break
    }
  }, [])

  const calculateResult = useCallback(() => {
    try {
      let expr = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, Math.PI.toString())
        .replace(/√/g, 'Math.sqrt')
        .replace(/\^/g, '**')
        .replace(/%/g, '/100')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/log/g, 'Math.log10')
        .replace(/ln/g, 'Math.log')

      // 安全计算
      const result = Function('"use strict"; return (' + expr + ')')()
      
      const formattedResult = Number.isFinite(result) 
        ? Number.isInteger(result) 
          ? result.toString()
          : result.toFixed(8).replace(/\.?0+$/, '')
        : 'Error'

      setHistory(prev => [{
        expression: display,
        result: formattedResult,
        timestamp: new Date()
      }, ...prev.slice(0, 19)])

      setDisplay(formattedResult)
      setExpression(display + ' = ' + formattedResult)
    } catch {
      setDisplay('Error')
      setExpression('')
    }
  }, [display])

  const handleClear = useCallback(() => {
    setDisplay('0')
    setExpression('')
  }, [])

  const handleBackspace = useCallback(() => {
    setDisplay(prev => {
      const cleaned = prev.trim()
      return cleaned.length > 1 ? cleaned.slice(0, -1).trim() : '0'
    })
  }, [])

  const handleDecimal = useCallback(() => {
    setDisplay(prev => {
      const parts = prev.split(/[+\-*/]/)
      const lastPart = parts[parts.length - 1].trim()
      if (!lastPart.includes('.')) {
        return prev + '.'
      }
      return prev
    })
  }, [])

  const handleNegate = useCallback(() => {
    setDisplay(prev => {
      if (prev.startsWith('-')) {
        return prev.slice(1)
      }
      return '-' + prev
    })
  }, [])

  const loadFromHistory = useCallback((item: CalculationHistory) => {
    setDisplay(item.result)
    setShowHistory(false)
  }, [])

  const basicButtons = useMemo(() => [
    { label: 'C', action: handleClear, className: 'quantum-button-utility' },
    { label: '±', action: handleNegate, className: 'quantum-button-utility' },
    { label: '%', action: () => handleFunction('percent'), className: 'quantum-button-utility' },
    { label: '÷', action: () => handleOperator('÷'), className: 'quantum-button-operator' },
    
    { label: '7', action: () => handleNumber('7') },
    { label: '8', action: () => handleNumber('8') },
    { label: '9', action: () => handleNumber('9') },
    { label: '×', action: () => handleOperator('×'), className: 'quantum-button-operator' },
    
    { label: '4', action: () => handleNumber('4') },
    { label: '5', action: () => handleNumber('5') },
    { label: '6', action: () => handleNumber('6') },
    { label: '-', action: () => handleOperator('-'), className: 'quantum-button-operator' },
    
    { label: '1', action: () => handleNumber('1') },
    { label: '2', action: () => handleNumber('2') },
    { label: '3', action: () => handleNumber('3') },
    { label: '+', action: () => handleOperator('+'), className: 'quantum-button-operator' },
    
    { label: '0', action: () => handleNumber('0'), className: 'quantum-button-zero' },
    { label: '.', action: handleDecimal },
    { label: '=', action: calculateResult, className: 'quantum-button-equals' },
  ], [handleClear, handleNegate, handleFunction, handleOperator, handleNumber, handleDecimal, calculateResult])

  const scientificButtons = useMemo(() => [
    { label: 'sin', action: () => handleFunction('sin'), className: 'quantum-button-scientific' },
    { label: 'cos', action: () => handleFunction('cos'), className: 'quantum-button-scientific' },
    { label: 'tan', action: () => handleFunction('tan'), className: 'quantum-button-scientific' },
    { label: 'log', action: () => handleFunction('log'), className: 'quantum-button-scientific' },
    
    { label: 'ln', action: () => handleFunction('ln'), className: 'quantum-button-scientific' },
    { label: 'x²', action: () => handleFunction('square'), className: 'quantum-button-scientific' },
    { label: 'x^n', action: () => handleFunction('pow'), className: 'quantum-button-scientific' },
    { label: '√', action: () => handleFunction('sqrt'), className: 'quantum-button-scientific' },
    
    { label: 'π', action: () => handleFunction('pi'), className: 'quantum-button-scientific' },
    { label: '(', action: () => setDisplay(prev => prev + '(') },
    { label: ')', action: () => setDisplay(prev => prev + ')') },
    { label: '⌫', action: handleBackspace, className: 'quantum-button-utility' },
  ], [handleFunction, handleBackspace])

  return (
    <div className="quantum-calculator">
      <div className="quantum-calculator-header">
        <h2 className="quantum-window-title">
          <Calculator size={20} style={{ marginRight: 8 }} />
          Quantum Calculator
        </h2>
        <div className="quantum-calculator-modes">
          <button
            className={`quantum-button ${mode === 'basic' ? 'active' : ''}`}
            onClick={() => setMode('basic')}
          >
            Basic
          </button>
          <button
            className={`quantum-button ${mode === 'scientific' ? 'active' : ''}`}
            onClick={() => setMode('scientific')}
          >
            Scientific
          </button>
          <button
            className="quantum-button"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History size={16} />
          </button>
        </div>
      </div>

      <div className="quantum-calculator-display">
        <div className="quantum-calculator-expression">{expression}</div>
        <div className="quantum-calculator-value">{display}</div>
      </div>

      {showHistory && (
        <div className="quantum-calculator-history">
          <h3>Calculation History</h3>
          {history.length === 0 ? (
            <p className="quantum-history-empty">No calculations yet</p>
          ) : (
            <div className="quantum-history-list">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="quantum-history-item"
                  onClick={() => loadFromHistory(item)}
                >
                  <span className="quantum-history-expression">{item.expression}</span>
                  <span className="quantum-history-result">= {item.result}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="quantum-calculator-buttons">
        {mode === 'scientific' && (
          <div className="quantum-scientific-buttons">
            {scientificButtons.map((btn, index) => (
              <button
                key={index}
                className={`quantum-calculator-button ${btn.className || ''}`}
                onClick={btn.action}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
        
        <div className="quantum-basic-buttons">
          {basicButtons.map((btn, index) => (
            <button
              key={index}
              className={`quantum-calculator-button ${btn.className || ''}`}
              onClick={btn.action}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .quantum-calculator {
          background: var(--quantum-glass, rgba(0, 29, 61, 0.75));
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 20px;
          color: #ffffff;
          font-family: 'Rajdhani', sans-serif;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .quantum-calculator-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .quantum-calculator-modes {
          display: flex;
          gap: 8px;
        }

        .quantum-calculator-modes .quantum-button {
          padding: 6px 12px;
          font-size: 12px;
          border-radius: 6px;
          background: rgba(0, 212, 255, 0.15);
          border: 1px solid rgba(0, 212, 255, 0.35);
          color: var(--quantum-cyan);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quantum-calculator-modes .quantum-button:hover,
        .quantum-calculator-modes .quantum-button.active {
          background: rgba(0, 212, 255, 0.25);
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
        }

        .quantum-calculator-display {
          background: rgba(0, 8, 20, 0.95);
          border: 2px solid rgba(0, 212, 255, 0.35);
          border-radius: 12px;
          padding: 16px 20px;
          text-align: right;
        }

        .quantum-calculator-expression {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 8px;
          font-family: 'Exo 2', monospace;
        }

        .quantum-calculator-value {
          font-size: 36px;
          font-weight: 700;
          font-family: 'Michroma', 'Exo 2', monospace;
          color: var(--quantum-cyan);
          text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
          word-break: break-all;
        }

        .quantum-calculator-history {
          background: rgba(0, 8, 20, 0.9);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 8px;
          padding: 12px;
          max-height: 150px;
          overflow-y: auto;
        }

        .quantum-calculator-history h3 {
          font-size: 12px;
          color: var(--quantum-cyan);
          margin-bottom: 8px;
          letter-spacing: 1px;
        }

        .quantum-history-empty {
          color: rgba(255, 255, 255, 0.4);
          font-size: 12px;
          text-align: center;
          padding: 20px;
        }

        .quantum-history-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .quantum-history-item {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background: rgba(0, 29, 61, 0.5);
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .quantum-history-item:hover {
          background: rgba(0, 212, 255, 0.15);
        }

        .quantum-history-expression {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          font-family: 'Exo 2', monospace;
        }

        .quantum-history-result {
          color: var(--quantum-cyan);
          font-weight: 600;
          font-size: 12px;
        }

        .quantum-calculator-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .quantum-scientific-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .quantum-basic-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          flex: 1;
        }

        .quantum-calculator-button {
          background: linear-gradient(135deg, rgba(0, 29, 61, 0.8), rgba(0, 53, 102, 0.8));
          border: 1px solid rgba(0, 212, 255, 0.35);
          border-radius: 8px;
          color: #ffffff;
          font-family: 'Exo 2', monospace;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quantum-calculator-button:hover {
          background: rgba(0, 212, 255, 0.2);
          border-color: var(--quantum-cyan);
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.4);
          transform: translateY(-1px);
        }

        .quantum-calculator-button:active {
          transform: translateY(0);
          box-shadow: 0 0 8px rgba(0, 212, 255, 0.3);
        }

        .quantum-button-operator {
          background: linear-gradient(135deg, rgba(0, 102, 255, 0.6), rgba(0, 53, 102, 0.8));
          color: var(--quantum-cyan);
        }

        .quantum-button-equals {
          background: linear-gradient(135deg, var(--quantum-cyan), var(--quantum-blue));
          color: #ffffff;
          font-weight: 700;
        }

        .quantum-button-equals:hover {
          box-shadow: 0 0 25px rgba(0, 212, 255, 0.6);
        }

        .quantum-button-utility {
          background: rgba(0, 212, 255, 0.15);
          color: var(--quantum-cyan);
        }

        .quantum-button-scientific {
          font-size: 14px;
          padding: 12px;
        }

        .quantum-button-zero {
          grid-column: span 1;
        }
      `}</style>
    </div>
  )
}