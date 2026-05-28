import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { toggleCalculatorModal } from '../../store/salesSlice';

const CalculatorModal: React.FC = () => {
  const dispatch = useDispatch();
  const { isCalculatorModalOpen } = useSelector((state: RootState) => state.sales);

  const [currentOperand, setCurrentOperand] = useState('0');
  const [previousOperand, setPreviousOperand] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    dispatch(toggleCalculatorModal());
  }, [dispatch]);

  const clear = useCallback(() => {
    setCurrentOperand('0');
    setPreviousOperand(null);
    setOperation(null);
  }, []);

  const appendNumber = useCallback(
    (number: string) => {
      if (currentOperand === '0' && number !== '.') {
        setCurrentOperand(number);
      } else if (number === '.' && currentOperand.includes('.')) {
        return;
      } else {
        setCurrentOperand(currentOperand + number);
      }
    },
    [currentOperand]
  );

  const compute = useCallback(() => {
    let computation;
    const prev = parseFloat(previousOperand || '0');
    const current = parseFloat(currentOperand);
    if (isNaN(prev) || isNaN(current)) return;

    switch (operation) {
      case '+':
        computation = prev + current;
        break;
      case '-':
        computation = prev - current;
        break;
      case 'x':
        computation = prev * current;
        break;
      case '÷':
        computation = prev / current;
        break;
      default:
        return;
    }
    setCurrentOperand(String(computation));
    setOperation(null);
    setPreviousOperand(null);
  }, [previousOperand, currentOperand, operation]);

  const chooseOperation = useCallback(
    (op: string) => {
      if (currentOperand === '' && previousOperand === null) return;

      if (previousOperand !== null && operation) {
        compute();
      }

      setOperation(op);
      setPreviousOperand(currentOperand);
      setCurrentOperand('0');
    },
    [currentOperand, previousOperand, operation, compute]
  );

  const handleSpecialOperation = useCallback(
    (op: string) => {
      const current = parseFloat(currentOperand);
      if (isNaN(current)) return;

      switch (op) {
        case '%':
          setCurrentOperand(String(current / 100));
          break;
        case '+/-':
          setCurrentOperand(String(current * -1));
          break;
      }
    },
    [currentOperand]
  );

  useEffect(() => {
    if (!isCalculatorModalOpen) {
      clear();
    }
  }, [isCalculatorModalOpen, clear]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isCalculatorModalOpen) return;

      const { key } = event;

      if ((key >= '0' && key <= '9') || key === '.') {
        appendNumber(key);
      } else if (key === '+') {
        chooseOperation('+');
      } else if (key === '-') {
        chooseOperation('-');
      } else if (key === '*') {
        chooseOperation('x');
      } else if (key === '/') {
        chooseOperation('÷');
      } else if (key === 'Enter' || key === '=') {
        event.preventDefault(); // Prevents form submission
        compute();
      } else if (key === 'Escape') {
        handleClose();
      } else if (key.toLowerCase() === 'c' || key === 'Backspace') {
        clear();
      } else if (key === '%') {
        handleSpecialOperation('%');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCalculatorModalOpen, appendNumber, chooseOperation, compute, clear, handleClose, handleSpecialOperation]);

  const getButtonAction = (value: string) => {
    if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'].includes(value)) {
      return () => appendNumber(value);
    }
    if (['+', '-', 'x', '÷'].includes(value)) {
      return () => chooseOperation(value);
    }
    if (value === '=') {
      return compute;
    }
    if (value === 'C') {
      return clear;
    }
    if (['%', '+/-'].includes(value)) {
      return () => handleSpecialOperation(value);
    }
    return () => {};
  };

  const getButtonStyles = (value: string) => {
    const baseStyles = {
      borderRadius: '50px',
      height: '80px',
      fontSize: '2rem',
      fontWeight: 'bold',
      color: 'white',
    };
    if (['÷', 'x', '-', '+', '='].includes(value)) {
      return { ...baseStyles, backgroundColor: '#FF9B00', '&:hover': { backgroundColor: '#E68A00' } };
    }
    if (['C', '+/-', '%'].includes(value)) {
      return { ...baseStyles, backgroundColor: '#D4D4D2', color: 'black', '&:hover': { backgroundColor: '#BDBDBD' } };
    }
    return { ...baseStyles, backgroundColor: '#505050', '&:hover': { backgroundColor: '#666666' } };
  };

  return (
    <Modal open={isCalculatorModalOpen} onClose={handleClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: '#1C1C1C',
          boxShadow: 24,
          p: 2,
          borderRadius: '24px',
        }}
      >
        <Box sx={{ gridColumn: '1 / -1', textAlign: 'right', p: 2, color: 'white' }}>
          <Typography variant="h6" sx={{ opacity: 0.7 }}>
            {previousOperand} {operation}
          </Typography>
          <Typography variant="h3">{currentOperand}</Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          <Button sx={{ ...getButtonStyles('C') }} onClick={getButtonAction('C')}>
            C
          </Button>
          <Button sx={{ ...getButtonStyles('+/-') }} onClick={getButtonAction('+/-')}>
            +/-
          </Button>
          <Button sx={{ ...getButtonStyles('%') }} onClick={getButtonAction('%')}>
            %
          </Button>
          <Button sx={{ ...getButtonStyles('÷') }} onClick={getButtonAction('÷')}>
            ÷
          </Button>

          <Button sx={{ ...getButtonStyles('7') }} onClick={getButtonAction('7')}>
            7
          </Button>
          <Button sx={{ ...getButtonStyles('8') }} onClick={getButtonAction('8')}>
            8
          </Button>
          <Button sx={{ ...getButtonStyles('9') }} onClick={getButtonAction('9')}>
            9
          </Button>
          <Button sx={{ ...getButtonStyles('x') }} onClick={getButtonAction('x')}>
            x
          </Button>

          <Button sx={{ ...getButtonStyles('4') }} onClick={getButtonAction('4')}>
            4
          </Button>
          <Button sx={{ ...getButtonStyles('5') }} onClick={getButtonAction('5')}>
            5
          </Button>
          <Button sx={{ ...getButtonStyles('6') }} onClick={getButtonAction('6')}>
            6
          </Button>
          <Button sx={{ ...getButtonStyles('-') }} onClick={getButtonAction('-')}>
            -
          </Button>

          <Button sx={{ ...getButtonStyles('1') }} onClick={getButtonAction('1')}>
            1
          </Button>
          <Button sx={{ ...getButtonStyles('2') }} onClick={getButtonAction('2')}>
            2
          </Button>
          <Button sx={{ ...getButtonStyles('3') }} onClick={getButtonAction('3')}>
            3
          </Button>
          <Button sx={{ ...getButtonStyles('+') }} onClick={getButtonAction('+')}>
            +
          </Button>

          <Button sx={{ ...getButtonStyles('0'), gridColumn: 'span 2' }} onClick={getButtonAction('0')}>
            0
          </Button>
          <Button sx={{ ...getButtonStyles('.') }} onClick={getButtonAction('.')}>
            .
          </Button>
          <Button sx={{ ...getButtonStyles('=') }} onClick={getButtonAction('=')}>
            =
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default CalculatorModal;
