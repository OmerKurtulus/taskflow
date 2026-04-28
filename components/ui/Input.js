'use client';

import { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(function Input(
  { label, error, textarea = false, className = '', id, ...props },
  ref
) {
  const Component = textarea ? 'textarea' : 'input';
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={styles.inputGroup}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputWrapper}>
        <Component
          ref={ref}
          id={inputId}
          className={`${styles.input} ${textarea ? styles.textarea : ''} ${
            error ? styles.error : ''
          } ${className}`}
          {...props}
        />
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
});

export default Input;
