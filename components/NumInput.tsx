'use client';

import { useEffect, useState } from 'react';
import { numTxt, parseNum } from '@/lib/format';

type Props = {
  value: number | null;
  onCommit: (n: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
};

/** Campo numérico que aceita vírgula e só salva ao sair do campo. */
export default function NumInput({ value, onCommit, placeholder, disabled }: Props) {
  const [txt, setTxt] = useState(numTxt(value));

  useEffect(() => {
    setTxt(numTxt(value));
  }, [value]);

  return (
    <input
      inputMode="decimal"
      value={txt}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => setTxt(e.target.value)}
      onBlur={() => {
        const n = parseNum(txt);
        if (n !== value) onCommit(n);
        else setTxt(numTxt(value));
      }}
    />
  );
}
