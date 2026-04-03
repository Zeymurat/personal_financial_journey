import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTokenValidation } from '../../hooks/useTokenValidation';
import { Calculator as CalculatorIcon } from 'lucide-react';
import CalculatorSection1 from './cards/CalculatorSection1';
import CalculatorSection2 from './cards/CalculatorSection2';
import CalculatorSection3 from './cards/CalculatorSection3';
import CalculatorSection4 from './cards/CalculatorSection4';
import CalculatorSection5 from './cards/CalculatorSection5';
import CalculatorSection6 from './cards/CalculatorSection6';
import { parseTrIntegerString } from '../../utils/trNumberInput';

/** BDDK: limit ≤ this → %20 asgari; üzeri → %40 (Türkiye kredi kartı, yaklaşık 2024 sonrası tablo). */
const CC_MIN_PAYMENT_LIMIT_THRESHOLD = 50_000;

const Calculator: React.FC = () => {
  const { t } = useTranslation('calculator');
  useTokenValidation();

  // Section 1: Bir sayının yüzdesini hesapla
  const [section1, setSection1] = useState({
    number: '',
    percentage: '',
    result: ''
  });

  // Section 2: Bir sayının, diğer sayının yüzde kaçı olduğunu hesapla
  const [section2, setSection2] = useState({
    number1: '',
    number2: '',
    result: ''
  });

  // Section 3: Değişimi yüzde olarak hesapla
  const [section3, setSection3] = useState({
    initial: '',
    final: '',
    result: ''
  });

  // Section 4: Sayıyı belirli bir yüzde olarak artırmak ya da azaltmak
  const [section4, setSection4] = useState({
    number: '',
    percentage: '',
    operation: 'increase' as 'increase' | 'decrease',
    result: ''
  });

  // Section 5: Yüzde A'sı B olan sayıyı bulmak
  const [section5, setSection5] = useState({
    percentage: '',
    value: '',
    result: ''
  });

  // Section 6: Kredi kartı asgari ödeme (TR / BDDK)
  const [section6, setSection6] = useState({
    creditLimit: '',
    statementBalance: '',
    minPayment: '',
    appliedRatePercent: ''
  });

  // Auto-calculate on input change
  React.useEffect(() => {
    const num = parseFloat(section1.number);
    const percent = parseFloat(section1.percentage);
    
    if (!isNaN(num) && !isNaN(percent)) {
      const result = (num * percent) / 100;
      setSection1(prev => ({ ...prev, result: result.toFixed(2) }));
    } else {
      setSection1(prev => ({ ...prev, result: '' }));
    }
  }, [section1.number, section1.percentage]);

  React.useEffect(() => {
    const num1 = parseFloat(section2.number1);
    const num2 = parseFloat(section2.number2);
    
    if (!isNaN(num1) && !isNaN(num2) && num2 !== 0) {
      const result = (num1 / num2) * 100;
      setSection2(prev => ({ ...prev, result: result.toFixed(2) }));
    } else {
      setSection2(prev => ({ ...prev, result: '' }));
    }
  }, [section2.number1, section2.number2]);

  React.useEffect(() => {
    const initial = parseFloat(section3.initial);
    const final = parseFloat(section3.final);
    
    if (!isNaN(initial) && !isNaN(final) && initial !== 0) {
      const result = ((final - initial) / initial) * 100;
      setSection3(prev => ({ ...prev, result: result.toFixed(2) }));
    } else {
      setSection3(prev => ({ ...prev, result: '' }));
    }
  }, [section3.initial, section3.final]);

  React.useEffect(() => {
    const num = parseFloat(section4.number);
    const percent = parseFloat(section4.percentage);
    
    if (!isNaN(num) && !isNaN(percent)) {
      let result: number;
      if (section4.operation === 'increase') {
        result = num * (1 + percent / 100);
      } else {
        result = num * (1 - percent / 100);
      }
      setSection4(prev => ({ ...prev, result: result.toFixed(2) }));
    } else {
      setSection4(prev => ({ ...prev, result: '' }));
    }
  }, [section4.number, section4.percentage, section4.operation]);

  React.useEffect(() => {
    const percent = parseFloat(section5.percentage);
    const value = parseFloat(section5.value);
    
    if (!isNaN(percent) && !isNaN(value) && percent !== 0) {
      const result = (value / percent) * 100;
      setSection5(prev => ({ ...prev, result: result.toFixed(2) }));
    } else {
      setSection5(prev => ({ ...prev, result: '' }));
    }
  }, [section5.percentage, section5.value]);

  React.useEffect(() => {
    const limit = parseTrIntegerString(section6.creditLimit);
    const balance = parseTrIntegerString(section6.statementBalance);

    if (isNaN(limit) || isNaN(balance) || limit <= 0 || balance < 0) {
      setSection6((prev) => ({ ...prev, minPayment: '', appliedRatePercent: '' }));
      return;
    }

    const ratePercent = limit <= CC_MIN_PAYMENT_LIMIT_THRESHOLD ? 20 : 40;
    const min = (balance * ratePercent) / 100;
    setSection6((prev) => ({
      ...prev,
      minPayment: min.toFixed(2),
      appliedRatePercent: String(ratePercent)
    }));
  }, [section6.creditLimit, section6.statementBalance]);

  const onSection1NumberChange = (value: string) => {
    setSection1((prev) => ({ ...prev, number: value, result: '' }));
  };

  const onSection1PercentageChange = (value: string) => {
    setSection1((prev) => ({ ...prev, percentage: value, result: '' }));
  };

  const onSection2Number1Change = (value: string) => {
    setSection2((prev) => ({ ...prev, number1: value, result: '' }));
  };

  const onSection2Number2Change = (value: string) => {
    setSection2((prev) => ({ ...prev, number2: value, result: '' }));
  };

  const onSection3InitialChange = (value: string) => {
    setSection3((prev) => ({ ...prev, initial: value, result: '' }));
  };

  const onSection3FinalChange = (value: string) => {
    setSection3((prev) => ({ ...prev, final: value, result: '' }));
  };

  const onSection4NumberChange = (value: string) => {
    setSection4((prev) => ({ ...prev, number: value, result: '' }));
  };

  const onSection4PercentageChange = (value: string) => {
    setSection4((prev) => ({ ...prev, percentage: value, result: '' }));
  };

  const onSection4OperationChange = (value: 'increase' | 'decrease') => {
    setSection4((prev) => ({ ...prev, operation: value, result: '' }));
  };

  const onSection5PercentageChange = (value: string) => {
    setSection5((prev) => ({ ...prev, percentage: value, result: '' }));
  };

  const onSection5ValueChange = (value: string) => {
    setSection5((prev) => ({ ...prev, value: value, result: '' }));
  };

  const onSection6CreditLimitChange = (value: string) => {
    setSection6((prev) => ({ ...prev, creditLimit: value, minPayment: '', appliedRatePercent: '' }));
  };

  const onSection6StatementBalanceChange = (value: string) => {
    setSection6((prev) => ({ ...prev, statementBalance: value, minPayment: '', appliedRatePercent: '' }));
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
            <CalculatorIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t('meta.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-lg">{t('meta.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalculatorSection1
          number={section1.number}
          percentage={section1.percentage}
          result={section1.result}
          onNumberChange={onSection1NumberChange}
          onPercentageChange={onSection1PercentageChange}
        />

        <CalculatorSection2
          number1={section2.number1}
          number2={section2.number2}
          result={section2.result}
          onNumber1Change={onSection2Number1Change}
          onNumber2Change={onSection2Number2Change}
        />

        <CalculatorSection3
          initial={section3.initial}
          final={section3.final}
          result={section3.result}
          onInitialChange={onSection3InitialChange}
          onFinalChange={onSection3FinalChange}
        />

        <CalculatorSection4
          number={section4.number}
          percentage={section4.percentage}
          operation={section4.operation}
          result={section4.result}
          onNumberChange={onSection4NumberChange}
          onPercentageChange={onSection4PercentageChange}
          onOperationChange={onSection4OperationChange}
        />

        <CalculatorSection5
          percentage={section5.percentage}
          value={section5.value}
          result={section5.result}
          onPercentageChange={onSection5PercentageChange}
          onValueChange={onSection5ValueChange}
        />

        <CalculatorSection6
          creditLimit={section6.creditLimit}
          statementBalance={section6.statementBalance}
          minPayment={section6.minPayment}
          appliedRatePercent={section6.appliedRatePercent}
          onCreditLimitChange={onSection6CreditLimitChange}
          onStatementBalanceChange={onSection6StatementBalanceChange}
        />
      </div>
    </div>
  );
};

export default Calculator;

