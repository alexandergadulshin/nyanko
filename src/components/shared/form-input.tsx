import React, { forwardRef } from "react";
import { cn } from "~/lib/utils";

export interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  touched?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    variant = 'default', 
    size = 'md',
    leftIcon,
    rightIcon,
    touched,
    className,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = touched && error;

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2',
      lg: 'px-4 py-3 text-lg'
    };

    const variantClasses = {
      default: 'bg-white/10 light:bg-white border border-gray-600 light:border-gray-300',
      filled: 'bg-gray-100 light:bg-gray-50 border border-transparent',
      outlined: 'bg-transparent border border-gray-600 light:border-gray-300'
    };

    const baseInputClasses = cn(
      "w-full rounded-md text-white light:text-gray-900 placeholder-gray-400 light:placeholder-gray-500",
      "focus:outline-none focus:ring-2 focus:border-transparent backdrop-blur-sm transition-all duration-200",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      sizeClasses[size],
      variantClasses[variant],
      hasError
        ? "border-red-500 light:border-red-500 focus:ring-red-500"
        : "focus:ring-purple-500 light:focus:ring-blue-500 focus:border-purple-500 light:focus:border-blue-500 hover:border-purple-400 light:hover:border-gray-400",
      leftIcon && "pl-10",
      rightIcon && "pr-10",
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-gray-400 light:text-gray-500">
                {leftIcon}
              </div>
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={baseInputClasses}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="text-gray-400 light:text-gray-500">
                {rightIcon}
              </div>
            </div>
          )}
        </div>

        {(hasError || helperText) && (
          <div className="mt-1 text-sm">
            {hasError ? (
              <span className="text-red-500 light:text-red-600">{error}</span>
            ) : helperText ? (
              <span className="text-gray-400 light:text-gray-600">{helperText}</span>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  touched?: boolean;
  resize?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ 
    label, 
    error, 
    helperText, 
    variant = 'default', 
    size = 'md',
    touched,
    resize = true,
    className,
    id,
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = touched && error;

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2',
      lg: 'px-4 py-3 text-lg'
    };

    const variantClasses = {
      default: 'bg-white/10 light:bg-white border border-gray-600 light:border-gray-300',
      filled: 'bg-gray-100 light:bg-gray-50 border border-transparent',
      outlined: 'bg-transparent border border-gray-600 light:border-gray-300'
    };

    const baseTextareaClasses = cn(
      "w-full rounded-md text-white light:text-gray-900 placeholder-gray-400 light:placeholder-gray-500",
      "focus:outline-none focus:ring-2 focus:border-transparent backdrop-blur-sm transition-all duration-200",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      sizeClasses[size],
      variantClasses[variant],
      hasError
        ? "border-red-500 light:border-red-500 focus:ring-red-500"
        : "focus:ring-purple-500 light:focus:ring-blue-500 focus:border-purple-500 light:focus:border-blue-500 hover:border-purple-400 light:hover:border-gray-400",
      !resize && "resize-none",
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={textareaId} 
            className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={baseTextareaClasses}
          {...props}
        />

        {(hasError || helperText) && (
          <div className="mt-1 text-sm">
            {hasError ? (
              <span className="text-red-500 light:text-red-600">{error}</span>
            ) : helperText ? (
              <span className="text-gray-400 light:text-gray-600">{helperText}</span>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

export interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  touched?: boolean;
  children: React.ReactNode;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ 
    label, 
    error, 
    helperText, 
    variant = 'default', 
    size = 'md',
    touched,
    className,
    id,
    children,
    ...props 
  }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = touched && error;

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2',
      lg: 'px-4 py-3 text-lg'
    };

    const variantClasses = {
      default: 'bg-white/10 light:bg-white border border-gray-600 light:border-gray-300',
      filled: 'bg-gray-100 light:bg-gray-50 border border-transparent',
      outlined: 'bg-transparent border border-gray-600 light:border-gray-300'
    };

    const baseSelectClasses = cn(
      "w-full rounded-md text-white light:text-gray-900 appearance-none cursor-pointer",
      "focus:outline-none focus:ring-2 focus:border-transparent backdrop-blur-sm transition-all duration-200",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      sizeClasses[size],
      variantClasses[variant],
      hasError
        ? "border-red-500 light:border-red-500 focus:ring-red-500"
        : "focus:ring-purple-500 light:focus:ring-blue-500 focus:border-purple-500 light:focus:border-blue-500 hover:border-purple-400 light:hover:border-gray-400",
      "pr-10", // Space for dropdown arrow
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={selectId} 
            className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={baseSelectClasses}
            {...props}
          >
            {children}
          </select>
          
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {(hasError || helperText) && (
          <div className="mt-1 text-sm">
            {hasError ? (
              <span className="text-red-500 light:text-red-600">{error}</span>
            ) : helperText ? (
              <span className="text-gray-400 light:text-gray-600">{helperText}</span>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';