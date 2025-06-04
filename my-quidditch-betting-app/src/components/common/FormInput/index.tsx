import React, { InputHTMLAttributes, ReactNode } from 'react';
import styles from './FormInput.module.css';
import clsx from 'clsx';

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  variant?: 'default' | 'magical';
  required?: boolean;
}

const FormInput = ({
  label,
  error,
  iconLeft,
  iconRight,
  variant = 'default',
  required,
  ...props
}: FormInputProps) => {
  return (
    <div className={styles.formGroup}>
      {label && (
        <label htmlFor={props.id} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {iconLeft && <div className={styles.iconLeft}>{iconLeft}</div>}
        <input
          className={clsx(
            styles.input,
            iconLeft && styles.withIconLeft,
            iconRight && styles.withIconRight,
            error && styles.error,
            variant === 'magical' && styles.magical
          )}
          {...props}
        />
        {iconRight && <div className={styles.iconRight}>{iconRight}</div>}
      </div>
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};

export default FormInput;
